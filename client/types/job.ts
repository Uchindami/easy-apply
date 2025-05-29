export interface Job {
  position: string
  companyName: string
  companyLogo?: string
  jobType: string
  location: string
  datePosted: string
  link: string
  applicationDeadline?: string
  description?: string
  source?: string
    id?: string // Adding an id field for easier reference
}

export interface SourceBucket {
  id: string
  title: string
  jobs: Job[]
}

export interface SavedJob extends Job {
  savedAt: string
}

export interface JobRecommendation {
  industry: string
  domain: string
  confidence: string
  reasoning: string
}

export interface RecommendationResponse {
  success: boolean
  recommendation: JobRecommendation
  matchedJobs: Job[]
}

