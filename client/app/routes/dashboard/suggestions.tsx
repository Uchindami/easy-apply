import React from 'react';

export default function Suggestions() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Suggestions</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Job Suggestions</h2>
            <p className="text-gray-600">Get personalized job recommendations based on your profile</p>
          </div>
          {/* Add suggestions content here */}
        </div>
      </div>
    </div>
  );
} 