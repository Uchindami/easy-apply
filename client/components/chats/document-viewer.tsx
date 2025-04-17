import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, FileText } from "lucide-react"

interface DocumentViewerProps {
  document: string
  documentType: "resume" | "coverLetter"
}

export default function DocumentViewer({ document , documentType}: DocumentViewerProps) {

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <FileText className="h-12 w-12 text-gray-400" />
        <p className="text-gray-500">{"Document not available"}</p>
      </div>
    )
  }

  // For HTML content, we'll render it in an iframe
  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" asChild>
          <a href={"/"} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Create a download link for the HTML content
            // const blob = new Blob([documentContent || ""], { type: "text/html" })
            // const url = URL.createObjectURL(blob)
            // const a = document.createElement("a")
            // a.href = url
            // a.download = `${documentType === "resume" ? "Resume" : "Cover Letter"}.html`
            // document.body.appendChild(a)
            // a.click()
            // document.body.removeChild(a)
            // URL.revokeObjectURL(url)
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      <Card className="overflow-hidden border rounded-lg">
        <iframe
          srcDoc={document || undefined}
          src={!document ? document: undefined}
          className="w-full h-[500px] border-0"
          title={documentType === "resume" ? "Resume" : "Cover Letter"}
        />
      </Card>
    </div>
  )
}
