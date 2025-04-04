package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		handleFileUpload(w, r)
	default:
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

// Handle file uploads and web links
func handleFileUpload(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20) // 10MB limit
	if err != nil {
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	// Handle file upload
	file, handler, err := r.FormFile("file")
	if err == nil {
		defer file.Close()
		dst, _ := os.Create(fmt.Sprintf("./uploads/%s", handler.Filename))
		defer dst.Close()
		w.Write([]byte(fmt.Sprintf("File %s uploaded successfully!", handler.Filename)))
		return
	}

	// Handle web link submission
	webLink := r.FormValue("weblink")
	if webLink != "" {
		response := map[string]string{
			"message": "Weblink received",
			"url":     webLink,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	http.Error(w, "No file or weblink provided", http.StatusBadRequest)
}
