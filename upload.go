package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"

	// "easy-apply/constants"
	"easy-apply/processors"
)

var (
	pdfProcessor    *processors.PDFProcessor
	webProcessor    *processors.WebProcessor
	openAIProcessor *processors.OpenAIProcessor
)

func init() {
	// Initialize processors with optional uploadDir param (unused now for PDF)
	pdfProcessor = processors.NewPDFProcessor("") // Empty path since we don't save
	webProcessor = processors.NewWebProcessor("") // Optional: still may use download path
	openAIProcessor = processors.NewOpenAIProcessor()

}
func uploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	handleFileUpload(w, r)
}

func handleFileUpload(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20) // 10MB limit
	if err != nil {
		handleError(w, "File too large or invalid form data", http.StatusBadRequest, err)
		return
	}

	// Get user ID from form
	userID := r.FormValue("userId")
	if userID == "" {
		handleError(w, "User ID is required", http.StatusBadRequest, nil)
		return
	}

	// Get job link
	webLink := r.FormValue("weblink")
	if webLink == "" {
		handleError(w, "Job posting link is required", http.StatusBadRequest, nil)
		return
	}

	// Process uploaded file
	file, handler, err := r.FormFile("file")
	if err != nil {
		handleError(w, "Failed to get uploaded file", http.StatusBadRequest, err)
		return
	}
	defer file.Close()

	if strings.ToLower(getFileExt(handler.Filename)) != ".pdf" {
		handleError(w, "Only PDF files are supported", http.StatusBadRequest, nil)
		return
	}

	// Read file content
	var buf bytes.Buffer
	if _, err := io.Copy(&buf, file); err != nil {
		handleError(w, "Failed to read uploaded file", http.StatusInternalServerError, err)
		return
	}

	// Create history record first with "processing" status
	historyID := uuid.New().String()
	historyRef := firestoreClient.Collection("Users").Doc(userID).Collection("History").Doc(historyID)

	initialHistory := map[string]interface{}{
		"timestamp": firestore.ServerTimestamp,
		"status":    "processing",
		"original": map[string]interface{}{
			"resumePath": "", // Will be updated
			"jobLink":    webLink,
		},
		"jobDetails": map[string]interface{}{
			"title":   "Processing...",
			"company": "Processing...",
			"source":  extractSourceFromURL(webLink),
		},
	}

	if _, err := historyRef.Set(context.Background(), initialHistory); err != nil {
		handleError(w, "Failed to create history record", http.StatusInternalServerError, err)
		return
	}

	// Upload original resume to storage
	// originalPath := fmt.Sprintf("user-resumes/%s/%s/original.pdf", userID, historyID)
	// if err := uploadToStorage(originalPath, buf.Bytes()); err != nil {
	// 	handleError(w, "Failed to upload original resume", http.StatusInternalServerError, err)
	// 	return
	// }

	// Process documents (simplified example - replace with your actual processing)
	extractedResume, err := pdfProcessor.ProcessPDFBuffer(buf.Bytes())
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to process PDF: %v", err), http.StatusInternalServerError)
		return
	}
	// coverLetter := "Generated cover letter" // Replace with actual processing

	scrappedWebJobPosting, err := webProcessor.ProcessWebLink(webLink)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to process web link: %v", err), http.StatusInternalServerError)
		return
	}

	sendOpenAIAnalysis(w, scrappedWebJobPosting, extractedResume, handler.Filename, historyRef)
	return
	// Upload generated documents LOGIC WILL BE SHIPPED TO FRONTEND
	// generatedResumePath := fmt.Sprintf("user-resumes/%s/%s/generated-resume.pdf", userID, historyID)
	// if err := uploadToStorage(generatedResumePath, []byte(processedResume)); err != nil {
	// 	handleError(w, "Failed to upload generated resume", http.StatusInternalServerError, err)
	// 	return
	// }

	// generatedCLPath := fmt.Sprintf("user-resumes/%s/%s/generated-cover-letter.pdf", userID, historyID)
	// if err := uploadToStorage(generatedCLPath, []byte(coverLetter)); err != nil {
	// 	handleError(w, "Failed to upload cover letter", http.StatusInternalServerError, err)
	// 	return
	// }
}

func sendOpenAIAnalysis(w http.ResponseWriter, jobPosting, extractedResume, source string, historyRef *firestore.DocumentRef) {

	content := fmt.Sprintf("APPLY FOR THIS JOB```%s``` WITH THIS RESUME ```%s```", jobPosting, extractedResume)

	processedResume, err := openAIProcessor.ProcessText(content)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to analyze with OpenAI: %v", err), http.StatusInternalServerError)
		return
	}
	processedJobTitle, err := openAIProcessor.GenerateSubjectName(jobPosting)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to process job title : %v", err), http.StatusInternalServerError)
		return
	}
	// Update history record with completed status
	update := map[string]interface{}{
		"status":              "completed",
		"original.resumePath": extractedResume,
		"generated": map[string]interface{}{
			"resumePath":      processedResume,          
			"coverLetterPath": "generatedCLPath", // Replace with actual generated cover letter path
		},
		"jobDetails": map[string]interface{}{
			"title":   processedJobTitle, // Replace with actual parsed data
			"company": "Extracted Company",
		},
		"completedAt": firestore.ServerTimestamp,
	}

	if _, err := historyRef.Update(context.Background(), []firestore.Update{
		{Path: "status", Value: update["status"]},
		{Path: "original.resumePath", Value: update["original.resumePath"]},
		{Path: "generated", Value: update["generated"]},
		{Path: "jobDetails", Value: update["jobDetails"]},
		{Path: "completedAt", Value: update["completedAt"]},
	}); err != nil {
		handleError(w, "Failed to update history record", http.StatusInternalServerError, err)
		return
	}

	// Send response to client
	response := map[string]interface{}{
		"resume":      processedResume, 
		"coverLetter": "",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}

func uploadToStorage(path string, content []byte) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	bucket := storageClient.Bucket("your-bucket-name.appspot.com")
	obj := bucket.Object(path)
	w := obj.NewWriter(ctx)

	// if _, err := w.Write(content); err != nil {
	// 	w.Close()
	// 	return err
	// }
	return w.Close()
}

func extractSourceFromURL(url string) string {
	if strings.Contains(url, "linkedin.com") {
		return "LinkedIn"
	} else if strings.Contains(url, "indeed.com") {
		return "Indeed"
	} else if strings.Contains(url, "glassdoor.com") {
		return "Glassdoor"
	}
	return "Other"
}

func getFileExt(filename string) string {
	if dot := strings.LastIndex(filename, "."); dot != -1 {
		return filename[dot:]
	}
	return ""
}

func handleError(w http.ResponseWriter, message string, statusCode int, err error) {
	if err != nil {
		log.Printf("%s: %v", message, err)
	} else {
		log.Println(message)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"error":   message,
	})
}
