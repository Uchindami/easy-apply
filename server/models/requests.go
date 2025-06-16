package models

// JobRecommendationRequest is the structure for requesting job recommendations.
type JobRecommendationRequest struct {
	UserID      string `json:"userId"`
	Resume      string `json:"resume"`      // Can be resume text or industry for saved user
	RequestType string `json:"requestType"` // "new", "saved" (for recommendation based on saved profile)
	Filename    string `json:"filename"`    // Original filename if uploaded
}
