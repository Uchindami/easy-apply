package utils

import (
	"easy-apply/models" // Assuming models are in this path
	"errors"
	"fmt"
	"path/filepath"
	"strings"
)

// SupportedFileTypes defines the allowed file extensions for upload.
var SupportedFileTypes = map[string]bool{
	".pdf":  true,
	".docx": true,
	".txt":  true,
}

// ValidateFileType checks if the uploaded file type is supported.
func ValidateFileType(filename string) error {
	fileExt := strings.ToLower(filepath.Ext(filename))
	if !SupportedFileTypes[fileExt] {
		return fmt.Errorf("unsupported file type: %s. Only PDF, DOCX, and TXT files are supported", fileExt)
	}
	return nil
}

// ValidateUploadRequest validates the parameters for a file upload request.
func ValidateUploadRequest(userID, webLink string) error {
	if strings.TrimSpace(userID) == "" {
		return errors.New("user ID is required")
	}
	if strings.TrimSpace(webLink) == "" {
		return errors.New("job posting link is required")
	}
	// Add more validation for webLink if needed (e.g., valid URL format)
	return nil
}

// ValidateJobRecommendationRequest validates the parameters for a job recommendation request.
func ValidateJobRecommendationRequest(req *models.JobRecommendationRequest) error {
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
		return errors.New("filename should not be provided when requestType is 'saved'; provide industry/criteria in 'resume' field")
	}
	if req.RequestType == "new" && strings.TrimSpace(req.Resume) == "" && strings.TrimSpace(req.Filename) == "" {
		return errors.New("for requestType 'new', either resume content or a filename for upload is required")
	}
	return nil
}
