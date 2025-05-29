package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/getsentry/sentry-go"
	sentryhttp "github.com/getsentry/sentry-go/http"
)

func main() {
	// To initialize Sentry's handler, you need to initialize Sentry itself beforehand
	if err := sentry.Init(sentry.ClientOptions{
		Dsn: "https://4287ce3953bea35493bcf28251325a9c@o4507588309221376.ingest.de.sentry.io/4509407954075728",
	}); err != nil {
		fmt.Printf("Sentry initialization failed: %v\n", err)
	}

	// Create an instance of sentryhttp
	sentryHandler := sentryhttp.New(sentryhttp.Options{})

	initFirebase()             // Initialize Firebase
	setupRoutes(sentryHandler) // Register Routes

	// go launchScraper() // Start the scraper concurrently

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port if not set
	}

	fmt.Printf("Server running on port %s\n", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), nil); err != nil {
		panic(err)
	}
}
