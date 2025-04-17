import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, Edit, Save } from "lucide-react";
import RichTextEditor from "@/components/chats/rich-text-editor";

// Convert plain text to HTML for the rich text editor
function convertToHtml(plainText: string): string {
  // Split by double newlines to identify paragraphs
  const paragraphs = plainText.split("\n\n");

  // Convert each paragraph to HTML
  return paragraphs
    .map((para) => {
      if (!para.trim()) return "";
      // Handle italics
      para = para.replace(/\*(.*?)\*/g, "<em>$1</em>");
      return `<p>${para}</p>`;
    })
    .join("");
}

// This is a placeholder for your actual cover letter content
const initialCoverLetterContent = `
John Doe
123 Main Street
Anytown, USA 12345
john.doe@example.com
(123) 456-7890

April 16, 2025

Hiring Manager
Tech Company Inc.
456 Business Avenue
Tech City, USA 67890

Dear Hiring Manager,

I am writing to express my interest in the Software Engineer position at Tech Company Inc. as advertised on your company website. With over five years of experience in web development and a strong background in React, Next.js, and Node.js, I am confident that my skills and experience make me an ideal candidate for this role.

In my current position as a Senior Software Engineer at Digital Solutions LLC, I have successfully led the development of multiple web applications that have improved user engagement by 35%. I have consistently delivered projects on time and within budget, while maintaining high code quality standards through comprehensive testing and code reviews.

I am particularly drawn to Tech Company Inc. because of your commitment to innovation and your focus on creating user-friendly applications that solve real-world problems. I am excited about the possibility of bringing my technical expertise and creative problem-solving skills to your team.

Thank you for considering my application. I look forward to the opportunity to discuss how my experience and skills can contribute to the continued success of Tech Company Inc.

Sincerely,

John Doe
`;

export default function CoverLetterViewer() {
  const [loading, setLoading] = useState(true);
  const [coverLetterContent, setCoverLetterContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Simulate loading the cover letter content
    const timer = setTimeout(() => {
      const html = convertToHtml(initialCoverLetterContent);
      setHtmlContent(html);
      setCoverLetterContent(initialCoverLetterContent);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleEditorChange = (newContent: string) => {
    setHtmlContent(newContent);
  };

  const handleSave = () => {
    // In a real app, you would convert HTML back to plain text or store as HTML
    setIsEditing(false);
  };

  const handleDownload = () => {
    // For simplicity, we'll download the original plain text content
    // In a real app, you might want to convert the HTML back to plain text
    const blob = new Blob([coverLetterContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    // In a real application, you would use a library like jsPDF or
    // a server-side solution to generate a PDF
    alert(
      "In a production app, this would generate a PDF using a library like jsPDF or a server-side solution."
    );

    // For demonstration purposes, we'll just download as text
    handleDownload();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-6 w-1/4" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="edit-mode-cover"
            checked={isEditing}
            onCheckedChange={setIsEditing}
          />
          <Label htmlFor="edit-mode-cover" className="flex items-center">
            <Edit className="h-4 w-4 mr-1" />
            <span>Edit Mode</span>
          </Label>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            <span>Download .txt</span>
          </Button>
          <Button variant="default" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <RichTextEditor content={htmlContent} onChange={handleEditorChange} />
          <div className="flex justify-end">
            <Button onClick={handleSave} className="mt-2">
              <Save className="h-4 w-4 mr-1" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="font-serif leading-relaxed prose max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </div>
  );
}
