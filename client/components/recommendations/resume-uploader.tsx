import React, { useState } from "react";
import { Upload, FileText, File } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "@/components/ui/motion";

interface ResumeUploadProps {
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function ResumeUpload({
  onUpload,
  isLoading,
  error,
}: ResumeUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (selectedFile) {
      await onUpload(selectedFile);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <div
              className={`p-6 rounded-lg transition-colors ${
                dragActive
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "bg-gray-50 dark:bg-gray-800/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                {selectedFile ? (
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {selectedFile ? "Resume Selected" : "Upload Your Resume"}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {selectedFile
                  ? selectedFile.name
                  : "Drag and drop your resume file, or click to select"}
              </p>

              <input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                className="sr-only"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center text-sm">
                    <File className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedFile.name} (
                      {(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      "Get Job Recommendations"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedFile(null)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="file-upload"
                  className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/40 cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Resume File
                </label>
              )}
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Supported formats: PDF, DOC, DOCX (Max 5MB)
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
