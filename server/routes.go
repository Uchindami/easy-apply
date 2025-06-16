package main

import (
	"easy-apply/sse"
	"easy-apply/handlers"   // Import the new handlers package
	"easy-apply/middleware" // Assuming middleware package exists as per original
	"net/http"

	sentryhttp "github.com/getsentry/sentry-go/http"
)

// Setup API routes
func setupRoutes(sentryHandler *sentryhttp.Handler) {
	// Ensure handlers are called from the 'handlers' package
	http.HandleFunc("/api/auth", sentryHandler.HandleFunc(middleware.WithCORS(authHandler)))
	http.HandleFunc("/api/upload", sentryHandler.HandleFunc(middleware.WithCORS(handlers.UploadHandler)))
	http.HandleFunc("/api/convert-pdf", sentryHandler.HandleFunc(middleware.WithCORS(convertPDFHandler)))
	http.HandleFunc("/api/recommendations", sentryHandler.HandleFunc(middleware.WithCORS(handlers.JobRecommendationsHandler)))
	http.HandleFunc("/api/validate-url", sentryHandler.HandleFunc(middleware.WithCORS(handlers.ValidateURLHandler)))
	// http.HandleFunc("/events", sentryHandler.HandleFunc(middleware.WithCORS(middleware.WithSSE(TestHandler))))
	http.HandleFunc("/api/events/", sentryHandler.HandleFunc(middleware.WithCORS(sse.EventsHandler)))
}