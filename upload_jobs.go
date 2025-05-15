package main

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

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
	Source              string `json:"source"`
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
	jobs, err := readJobsFromFile("combined_jobs.json")

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read jobs: %v", err), http.StatusInternalServerError)
		return
	}

	if err := uploadJobListings(jobs); err != nil {
		log.Fatalf("Failed to upload job listings: %v", err)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Job listings uploaded successfully"))
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

			docID, err := generateJobDocID(job)
			if err != nil {
				return fmt.Errorf("failed to generate document ID: %w", err)
			}

			listingRef := sourceDocRef.Collection("listings").Doc(docID)

			_, err = bw.Create(listingRef, map[string]interface{}{
				"link":                job.Link,
				"companyLogo":         job.CompanyLogo,
				"position":            job.Position,
				"companyName":         job.CompanyName,
				"location":            job.Location,
				"jobType":             job.JobType,
				"datePosted":          job.DatePosted,
				"applicationDeadline": job.ApplicationDeadline,
				"source":              job.Source,
				"uploadedAt":          firestore.ServerTimestamp,
			})

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
