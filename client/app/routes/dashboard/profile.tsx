"use client";

import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Facebook, Info, Lock, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { useProfileStore } from "@/store/profile-store";
import { toast } from "sonner";
import type { SocialAccount } from "@/services/profile-services";
import FacebookIcon from "@/assets/FacebookIcon";
import GoogleIcon from "@/assets/GoogleIcon";

export default function ProfileManagement() {
  const {
    user,
    preferences,
    isLoading,
    error,
    updatePreferences,
    fetchProfile,
  } = useProfileStore();

  // Local state for form inputs
  const [localUsername, setLocalUsername] = useState("");
  const [localSocialAccounts, setLocalSocialAccounts] = useState<
    SocialAccount[]
  >([]);
  const [webPushNotifications, setWebPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize local state when preferences load
  useEffect(() => {
    if (preferences) {
      setLocalUsername(preferences.username);
      setLocalSocialAccounts(preferences.socialAccounts);
      setWebPushNotifications(preferences.webPushNotifications);
      setEmailNotifications(preferences.emailNotifications);
    }
  }, [preferences]);

  // Track unsaved changes
  useEffect(() => {
    if (!preferences) return;

    const hasChanges =
      localUsername !== preferences.username ||
      webPushNotifications !== preferences.webPushNotifications ||
      emailNotifications !== preferences.emailNotifications ||
      JSON.stringify(localSocialAccounts) !==
        JSON.stringify(preferences.socialAccounts);

    setHasUnsavedChanges(hasChanges);
  }, [
    localUsername,
    webPushNotifications,
    emailNotifications,
    localSocialAccounts,
    preferences,
  ]);

  // Load profile on component mount
  useEffect(() => {
    if (user && !preferences.username) {
      fetchProfile();
    }
  }, [user, preferences.username, fetchProfile]);

  const handleSave = async () => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      // Update Firebase Auth display name if username changed
      if (localUsername !== user.displayName) {
        await updateProfile(user, { displayName: localUsername });
      }

      // Update preferences in Firestore
      await updatePreferences({
        username: localUsername,
        socialAccounts: localSocialAccounts,
        webPushNotifications,
        emailNotifications,
      });

      toast.success("Profile updated successfully!");
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const isSocialConnected = (platform: string): boolean => {
    return localSocialAccounts.some(
      (account) => account.platform === platform && account.connected
    );
  };

  const toggleSocialConnection = (platform: string) => {
    setLocalSocialAccounts((prev) =>
      prev.map((account) =>
        account.platform === platform
          ? { ...account, connected: !account.connected }
          : account
      )
    );
  };

  const toggleWebPushNotifications = (checked: boolean) => {
    setWebPushNotifications(checked);
  };

  const toggleEmailNotifications = (checked: boolean) => {
    setEmailNotifications(checked);
  };

  if (!user) {
    return (
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Header title="Profile Management" />
        <div className="flex-1 flex items-center justify-center">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to access your profile settings.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full w-full overflow-hidden bg-background">
      <Header title="Profile Management" />
      <div className="flex-1 overflow-y-auto p-6 w-full max-w-[1200px] mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasUnsavedChanges && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Don't forget to save your updates.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="connections">Social Connections</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="pr-10"
                    />
                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your email address cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      value="••••••••"
                      disabled
                      className="pr-10"
                    />
                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Contact support to reset your password
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={localUsername}
                    onChange={(e) => setLocalUsername(e.target.value)}
                    placeholder="Enter your username"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="country">Country</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Our service is currently only available in Malawi
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="relative">
                    <Input
                      id="country"
                      value="Malawi"
                      disabled
                      className="pr-10"
                    />
                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !hasUnsavedChanges}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Social Connections</CardTitle>
                <CardDescription>
                  Connect your social media accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FacebookIcon
                        className={`h-10 w-10 ${
                          isSocialConnected("facebook")
                            ? "text-blue-600"
                            : "text-gray-300"
                        }`}
                      />
                      <div>
                        <p className="font-medium">Facebook</p>
                        <p className="text-sm text-muted-foreground">
                          {isSocialConnected("facebook")
                            ? "Connected"
                            : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={
                        isSocialConnected("facebook")
                          ? "destructive"
                          : "outline"
                      }
                      onClick={() => toggleSocialConnection("facebook")}
                      disabled={isLoading}
                    >
                      {isSocialConnected("facebook") ? "Disconnect" : "Connect"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <GoogleIcon
                        className={`h-10 w-10 ${
                          isSocialConnected("google")
                            ? "text-blue-600"
                            : "text-gray-300"
                        }`}
                      />
                      <div>
                        <p className="font-medium">Google</p>
                        <p className="text-sm text-muted-foreground">
                          {isSocialConnected("google")
                            ? "Connected"
                            : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={
                        isSocialConnected("google") ? "destructive" : "outline"
                      }
                      onClick={() => toggleSocialConnection("google")}
                      disabled={isLoading}
                    >
                      {isSocialConnected("google") ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !hasUnsavedChanges}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Web Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={webPushNotifications}
                    onCheckedChange={toggleWebPushNotifications}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={toggleEmailNotifications}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !hasUnsavedChanges}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
