import { Facebook, Twitter, Instagram, Linkedin, Loader2 } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import GoogleIcon from "@/assets/GoogleIcon";
import FacebookIcon from "@/assets/FacebookIcon";

interface SocialAccountsProps {
  isSocialConnected: (provider: string) => boolean;
  // toggleSocialConnection?: (provider: string) => void;
  isLoading?: boolean;
}

const SocialAccounts: React.FC<SocialAccountsProps> = ({
  isSocialConnected,
  isLoading = false,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Connections</CardTitle>
        <CardDescription>Connect your social media accounts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <GoogleIcon
                className={`h-6 w-6 ${
                  isSocialConnected("google")
                    ? "text-blue-600"
                    : "text-gray-300"
                }`}
              />
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-muted-foreground">
                  {isSocialConnected("google") ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
            <Button
              variant={isSocialConnected("google") ? "destructive" : "outline"}
              // onClick={() => toggleSocialConnection("google")}
              disabled={true}
            >
              {isSocialConnected("google") ? "Disconnect" : "Connect"}
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <FacebookIcon
                className={`h-6 w-6 ${
                  isSocialConnected("google")
                    ? "text-blue-600"
                    : "text-gray-300"
                }`}
              />
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-muted-foreground">
                  {isSocialConnected("google") ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
            <Button
              variant={isSocialConnected("google") ? "destructive" : "outline"}
              // onClick={() => toggleSocialConnection("google")}
              disabled={true}
            >
              {isSocialConnected("google") ? "Disconnect" : "Connect"}
            </Button>
          </div>

        </div>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

export default SocialAccounts;
