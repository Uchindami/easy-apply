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
	"sync"
	"time"

	"easy-apply/processors"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
)

const (
	maxUploadSize    = 10 << 20 // 10MB
	contentTypeJSON  = "application/json"
	statusProcessing = "processing"
	statusCompleted  = "completed"
)

var (
	processorsOnce    sync.Once
	fileProcessor     *processors.FileProcessor
	webProcessor      *processors.WebProcessor
	openAIProcessor   *processors.OpenAIProcessor
	supportedJobSites = map[string]string{
		"jobsearchmalawi.com": "JobSearch Malawi",
		"careersmw.com":       "Careers MW",
		"glassdoor.com":       "Glassdoor",
	}
	logger = log.New(log.Writer(), "APPLICATION: ", log.LstdFlags|log.Lshortfile)
)

func initProcessors() {
	processorsOnce.Do(func() {
		logger.Println("Initializing processors...")
		startTime := time.Now()
		fileProcessor = processors.NewFileProcessor()
		webProcessor = processors.NewWebProcessor("")
		openAIProcessor = processors.NewOpenAIProcessor()
		logger.Printf("Processors initialized in %v", time.Since(startTime))
	})
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	logger.Println("Received upload request")
	if r.Method != http.MethodPost {
		logger.Println("Invalid method attempted:", r.Method)
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	handleFileUpload(w, r)
}

func handleFileUpload(w http.ResponseWriter, r *http.Request) {
	logger.Println("Starting file upload processing")
	startTime := time.Now()
	defer func() {
		logger.Printf("File upload processing completed in %v", time.Since(startTime))
	}()

	initProcessors()

	logger.Println("Parsing multipart form")
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		logger.Printf("Failed to parse form: %v", err)
		handleError(w, "File too large or invalid form data", http.StatusBadRequest, err)
		return
	}

	userID := strings.TrimSpace(r.FormValue("userId"))
	if userID == "" {
		logger.Println("Empty user ID provided")
		handleError(w, "User ID is required", http.StatusBadRequest, nil)
		return
	}
	logger.Printf("Processing request for user: %s", userID)

	webLink := strings.TrimSpace(r.FormValue("weblink"))
	if webLink == "" {
		logger.Println("Empty web link provided")
		handleError(w, "Job posting link is required", http.StatusBadRequest, nil)
		return
	}
	logger.Printf("Processing job link: %s", webLink)

	logger.Println("Retrieving uploaded file")
	file, handler, err := r.FormFile("file")
	if err != nil {
		logger.Printf("Failed to get file: %v", err)
		handleError(w, "Failed to get uploaded file", http.StatusBadRequest, err)
		return
	}
	defer file.Close()

	fileExt := strings.ToLower(getFileExt(handler.Filename)) // Initialize fileExt
	if fileExt != ".pdf" && fileExt != ".docx" && fileExt != ".txt" {
		logger.Printf("Invalid file type attempted: %s", fileExt)
		handleError(w, "Only PDF, DOCX, and TXT files are supported", http.StatusBadRequest, nil)
		return
	}
	logger.Printf("Processing file: %s", handler.Filename)

	logger.Println("Reading file content")
	var buf bytes.Buffer
	if _, err := io.Copy(&buf, file); err != nil {
		logger.Printf("Failed to read file: %v", err)
		handleError(w, "Failed to read uploaded file", http.StatusInternalServerError, err)
		return
	}

	historyID := uuid.New().String()
	historyRef := firestoreClient.Collection("Users").Doc(userID).Collection("History").Doc(historyID)
	logger.Printf("Creating history record with ID: %s", historyID)

	initialHistory := map[string]interface{}{
		"timestamp": firestore.ServerTimestamp,
		"status":    statusProcessing,
		"original": map[string]interface{}{
			"resumePath": "",
			"jobLink":    webLink,
		},
		"jobDetails": map[string]interface{}{
			"title":   "Processing...",
			"company": "Processing...",
			"source":  extractSourceFromURL(webLink),
		},
	}

	logger.Println("Writing initial history to Firestore")
	if _, err := historyRef.Set(context.Background(), initialHistory); err != nil {
		logger.Printf("Failed to create history record: %v", err)
		handleError(w, "Failed to create history record", http.StatusInternalServerError, err)
		return
	}

	var (
		extractedResume       string
		scrappedWebJobPosting string
		processErr            error
		wg                    sync.WaitGroup
	)

	logger.Println("Starting concurrent processing of file and web link")
	wg.Add(2)
	go func() {
		defer wg.Done()
		logger.Println("Starting file processing")
		fileStart := time.Now()
		extractedResume, err = fileProcessor.ProcessFileBuffer(buf.Bytes(), fileExt)
		if err != nil {
			processErr = fmt.Errorf("file processing failed: %w", err)
			logger.Printf("File processing failed after %v: %v", time.Since(fileStart), err)
		} else {
			logger.Printf("File processing completed in %v", time.Since(fileStart))
		}
	}()

	go func() {
		defer wg.Done()
		logger.Println("Starting web link processing")
		webStart := time.Now()
		scrappedWebJobPosting, err = webProcessor.ProcessWebLink(webLink)
		if err != nil {
			processErr = fmt.Errorf("web processing failed: %w", err)
			logger.Printf("Web processing failed after %v: %v", time.Since(webStart), err)
		} else {
			logger.Printf("Web processing completed in %v", time.Since(webStart))
		}
	}()

	wg.Wait()
	if processErr != nil {
		logger.Printf("Processing failed: %v", processErr)
		handleError(w, processErr.Error(), http.StatusInternalServerError, processErr)
		return
	}

	logger.Println("Both PDF and web processing completed successfully")
	sendOpenAIAnalysis(w, scrappedWebJobPosting, extractedResume, handler.Filename, historyRef)
}

func sendOpenAIAnalysis(w http.ResponseWriter, jobPosting, extractedResume, source string, historyRef *firestore.DocumentRef) {
	logger.Println("Starting OpenAI analysis")
	analysisStart := time.Now()
	defer func() {
		logger.Printf("OpenAI analysis completed in %v", time.Since(analysisStart))
	}()

	documents := fmt.Sprintf(`"job_description:"""--- %s ---""" resume:"""--- %s ---"""`, jobPosting, extractedResume)

	var (
		processedDocuments struct {
			ProcessedResume      string `json:"generated_resume"`
			ProcessedCoverLetter string `json:"generated_cover_letter"`
		}
		openAIErr  error
		jobDetails struct {
			Title   string `json:"title"`
			Company string `json:"company_name"`
		}
		wg sync.WaitGroup
	)

	logger.Println("Starting concurrent OpenAI processing")
	wg.Add(2)
	go func() {
		defer wg.Done()
		logger.Println("Starting resume and coverLetter processing with OpenAI")
		resumeStart := time.Now()
		var processedDocumentsJSON string
		processedDocumentsJSON, openAIErr = openAIProcessor.ProcesseDocuments(documents)
		if openAIErr != nil {
			logger.Printf("OpenAI resume and coverLetter processing failed after %v: %v", time.Since(resumeStart), openAIErr)
		} else {
			logger.Printf("OpenAI resume and coverLetter processing completed in %v", time.Since(resumeStart))
			logger.Printf("Raw JSON: %s", processedDocumentsJSON)
			if err := json.Unmarshal([]byte(processedDocumentsJSON), &processedDocuments); err != nil {
				openAIErr = err
				logger.Printf("Failed to parse processed documents JSON: %v", err)
			}
			// var rawData map[string]interface{}
			// if err := json.Unmarshal([]byte(processedDocumentsJSON), &rawData); err != nil {
			// 	logger.Printf("Failed to unmarshal into map: %v", err)
			// } else {
			// 	logger.Printf("Raw data: %+v", rawData)
			// }
		}
	}()

	go func() {
		defer wg.Done()
		logger.Println("Starting Job Details processing with Nebius")
		//
		fmt.Printf("\033[33mJob Posting: %s\033[0m\n", jobPosting)
		titleStart := time.Now()
		var jobDetailsJSON string
		jobDetailsJSON, openAIErr = openAIProcessor.GenerateSubjectName(jobPosting)
		if openAIErr != nil {
			logger.Printf("Job Details processing failed after %v: %v", time.Since(titleStart), openAIErr)
			return
		}
		logger.Printf("Job Details processing completed in %v", time.Since(titleStart))
		if err := json.Unmarshal([]byte(jobDetailsJSON), &jobDetails); err != nil {
			openAIErr = err
			logger.Printf("Failed to parse job details JSON: %v", err)
		}
	}()

	wg.Wait()
	if openAIErr != nil {
		logger.Printf("OpenAI processing failed: %v", openAIErr)
		handleError(w, fmt.Sprintf("OpenAI processing failed: %v", openAIErr), http.StatusInternalServerError, openAIErr)
		return
	}

	logger.Println("Updating Firestore with completed status")
	update := map[string]interface{}{
		"status":              statusCompleted,
		"original.resumePath": extractedResume,
		"generated": map[string]interface{}{
			"resumePath":      processedDocuments.ProcessedResume,
			"coverLetterPath": processedDocuments.ProcessedCoverLetter,
		},
		"jobDetails": map[string]interface{}{
			"title":   jobDetails.Title,
			"company": jobDetails.Company,
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
		logger.Printf("Failed to update history record: %v", err)
		handleError(w, "Failed to update history record", http.StatusInternalServerError, err)
		return
	}

	response := map[string]interface{}{
		"success":     true,
		"resume":      processedDocuments.ProcessedResume,
		"coverLetter": processedDocuments.ProcessedCoverLetter,
		"historyId":   historyRef.ID,
	}

	logger.Println("Sending successful response to client")
	w.Header().Set("Content-Type", contentTypeJSON)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Printf("Failed to encode response: %v", err)
	}
}

func extractSourceFromURL(url string) string {
	for domain, name := range supportedJobSites {
		if strings.Contains(url, domain) {
			logger.Printf("Identified job source: %s", name)
			return name
		}
	}
	logger.Println("Unknown job source")
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
		logger.Printf("%s: %v", message, err)
	} else {
		logger.Println(message)
	}

	response := map[string]interface{}{
		"success": false,
		"error":   message,
	}

	w.Header().Set("Content-Type", contentTypeJSON)
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Printf("Failed to encode error response: %v", err)
	}
}
