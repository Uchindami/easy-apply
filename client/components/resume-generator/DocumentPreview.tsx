"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Download, Edit, Eye, FileText, Mail } from "lucide-react"

interface DocumentPreviewProps {
  generatedResume: string
  generatedCoverLetter: string
  selectedTemplate: string
  accentColor: string
  onResumeChange: (content: string) => void
  onCoverLetterChange: (content: string) => void
  onDownload: (type: "resume" | "coverLetter") => void
}

export function DocumentPreview({
  generatedResume,
  generatedCoverLetter,
  selectedTemplate,
  accentColor,
  onResumeChange,
  onCoverLetterChange,
  onDownload,
}: DocumentPreviewProps) {
  const [activeDocTab, setActiveDocTab] = useState<string>("resume")
  const [editMode, setEditMode] = useState<boolean>(false)
  const resumeRef = useRef<HTMLDivElement>(null)
  const coverLetterRef = useRef<HTMLDivElement>(null)

  // Apply template styles to the HTML content
  const applyTemplate = (content: string, template: string, color: string) => {
    if (!content) return content

    // Extract the body content from the HTML
    const bodyMatch = content.match(/<body>([\s\S]*?)<\/body>/i)
    const bodyContent = bodyMatch ? bodyMatch[1] : content

    // Create template-specific styles
    let templateStyles = ""
    switch (template) {
      case "modern":
        templateStyles = `
          body {
            font-family: 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          h1, h2, h3 {
            color: ${color};
          }
          header {
            border-bottom: 2px solid ${color};
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          section {
            margin-bottom: 25px;
          }
          a {
            color: ${color};
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        `
        break
      case "classic":
        templateStyles = `
          body {
            font-family: Georgia, 'Times New Roman', serif;
            line-height: 1.5;
            color: #222;
            margin: 0;
            padding: 20px;
          }
          h1 {
            text-align: center;
            color: #000;
          }
          h2 {
            color: ${color};
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          header {
            text-align: center;
            margin-bottom: 30px;
          }
          section {
            margin-bottom: 25px;
          }
          a {
            color: ${color};
          }
        `
        break
      case "creative":
        templateStyles = `
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #fafafa;
          }
          h1, h2, h3 {
            color: ${color};
          }
          header {
            background-color: ${color};
            color: white;
            padding: 20px;
            margin: -20px -20px 20px -20px;
          }
          header h1 {
            color: white;
          }
          header a {
            color: white;
          }
          section {
            padding: 15px;
            margin-bottom: 20px;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          a {
            color: ${color};
            text-decoration: none;
          }
        `
        break
      case "minimal":
        templateStyles = `
          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.5;
            color: #333;
            margin: 0;
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1, h2, h3 {
            font-weight: 500;
          }
          h2 {
            color: ${color};
            margin-top: 25px;
          }
          header {
            margin-bottom: 30px;
          }
          section {
            margin-bottom: 20px;
          }
          a {
            color: ${color};
          }
        `
        break
      default:
        templateStyles = `
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          h1, h2 {
            color: ${color};
          }
          a {
            color: ${color};
          }
        `
    }

    // Create the full HTML document with the template styles
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume</title>
        <style>
          ${templateStyles}
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
      </html>
    `
  }

  // Apply template to the content when template or color changes
  useEffect(() => {
    if (!editMode) {
      const styledResume = applyTemplate(generatedResume, selectedTemplate, accentColor)
      if (resumeRef.current) {
        resumeRef.current.innerHTML = styledResume
      }

      const styledCoverLetter = applyTemplate(generatedCoverLetter, selectedTemplate, accentColor)
      if (coverLetterRef.current) {
        coverLetterRef.current.innerHTML = styledCoverLetter
      }
    }
  }, [generatedResume, generatedCoverLetter, selectedTemplate, accentColor, editMode])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Tailored Documents</CardTitle>
            <CardDescription>Review and edit your tailored resume and cover letter</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="edit-mode" checked={editMode} onCheckedChange={setEditMode} />
            <Label htmlFor="edit-mode" className="flex items-center">
              {editMode ? (
                <>
                  <Edit className="mr-1 h-4 w-4" /> Edit Mode
                </>
              ) : (
                <>
                  <Eye className="mr-1 h-4 w-4" /> Preview Mode
                </>
              )}
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeDocTab} onValueChange={setActiveDocTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="resume" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Resume
            </TabsTrigger>
            <TabsTrigger value="coverLetter" className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              Cover Letter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resume" className="space-y-4">
            {editMode ? (
              <Textarea
                value={generatedResume}
                onChange={(e) => onResumeChange(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
              />
            ) : (
              <div className="border rounded-md p-4 min-h-[500px] overflow-auto bg-white" ref={resumeRef} />
            )}
            <div className="flex justify-end">
              <Button onClick={() => onDownload("resume")} className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Download Resume as PDF
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="coverLetter" className="space-y-4">
            {editMode ? (
              <Textarea
                value={generatedCoverLetter}
                onChange={(e) => onCoverLetterChange(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
              />
            ) : (
              <div className="border rounded-md p-4 min-h-[500px] overflow-auto bg-white" ref={coverLetterRef} />
            )}
            <div className="flex justify-end">
              <Button onClick={() => onDownload("coverLetter")} className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Download Cover Letter as PDF
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
  