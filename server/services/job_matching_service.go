package services

import (
	"context"
	"easy-apply/models" // For models.RecommendationResult
	"easy-apply/utils"  // For utils.Logger
	"errors"
	"fmt"

	"cloud.google.com/go/firestore"
	"github.com/getsentry/sentry-go"
)

// FindMatchingJobs queries Firestore for jobs matching the recommendation criteria.
func FindMatchingJobs(ctx context.Context, client *firestore.Client, recommendation models.RecommendationResult) ([]map[string]interface{}, error) {
	span := sentry.StartSpan(ctx, "db.find_matching_jobs")
	defer span.Finish()
	span.SetData("recommendation_industry", recommendation.Industry)
	span.SetData("recommendation_domain", recommendation.Domain)

	if client == nil {
		return nil, errors.New("firestore client not initialized")
	}
	// Example query: Adjust based on your actual schema and matching logic
	query := client.CollectionGroup("listings").
		Where("industry", "==", recommendation.Industry)
	// Consider adding more filters or more complex querying/ranking.

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusAborted
		return nil, fmt.Errorf("failed to query matching jobs: %w", err)
	}

	var results []map[string]interface{}
	for _, doc := range docs {
		results = append(results, doc.Data())
	}
	span.SetData("matched_jobs_count", len(results))
	utils.Logger.Printf("Found %d matching jobs for industry: %s", len(results), recommendation.Industry)
	return results, nil
}

// FindMatchingJobsForSavedUser queries Firestore for jobs based on a saved user's industry preference.
func FindMatchingJobsForSavedUser(ctx context.Context, client *firestore.Client, userID string, industryPreference string) ([]map[string]interface{}, error) {
	span := sentry.StartSpan(ctx, "db.find_matching_jobs_for_saved_user")
	defer span.Finish()
	span.SetTag("user_id", userID)
	span.SetData("industry_preference", industryPreference)

	if client == nil {
		return nil, errors.New("firestore client not initialized")
	}
	query := client.CollectionGroup("listings").
		Where("industry", "==", industryPreference)

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		span.SetTag("error", "true")
		span.SetData("error_message", err.Error())
		span.Status = sentry.SpanStatusAborted
		return nil, fmt.Errorf("failed to query matching jobs for saved user (industry: %s): %w", industryPreference, err)
	}

	var results []map[string]interface{}
	for _, doc := range docs {
		results = append(results, doc.Data())
	}
	span.SetData("matched_jobs_count", len(results))
	utils.Logger.Printf("Found %d matching jobs for saved user %s (industry: %s)", len(results), userID, industryPreference)
	return results, nil
}
