package processors

import (
	"context"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"easy-apply/constants"

	"github.com/joho/godotenv"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

const (
	openAIDefaultTimeout = 30 * time.Second
	nebiusDefaultTimeout = 45 * time.Second
	maxRetries           = 3
	retryDelay           = 500 * time.Millisecond
	cacheTTL             = 5 * time.Minute
)

var (
	openAIOnce   sync.Once
	openAIClient *openai.Client
	nebiusOnce   sync.Once
	nebiusClient *openai.Client
)

// OpenAIProcessor handles OpenAI API interactions
type OpenAIProcessor struct {
	openAIClient *openai.Client
	nebiusClient *openai.Client
	cache        sync.Map // Simple in-memory cache
}

type cacheItem struct {
	value      string
	expiration time.Time
}

// NewOpenAIProcessor creates a new OpenAI processor with singleton clients
func NewOpenAIProcessor() *OpenAIProcessor {
	// Load .env file once
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading it:", err)
	}

	// Initialize clients using sync.Once for thread safety
	openAIOnce.Do(func() {
		apiKey := os.Getenv("OPENAI_API_KEY")
		if apiKey == "" {
			log.Println("Warning: OPENAI_API_KEY environment variable not set")
		}
		client := openai.NewClient(
			option.WithAPIKey(apiKey),
			option.WithRequestTimeout(openAIDefaultTimeout),
		)
		openAIClient = &client
	})

	nebiusOnce.Do(func() {
		nebiusKey := os.Getenv("NEBIUS_API_KEY")
		if nebiusKey != "" {
			client := openai.NewClient(
				option.WithAPIKey(nebiusKey),
				option.WithBaseURL("https://api.studio.nebius.com/v1/"),
				option.WithRequestTimeout(nebiusDefaultTimeout),
			)
			nebiusClient = &client
		}
	})

	return &OpenAIProcessor{
		openAIClient: openAIClient,
		nebiusClient: nebiusClient,
	}
}

// ProcessText sends the job description and resume to OpenAI API with retries and caching
func (o *OpenAIProcessor) ProcessText(text string) (string, error) {
	if cached, ok := o.getFromCache(text); ok {
		return cached, nil
	}

	var result string
	var err error

	// Retry logic
	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			time.Sleep(retryDelay)
		}

		result, err = o.processResume(text)
		if err == nil {
			// Cache successful response
			o.setInCache(text, result)
			return result, nil
		}

		log.Printf("Attempt %d failed: %v", attempt+1, err)
	}

	return "", fmt.Errorf("after %d attempts: %w", maxRetries, err)
}

func (o *OpenAIProcessor) processResume(text string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), openAIDefaultTimeout)
	defer cancel()

	if o.openAIClient == nil {
		return "", fmt.Errorf("OpenAI client not initialized")
	}

	chatCompletion, err := o.openAIClient.Chat.Completions.New(
		ctx,
		openai.ChatCompletionNewParams{
			Model: constants.ResumeGenModel,
			Messages: []openai.ChatCompletionMessageParamUnion{
				{
					OfSystem: &openai.ChatCompletionSystemMessageParam{
						Content: openai.ChatCompletionSystemMessageParamContentUnion{
							OfString: openai.String(constants.OpenAIInstruction),
						},
					},
				},
				{
					OfUser: &openai.ChatCompletionUserMessageParam{
						Content: openai.ChatCompletionUserMessageParamContentUnion{
							OfString: openai.String(text),
						},
					},
				},
			},
			Temperature: openai.Float(0.7),
			MaxTokens:   openai.Int(2048),
			TopP:        openai.Float(1),
		},
	)
	if err != nil {
		return "", fmt.Errorf("error creating chat completion: %w", err)
	}

	if len(chatCompletion.Choices) == 0 {
		return "", fmt.Errorf("no response choices available")
	}

	content := chatCompletion.Choices[0].Message.Content
	if content == "" {
		return "", fmt.Errorf("empty response content")
	}

	return content, nil
}

// GenerateSubjectName generates a brief subject name with retries and caching
func (o *OpenAIProcessor) GenerateSubjectName(jobDetails string) (string, error) {
	// Check cache first
	if cached, ok := o.getFromCache("subject:" + jobDetails); ok {
		return cached, nil
	}

	if o.nebiusClient == nil {
		return "", fmt.Errorf("nebius client not initialized")
	}

	var result string
	var err error

	// Retry logic
	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			time.Sleep(retryDelay)
		}

		result, err = o.generateSubjectNameWithContext(jobDetails)
		if err == nil {
			// Cache successful response
			o.setInCache("subject:"+jobDetails, result)
			return result, nil
		}

		log.Printf("Attempt %d failed: %v", attempt+1, err)
	}

	return "", fmt.Errorf("after %d attempts: %w", maxRetries, err)
}

func (o *OpenAIProcessor) generateSubjectNameWithContext(jobDetails string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), nebiusDefaultTimeout)
	defer cancel()

	chatCompletion, err := o.nebiusClient.Chat.Completions.New(
		ctx,
		openai.ChatCompletionNewParams{
			Model: constants.SubjectGenModel,
			Messages: []openai.ChatCompletionMessageParamUnion{
				{
					OfSystem: &openai.ChatCompletionSystemMessageParam{
						Content: openai.ChatCompletionSystemMessageParamContentUnion{
							OfString: openai.String(constants.SubjectGenInstruction),
						},
					},
				},
				{
					OfUser: &openai.ChatCompletionUserMessageParam{
						Content: openai.ChatCompletionUserMessageParamContentUnion{
							OfString: openai.String(jobDetails),
						},
					},
				},
			},
			Temperature: openai.Float(0.6),
			MaxTokens:   openai.Int(64),
			TopP:        openai.Float(0.9),
		},
	)
	if err != nil {
		return "", fmt.Errorf("error creating chat completion: %w", err)
	}

	if len(chatCompletion.Choices) == 0 {
		return "", fmt.Errorf("no response choices available")
	}

	content := chatCompletion.Choices[0].Message.Content
	if content == "" {
		return "", fmt.Errorf("empty response content")
	}

	return content, nil
}

// Cache helper methods
func (o *OpenAIProcessor) setInCache(key, value string) {
	o.cache.Store(key, cacheItem{
		value:      value,
		expiration: time.Now().Add(cacheTTL),
	})
}

func (o *OpenAIProcessor) getFromCache(key string) (string, bool) {
	if val, ok := o.cache.Load(key); ok {
		item := val.(cacheItem)
		if time.Now().Before(item.expiration) {
			return item.value, true
		}
		o.cache.Delete(key) // Remove expired item
	}
	return "", false
}
