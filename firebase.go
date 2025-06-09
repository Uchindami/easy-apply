package main

import (
	"easy-apply/handlers"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/storage"
	"context"
	"firebase.google.com/go"
	"google.golang.org/api/option"
	"log"
)

var (
	app             *firebase.App
	firestoreClient *firestore.Client
	storageClient   *storage.Client
)

// Initialize Firebase
func initFirebase() {
	opt := option.WithCredentialsFile("easy-apply.json")

	var err error
	app, err = firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Fatalf("Error initializing Firebase: %v", err)
	}

	// Initialize Firestore client
	firestoreClient, err = app.Firestore(context.Background())
	if err != nil {
		log.Fatalf("Error initializing Firestore client: %v", err)
	}


	// Initialize Storage client
	storageClient, err = storage.NewClient(context.Background(), opt)
	if err != nil {
		log.Fatalf("Error initializing Storage client: %v", err)
	}

	handlers.FirestoreClient = firestoreClient

	log.Println("Firebase services initialized successfully")
}
