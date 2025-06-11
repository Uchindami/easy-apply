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

// Configuration constants
const (
	defaultTimeout = 100 * time.Second
	maxRetries     = 3
	retryDelay     = 500 * time.Millisecond
	cacheTTL       = 5 * time.Minute
)

// Singleton client management
var (
	clientOnce sync.Once
	client     openai.Client
	clientErr  error
)

// CacheItem represents a cached value with expiration
type CacheItem struct {
	value      string
	expiration time.Time
}

// IsExpired checks if the cache item has expired
func (c CacheItem) IsExpired() bool {
	return time.Now().After(c.expiration)
}

// Cache provides thread-safe caching functionality
type Cache struct {
	store sync.Map
	ttl   time.Duration
}

// NewCache creates a new cache with the specified TTL
func NewCache(ttl time.Duration) *Cache {
	return &Cache{
		ttl: ttl,
	}
}

// Set stores a value in the cache with expiration
func (c *Cache) Set(key, value string) {
	item := CacheItem{
		value:      value,
		expiration: time.Now().Add(c.ttl),
	}
	c.store.Store(key, item)
}

// Get retrieves a value from the cache if it exists and hasn't expired
func (c *Cache) Get(key string) (string, bool) {
	val, exists := c.store.Load(key)
	if !exists {
		return "", false
	}

	item := val.(CacheItem)
	if item.IsExpired() {
		c.store.Delete(key)
		return "", false
	}

	return item.value, true
}

// OpenAIProcessor handles OpenAI API interactions with caching and retry logic
type OpenAIProcessor struct {
	client openai.Client
	cache  *Cache
}

// NewOpenAIProcessor creates a new OpenAI processor with singleton client
func NewOpenAIProcessor() (*OpenAIProcessor, error) {
	if err := initializeClient(); err != nil {
		return nil, fmt.Errorf("failed to initialize OpenAI client: %w", err)
	}

	return &OpenAIProcessor{
		client: client,
		cache:  NewCache(cacheTTL),
	}, nil
}

// initializeClient initializes the OpenAI client as a singleton
func initializeClient() error {
	clientOnce.Do(func() {
		if err := godotenv.Load(); err != nil {
			log.Println("No .env file found or error loading it:", err)
		}

		apiKey := os.Getenv("OPENAI_API_KEY")
		if apiKey == "" {
			clientErr = fmt.Errorf("OPENAI_API_KEY environment variable not set")
			return
		}

		client = openai.NewClient(
			option.WithAPIKey(apiKey),
			option.WithRequestTimeout(defaultTimeout),
		)
	})

	return clientErr
}

// ProcessDocuments processes documents through OpenAI with retry logic and caching
func (p *OpenAIProcessor) ProcessDocuments(documents string) (string, error) {
	if cached, found := p.cache.Get(documents); found {
		return cached, nil
	}

	result, err := p.executeWithRetry(func() (string, error) {
		return p.generateResumeAndCoverLetter(documents)
	})

	if err != nil {
		return "", err
	}

	p.cache.Set(documents, result)
	return result, nil
}

// GenerateSubjectName generates a brief subject name with retries and caching
func (p *OpenAIProcessor) GenerateSubjectName(jobDescription string) (string, error) {
	cacheKey := "subject:" + jobDescription

	if cached, found := p.cache.Get(cacheKey); found {
		return cached, nil
	}

	result, err := p.executeWithRetry(func() (string, error) {
		return p.generateSubjectNameWithContext(jobDescription)
	})

	if err != nil {
		return "", err
	}

	p.cache.Set(cacheKey, result)
	return result, nil
}

// AnalyzeResumeForRecommendation analyzes a resume for job recommendations
func (p *OpenAIProcessor) AnalyzeResumeForRecommendation(resume string) (string, error) {
	prompt := fmt.Sprintf("**Resume:**{resume}\n%s", resume)

	params := chatCompletionParams{
		model:       constants.RECOMMENDATIONS_MODEL,
		systemMsg:   constants.RECOMMENDATIONS_INSTRUCTION,
		userMsg:     prompt,
		temperature: 0.5,
		maxTokens:   512,
		topP:        1.0,
	}

	return p.createChatCompletion(params)
}

// chatCompletionParams holds parameters for chat completion requests
type chatCompletionParams struct {
	model        openai.ChatModel
	systemMsg    string
	assistantMsg string
	userMsg      string
	temperature  float64
	maxTokens    int
	topP         float64
}

// executeWithRetry executes a function with retry logic
func (p *OpenAIProcessor) executeWithRetry(fn func() (string, error)) (string, error) {
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			time.Sleep(retryDelay)
		}

		result, err := fn()
		if err == nil {
			return result, nil
		}

		lastErr = err
		log.Printf("Attempt %d failed: %v", attempt+1, err)
	}

	return "", fmt.Errorf("after %d attempts: %w", maxRetries, lastErr)
}

// generateResumeAndCoverLetter generates resume and cover letter content
func (p *OpenAIProcessor) generateResumeAndCoverLetter(text string) (string, error) {
	params := chatCompletionParams{
		model:        constants.ResumeGenModel,
		systemMsg:    constants.OpenAIInstruction,
		userMsg:      text,
		temperature:  0,
		maxTokens:    4000,
		topP:         1.0,
	}

	return p.createChatCompletion(params)
}

// generateSubjectNameWithContext generates a subject name based on job details
func (p *OpenAIProcessor) generateSubjectNameWithContext(jobDetails string) (string, error) {
	params := chatCompletionParams{
		model:        constants.SubjectGenModel,
		systemMsg:    constants.SubjectGenInstruction,
		assistantMsg: constants.SubjectGenAssistantInstruction,
		userMsg:      jobDetails,
		temperature:  0.7,
		maxTokens:    64,
		topP:         0.9,
	}

	result, err := p.createChatCompletion(params)
	if err != nil {
		return "", err
	}

	log.Printf("\033[31mOpenAI response:\033[0m %s", result)
	return result, nil
}

// createChatCompletion creates a chat completion request with the given parameters
func (p *OpenAIProcessor) createChatCompletion(params chatCompletionParams) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), defaultTimeout)
	defer cancel()

	messages := p.buildMessages(params)

	chatCompletion, err := p.client.Chat.Completions.New(
		ctx,
		openai.ChatCompletionNewParams{
			Model:       params.model,
			Messages:    messages,
			Temperature: openai.Float(params.temperature),
			MaxTokens:   openai.Int(int64(params.maxTokens)),
			TopP:        openai.Float(params.topP),
		},
	)

	if err != nil {
		return "", fmt.Errorf("error creating chat completion: %w", err)
	}

	return p.extractContent(chatCompletion)
}

// buildMessages constructs the message array for chat completion
func (p *OpenAIProcessor) buildMessages(params chatCompletionParams) []openai.ChatCompletionMessageParamUnion {
	messages := []openai.ChatCompletionMessageParamUnion{
		{
			OfSystem: &openai.ChatCompletionSystemMessageParam{
				Content: openai.ChatCompletionSystemMessageParamContentUnion{
					OfString: openai.String(params.systemMsg),
				},
			},
		},
	}

	// Add assistant message if provided
	if params.assistantMsg != "" {
		messages = append(messages, openai.ChatCompletionMessageParamUnion{
			OfAssistant: &openai.ChatCompletionAssistantMessageParam{
				Content: openai.ChatCompletionAssistantMessageParamContentUnion{
					OfString: openai.String(params.assistantMsg),
				},
			},
		})
	}

	// Add user message
	messages = append(messages, openai.ChatCompletionMessageParamUnion{
		OfUser: &openai.ChatCompletionUserMessageParam{
			Content: openai.ChatCompletionUserMessageParamContentUnion{
				OfString: openai.String(params.userMsg),
			},
		},
	})

	return messages
}

// extractContent extracts content from chat completion response
func (p *OpenAIProcessor) extractContent(chatCompletion *openai.ChatCompletion) (string, error) {
	if len(chatCompletion.Choices) == 0 {
		return "", fmt.Errorf("no response choices available")
	}

	content := chatCompletion.Choices[0].Message.Content
	if content == "" {
		return "", fmt.Errorf("empty response content")
	}

	return content, nil
}
