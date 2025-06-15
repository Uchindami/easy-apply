package middleware

import (
    "net/http"
)

func WithCORS(handler http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        enableCORS(w)
        
        // Preflight OPTIONS request
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusOK)
            return
        }
        
        handler(w, r)
    }
}

func enableCORS(w http.ResponseWriter) {
    // w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
    w.Header().Add("Access-Control-Allow-Origin", "https://399f-102-70-10-67.ngrok-free.app")
    w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// Separate function for SSE-specific headers
func WithSSE(handler http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "text/event-stream")
        w.Header().Set("Cache-Control", "no-cache")
        w.Header().Set("Connection", "keep-alive")
        
        handler(w, r)
    }
}