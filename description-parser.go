package main

import (
	"context"
	"easy-apply/constants" // Assuming this package and constant are still relevant
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/getsentry/sentry-go" // Added Sentry
	"github.com/joho/godotenv"
	"github.com/openai/openai-go" // Assuming this is the user's intended library (e.g., sashabaranov/go-openai aliased or a specific fork)
	"github.com/openai/openai-go/option"
)

const (
	maxRetries        = 3
	initialRetryDelay = 1 * time.Second
	maxRetryDelay     = 10 * time.Second
	llmApiTimeout     = 200 * time.Second // Renamed from openRouterTimeout
	ocrSpaceTimeout   = 200 * time.Second
)

func init() {
	// Load environment variables once at startup
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found or error loading .env file: %v", err)
	}
}

// JobDescription struct remains the same
type JobDescription struct {
	JobTitle               string      `json:"jobTitle"`
	Organization           string      `json:"organization"`
	Location               string      `json:"location"`
	Grade                  interface{} `json:"grade"` // could be string or N/A
	ReportingTo            string      `json:"reportingTo"`
	ResponsibleFor         interface{} `json:"responsibleFor,omitempty"` // could be string or []string
	Department             string      `json:"department"`
	Purpose                string      `json:"purpose"`
	KeyResponsibilities    []string    `json:"keyResponsibilities"`
	RequiredQualifications []string    `json:"requiredQualifications"`
	RequiredExperience     interface{} `json:"requiredExperience"`  // could be string, []string, or object
	RequiredMemberships    interface{} `json:"requiredMemberships"` // could be string, []string, or N/A
	ApplicationDeadline    string      `json:"applicationDeadline"`
	ContactDetails         interface{} `json:"contactDetails"` // could be string or object
	AdditionalNotes        string      `json:"additionalNotes"`
	Tags                   []string    `json:"tags"`
	Industry               string      `json:"industry"`
	Domain                 string      `json:"domain"`
}

// ParseJobDescription processes the job description string using OpenAI.
// The provided ctx is used for controlling API call timeouts and cancellation.
func ParseJobDescription(ctx context.Context, description string) (*JobDescription, error) {
	log.Println("Starting job description processing")
	defer sentry.Flush(2 * time.Second) // Flush Sentry events before function exits

	var desc = description

	// Handle special cases
	if desc == "" || desc == "No description found" || desc == "N/A" {
		log.Println("Empty or placeholder description found, skipping processing")
		// Return a default N/A JobDescription
		return &JobDescription{
			JobTitle:               "N/A",
			Organization:           "N/A",
			Location:               "N/A",
			Grade:                  "N/A",
			ReportingTo:            "N/A",
			ResponsibleFor:         "N/A",
			Department:             "N/A",
			Purpose:                "N/A",
			KeyResponsibilities:    []string{},
			RequiredQualifications: []string{},
			RequiredExperience:     "N/A",
			RequiredMemberships:    "N/A",
			ApplicationDeadline:    "N/A",
			ContactDetails:         "N/A",
			AdditionalNotes:        "N/A",
			Tags:                   []string{},
			Industry:               "N/A",
			Domain:                 "N/A",
		}, nil
	}

	// Check for URL pattern (potential image for OCR)
	linkRegex := regexp.MustCompile(`^https?://`)
	if linkRegex.MatchString(desc) {
		log.Printf("Detected potential image URL: %s", desc)
		descOCR, err := processImageFromURLWithRetry(desc) // This function now also uses Sentry
		if err != nil {
			// Sentry capture is handled within processImageFromURLWithRetry or its callees
			log.Printf("OCR processing failed after retries: %v, using LINK_FOUND as placeholder", err)
			desc = "LINK_FOUND" // Placeholder if OCR fails
		} else {
			log.Printf("OCR extracted text length: %d characters", len(descOCR))
			desc = descOCR
		}
	}

	// Validate OpenAI API key
	apiKey := os.Getenv("OPENAI_API_KEY") // Changed from OPENROUTER_API_KEY
	if apiKey == "" {
		err := fmt.Errorf("OPENAI_API_KEY environment variable not set")
		sentry.CaptureException(err)
		log.Println(err.Error())
		return nil, err
	}

	// Initialize OpenAI client
	log.Println("Initializing OpenAI client")
	client := openai.NewClient(
		option.WithAPIKey(apiKey),
		option.WithRequestTimeout(llmApiTimeout), // Timeout for the underlying HTTP client
	)

	// Prepare messages for OpenAI API
	// Ensure constants.OpenRouterInstrunctions is suitable for gpt-4.1-nano
	messages := []openai.ChatCompletionMessageParamUnion{
		{
			OfSystem: &openai.ChatCompletionSystemMessageParam{
				Content: openai.ChatCompletionSystemMessageParamContentUnion{
					OfString: openai.String(constants.OpenRouterInstrunctions),
				},
			},
		},
		{
			OfUser: &openai.ChatCompletionUserMessageParam{
				Content: openai.ChatCompletionUserMessageParamContentUnion{
					OfString: openai.String(desc),
				},
			},
		},
	}

	// API parameters
	modelName := "gpt-4.1-nano" // Changed model name
	params := openai.ChatCompletionNewParams{
		Model:       modelName,
		Messages:    messages,
		Temperature: openai.Float(0.7),
		TopP:        openai.Float(1),
		MaxTokens:   openai.Int(4600), // Ensure this is within model limits
	}

	var responseContent string
	// Execute API call with retry logic
	// The `ctx` argument from ParseJobDescription is used as the parent for the API call context.
	err := withRetry(maxRetries, initialRetryDelay, maxRetryDelay, func() error {
		// Create a new context for this specific API attempt, derived from the incoming ctx
		apiCallCtx, apiCallCancel := context.WithTimeout(ctx, llmApiTimeout)
		defer apiCallCancel()

		log.Printf("Sending request to OpenAI API (model: %s)", modelName)
		completion, err := client.Chat.Completions.New(apiCallCtx, params) // Use the derived apiCallCtx
		if err != nil {
			// Don't capture to Sentry here, as withRetry might retry.
			// Sentry capture will happen if all retries fail.
			log.Printf("OpenAI API error (attempt): %v", err)
			return fmt.Errorf("OpenAI API error: %w", err) // Wrap error for retry logic
		}

		log.Printf("Received OpenAI response with %d choices", len(completion.Choices))
		if len(completion.Choices) == 0 || completion.Choices[0].Message.Content == "" {
			log.Println("No completion choices available or content is empty")
			return fmt.Errorf("no choices returned or content is empty") // Error for retry
		}

		responseContent = completion.Choices[0].Message.Content
		return nil
	})

	if err != nil {
		finalErr := fmt.Errorf("failed to get response from OpenAI API after %d retries: %w", maxRetries, err)
		// Capture the final error to Sentry after all retries have failed.
		// You can add more context to Sentry if needed:
		// sentry.WithScope(func(scope *sentry.Scope) {
		//    scope.SetTag("model_name", modelName)
		//    scope.SetExtra("description_length", len(desc))
		//    sentry.CaptureException(finalErr)
		// })
		sentry.CaptureException(finalErr)
		log.Println(finalErr.Error())
		return nil, finalErr
	}

	log.Printf("Processing complete. OpenAI Response length: %d characters", len(responseContent))

	// Preprocess and unmarshal the response
	processedData, err := PreprocessJobDescription([]byte(responseContent))
	if err != nil {
		procErr := fmt.Errorf("failed to preprocess job description: %w", err)
		sentry.CaptureException(procErr)
		log.Printf("Error preprocessing job description: %v", procErr)
		return nil, procErr
	}

	var jobDesc JobDescription
	if err := json.Unmarshal(processedData, &jobDesc); err != nil {
		unmarshalErr := fmt.Errorf("failed to parse structured job description from OpenAI response: %w", err)
		sentry.CaptureException(unmarshalErr)
		log.Printf("Error unmarshalling responseContent: %v", unmarshalErr)
		return nil, unmarshalErr
	}

	return &jobDesc, nil
}

// PreprocessJobDescription remains largely the same.
// It normalizes certain fields in the JSON data before final unmarshalling.
func PreprocessJobDescription(jsonData []byte) ([]byte, error) {
	var rawData map[string]interface{}
	if err := json.Unmarshal(jsonData, &rawData); err != nil {
		// This error will be caught by the caller (ParseJobDescription) and sent to Sentry.
		return nil, fmt.Errorf("invalid JSON format for preprocessing: %w", err)
	}

	// Normalize ResponsibleFor field
	normalizeStringArrayField(rawData, "responsibleFor", false)

	// Normalize RequiredMemberships field
	normalizeStringArrayField(rawData, "requiredMemberships", true) // Handle "N/A" or empty as empty slice

	// Potentially normalize other fields if necessary, e.g., RequiredExperience
	// if requiredExperience, exists := rawData["requiredExperience"]; exists {
	//    // Add normalization logic if it often comes in non-standard formats
	// }

	return json.Marshal(rawData)
}

// Helper function to normalize fields that should be string arrays
func normalizeStringArrayField(rawData map[string]interface{}, fieldName string, treatNAAsEmpty bool) {
	if val, exists := rawData[fieldName]; exists {
		switch v := val.(type) {
		case string:
			if treatNAAsEmpty && (v == "N/A" || v == "") {
				rawData[fieldName] = []string{}
			} else {
				rawData[fieldName] = []string{v}
			}
		case []interface{}:
			strArr := make([]string, 0, len(v))
			for _, item := range v {
				if str, ok := item.(string); ok {
					if treatNAAsEmpty && (str == "N/A" || str == "") {
						// Skip if it's N/A and should be treated as empty part of a list
						continue
					}
					strArr = append(strArr, str)
				} else {
					// Convert non-string items to string representation
					strArr = append(strArr, fmt.Sprintf("%v", item))
				}
			}
			rawData[fieldName] = strArr
		case nil:
			rawData[fieldName] = []string{} // Treat nil as empty array
			// default: // If it's already []string, it's fine. Or handle other unexpected types.
			//  log.Printf("Unexpected type for field %s: %T", fieldName, v)
		}
	} else {
		// If field doesn't exist, initialize as empty string array
		rawData[fieldName] = []string{}
	}
}

// GetResponsibleForAsStrings and other getter methods remain the same.
// These are helpers for accessing fields that might have multiple types.
func (jd *JobDescription) GetResponsibleForAsStrings() []string {
	return getStringSliceField(jd.ResponsibleFor, false)
}

func (jd *JobDescription) GetRequiredMembershipsAsStrings() []string {
	return getStringSliceField(jd.RequiredMemberships, true) // "N/A" or "" becomes empty slice
}

func getStringSliceField(fieldValue interface{}, treatNAAsEmpty bool) []string {
	switch v := fieldValue.(type) {
	case []string:
		if treatNAAsEmpty {
			var result []string
			for _, s := range v {
				if s != "N/A" && s != "" {
					result = append(result, s)
				}
			}
			return result
		}
		return v
	case []interface{}:
		result := make([]string, 0, len(v))
		for _, item := range v {
			itemStr := fmt.Sprintf("%v", item)
			if treatNAAsEmpty && (itemStr == "N/A" || itemStr == "") {
				continue
			}
			result = append(result, itemStr)
		}
		return result
	case string:
		if treatNAAsEmpty && (v == "N/A" || v == "") {
			return []string{}
		}
		return []string{v}
	case nil:
		return []string{}
	default:
		return []string{}
	}
}

func (jd *JobDescription) GetRequiredExperienceAsStrings() []string {
	switch v := jd.RequiredExperience.(type) {
	case []string:
		return v
	case []interface{}:
		result := make([]string, len(v))
		for i, item := range v {
			result[i] = fmt.Sprintf("%v", item)
		}
		return result
	case string:
		if v == "N/A" || v == "" {
			return []string{}
		}
		return []string{v}
	case map[string]interface{}:
		var result []string
		if minYears, ok := v["minimumYears"]; ok { // Check type of minYears more robustly
			if yearsFloat, okFloat := minYears.(float64); okFloat {
				result = append(result, fmt.Sprintf("Minimum %.0f years experience", yearsFloat))
			} else if yearsStr, okStr := minYears.(string); okStr {
				result = append(result, fmt.Sprintf("Minimum %s years experience", yearsStr))
			} else {
				result = append(result, fmt.Sprintf("Minimum years: %v", minYears))
			}
		}
		if expType, ok := v["type"].(string); ok && expType != "" {
			result = append(result, expType)
		}
		if addExp, ok := v["additionalExperience"].(string); ok && addExp != "" {
			result = append(result, addExp)
		}
		return result
	case nil:
		return []string{}
	default:
		// If it's an unhandled type, try to stringify it, or return empty.
		// log.Printf("Unhandled type for RequiredExperience: %T", v)
		return []string{fmt.Sprintf("%v", v)} // Fallback, might not be ideal
	}
}

func (jd *JobDescription) GetContactDetailsAsString() string {
	switch v := jd.ContactDetails.(type) {
	case string:
		return v
	case map[string]interface{}:
		details := []string{}
		for key, val := range v {
			details = append(details, fmt.Sprintf("%s: %v", key, val))
		}
		return strings.Join(details, ", ")
	case nil:
		return ""
	default:
		return fmt.Sprintf("%v", v) // Fallback
	}
}

// processImageFromURLWithRetry calls processImageFromURL with retry logic.
// Sentry reporting for the final error is handled here.
func processImageFromURLWithRetry(imageURL string) (string, error) {
	var resultText string
	err := withRetry(maxRetries, initialRetryDelay, maxRetryDelay, func() error {
		text, err := processImageFromURL(imageURL) // Sentry capture for individual attempts is in processImageFromURL
		if err == nil {
			resultText = text
		}
		return err // Return error for retry logic
	})

	if err != nil {
		finalErr := fmt.Errorf("OCR processing failed for URL %s after %d attempts: %w", imageURL, maxRetries, err)
		// Capture the final error to Sentry after all retries.
		sentry.WithScope(func(scope *sentry.Scope) {
			scope.SetTag("ocr_image_url", imageURL)
			sentry.CaptureException(finalErr)
		})
		log.Println(finalErr.Error())
		return "", finalErr
	}
	return resultText, nil
}

// processImageFromURL performs OCR on an image URL.
// Errors here are potential candidates for Sentry reporting if they are not transient.
func processImageFromURL(imageURL string) (string, error) {
	log.Printf("Processing image URL with OCR: %s", imageURL)

	apiKey := os.Getenv("OCRSPACE_API_KEY")
	if apiKey == "" {
		err := fmt.Errorf("OCRSPACE_API_KEY environment variable not set")
		sentry.CaptureException(err)
		log.Println(err.Error())
		return "", err
	}

	ocrAPIURL := "https://api.ocr.space/parse/image"
	form := url.Values{}
	form.Add("apikey", apiKey)
	form.Add("url", imageURL)
	form.Add("language", "eng")
	form.Add("isOverlayRequired", "false")

	log.Println("Creating OCR API request")
	req, err := http.NewRequest("POST", ocrAPIURL, strings.NewReader(form.Encode()))
	if err != nil {
		// This is an internal error creating the request.
		reqErr := fmt.Errorf("error creating OCR request for %s: %w", imageURL, err)
		// sentry.CaptureException(reqErr) // Consider if this should be captured immediately or returned for retry
		log.Println(reqErr.Error())
		return "", reqErr
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: ocrSpaceTimeout}
	log.Println("Sending OCR API request")
	resp, err := client.Do(req)
	if err != nil {
		// Network or transport error.
		sendErr := fmt.Errorf("error sending request to OCR service for %s: %w", imageURL, err)
		log.Println(sendErr.Error())
		return "", sendErr // Return for retry
	}
	defer resp.Body.Close()

	log.Printf("Received OCR response status: %s for URL: %s", resp.Status, imageURL)
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		statusErr := fmt.Errorf("OCR service returned error (status %d) for %s: %s", resp.StatusCode, imageURL, string(bodyBytes))
		log.Println(statusErr.Error())
		// Non-200s might be retriable depending on the status code.
		return "", statusErr // Return for retry
	}

	var result struct {
		ParsedResults []struct {
			ParsedText string `json:"ParsedText"`
		} `json:"ParsedResults"`
		IsErroredOnProcessing bool   `json:"IsErroredOnProcessing"`
		ErrorMessage          string `json:"ErrorMessage,omitempty"` // Corrected to string
		ErrorDetails          string `json:"ErrorDetails,omitempty"` // Added for more info
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		decodeErr := fmt.Errorf("error parsing OCR service response for %s: %w", imageURL, err)
		log.Println(decodeErr.Error())
		return "", decodeErr // Return for retry
	}

	if result.IsErroredOnProcessing {
		ocrProcErr := fmt.Errorf("OCR service processing error for %s: %s. Details: %s", imageURL, result.ErrorMessage, result.ErrorDetails)
		log.Println(ocrProcErr.Error())
		return "", ocrProcErr // Return for retry
	}

	if len(result.ParsedResults) > 0 && result.ParsedResults[0].ParsedText != "" {
		parsedText := result.ParsedResults[0].ParsedText
		log.Printf("Successfully parsed text from OCR (length: %d characters) for URL: %s", len(parsedText), imageURL)
		return parsedText, nil
	}

	noTextErr := fmt.Errorf("no text found in the image or empty parsed text from OCR for URL: %s", imageURL)
	log.Println(noTextErr.Error())
	return "", noTextErr // Return for retry
}

// withRetry implements exponential backoff retry logic.
// Errors from `fn` are logged here during retries. The final error is returned.
func withRetry(maxAttempts int, initialDelay, maxDelay time.Duration, fn func() error) error {
	var err error
	delay := initialDelay

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		err = fn()
		if err == nil {
			return nil // Success
		}

		log.Printf("Attempt %d/%d failed: %v", attempt, maxAttempts, err)
		if attempt < maxAttempts {
			log.Printf("Retrying in %v...", delay)
			time.Sleep(delay)
			delay *= 2 // Exponential backoff
			if delay > maxDelay {
				delay = maxDelay // Cap delay
			}
		}
	}
	// All attempts failed
	return fmt.Errorf("function failed after %d attempts: %w", maxAttempts, err)
}

// min helper for time.Duration (already present and correct)
func min(a, b time.Duration) time.Duration {
	if a < b {
		return a
	}
	return b
}
