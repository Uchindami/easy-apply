package main

import (
	"context"
	"firebase.google.com/go"
	"google.golang.org/api/option"
	"log"
)

var app *firebase.App

// Initialize Firebase
func initFirebase() {
	opt := option.WithCredentialsFile("easy-apply.json")

	var err error
	app, err = firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Fatalf("Error initializing Firebase: %v", err)
	}
}