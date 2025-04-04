package main

import (
	"fmt"
	"net/http"
)

func main() {
	initFirebase() // Initialize Firebase
	setupRoutes()  // Register Routes

	port := 8080
	fmt.Printf("Server running on port %d\n", port)
	http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
}
