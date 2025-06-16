package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// LinkResult represents the result of a link validation
type LinkResult struct {
	Valid      bool   `json:"valid"`
	Status     int    `json:"status,omitempty"`
	URL        string `json:"url,omitempty"`
	Reason     string `json:"reason,omitempty"`
	RedirectTo string `json:"redirectTo,omitempty"`
	Error      string `json:"error,omitempty"`
}

func ValidateURLHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the URL from query parameters
	url := r.URL.Query().Get("url")
	if url == "" {
		http.Error(w, "Missing 'url' parameter", http.StatusBadRequest)
		return
	}

	// Validate the URL
	result := IsValidLink(url)

	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	if result.Valid {
		w.WriteHeader(http.StatusOK)
	} else {
		w.WriteHeader(http.StatusBadRequest)
	}

	// Write the result as JSON
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

// IsValidLink checks if a URL is valid by making an HTTP HEAD request
func IsValidLink(url string) LinkResult {
	// Add protocol if missing
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "https://" + url
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Don't follow redirects - we want to detect them
			return http.ErrUseLastResponse
		},
	}

	// Make HEAD request to avoid downloading full content
	resp, err := client.Head(url)
	if err != nil {
		return LinkResult{
			Valid:  false,
			Error:  err.Error(),
			Reason: "Request failed: Please check the Link",
		}
	}
	defer resp.Body.Close()

	// Check if response is successful (2xx status codes)
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return LinkResult{
			Valid:  true,
			Status: resp.StatusCode,
			URL:    resp.Request.URL.String(),
		}
	}

	// Check if it's a redirect (3xx status codes)
	if resp.StatusCode >= 300 && resp.StatusCode < 400 {
		location := resp.Header.Get("Location")
		return LinkResult{
			Valid:      false,
			Status:     resp.StatusCode,
			Reason:     "Redirect detected: The link redirects to another URL",
			RedirectTo: location,
		}
	}

	// Other error status codes (4xx, 5xx)
	return LinkResult{
		Valid:  false,
		Status: resp.StatusCode,
		Reason: fmt.Sprintf("The website is not supported: HTTP %d error", resp.StatusCode),
	}
}

// IsValidLinkWithFollowRedirect checks validity but allows following redirects
func IsValidLinkWithFollowRedirect(url string) LinkResult {
	// Add protocol if missing
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "https://" + url
	}

	// Create HTTP client with timeout (default redirect behavior)
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Head(url)
	if err != nil {
		return LinkResult{
			Valid:  false,
			Error:  err.Error(),
			Reason: "Request failed",
		}
	}
	defer resp.Body.Close()

	// Check if final response is successful
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return LinkResult{
			Valid:  true,
			Status: resp.StatusCode,
			URL:    resp.Request.URL.String(),
		}
	}

	return LinkResult{
		Valid:  false,
		Status: resp.StatusCode,
		Reason: fmt.Sprintf("HTTP %d error", resp.StatusCode),
	}
}
