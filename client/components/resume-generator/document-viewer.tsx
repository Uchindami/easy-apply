import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Printer, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerProps {
  documentHTML: string;
  historyId: string;
  documentType: "resume" | "coverLetter";
}

export function DocumentViewer({
  documentHTML,
  historyId,
  documentType,
}: DocumentViewerProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    if (!documentHTML) return;

    // Create a temporary div to hold the HTML content
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = documentHTML;

    // Extract the text from the HTML
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    navigator.clipboard.writeText(textContent).then(() => {
      setIsCopied(true);

      toast({
        title: "Copied to clipboard",
        description: `Your ${
          documentType === "resume" ? "resume" : "cover letter"
        } has been copied to clipboard.`,
      });

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  };

  const handleDownload = () => {
    if (!documentHTML) return;

    // Create a temporary element
    const element = document.createElement("a");

    // Create a Blob from the HTML content
    const blob = new Blob([documentHTML], { type: "text/html" });
    element.href = URL.createObjectURL(blob);

    // Set the file name
    const fileName =
      documentType === "resume" ? "tailored-resume.html" : "cover-letter.html";
    element.download = fileName;

    // Trigger the download
    document.body.appendChild(element);
    element.click();

    // Clean up
    document.body.removeChild(element);

    toast({
      title: "Download started",
      description: `Your ${
        documentType === "resume" ? "resume" : "cover letter"
      } is being downloaded.`,
    });
  };

  const handlePrint = () => {
    if (!documentHTML) return;

    // Create a new window
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Write the HTML content to the new window
    printWindow.document.write(`
      <html>
        <head>
          <title>${
            documentType === "resume" ? "Tailored Resume" : "Cover Letter"
          }</title>
          <style>
            body { font-family: Arial, sans-serif; }
            @media print {
              @page { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          ${documentHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);

    // Close the document
    printWindow.document.close();
  };

  const handleShare = async () => {
    if (!documentHTML || !navigator.share) {
      toast({
        title: "Sharing not supported",
        description: "Your browser doesn't support the Web Share API.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a file to share
      const fileName =
        documentType === "resume"
          ? "tailored-resume.html"
          : "cover-letter.html";
      const file = new File([documentHTML], fileName, { type: "text/html" });

      await navigator.share({
        title:
          documentType === "resume" ? "My Tailored Resume" : "My Cover Letter",
        text: "Check out my document generated with the Resume Tailoring Tool!",
        files: [file],
      });

      toast({
        title: "Shared successfully",
        description: `Your ${
          documentType === "resume" ? "resume" : "cover letter"
        } has been shared.`,
      });
    } catch (error) {
      console.error("Error sharing:", error);

      toast({
        title: "Sharing failed",
        description: "There was a problem sharing your document.",
        variant: "destructive",
      });
    }
  };

  if (!documentHTML) {
    return (
      <Card className="border border-border">
        <CardContent className="p-6 flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">No document available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="flex gap-2 items-center"
          onClick={handleCopyToClipboard}
        >
          {isCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {isCopied ? "Copied" : "Copy"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex gap-2 items-center"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex gap-2 items-center"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>

        <Button
          variant="default"
          size="sm"
          className="flex gap-2 items-center"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      <Card className="border border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-white text-black rounded-md">
            <div
              className="p-6 max-h-[70vh] overflow-y-auto document-preview"
              dangerouslySetInnerHTML={{ __html: documentHTML }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <p className="text-muted-foreground">
          <strong>Note:</strong> This{" "}
          {documentType === "resume" ? "resume" : "cover letter"} has been
          tailored based on the job description. You may want to review and make
          any final adjustments before submitting your application.
        </p>
      </div>
    </motion.div>
  );
}
