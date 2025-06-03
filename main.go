package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/getsentry/sentry-go"
	sentryhttp "github.com/getsentry/sentry-go/http"
)

// Enhanced main.go with better Sentry configuration
func main() {
	// Use environment variable for DSN
	dsn := os.Getenv("SENTRY_DSN")
	if dsn == "" {
		dsn = "https://4287ce3953bea35493bcf28251325a9c@o4507588309221376.ingest.de.sentry.io/4509407954075728"
	}

	// Enhanced Sentry initialization with more options
	if err := sentry.Init(sentry.ClientOptions{
		Dsn:              dsn,
		SampleRate:       1.0, // Capture 100% of errors
		TracesSampleRate: 0.1, // Capture 10% of performance data
		// 		EnableTracing: true,
		Release:     "1.0-pre-beta",
		Environment: "development",
		BeforeSend: func(event *sentry.Event, hint *sentry.EventHint) *sentry.Event {
			// Filter out sensitive data or modify events before sending
			if event.Request != nil {
				// Remove sensitive headers
				delete(event.Request.Headers, "Authorization")
				delete(event.Request.Headers, "Cookie")
			}
			return event
		},
	}); err != nil {
		fmt.Printf("Sentry initialization failed: %v\n", err)
	}

	// Start a Sentry root transaction for the application run
	rootCtx := context.Background()
	rootTx := sentry.StartTransaction(rootCtx, "app.run", sentry.WithTransactionName("ApplicationRun"))
	defer rootTx.Finish()
	ctx := rootTx.Context()

	// Flush buffered events on exit
	defer sentry.Flush(2 * time.Second)

	// Sentry HTTP handler with context propagation
	sentryHandler := sentryhttp.New(sentryhttp.Options{
		Repanic:         true,
		WaitForDelivery: false,
		Timeout:         3 * time.Second,
	})

	initFirebase()
	setupRoutes(sentryHandler)
	go launchScraper(ctx)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server running on port %s\n", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), nil); err != nil {
		// Capture server startup errors
		sentry.CaptureException(err)
		fmt.Printf("Server failed: %v\n", err)
	}
}
