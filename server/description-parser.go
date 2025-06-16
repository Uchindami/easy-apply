package main

import (
	"context"
	"easy-apply/constants"
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

	"github.com/getsentry/sentry-go"
	"github.com/google/generative-ai-go/genai"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

const (
	maxRetries        = 3
	maxJSONRetries    = 3 // New constant for JSON validation retries
	initialRetryDelay = 1 * time.Second
	maxRetryDelay     = 10 * time.Second
	llmApiTimeout     = 200 * time.Second
	ocrSpaceTimeout   = 200 * time.Second
)

// GeminiClient wraps the Gemini client and model for reuse
type GeminiClient struct {
	client *genai.Client
	model  *genai.GenerativeModel
}

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
	Grade                  interface{} `json:"grade"`
	ReportingTo            string      `json:"reportingTo"`
	ResponsibleFor         interface{} `json:"responsibleFor,omitempty"`
	Department             string      `json:"department"`
	Purpose                string      `json:"purpose"`
	KeyResponsibilities    []string    `json:"keyResponsibilities"`
	RequiredQualifications []string    `json:"requiredQualifications"`
	RequiredExperience     interface{} `json:"requiredExperience"`
	RequiredMemberships    interface{} `json:"requiredMemberships"`
	ApplicationDeadline    string      `json:"applicationDeadline"`
	ContactDetails         interface{} `json:"contactDetails"`
	AdditionalNotes        string      `json:"additionalNotes"`
	Tags                   []string    `json:"tags"`
	Industry               string      `json:"industry"`
	Domain                 string      `json:"domain"`
}

// InitializeGeminiClient creates and configures a Gemini client for reuse
func InitializeGeminiClient(ctx context.Context) (*GeminiClient, error) {
	// Validate Gemini API key
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		err := fmt.Errorf("GEMINI_API_KEY environment variable not set")
		sentry.CaptureException(err)
		log.Println(err.Error())
		return nil, err
	}

	// Initialize Gemini client
	log.Println("Initializing Gemini client")
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		sentry.CaptureException(err)
		log.Printf("Failed to create Gemini client: %v", err)
		return nil, err
	}

	modelName := constants.GeminiModelName
	model := client.GenerativeModel(modelName)

	// Set the system instruction for the model
	model.SystemInstruction = &genai.Content{
		Parts: []genai.Part{genai.Text(constants.OpenRouterInstrunctions)},
	}

	// Configure generation parameters
	model.GenerationConfig = genai.GenerationConfig{
		Temperature:      genai.Ptr(float32(0.7)),
		MaxOutputTokens:  genai.Ptr(int32(4096)),
		ResponseMIMEType: "application/json",
	}

	return &GeminiClient{
		client: client,
		model:  model,
	}, nil
}

// Close closes the Gemini client
func (gc *GeminiClient) Close() {
	if gc.client != nil {
		gc.client.Close()
	}
}

// generateContentWithJSONValidation generates content with JSON validation and retry logic
func (gc *GeminiClient) generateContentWithJSONValidation(ctx context.Context, description string) (string, error) {
	var lastErr error

	for attempt := 1; attempt <= maxJSONRetries; attempt++ {
		log.Printf("Gemini API attempt %d/%d", attempt, maxJSONRetries)

		// Generate content
		resp, err := gc.model.GenerateContent(ctx, genai.Text(description))
		if err != nil {
			lastErr = fmt.Errorf("gemini api error (attempt %d): %w", attempt, err)
			log.Printf("Gemini API error (attempt %d): %v", attempt, err)

			if attempt < maxJSONRetries {
				// Wait before retrying for API errors
				time.Sleep(time.Duration(attempt) * time.Second)
				continue
			}
			return "", lastErr
		}

		if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
			lastErr = fmt.Errorf("no candidates returned or content is empty (attempt %d)", attempt)
			log.Printf("No candidates returned or content is empty (attempt %d)", attempt)

			if attempt < maxJSONRetries {
				time.Sleep(time.Duration(attempt) * time.Second)
				continue
			}
			return "", lastErr
		}

		// Extract response content
		var responseContent string
		if text, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
			responseContent = string(text)
		} else {
			responseContent = fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0])
		}

		log.Printf("Gemini response received (attempt %d), length: %d characters", attempt, len(responseContent))

		// Validate JSON structure
		if isValidJSON(responseContent) {
			log.Printf("Valid JSON received on attempt %d", attempt)
			return responseContent, nil
		}

		// Try to clean/fix the JSON
		cleanedJSON := cleanJSONResponse(responseContent)
		if isValidJSON(cleanedJSON) {
			log.Printf("JSON cleaned and validated on attempt %d", attempt)
			return cleanedJSON, nil
		}

		lastErr = fmt.Errorf("invalid JSON received from Gemini (attempt %d)", attempt)
		log.Printf("Invalid JSON received from Gemini (attempt %d). Raw response: %s", attempt, responseContent)

		if attempt < maxJSONRetries {
			log.Printf("Retrying due to invalid JSON...")
			time.Sleep(time.Duration(attempt) * time.Second)
		}
	}

	// All attempts failed
	finalErr := fmt.Errorf("failed to get valid JSON after %d attempts: %w", maxJSONRetries, lastErr)
	sentry.CaptureException(finalErr)
	return "", finalErr
}

// isValidJSON checks if the string is valid JSON
func isValidJSON(str string) bool {
	var js map[string]interface{}
	return json.Unmarshal([]byte(str), &js) == nil
}

// cleanJSONResponse attempts to clean and fix common JSON issues
func cleanJSONResponse(response string) string {
	response = strings.TrimSpace(response)
	response = strings.TrimPrefix(response, "```json")
	response = strings.TrimPrefix(response, "```")
	response = strings.TrimSuffix(response, "```")

	// Trim whitespace
	response = strings.TrimSpace(response)

	// Find the first { and last } to extract just the JSON object
	firstBrace := strings.Index(response, "{")
	lastBrace := strings.LastIndex(response, "}")

	if firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace {
		response = response[firstBrace : lastBrace+1]
	}

	return response
}

// ParseJobDescription processes the job description string using the provided Gemini client.
func ParseJobDescription(ctx context.Context, geminiClient *GeminiClient, description string) (*JobDescription, error) {
	log.Println("Starting job description processing")
	defer sentry.Flush(2 * time.Second)

	var desc = description

	// Handle special cases
	if desc == "" || desc == "No description found" || desc == "N/A" {
		log.Println("Empty or placeholder description found, skipping processing")
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
		descOCR, err := processImageFromURLWithRetry(desc)
		if err != nil {
			log.Printf("OCR processing failed after retries: %v, using LINK_FOUND as placeholder", err)
			desc = "LINK_FOUND"
		} else {
			log.Printf("OCR extracted text length: %d characters", len(descOCR))
			desc = descOCR
		}
	}

	// Generate content with JSON validation and retry
	responseContent, err := geminiClient.generateContentWithJSONValidation(ctx, desc)
	if err != nil {
		log.Printf("Failed to generate valid JSON content: %v", err)
		return nil, err
	}

	log.Printf("Processing complete. Gemini Response length: %d characters", len(responseContent))

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
		unmarshalErr := fmt.Errorf("failed to parse structured job description from Gemini response: %w", err)
		sentry.CaptureException(unmarshalErr)
		log.Printf("Error unmarshalling responseContent: %v", unmarshalErr)
		return nil, unmarshalErr
	}

	return &jobDesc, nil
}

// PreprocessJobDescription remains largely the same.
func PreprocessJobDescription(jsonData []byte) ([]byte, error) {
	var rawData map[string]interface{}
	if err := json.Unmarshal(jsonData, &rawData); err != nil {
		return nil, fmt.Errorf("invalid JSON format for preprocessing: %w", err)
	}

	// Normalize ResponsibleFor field
	normalizeStringArrayField(rawData, "responsibleFor", false)

	// Normalize RequiredMemberships field
	normalizeStringArrayField(rawData, "requiredMemberships", true)

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
						continue
					}
					strArr = append(strArr, str)
				} else {
					strArr = append(strArr, fmt.Sprintf("%v", item))
				}
			}
			rawData[fieldName] = strArr
		case nil:
			rawData[fieldName] = []string{}
		}
	} else {
		rawData[fieldName] = []string{}
	}
}

// GetResponsibleForAsStrings and other getter methods remain the same.
func (jd *JobDescription) GetResponsibleForAsStrings() []string {
	return getStringSliceField(jd.ResponsibleFor, false)
}

func (jd *JobDescription) GetRequiredMembershipsAsStrings() []string {
	return getStringSliceField(jd.RequiredMemberships, true)
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
		if minYears, ok := v["minimumYears"]; ok {
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
		return []string{fmt.Sprintf("%v", v)}
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
		return fmt.Sprintf("%v", v)
	}
}

// processImageFromURLWithRetry calls processImageFromURL with retry logic.
func processImageFromURLWithRetry(imageURL string) (string, error) {
	var resultText string
	err := withRetry(maxRetries, initialRetryDelay, maxRetryDelay, func() error {
		text, err := processImageFromURL(imageURL)
		if err == nil {
			resultText = text
		}
		return err
	})

	if err != nil {
		finalErr := fmt.Errorf("OCR processing failed for URL %s after %d attempts: %w", imageURL, maxRetries, err)
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
		reqErr := fmt.Errorf("error creating OCR request for %s: %w", imageURL, err)
		log.Println(reqErr.Error())
		return "", reqErr
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: ocrSpaceTimeout}
	log.Println("Sending OCR API request")
	resp, err := client.Do(req)
	if err != nil {
		sendErr := fmt.Errorf("error sending request to OCR service for %s: %w", imageURL, err)
		log.Println(sendErr.Error())
		return "", sendErr
	}
	defer resp.Body.Close()

	log.Printf("Received OCR response status: %s for URL: %s", resp.Status, imageURL)
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		statusErr := fmt.Errorf("OCR service returned error (status %d) for %s: %s", resp.StatusCode, imageURL, string(bodyBytes))
		log.Println(statusErr.Error())
		return "", statusErr
	}

	var result struct {
		ParsedResults []struct {
			ParsedText string `json:"ParsedText"`
		} `json:"ParsedResults"`
		IsErroredOnProcessing bool        `json:"IsErroredOnProcessing"`
		ErrorMessage          interface{} `json:"ErrorMessage,omitempty"`
		ErrorDetails          interface{} `json:"ErrorDetails,omitempty"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		decodeErr := fmt.Errorf("error parsing OCR service response for %s: %w", imageURL, err)
		log.Println(decodeErr.Error())
		return "", decodeErr
	}

	if result.IsErroredOnProcessing {
		errorMsg := convertInterfaceToString(result.ErrorMessage)
		errorDetails := convertInterfaceToString(result.ErrorDetails)
		ocrProcErr := fmt.Errorf("OCR service processing error for %s: %s. Details: %s",
			imageURL, errorMsg, errorDetails)
		log.Println(ocrProcErr.Error())
		return "", ocrProcErr
	}

	if len(result.ParsedResults) > 0 && result.ParsedResults[0].ParsedText != "" {
		parsedText := result.ParsedResults[0].ParsedText
		log.Printf("Successfully parsed text from OCR (length: %d characters) for URL: %s", len(parsedText), imageURL)
		return parsedText, nil
	}

	noTextErr := fmt.Errorf("no text found in the image or empty parsed text from OCR for URL: %s", imageURL)
	log.Println(noTextErr.Error())
	return "", noTextErr
}

// withRetry implements exponential backoff retry logic.
func withRetry(maxAttempts int, initialDelay, maxDelay time.Duration, fn func() error) error {
	var err error
	delay := initialDelay

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		err = fn()
		if err == nil {
			return nil
		}

		log.Printf("Attempt %d/%d failed: %v", attempt, maxAttempts, err)
		if attempt < maxAttempts {
			log.Printf("Retrying in %v...", delay)
			time.Sleep(delay)
			delay *= 2
			if delay > maxDelay {
				delay = maxDelay
			}
		}
	}
	return fmt.Errorf("function failed after %d attempts: %w", maxAttempts, err)
}

// min helper for time.Duration
func min(a, b time.Duration) time.Duration {
	if a < b {
		return a
	}
	return b
}

// Helper function to convert interface{} (string/array) to flat string
func convertInterfaceToString(val interface{}) string {
	if val == nil {
		return ""
	}
	switch v := val.(type) {
	case string:
		return v
	case []interface{}:
		parts := make([]string, 0, len(v))
		for _, item := range v {
			parts = append(parts, fmt.Sprintf("%v", item))
		}
		return strings.Join(parts, "; ")
	default:
		return fmt.Sprintf("%v", val)
	}
}
