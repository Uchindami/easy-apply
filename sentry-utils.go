package main

import (
	"context"
	"os"

	"github.com/getsentry/sentry-go"
)

// getSentryHub is a utility to retrieve the Sentry Hub from context or the current one.
// It's good practice to use the hub from context if available.
func getSentryHub(ctx context.Context) *sentry.Hub {
	if hub := sentry.GetHubFromContext(ctx); hub != nil {
		return hub
	}
	return sentry.CurrentHub()
}

// Utility functions for Sentry

// Sentry Level utility (stub, implement as needed)
func getSentryLevel(statusCode int) sentry.Level {
	switch {
	case statusCode >= 500:
		return sentry.LevelError
	case statusCode >= 400:
		return sentry.LevelWarning
	default:
		return sentry.LevelInfo
	}
}

func getEnvironment() string {
	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		return "development"
	}
	return env
}

func getVersion() string {
	version := os.Getenv("APP_VERSION")
	if version == "" {
		return "unknown"
	}
	return version
}

func isDevelopment() bool {
	return getEnvironment() == "development"
}
