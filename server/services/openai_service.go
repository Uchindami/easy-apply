package services

import (
	"context"
	"easy-apply/models"     // For models.Colors, models.RecommendationResult
	"easy-apply/processors" // Assuming this is the correct path to your processors package
	"easy-apply/utils"      // For utils.Logger
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/getsentry/sentry-go"
)

var openAIProcessor *processors.OpenAIProcessor

// InitializeOpenAIService sets up the necessary components for the OpenAI service.
func InitializeOpenAIService(oap *processors.OpenAIProcessor) {
	openAIProcessor = oap
	utils.Logger.Println("OpenAIService initialized with OpenAIProcessor.")
}

// ProcessWithOpenAI handles interactions with OpenAI for document processing and job detail extraction.
func ProcessWithOpenAI(ctx context.Context, jobPosting, extractedResume, selectedTemplateHTML string, selectedColors models.Colors) (processedDocs map[string]string, jobDetails map[string]string, err error) {
	parentSpan := sentry.SpanFromContext(ctx)
	var span *sentry.Span
	if parentSpan != nil {
		span = parentSpan.StartChild("openai.process_documents_and_details")
	} else {
		span = sentry.StartSpan(ctx, "openai.process_documents_and_details")
	}
	defer func() {
		if err != nil {
			span.SetTag("error", "true")
			span.SetData("error_message", err.Error()) // Capture the final error
			span.Status = sentry.SpanStatusAborted
		}
		span.Finish()
	}()

	span.SetData("job_posting_length", len(jobPosting))
	span.SetData("extracted_resume_length", len(extractedResume))
	// Note: selectedTemplateHTML and selectedColors are not directly used in the original OpenAI calls in upload.go's processWithOpenAI

	if openAIProcessor == nil {
		err = fmt.Errorf("OpenAIProcessor not initialized in openai_service")
		utils.Logger.Println(err.Error())
		return nil, nil, err
	}

	colors := fmt.Sprintf(
		"<color_palette>\n:primary %s\n:secondary %s\n:accent %s\n:text %s\n",
		selectedColors.Primary,
		selectedColors.Secondary,
		selectedColors.Accent,
		selectedColors.Text,
	)

	documents := BuildEnhancedUserMessage(jobPosting, extractedResume, selectedTemplateHTML, colors) // Assuming jobTitle and company are not needed here

	var (
		processedDocumentsResult struct {
			ProcessedResume      string `json:"generated_resume"`
			ProcessedCoverLetter string `json:"generated_cover_letter"`
		}
		jobDetailsResult struct {
			Title   string `json:"title"`
			Company string `json:"company_name"`
			Source  string `json:"source_site,omitempty"`
		}
		wg       sync.WaitGroup
		mu       sync.Mutex // To protect shared results
		errsMu   sync.Mutex // To protect multiErr
		multiErr []error
	)

	wg.Add(2)

	// Process documents (Resume and Cover Letter)
	go func(gCtx context.Context) {
		defer wg.Done()
		taskSpan := sentry.StartSpan(gCtx, "openai.task.generate_resume_cover_letter")
		defer taskSpan.Finish()
		taskSpan.SetData("input_documents_length", len(documents))

		utils.Logger.Println("Starting resume and cover letter processing with OpenAI")
		startTime := time.Now()

		// Assuming ProcessDocuments takes the combined documents string
		processedDocumentsJSON, procErr := openAIProcessor.ProcessDocuments(documents)
		duration := time.Since(startTime)
		taskSpan.SetData("duration_ms", duration.Milliseconds())

		if procErr != nil {
			taskSpan.SetTag("error", "true")
			taskSpan.SetData("error_message", procErr.Error())
			taskSpan.Status = sentry.SpanStatusAborted
			utils.Logger.Printf("OpenAI document processing failed after %v: %v", duration, procErr)
			errsMu.Lock()
			multiErr = append(multiErr, fmt.Errorf("OpenAI document processing failed: %w", procErr))
			errsMu.Unlock()
			return
		}
		utils.Logger.Printf("OpenAI document processing completed in %v", duration)
		taskSpan.SetData("output_json_length", len(processedDocumentsJSON))

		mu.Lock()
		unmarshalErr := json.Unmarshal([]byte(processedDocumentsJSON), &processedDocumentsResult)
		mu.Unlock()
		if unmarshalErr != nil {
			taskSpan.SetTag("error", "true")
			taskSpan.SetData("unmarshal_error", unmarshalErr.Error())
			// taskSpan.SetData("raw_json_response", processedDocumentsJSON) // Be cautious with PII
			taskSpan.Status = sentry.SpanStatusInvalidArgument
			errsMu.Lock()
			multiErr = append(multiErr, fmt.Errorf("failed to parse processed documents JSON: %w", unmarshalErr))
			errsMu.Unlock()
		}
	}(sentry.SetHubOnContext(ctx, sentry.CurrentHub().Clone()))

	// Process job details (Title and Company)
	go func(gCtx context.Context) {
		defer wg.Done()
		taskSpan := sentry.StartSpan(gCtx, "openai.task.extract_job_details")
		defer taskSpan.Finish()
		taskSpan.SetData("job_posting_length", len(jobPosting))

		utils.Logger.Println("Starting job details processing with OpenAI")
		startTime := time.Now()

		jobDetailsJSON, procErr := openAIProcessor.GenerateSubjectName(jobPosting) // Assumes this method exists
		duration := time.Since(startTime)
		taskSpan.SetData("duration_ms", duration.Milliseconds())

		if procErr != nil {
			taskSpan.SetTag("error", "true")
			taskSpan.SetData("error_message", procErr.Error())
			taskSpan.Status = sentry.SpanStatusAborted
			utils.Logger.Printf("Job details processing failed after %v: %v", duration, procErr)
			errsMu.Lock()
			multiErr = append(multiErr, fmt.Errorf("job details processing failed: %w", procErr))
			errsMu.Unlock()
			return
		}
		utils.Logger.Printf("Job details processing completed in %v", duration)
		taskSpan.SetData("output_json_length", len(jobDetailsJSON))

		mu.Lock()
		unmarshalErr := json.Unmarshal([]byte(jobDetailsJSON), &jobDetailsResult)
		mu.Unlock()
		if unmarshalErr != nil {
			taskSpan.SetTag("error", "true")
			taskSpan.SetData("unmarshal_error", unmarshalErr.Error())
			// taskSpan.SetData("raw_json_response", jobDetailsJSON) // Be cautious with PII
			taskSpan.Status = sentry.SpanStatusInvalidArgument
			errsMu.Lock()
			multiErr = append(multiErr, fmt.Errorf("failed to parse job details JSON: %w", unmarshalErr))
			errsMu.Unlock()
		}
	}(sentry.SetHubOnContext(ctx, sentry.CurrentHub().Clone()))

	wg.Wait()

	if len(multiErr) > 0 {
		for i, e := range multiErr {
			if i > 0 {
				utils.Logger.Printf("Additional OpenAI processing error: %v", e)
				sentry.CaptureException(fmt.Errorf("additional openai error: %w", e))
			}
		}
		err = multiErr[0] // Set the main error for the defer function
		return nil, nil, multiErr[0]
	}

	processedDocs = map[string]string{
		"resume":      processedDocumentsResult.ProcessedResume,
		"coverLetter": processedDocumentsResult.ProcessedCoverLetter,
	}
	jobDetails = map[string]string{
		"title":   jobDetailsResult.Title,
		"company": jobDetailsResult.Company,
		"source":  jobDetailsResult.Source,
	}

	span.SetData("processed_resume_length", len(processedDocs["resume"]))
	span.SetData("processed_cover_letter_length", len(processedDocs["coverLetter"]))
	span.SetData("extracted_job_title", jobDetails["title"])
	span.SetData("extracted_job_company", jobDetails["company"])

	return processedDocs, jobDetails, nil
}

// AnalyzeResumeForRecommendation processes resume text using OpenAI for job recommendations.
func AnalyzeResumeForRecommendation(ctx context.Context, resumeText string) (models.RecommendationResult, error) {
	span := sentry.StartSpan(ctx, "openai.analyze_resume_for_recommendation")
	defer span.Finish()
	span.SetData("resume_text_length", len(resumeText))

	var recommendation models.RecommendationResult

	if openAIProcessor == nil {
		err := fmt.Errorf("OpenAIProcessor not initialized in openai_service")
		utils.Logger.Println(err.Error())
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusInternalError
		return recommendation, err
	}

	recommendationJSON, err := openAIProcessor.AnalyzeResumeForRecommendation(resumeText) // Assumes this method exists
	if err != nil {
		span.SetTag("error", "true")
		span.SetData("openai_call_error", err.Error())
		span.Status = sentry.SpanStatusAborted
		return recommendation, fmt.Errorf("OpenAI analysis for recommendation failed: %w", err)
	}
	span.SetData("openai_response_json_length", len(recommendationJSON))

	if err := json.Unmarshal([]byte(recommendationJSON), &recommendation); err != nil {
		span.SetTag("error", "true")
		span.SetData("unmarshal_error", err.Error())
		// span.SetData("raw_json_response", recommendationJSON) // Be cautious with PII
		span.Status = sentry.SpanStatusInvalidArgument
		return recommendation, fmt.Errorf("failed to parse recommendation JSON from OpenAI: %w", err)
	}

	span.SetData("parsed_industry", recommendation.Industry)
	span.SetData("parsed_domain", recommendation.Domain)
	return recommendation, nil
}

func BuildEnhancedUserMessage(jobPosting, extractedResume, selectedTemplate, selectedColors string) string {
	var builder strings.Builder

	builder.WriteString("<analysis_request>\n")

	builder.WriteString("<job_description>\n")
	builder.WriteString(strings.TrimSpace(jobPosting))
	builder.WriteString("\n</job_description>\n\n")

	builder.WriteString("<current_resume>\n")
	builder.WriteString(strings.TrimSpace(extractedResume))
	builder.WriteString("\n</current_resume>\n\n")

	builder.WriteString("<selectedTemplate>\n")
	builder.WriteString(strings.TrimSpace(selectedTemplate))
	builder.WriteString("\n</selectedTemplate>\n\n")

	builder.WriteString("<selectedColors\n")
	builder.WriteString(strings.TrimSpace(selectedColors))
	builder.WriteString("\n</selectedColors\n\n")

	builder.WriteString("<task>\n")
	builder.WriteString("Optimize this resume for the job description above. ")
	builder.WriteString("Follow all guidelines in your system instructions, ")
	builder.WriteString("ensuring ATS compatibility and keyword optimization.")
	builder.WriteString("\n</task>\n")
	builder.WriteString("</analysis_request>")

	return builder.String()
}
