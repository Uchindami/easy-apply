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
import {
  Loader2,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateUrlWithBackend } from "@/utils/validate-url";

interface JobDetailsProps {
  jobUrl: string;
  onUrlChange: (url: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isDisabled: boolean;
}

interface LinkValidationResult {
  valid: boolean;
  status?: number;
  url?: string;
  reason?: string;
  error?: string;
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
  const [isValidating, setIsValidating] = useState(false);
  const [isUrlValid, setIsUrlValid] = useState(false);
  const [validationPerformed, setValidationPerformed] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUrlChange(value);
    setValidationPerformed(false);
    setIsUrlValid(false);
    if (hasError) {
      setHasError(false);
      setErrorMessage("");
    }
  };

  const validateUrlFormat = (url: string) => {
    if (!url.trim()) {
      setHasError(true);
      setErrorMessage("Please enter a job posting URL");
      return false;
    }
    try {
      const testUrl =
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : "https://" + url;
      new URL(testUrl);
      setHasError(false);
      setErrorMessage("");
      return true;
    } catch (e) {
      setHasError(true);
      setErrorMessage("Please enter a valid URL format");
      return false;
    }
  };

  const handleBlur = async () => {
    setIsFocused(false);
    if (jobUrl.trim() && validateUrlFormat(jobUrl)) {
      await performLinkValidation();
    }
  };

  const performLinkValidation = async () => {
    if (!jobUrl.trim()) return;
    setIsValidating(true);
    setValidationPerformed(false);
    try {
      const result: LinkValidationResult = await validateUrlWithBackend(jobUrl);
      if (result.valid) {
        setIsUrlValid(true);
        setHasError(false);
        setErrorMessage("");
      } else {
        setIsUrlValid(false);
        setHasError(true);
        setErrorMessage(
          result.reason ||
            result.error ||
            "Unable to access the job posting URL"
        );
      }
    } catch (error: any) {
      setIsUrlValid(false);
      setHasError(true);
      setErrorMessage(error?.message || "Unable to validate URL");
    } finally {
      setIsValidating(false);
      setValidationPerformed(true);
    }
  };

  const handleGenerateClick = async () => {
    if (!validateUrlFormat(jobUrl)) {
      return;
    }
    if (!validationPerformed) {
      await performLinkValidation();
      setTimeout(() => {
        if (isUrlValid) {
          onGenerate();
        }
      }, 100);
    } else if (isUrlValid) {
      onGenerate();
    }
  };

  const getInputClassName = () => {
    let className = "pr-10 ";
    if (hasError) {
      className += "border-destructive focus-visible:ring-destructive/30";
    } else if (isUrlValid && validationPerformed) {
      className += "border-green-500 focus-visible:ring-green-500/30";
    }
    return className;
  };

  const getIconColor = () => {
    if (isValidating) return "text-yellow-500";
    if (hasError) return "text-destructive";
    if (isUrlValid && validationPerformed) return "text-green-500";
    if (isFocused) return "text-primary";
    return "text-muted-foreground";
  };

  const getValidationIcon = () => {
    if (isValidating) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (isUrlValid && validationPerformed)
      return <CheckCircle className="h-4 w-4" />;
    return <LinkIcon className="h-4 w-4" />;
  };

  return (
    <Card className="w-full max-w-5xl mx-auto hover:shadow-lg">
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
          <label
            htmlFor="job-url"
            className="text-sm font-medium text-foreground"
          >
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
              disabled={isGenerating || isValidating}
              className={getInputClassName()}
            />
            <div
              className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none ${getIconColor()}`}
            >
              {getValidationIcon()}
            </div>
          </div>

          {hasError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Alert variant="destructive" className="py-2 mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {isUrlValid && validationPerformed && !hasError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Alert className="py-2 mt-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <AlertDescription className="text-green-800 dark:text-green-200">
                  URL verified and accessible
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <p className="text-xs text-muted-foreground mt-1">
            {isValidating
              ? "Checking if the URL is accessible..."
              : "This URL will be used to analyze job requirements and tailor your resume accordingly."}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3">
        <Button
          onClick={handleGenerateClick}
          disabled={
            isDisabled ||
            isGenerating ||
            isValidating ||
            (validationPerformed && !isUrlValid)
          }
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Job...
            </>
          ) : isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating URL...
            </>
          ) : (
            "Continue to Design"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Supported sites: LinkedIn, Indeed, Glassdoor, ZipRecruiter, and more
        </p>
      </CardFooter>
    </Card>
  );
}
