"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, RefreshCw, Sparkles, Users, FileText, Building } from "lucide-react"
import { JobCard } from "@/components/job-card"
import type { RecommendationResponse } from "@/types/job"

interface JobsSectionProps {
  data: RecommendationResponse
  hasInitialized: boolean
  onRefresh: () => void
  isLoading?: boolean
}

export function JobsSection({ data, hasInitialized, onRefresh, isLoading = false }: JobsSectionProps) {
  const allJobs = data.matchedJobs || []
  
  // Group jobs by type
  const jobs = allJobs.filter(job => 
    job.jobType?.includes("Job Vacancy in Malawi") || 
    job.jobType === "Full Time" || 
    job.jobType === "Temporary"
  )
  
  const opportunities = allJobs.filter(job => 
    job.jobType?.includes("Opportunity")
  )
  
  const consultancy = allJobs.filter(job => 
    job.jobType?.includes("Consultant")
  )
  
  const others = allJobs.filter(job => 
    !job.jobType?.includes("Job Vacancy in Malawi") &&
    job.jobType !== "Full Time" &&
    job.jobType !== "Temporary" &&
    !job.jobType?.includes("Opportunity") &&
    !job.jobType?.includes("Consultant")
  )

  const totalCount = allJobs.length

  const JobSection = ({ title, jobs, icon: Icon, count }: { 
    title: string, 
    jobs: any[], 
    icon: any, 
    count: number 
  }) => {
    if (count === 0) return null
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">{title}</h3>
          <span className="text-sm text-muted-foreground">({count})</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job, index) => (
            <div
              key={job.id || index}
              className="animate-in fade-in duration-300"
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "forwards",
              }}
            >
              <JobCard job={job} savedJobsInitialized={hasInitialized} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold">Matched Positions</h2>
            <p className="text-sm text-muted-foreground">{totalCount} total matches</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Job Sections */}
      {totalCount > 0 ? (
        <div className="space-y-8">
          <JobSection 
            title="Jobs" 
            jobs={jobs} 
            icon={Briefcase} 
            count={jobs.length} 
          />
          
          <JobSection 
            title="Opportunities" 
            jobs={opportunities} 
            icon={Sparkles} 
            count={opportunities.length} 
          />
          
          <JobSection 
            title="Consultancy" 
            jobs={consultancy} 
            icon={Users} 
            count={consultancy.length} 
          />
          
          <JobSection 
            title="Others" 
            jobs={others} 
            icon={FileText} 
            count={others.length} 
          />
        </div>
      ) : (
        /* Simple Empty State */
        <Card>
          <CardHeader className="text-center py-12">
            <div className="mx-auto h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No Matches Found</CardTitle>
            <CardDescription>
              No jobs matching your profile at the moment. Try refreshing or check back later.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-12">
            <Button onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Searching...' : 'Search Again'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}