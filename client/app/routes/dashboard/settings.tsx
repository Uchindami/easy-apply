import { useState } from "react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button 
          className={`px-4 py-2 mr-2 ${activeTab === "profile" ? "border-b-2 border-blue-500 font-medium" : "text-gray-500"}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button 
          className={`px-4 py-2 mr-2 ${activeTab === "account" ? "border-b-2 border-blue-500 font-medium" : "text-gray-500"}`}
          onClick={() => setActiveTab("account")}
        >
          Account
        </button>
        <button 
          className={`px-4 py-2 mr-2 ${activeTab === "notifications" ? "border-b-2 border-blue-500 font-medium" : "text-gray-500"}`}
          onClick={() => setActiveTab("notifications")}
        >
          Notifications
        </button>
      </div>
      
      {/* Content based on active tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Profile Settings</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea className="w-full p-2 border rounded" rows={4}></textarea>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === "account" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Account Settings</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" className="w-full p-2 border rounded" />
            </div>
          </div>
        </div>
      )}
      
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Notification Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input type="checkbox" id="email-notifs" className="mr-2" />
              <label htmlFor="email-notifs">Email notifications</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="push-notifs" className="mr-2" />
              <label htmlFor="push-notifs">Push notifications</label>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Save Changes
        </button>
      </div>
    </div>
  );
}
