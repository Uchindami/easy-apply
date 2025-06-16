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
	"easy-apply/sse"
	"github.com/getsentry/sentry-go"
	"github.com/google/uuid"
)

// UploadHandler handles the file upload and processing request
func UploadHandler(w http.ResponseWriter, r *http.Request) {
	hub := sentry.CurrentHub().Clone()
	ctx := sentry.SetHubOnContext(r.Context(), hub)
	r = r.WithContext(ctx)

	transaction := sentry.StartTransaction(ctx, fmt.Sprintf("http.handler.%s %s", r.Method, r.URL.Path), sentry.ContinueFromRequest(r))
	defer transaction.Finish()

	userID := r.FormValue("userId")
	if userID != "" {
		hub.ConfigureScope(func(scope *sentry.Scope) {
			scope.SetUser(sentry.User{ID: userID})
			scope.SetTag("user_id", userID)
		})
	}

	if r.Method != http.MethodPost {
		utils.Logger.Println("UploadHandler: Invalid method attempted:", r.Method)
		hub.CaptureMessage("Invalid HTTP method for upload: " + r.Method)
		utils.HandleError(w, r, "Method Not Allowed", http.StatusMethodNotAllowed, fmt.Errorf("method %s not allowed", r.Method))
		return
	}

	handleFileUpload(w, r)
}

func handleFileUpload(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	hub := sentry.GetHubFromContext(ctx)
	span := sentry.StartSpan(ctx, "function.handleFileUpload")
	defer span.Finish()

	utils.Logger.Println("Starting file upload processing in handler")

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.Logger.Printf("Failed to parse multipart form: %v", err)
		utils.HandleError(w, r, "File too large or invalid form data", http.StatusBadRequest, err)
		return
	}

	channelID := r.FormValue("channelId")
	userID := strings.TrimSpace(r.FormValue("userId"))
	webLink := strings.TrimSpace(r.FormValue("weblink"))

	// *** ADD THIS DELAY ***
	// This brief pause allows the frontend's SSE connection request to complete
	// and register the client on the backend. 500ms is usually sufficient.
	time.Sleep(500 * time.Millisecond)
	
	// Send initial progress
	sse.SendProgress(channelID, "upload", "active", "Parsing and validating uploaded file...")
	sse.SendProgress(channelID, "upload", "active", "Your progress message...")
	
	if err := utils.ValidateUploadRequest(userID, webLink); err != nil {
		sse.SendProgress(channelID, "upload", "failed", "Invalid request data: "+err.Error())
		utils.HandleError(w, r, err.Error(), http.StatusBadRequest, err)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		sse.SendProgress(channelID, "upload", "failed", "Could not read file from form.")
		utils.HandleError(w, r, "Failed to get uploaded file from form", http.StatusBadRequest, err)
		return
	}
	defer file.Close()

	if err := utils.ValidateFileType(handler.Filename); err != nil {
		sse.SendProgress(channelID, "upload", "failed", "Invalid file type. Please use PDF or DOCX.")
		utils.HandleError(w, r, err.Error(), http.StatusBadRequest, err)
		return
	}

	sse.SendProgress(channelID, "upload", "complete", "File validated successfully.")
	sse.SendProgress(channelID, "processing", "active", "Extracting content from resume and job posting...")

	fileContent, err := services.ProcessFileContent(ctx, file, handler.Filename)
	if err != nil {
		sse.SendProgress(channelID, "processing", "failed", "Failed to read file content: "+err.Error())
		utils.HandleError(w, r, "Failed to read content from uploaded file", http.StatusInternalServerError, err)
		return
	}

	historyID := uuid.New().String()
	hub.Scope().SetTag("history_id", historyID)

	if err := database.CreateHistoryRecord(ctx, FirestoreClient, userID, historyID, webLink); err != nil {
		sse.SendProgress(channelID, "processing", "failed", "Database error occurred.")
		utils.HandleError(w, r, "Failed to create initial history record", http.StatusInternalServerError, err)
		return
	}

	fileExt := strings.ToLower(filepath.Ext(handler.Filename))
	processingResult, err := services.ProcessFileAndWeb(ctx, fileContent, fileExt, webLink)
	if err != nil {
		sse.SendProgress(channelID, "processing", "failed", "Error during file/web processing: "+err.Error())
		utils.HandleError(w, r, fmt.Sprintf("Error during file/web processing: %v", err), http.StatusInternalServerError, err)
		return
	}

	sse.SendProgress(channelID, "processing", "complete", "Content extraction successful.")

	historyRef := FirestoreClient.Collection("Users").Doc(userID).Collection("History").Doc(historyID)
	sendOpenAIAnalysisAndRespond(w, r, processingResult.ScrappedWebJobPosting, processingResult.ExtractedResume, handler.Filename, historyRef, channelID)
}

func sendOpenAIAnalysisAndRespond(w http.ResponseWriter, r *http.Request, jobPosting, extractedResume, filename string, historyRef *firestore.DocumentRef, channelID string) {
	ctx := r.Context()
	span := sentry.StartSpan(ctx, "function.sendOpenAIAnalysisAndRespond")
	defer span.Finish()

	sse.SendProgress(channelID, "analysis", "active", "Tailoring your documents with AI...")

	var selectedTemplate models.Template
	if err := parseFormJSON(w, r, "selectedTemplate", &selectedTemplate); err != nil {
		sse.SendProgress(channelID, "analysis", "failed", "Invalid template data: "+err.Error())
		utils.HandleError(w, r, fmt.Sprintf("Invalid format for selectedTemplate: %v", err), http.StatusBadRequest, err)
		return
	}

	var selectedColors models.Colors
	if err := parseFormJSON(w, r, "selectedColors", &selectedColors); err != nil {
		sse.SendProgress(channelID, "analysis", "failed", "Invalid color data: "+err.Error())
		utils.HandleError(w, r, fmt.Sprintf("Invalid format for selectedColors: %v", err), http.StatusBadRequest, err)
		return
	}

	processedDocs, jobDetails, err := services.ProcessWithOpenAI(ctx, jobPosting, extractedResume, selectedTemplate.HTMLContent, selectedColors)
	if err != nil {
		sse.SendProgress(channelID, "analysis", "failed", "An error occurred during AI processing: "+err.Error())
		utils.HandleError(w, r, fmt.Sprintf("OpenAI processing failed: %v", err), http.StatusInternalServerError, err)
		return
	}

	sse.SendProgress(channelID, "analysis", "complete", "AI tailoring complete.")
	sse.SendProgress(channelID, "finalizing", "active", "Finalizing and saving documents...")

	if extractedSource, ok := jobDetails["source"]; !ok || extractedSource == "" {
		jobDetails["source"] = utils.ExtractSourceFromURL(r.FormValue("weblink"))
	}

	if err := database.UpdateHistoryRecord(ctx, FirestoreClient, historyRef, extractedResume, processedDocs["resume"], processedDocs["coverLetter"], jobDetails); err != nil {
		sse.SendProgress(channelID, "finalizing", "failed", "Failed to save the generated documents: "+err.Error())
		utils.HandleError(w, r, "Failed to update history record after OpenAI processing", http.StatusInternalServerError, err)
		return
	}

	sse.SendProgress(channelID, "finalizing", "complete", "Your documents are ready!")

	// Small delay to ensure the final progress message is sent before response
	time.Sleep(100 * time.Millisecond)

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

func parseFormJSON[T any](w http.ResponseWriter, r *http.Request, fieldName string, target *T) error {
	jsonStr := r.FormValue(fieldName)
	if jsonStr == "" {
		return nil
	}
	if err := json.Unmarshal([]byte(jsonStr), target); err != nil {
		utils.Logger.Printf("Failed to parse %s JSON from form: %v. JSON string: %s", fieldName, err, jsonStr)
		return fmt.Errorf("failed to parse %s JSON: %w", fieldName, err)
	}
	return nil
}
