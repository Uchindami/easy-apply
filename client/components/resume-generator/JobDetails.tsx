import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Link, Loader2 } from "lucide-react"

interface JobDetailsProps {
  jobUrl: string
  onUrlChange: (url: string) => void
  onGenerate: () => void
  isGenerating: boolean
  isDisabled: boolean
}

export function JobDetails({ jobUrl, onUrlChange, onGenerate, isGenerating, isDisabled }: JobDetailsProps) {
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUrlChange(e.target.value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Details</CardTitle>
        <CardDescription>
          Provide the job posting URL to tailor your resume and generate a cover letter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="job-url" className="text-sm font-medium">
              Job Posting URL
            </label>
            <div className="flex">
              <div className="relative flex-grow">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="job-url"
                  placeholder="https://example.com/job-posting"
                  className="pl-10"
                  value={jobUrl}
                  onChange={handleUrlChange}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onGenerate} disabled={isDisabled || isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>Generate Resume & Cover Letter</>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 