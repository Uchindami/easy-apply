package main

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
)

type PDFService struct {
	GotenbergURL string
	Client       *http.Client
}

type ConvertPDFRequest struct {
	HTML string `json:"html"`
}

func NewPDFService(gotenbergURL string) *PDFService {
	return &PDFService{
		GotenbergURL: gotenbergURL,
		Client:       http.DefaultClient,
	}
}

func (s *PDFService) ConvertHTMLToPDF(html string) (io.Reader, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("files", "index.html")
	if err != nil {
		return nil, err
	}

	if _, err = io.WriteString(part, html); err != nil {
		return nil, err
	}

	// Add margin options - set all margins to 0
	if err := writer.WriteField("marginTop", "0"); err != nil {
		return nil, err
	}
	if err := writer.WriteField("marginBottom", "0"); err != nil {
		return nil, err
	}
	if err := writer.WriteField("marginLeft", "0"); err != nil {
		return nil, err
	}
	if err := writer.WriteField("marginRight", "0"); err != nil {
		return nil, err
	}

	// You might also want to explicitly set paper size to A4
	if err := writer.WriteField("paperWidth", "8.27"); err != nil { // 8.27 inches = 210mm (A4 width)
		return nil, err
	}
	if err := writer.WriteField("paperHeight", "11.7"); err != nil { // 11.7 inches = 297mm (A4 height)
		return nil, err
	}

	if err = writer.Close(); err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", s.GotenbergURL, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, ErrGotenbergError
	}

	return resp.Body, nil
}

func convertPDFHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ConvertPDFRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	pdfService := NewPDFService("http://localhost:3000/forms/chromium/convert/html")
	pdfReader, err := pdfService.ConvertHTMLToPDF(req.HTML)
	if err != nil {
		handleServiceError(w, err)
		return
	}
	defer func() {
		if closer, ok := pdfReader.(io.Closer); ok {
			closer.Close()
		}
	}()

	w.Header().Set("Content-Type", "application/pdf")
	if _, err := io.Copy(w, pdfReader); err != nil {
		http.Error(w, "Failed to stream PDF", http.StatusInternalServerError)
		return
	}
}

func handleServiceError(w http.ResponseWriter, err error) {
	switch err {
	case ErrGotenbergError:
		http.Error(w, "Gotenberg error", http.StatusBadGateway)
	default:
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

var (
	ErrGotenbergError = errors.New("gotenberg error")
)

// Initialize errors package if not already done
var errors = struct {
	New func(text string) error
}{
	New: func(text string) error { return errorString(text) },
}

type errorString string

func (e errorString) Error() string { return string(e) }
