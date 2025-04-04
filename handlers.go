package main

import (
	"encoding/json"
	"net/http"
	"strconv"
)

// Get all items
func getItems(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

// Add a new item
func addItem(w http.ResponseWriter, r *http.Request) {
	var newItem Item
	if err := json.NewDecoder(r.Body).Decode(&newItem); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	mu.Lock()
	newItem.ID = nextID
	nextID++
	items = append(items, newItem)
	mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newItem)
}

// Update an existing item
func updateItem(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 1 {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var updatedItem Item
	if err := json.NewDecoder(r.Body).Decode(&updatedItem); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	for i, item := range items {
		if item.ID == id {
			items[i].Name = updatedItem.Name
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(items[i])
			return
		}
	}

	http.Error(w, "Item not found", http.StatusNotFound)
}

// Delete an item
func deleteItem(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 1 {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	for i, item := range items {
		if item.ID == id {
			items = append(items[:i], items[i+1:]...)
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, "Item not found", http.StatusNotFound)
}
