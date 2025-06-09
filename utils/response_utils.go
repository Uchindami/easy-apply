package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os" // Added for logger initialization

	"github.com/getsentry/sentry-go"
)

const (
	// ContentTypeJSON is the standard JSON content type.
	ContentTypeJSON = "application/json"
)

var Logger *log.Logger

func init() {
	Logger = log.New(os.Stdout, "APP_UTILS: ", log.LstdFlags|log.Lshortfile)
}

// GetSentryLevel maps HTTP status codes to Sentry severity levels.
func GetSentryLevel(statusCode int) sentry.Level {
	switch {
	case statusCode >= 500:
		return sentry.LevelError
	case statusCode >= 400:
		return sentry.LevelWarning
	default:
		return sentry.LevelInfo
	}
}

// HandleError captures the error with Sentry and sends a JSON error response.
func HandleError(w http.ResponseWriter, r *http.Request, message string, statusCode int, originalErr error) {
	hub := sentry.GetHubFromContext(r.Context())
	if hub == nil {
		hub = sentry.CurrentHub().Clone()
		hub.Scope().SetRequest(r)
	}

	hub.WithScope(func(scope *sentry.Scope) {
		scope.SetTag("error_source", "api_handler")
		scope.SetTag("status_code", fmt.Sprintf("%d", statusCode))
		scope.SetLevel(GetSentryLevel(statusCode))
		scope.SetContext("error_details", map[string]interface{}{
			"message":     message,
			"status_code": statusCode,
			"path":        r.URL.Path,
			"method":      r.Method,
		})
		scope.AddBreadcrumb(&sentry.Breadcrumb{
			Message:  fmt.Sprintf("API error handled: %s", message),
			Category: "api.error",
			Level:    sentry.LevelError,
			Data: map[string]interface{}{
				"status_code": statusCode,
				"path":        r.URL.Path,
			},
		}, 10)

		if originalErr != nil {
			Logger.Printf("Error for %s %s: %s (status: %d) - Original: %v", r.Method, r.URL.Path, message, statusCode, originalErr)
			scope.SetExtra("original_error_message", originalErr.Error())
			hub.CaptureException(originalErr)
		} else {
			Logger.Printf("Error for %s %s: %s (status: %d)", r.Method, r.URL.Path, message, statusCode)
			hub.CaptureMessage(message)
		}
	})

	response := map[string]interface{}{
		"success": false,
		"error":   message,
	}

	w.Header().Set("Content-Type", ContentTypeJSON)
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		Logger.Printf("CRITICAL: Failed to encode error response: %v", err)
		sentry.CaptureException(fmt.Errorf("failed to encode error JSON response for %s: %w", message, err))
	}
}

// SendJSONResponse sends a JSON response with the given data and status code.
func SendJSONResponse(w http.ResponseWriter, r *http.Request, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", ContentTypeJSON)
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		Logger.Printf("Failed to encode JSON response: %v", err)
		hub := sentry.GetHubFromContext(r.Context())
		if hub == nil {
			hub = sentry.CurrentHub()
		}
		hub.CaptureException(fmt.Errorf("failed to encode JSON response: %w", err))
	}
}
