package database

import (
	"context"
	"easy-apply/models" // Assuming models are in this path
	"easy-apply/utils"  // For utils.ExtractSourceFromURL and utils.Logger
	"errors"
	"fmt"

	"cloud.google.com/go/firestore"
	"github.com/getsentry/sentry-go"
)

const (
	statusProcessing = "processing" // Consider moving to a common constants file if used elsewhere
	statusCompleted  = "completed"
)

// CreateHistoryRecord creates an initial history record in Firestore.
func CreateHistoryRecord(ctx context.Context, client *firestore.Client, userID, historyID, webLink string) error {
	span := sentry.StartSpan(ctx, "db.create_history_record")
	defer span.Finish()
	span.SetTag("user_id", userID)
	span.SetData("history_id", historyID)
	span.SetData("web_link", webLink)

	if client == nil {
		return errors.New("Firestore client not initialized")
	}
	historyRef := client.Collection("Users").Doc(userID).Collection("History").Doc(historyID)

	initialHistory := map[string]interface{}{
		"timestamp": firestore.ServerTimestamp,
		"status":    statusProcessing,
		"original": map[string]interface{}{
			"resumePath": "",
			"jobLink":    webLink,
		},
		"jobDetails": map[string]interface{}{
			"title":   "Processing...",
			"company": "Processing...",
			"source":  utils.ExtractSourceFromURL(webLink),
		},
		"createdAt": firestore.ServerTimestamp,
	}

	_, err := historyRef.Set(ctx, initialHistory)
	if err != nil {
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusAborted
		return fmt.Errorf("failed to create history record: %w", err)
	}
	return nil
}

// UpdateHistoryRecord updates an existing history record in Firestore.
func UpdateHistoryRecord(ctx context.Context, client *firestore.Client, historyRef *firestore.DocumentRef, extractedResume, processedResume, processedCoverLetter string, jobDetails map[string]string) error {
	span := sentry.StartSpan(ctx, "db.update_history_record")
	defer span.Finish()
	span.SetData("history_ref_path", historyRef.Path)

	if client == nil { // Should not happen if historyRef is valid, but good check
		return errors.New("Firestore client not initialized for update")
	}

	updates := []firestore.Update{
		{Path: "status", Value: statusCompleted},
		{Path: "original.resumeText", Value: extractedResume},
		{Path: "generated", Value: map[string]interface{}{
			"resumeText":      processedResume,
			"coverLetterText": processedCoverLetter,
		}},
		{Path: "jobDetails.title", Value: jobDetails["title"]},
		{Path: "jobDetails.company", Value: jobDetails["company"]},
		{Path: "completedAt", Value: firestore.ServerTimestamp},
	}
	if source, ok := jobDetails["source"]; ok && source != "" {
		updates = append(updates, firestore.Update{Path: "jobDetails.source", Value: source})
	}

	_, err := historyRef.Update(ctx, updates)
	if err != nil {
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusAborted
		return fmt.Errorf("failed to update history record: %w", err)
	}
	return nil
}

// UpdateUserRecommendation updates the user's profile with the latest job recommendation.
func UpdateUserRecommendation(ctx context.Context, client *firestore.Client, userID string, recommendation models.RecommendationResult, filename string) error {
	span := sentry.StartSpan(ctx, "db.update_user_recommendation")
	defer span.Finish()
	span.SetTag("user_id", userID)
	span.SetData("filename", filename)

	if client == nil {
		return errors.New("Firestore client not initialized")
	}
	if userID == "" {
		err := errors.New("userID cannot be empty when updating Firestore recommendation")
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusInvalidArgument
		return err
	}

	userRef := client.Collection("Users").Doc(userID)
	updateData := map[string]interface{}{
		"Recommendation": map[string]interface{}{
			"industry":   recommendation.Industry,
			"domain":     recommendation.Domain,
			"confidence": recommendation.Confidence,
			"reasoning":  recommendation.Reasoning,
			"updatedAt":  firestore.ServerTimestamp,
			"sourceFile": filename,
		},
	}
	if filename != "" {
		updateData["currentDocument"] = filename
	}

	_, err := userRef.Set(ctx, updateData, firestore.MergeAll)
	if err != nil {
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusAborted
		return fmt.Errorf("failed to update user recommendation in Firestore: %w", err)
	}
	return nil
}
