package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

var (
	ErrGotenbergError     = errors.New("gotenberg conversion error")
	ErrInvalidHTML        = errors.New("invalid HTML content")
	ErrServiceUnavailable = errors.New("gotenberg service unavailable")
)

type PDFService struct {
	GotenbergURL string
	Client       *http.Client
	Logger       *log.Logger
}

type PDFOptions struct {
	// Paper settings
	PaperWidth  string // in inches
	PaperHeight string // in inches

	// Margins (in inches)
	MarginTop    string
	MarginBottom string
	MarginLeft   string
	MarginRight  string

	// Print settings
	PrintBackground bool
	Landscape       bool
	Scale           string // 0.1 to 2.0

	// Quality settings
	PreferCSSPageSize bool
	GenerateTaggedPDF bool

	// Wait settings
	WaitDelay       string // e.g., "1s", "2s"
	WaitForSelector string // CSS selector to wait for
}

type ConvertPDFRequest struct {
	HTML    string     `json:"html"`
	Options PDFOptions `json:"options,omitempty"`
}

func NewPDFService(gotenbergURL string) *PDFService {
	return &PDFService{
		GotenbergURL: gotenbergURL,
		Client: &http.Client{
			Timeout: 30 * time.Second,
		},
		Logger: log.New(log.Writer(), "[PDF-Service] ", log.LstdFlags),
	}
}

func (s *PDFService) ConvertHTMLToPDF(ctx context.Context, html string, options *PDFOptions) (io.ReadCloser, error) {
	if html == "" {
		return nil, ErrInvalidHTML
	}

	// Set default options if none provided
	if options == nil {
		options = s.getDefaultOptions()
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add HTML file
	part, err := writer.CreateFormFile("files", "index.html")
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err = io.WriteString(part, html); err != nil {
		return nil, fmt.Errorf("failed to write HTML content: %w", err)
	}

	// Add CSS for better PDF rendering
	cssContent := s.getEnhancedCSS()
	cssPart, err := writer.CreateFormFile("files", "styles.css")
	if err != nil {
		return nil, fmt.Errorf("failed to create CSS file: %w", err)
	}
	if _, err = io.WriteString(cssPart, cssContent); err != nil {
		return nil, fmt.Errorf("failed to write CSS content: %w", err)
	}

	// Apply PDF options
	if err := s.applyPDFOptions(writer, options); err != nil {
		return nil, fmt.Errorf("failed to apply PDF options: %w", err)
	}

	if err = writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	// Create request with context
	req, err := http.NewRequestWithContext(ctx, "POST", s.GotenbergURL, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	s.Logger.Printf("Converting HTML to PDF with options: %+v", options)

	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		defer resp.Body.Close()
		bodyBytes, _ := io.ReadAll(resp.Body)
		s.Logger.Printf("Gotenberg error (status %d): %s", resp.StatusCode, string(bodyBytes))

		switch resp.StatusCode {
		case http.StatusServiceUnavailable:
			return nil, ErrServiceUnavailable
		default:
			return nil, fmt.Errorf("%w: status %d", ErrGotenbergError, resp.StatusCode)
		}
	}

	return resp.Body, nil
}

func (s *PDFService) getDefaultOptions() *PDFOptions {
	return &PDFOptions{
		PaperWidth:        "8.27",  // A4 width in inches
		PaperHeight:       "11.69", // A4 height in inches
		MarginTop:         "0.5",
		MarginBottom:      "0.5",
		MarginLeft:        "0.5",
		MarginRight:       "0.5",
		PrintBackground:   true,
		Landscape:         false,
		Scale:             "1.0",
		PreferCSSPageSize: true,
		GenerateTaggedPDF: true,
		WaitDelay:         "1s",
	}
}

func (s *PDFService) applyPDFOptions(writer *multipart.Writer, options *PDFOptions) error {
	fields := map[string]string{
		"paperWidth":   options.PaperWidth,
		"paperHeight":  options.PaperHeight,
		"marginTop":    options.MarginTop,
		"marginBottom": options.MarginBottom,
		"marginLeft":   options.MarginLeft,
		"marginRight":  options.MarginRight,
		"scale":        options.Scale,
		"waitDelay":    options.WaitDelay,
	}

	// Add boolean fields
	if options.PrintBackground {
		fields["printBackground"] = "true"
	}
	if options.Landscape {
		fields["landscape"] = "true"
	}
	if options.PreferCSSPageSize {
		fields["preferCSSPageSize"] = "true"
	}
	if options.GenerateTaggedPDF {
		fields["generateTaggedPDF"] = "true"
	}
	if options.WaitForSelector != "" {
		fields["waitForSelector"] = options.WaitForSelector
	}

	// Write all fields
	for key, value := range fields {
		if value != "" {
			if err := writer.WriteField(key, value); err != nil {
				return fmt.Errorf("failed to write field %s: %w", key, err)
			}
		}
	}

	return nil
}

func (s *PDFService) getEnhancedCSS() string {
	return `
		/* Enhanced CSS for better PDF rendering */
		@media print {
			* {
				-webkit-print-color-adjust: exact !important;
				color-adjust: exact !important;
				print-color-adjust: exact !important;
			}
			
			body {
				margin: 0;
				padding: 0;
			}
			
			.page-break {
				page-break-before: always;
			}
			
			.no-break {
				page-break-inside: avoid;
			}
			
			/* Ensure links are visible in PDF */
			a {
				color: inherit !important;
				text-decoration: underline !important;
			}
			
			/* Better font rendering */
			body, * {
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
				-webkit-font-smoothing: antialiased;
				-moz-osx-font-smoothing: grayscale;
			}
		}
		
		/* General improvements */
		img {
			max-width: 100%;
			height: auto;
		}
		
		table {
			border-collapse: collapse;
			width: 100%;
		}
		
		/* Ensure proper spacing */
		.section {
			margin-bottom: 1.5rem;
		}
	`
}

// HTTP Handlers
func convertPDFHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	var req ConvertPDFRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	gotenbergURL := os.Getenv("GOTENBERG_URL")
	if gotenbergURL == "" {
		gotenbergURL = "http://gotenberg:3000/forms/chromium/convert/html"
	}

	pdfService := NewPDFService(gotenbergURL)
	pdfReader, err := pdfService.ConvertHTMLToPDF(ctx, req.HTML, &req.Options)
	if err != nil {
		handleServiceError(w, err)
		return
	}
	defer pdfReader.Close()

	// Set appropriate headers
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "inline; filename=\"document.pdf\"")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

	if _, err := io.Copy(w, pdfReader); err != nil {
		pdfService.Logger.Printf("Failed to stream PDF: %v", err)
		// Don't send error response here as headers are already written
		return
	}

	pdfService.Logger.Println("PDF conversion completed successfully")
}

func handleServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrInvalidHTML):
		http.Error(w, "Invalid HTML content", http.StatusBadRequest)
	case errors.Is(err, ErrServiceUnavailable):
		http.Error(w, "PDF service temporarily unavailable", http.StatusServiceUnavailable)
	case errors.Is(err, ErrGotenbergError):
		http.Error(w, "PDF conversion failed", http.StatusBadGateway)
	case errors.Is(err, context.DeadlineExceeded):
		http.Error(w, "PDF conversion timeout", http.StatusRequestTimeout)
	default:
		log.Printf("Unexpected error: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// Health check endpoint
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "pdf-converter",
	})
}
