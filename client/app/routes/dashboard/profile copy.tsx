import { useEffect, useState } from "react";
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
  Info,
  Lock,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useProfileStore } from "@/store/profile-store";
import { toast } from "sonner";
import SocialAccounts from "@/components/profile/social-accounts";

export default function ProfileManagement() {
  const {
    user,
    preferences,
    isLoading,
    error,
    setLoading,
    setError,
    updatePreferences,
  } = useProfileStore();

  const [localUsername, setLocalUsername] = useState(preferences.username);
  const [localWebPush, setLocalWebPush] = useState(preferences.webPushNotifications);
  const [localEmail, setLocalEmail] = useState(preferences.emailNotifications);

  useEffect(() => {
    setLocalUsername(preferences.username);
    setLocalWebPush(preferences.webPushNotifications);
    setLocalEmail(preferences.emailNotifications);
  }, [preferences]);

  // Helper function to check if a social account is connected
  const isSocialConnected = (platform: string): boolean => {
    const account = preferences.socialAccounts.find((acc) => acc.platform === platform);
    return account ? account.connected : false;
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updatePreferences({ username: localUsername });
      toast.success("Profile updated successfully");
    } catch (err) {
      setError("Failed to update profile");
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await updatePreferences({
        webPushNotifications: localWebPush,
        emailNotifications: localEmail,
      });
      toast.success("Notification preferences updated");
    } catch (err) {
      setError("Failed to update notification preferences");
      toast.error("Failed to update notification preferences");
    } finally {
      setLoading(false);
    }
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
                <Button onClick={handleSaveProfile} disabled={isLoading}>
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
            <SocialAccounts
              isSocialConnected={isSocialConnected}
              isLoading={isLoading}
            />
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
                    checked={localWebPush}
                    onCheckedChange={setLocalWebPush}
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
                    checked={localEmail}
                    onCheckedChange={setLocalEmail}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotifications} disabled={isLoading}>
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
