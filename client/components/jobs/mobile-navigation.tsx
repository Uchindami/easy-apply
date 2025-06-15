"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SourceBucket } from "@/types/job"

interface MobileNavigationProps {
  sourceBuckets: SourceBucket[]
  activeTab: number
  onPrevTab: () => void
  onNextTab: () => void
}

export function MobileNavigation({ sourceBuckets, activeTab, onPrevTab, onNextTab }: MobileNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevTab}
        className="text-gray-600 hover:text-gray-900"
        aria-label="Previous tab"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex space-x-1" role="tablist" aria-label="Job sources">
        {sourceBuckets.map((bucket, index) => (
          <div
            key={bucket.id}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`tab-panel-${bucket.id}`}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              activeTab === index ? "bg-foreground" : "bg-gray-300",
            )}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNextTab}
        className="text-gray-600 hover:text-gray-900"
        aria-label="Next tab"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
