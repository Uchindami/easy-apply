package main

import (
	"context"
	"encoding/json"
	// "firebase.google.com/go/auth"
	"net/http"
)

func authHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var requestData struct {
		IDToken string `json:"idToken"`
	}

	err := json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	client, err := app.Auth(context.Background())
	if err != nil {
		http.Error(w, "Firebase Auth client error", http.StatusInternalServerError)
		return
	}

	token, err := client.VerifyIDToken(context.Background(), requestData.IDToken)
	if err != nil {
		http.Error(w, "Invalid ID Token", http.StatusUnauthorized)
		return
	}

	response := map[string]interface{}{
		"uid":    token.UID,
		"claims": token.Claims,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
