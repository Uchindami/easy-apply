package models

// RecommendationResult holds the outcome of a resume analysis for job recommendations.
type RecommendationResult struct {
	Industry   string `json:"industry"`
	Domain     string `json:"domain"`
	Confidence string `json:"confidence"`
	Reasoning  string `json:"reasoning"`
}

// ProcessingResult holds the outcome of concurrent file and web processing.
type ProcessingResult struct {
	ExtractedResume       string
	ScrappedWebJobPosting string
	Error                 error
}

// Template defines the structure for a document template.
type Template struct {
	Category    string `json:"category"`
	Description string `json:"description"`
	HTMLContent string `json:"htmlContent"`
	ID          string `json:"id"`
	Name        string `json:"name"`
}

// Colors defines the structure for color theme selection.
type Colors struct {
	Accent    string `json:"accent"`
	ID        string `json:"id"`
	Name      string `json:"name"`
	Primary   string `json:"primary"`
	Secondary string `json:"secondary"`
	Text      string `json:"text"`
}
