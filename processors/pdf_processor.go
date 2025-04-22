package processors

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"

	"github.com/ledongthuc/pdf"
	docx "github.com/nguyenthenguyen/docx"
)

const (
	ocrSpaceAPIURL  = "https://api.ocr.space/parse/image"
	minTextLength   = 100 // Minimum characters to consider extraction successful
)

// FileProcessor handles various file types processing
type FileProcessor struct{}

// NewFileProcessor creates a new file processor
func NewFileProcessor() *FileProcessor {
	return &FileProcessor{}
}

// ProcessFileBuffer extracts text from a file buffer based on its type
func (p *FileProcessor) ProcessFileBuffer(fileBuffer []byte, fileExt string) (string, error) {
	switch strings.ToLower(fileExt) {
	case ".pdf":
		return p.processPDFBuffer(fileBuffer)
	case ".docx":
		return p.processDOCXBuffer(fileBuffer)
	case ".txt":
		return string(fileBuffer), nil
	default:
		return "", fmt.Errorf("unsupported file format: %s", fileExt)
	}
}

// processPDFBuffer handles PDF files with standard extraction and OCR fallback
func (p *FileProcessor) processPDFBuffer(pdfBuffer []byte) (string, error) {
	// First try standard extraction
	text, err := p.extractTextFromPDFBuffer(pdfBuffer)
	if err != nil {
		return "", fmt.Errorf("PDF extraction failed: %v", err)
	}

	// If text is too short, try OCR
	if len(text) < minTextLength {
		ocrText, ocrErr := p.extractTextWithOCRSpace(pdfBuffer)
		if ocrErr != nil {
			return text, fmt.Errorf("standard extraction returned minimal text, OCR also failed: %v", ocrErr)
		}
		return ocrText, nil
	}

	return text, nil
}

// extractTextFromPDFBuffer extracts text from PDF buffer using standard method
func (p *FileProcessor) extractTextFromPDFBuffer(pdfBuffer []byte) (string, error) {
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
	totalPages := r.NumPage()

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

// processDOCXBuffer handles DOCX files
func (p *FileProcessor) processDOCXBuffer(docxBuffer []byte) (string, error) {
	tmpFile, err := os.CreateTemp("", "docx-*.docx")
	if err != nil {
		return "", fmt.Errorf("error creating temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	if _, err := tmpFile.Write(docxBuffer); err != nil {
		return "", fmt.Errorf("error writing to temp file: %v", err)
	}

	doc, err := docx.ReadDocxFile(tmpFile.Name())
	if err != nil {
		return "", fmt.Errorf("error reading DOCX file: %v", err)
	}
	defer doc.Close()

	return doc.Editable().GetContent(), nil
}

// extractTextWithOCRSpace uses OCR.Space API for image-based content
func (p *FileProcessor) extractTextWithOCRSpace(fileBuffer []byte) (string, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	
	part, err := writer.CreateFormFile("file", "document.pdf")
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %v", err)
	}
	
	if _, err := io.Copy(part, bytes.NewReader(fileBuffer)); err != nil {
		return "", fmt.Errorf("failed to copy file data: %v", err)
	}
	writer.Close()

	req, err := http.NewRequest("POST", ocrSpaceAPIURL, body)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("apikey", os.Getenv("OCRSPACE_API_KEY"))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("API request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API returned non-200 status: %d", resp.StatusCode)
	}

	var result struct {
		ParsedResults []struct {
			ParsedText string `json:"ParsedText"`
		} `json:"ParsedResults"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode API response: %v", err)
	}

	if len(result.ParsedResults) == 0 {
		return "", fmt.Errorf("no text found in OCR result")
	}

	return result.ParsedResults[0].ParsedText, nil
}