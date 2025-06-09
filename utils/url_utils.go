package utils

import (
	// "log" // Using global Logger from utils package
	"net/url" // Changed to use net/url for more robust parsing
	"strings"
)

// SupportedJobSites maps domain substrings to human-readable source names.
var SupportedJobSites = map[string]string{
	"jobsearchmalawi.com": "JobSearch Malawi",
	"careersmw.com":       "Careers MW",
	"glassdoor.com":       "Glassdoor",
	// Add more sites as needed
}

// ExtractSourceFromURL attempts to identify the job source from a URL.
func ExtractSourceFromURL(urlStr string) string {
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		Logger.Printf("Error parsing URL for source extraction '%s': %v", urlStr, err)
		return "Other"
	}
	host := parsedURL.Hostname()

	for domainKey, name := range SupportedJobSites {
		if strings.Contains(host, domainKey) {
			Logger.Printf("Identified job source: %s from URL: %s (host: %s)", name, urlStr, host)
			return name
		}
	}
	Logger.Printf("Unknown job source for URL: %s (host: %s)", urlStr, host)
	return "Other" // Default if no match
}

// ExtractDomainFromURL extracts the domain from a URL string.
func ExtractDomainFromURL(urlStr string) string {
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		// If parsing fails, try to prepend http:// and parse again
		if !strings.HasPrefix(urlStr, "http://") && !strings.HasPrefix(urlStr, "https://") {
			parsedURL, err = url.Parse("http://" + urlStr)
		}
		if err != nil {
			Logger.Printf("Error parsing URL for domain extraction '%s': %v", urlStr, err)
			return "unknown_domain"
		}
	}
	return parsedURL.Hostname()
}
