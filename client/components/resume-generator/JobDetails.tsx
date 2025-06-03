import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Link as LinkIcon, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface JobDetailsProps {
  jobUrl: string;
  onUrlChange: (url: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isDisabled: boolean;
}

export function JobDetails({
  jobUrl,
  onUrlChange,
  onGenerate,
  isGenerating,
  isDisabled,
}: JobDetailsProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUrlChange(value);
    
    if (hasError) {
      validateUrl(value);
    }
  };

  const validateUrl = (url: string) => {
    if (!url) {
      setHasError(true);
      setErrorMessage("Please enter a job posting URL");
      return false;
    }
    
    try {
      new URL(url);
      setHasError(false);
      setErrorMessage("");
      return true;
    } catch (e) {
      setHasError(true);
      setErrorMessage("Please enter a valid URL");
      return false;
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (jobUrl) {
      validateUrl(jobUrl);
    }
  };

  const handleGenerateClick = () => {
    if (validateUrl(jobUrl)) {
      onGenerate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <LinkIcon className="h-5 w-5 mr-2 text-primary" />
          Job Details
        </CardTitle>
        <CardDescription>
          Enter the URL of the job posting you're applying for
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <label htmlFor="job-url" className="text-sm font-medium">
            Job Posting URL
          </label>
          <div className="relative">
            <Input
              id="job-url"
              placeholder="https://example.com/job-posting"
              value={jobUrl}
              onChange={handleUrlChange}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              disabled={isGenerating}
              className={`pr-10 ${hasError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
            />
            <div 
              className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none ${
                isFocused ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <LinkIcon className="h-4 w-4" />
            </div>
          </div>
          
          {hasError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Alert variant="destructive" className="py-2 mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          
          <p className="text-xs text-muted-foreground mt-1">
            This URL will be used to analyze job requirements and tailor your resume accordingly.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3">
        <Button
          onClick={handleGenerateClick}
          disabled={isDisabled || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Job...
            </>
          ) : (
            "Continue"
          )}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Supported sites: LinkedIn, Indeed, Glassdoor, ZipRecruiter, and more
        </p>
      </CardFooter>
    </Card>
  );
}