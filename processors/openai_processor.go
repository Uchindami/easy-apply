package processors

import (
	"context"
	"fmt"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

// OpenAIProcessor handles OpenAI API interactions
type OpenAIProcessor struct {
	client *openai.Client
}

// NewOpenAIProcessor creates a new OpenAI processor
func NewOpenAIProcessor() *OpenAIProcessor {
	apiKey := ``
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
			Model: "gpt-3.5-turbo",
			Messages: []openai.ChatCompletionMessageParamUnion{
				{
					OfSystem: &openai.ChatCompletionSystemMessageParam{
						Content: openai.ChatCompletionSystemMessageParamContentUnion{
							OfString: openai.String(`Optimize the given resume for the specified job and produce the output in HTML format suitable for conversion into a PDF. Identify and maintain all original links. Add appropriate skills and technologies in the user's experience section if applicable. The response should only include the HTML code without any explanation or commentary. Do not omit any original content from the resume or CV.\n\n# Steps\n\n1. **Analyze the Job Posting:** Extract key skills, technologies, and qualifications required for the job.\n2. **Review the Resume:** Identify existing sections such as Contact Information, Experience, Education, Skills, and Others.\n3. **Edit Experience Section:** Add relevant skills and technologies based on the job posting within the user's experience sections.\n4. **Maintain Links:** Ensure all existing links within the resume are identified and preserved.\n5. **Format in HTML:** Construct the entire resume in HTML while maintaining clear semantic structure to support conversion to PDF.\n   \n# Output Format\n\n- The output must be in a complete HTML document format, structured for converting into a PDF.\n- Maintain all links, sections, and content from the original resume.\n- Include any additional necessary skills and technologies in the experience section.\n\n# Notes\n\n- Ensure that all links are functional and correctly incorporated within the HTML code.\n- The HTML structure should support easy parsing and formatting for PDF conversion.\n- Pay special attention to any specific formatting requirements stated in job postings for optimal alignment with job expectations.`),
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
			Temperature: openai.Float(1.0),
			MaxTokens:   openai.Int(2048),
			TopP:        openai.Float(1.0),
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
