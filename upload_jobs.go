package main

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
)

type JobListing struct {
	Link                string `json:"link"`
	CompanyLogo         string `json:"companyLogo"`
	Position            string `json:"position"`
	CompanyName         string `json:"companyName"`
	Location            string `json:"location"`
	JobType             string `json:"jobType"`
	DatePosted          string `json:"datePosted"`
	ApplicationDeadline string `json:"applicationDeadline"`
	JobDescription      string `json:"jobDescription"`
	Source              string `json:"source"`

	Grade                  interface{} `json:"grade"` // could be string or N/A
	ReportingTo            string      `json:"reportingTo"`
	ResponsibleFor         interface{} `json:"responsibleFor,omitempty"` // could be string or []string
	Department             string      `json:"department"`
	Purpose                string      `json:"purpose"`
	KeyResponsibilities    []string    `json:"keyResponsibilities"`
	RequiredQualifications []string    `json:"requiredQualifications"`
	RequiredExperience     interface{} `json:"requiredExperience"`  // could be string, []string, or object
	RequiredMemberships    interface{} `json:"requiredMemberships"` // could be string, []string, or N/A
	ContactDetails         interface{} `json:"contactDetails"`      // could be string or object
	AdditionalNotes        string      `json:"additionalNotes"`
	Tags                   []string    `json:"tags"`
	Industry               string      `json:"industry"`
	Domain                 string      `json:"domain"` // Domain
}

// parseTimeStringFlexible attempts to parse a date string in multiple common formats
func parseTimeString(dateStr string) (time.Time, error) {
	// Handle empty or "N/A" cases
	dateStr = strings.TrimSpace(dateStr)
	if dateStr == "" || strings.EqualFold(dateStr, "N/A") {
		return time.Time{}, nil
	}

	// List of common date formats to try (in order of likelihood)
	formats := []string{
		"2006-01-02",              // YYYY-MM-DD (ISO 8601)
		"January 2, 2006",         // "May 30, 2025"
		"Jan 2, 2006",             // "May 30, 2025" (abbreviated month)
		"02/01/2006",              // DD/MM/YYYY (common European format)
		"01/02/2006",              // MM/DD/YYYY (common US format)
		time.RFC3339,              // Full RFC3339 format
		"2006-01-02T15:04:05",     // ISO 8601 with time
		"02-01-2006",              // DD-MM-YYYY
		"01-02-2006",              // MM-DD-YYYY
		"2006-01-02",              // "2025-05-16"
		"02 Jan 2006",             // "30 May 2025"
		"Jan 02, 2006",            // "May 30, 2025"
		"January 2, 2006",         // "May 30, 2025"
		"2 January 2006",          // "30 May 2025"
		"01/02/2006",              // "05/30/2025"
		"02/01/2006",              // "30/05/2025"
		"2 January 2006 03:04 PM", // "30 May 2025 03:04 PM"
		"2 January 2006 15:04",    // "30 May 2025 15:04"
		"2006-01-02 15:04:05",     // "2025-05-16 14:30:00"
		"2006-01-02 03:04 PM",     // "2025-05-16 02:30 PM"
		"2006-01-02 15:04",        // "2025-05-16 14:30"
		"2 Jan 2006 03:04 PM",     // "30 May 2025 03:04 PM"
		"2 Jan 2006 15:04",        // "30 May 2025 15:04"
	}

	// Try each format in order
	for _, format := range formats {
		t, err := time.Parse(format, dateStr)
		if err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("failed to parse date string %q - unrecognized format", dateStr)
}

func readJobsFromFile(filename string) ([]JobListing, error) {
	log.Println("started jobs processing")
	file, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("error opening file: %w", err)
	}
	defer file.Close()

	var jobs []JobListing
	if err := json.NewDecoder(file).Decode(&jobs); err != nil {
		return nil, fmt.Errorf("error decoding JSON: %w", err)
	}

	return jobs, nil
}

func updateJobs() {
	jobs, err := readJobsFromFile("new_jobs.json")

	if err != nil {
		log.Fatalf("Failed to read jobs: %v", err)
	}

	if err := uploadJobListings(jobs); err != nil {
		log.Fatalf("Failed to upload job listings: %v", err)
	}
	log.Println("Job listings uploaded successfully")
}

func testHandler(w http.ResponseWriter, r *http.Request) {
	// Get the URL parameter
	desc := r.URL.Query().Get("desc")

	// URL parameters are often URL-encoded, so we need to decode them
	decodedDesc, err := url.QueryUnescape(desc)
	if err != nil {
		http.Error(w, "Error decoding URL parameter", http.StatusBadRequest)
		return
	}

	result, err := ParseJobDescription(decodedDesc)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the result
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// func saveJobs(ctx context.Context, jobs []Job) error {
// 	log.Println("started jobs processing")
// 	for _, job := range jobs {
// 		hash := sha256.Sum256([]byte(job.Link))
// 		jobID := fmt.Sprintf("%x", hash)

// 		jobRef := firestoreClient.
// 			Collection("jobs").
// 			Doc(job.Source).
// 			Collection("listings").
// 			Doc(jobID)

// 		snap, err := jobRef.Get(ctx)
// 		if err != nil && status.Code(err) != codes.NotFound {
// 			return fmt.Errorf("failed to check job existence: %w", err)
// 		}

// 		if snap.Exists() {
// 			continue
// 		}

// 		_, err = jobRef.Set(ctx, job)
// 		if err != nil {
// 			return fmt.Errorf("failed to save job: %w", err)
// 		}
// 	}
// 	return nil
// }

// uploadJobListings uploads job listings to Firebase, grouped by source.
// Returns an error if any operation fails.
func uploadJobListings(jobListings []JobListing) error {
	ctx := context.Background()

	if len(jobListings) == 0 {
		return nil
	}

	// Track seen job URLs to avoid duplicates
	seenJobs := make(map[string]bool)
	var uniqueJobs []JobListing

	for _, job := range jobListings {
		docID, err := generateJobDocID(job)
		if err != nil {
			return fmt.Errorf("failed to generate doc ID: %w", err)
		}
		if !seenJobs[docID] {
			seenJobs[docID] = true
			uniqueJobs = append(uniqueJobs, job)
		}
	}

	log.Printf("Filtered %d duplicates, uploading %d unique jobs",
		len(jobListings)-len(uniqueJobs), len(uniqueJobs))

	// Group jobs by source
	jobsBySource := make(map[string][]JobListing)
	for _, job := range uniqueJobs {
		jobsBySource[job.Source] = append(jobsBySource[job.Source], job)
	}

	// Create a new BulkWriter with appropriate configuration
	bw := firestoreClient.BulkWriter(ctx)
	// Configure BulkWriter for better error handling (adjust as needed)

	// Process each source and upload its listings
	for source, jobs := range jobsBySource {
		if source == "" {
			return fmt.Errorf("job listing with empty source found")
		}

		sourceDocRef := firestoreClient.Collection("jobs").Doc(source)
		log.Printf("Processing source: %s with %d jobs", source, len(jobs))

		for _, job := range jobs {
			if err := validateJobListing(job); err != nil {
				return fmt.Errorf("invalid job listing: %w", err)
			}

			// Parse job description
			parsed, err := ParseJobDescription(job.JobDescription)
			if err != nil {
				return fmt.Errorf("failed to parse job description for job %s: %w", job.Link, err)
			}

			datePosted, err := parseTimeString(job.DatePosted)
			if err != nil {
				return fmt.Errorf("invalid datePosted for job %s: %w", job.Link, err)
			}

			applicationDeadline, err := parseTimeString(job.ApplicationDeadline)
			if err != nil {
				return fmt.Errorf("invalid applicationDeadline for job %s: %w", job.Link, err)
			}

			docID, err := generateJobDocID(job)
			if err != nil {
				return fmt.Errorf("failed to generate document ID: %w", err)
			}

			listingRef := sourceDocRef.Collection("listings").Doc(docID)

			docData := map[string]interface{}{
				"link":                job.Link,
				"companyLogo":         job.CompanyLogo,
				"position":            job.Position,
				"companyName":         job.CompanyName,
				"location":            job.Location,
				"jobType":             job.JobType,
				"datePosted":          datePosted,
				"applicationDeadline": applicationDeadline,
				"jobDescription":      job.JobDescription,
				"source":              job.Source,
				"uploadedAt":          firestore.ServerTimestamp,

				// Directly add parsed fields
				"jobTitle":               parsed.JobTitle,
				"organization":           parsed.Organization,
				"grade":                  parsed.Grade,
				"reportingTo":            parsed.ReportingTo,
				"department":             parsed.Department,
				"purpose":                parsed.Purpose,
				"keyResponsibilities":    parsed.KeyResponsibilities,
				"requiredQualifications": parsed.RequiredQualifications,
				"requiredExperience":     parsed.RequiredExperience,
				"requiredMemberships":    parsed.RequiredMemberships,
				"contactDetails":         parsed.ContactDetails,
				"additionalNotes":        parsed.AdditionalNotes,
				"tags":                   parsed.Tags,
				"industry":               parsed.Industry,
				"domain":                 parsed.Domain,
			}

			_, err = bw.Create(listingRef, docData)
			if err != nil {
				return fmt.Errorf("failed to queue job %s for source %s: %w", job.Link, source, err)
			}
		}
		log.Printf("Queued %d job listings for source: %s", len(jobs), source)
	}
	// Wait for all operations to complete and check for errors
	bw.Flush()
	// if err := bw.Flush(); err != nil {
	// 	return fmt.Errorf("bulk write operations failed: %w", err)
	// }

	// All errors are reported via bw.Flush() in the current Firestore Go client.

	log.Printf("Successfully uploaded %d job listings across %d sources", len(jobListings), len(jobsBySource))
	return nil
}

// validateJobListing checks if required fields are present
func validateJobListing(job JobListing) error {
	if job.Link == "" {
		return fmt.Errorf("job link is required")
	}
	if job.Position == "" {
		return fmt.Errorf("position is required")
	}
	if job.CompanyName == "" {
		return fmt.Errorf("company name is required")
	}
	if job.Source == "" {
		return fmt.Errorf("source is required")
	}
	return nil
}

// generateJobDocID creates a consistent document ID for a job listing
func generateJobDocID(job JobListing) (string, error) {
	// Use a hash of the job link for consistent document IDs
	hash := sha256.Sum256([]byte(job.Link))
	return fmt.Sprintf("%x", hash)[:32], nil
}
