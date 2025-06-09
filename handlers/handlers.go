package handlers

import (
	"cloud.google.com/go/firestore"
)

// set in main
var MaxUploadSize int64

// set in firebase.go
var FirestoreClient *firestore.Client

type OCRResponse struct {
	ParsedResults []struct {
		ParsedText  string `json:"ParsedText"`
		TextOverlay struct {
			Lines []interface{} `json:"Lines"`
		} `json:"TextOverlay"`
		HasOverlay        bool   `json:"HasOverlay"`
		Message           string `json:"Message"`
		FileParseExitCode int    `json:"FileParseExitCode"`
	} `json:"ParsedResults"`
	OCRExitCode                  int      `json:"OCRExitCode"`
	IsErroredOnProcessing        bool     `json:"IsErroredOnProcessing"`
	ProcessingTimeInMilliseconds string   `json:"ProcessingTimeInMilliseconds"`
	SearchablePDFURL             string   `json:"SearchablePDFURL"`
	ErrorMessage                 []string `json:"ErrorMessage,omitempty"` // This is actually an array
	ErrorDetails                 string   `json:"ErrorDetails,omitempty"`
}
