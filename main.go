package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {

	initFirebase() // Initialize Firebase
	setupRoutes()  // Register Routes

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port if not set
	}
	fmt.Printf("Server running on port %s\n", port)
	http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
}
