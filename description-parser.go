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

	"github.com/joho/godotenv"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

const (
	maxRetries        = 3
	initialRetryDelay = 1 * time.Second
	maxRetryDelay     = 10 * time.Second
	openRouterTimeout = 200 * time.Second
	ocrSpaceTimeout   = 30 * time.Second
)

func init() {
	// Load environment variables once at startup
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found or error loading .env file: %v", err)
	}
}

// ParseJobDescription processes the job description string as specified.

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

func ParseJobDescription(description string) (*JobDescription, error) {
	log.Println("Starting job description processing")

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

	// Check for URL pattern
	linkRegex := regexp.MustCompile(`^https?://`)
	if linkRegex.MatchString(desc) {
		log.Printf("Detected potential image URL: %s", desc)
		descOCR, err := processImageFromURLWithRetry(desc)
		if err != nil {
			log.Printf("OCR processing failed after retries: %v, using LINK_FOUND", err)
			desc = "LINK_FOUND"
		} else {
			log.Printf("OCR extracted text length: %d characters", len(descOCR))
			desc = descOCR
		}
	}

	// Validate API key
	apiKey := os.Getenv("OPENROUTER_API_KEY")
	if apiKey == "" {
		log.Println("OPENROUTER_API_KEY environment variable not set")
		return nil, fmt.Errorf("OPENROUTER_API_KEY not set")
	}

	// Initialize OpenAI client
	log.Println("Initializing OpenRouter client")
	client := openai.NewClient(
		option.WithAPIKey(apiKey),
		option.WithBaseURL("https://openrouter.ai/api/v1"),
		option.WithRequestTimeout(openRouterTimeout),
	)

	// Prepare messages
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
	// modelName := "qwen/qwen3-0.6b-04-28:free"
	// modelName := "qwen/qwen3-4b:free"
	modelName := "arcee-ai/caller-large"
	params := openai.ChatCompletionNewParams{
		Model:       modelName,
		Messages:    messages,
		Temperature: openai.Float(0.7),
		TopP:        openai.Float(1),
		MaxTokens:   openai.Int(4600),
	}

	// Execute API call with retry
	var responseContent string
	err := withRetry(maxRetries, initialRetryDelay, maxRetryDelay, func() error {
		ctx, cancel := context.WithTimeout(context.Background(), openRouterTimeout)
		defer cancel()

		log.Printf("Sending request to OpenRouter API (model: %s)", modelName)
		completion, err := client.Chat.Completions.New(ctx, params)
		if err != nil {
			log.Printf("OpenRouter API error: %v", err)
			return fmt.Errorf("OpenRouter API error: %w", err)
		}

		log.Printf("Received response with %d choices", len(completion.Choices))
		if len(completion.Choices) == 0 {
			log.Println("No completion choices available")
			return fmt.Errorf("no choices returned")
		}

		responseContent = completion.Choices[0].Message.Content
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed after %d retries: %w", maxRetries, err)
	}

	log.Printf("Processing complete. Response length: %d characters", len(responseContent))

	// println(responseContent)
	// Use the new preprocessing and unmarshaling approach
	processedData, err := PreprocessJobDescription([]byte(responseContent))
	if err != nil {
		log.Printf("Error preprocessing job description: %v", err)
		return nil, fmt.Errorf("failed to preprocess job description: %w", err)
	}

	var jobDesc JobDescription
	if err := json.Unmarshal(processedData, &jobDesc); err != nil {
		log.Printf("Error unmarshalling responseContent: %v", err)
		return nil, fmt.Errorf("failed to parse structured job description: %w", err)
	}

	return &jobDesc, nil
}

func PreprocessJobDescription(jsonData []byte) ([]byte, error) {
	// Parse JSON into a map for easier manipulation
	var rawData map[string]interface{}
	if err := json.Unmarshal(jsonData, &rawData); err != nil {
		return nil, fmt.Errorf("invalid JSON format: %w", err)
	}

	// Normalize ResponsibleFor field
	if responsibleFor, exists := rawData["responsibleFor"]; exists {
		switch v := responsibleFor.(type) {
		case string:
			// Convert single string to array
			rawData["responsibleFor"] = []string{v}
		case []interface{}:
			// Already an array, ensure all elements are strings
			strArr := make([]string, len(v))
			for i, item := range v {
				if str, ok := item.(string); ok {
					strArr[i] = str
				} else {
					strArr[i] = fmt.Sprintf("%v", item)
				}
			}
			rawData["responsibleFor"] = strArr
		}
	}

	// Normalize RequiredMemberships field
	if reqMemberships, exists := rawData["requiredMemberships"]; exists {
		switch v := reqMemberships.(type) {
		case string:
			if v == "N/A" || v == "" {
				rawData["requiredMemberships"] = []string{}
			} else {
				rawData["requiredMemberships"] = []string{v}
			}
		case []interface{}:
			// Already an array, ensure all elements are strings
			strArr := make([]string, len(v))
			for i, item := range v {
				if str, ok := item.(string); ok {
					strArr[i] = str
				} else {
					strArr[i] = fmt.Sprintf("%v", item)
				}
			}
			rawData["requiredMemberships"] = strArr
		}
	}

	// Re-serialize to JSON
	return json.Marshal(rawData)
}

// GetResponsibleForAsStrings safely extracts ResponsibleFor as a string slice
func (jd *JobDescription) GetResponsibleForAsStrings() []string {
	switch v := jd.ResponsibleFor.(type) {
	case []string:
		return v
	case []interface{}:
		result := make([]string, len(v))
		for i, item := range v {
			result[i] = fmt.Sprintf("%v", item)
		}
		return result
	case string:
		return []string{v}
	default:
		return []string{}
	}
}

// GetRequiredMembershipsAsStrings safely extracts RequiredMemberships as a string slice
func (jd *JobDescription) GetRequiredMembershipsAsStrings() []string {
	switch v := jd.RequiredMemberships.(type) {
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
	default:
		return []string{}
	}
}

// GetRequiredExperienceAsStrings attempts to extract RequiredExperience as a string slice
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
		return []string{v}
	case map[string]interface{}:
		// Handle the case where it's a complex object
		var result []string

		// Extract minimum years if available
		if minYears, ok := v["minimumYears"].(float64); ok {
			result = append(result, fmt.Sprintf("Minimum %v years experience", minYears))
		}

		// Extract type if available
		if expType, ok := v["type"].(string); ok {
			result = append(result, expType)
		}

		// Extract additional experience if available
		if addExp, ok := v["additionalExperience"].(string); ok {
			result = append(result, addExp)
		}

		return result
	default:
		return []string{}
	}
}

// GetContactDetailsAsString safely extracts ContactDetails as a string
func (jd *JobDescription) GetContactDetailsAsString() string {
	switch v := jd.ContactDetails.(type) {
	case string:
		return v
	case map[string]interface{}:
		// Try to convert the object to a readable string
		details := []string{}
		for key, val := range v {
			details = append(details, fmt.Sprintf("%s: %v", key, val))
		}
		return strings.Join(details, ", ")
	default:
		return ""
	}
}
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
		return "", fmt.Errorf("OCR processing failed after %d attempts: %w", maxRetries, err)
	}
	return resultText, nil
}

func processImageFromURL(imageURL string) (string, error) {
	log.Printf("Processing image URL: %s", imageURL)

	apiKey := os.Getenv("OCRSPACE_API_KEY")
	if apiKey == "" {
		log.Println("OCRSPACE_API_KEY environment variable not set")
		return "", fmt.Errorf("OCRSPACE_API_KEY not set")
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
		log.Printf("Error creating request: %v", err)
		return "", fmt.Errorf("error creating request: %w", err)
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: ocrSpaceTimeout}
	log.Println("Sending OCR API request")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending request: %v", err)
		return "", fmt.Errorf("error sending request to OCR service: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("Received OCR response status: %s", resp.Status)
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("Non-200 response: %s", body)
		return "", fmt.Errorf("OCR service returned error (status %d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		ParsedResults []struct {
			ParsedText string `json:"ParsedText"`
		} `json:"ParsedResults"`
		IsErroredOnProcessing bool   `json:"IsErroredOnProcessing"`
		ErrorMessage          string `json:"ErrorMessage,omitempty"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("Error decoding response: %v", err)
		return "", fmt.Errorf("error parsing OCR service response: %w", err)
	}

	if result.IsErroredOnProcessing {
		log.Printf("OCR processing error: %s", result.ErrorMessage)
		return "", fmt.Errorf("OCR processing error: %s", result.ErrorMessage)
	}

	if len(result.ParsedResults) > 0 {
		parsedText := result.ParsedResults[0].ParsedText
		log.Printf("Successfully parsed text (length: %d characters)", len(parsedText))
		return parsedText, nil
	}

	log.Println("No parsed results in response")
	return "", fmt.Errorf("no text found in the image")
}

// withRetry implements exponential backoff retry logic
func withRetry(maxAttempts int, initialDelay, maxDelay time.Duration, fn func() error) error {
	var err error
	delay := initialDelay

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		err = fn()
		if err == nil {
			return nil
		}

		if attempt < maxAttempts {
			log.Printf("Attempt %d failed, retrying in %v: %v", attempt, delay, err)
			time.Sleep(delay)
			delay = min(delay*2, maxDelay) // Exponential backoff with max limit
		}
	}

	return err
}

func min(a, b time.Duration) time.Duration {
	if a < b {
		return a
	}
	return b
}
