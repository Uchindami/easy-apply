"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "./ui/sidebar"
import { useRef } from "react"
import { Bookmark } from "lucide-react"
import { useProfileStore } from "@/store/profile-store"

// Types
interface HeaderProps {
  title: string
  onReset?: () => void
  isResetDisabled?: boolean
  savedJobsButtonProps?: {
    onClick: () => void
    isLoadingSavedJobs: boolean
    savedJobsCount: number
  }
}

const CURRENT_USER = useProfileStore.getState().user?.displayName || "Anonymous"

const useRenderCount = () => {
  const renderCount = useRef(0)
  renderCount.current += 1
  return renderCount.current
}

const SavedJobsButton: React.FC<{
  onClick: () => void
  isLoadingSavedJobs: boolean
  savedJobsCount: number
}> = ({ onClick, isLoadingSavedJobs, savedJobsCount }) => (
  <Button
    variant="outline"
    size="sm"
    className="flex items-center gap-1"
    onClick={onClick}
  >
    <Bookmark className="h-4 w-4 text-primary" />
    <span className="text-primary">Saved Jobs</span>
    {!isLoadingSavedJobs && savedJobsCount > 0 && (
      <span className="ml-1 bg-foreground/50 text-white rounded-full text-xs px-1.5 py-0.5 min-w-5 text-center">
        {savedJobsCount}
      </span>
    )}
  </Button>
)

export function Header({ title, onReset, isResetDisabled, savedJobsButtonProps }: HeaderProps) {
  const renderCount = useRenderCount()

  return (
    <header className="border-b bg-background p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-[1200px] mx-auto">
        <div className="flex items-center space-x-2">
          <SidebarTrigger className="mr-4" />
          <h1 className="md:text-xl font-bold">{title}</h1>
          <span className="text-xs text-muted-foreground">
            Renders: {renderCount}
            <span className="text-xs text-muted-foreground ml-2">
              <span className="hidden md:inline">development mode</span>
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onReset && (
            <Button onClick={onReset} variant="ghost" disabled={isResetDisabled}>
              Reset
            </Button>
          )}

          {savedJobsButtonProps && (
            <SavedJobsButton {...savedJobsButtonProps} />
          )}
        </div>
      </div>
    </header>
  )
}