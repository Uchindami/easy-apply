package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {

	err := godotenv.Load() // loads .env file
	if err != nil {
		log.Println("No .env file found or error loading it")
	}

	initFirebase() // Initialize Firebase
	setupRoutes()  // Register Routes

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port if not set
	}
	fmt.Printf("Server running on port %s\n", port)
	http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
}
