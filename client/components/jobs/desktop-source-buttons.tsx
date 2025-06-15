"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SourceBucket } from "@/types/job"

interface DesktopSourceButtonsProps {
  sourceBuckets: SourceBucket[]
  activeSources: number[]
  onToggleSource: (index: number) => void
}

export function DesktopSourceButtons({ sourceBuckets, activeSources, onToggleSource }: DesktopSourceButtonsProps) {
  return (
    <div className="flex justify-center space-x-4">
      {sourceBuckets.map((category, index) => (
        <Button
          key={category.id}
          variant={activeSources.includes(index) ? "default" : "outline"}
          className={cn(
            "px-6 py-2 font-medium transition-all",
            activeSources.includes(index) ? "bg-foreground text-white" : "text-primary",
          )}
          onClick={() => onToggleSource(index)}
          aria-pressed={activeSources.includes(index)}
        >
          {category.title}
        </Button>
      ))}
    </div>
  )
}
