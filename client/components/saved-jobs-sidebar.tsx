"use client"

import React from "react"
import { Bookmark, Trash2, Clock, MapPin, Building, ExternalLink, X, RefreshCw, AlertTriangle } from "lucide-react"
import { formatRelativeTime } from "@/utils/date-utils"
import { useSavedJobsStore } from "@/store/saved-jobs-store"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function SavedJobsSidebar() {
  const { savedJobs, isLoading, error, fetchSavedJobs, unsaveJob, clearAllSavedJobs } = useSavedJobsStore()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const { toast } = useToast()

  // Handle job removal with error handling
  const handleUnsaveJob = async (jobId: string) => {
    try {
      await unsaveJob(jobId)
      toast({
        title: "Job removed",
        description: "The job has been removed from your saved jobs",
        variant: "success",
      })
    } catch (err) {
      toast({
        title: "Error removing job",
        description: err instanceof Error ? err.message : "Failed to remove job",
        variant: "destructive",
      })
    }
  }

  // Handle clearing all jobs with error handling
  const handleClearAllJobs = async () => {
    try {
      await clearAllSavedJobs()
      setIsConfirmDialogOpen(false)
      toast({
        title: "All jobs cleared",
        description: "All saved jobs have been removed",
        variant: "success",
      })
    } catch (err) {
      toast({
        title: "Error clearing jobs",
        description: err instanceof Error ? err.message : "Failed to clear saved jobs",
        variant: "destructive",
      })
    }
  }

  // Handle retry loading
  const handleRetryLoading = () => {
    fetchSavedJobs().catch((err) => {
      toast({
        title: "Error loading saved jobs",
        description: err instanceof Error ? err.message : "Failed to load saved jobs",
        variant: "destructive",
      })
    })
  }

  return (
    <>
      <Sidebar side="right" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="border-b">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              <h2 className="text-lg font-medium">Saved Jobs</h2>
            </div>
            <Badge variant="outline" className="ml-2">
              {isLoading ? "..." : savedJobs.length}
            </Badge>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-32 p-4">
              <RefreshCw className="h-8 w-8 mb-2 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Loading saved jobs...</p>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-48 p-4 text-center">
              <AlertTriangle className="h-10 w-10 mb-2 text-red-500" />
              <p className="text-sm font-medium text-red-500 mb-1">Failed to load saved jobs</p>
              <p className="text-xs text-gray-500 mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={handleRetryLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && savedJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-500">
              <Bookmark className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">No saved jobs yet</p>
              <p className="text-xs mt-1">Jobs you save will appear here</p>
            </div>
          )}

          {/* Jobs list */}
          {!isLoading && !error && savedJobs.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="flex justify-between items-center">
                <span>Saved Jobs</span>
                <SidebarGroupAction
                  onClick={() => setIsConfirmDialogOpen(true)}
                  className="hover:text-red-500"
                  title="Clear all saved jobs"
                >
                  <Trash2 className="h-4 w-4" />
                </SidebarGroupAction>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {savedJobs.map((job) => (
                    <SidebarMenuItem key={job.id}>
                      <Card className="w-full p-3 mb-2 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 min-w-[40px] rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                            <img
                              src={job.companyLogo || "/placeholder.svg?height=40&width=40"}
                              alt={`${job.companyName} logo`}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=40&width=40"
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate" title={job.position}>
                              {job.position}
                            </h3>
                            <p className="text-xs text-gray-600 flex items-center">
                              <Building className="h-3 w-3 min-w-[12px] mr-1" />
                              <span className="truncate" title={job.companyName}>
                                {job.companyName}
                              </span>
                            </p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 min-w-[12px] mr-1" />
                              <span className="truncate" title={job.location}>
                                {job.location}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3 min-w-[12px] mr-1" />
                              <span className="truncate" title={job.datePosted}>
                                {formatRelativeTime(job.datePosted)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => window.open(job.link, "_blank")}
                              >
                                View <ExternalLink className="ml-1 h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleUnsaveJob(job.id || "")}
                              >
                                <X className="h-3 w-3 mr-1" /> Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t p-2">
          <p className="text-xs text-center text-gray-500">
            {isLoading
              ? "Loading saved jobs..."
              : savedJobs.length > 0
                ? `You have ${savedJobs.length} saved job${savedJobs.length !== 1 ? "s" : ""}`
                : "Save jobs to view them later"}
          </p>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all saved jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove all your saved jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllJobs} className="bg-red-500 hover:bg-red-600">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
