package processors

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/ledongthuc/pdf"
)

// PDFProcessor handles PDF file processing
type PDFProcessor struct {
	UploadDir string
}

// NewPDFProcessor creates a new PDF processor
func NewPDFProcessor(uploadDir string) *PDFProcessor {
	return &PDFProcessor{
		UploadDir: uploadDir,
	}
}

// ProcessPDF extracts text from a PDF file and saves it as a text file
func (p *PDFProcessor) ProcessPDF(pdfPath string) (string, error) {
	// Check if file exists and has .pdf extension
	if !fileExists(pdfPath) {
		return "", fmt.Errorf("file '%s' does not exist", pdfPath)
	}

	if filepath.Ext(strings.ToLower(pdfPath)) != ".pdf" {
		return "", fmt.Errorf("file '%s' is not a PDF file", pdfPath)
	}

	text, err := p.extractTextFromPDF(pdfPath)
	if err != nil {
		return "", fmt.Errorf("error extracting text: %v", err)
	}

	// Create output text file path
	txtPath := strings.TrimSuffix(pdfPath, filepath.Ext(pdfPath)) + ".txt"

	// Write text to output file
	err = os.WriteFile(txtPath, []byte(text), 0644)
	if err != nil {
		return "", fmt.Errorf("error writing to output file: %v", err)
	}

	return txtPath, nil
}

// ProcessPDFBuffer extracts text from a PDF buffer and returns the text content
func (p *PDFProcessor) ProcessPDFBuffer(pdfBuffer []byte) (string, error) {
	// Create a temporary file to read from buffer
	tmpFile, err := os.CreateTemp("", "pdf-*.pdf")
	if err != nil {
		return "", fmt.Errorf("error creating temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	if _, err := tmpFile.Write(pdfBuffer); err != nil {
		return "", fmt.Errorf("error writing to temp file: %v", err)
	}

	f, r, err := pdf.Open(tmpFile.Name())
	if err != nil {
		return "", fmt.Errorf("error opening PDF: %v", err)
	}
	defer f.Close()

	var textBuilder strings.Builder

	// Get total number of pages
	totalPages := r.NumPage()

	// Extract text from each page
	for pageIndex := 1; pageIndex <= totalPages; pageIndex++ {
		p := r.Page(pageIndex)
		if p.V.IsNull() {
			continue
		}

		text, err := p.GetPlainText(nil)
		if err != nil {
			return "", fmt.Errorf("error extracting text from page %d: %v", pageIndex, err)
		}

		textBuilder.WriteString(fmt.Sprintf("--- Page %d ---\n", pageIndex))
		textBuilder.WriteString(text)
		textBuilder.WriteString("\n\n")
	}

	return textBuilder.String(), nil
}

// extractTextFromPDF extracts text content from a PDF file
func (p *PDFProcessor) extractTextFromPDF(path string) (string, error) {
	f, r, err := pdf.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	var textBuilder strings.Builder

	// Get total number of pages
	totalPages := r.NumPage()

	// Extract text from each page
	for pageIndex := 1; pageIndex <= totalPages; pageIndex++ {
		p := r.Page(pageIndex)
		if p.V.IsNull() {
			continue
		}

		text, err := p.GetPlainText(nil)
		if err != nil {
			return "", err
		}

		textBuilder.WriteString(fmt.Sprintf("--- Page %d ---\n", pageIndex))
		textBuilder.WriteString(text)
		textBuilder.WriteString("\n\n")
	}

	return textBuilder.String(), nil
}

// Helper function to check if file exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}
