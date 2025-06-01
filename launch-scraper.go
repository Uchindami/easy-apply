package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"time"
)

type Job map[string]interface{}

const (
	currentJobsFile  = "./current_jobs.json"
	previousJobsFile = "./previous_jobs.json"
	newJobsFile      = "./new_jobs.json"
	nodeScriptPath   = "E:/code/random-projects/javascript/web-scrapping/index.mjs"
	nodeScriptMore   = "E:/code/random-projects/javascript/web-scrapping/get-more-details.mjs"
	scraperInterval  = time.Minute * 10 // 5 minutes
)

func createJobKey(job Job) string {
	return fmt.Sprintf("%s|%s|%s",
		job["position"],
		job["companyName"],
		job["link"])
}

func runNodeScript() error {
	cmd := exec.Command("node", nodeScriptPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("error running node script: %v\nOutput: %s", err, output)
	}
	fmt.Printf("Node script output (%s):\n%s\n", time.Now().Format(time.RFC3339), output)
	return nil
}

func getMoreDetails() error {
	cmd := exec.Command("node", nodeScriptMore)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("error running node script: %v\nOutput: %s", err, output)
	}
	fmt.Printf("Node script output (%s):\n%s\n", time.Now().Format(time.RFC3339), output)
	return nil
}

func readJobsFile(filename string) ([]Job, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	var jobs []Job
	if err := json.Unmarshal(data, &jobs); err != nil {
		return nil, fmt.Errorf("error parsing %s: %v", filename, err)
	}
	return jobs, nil
}

func writeJobsFile(filename string, jobs []Job) error {
	data, err := json.MarshalIndent(jobs, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling jobs: %v", err)
	}
	return os.WriteFile(filename, data, 0644)
}

func findNewJobs(currentJobs, previousJobs []Job) []Job {
	existingJobs := make(map[string]bool)
	for _, job := range previousJobs {
		existingJobs[createJobKey(job)] = true
	}

	var newJobs []Job
	for _, job := range currentJobs {
		if !existingJobs[createJobKey(job)] {
			newJobs = append(newJobs, job)
		}
	}
	return newJobs
}

func processJobs(ctx context.Context) error {
	currentJobs, err := readJobsFile(currentJobsFile)
	if err != nil {
		return fmt.Errorf("error reading current jobs: %v", err)
	}

	previousJobs, err := readJobsFile(previousJobsFile)
	if os.IsNotExist(err) {
		// First run - consider all jobs as new
		if err := writeJobsFile(previousJobsFile, currentJobs); err != nil {
			return fmt.Errorf("error creating initial previous jobs file: %v", err)
		}
		if err := writeJobsFile(newJobsFile, currentJobs); err != nil {
			return fmt.Errorf("error writing new jobs file: %v", err)
		}
		fmt.Println("First run: all jobs are new.")

		if err := getMoreDetails(); err != nil {
			return fmt.Errorf("error getting more details: %v", err)
		}
		updateJobs(ctx)
		return nil
	} else if err != nil {
		return fmt.Errorf("error reading previous jobs: %v", err)
	}

	newJobs := findNewJobs(currentJobs, previousJobs)
	if len(newJobs) == 0 {
		fmt.Println("No new jobs found.")
		return nil
	}

	// Save new jobs
	if err := writeJobsFile(newJobsFile, newJobs); err != nil {
		return fmt.Errorf("error saving new jobs: %v", err)
	}

	// Update previous jobs with current data
	if err := writeJobsFile(previousJobsFile, currentJobs); err != nil {
		return fmt.Errorf("error updating previous jobs: %v", err)
	}

	fmt.Printf("Found %d new jobs:\n", len(newJobs))
	for _, job := range newJobs {
		fmt.Printf("- %s at %s (%s)\n",
			job["position"],
			job["companyName"],
			job["link"])
	}

	if err := getMoreDetails(); err != nil {
		return fmt.Errorf("error getting more details: %v", err)
	}
	updateJobs(ctx)

	return nil
}

func runScraperCycle(ctx context.Context) {
	fmt.Printf("\nRunning scraper cycle at %s...\n", time.Now().Format(time.RFC3339))

	if err := runNodeScript(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		return
	}

	if err := processJobs(ctx); err != nil {
		fmt.Fprintln(os.Stderr, err)
	}
}

func launchScraper(ctx context.Context) {
	// Run immediately on startup
	runScraperCycle(ctx)

	// Schedule periodic runs
	ticker := time.NewTicker(scraperInterval)
	defer ticker.Stop()

	for t := range ticker.C {
		fmt.Printf("\n--- Run at %s ---\n", t.Format(time.RFC3339))
		runScraperCycle(ctx)
	}
}
