"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface JobDetailsProps {
  jobUrl: string
  onUrlChange: (url: string) => void
  onGenerate: () => void
  isGenerating: boolean
  isDisabled: boolean
}

export function JobDetails({ jobUrl, onUrlChange, onGenerate, isGenerating, isDisabled }: JobDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Details</CardTitle>
        <CardDescription>Enter the URL of the job posting you're applying for</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <label htmlFor="job-url" className="text-sm font-medium">
            Job Posting URL
          </label>
          <Input
            id="job-url"
            placeholder="https://example.com/job-posting"
            value={jobUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            disabled={isGenerating}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onGenerate} disabled={isDisabled || isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Tailored Resume & Cover Letter"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
