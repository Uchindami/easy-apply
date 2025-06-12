package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"easy-apply/constants"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

var geminiClient *genai.Client
var geminiModel *genai.GenerativeModel

// InitGeminiClient initializes the Gemini client once
func InitGeminiClient(ctx context.Context) error {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		err := fmt.Errorf("GEMINI_API_KEY environment variable not set")
		log.Println(err.Error())
		return err
	}

	log.Println("Initializing Gemini client")
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		log.Printf("Failed to create Gemini client: %v", err)
		return err
	}

	geminiClient = client
	geminiModel = configureGeminiModel(client)

	log.Println("Gemini client initialized successfully")
	return nil
}

// CloseGeminiClient closes the Gemini client when shutting down
func CloseGeminiClient() {
	if geminiClient != nil {
		geminiClient.Close()
	}
}

// configureGeminiModel sets up the Gemini model with appropriate configuration
func configureGeminiModel(client *genai.Client) *genai.GenerativeModel {
	model := client.GenerativeModel(constants.GeminiModelName)

	model.SystemInstruction = &genai.Content{
		Parts: []genai.Part{genai.Text(constants.OpenRouterInstrunctions)},
	}

	model.GenerationConfig = genai.GenerationConfig{
		Temperature:      genai.Ptr(float32(0.7)),
		MaxOutputTokens:  genai.Ptr(int32(4096)),
		ResponseMIMEType: "application/json",
	}

	return model
}
