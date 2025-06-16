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
	"github.com/getsentry/sentry-go"
	// To handle potential "status" and "codes" if they were used in the commented-out saveJobs:
	// "google.golang.org/grpc/status"
	// "google.golang.org/grpc/codes"
)

const jobsInputFile = "./scraper/new_jobs.json"

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
func parseTimeString(dateStr string) (time.Time, error) {
	// No Sentry span here as it's a very granular utility function.
	// Errors will be handled by the caller.
	dateStr = strings.TrimSpace(dateStr)
	if dateStr == "" || strings.EqualFold(dateStr, "N/A") || strings.EqualFold(dateStr, "Not specified") {
		return time.Time{}, nil
	}

	formats := []string{
		"2006-01-02", "January 2, 2006", "Jan 2, 2006", "02/01/2006", "01/02/2006",
		time.RFC3339, "2006-01-02T15:04:05", "02-01-2006", "01-02-2006", "02 Jan 2006",
		"2 January 2006", "2 January 2006 03:04 PM", "2 January 2006 15:04",
		"2006-01-02 15:04:05", "2006-01-02 03:04 PM", "2006-01-02 15:04",
		"2 Jan 2006 03:04 PM", "2 Jan 2006 15:04", time.RFC1123, time.RFC1123Z, "02-Jan-2006",
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
func readJobsFromFile(ctx context.Context, filename string) ([]JobListing, error) {
	span := sentry.StartSpan(ctx, "readJobsFromFile", sentry.WithDescription(fmt.Sprintf("Reading from %s", filename)))
	defer span.Finish()

	log.Printf("Reading job listings from file: %s", filename)
	file, err := os.Open(filename)
	if err != nil {
		err = fmt.Errorf("error opening file %s: %w", filename, err)
		sentry.CaptureException(err)
		span.Status = sentry.SpanStatusInternalError
		return nil, err
	}
	defer file.Close()

	var jobs []JobListing
	if err := json.NewDecoder(file).Decode(&jobs); err != nil {
		err = fmt.Errorf("error decoding JSON from file %s: %w", filename, err)
		sentry.CaptureException(err)
		span.Status = sentry.SpanStatusInternalError
		return nil, err
	}
	log.Printf("Successfully read %d job listings from %s", len(jobs), filename)
	span.Status = sentry.SpanStatusOK
	span.SetData("job_count", len(jobs))
	return jobs, nil
}

func updateJobs(ctx context.Context) {

	tx := sentry.StartTransaction(ctx, "updateJobs", sentry.WithTransactionName("UpdateAndUploadJobs"))
	defer tx.Finish()
	currentContext := tx.Context() // Use context from this transaction for subsequent operations

	jobs, err := readJobsFromFile(currentContext, jobsInputFile)
	if err != nil {
		// Error already captured by readJobsFromFile
		log.Printf("Failed to read jobs from %s: %v", jobsInputFile, err)
		tx.Status = sentry.SpanStatusInternalError
		// No need to os.Exit here, main will handle application lifecycle
		return
	}

	if len(jobs) == 0 {
		log.Println("No job listings found in the file. Nothing to upload.")
		tx.Status = sentry.SpanStatusOK // Or a custom status like "no_op"
		return
	}

	if err := uploadJobListings(currentContext, jobs); err != nil {
		// Error should be captured within uploadJobListings if it's a critical failure
		log.Printf("Failed to upload job listings: %v", err) // This log might be redundant if err is already captured
		tx.Status = sentry.SpanStatusInternalError
		return
	}
	tx.Status = sentry.SpanStatusOK
	log.Println("Job listings processing and upload completed successfully.")
}

// uploadJobListings uploads job listings to Firestore, grouped by source, using BulkWriter.
func uploadJobListings(ctx context.Context, jobListings []JobListing) error {
	uploadTx := sentry.StartTransaction(ctx, "uploadJobListings.process", sentry.WithTransactionName("UploadAllJobListings"))
	defer uploadTx.Finish()
	currentContext := uploadTx.Context()

	if len(jobListings) == 0 {
		log.Println("No job listings provided to upload.")
		uploadTx.Status = sentry.SpanStatusOK
		return nil
	}

	// Deduplication span
	dedupSpan := sentry.StartSpan(currentContext, "uploadJobListings.deduplicate")
	seenJobs := make(map[string]bool)
	var uniqueJobs []JobListing
	for _, job := range jobListings {
		if job.Link == "" {
			log.Printf("Skipping job with empty link: %+v", job)
			sentry.CaptureMessage(fmt.Sprintf("Skipping job with empty link: %s", job.Position)) // Example of capturing a non-error event
			continue
		}
		docID, err := generateJobDocID(job)
		if err != nil {
			log.Printf("Failed to generate doc ID for job %s, skipping: %v", job.Link, err)
			sentry.WithScope(func(scope *sentry.Scope) {
				scope.SetTag("job_link", job.Link)
				sentry.CaptureException(fmt.Errorf("failed to generate doc ID: %w", err))
			})
			continue
		}
		if !seenJobs[docID] {
			seenJobs[docID] = true
			uniqueJobs = append(uniqueJobs, job)
		}
	}
	dedupSpan.SetData("original_count", len(jobListings))
	dedupSpan.SetData("unique_count", len(uniqueJobs))
	dedupSpan.Finish()

	if len(uniqueJobs) == 0 {
		log.Println("No unique job listings to upload after deduplication.")
		uploadTx.Status = sentry.SpanStatusOK
		return nil
	}
	log.Printf("Filtered %d duplicates, preparing to upload %d unique job listings.",
		len(jobListings)-len(uniqueJobs), len(uniqueJobs))
	uploadTx.SetData("unique_job_count_to_upload", len(uniqueJobs))

	jobsBySource := make(map[string][]JobListing)
	for _, job := range uniqueJobs {
		sourceName := job.Source
		if sourceName == "" {
			sourceName = "unknown_source"
			log.Printf("Job listing with empty source found (Link: %s). Assigning to '%s'.", job.Link, sourceName)
			sentry.WithScope(func(scope *sentry.Scope) {
				scope.SetTag("job_link", job.Link)
				scope.SetLevel(sentry.LevelWarning)
				sentry.CaptureMessage("Job listing with empty source assigned to 'unknown_source'")
			})
		}
		jobsBySource[sourceName] = append(jobsBySource[sourceName], job)
	}

	bw := firestoreClient.BulkWriter(currentContext) // Pass context to BulkWriter if its API supports it (check SDK)
	var totalJobsQueued int
	var overallUploadError error // To track if any critical error occurs during the loop

	for source, jobsInSource := range jobsBySource {
		sourceSpan := sentry.StartSpan(currentContext, "uploadJobListings.source", sentry.WithDescription(fmt.Sprintf("Processing source: %s", source)))
		sourceSpan.SetData("job_count_for_source", len(jobsInSource))
		log.Printf("Processing source: %s with %d job(s)", source, len(jobsInSource))
		sourceDocRef := firestoreClient.Collection("jobs").Doc(source)

		for _, job := range jobsInSource {
			jobProcessingSpan := sentry.StartSpan(sourceSpan.Context(), "uploadJobListings.job", sentry.WithDescription(fmt.Sprintf("Processing job: %s", job.Link)))
			jobProcessingSpan.SetTag("job_link", job.Link)
			jobProcessingSpan.SetTag("job_source", source)

			if err := validateJobListing(sourceSpan.Context(), job, source); err != nil {
				log.Printf("Invalid job listing (Link: %s, Source: %s), skipping: %v", job.Link, source, err)
				sentry.WithScope(func(scope *sentry.Scope) {
					scope.SetTag("job_link", job.Link)
					scope.SetTag("validation_error", err.Error())
					sentry.CaptureException(fmt.Errorf("validation failed for job: %w", err))
				})
				jobProcessingSpan.Status = sentry.SpanStatusInvalidArgument
				jobProcessingSpan.Finish()
				continue
			}

			// Initialize Gemini client once
			geminiClient, err := InitializeGeminiClient(ctx)
			if err != nil {
				log.Fatalf("Failed to initialize Gemini client: %v", err)
			}
			defer geminiClient.Close()

			//
			parsedDetails, err := ParseJobDescription(ctx, geminiClient, job.JobDescription) // ParseJobDescription now starts its own span
			if err != nil {
				log.Printf("Failed to parse job description for job (Link: %s), skipping: %v", job.Link, err)
				sentry.WithScope(func(scope *sentry.Scope) {
					scope.SetTag("job_link", job.Link)
					sentry.CaptureException(fmt.Errorf("parsing job description failed: %w", err))
				})
				jobProcessingSpan.Status = sentry.SpanStatusInternalError
				jobProcessingSpan.Finish()
				continue
			}

			var datePosted, applicationDeadline time.Time
			parsedDatePosted, errDatePosted := parseTimeString(job.DatePosted)
			if errDatePosted != nil {
				log.Printf("Invalid DatePosted format for job (Link: %s): %q. Uploading with zero time. Error: %v", job.Link, job.DatePosted, errDatePosted)
				sentry.WithScope(func(scope *sentry.Scope) {
					scope.SetTag("job_link", job.Link)
					scope.SetTag("date_field", "DatePosted")
					scope.SetExtra("date_string", job.DatePosted)
					sentry.CaptureException(fmt.Errorf("date parsing failed for DatePosted: %w", errDatePosted))
				})
			} else {
				datePosted = parsedDatePosted
			}

			parsedApplicationDeadline, errAppDeadline := parseTimeString(job.ApplicationDeadline)
			if errAppDeadline != nil {
				log.Printf("Invalid ApplicationDeadline format for job (Link: %s): %q. Uploading with zero time. Error: %v", job.Link, job.ApplicationDeadline, errAppDeadline)
				sentry.WithScope(func(scope *sentry.Scope) {
					scope.SetTag("job_link", job.Link)
					scope.SetTag("date_field", "ApplicationDeadline")
					scope.SetExtra("date_string", job.ApplicationDeadline)
					sentry.CaptureException(fmt.Errorf("date parsing failed for ApplicationDeadline: %w", errAppDeadline))
				})
			} else {
				applicationDeadline = parsedApplicationDeadline
			}

			docID, _ := generateJobDocID(job)
			listingRef := sourceDocRef.Collection("listings").Doc(docID)
			docData := map[string]interface{}{
				"link":                   job.Link,
				"companyLogo":            job.CompanyLogo,
				"position":               job.Position,
				"companyName":            job.CompanyName,
				"location":               job.Location,
				"jobType":                job.JobType,
				"datePosted":             datePosted,
				"applicationDeadline":    applicationDeadline,
				"jobDescription":         job.JobDescription,
				"source":                 job.Source,
				"uploadedAt":             firestore.ServerTimestamp,
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
			if parsedDetails.ResponsibleFor == nil || (fmt.Sprintf("%v", parsedDetails.ResponsibleFor) == "[]") {
				delete(docData, "responsibleFor")
			}

			firestoreWriteSpan := sentry.StartSpan(jobProcessingSpan.Context(), "firestore.create")
			_, err = bw.Create(listingRef, docData)
			if err != nil {
				err = fmt.Errorf("failed to queue job for create (Link: %s, Source: %s): %w", job.Link, source, err)
				sentry.CaptureException(err) // Capture this critical error
				log.Print(err.Error())
				firestoreWriteSpan.Status = sentry.SpanStatusInternalError
				firestoreWriteSpan.Finish()
				jobProcessingSpan.Status = sentry.SpanStatusInternalError
				jobProcessingSpan.Finish()
				overallUploadError = err // Mark that a critical error occurred
				continue                 // Continue to next job, but the source span and overall transaction will reflect an error
			}
			firestoreWriteSpan.Status = sentry.SpanStatusOK
			firestoreWriteSpan.Finish()
			totalJobsQueued++
			jobProcessingSpan.Status = sentry.SpanStatusOK
			jobProcessingSpan.Finish()
		}
		if overallUploadError != nil {
			sourceSpan.Status = sentry.SpanStatusInternalError
		} else {
			sourceSpan.Status = sentry.SpanStatusOK
		}
		sourceSpan.Finish()
		log.Printf("Queued %d job listings for source: %s", len(jobsInSource), source) // This log might be better inside the span
	}

	flushSpan := sentry.StartSpan(currentContext, "firestore.bulkWriter.flush")
	log.Printf("All %d unique jobs queued. Flushing writes...", totalJobsQueued)
	bw.Flush()         // Errors from Flush are harder to catch per-document, BulkWriter handles retries.
	flushSpan.Finish() // Assuming flush is successful if no panic. For more detailed error handling,
	// you might need to check BulkWriter's specific error reporting mechanisms if available.

	if overallUploadError != nil {
		uploadTx.Status = sentry.SpanStatusInternalError
		uploadTx.SetTag("error", "true")
		log.Printf("Upload process encountered errors. See Sentry for details.")
		return overallUploadError // Propagate the first critical error encountered
	}

	uploadTx.Status = sentry.SpanStatusOK
	log.Printf("Successfully processed and attempted to upload %d unique job listings across %d source(s).", totalJobsQueued, len(jobsBySource))
	return nil
}

// validateJobListing checks if essential fields are present in a JobListing and if it already exists in Firestore.
func validateJobListing(ctx context.Context, job JobListing, source string) error {
	if job.Link == "" {
		return fmt.Errorf("job link is required")
	}
	if job.Position == "" {
		log.Printf("Warning: Job (Link: %s) has an empty 'Position' field.", job.Link)
		// No Sentry warning; just a local/logged warning
	}
	if job.CompanyName == "" {
		return fmt.Errorf("company name is required for job link: %s", job.Link)
	}

	if source == "" {
		source = "unknown_source"
	}
	listingsCol := firestoreClient.Collection("jobs").Doc(source).Collection("listings")
	query := listingsCol.Where("link", "==", job.Link)
	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		return fmt.Errorf("error querying Firestore for existing job link: %w", err)
	}
	if len(docs) > 0 {
		return fmt.Errorf("job with this link already exists in Firestore (source: %s) and will be skipped", source)
	}
	return nil
}

// generateJobDocID creates a consistent document ID for a job listing.
func generateJobDocID(job JobListing) (string, error) {
	if job.Link == "" {
		return "", fmt.Errorf("cannot generate document ID: job link is empty")
	}
	hash := sha256.Sum256([]byte(strings.TrimSpace(job.Link)))
	return fmt.Sprintf("%x", hash)[:32], nil
}
