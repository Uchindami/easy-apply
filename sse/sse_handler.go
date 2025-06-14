package sse

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"easy-apply/utils"
)

// SSEClient represents a single SSE connection
// Exported for reuse
type SSEClient struct {
	Channel  chan string
	ClientID string
	Created  time.Time
}

var (
	sseClients = make(map[string]*SSEClient)
	sseMutex   = &sync.RWMutex{}
)

// ProgressUpdate defines the JSON structure for messages sent over SSE
// Exported for reuse
type ProgressUpdate struct {
	Step    string `json:"step"`
	Status  string `json:"status"`
	Message string `json:"message,omitempty"`
}

// SendProgress creates a JSON payload and sends it to the specified SSE channel
func SendProgress(channelID, step, status, message string) {
	if channelID == "" {
		return
	}

	update := ProgressUpdate{Step: step, Status: status, Message: message}
	jsonData, err := json.Marshal(update)
	if err != nil {
		utils.Logger.Printf("Error marshalling progress update: %v", err)
		return
	}

	sseMutex.RLock()
	client, exists := sseClients[channelID]
	sseMutex.RUnlock()

	if !exists {
		utils.Logger.Printf("SSE client %s not found", channelID)
		return
	}

	// Non-blocking send with timeout
	select {
	case client.Channel <- string(jsonData):
		utils.Logger.Printf("Sent progress for %s: %s", channelID, string(jsonData))
	case <-time.After(5 * time.Second):
		utils.Logger.Printf("Progress send timeout for channel %s", channelID)
	default:
		utils.Logger.Printf("Progress channel for %s is full. Message dropped.", channelID)
	}
}

// EventsHandler manages the lifecycle of an SSE connection
func EventsHandler(w http.ResponseWriter, r *http.Request) {
	channelID := strings.TrimPrefix(r.URL.Path, "/events/")
	if channelID == "" {
		utils.HandleError(w, r, "Channel ID is required", http.StatusBadRequest, fmt.Errorf("channel ID is missing"))
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Cache-Control")

	flusher, ok := w.(http.Flusher)
	if !ok {
		utils.HandleError(w, r, "Streaming unsupported", http.StatusInternalServerError, fmt.Errorf("streaming unsupported"))
		return
	}

	client := &SSEClient{
		Channel:  make(chan string, 100),
		ClientID: channelID,
		Created:  time.Now(),
	}

	sseMutex.Lock()
	sseClients[channelID] = client
	sseMutex.Unlock()

	utils.Logger.Printf("SSE client connected: %s", channelID)

	fmt.Fprintf(w, "data: %s\n\n", `{"step":"connection","status":"active","message":"Connected to progress stream"}`)
	flusher.Flush()

	defer func() {
		sseMutex.Lock()
		delete(sseClients, channelID)
		close(client.Channel)
		sseMutex.Unlock()
		utils.Logger.Printf("SSE client disconnected: %s", channelID)
	}()

	ctx := r.Context()
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case msg, open := <-client.Channel:
			if !open {
				return
			}
			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()
		case <-ticker.C:
			fmt.Fprintf(w, "data: %s\n\n", `{"step":"heartbeat","status":"active","message":"Connection alive"}`)
			flusher.Flush()
		}
	}
}

// CleanupOldSSEConnections removes SSE clients older than 1 hour
func CleanupOldSSEConnections() {
	sseMutex.Lock()
	defer sseMutex.Unlock()

	cutoff := time.Now().Add(-1 * time.Hour)
	for id, client := range sseClients {
		if client.Created.Before(cutoff) {
			close(client.Channel)
			delete(sseClients, id)
			utils.Logger.Printf("Cleaned up old SSE connection: %s", id)
		}
	}
}
