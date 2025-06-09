package services

import (
	"bytes"
	"context"
	"easy-apply/processors" // Assuming this is the correct path to your processors package
	"easy-apply/utils"      // For utils.Logger
	"fmt"
	"io"
	"time"

	"github.com/getsentry/sentry-go"
)

// FileProcessor is an instance of your file processing logic.
// This assumes FileProcessor is defined in the 'processors' package.
// We'll need to initialize it, perhaps in this package's init or passed from main.
var fileProcessor *processors.FileProcessor

// InitializeFileService sets up the necessary components for the file service.
// This should be called from main.go or an appropriate initialization point.
func InitializeFileService(fp *processors.FileProcessor) {
	fileProcessor = fp
	utils.Logger.Println("FileService initialized with FileProcessor.")
}

// ProcessFileContent reads the file content into a byte buffer.
func ProcessFileContent(ctx context.Context, file io.Reader, filename string) ([]byte, error) {
	span := sentry.StartSpan(ctx, "file.process_content")
	defer span.Finish()
	span.SetData("filename", filename)

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, file); err != nil {
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusAborted
		return nil, fmt.Errorf("failed to read file content: %w", err)
	}
	span.SetData("file_size_bytes", buf.Len())
	return buf.Bytes(), nil
}

// ExtractTextFromFile extracts text from the given file content and extension.
func ExtractTextFromFile(ctx context.Context, fileContent []byte, fileExt string) (string, error) {
	span := sentry.StartSpan(ctx, "file.extract_text")
	defer span.Finish()
	span.SetData("file_ext", fileExt)
	span.SetData("file_content_length", len(fileContent))

	if fileProcessor == nil {
		err := fmt.Errorf("FileProcessor not initialized in file_service")
		utils.Logger.Println(err.Error())
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusInternalError
		return "", err
	}

	startTime := time.Now()
	extractedText, err := fileProcessor.ProcessFileBuffer(fileContent, fileExt) // Assumes ProcessFileBuffer is a method of FileProcessor
	duration := time.Since(startTime)
	span.SetData("duration_ms", duration.Milliseconds())

	if err != nil {
		utils.Logger.Printf("File processing failed after %v: %v", duration, err)
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusAborted
		return "", fmt.Errorf("file processing failed: %w", err)
	}
	utils.Logger.Printf("File processing completed in %v", duration)
	span.SetData("extracted_text_length", len(extractedText))
	return extractedText, nil
}
