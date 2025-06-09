package models

// JobRecommendationResponse is the structure for responding with job recommendations.
type JobRecommendationResponse struct {
	Success        bool                     `json:"success"`
	Recommendation RecommendationResult     `json:"recommendation,omitempty"` // Omit if not applicable
	MatchedJobs    []map[string]interface{} `json:"matchedJobs"`
}

// SavedUserResponse is the structure for responding to requests for saved users in Job Recommendations.
type SavedUserResponse struct {
	Success     bool                     `json:"success"`
	MatchedJobs []map[string]interface{} `json:"matchedJobs"`
}

// UploadResponse is the structure for responding to file uploads.
// This is derived from the original response in sendOpenAIAnalysisAndRespond
type UploadResponse struct {
	Success     bool   `json:"success"`
	Resume      string `json:"resume"`
	CoverLetter string `json:"coverLetter"`
	HistoryID   string `json:"historyId"`
	JobTitle    string `json:"jobTitle"`
	JobCompany  string `json:"jobCompany"`
	Error       string `json:"error,omitempty"`
}
