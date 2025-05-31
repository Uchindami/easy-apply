package main

import (
	"easy-apply/middleware"
	"net/http"

	sentryhttp "github.com/getsentry/sentry-go/http"
)

// Setup API routes
func setupRoutes(sentryHandler *sentryhttp.Handler) {
	http.HandleFunc("/auth", sentryHandler.HandleFunc(middleware.WithCORS(authHandler)))
	http.HandleFunc("/upload", sentryHandler.HandleFunc(middleware.WithCORS(uploadHandler)))
	http.HandleFunc("/convert-pdf", sentryHandler.HandleFunc(middleware.WithCORS(convertPDFHandler)))
	http.HandleFunc("/recommendations", sentryHandler.HandleFunc(middleware.WithCORS(jobRecommendationsHandler)))
	// http.HandleFunc("/test", sentryHandler.HandleFunc(middleware.WithCORS(testHandler)))
}
