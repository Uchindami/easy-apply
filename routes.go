package main

import (
	"net/http"
	"easy-apply/middleware"
)


// Setup API routes
func setupRoutes() {
	http.HandleFunc("/auth", middleware.WithCORS(authHandler))
	http.HandleFunc("/upload", middleware.WithCORS(uploadHandler))
}
