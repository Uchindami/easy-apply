package handlers

import (
	"easy-apply/database"
	"easy-apply/models"
	"easy-apply/services"
	"easy-apply/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/getsentry/sentry-go"
	"github.com/google/uuid"
)


// UploadHandler handles the file upload endpoint.
func UploadHandler(w http.ResponseWriter, r *http.Request) {
	hub := sentry.CurrentHub().Clone()
	ctx := sentry.SetHubOnContext(r.Context(), hub)
	r = r.WithContext(ctx) // Ensure context with hub is propagated

	transaction := sentry.StartTransaction(ctx, fmt.Sprintf("http.handler.%s %s", r.Method, r.URL.Path), sentry.ContinueFromRequest(r))
	defer transaction.Finish()
	hub.ConfigureScope(func(scope *sentry.Scope) {
		scope.SetTag("transaction", transaction.Name)
	})

	userID := r.FormValue("userId") // Get userID early for Sentry user context
	if userID != "" {
		hub.ConfigureScope(func(scope *sentry.Scope) {
			scope.SetUser(sentry.User{ID: userID})
			scope.SetTag("user_id", userID)
		})
	}

	if r.Method != http.MethodPost {
		utils.Logger.Println("UploadHandler: Invalid method attempted:", r.Method)
		hub.WithScope(func(scope *sentry.Scope) {
			scope.SetTag("error_type", "method_not_allowed")
			scope.SetExtra("attempted_method", r.Method)
		})
		// Capture as message because it's a client error, not an unexpected server error
		hub.CaptureMessage("Invalid HTTP method for upload: " + r.Method)
		utils.HandleError(w, r, "Method Not Allowed", http.StatusMethodNotAllowed, fmt.Errorf("method %s not allowed", r.Method))
		return
	}
	handleFileUpload(w, r) // Pass the request with the Sentry-enhanced context
}

func handleFileUpload(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context() // Context already has Sentry hub from UploadHandler
	hub := sentry.GetHubFromContext(ctx)

	span := sentry.StartSpan(ctx, "function.handleFileUpload")
	defer span.Finish()

	utils.Logger.Println("Starting file upload processing in handler")
	startTime := time.Now()
	defer func() {
		duration := time.Since(startTime)
		utils.Logger.Printf("File upload processing in handler completed in %v", duration)
		span.SetData("total_duration_ms", duration.Milliseconds())
	}()

	// services.InitProcessors() // This should be called once at startup in main.go

	formParseSpan := sentry.StartSpan(ctx, "file.parse_multipart_form_handler")
	if err := r.ParseMultipartForm(MaxUploadSize); err != nil { // Use MaxUploadSize from package var
		formParseSpan.SetTag("error", "true")
		formParseSpan.SetData("error_message", err.Error())
		formParseSpan.Status = sentry.SpanStatusInvalidArgument
		formParseSpan.Finish()
		utils.Logger.Printf("Failed to parse multipart form: %v", err)
		hub.WithScope(func(scope *sentry.Scope) {
			scope.SetTag("error_detail", "form_parse_error")
			scope.SetExtra("max_upload_size_bytes", MaxUploadSize)
		})
		utils.HandleError(w, r, "File too large or invalid form data", http.StatusBadRequest, err)
		return
	}
	formParseSpan.Finish()

	userID := strings.TrimSpace(r.FormValue("userId"))
	webLink := strings.TrimSpace(r.FormValue("weblink"))
	// SelectedTemplate and SelectedColors are parsed in sendOpenAIAnalysisAndRespond

	hub.Scope().SetTag("web_link_domain", utils.ExtractDomainFromURL(webLink))
	hub.Scope().SetExtra("web_link_full", webLink)

	validationSpan := sentry.StartSpan(ctx, "validation.upload_request_handler")
	if err := utils.ValidateUploadRequest(userID, webLink); err != nil {
		validationSpan.SetTag("error", "true")
		validationSpan.SetData("error_message", err.Error())
		validationSpan.Status = sentry.SpanStatusInvalidArgument
		validationSpan.Finish()
		hub.WithScope(func(scope *sentry.Scope) { scope.SetTag("error_detail", "upload_request_validation_failed") })
		utils.HandleError(w, r, err.Error(), http.StatusBadRequest, err)
		return
	}
	validationSpan.Finish()

	file, handler, err := r.FormFile("file")
	if err != nil {
		utils.Logger.Printf("Failed to get file from form: %v", err)
		hub.WithScope(func(scope *sentry.Scope) { scope.SetTag("error_detail", "file_retrieval_from_form_failed") })
		utils.HandleError(w, r, "Failed to get uploaded file from form", http.StatusBadRequest, err)
		return
	}
	defer file.Close()

	hub.Scope().SetExtra("upload_filename", handler.Filename)
	hub.Scope().SetExtra("upload_file_size_bytes", handler.Size)
	hub.Scope().SetTag("upload_file_type", filepath.Ext(handler.Filename))

	fileTypeValidationSpan := sentry.StartSpan(ctx, "validation.file_type_handler")
	if err := utils.ValidateFileType(handler.Filename); err != nil {
		fileTypeValidationSpan.SetTag("error", "true")
		fileTypeValidationSpan.SetData("error_message", err.Error())
		fileTypeValidationSpan.Status = sentry.SpanStatusInvalidArgument
		fileTypeValidationSpan.Finish()
		hub.WithScope(func(scope *sentry.Scope) { scope.SetTag("error_detail", "invalid_file_type") })
		utils.HandleError(w, r, err.Error(), http.StatusBadRequest, err)
		return
	}
	fileTypeValidationSpan.Finish()

	fileContentProcessingSpan := sentry.StartSpan(ctx, "file.read_content_bytes_handler")
	fileContent, err := services.ProcessFileContent(ctx, file, handler.Filename)
	fileContentProcessingSpan.Finish() // Status set in service
	if err != nil {
		utils.HandleError(w, r, "Failed to read content from uploaded file", http.StatusInternalServerError, err)
		return
	}

	historyID := uuid.New().String()
	hub.Scope().SetTag("history_id", historyID)

	dbCreateSpan := sentry.StartSpan(ctx, "db.create_initial_history_record_handler")
	if err := database.CreateHistoryRecord(ctx, FirestoreClient, userID, historyID, webLink); err != nil {
		dbCreateSpan.Finish() // Status set in database func
		utils.HandleError(w, r, "Failed to create initial history record", http.StatusInternalServerError, err)
		return
	}
	dbCreateSpan.Finish()

	fileExt := strings.ToLower(filepath.Ext(handler.Filename))

	processingResult, err := services.ProcessFileAndWeb(ctx, fileContent, fileExt, webLink)
	if err != nil {
		utils.HandleError(w, r, fmt.Sprintf("Error during file/web processing: %v", err), http.StatusInternalServerError, err)
		return
	}

	historyRef := FirestoreClient.Collection("Users").Doc(userID).Collection("History").Doc(historyID)
	sendOpenAIAnalysisAndRespond(w, r, processingResult.ScrappedWebJobPosting, processingResult.ExtractedResume, handler.Filename, historyRef)
}

func parseFormJSON[T any](w http.ResponseWriter, r *http.Request, fieldName string, target *T) error {
	// This is a utility function, could also be in utils if used by other handlers
	jsonStr := r.FormValue(fieldName)
	if jsonStr == "" {
		return nil // Empty is valid, leave target as zero value
	}
	if err := json.Unmarshal([]byte(jsonStr), target); err != nil {
		// Use utils.HandleError for consistency if this becomes a user-facing error
		// For now, it's called within sendOpenAIAnalysisAndRespond which has its own error handling.
		utils.Logger.Printf("Failed to parse %s JSON from form: %v. JSON string: %s", fieldName, err, jsonStr)
		return fmt.Errorf("failed to parse %s JSON: %w", fieldName, err)
	}
	return nil
}

func sendOpenAIAnalysisAndRespond(w http.ResponseWriter, r *http.Request, jobPosting, extractedResume, filename string, historyRef *firestore.DocumentRef) {
	ctx := r.Context()
	hub := sentry.GetHubFromContext(ctx)

	span := sentry.StartSpan(ctx, "function.sendOpenAIAnalysisAndRespond")
	defer span.Finish()

	utils.Logger.Println("Starting OpenAI analysis for history:", historyRef.ID)
	startTime := time.Now()
	defer func() {
		duration := time.Since(startTime)
		utils.Logger.Printf("OpenAI analysis and response completed in %v for %s", duration, historyRef.ID)
		span.SetData("total_duration_ms", duration.Milliseconds())
	}()

	hub.Scope().SetTag("operation_stage", "openai_analysis")
	hub.Scope().SetExtra("job_posting_length_openai", len(jobPosting))
	hub.Scope().SetExtra("extracted_resume_length_openai", len(extractedResume))

	var selectedTemplate models.Template
	if err := parseFormJSON(w, r, "selectedTemplate", &selectedTemplate); err != nil {
		utils.HandleError(w, r, fmt.Sprintf("Invalid format for selectedTemplate: %v", err), http.StatusBadRequest, err)
		return
	}

	var selectedColors models.Colors
	if err := parseFormJSON(w, r, "selectedColors", &selectedColors); err != nil {
		utils.HandleError(w, r, fmt.Sprintf("Invalid format for selectedColors: %v", err), http.StatusBadRequest, err)
		return
	}

	processedDocs, jobDetails, err := services.ProcessWithOpenAI(ctx, jobPosting, extractedResume, selectedTemplate.HTMLContent, selectedColors)
	if err != nil {
		utils.HandleError(w, r, fmt.Sprintf("OpenAI processing failed: %v", err), http.StatusInternalServerError, err)
		return
	}

	if extractedSource, ok := jobDetails["source"]; !ok || extractedSource == "" {
		jobDetails["source"] = utils.ExtractSourceFromURL(r.FormValue("weblink"))
	}

	dbUpdateSpan := sentry.StartSpan(ctx, "db.update_final_history_record_handler")
	if err := database.UpdateHistoryRecord(ctx, FirestoreClient, historyRef, extractedResume, processedDocs["resume"], processedDocs["coverLetter"], jobDetails); err != nil {
		dbUpdateSpan.Finish() // Status set in database func
		utils.HandleError(w, r, "Failed to update history record after OpenAI processing", http.StatusInternalServerError, err)
		return
	}
	dbUpdateSpan.Finish()

	hub.Scope().SetTag("operation_status", "success")
	hub.CaptureMessage(fmt.Sprintf("Upload and OpenAI processing completed successfully for history %s", historyRef.ID))

	response := models.UploadResponse{
		Success:     true,
		Resume:      processedDocs["resume"],
		CoverLetter: processedDocs["coverLetter"],
		HistoryID:   historyRef.ID,
		JobTitle:    jobDetails["title"],
		JobCompany:  jobDetails["company"],
	}
	utils.SendJSONResponse(w, r, response, http.StatusOK)
}
