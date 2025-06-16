package services

import (
	"context"
	"easy-apply/models"     // For models.ProcessingResult
	"easy-apply/processors" // Assuming this is the correct path to your processors package
	"easy-apply/utils"      // For utils.Logger
	"fmt"
	"sync"
	"time"

	"github.com/getsentry/sentry-go"
)

// Global instances of processors, to be initialized by InitProcessors
var (
	localFileProcessor   *processors.FileProcessor   // Renamed to avoid conflict if service has 'fileProcessor'
	localWebProcessor    *processors.WebProcessor    // Renamed
	localOpenAIProcessor *processors.OpenAIProcessor // Renamed
	processorsOnce       sync.Once
)

// InitProcessors initializes all required processors.
// This should be called once at application startup (e.g., in main.go).
// It populates the global processor instances within this package.
func InitProcessors() (*processors.FileProcessor, *processors.OpenAIProcessor, error) {
	var err error
	processorsOnce.Do(func() {
		utils.Logger.Println("Initializing processors in processor_service...")
		startTime := time.Now()

		localFileProcessor = processors.NewFileProcessor()          // Assumes constructor exists
		localWebProcessor = processors.NewWebProcessor("")          // Assumes constructor exists, API key if needed
		localOpenAIProcessor, err = processors.NewOpenAIProcessor() // Assumes constructor exists
		if err != nil {
			// Log and propagate the error
			utils.Logger.Fatalf("Failed to initialize OpenAIProcessor in processor_service: %v", err)
			return // err will be handled by the caller
		}
		utils.Logger.Printf("Processors initialized in processor_service in %v", time.Since(startTime))
	})
	if err != nil {
		return nil, nil, fmt.Errorf("processor initialization failed: %w", err)
	}
	return localFileProcessor, localOpenAIProcessor, nil
}

// ProcessFileAndWeb concurrently processes a file and a web link.
// It uses the initialized processors from this package.
func ProcessFileAndWeb(ctx context.Context, fileContent []byte, fileExt, webLink string) (*models.ProcessingResult, error) {
	parentSpan := sentry.SpanFromContext(ctx)
	var span *sentry.Span
	if parentSpan != nil {
		span = parentSpan.StartChild("processing.file_and_web_concurrent")
	} else {
		span = sentry.StartSpan(ctx, "processing.file_and_web_concurrent")
	}
	defer span.Finish()

	if localFileProcessor == nil || localWebProcessor == nil {
		err := fmt.Errorf("processors not initialized in processor_service for ProcessFileAndWeb")
		utils.Logger.Println(err.Error())
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusInternalError
		return nil, err
	}

	var (
		result models.ProcessingResult
		wg     sync.WaitGroup
		mu     sync.Mutex
		errs   = make(chan error, 2)
	)

	wg.Add(2)

	// Process file
	go func(gCtx context.Context) {
		defer wg.Done()
		taskSpan := sentry.StartSpan(gCtx, "task.extract_text_from_file_async_service")
		defer taskSpan.Finish()
		utils.Logger.Println("Starting file processing in goroutine (processor_service)")
		// Use ExtractTextFromFile from file_service, which uses its own initialized fileProcessor
		// This requires file_service's fileProcessor to be initialized correctly.
		// Alternatively, pass localFileProcessor here or make ExtractTextFromFile accept a processor.
		// For now, assuming file_service.ExtractTextFromFile is the intended way.
		extractedText, taskErr := ExtractTextFromFile(gCtx, fileContent, fileExt) // From this (services) package

		mu.Lock()
		defer mu.Unlock()
		if taskErr != nil {
			taskSpan.SetData("error_message", taskErr.Error())
			taskSpan.Status = sentry.SpanStatusAborted
			wrappedErr := fmt.Errorf("file processing failed in service: %w", taskErr)
			if result.Error == nil {
				result.Error = wrappedErr
			}
			errs <- wrappedErr
		} else {
			result.ExtractedResume = extractedText
			taskSpan.SetData("extracted_resume_length", len(extractedText))
		}
	}(sentry.SetHubOnContext(ctx, sentry.CurrentHub().Clone()))

	// Process web link
	go func(gCtx context.Context) {
		defer wg.Done()
		taskSpan := sentry.StartSpan(gCtx, "task.scrape_web_link_async_service")
		defer taskSpan.Finish()
		taskSpan.SetData("web_link", webLink)
		utils.Logger.Println("Starting web link processing in goroutine (processor_service)")
		webStart := time.Now()

		scrappedContent, taskErr := localWebProcessor.ProcessWebLink(webLink) // Assumes ProcessWebLink method
		duration := time.Since(webStart)
		taskSpan.SetData("duration_ms", duration.Milliseconds())

		mu.Lock()
		defer mu.Unlock()
		if taskErr != nil {
			taskSpan.SetTag("error", "true")
			taskSpan.SetData("error_message", taskErr.Error())
			taskSpan.Status = sentry.SpanStatusAborted
			utils.Logger.Printf("Web processing failed after %v: %v", duration, taskErr)
			wrappedErr := fmt.Errorf("web processing failed in service: %w", taskErr)
			if result.Error == nil {
				result.Error = wrappedErr
			}
			errs <- wrappedErr
		} else {
			result.ScrappedWebJobPosting = scrappedContent
			taskSpan.SetData("scrapped_content_length", len(scrappedContent))
			utils.Logger.Printf("Web processing completed in %v", duration)
		}
	}(sentry.SetHubOnContext(ctx, sentry.CurrentHub().Clone()))

	wg.Wait()
	close(errs)

	var combinedError error
	for e := range errs {
		if combinedError == nil {
			combinedError = e
		} else {
			utils.Logger.Printf("Additional error during concurrent processing (service): %v", e)
			sentry.CaptureException(fmt.Errorf("additional concurrent error (service): %w", e))
		}
	}

	if combinedError != nil {
		span.SetTag("error", "true")
		span.SetData("error_message", combinedError.Error())
		span.Status = sentry.SpanStatusAborted
		return &result, combinedError
	}

	span.SetData("extracted_resume_length", len(result.ExtractedResume))
	span.SetData("scrapped_web_job_posting_length", len(result.ScrappedWebJobPosting))
	return &result, nil
}
