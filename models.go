package main

import "sync"

// Item represents an entity in our API
type Item struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// Global variables for in-memory storage
var (
	items  = []Item{} // Slice to hold items
	nextID = 1        // Auto-increment ID
	mu     sync.Mutex // Mutex for thread safety
)
