package main

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
)

// projectID is your Google Cloud Project ID.
// Replace "your-gcp-project-id" with your actual project ID.
const projectID = "your-gcp-project-id"
const jobsInputFile = "new_jobs.json"

// JobListing represents the structure of a job listing as read from the input JSON.
type JobListing struct {
	Link                string `json:"link"`
	CompanyLogo         string `json:"companyLogo"`
	Position            string `json:"position"`
	CompanyName         string `json:"companyName"`
	Location            string `json:"location"`
	JobType             string `json:"jobType"`
	DatePosted          string `json:"datePosted"`          // Raw string, will be parsed
	ApplicationDeadline string `json:"applicationDeadline"` // Raw string, will be parsed
	JobDescription      string `json:"jobDescription"`
	Source              string `json:"source"`

	// Fields below might be in the input JSON or populated/overridden by ParseJobDescription
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
	Domain                 string      `json:"domain"`
}

// ParsedJobData holds the structured information extracted from a job description by ParseJobDescription.
type ParsedJobData struct {
	JobTitle               string      `json:"jobTitle"`
	Organization           string      `json:"organization"`
	Grade                  interface{} `json:"grade"`
	ReportingTo            string      `json:"reportingTo"`
	ResponsibleFor         interface{} `json:"responsibleFor,omitempty"`
	Department             string      `json:"department"`
	Purpose                string      `json:"purpose"`
	KeyResponsibilities    []string    `json:"keyResponsibilities"`
	RequiredQualifications []string    `json:"requiredQualifications"`
	RequiredExperience     interface{} `json:"requiredExperience"`
	RequiredMemberships    interface{} `json:"requiredMemberships"`
	ContactDetails         interface{} `json:"contactDetails"`
	AdditionalNotes        string      `json:"additionalNotes"`
	Tags                   []string    `json:"tags"`
	Industry               string      `json:"industry"`
	Domain                 string      `json:"domain"`
}

// parseTimeString attempts to parse a date string in multiple common formats.
// Returns zero time.Time if parsing fails or input is empty/N/A.
func parseTimeString(dateStr string) (time.Time, error) {
	dateStr = strings.TrimSpace(dateStr)
	if dateStr == "" || strings.EqualFold(dateStr, "N/A") || strings.EqualFold(dateStr, "Not specified") {
		return time.Time{}, nil // Represents "no date" or "not applicable"
	}

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
		"02 Jan 2006",             // "30 May 2025"
		"2 January 2006",          // "30 May 2025"
		"2 January 2006 03:04 PM", // "30 May 2025 03:04 PM"
		"2 January 2006 15:04",    // "30 May 2025 15:04"
		"2006-01-02 15:04:05",     // "2025-05-16 14:30:00"
		"2006-01-02 03:04 PM",     // "2025-05-16 02:30 PM"
		"2006-01-02 15:04",        // "2025-05-16 14:30"
		"2 Jan 2006 03:04 PM",     // "30 May 2025 03:04 PM"
		"2 Jan 2006 15:04",        // "30 May 2025 15:04"
		time.RFC1123,              // "Mon, 02 Jan 2006 15:04:05 MST"
		time.RFC1123Z,             // "Mon, 02 Jan 2006 15:04:05 -0700"
		"02-Jan-2006",             // DD-Mon-YYYY
	}

	for _, format := range formats {
		t, err := time.Parse(format, dateStr)
		if err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("failed to parse date string %q - unrecognized format after trying %d formats", dateStr, len(formats))
}

// readJobsFromFile reads job listings from a JSON file.
func readJobsFromFile(filename string) ([]JobListing, error) {
	log.Printf("Reading job listings from file: %s", filename)
	file, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("error opening file %s: %w", filename, err)
	}
	defer file.Close()

	var jobs []JobListing
	if err := json.NewDecoder(file).Decode(&jobs); err != nil {
		return nil, fmt.Errorf("error decoding JSON from file %s: %w", filename, err)
	}
	log.Printf("Successfully read %d job listings from %s", len(jobs), filename)
	return jobs, nil
}

// updateJobs orchestrates reading jobs from a file and uploading them.
func updateJobs() {
	jobs, err := readJobsFromFile(jobsInputFile)
	if err != nil {
		log.Fatalf("Failed to read jobs from %s: %v", jobsInputFile, err)
	}

	if len(jobs) == 0 {
		log.Println("No job listings found in the file. Nothing to upload.")
		return
	}

	if err := uploadJobListings(jobs); err != nil {
		log.Fatalf("Failed to upload job listings: %v", err)
	}
	log.Println("Job listings processing and upload completed successfully.")
}

// uploadJobListings uploads job listings to Firestore, grouped by source, using BulkWriter.
func uploadJobListings(jobListings []JobListing) error {
	ctx := context.Background()

	if len(jobListings) == 0 {
		log.Println("No job listings provided to upload.")
		return nil
	}

	// Deduplicate jobs based on a generated document ID (hash of the link)
	seenJobs := make(map[string]bool)
	var uniqueJobs []JobListing
	for _, job := range jobListings {
		if job.Link == "" { // Basic validation before generating ID
			log.Printf("Skipping job with empty link: %+v", job)
			continue
		}
		docID, err := generateJobDocID(job) // generateJobDocID now expects a validated job.Link
		if err != nil {
			// This should ideally not happen if job.Link is validated, but good to have
			log.Printf("Failed to generate doc ID for job %s, skipping: %v", job.Link, err)
			continue
		}
		if !seenJobs[docID] {
			seenJobs[docID] = true
			uniqueJobs = append(uniqueJobs, job)
		}
	}

	if len(uniqueJobs) == 0 {
		log.Println("No unique job listings to upload after deduplication.")
		return nil
	}
	log.Printf("Filtered %d duplicates, preparing to upload %d unique job listings.",
		len(jobListings)-len(uniqueJobs), len(uniqueJobs))

	// Group jobs by source
	jobsBySource := make(map[string][]JobListing)
	for _, job := range uniqueJobs {
		if job.Source == "" {
			log.Printf("Job listing with empty source found (Link: %s). Assigning to 'unknown_source'.", job.Link)
			jobsBySource["unknown_source"] = append(jobsBySource["unknown_source"], job)
		} else {
			jobsBySource[job.Source] = append(jobsBySource[job.Source], job)
		}
	}

	bw := firestoreClient.BulkWriter(ctx)
	var totalJobsQueued int

	for source, jobsInSource := range jobsBySource {
		log.Printf("Processing source: %s with %d job(s)", source, len(jobsInSource))
		sourceDocRef := firestoreClient.Collection("jobs").Doc(source) // Reference to the source document

		for _, job := range jobsInSource {
			// Validate essential fields for each job
			if err := validateJobListing(job); err != nil {
				log.Printf("Invalid job listing (Link: %s, Source: %s), skipping: %v", job.Link, source, err)
				continue // Skip this job and proceed to the next
			}

			// Parse job description string into ParsedJobData struct
			parsedDetails, err := ParseJobDescription(job.JobDescription)
			if err != nil {
				log.Printf("Failed to parse job description for job (Link: %s), skipping: %v", job.Link, err)
				continue // Skip this job
			}

			// Parse date strings into time.Time objects
			datePosted, err := parseTimeString(job.DatePosted)
			if err != nil {
				log.Printf("Invalid DatePosted format for job (Link: %s): %q, attempting to proceed without date: %v", job.Link, job.DatePosted, err)
				// Decide if you want to skip or upload with zero time for datePosted
				// For now, we log and continue, datePosted will be zero time.Time
			}

			applicationDeadline, err := parseTimeString(job.ApplicationDeadline)
			if err != nil {
				log.Printf("Invalid ApplicationDeadline format for job (Link: %s): %q, attempting to proceed without deadline: %v", job.Link, job.ApplicationDeadline, err)
				// Similar to datePosted, deadline will be zero time.Time
			}

			docID, _ := generateJobDocID(job) // Already generated and validated link, so error is unlikely here
			listingRef := sourceDocRef.Collection("listings").Doc(docID)

			// Construct the document data to be written to Firestore
			// This map will contain fields from the original JobListing and the ParsedJobData
			docData := map[string]interface{}{
				"link":                job.Link,
				"companyLogo":         job.CompanyLogo,
				"position":            job.Position, // Original position from JSON
				"companyName":         job.CompanyName,
				"location":            job.Location,
				"jobType":             job.JobType,
				"datePosted":          datePosted,          // Parsed time.Time object
				"applicationDeadline": applicationDeadline, // Parsed time.Time object
				"jobDescription":      job.JobDescription,  // Raw job description
				"source":              job.Source,
				"uploadedAt":          firestore.ServerTimestamp, // Timestamp of upload

				// Fields from ParsedJobData (may override or augment JobListing fields)
				"jobTitle":               parsedDetails.JobTitle,
				"organization":           parsedDetails.Organization,
				"grade":                  parsedDetails.Grade,
				"reportingTo":            parsedDetails.ReportingTo,
				"responsibleFor":         parsedDetails.ResponsibleFor,
				"department":             parsedDetails.Department,
				"purpose":                parsedDetails.Purpose,
				"keyResponsibilities":    parsedDetails.KeyResponsibilities,
				"requiredQualifications": parsedDetails.RequiredQualifications,
				"requiredExperience":     parsedDetails.RequiredExperience,
				"requiredMemberships":    parsedDetails.RequiredMemberships,
				"contactDetails":         parsedDetails.ContactDetails,
				"additionalNotes":        parsedDetails.AdditionalNotes,
				"tags":                   parsedDetails.Tags,
				"industry":               parsedDetails.Industry,
				"domain":                 parsedDetails.Domain,
			}

			// Clean up nil or empty array fields from parsedDetails to avoid storing empty values if not desired
			if parsedDetails.ResponsibleFor == nil || (fmt.Sprintf("%v", parsedDetails.ResponsibleFor) == "[]") {
				delete(docData, "responsibleFor")
			}
			// Add similar checks for other slice/map fields if needed

			// Queue the create operation. Errors here are typically for invalid arguments.
			_, err = bw.Create(listingRef, docData)
			if err != nil {
				// Log the error and continue to queue other jobs.
				// The BulkWriter will retry network errors, but this error is likely local.
				log.Printf("Failed to queue job for create (Link: %s, Source: %s): %v", job.Link, source, err)
				// Optionally, you could collect these errors and return them at the end.
				continue
			}
			totalJobsQueued++
		}
		log.Printf("Queued %d job listings for source: %s", len(jobsInSource), source)
	}

	// Flush any remaining writes and wait for all operations to complete.
	// BulkWriter handles retries internally. Errors that persist after retries are logged by the client library.
	// The Flush method itself doesn't return application-level errors for individual writes.
	// If bw.Create returned an error, it was handled above.
	log.Printf("All %d unique jobs queued. Flushing writes...", totalJobsQueued)
	bw.Flush() // Ensures all batched writes are sent.

	// To explicitly wait for all operations and stop adding new ones, you can use End.
	// bw.End() // Call this if this BulkWriter instance will not be used anymore.

	log.Printf("Successfully processed and attempted to upload %d unique job listings across %d source(s). Check logs for any individual write errors.", totalJobsQueued, len(jobsBySource))
	return nil
}

// validateJobListing checks if essential fields are present in a JobListing.
func validateJobListing(job JobListing) error {
	if job.Link == "" {
		return fmt.Errorf("job link is required")
	}
	if job.Position == "" {
		// This is a warning rather than a fatal error for a single job,
		// as ParseJobDescription might derive a JobTitle.
		log.Printf("Warning: Job (Link: %s) has an empty 'Position' field.", job.Link)
	}
	if job.CompanyName == "" {
		return fmt.Errorf("company name is required for job link: %s", job.Link)
	}
	// Source is handled by assigning to "unknown_source" if empty, so not a fatal validation here.
	return nil
}

// generateJobDocID creates a consistent document ID for a job listing using a hash of its link.
// Ensures the link is not empty before hashing.
func generateJobDocID(job JobListing) (string, error) {
	if job.Link == "" {
		return "", fmt.Errorf("cannot generate document ID: job link is empty")
	}
	hash := sha256.Sum256([]byte(strings.TrimSpace(job.Link)))
	// Using the first 32 characters (16 bytes) of the hex string for the ID.
	// SHA256 hex string is 64 chars long.
	return fmt.Sprintf("%x", hash)[:32], nil
}
