package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath" // For robust file extension getting
	"strings"
	"sync"
	"time"

	"easy-apply/processors" // Assuming this package exists and is correct

	"cloud.google.com/go/firestore"
	"github.com/getsentry/sentry-go"
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
	supportedFileTypes = map[string]bool{
		".pdf":  true,
		".docx": true,
		".txt":  true,
	}
	logger = log.New(log.Writer(), "APPLICATION: ", log.LstdFlags|log.Lshortfile)
)

// Request/Response types
type JobRecommendationRequest struct {
	UserID      string `json:"userId"`
	Resume      string `json:"resume"`      // Can be resume text or industry for saved user
	RequestType string `json:"requestType"` // "new", "saved" (for recommendation based on saved profile)
	Filename    string `json:"filename"`    // Original filename if uploaded
}

type RecommendationResult struct {
	Industry   string `json:"industry"`
	Domain     string `json:"domain"`
	Confidence string `json:"confidence"`
	Reasoning  string `json:"reasoning"`
}

type JobRecommendationResponse struct {
	Success        bool                     `json:"success"`
	Recommendation RecommendationResult     `json:"recommendation,omitempty"` // Omit if not applicable
	MatchedJobs    []map[string]interface{} `json:"matchedJobs"`
}

// This can be simplified or merged with JobRecommendationResponse if `requestType` handles it
type SavedUserResponse struct {
	Success     bool                     `json:"success"`
	MatchedJobs []map[string]interface{} `json:"matchedJobs"`
}

type ProcessingResult struct {
	ExtractedResume       string
	ScrappedWebJobPosting string
	Error                 error
}

// Initialization
func initProcessors() {
	processorsOnce.Do(func() {
		logger.Println("Initializing processors...")
		startTime := time.Now()

		fileProcessor = processors.NewFileProcessor()
		webProcessor = processors.NewWebProcessor("")
		var err error
		openAIProcessor, err = processors.NewOpenAIProcessor()
		if err != nil {
			logger.Fatalf("Failed to initialize OpenAIProcessor: %v", err)
		}
		logger.Printf("Processors initialized in %v", time.Since(startTime))
	})
}

// Validation functions
func validateFileType(filename string) error {
	fileExt := strings.ToLower(filepath.Ext(filename))
	if !supportedFileTypes[fileExt] {
		return fmt.Errorf("unsupported file type: %s. Only PDF, DOCX, and TXT files are supported", fileExt)
	}
	return nil
}

func validateUploadRequest(userID, webLink string) error {
	if strings.TrimSpace(userID) == "" {
		return errors.New("user ID is required")
	}
	if strings.TrimSpace(webLink) == "" {
		return errors.New("job posting link is required")
	}
	// Add more validation for webLink if needed (e.g., valid URL format)
	return nil
}

func validateJobRecommendationRequest(req *JobRecommendationRequest) error {
	if strings.TrimSpace(req.UserID) == "" {
		return errors.New("userId is required")
	}
	if req.RequestType == "" {
		return errors.New("requestType is required (e.g., 'new' or 'saved')")
	}
	if req.RequestType != "new" && req.RequestType != "saved" {
		return errors.New("invalid requestType: must be 'new' or 'saved'")
	}
	if req.RequestType == "saved" && req.Filename != "" {
		// For 'saved' type, 'Resume' field should contain industry or criteria, not a new file.
		return errors.New("filename should not be provided when requestType is 'saved'; provide industry/criteria in 'resume' field")
	}
	if req.RequestType == "new" && strings.TrimSpace(req.Resume) == "" && strings.TrimSpace(req.Filename) == "" {
		return errors.New("for requestType 'new', either resume content or a filename for upload is required")
	}
	return nil
}

// File processing functions
func processFileContent(ctx context.Context, file io.Reader, filename string) ([]byte, error) {
	span := sentry.StartSpan(ctx, "file.process_content")
	defer span.Finish()
	span.SetData("filename", filename)

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, file); err != nil {
		span.Status = sentry.SpanStatusAborted // Corrected
		span.SetData("error", err.Error())
		return nil, fmt.Errorf("failed to read file content: %w", err)
	}
	span.SetData("file_size_bytes", buf.Len())
	return buf.Bytes(), nil
}

func extractTextFromFile(ctx context.Context, fileContent []byte, fileExt string) (string, error) {
	span := sentry.StartSpan(ctx, "file.extract_text")
	defer span.Finish()
	span.SetData("file_ext", fileExt)
	span.SetData("file_content_length", len(fileContent))

	startTime := time.Now()
	extractedText, err := fileProcessor.ProcessFileBuffer(fileContent, fileExt) // Assuming ProcessFileBuffer exists
	duration := time.Since(startTime)
	span.SetData("duration_ms", duration.Milliseconds())

	if err != nil {
		logger.Printf("File processing failed after %v: %v", duration, err)
		span.Status = sentry.SpanStatusAborted // Corrected
		span.SetData("error", err.Error())
		return "", fmt.Errorf("file processing failed: %w", err)
	}
	logger.Printf("File processing completed in %v", duration)
	span.SetData("extracted_text_length", len(extractedText))
	return extractedText, nil
}

// Concurrent processing
func processFileAndWeb(ctx context.Context, fileContent []byte, fileExt, webLink string) (*ProcessingResult, error) {
	parentSpan := sentry.SpanFromContext(ctx)
	var span *sentry.Span
	if parentSpan != nil {
		span = parentSpan.StartChild("processing.file_and_web_concurrent")
	} else {
		span = sentry.StartSpan(ctx, "processing.file_and_web_concurrent")
	}
	defer span.Finish()

	var (
		result ProcessingResult
		wg     sync.WaitGroup
		mu     sync.Mutex
		errs   = make(chan error, 2) // Buffered channel to collect errors
	)

	wg.Add(2)

	// Process file
	go func(gCtx context.Context) {
		defer wg.Done()
		taskSpan := sentry.StartSpan(gCtx, "task.extract_text_from_file_async")
		defer taskSpan.Finish()

		logger.Println("Starting file processing in goroutine")
		extractedText, err := extractTextFromFile(gCtx, fileContent, fileExt)

		mu.Lock()
		defer mu.Unlock()

		if err != nil {
			taskSpan.Status = sentry.SpanStatusAborted // Corrected
			taskSpan.SetData("error", err.Error())
			wrappedErr := fmt.Errorf("file processing failed: %w", err)
			if result.Error == nil { // Store first error
				result.Error = wrappedErr
			}
			errs <- wrappedErr // Send error to channel
		} else {
			result.ExtractedResume = extractedText
			taskSpan.SetData("extracted_resume_length", len(extractedText))
		}
	}(sentry.SetHubOnContext(ctx, sentry.CurrentHub().Clone())) // Pass context with cloned hub

	// Process web link
	go func(gCtx context.Context) {
		defer wg.Done()
		taskSpan := sentry.StartSpan(gCtx, "task.scrape_web_link_async")
		defer taskSpan.Finish()
		taskSpan.SetData("web_link", webLink)

		logger.Println("Starting web link processing in goroutine")
		webStart := time.Now()
		// Assuming webProcessor.ProcessWebLink exists
		scrappedContent, err := webProcessor.ProcessWebLink(webLink)
		duration := time.Since(webStart)
		taskSpan.SetData("duration_ms", duration.Milliseconds())

		mu.Lock()
		defer mu.Unlock()

		if err != nil {
			taskSpan.Status = sentry.SpanStatusAborted // Corrected
			taskSpan.SetData("error", err.Error())
			logger.Printf("Web processing failed after %v: %v", duration, err)
			wrappedErr := fmt.Errorf("web processing failed: %w", err)
			if result.Error == nil { // Store first error
				result.Error = wrappedErr
			}
			errs <- wrappedErr // Send error to channel
		} else {
			result.ScrappedWebJobPosting = scrappedContent
			taskSpan.SetData("scrapped_content_length", len(scrappedContent))
			logger.Printf("Web processing completed in %v", duration)
		}
	}(sentry.SetHubOnContext(ctx, sentry.CurrentHub().Clone())) // Pass context with cloned hub

	wg.Wait()
	close(errs) // Close channel once all goroutines are done

	// Check for errors from channel
	var combinedError error
	for e := range errs {
		if combinedError == nil {
			combinedError = e
		} else {
			// Log subsequent errors or combine them if necessary
			logger.Printf("Additional error during concurrent processing: %v", e)
			sentry.CaptureException(fmt.Errorf("additional concurrent error: %w", e)) // Capture additional errors
		}
	}

	if combinedError != nil {
		span.Status = sentry.SpanStatusAborted // Corrected
		span.SetData("error", combinedError.Error())
		return &result, combinedError // Return the first error encountered or a combined one
	}

	span.SetData("extracted_resume_length", len(result.ExtractedResume))
	span.SetData("scrapped_web_job_posting_length", len(result.ScrappedWebJobPosting))
	return &result, nil
}

// Firestore operations
func createHistoryRecord(ctx context.Context, userID, historyID, webLink string) error {
	span := sentry.StartSpan(ctx, "db.create_history_record")
	defer span.Finish()
	span.SetTag("user_id", userID)
	span.SetData("history_id", historyID)
	span.SetData("web_link", webLink)

	if firestoreClient == nil {
		return errors.New("Firestore client not initialized")
	}
	historyRef := firestoreClient.Collection("Users").Doc(userID).Collection("History").Doc(historyID)

	initialHistory := map[string]interface{}{
		"timestamp": firestore.ServerTimestamp,
		"status":    statusProcessing,
		"original": map[string]interface{}{
			"resumePath": "", // This might be updated later if resume was from a file
			"jobLink":    webLink,
		},
		"jobDetails": map[string]interface{}{
			"title":   "Processing...",
			"company": "Processing...",
			"source":  extractSourceFromURL(webLink), // Assuming extractSourceFromURL is defined
		},
		"createdAt": firestore.ServerTimestamp,
	}

	_, err := historyRef.Set(ctx, initialHistory) // Use passed context
	if err != nil {
		span.Status = sentry.SpanStatusAborted // Corrected
		span.SetData("error", err.Error())
		return fmt.Errorf("failed to create history record: %w", err)
	}
	return nil
}

func updateHistoryRecord(ctx context.Context, historyRef *firestore.DocumentRef, extractedResume, processedResume, processedCoverLetter string, jobDetails map[string]string) error {
	span := sentry.StartSpan(ctx, "db.update_history_record")
	defer span.Finish()
	span.SetData("history_ref_path", historyRef.Path)

	updates := []firestore.Update{
		{Path: "status", Value: statusCompleted},
		{Path: "original.resumeText", Value: extractedResume}, // Storing extracted text
		{Path: "generated", Value: map[string]interface{}{
			"resumeText":      processedResume,      // Storing generated text
			"coverLetterText": processedCoverLetter, // Storing generated text
		}},
		{Path: "jobDetails.title", Value: jobDetails["title"]},
		{Path: "jobDetails.company", Value: jobDetails["company"]},
		{Path: "completedAt", Value: firestore.ServerTimestamp},
	}
	// Conditionally update source if available in jobDetails
	if source, ok := jobDetails["source"]; ok && source != "" {
		updates = append(updates, firestore.Update{Path: "jobDetails.source", Value: source})
	}

	_, err := historyRef.Update(ctx, updates) // Use passed context
	if err != nil {
		span.Status = sentry.SpanStatusAborted // Corrected
		span.SetData("error", err.Error())
		return fmt.Errorf("failed to update history record: %w", err)
	}
	return nil
}

func updateUserRecommendation(ctx context.Context, userID string, recommendation RecommendationResult, filename string) error {
	span := sentry.StartSpan(ctx, "db.update_user_recommendation")
	defer span.Finish()
	span.SetTag("user_id", userID)
	span.SetData("filename", filename) // filename of the resume used for this recommendation

	if strings.TrimSpace(userID) == "" {
		err := errors.New("userID cannot be empty when updating Firestore recommendation")
		span.Status = sentry.SpanStatusInvalidArgument // Corrected
		span.SetData("error", err.Error())
		return err
	}
	if firestoreClient == nil {
		return errors.New("Firestore client not initialized")
	}

	userRef := firestoreClient.Collection("Users").Doc(userID)
	updateData := map[string]interface{}{
		"Recommendation": map[string]interface{}{
			"industry":   recommendation.Industry,
			"domain":     recommendation.Domain,
			"confidence": recommendation.Confidence,
			"reasoning":  recommendation.Reasoning,
			"updatedAt":  firestore.ServerTimestamp,
			"sourceFile": filename, // Record which file led to this recommendation
		},
	}
	// If this is a new recommendation from a new resume, update currentDocument
	if filename != "" {
		updateData["currentDocument"] = filename
	}

	_, err := userRef.Set(ctx, updateData, firestore.MergeAll) // Use passed context
	if err != nil {
		span.Status = sentry.SpanStatusAborted // Corrected
		span.SetData("error", err.Error())
		return fmt.Errorf("failed to update user recommendation in Firestore: %w", err)
	}
	return err
}

// OpenAI processing
func processWithOpenAI(ctx context.Context, jobPosting, extractedResume string) (processedDocs map[string]string, jobDetails map[string]string, err error) {
	parentSpan := sentry.SpanFromContext(ctx)
	var span *sentry.Span
	if parentSpan != nil {
		span = parentSpan.StartChild("openai.process_documents_and_details")
	} else {
		span = sentry.StartSpan(ctx, "openai.process_documents_and_details")
	}
	defer func() {
		if err != nil {
			span.Status = sentry.SpanStatusAborted // Corrected
			span.SetData("error", err.Error())
		}
		span.Finish()
	}()

	span.SetData("job_posting_length", len(jobPosting))
	span.SetData("extracted_resume_length", len(extractedResume))

	documents := fmt.Sprintf(`"job_description:"""--- %s ---""" resume:"""--- %s ---"""`, jobPosting, extractedResume)

	var (
		processedDocumentsResult struct {
			ProcessedResume      string `json:"generated_resume"`
			ProcessedCoverLetter string `json:"generated_cover_letter"`
		}
		jobDetailsResult struct {
			Title   string `json:"title"`
			Company string `json:"company_name"`
			Source  string `json:"source_site,omitempty"` // Optional: OpenAI might extract this
		}
		wg       sync.WaitGroup
		mu       sync.Mutex
		errsMu   sync.Mutex
		multiErr []error
	)

	wg.Add(2)

	// Process documents (Resume and Cover Letter)
	go func(gCtx context.Context) {
		defer wg.Done()
		taskSpan := sentry.StartSpan(gCtx, "openai.task.generate_resume_cover_letter")
		defer taskSpan.Finish()
		taskSpan.SetData("input_documents_length", len(documents))

		logger.Println("Starting resume and cover letter processing with OpenAI")
		startTime := time.Now()

	
		processedDocumentsJSON, err := openAIProcessor.ProcessDocuments(documents)
		duration := time.Since(startTime)
		taskSpan.SetData("duration_ms", duration.Milliseconds())

		mu.Lock() // Mutex for processedDocumentsResult
		if err != nil {
			taskSpan.Status = sentry.SpanStatusAborted // Corrected
			taskSpan.SetData("error", err.Error())
			logger.Printf("OpenAI document processing failed after %v: %v", duration, err)

			errsMu.Lock()
			multiErr = append(multiErr, fmt.Errorf("OpenAI document processing failed: %w", err))
			errsMu.Unlock()
			mu.Unlock()
			return
		}
		mu.Unlock()

		logger.Printf("OpenAI document processing completed in %v", duration)
		taskSpan.SetData("output_json_length", len(processedDocumentsJSON))

		if errUnmarshal := json.Unmarshal([]byte(processedDocumentsJSON), &processedDocumentsResult); errUnmarshal != nil {
			taskSpan.Status = sentry.SpanStatusInvalidArgument // Corrected
			taskSpan.SetData("unmarshal_error", errUnmarshal.Error())
			taskSpan.SetData("raw_json_response", processedDocumentsJSON) // Be cautious with PII

			errsMu.Lock()
			multiErr = append(multiErr, fmt.Errorf("failed to parse processed documents JSON: %w", errUnmarshal))
			errsMu.Unlock()
		}
	}(sentry.SetHubOnContext(ctx, sentry.CurrentHub().Clone()))

	// Process job details (Title and Company)
	go func(gCtx context.Context) {
		defer wg.Done()
		taskSpan := sentry.StartSpan(gCtx, "openai.task.extract_job_details")
		defer taskSpan.Finish()
		taskSpan.SetData("job_posting_length", len(jobPosting))

		logger.Println("Starting job details processing with OpenAI")
		startTime := time.Now()

		// Assuming openAIProcessor.GenerateSubjectName extracts title/company
		jobDetailsJSON, err := openAIProcessor.GenerateSubjectName(jobPosting)
		duration := time.Since(startTime)
		taskSpan.SetData("duration_ms", duration.Milliseconds())

		mu.Lock() // Mutex for jobDetailsResult
		if err != nil {
			taskSpan.Status = sentry.SpanStatusAborted // Corrected
			taskSpan.SetData("error", err.Error())
			logger.Printf("Job details processing failed after %v: %v", duration, err)

			errsMu.Lock()
			multiErr = append(multiErr, fmt.Errorf("job details processing failed: %w", err))
			errsMu.Unlock()
			mu.Unlock()
			return
		}
		mu.Unlock()

		logger.Printf("Job details processing completed in %v", duration)
		taskSpan.SetData("output_json_length", len(jobDetailsJSON))

		if errUnmarshal := json.Unmarshal([]byte(jobDetailsJSON), &jobDetailsResult); errUnmarshal != nil {
			taskSpan.Status = sentry.SpanStatusInvalidArgument // Corrected
			taskSpan.SetData("unmarshal_error", errUnmarshal.Error())
			taskSpan.SetData("raw_json_response", jobDetailsJSON) // Be cautious with PII

			errsMu.Lock()
			multiErr = append(multiErr, fmt.Errorf("failed to parse job details JSON: %w", errUnmarshal))
			errsMu.Unlock()
		}
	}(sentry.SetHubOnContext(ctx, sentry.CurrentHub().Clone()))

	wg.Wait()

	if len(multiErr) > 0 {
		// Combine errors or return the first one. Logging all is good.
		for i, e := range multiErr {
			if i > 0 {
				logger.Printf("Additional OpenAI processing error: %v", e)
				sentry.CaptureException(fmt.Errorf("additional openai error: %w", e))
			}
		}
		return nil, nil, multiErr[0] // Return the first error
	}

	processedDocs = map[string]string{
		"resume":      processedDocumentsResult.ProcessedResume,
		"coverLetter": processedDocumentsResult.ProcessedCoverLetter,
	}

	jobDetails = map[string]string{
		"title":   jobDetailsResult.Title,
		"company": jobDetailsResult.Company,
		"source":  jobDetailsResult.Source, // Might be empty
	}

	span.SetData("processed_resume_length", len(processedDocs["resume"]))
	span.SetData("processed_cover_letter_length", len(processedDocs["coverLetter"]))
	span.SetData("extracted_job_title", jobDetails["title"])
	span.SetData("extracted_job_company", jobDetails["company"])

	return processedDocs, jobDetails, nil
}

// Job matching functions
func findMatchingJobs(ctx context.Context, client *firestore.Client, recommendation RecommendationResult) ([]map[string]interface{}, error) {
	span := sentry.StartSpan(ctx, "db.find_matching_jobs")
	defer span.Finish()
	span.SetData("recommendation_industry", recommendation.Industry)
	span.SetData("recommendation_domain", recommendation.Domain)

	if client == nil {
		return nil, errors.New("Firestore client not initialized")
	}
	// Example query: Adjust based on your actual schema and matching logic
	query := client.CollectionGroup("listings").
		Where("industry", "==", recommendation.Industry)
	// You might want to add more filters, e.g., based on domain, or use more complex querying/ranking.

	docs, err := query.Documents(ctx).GetAll() // Use passed context
	if err != nil {
		span.Status = sentry.SpanStatusAborted // Corrected
		span.SetData("error", err.Error())
		return nil, fmt.Errorf("failed to query matching jobs: %w", err)
	}

	var results []map[string]interface{}
	for _, doc := range docs {
		results = append(results, doc.Data())
	}
	span.SetData("matched_jobs_count", len(results))
	return results, nil
}

// findMatchingJobsForSavedUser might use different criteria, e.g., pre-calculated user preferences or a broader search
func findMatchingJobsForSavedUser(ctx context.Context, client *firestore.Client, userID string, industryPreference string) ([]map[string]interface{}, error) {
	span := sentry.StartSpan(ctx, "db.find_matching_jobs_for_saved_user")
	defer span.Finish()
	span.SetTag("user_id", userID)
	span.SetData("industry_preference", industryPreference)

	if client == nil {
		return nil, errors.New("Firestore client not initialized")
	}
	// Query based on the user's saved industry preference
	query := client.CollectionGroup("listings").
		Where("industry", "==", industryPreference)
	// Potentially fetch user's full profile for more nuanced matching in future

	docs, err := query.Documents(ctx).GetAll() // Use passed context
	if err != nil {
		span.Status = sentry.SpanStatusAborted // Corrected
		span.SetData("error", err.Error())
		return nil, fmt.Errorf("failed to query matching jobs for saved user (industry: %s): %w", industryPreference, err)
	}

	var results []map[string]interface{}
	for _, doc := range docs {
		results = append(results, doc.Data())
	}
	span.SetData("matched_jobs_count", len(results))
	return results, nil
}

// HTTP Handlers

// handleError captures the error with Sentry and sends a JSON error response.
func handleError(w http.ResponseWriter, r *http.Request, message string, statusCode int, originalErr error) {
	// Use the hub from the request's context if available, otherwise use the current hub.
	// This ensures the error is associated with the correct transaction/span.
	hub := sentry.GetHubFromContext(r.Context())
	if hub == nil {
		hub = sentry.CurrentHub().Clone() // Clone to avoid modifying global hub's scope
		hub.Scope().SetRequest(r)         // Add request data if not already there
	}

	hub.WithScope(func(scope *sentry.Scope) {
		scope.SetTag("error_source", "api_handler")
		scope.SetTag("status_code", fmt.Sprintf("%d", statusCode))
		scope.SetLevel(getSentryLevel(statusCode)) // Assumes getSentryLevel is defined
		scope.SetContext("error_details", map[string]interface{}{
			"message":     message,
			"status_code": statusCode,
			"path":        r.URL.Path,
			"method":      r.Method,
		})
		// Add a breadcrumb for this specific error handling event
		scope.AddBreadcrumb(&sentry.Breadcrumb{
			Message:  fmt.Sprintf("API error handled: %s", message),
			Category: "api.error",
			Level:    sentry.LevelError, // Breadcrumb level can be different from event level
			Data: map[string]interface{}{
				"status_code": statusCode,
				"path":        r.URL.Path,
			},
		}, 10) // Limit breadcrumbs of this type

		if originalErr != nil {
			// Log with more request context for server logs
			logger.Printf("Error for %s %s: %s (status: %d) - Original: %v", r.Method, r.URL.Path, message, statusCode, originalErr)
			scope.SetExtra("original_error_message", originalErr.Error())
			// Capture the original error for Sentry's issue grouping and stack traces
			hub.CaptureException(originalErr)
		} else {
			logger.Printf("Error for %s %s: %s (status: %d)", r.Method, r.URL.Path, message, statusCode)
			// Capture as a message if there's no underlying Go error object
			hub.CaptureMessage(message)
		}
	})

	response := map[string]interface{}{
		"success": false,
		"error":   message,
	}

	w.Header().Set("Content-Type", contentTypeJSON)
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		// If encoding the error response fails, log it and report to Sentry
		logger.Printf("CRITICAL: Failed to encode error response: %v", err)
		sentry.CaptureException(fmt.Errorf("failed to encode error JSON response for %s: %w", message, err))
	}
}

func sendJSONResponse(w http.ResponseWriter, r *http.Request, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", contentTypeJSON)
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		logger.Printf("Failed to encode JSON response: %v", err)
		// Capture this error in Sentry as it's a server-side issue
		hub := sentry.GetHubFromContext(r.Context())
		if hub == nil {
			hub = sentry.CurrentHub()
		}
		hub.CaptureException(fmt.Errorf("failed to encode JSON response: %w", err))
		// Avoid writing further to w as header might be sent
	}
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	// Clone the hub for this request context to ensure isolation.
	hub := sentry.CurrentHub().Clone()
	// Set the hub on the request's context.
	// This makes the hub available to deeper parts of the application via r.Context().
	ctx := sentry.SetHubOnContext(r.Context(), hub)
	r = r.WithContext(ctx) // Update request with new context

	// Start a transaction for performance monitoring.
	// Using r.URL.Path provides a more specific transaction name than a generic one.
	transaction := sentry.StartTransaction(ctx, fmt.Sprintf("http.handler.%s %s", r.Method, r.URL.Path), sentry.ContinueFromRequest(r))
	defer transaction.Finish()
	// Set transaction on the scope so it's available for error events
	hub.ConfigureScope(func(scope *sentry.Scope) {
		scope.SetTag("transaction", transaction.Name)
	})

	userID := r.FormValue("userId") // Attempt to get userID early for context
	if userID != "" {
		hub.ConfigureScope(func(scope *sentry.Scope) {
			scope.SetUser(sentry.User{ID: userID})
			scope.SetTag("user_id", userID)
		})
	}

	logger.Println("Received upload request for user:", userID)

	if r.Method != http.MethodPost {
		logger.Println("Invalid method attempted:", r.Method)
		hub.WithScope(func(scope *sentry.Scope) {
			scope.SetTag("error_type", "method_not_allowed")
			scope.SetExtra("attempted_method", r.Method)
			scope.SetLevel(sentry.LevelWarning)
		})
		hub.CaptureMessage("Invalid HTTP method attempted for upload")
		// Use the centralized handleError
		handleError(w, r, "Method Not Allowed", http.StatusMethodNotAllowed, errors.New("method not allowed: "+r.Method))
		return
	}

	// Delegate to the actual file upload logic
	// The transaction context is already part of r.Context()
	handleFileUpload(w, r)
}

func handleFileUpload(w http.ResponseWriter, r *http.Request) {
	// The transaction and hub are already on r.Context() from uploadHandler
	ctx := r.Context()
	hub := sentry.GetHubFromContext(ctx) // Should not be nil here

	// Create a child span for the entirety of file upload handling logic.
	// This span will be a child of the transaction started in uploadHandler.
	span := sentry.StartSpan(ctx, "function.handleFileUpload")
	defer span.Finish()

	logger.Println("Starting file upload processing")
	startTime := time.Now()
	defer func() {
		duration := time.Since(startTime)
		logger.Printf("File upload processing completed in %v", duration)
		span.SetData("total_duration_ms", duration.Milliseconds())
		// Additional tracking can be added to the span if needed
	}()

	initProcessors() // Ensure processors are ready

	// Parse form with error tracking
	formParseSpan := sentry.StartSpan(ctx, "file.parse_multipart_form")
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		formParseSpan.SetData("error", err.Error())
		formParseSpan.Status = sentry.SpanStatusInvalidArgument // Corrected
		formParseSpan.Finish()
		logger.Printf("Failed to parse multipart form: %v", err)
		hub.WithScope(func(scope *sentry.Scope) {
			scope.SetTag("error_detail", "form_parse_error")
			scope.SetExtra("max_upload_size_bytes", maxUploadSize)
		})
		handleError(w, r, "File too large or invalid form data", http.StatusBadRequest, err)
		return
	}
	formParseSpan.Finish()

	userID := strings.TrimSpace(r.FormValue("userId"))
	webLink := strings.TrimSpace(r.FormValue("weblink"))

	// Ensure user context is set if not already (e.g. if uploadHandler was bypassed)
	if userID != "" {
		hub.ConfigureScope(func(scope *sentry.Scope) {
			scope.SetUser(sentry.User{ID: userID})
			scope.SetTag("user_id", userID)
		})
	}
	hub.Scope().SetTag("web_link_domain", extractDomainFromURL(webLink)) // Assumes extractDomainFromURL is defined
	hub.Scope().SetExtra("web_link_full", webLink)

	validationSpan := sentry.StartSpan(ctx, "validation.upload_request")
	if err := validateUploadRequest(userID, webLink); err != nil {
		validationSpan.SetData("error", err.Error())
		validationSpan.Status = sentry.SpanStatusInvalidArgument // Corrected
		validationSpan.Finish()
		hub.WithScope(func(scope *sentry.Scope) {
			scope.SetTag("error_detail", "upload_request_validation_failed")
		})
		handleError(w, r, err.Error(), http.StatusBadRequest, err)
		return
	}
	validationSpan.Finish()

	file, handler, err := r.FormFile("file")
	if err != nil {
		logger.Printf("Failed to get file from form: %v", err)
		hub.WithScope(func(scope *sentry.Scope) {
			scope.SetTag("error_detail", "file_retrieval_from_form_failed")
		})
		handleError(w, r, "Failed to get uploaded file from form", http.StatusBadRequest, err)
		return
	}
	defer file.Close()

	hub.Scope().SetExtra("upload_filename", handler.Filename)
	hub.Scope().SetExtra("upload_file_size_bytes", handler.Size)
	hub.Scope().SetTag("upload_file_type", filepath.Ext(handler.Filename))

	fileTypeValidationSpan := sentry.StartSpan(ctx, "validation.file_type")
	if err := validateFileType(handler.Filename); err != nil {
		fileTypeValidationSpan.SetData("error", err.Error())
		fileTypeValidationSpan.Status = sentry.SpanStatusInvalidArgument // Corrected
		fileTypeValidationSpan.Finish()
		hub.WithScope(func(scope *sentry.Scope) {
			scope.SetTag("error_detail", "invalid_file_type")
		})
		handleError(w, r, err.Error(), http.StatusBadRequest, err)
		return
	}
	fileTypeValidationSpan.Finish()

	fileContentProcessingSpan := sentry.StartSpan(ctx, "file.read_content_bytes")
	fileContent, err := processFileContent(ctx, file, handler.Filename) // Pass ctx
	fileContentProcessingSpan.Finish()                                  // Finish regardless of error, status set in processFileContent
	if err != nil {
		// processFileContent already logged and set span status
		handleError(w, r, "Failed to read content from uploaded file", http.StatusInternalServerError, err)
		return
	}

	historyID := uuid.New().String()
	hub.Scope().SetTag("history_id", historyID)

	dbCreateSpan := sentry.StartSpan(ctx, "db.create_initial_history_record")
	if err := createHistoryRecord(ctx, userID, historyID, webLink); err != nil { // Pass ctx
		dbCreateSpan.SetData("error", err.Error())
		dbCreateSpan.Status = sentry.SpanStatusAborted // Corrected
		dbCreateSpan.Finish()
		handleError(w, r, "Failed to create initial history record", http.StatusInternalServerError, err)
		return
	}
	dbCreateSpan.Finish()

	fileExt := strings.ToLower(filepath.Ext(handler.Filename))

	// Concurrent processing of file and web link
	// processFileAndWeb will create its own top-level span for the concurrent work
	processingResult, err := processFileAndWeb(ctx, fileContent, fileExt, webLink) // Pass ctx
	if err != nil {
		// processFileAndWeb already logged, set span status, and captured errors
		handleError(w, r, fmt.Sprintf("Error during file/web processing: %v", err), http.StatusInternalServerError, err)
		return
	}

	historyRef := firestoreClient.Collection("Users").Doc(userID).Collection("History").Doc(historyID)

	// Delegate to OpenAI analysis and final response
	// This function will handle its own Sentry span for OpenAI operations
	sendOpenAIAnalysisAndRespond(w, r, processingResult.ScrappedWebJobPosting, processingResult.ExtractedResume, handler.Filename, historyRef)
}

func sendOpenAIAnalysisAndRespond(w http.ResponseWriter, r *http.Request, jobPosting, extractedResume, filename string, historyRef *firestore.DocumentRef) {
	ctx := r.Context() // Get context from request, which includes Sentry hub and transaction
	hub := sentry.GetHubFromContext(ctx)

	span := sentry.StartSpan(ctx, "function.sendOpenAIAnalysisAndRespond")
	defer span.Finish()

	logger.Println("Starting OpenAI analysis for history:", historyRef.ID)
	startTime := time.Now()
	defer func() {
		duration := time.Since(startTime)
		logger.Printf("OpenAI analysis and response completed in %v for %s", duration, historyRef.ID)
		span.SetData("total_duration_ms", duration.Milliseconds())
	}()

	hub.Scope().SetTag("operation_stage", "openai_analysis")
	hub.Scope().SetExtra("job_posting_length_openai", len(jobPosting))
	hub.Scope().SetExtra("extracted_resume_length_openai", len(extractedResume))

	// processWithOpenAI will create its own span for the OpenAI calls
	processedDocs, jobDetails, err := processWithOpenAI(ctx, jobPosting, extractedResume) // Pass ctx
	if err != nil {
		// processWithOpenAI already logged, set span status, and captured errors
		handleError(w, r, fmt.Sprintf("OpenAI processing failed: %v", err), http.StatusInternalServerError, err)
		return
	}

	// If OpenAI extracted a source, prefer it, otherwise keep original from URL
	if extractedSource, ok := jobDetails["source"]; !ok || extractedSource == "" {
		jobDetails["source"] = extractSourceFromURL(r.FormValue("weblink")) // Use original weblink
	}

	dbUpdateSpan := sentry.StartSpan(ctx, "db.update_final_history_record")
	if err := updateHistoryRecord(ctx, historyRef, extractedResume, processedDocs["resume"], processedDocs["coverLetter"], jobDetails); err != nil { // Pass ctx
		dbUpdateSpan.SetData("error", err.Error())
		dbUpdateSpan.Status = sentry.SpanStatusAborted // Corrected
		dbUpdateSpan.Finish()
		handleError(w, r, "Failed to update history record after OpenAI processing", http.StatusInternalServerError, err)
		return
	}
	dbUpdateSpan.Finish()

	hub.Scope().SetTag("operation_status", "success")
	hub.Scope().SetLevel(sentry.LevelInfo) // For successful completion message
	hub.CaptureMessage(fmt.Sprintf("Upload and OpenAI processing completed successfully for history %s", historyRef.ID))

	response := map[string]interface{}{
		"success":     true,
		"resume":      processedDocs["resume"],
		"coverLetter": processedDocs["coverLetter"],
		"historyId":   historyRef.ID,
		"jobTitle":    jobDetails["title"],
		"jobCompany":  jobDetails["company"],
	}
	sendJSONResponse(w, r, response, http.StatusOK)
}

func jobRecommendationsHandler(w http.ResponseWriter, r *http.Request) {
	hub := sentry.CurrentHub().Clone()
	ctx := sentry.SetHubOnContext(r.Context(), hub)
	r = r.WithContext(ctx)

	transaction := sentry.StartTransaction(ctx, fmt.Sprintf("http.handler.%s %s", r.Method, r.URL.Path), sentry.ContinueFromRequest(r))
	defer transaction.Finish()
	hub.ConfigureScope(func(scope *sentry.Scope) {
		scope.SetTag("transaction", transaction.Name)
	})

	logger.Println("Received job recommendations request")
	if r.Method != http.MethodPost {
		handleError(w, r, "Method Not Allowed", http.StatusMethodNotAllowed, errors.New("method not allowed: "+r.Method))
		return
	}

	initProcessors()

	parseReqSpan := sentry.StartSpan(ctx, "parse.job_recommendation_request")
	req, err := parseJobRecommendationRequest(r) // r already has ctx
	parseReqSpan.Finish()                        // Status set within parseJobRecommendationRequest if needed
	if err != nil {
		handleError(w, r, err.Error(), http.StatusBadRequest, err)
		return
	}

	hub.Scope().SetUser(sentry.User{ID: req.UserID})
	hub.Scope().SetTag("user_id", req.UserID)
	hub.Scope().SetTag("recommendation_request_type", req.RequestType)
	if req.Filename != "" {
		hub.Scope().SetExtra("recommendation_filename", req.Filename)
	}

	validateReqSpan := sentry.StartSpan(ctx, "validation.job_recommendation_request")
	if err := validateJobRecommendationRequest(req); err != nil {
		validateReqSpan.SetData("error", err.Error())
		validateReqSpan.Status = sentry.SpanStatusInvalidArgument // Corrected
		validateReqSpan.Finish()
		handleError(w, r, err.Error(), http.StatusBadRequest, err)
		return
	}
	validateReqSpan.Finish()

	if req.RequestType == "saved" {
		// For "saved", req.Resume is expected to be the industry preference
		industryPreference := req.Resume
		findJobsSpan := sentry.StartSpan(ctx, "logic.find_jobs_for_saved_user")
		matchedJobs, err := findMatchingJobsForSavedUser(ctx, firestoreClient, req.UserID, industryPreference)
		findJobsSpan.Finish() // Status set in findMatchingJobsForSavedUser
		if err != nil {
			handleError(w, r, "Failed to find matching jobs for saved user profile", http.StatusInternalServerError, err)
			return
		}
		sendJSONResponse(w, r, SavedUserResponse{
			Success:     true,
			MatchedJobs: matchedJobs,
		}, http.StatusOK)
		return
	}

	// Process for "new" request type (new resume text or uploaded file)
	// Resume text is already in req.Resume from parseJobRecommendationRequest
	resumeText := req.Resume

	analyzeSpan := sentry.StartSpan(ctx, "logic.analyze_resume_for_recommendation")
	recommendation, err := analyzeResumeForRecommendation(ctx, resumeText) // Pass ctx
	analyzeSpan.Finish()                                                   // Status set in analyzeResumeForRecommendation
	if err != nil {
		handleError(w, r, "Failed to analyze resume for recommendations", http.StatusInternalServerError, err)
		return
	}

	updateUserDbSpan := sentry.StartSpan(ctx, "db.update_user_recommendation_from_analysis")
	if err := updateUserRecommendation(ctx, req.UserID, recommendation, req.Filename); err != nil { // Pass ctx
		updateUserDbSpan.Finish() // Status set in updateUserRecommendation
		// Log error but proceed to find jobs if possible, as recommendation itself might be useful
		logger.Printf("Warning: Failed to update user recommendation in DB for user %s: %v", req.UserID, err)
		hub.CaptureException(fmt.Errorf("non-critical: failed to update user recommendation in DB: %w", err))
	} else {
		updateUserDbSpan.Finish()
	}

	findJobsSpan := sentry.StartSpan(ctx, "logic.find_matching_jobs_from_analysis")
	matchedJobs, err := findMatchingJobs(ctx, firestoreClient, recommendation) // Pass ctx
	findJobsSpan.Finish()                                                      // Status set in findMatchingJobs
	if err != nil {
		logger.Printf("Warning: Failed to find matching jobs after recommendation analysis for user %s: %v", req.UserID, err)
		hub.CaptureMessage(fmt.Sprintf("Failed to find matching jobs, but recommendation was generated (user: %s): %v", req.UserID, err))
		matchedJobs = []map[string]interface{}{} // Send empty list, but success is true for recommendation
	}

	sendJSONResponse(w, r, JobRecommendationResponse{
		Success:        true,
		Recommendation: recommendation,
		MatchedJobs:    matchedJobs,
	}, http.StatusOK)
}

func parseJobRecommendationRequest(r *http.Request) (*JobRecommendationRequest, error) {
	ctx := r.Context() // Get context which should have Sentry hub/transaction
	span := sentry.StartSpan(ctx, "function.parseJobRecommendationRequest")
	defer span.Finish()

	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		span.SetData("error", err.Error())
		span.Status = sentry.SpanStatusInvalidArgument // Corrected
		return nil, fmt.Errorf("failed to parse multipart form for recommendation: %w", err)
	}

	userID := r.FormValue("userId")
	requestType := r.FormValue("requestType")
	resumeContentText := r.FormValue("resume") // This field can be resume text OR industry for "saved"

	span.SetData("user_id_form", userID)
	span.SetData("request_type_form", requestType)
	span.SetData("resume_content_text_length", len(resumeContentText))

	// If requestType is "saved", resumeContentText is the industry/criteria, not a resume to parse.
	// Filename should not be present for "saved".
	if requestType == "saved" {
		if _, _, err := r.FormFile("resumeFile"); err == nil { // Check if a file was unexpectedly uploaded
			span.SetData("error", "file uploaded for saved request type")
			span.Status = sentry.SpanStatusInvalidArgument // Corrected
			return nil, errors.New("for 'saved' requestType, do not upload a resume file; provide industry/criteria in 'resume' text field")
		}
		return &JobRecommendationRequest{
			UserID:      userID,
			Resume:      resumeContentText, // This is industry/criteria for "saved"
			RequestType: requestType,
		}, nil
	}

	// For "new" requestType, expect either resume text or a file.
	if resumeContentText != "" {
		span.SetData("resume_source", "text_field")
		return &JobRecommendationRequest{
			UserID:      userID,
			Resume:      resumeContentText, // Actual resume text
			RequestType: requestType,
			// Filename is not applicable here as it's from text
		}, nil
	}

	// Try file upload if resume text is not provided for "new" type
	file, handler, err := r.FormFile("resumeFile") // Use a distinct form field name like "resumeFile"
	if err != nil {
		// If no text and no file for "new" type.
		span.SetData("error", "no resume text or file provided for new request")
		span.Status = sentry.SpanStatusInvalidArgument // Corrected
		return nil, errors.New("for 'new' requestType, resume text in 'resume' field or a 'resumeFile' is required")
	}
	defer file.Close()
	span.SetData("resume_source", "file_upload")
	span.SetData("uploaded_filename", handler.Filename)

	fileTypeValidationSpan := sentry.StartSpan(ctx, "validation.resume_file_type_inline")
	if err := validateFileType(handler.Filename); err != nil {
		fileTypeValidationSpan.SetData("error", err.Error())
		fileTypeValidationSpan.Status = sentry.SpanStatusInvalidArgument // Corrected
		fileTypeValidationSpan.Finish()
		span.Status = sentry.SpanStatusInvalidArgument // Mark parent span as well // Corrected
		return nil, err
	}
	fileTypeValidationSpan.Finish()

	fileReadSpan := sentry.StartSpan(ctx, "file.read_resume_content_bytes_inline")
	fileContent, err := processFileContent(ctx, file, handler.Filename) // Pass ctx
	fileReadSpan.Finish()                                               // Status set in processFileContent
	if err != nil {
		span.Status = sentry.SpanStatusInternalError // Corrected
		return nil, fmt.Errorf("failed to read uploaded resume file: %w", err)
	}

	fileExt := strings.ToLower(filepath.Ext(handler.Filename))
	extractTextSpan := sentry.StartSpan(ctx, "file.extract_text_from_resume_inline")
	resumeTextFromFile, err := extractTextFromFile(ctx, fileContent, fileExt) // Pass ctx
	extractTextSpan.Finish()                                                  // Status set in extractTextFromFile
	if err != nil {
		span.Status = sentry.SpanStatusInternalError // Corrected
		return nil, err
	}

	return &JobRecommendationRequest{
		UserID:      userID,
		Resume:      resumeTextFromFile,
		RequestType: requestType,
		Filename:    handler.Filename, // Store original filename
	}, nil
}

// analyzeResumeForRecommendation processes resume text using OpenAI.
func analyzeResumeForRecommendation(ctx context.Context, resumeText string) (RecommendationResult, error) {
	span := sentry.StartSpan(ctx, "openai.analyze_resume_for_recommendation")
	defer span.Finish()
	span.SetData("resume_text_length", len(resumeText))

	var recommendation RecommendationResult

	if openAIProcessor == nil {
		err := errors.New("OpenAI processor not initialized")
		span.Status = sentry.SpanStatusInternalError // Corrected
		span.SetData("error", err.Error())
		return recommendation, err
	}

	// Assuming openAIProcessor.AnalyzeResumeForRecommendation exists
	recommendationJSON, err := openAIProcessor.AnalyzeResumeForRecommendation(resumeText)
	if err != nil {
		span.Status = sentry.SpanStatusAborted // Or other appropriate status // Corrected
		span.SetData("openai_call_error", err.Error())
		return recommendation, fmt.Errorf("OpenAI analysis for recommendation failed: %w", err)
	}
	span.SetData("openai_response_json_length", len(recommendationJSON))

	if err := json.Unmarshal([]byte(recommendationJSON), &recommendation); err != nil {
		span.Status = sentry.SpanStatusInvalidArgument // JSON from OpenAI was malformed // Corrected
		span.SetData("unmarshal_error", err.Error())
		span.SetData("raw_json_response", recommendationJSON) // Be cautious with PII
		return recommendation, fmt.Errorf("failed to parse recommendation JSON from OpenAI: %w", err)
	}

	span.SetData("parsed_industry", recommendation.Industry)
	span.SetData("parsed_domain", recommendation.Domain)

	return recommendation, nil
}

// Utility functions
func extractSourceFromURL(urlStr string) string {
	// This is a simplified version. For robust parsing, use url.Parse
	// and then extract the hostname.
	for domain, name := range supportedJobSites {
		if strings.Contains(urlStr, domain) {
			logger.Printf("Identified job source: %s from URL: %s", name, urlStr)
			return name
		}
	}
	logger.Printf("Unknown job source for URL: %s", urlStr)
	return "Other" // Default if no match
}

func extractDomainFromURL(urlStr string) string {
	// A more robust way to get domain might involve url.Parse
	// For simplicity, this is a basic string manipulation.
	if !strings.Contains(urlStr, "://") {
		urlStr = "http://" + urlStr // Prepend scheme if missing for url.Parse
	}
	// Using http.NewRequest to parse URL is a bit heavy for just hostname.
	// url.Parse is more direct.
	parsedURL, err := http.NewRequest("GET", urlStr, nil) // Still using NewRequest for consistency with previous code if it has other uses.
	// For just hostname, `url.Parse(urlStr)` is better.
	if err == nil && parsedURL.URL != nil {
		host := parsedURL.URL.Hostname()
		// Basic domain extraction, might not cover all TLDs perfectly (e.g. co.uk)
		// For more robust extraction, a dedicated library or more complex logic is needed.
		// For now, returning the full host is safest.
		return host
	}
	return "unknown_domain"
}
