package main

import (
	"easy-apply/handlers"   // Import the new handlers package
	"easy-apply/middleware" // Assuming middleware package exists as per original
	"fmt"
	"log"
	"net/http"
	"time"

	sentryhttp "github.com/getsentry/sentry-go/http"
)

// Setup API routes
func setupRoutes(sentryHandler *sentryhttp.Handler) {
	// Ensure handlers are called from the 'handlers' package
	http.HandleFunc("/auth", sentryHandler.HandleFunc(middleware.WithCORS(authHandler)))
	http.HandleFunc("/upload", sentryHandler.HandleFunc(middleware.WithCORS(handlers.UploadHandler)))
	http.HandleFunc("/convert-pdf", sentryHandler.HandleFunc(middleware.WithCORS(convertPDFHandler)))
	http.HandleFunc("/recommendations", sentryHandler.HandleFunc(middleware.WithCORS(handlers.JobRecommendationsHandler)))
	http.HandleFunc("/validate-url", sentryHandler.HandleFunc(middleware.WithCORS(handlers.ValidateURLHandler)))
	http.HandleFunc("/events", sentryHandler.HandleFunc(middleware.WithCORS(middleware.WithSSE(TestHandler)))) // If you have a TestHandler
}

func TestHandler(w http.ResponseWriter, r *http.Request) {
	clientGone := r.Context().Done()

	counter := 0
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-clientGone:
			log.Println("Client disconnected")
			return
		case <-ticker.C:
			counter++
			// Send data in SSE format
			fmt.Fprintf(w, "data: {\"counter\": %d, \"timestamp\": \"%s\"}\n\n",
				counter, time.Now().Format("15:04:05"))

			// Flush the data to client
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
		}
	}
}
