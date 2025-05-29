"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, Calendar } from "lucide-react"

interface CurrentDocumentCardProps {
  currentDocument: string | null
  recommendation: { industry: string } | null
  onChangeDocument: () => void
}

export function CurrentDocumentCard({ currentDocument, recommendation, onChangeDocument }: CurrentDocumentCardProps) {
  if (!currentDocument && !recommendation?.industry) {
    return null
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Current Document</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onChangeDocument}>
            <Upload className="h-4 w-4 mr-2" />
            Change Document
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentDocument && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Document: {currentDocument}</span>
          </div>
        )}

        {recommendation?.industry && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Industry: {recommendation.industry}
            </Badge>
          </div>
        )}

        <CardDescription className="text-xs">
          Upload a new resume or document to get updated job recommendations based on your latest profile.
        </CardDescription>
      </CardContent>
    </Card>
  )
}
