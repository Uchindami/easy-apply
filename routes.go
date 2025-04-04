package main

import "net/http"

// Setup API routes
func setupRoutes() {
	http.HandleFunc("/auth", authHandler)
	http.HandleFunc("/upload", uploadHandler)
}
