package processors

import (
	"context"
	"fmt"
	"log"
	"os"

	"easy-apply/constants"

	"github.com/joho/godotenv"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

// OpenAIProcessor handles OpenAI API interactions
type OpenAIProcessor struct {
	client *openai.Client
}

// NewOpenAIProcessor creates a new OpenAI processor
func NewOpenAIProcessor() *OpenAIProcessor {

	err := godotenv.Load() // loads .env file
	if err != nil {
		log.Println("No .env file found or error loading it")
	}
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		fmt.Println("Warning: OPENAI_API_KEY environment variable not set")
	}

	client := openai.NewClient(
		option.WithAPIKey(apiKey),
	)

	return &OpenAIProcessor{
		client: &client,
	}
}

// ProcessText sends the job description and resume to OpenAI API and returns the HTML response
func (o *OpenAIProcessor) ProcessText(text string) (string, error) {
	ctx := context.Background()

	// Create the chat completion request
	chatCompletion, err := o.client.Chat.Completions.New(
		ctx,
		openai.ChatCompletionNewParams{
			Model: "gpt-4o",
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
		return "", fmt.Errorf("error creating chat completion: %v", err)
	}

	// Extract the response content
	if len(chatCompletion.Choices) == 0 {
		return "", fmt.Errorf("no response choices available")
	}

	content := chatCompletion.Choices[0].Message.Content
	if content == "" {
		return "", fmt.Errorf("no content in response")
	}

	return content, nil
}

// GenerateSubjectName generates a brief subject name based on job details using Nebius API
func (o *OpenAIProcessor) GenerateSubjectName(jobDetails string) (string, error) {
    nebiusKey := os.Getenv("NEBIUS_API_KEY")
    if nebiusKey == "" {
        return "", fmt.Errorf("NEBIUS_API_KEY environment variable not set")
    }

    // Create a new client for Nebius API
    client := openai.NewClient(
        option.WithAPIKey(nebiusKey),
        option.WithBaseURL("https://api.studio.nebius.com/v1/"),
    )

    ctx := context.Background()

    systemContent := `Generate a brief, descriptive subject name for this chat (max 24 characters). Base it on the key topic, tone, or purpose of the conversation. Examples: 'Project Alpha', 'Travel Plans', 'Quick Q&A', 'Bug Fixing'. Keep it clear and concise.

Tips for shorter subjects:

Use abbreviations (e.g., "MtgNotes" for "Meeting Notes").

Focus on keywords (e.g., "BudgetReview", "QA_Updates").

Avoid filler words (e.g., "Team" → "DevTeam").

provide only subject with no paranthesis`

    // Create the chat completion request
    chatCompletion, err := client.Chat.Completions.New(
        ctx,
        openai.ChatCompletionNewParams{
            Model: "meta-llama/Meta-Llama-3.1-70B-Instruct-fast",
            Messages: []openai.ChatCompletionMessageParamUnion{
                {
                    OfSystem: &openai.ChatCompletionSystemMessageParam{
                        Content: openai.ChatCompletionSystemMessageParamContentUnion{
                            OfString: openai.String(systemContent),
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
            MaxTokens:   openai.Int(512),
            TopP:        openai.Float(0.9),
            // Note: top_k is not included as openai-go does not support extra_body
        },
    )
    if err != nil {
        return "", fmt.Errorf("error creating chat completion: %v", err)
    }

    if len(chatCompletion.Choices) == 0 {
        return "", fmt.Errorf("no response choices available")
    }

    content := chatCompletion.Choices[0].Message.Content
    if content == "" {
        return "", fmt.Errorf("no content in response")
    }

    return content, nil
}