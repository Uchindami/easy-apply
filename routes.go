package main

import (
	"easy-apply/handlers"   // Import the new handlers package
	"easy-apply/middleware" // Assuming middleware package exists as per original
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	sentryhttp "github.com/getsentry/sentry-go/http"
)

// Setup API routes
func setupRoutes(sentryHandler *sentryhttp.Handler) {
	// Ensure handlers are called from the 'handlers' package
	http.HandleFunc("/auth", sentryHandler.HandleFunc(middleware.WithCORS(authHandler)))
	http.HandleFunc("/upload", sentryHandler.HandleFunc(middleware.WithCORS(handlers.UploadHandler)))
	http.HandleFunc("/convert-pdf", sentryHandler.HandleFunc(middleware.WithCORS(convertPDFHandler)))
	http.HandleFunc("/recommendations", sentryHandler.HandleFunc(middleware.WithCORS(handlers.JobRecommendationsHandler)))
	http.HandleFunc("/test", sentryHandler.HandleFunc(middleware.WithCORS(TestHandler))) // If you have a TestHandler
}

func TestHandler(w http.ResponseWriter, r *http.Request) {
	imageURL := r.URL.Query().Get("image_url")
	if imageURL == "" {
		err := fmt.Errorf("image_url query parameter is required")
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	// Log the image URL for debugging
	log.Printf("Processing image URL with OCR: %s",imageURL)
	// Set a timeout for the OCR service request
	ocrSpaceTimeout := 100 * time.Second // seconds
	// Check if the OCRSPACE_API_KEY environment variable is s)	

	apiKey := os.Getenv("OCRSPACE_API_KEY")
	if apiKey == "" {
		err := fmt.Errorf("OCRSPACE_API_KEY environment variable not set")
		log.Println(err.Error())
		return 
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
		return 
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: ocrSpaceTimeout}
	log.Println("Sending OCR API request")
	resp, err := client.Do(req)
	if err != nil {
		// Network or transport error.
		sendErr := fmt.Errorf("error sending request to OCR service for %s: %w", imageURL, err)
		log.Println(sendErr.Error())
		return // Return for retry
	}
	defer resp.Body.Close()

	log.Printf("Received OCR response status: %s for URL: %s", resp.Status, imageURL)
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		statusErr := fmt.Errorf("OCR service returned error (status %d) for %s: %s", resp.StatusCode, imageURL, string(bodyBytes))
		log.Println(statusErr.Error())
		// Non-200s might be retriable depending on the status code.
		return // Return for retry
	}

	// Read and parse the JSON response
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading OCR response body: %v", err)
		http.Error(w, "Failed to read OCR response", http.StatusInternalServerError)
		return
	}

	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	// Write the raw JSON response back to the client
	if _, err := w.Write(responseBody); err != nil {
		log.Printf("Error writing response to client: %v", err)
		return
	}
}
