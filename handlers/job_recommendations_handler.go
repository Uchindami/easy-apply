package handlers

import (
	// "context"
	"easy-apply/database"
	"easy-apply/models"
	"easy-apply/services"
	"easy-apply/utils"
	"errors" // For direct error creation
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	// "cloud.google.com/go/firestore" // FirestoreClient is now a package variable
	"github.com/getsentry/sentry-go"
)

// MaxUploadSizeJobRec is the max upload size for recommendation resume, can be different from main upload
var MaxUploadSizeJobRec int64 = 10 << 20 // 10MB, or use the global MaxUploadSize from upload_handler

// JobRecommendationsHandler handles requests for job recommendations.
func JobRecommendationsHandler(w http.ResponseWriter, r *http.Request) {
	hub := sentry.CurrentHub().Clone()
	ctx := sentry.SetHubOnContext(r.Context(), hub)
	r = r.WithContext(ctx)

	transaction := sentry.StartTransaction(ctx, fmt.Sprintf("http.handler.%s %s", r.Method, r.URL.Path), sentry.ContinueFromRequest(r))
	defer transaction.Finish()
	hub.ConfigureScope(func(scope *sentry.Scope) {
		scope.SetTag("transaction", transaction.Name)
	})

	utils.Logger.Println("Received job recommendations request")
	if r.Method != http.MethodPost {
		utils.HandleError(w, r, "Method Not Allowed", http.StatusMethodNotAllowed, fmt.Errorf("method %s not allowed", r.Method))
		return
	}



	parseReqSpan := sentry.StartSpan(ctx, "parse.job_recommendation_request_handler")
	req, err := parseJobRecommendationRequest(r) // r already has ctx
	parseReqSpan.Finish()                        // Status set within parseJobRecommendationRequest if needed
	if err != nil {
		utils.HandleError(w, r, err.Error(), http.StatusBadRequest, err)
		return
	}

	hub.Scope().SetUser(sentry.User{ID: req.UserID}) // Assuming req.UserID is populated
	hub.Scope().SetTag("user_id", req.UserID)
	hub.Scope().SetTag("recommendation_request_type", req.RequestType)
	if req.Filename != "" {
		hub.Scope().SetExtra("recommendation_filename", req.Filename)
	}

	validateReqSpan := sentry.StartSpan(ctx, "validation.job_recommendation_request_handler")
	if err := utils.ValidateJobRecommendationRequest(req); err != nil { // Use utils.ValidateJobRecommendationRequest
		validateReqSpan.SetTag("error", "true")
		validateReqSpan.SetData("error_message", err.Error())
		validateReqSpan.Status = sentry.SpanStatusInvalidArgument
		validateReqSpan.Finish()
		utils.HandleError(w, r, err.Error(), http.StatusBadRequest, err)
		return
	}
	validateReqSpan.Finish()

	if req.RequestType == "saved" {
		industryPreference := req.Resume // For "saved", Resume field contains industry preference
		findJobsSpan := sentry.StartSpan(ctx, "logic.find_jobs_for_saved_user_handler")
		matchedJobs, err := services.FindMatchingJobsForSavedUser(ctx, FirestoreClient, req.UserID, industryPreference)
		findJobsSpan.Finish() // Status set in service
		if err != nil {
			utils.HandleError(w, r, "Failed to find matching jobs for saved user profile", http.StatusInternalServerError, err)
			return
		}
		utils.SendJSONResponse(w, r, models.SavedUserResponse{
			Success:     true,
			MatchedJobs: matchedJobs,
		}, http.StatusOK)
		return
	}

	// Process for "new" request type
	resumeText := req.Resume

	analyzeSpan := sentry.StartSpan(ctx, "logic.analyze_resume_for_recommendation_handler")
	recommendation, err := services.AnalyzeResumeForRecommendation(ctx, resumeText)
	analyzeSpan.Finish() // Status set in service
	if err != nil {
		utils.HandleError(w, r, "Failed to analyze resume for recommendations", http.StatusInternalServerError, err)
		return
	}

	updateUserDbSpan := sentry.StartSpan(ctx, "db.update_user_recommendation_from_analysis_handler")
	if err := database.UpdateUserRecommendation(ctx, FirestoreClient, req.UserID, recommendation, req.Filename); err != nil {
		updateUserDbSpan.Finish() // Status set in database func
		utils.Logger.Printf("Warning: Failed to update user recommendation in DB for user %s: %v", req.UserID, err)
		hub.CaptureException(fmt.Errorf("non-critical: failed to update user recommendation in DB: %w", err))
	} else {
		updateUserDbSpan.Finish()
	}

	findJobsSpan := sentry.StartSpan(ctx, "logic.find_matching_jobs_from_analysis_handler")
	matchedJobs, err := services.FindMatchingJobs(ctx, FirestoreClient, recommendation)
	findJobsSpan.Finish() // Status set in service
	if err != nil {
		utils.Logger.Printf("Warning: Failed to find matching jobs after recommendation analysis for user %s: %v", req.UserID, err)
		hub.CaptureMessage(fmt.Sprintf("Failed to find matching jobs, but recommendation was generated (user: %s): %v", req.UserID, err))
		matchedJobs = []map[string]interface{}{}
	}

	utils.SendJSONResponse(w, r, models.JobRecommendationResponse{
		Success:        true,
		Recommendation: recommendation,
		MatchedJobs:    matchedJobs,
	}, http.StatusOK)
}

func parseJobRecommendationRequest(r *http.Request) (*models.JobRecommendationRequest, error) {
	ctx := r.Context()
	span := sentry.StartSpan(ctx, "function.parseJobRecommendationRequest")
	defer span.Finish()

	// Use MaxUploadSize from upload_handler, assuming it's globally configured
	if err := r.ParseMultipartForm(MaxUploadSize); err != nil {
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusInvalidArgument
		return nil, fmt.Errorf("failed to parse multipart form for recommendation: %w", err)
	}

	userID := r.FormValue("userId")
	requestType := r.FormValue("requestType")
	resumeContentText := r.FormValue("resume")

	span.SetData("user_id_form", userID)
	span.SetData("request_type_form", requestType)
	span.SetData("resume_content_text_length", len(resumeContentText))

	if requestType == "saved" {
		if _, _, err := r.FormFile("resumeFile"); err == nil {
			span.SetTag("error", "true")
			span.SetData("error_message", "file uploaded for saved request type")
			span.Status = sentry.SpanStatusInvalidArgument
			return nil, errors.New("for 'saved' requestType, do not upload a resume file; provide industry/criteria in 'resume' text field")
		}
		return &models.JobRecommendationRequest{
			UserID:      userID,
			Resume:      resumeContentText,
			RequestType: requestType,
		}, nil
	}

	if resumeContentText != "" {
		span.SetData("resume_source", "text_field")
		return &models.JobRecommendationRequest{
			UserID:      userID,
			Resume:      resumeContentText,
			RequestType: requestType,
		}, nil
	}

	file, handler, err := r.FormFile("resumeFile")
	if err != nil {
		span.SetTag("error", "true")
		span.SetData("error_message", "no resume text or file provided for new request")
		span.Status = sentry.SpanStatusInvalidArgument
		return nil, errors.New("for 'new' requestType, resume text in 'resume' field or a 'resumeFile' is required")
	}
	defer file.Close()
	span.SetData("resume_source", "file_upload")
	span.SetData("uploaded_filename", handler.Filename)

	fileTypeValidationSpan := sentry.StartSpan(ctx, "validation.resume_file_type_inline_handler")
	if err := utils.ValidateFileType(handler.Filename); err != nil { // Use utils.ValidateFileType
		fileTypeValidationSpan.SetTag("error", "true")
		fileTypeValidationSpan.SetData("error_message", err.Error())
		fileTypeValidationSpan.Status = sentry.SpanStatusInvalidArgument
		fileTypeValidationSpan.Finish()
		span.Status = sentry.SpanStatusInvalidArgument
		return nil, err
	}
	fileTypeValidationSpan.Finish()

	fileReadSpan := sentry.StartSpan(ctx, "file.read_resume_content_bytes_inline_handler")
	fileContent, err := services.ProcessFileContent(ctx, file, handler.Filename) // Use services.ProcessFileContent
	fileReadSpan.Finish()                                                        // Status set in service
	if err != nil {
		span.Status = sentry.SpanStatusInternalError
		return nil, fmt.Errorf("failed to read uploaded resume file: %w", err)
	}

	fileExt := strings.ToLower(filepath.Ext(handler.Filename))
	extractTextSpan := sentry.StartSpan(ctx, "file.extract_text_from_resume_inline_handler")
	resumeTextFromFile, err := services.ExtractTextFromFile(ctx, fileContent, fileExt) // Use services.ExtractTextFromFile
	extractTextSpan.Finish()                                                           // Status set in service
	if err != nil {
		span.Status = sentry.SpanStatusInternalError
		return nil, err
	}

	return &models.JobRecommendationRequest{
		UserID:      userID,
		Resume:      resumeTextFromFile,
		RequestType: requestType,
		Filename:    handler.Filename,
	}, nil
}
