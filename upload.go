package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"easy-apply/processors"
	"easy-apply/constants"
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
		log.Printf("Error parsing multipart form: %v", err)
		http.Error(w, "File too large or invalid form data", http.StatusBadRequest)
		return
	}

	// Check if weblink was submitted
	webLink := r.FormValue("weblink")
	log.Printf("Received web link: %s", webLink)
	if webLink == "" {
		http.Error(w, "Job posting(Link to job posting) is required", http.StatusBadRequest)
		return
	}

	// Check if file was uploaded
	file, handler, err := r.FormFile("file")
	if err == nil {
		defer file.Close()
		log.Printf("Received file: %s (Size: %d bytes)", handler.Filename, handler.Size)

		if strings.ToLower(getFileExt(handler.Filename)) != ".pdf" {
			log.Printf("Invalid file type received: %s", handler.Filename)
			http.Error(w, "Only PDF files are supported", http.StatusBadRequest)
			return
		}

		// Read file content into memory
		var buf bytes.Buffer
		if _, err := io.Copy(&buf, file); err != nil {
			http.Error(w, "Failed to read uploaded file", http.StatusInternalServerError)
			return
		}

		processedResume, err := pdfProcessor.ProcessPDFBuffer(buf.Bytes())
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to process PDF: %v", err), http.StatusInternalServerError)
			return
		}
		scrappedWebJobPosting, err := webProcessor.ProcessWebLink(webLink)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to process web link: %v", err), http.StatusInternalServerError)
			return
		}

		sendOpenAIAnalysis(w, scrappedWebJobPosting, processedResume, handler.Filename)

		return
	}

}

func sendOpenAIAnalysis(w http.ResponseWriter, jobPosting, resumeContent, source string) {

	// content := fmt.Sprintf("APPLY FOR THIS JOB```%s``` WITH THIS RESUME ```%s```", jobPosting, resumeContent)

	// analysis, err := openAIProcessor.ProcessText(content)
	// if err != nil {
	// 	http.Error(w, fmt.Sprintf("Failed to analyze with OpenAI: %v", err), http.StatusInternalServerError)
	// 	return
	// }

	response := map[string]interface{}{
		"resume":      constants.ModelResponse,
		"coverLetter": "", // You might want to add cover letter generation later
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func getFileExt(filename string) string {
	if dot := strings.LastIndex(filename, "."); dot != -1 {
		return filename[dot:]
	}
	return ""
}
