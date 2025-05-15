
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Info,
  Lock,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useProfileStore } from "@/store/profile-store";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export default function ProfileManagement() {
  // Get values and actions from the profile store
  const {
    user,
    username,
    socialAccounts,
    webPushNotifications,
    emailNotifications,
    isLoading,
    error,
    setUsername,
    toggleSocialConnection,
    toggleWebPushNotifications,
    toggleEmailNotifications,
    setLoading,
    setError,
  } = useProfileStore();

  // Local state for form management
  const [localUsername, setLocalUsername] = useState(username);

  // Initialize local state when store values change
  useEffect(() => {
    if (user) {
      // If user has a displayName, use it, otherwise use store username
      setLocalUsername(user.displayName || username);

      // Fetch additional user data from Firestore
      fetchUserProfile();
    }
  }, [user]);

  // Function to fetch user profile from Firestore
  const fetchUserProfile = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const userDocRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Update store with user data from Firestore
        setUsername(userData.username || user.displayName || "");

        // Update local username state
        setLocalUsername(userData.username || user.displayName || "");

        // Sync social accounts if they exist in the document
        if (userData.socialAccounts) {
          userData.socialAccounts.forEach((account: any) => {
            if (
              account.connected !==
              socialAccounts.find((a) => a.platform === account.platform)
                ?.connected
            ) {
              toggleSocialConnection(account.platform);
            }
          });
        }

        // Sync notification preferences
        if (
          userData.webPushNotifications !== undefined &&
          userData.webPushNotifications !== webPushNotifications
        ) {
          toggleWebPushNotifications();
        }

        if (
          userData.emailNotifications !== undefined &&
          userData.emailNotifications !== emailNotifications
        ) {
          toggleEmailNotifications();
        }
      } else {
        // If user doc doesn't exist, create one with default values
        await setDoc(userDocRef, {
          username: user.displayName || "",
          socialAccounts,
          webPushNotifications,
          emailNotifications,
          country: "Malawi",
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch profile data"
      );
      toast("Error", {
        description: "Failed to load profile data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast("Error", {
        description: "You must be logged in to update your profile",
      });
      return;
    }

    setLoading(true);

    try {
      // Update Firebase Auth displayName
      await updateProfile(user, {
        displayName: localUsername,
      });

      // Update username in store
      setUsername(localUsername);

      // Update Firestore document
      const userDocRef = doc(db, "Users", user.uid);
      await setDoc(
        userDocRef,
        {
          username: localUsername,
          socialAccounts,
          webPushNotifications,
          emailNotifications,
          country: "Malawi",
        },
        { merge: true }
      );

      toast("Success", {
        description: "Profile updated successfully",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      toast("Error", {
        description: "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };
  // Helper function to check if a social account is connected
  const isSocialConnected = (platform: string): boolean => {
    const account = socialAccounts.find((acc) => acc.platform === platform);
    return account ? account.connected : false;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Header title="Profile Management" />
      <div className="flex-1 overflow-y-auto p-6 w-full max-w-[1200px] mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
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
                <Button onClick={handleSave} disabled={isLoading}>
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
                      <Facebook
                        className={`h-6 w-6 ${
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
                      <Twitter
                        className={`h-6 w-6 ${
                          isSocialConnected("twitter")
                            ? "text-blue-400"
                            : "text-gray-300"
                        }`}
                      />
                      <div>
                        <p className="font-medium">Twitter</p>
                        <p className="text-sm text-muted-foreground">
                          {isSocialConnected("twitter")
                            ? "Connected"
                            : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={
                        isSocialConnected("twitter") ? "destructive" : "outline"
                      }
                      onClick={() => toggleSocialConnection("twitter")}
                      disabled={isLoading}
                    >
                      {isSocialConnected("twitter") ? "Disconnect" : "Connect"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Instagram
                        className={`h-6 w-6 ${
                          isSocialConnected("instagram")
                            ? "text-pink-500"
                            : "text-gray-300"
                        }`}
                      />
                      <div>
                        <p className="font-medium">Instagram</p>
                        <p className="text-sm text-muted-foreground">
                          {isSocialConnected("instagram")
                            ? "Connected"
                            : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={
                        isSocialConnected("instagram")
                          ? "destructive"
                          : "outline"
                      }
                      onClick={() => toggleSocialConnection("instagram")}
                      disabled={isLoading}
                    >
                      {isSocialConnected("instagram")
                        ? "Disconnect"
                        : "Connect"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Linkedin
                        className={`h-6 w-6 ${
                          isSocialConnected("linkedin")
                            ? "text-blue-700"
                            : "text-gray-300"
                        }`}
                      />
                      <div>
                        <p className="font-medium">LinkedIn</p>
                        <p className="text-sm text-muted-foreground">
                          {isSocialConnected("linkedin")
                            ? "Connected"
                            : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={
                        isSocialConnected("linkedin")
                          ? "destructive"
                          : "outline"
                      }
                      onClick={() => toggleSocialConnection("linkedin")}
                      disabled={isLoading}
                    >
                      {isSocialConnected("linkedin") ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} disabled={isLoading}>
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
                <Button onClick={handleSave} disabled={isLoading}>
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
