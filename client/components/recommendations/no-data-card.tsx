import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface NoDataCardProps {
  onGetRecommendations: () => void;
}

export function NoDataCard({ onGetRecommendations }: NoDataCardProps) {
  return (
    <Card className="overflow-hidden border-blue-100 dark:border-blue-900">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-600 dark:text-blue-400"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
          Ready to Find Your Perfect Match
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          Your profile is ready! Click below to find job recommendations that match your skills and experience.
        </p>
        <Button 
          onClick={onGetRecommendations}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Get Job Recommendations
        </Button>
      </CardContent>
    </Card>
  );
}