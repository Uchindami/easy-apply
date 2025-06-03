import { useState } from "react";
import { UploadCloud, File, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ResumeUploaderProps {
  resumeFile: File | null;
  onFileChange: (file: File | null) => void;
  isGenerating?: boolean;
}

export function ResumeUploader({
  resumeFile,
  onFileChange,
  isGenerating = false,
}: ResumeUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0] || null;
    if (file && isValidFileType(file)) {
      onFileChange(file);
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    return validTypes.includes(file.type);
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return { color: "text-red-500", bg: "bg-red-100" };
      case "doc":
      case "docx":
        return { color: "text-blue-500", bg: "bg-blue-100" };
      case "txt":
        return { color: "text-gray-500", bg: "bg-gray-100" };
      default:
        return { color: "text-primary", bg: "bg-primary/10" };
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UploadCloud className="h-5 w-5 mr-2 text-primary" />
          Upload Your Resume
        </CardTitle>
        <CardDescription>
          Upload your current resume in PDF, DOCX, or TXT format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20",
            isGenerating
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:bg-muted/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="resume-upload"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileChange}
            disabled={isGenerating}
          />

          {resumeFile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center w-full"
            >
              <div
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center mb-3",
                  getFileIcon(resumeFile).bg
                )}
              >
                <File
                  className={cn("h-6 w-6", getFileIcon(resumeFile).color)}
                />
              </div>

              <div className="text-center space-y-1">
                <p className="font-medium text-foreground break-all max-w-full">
                  {resumeFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(resumeFile.size / 1024).toFixed(1)} KB
                </p>
              </div>

              {!isGenerating && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="mt-4 flex items-center text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove file
                </button>
              )}
            </motion.div>
          ) : (
            <label
              htmlFor="resume-upload"
              className={cn(
                "cursor-pointer flex flex-col items-center text-center",
                isGenerating && "pointer-events-none"
              )}
            >
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -5, 0] }}
                transition={{
                  repeat: Infinity,
                  repeatType: "mirror",
                  duration: 2,
                  repeatDelay: 1,
                }}
              >
                <UploadCloud className="h-12 w-12 text-muted-foreground mb-3" />
              </motion.div>

              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, DOCX, or TXT (max 5MB)
                </p>
              </div>
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
