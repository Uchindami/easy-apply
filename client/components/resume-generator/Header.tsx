"use client"

import { Button } from "@/components/ui/button"

interface HeaderProps {
  onReset: () => void
  isResetDisabled: boolean
}

export function Header({ onReset, isResetDisabled }: HeaderProps) {
  return (
    <header className="border-b bg-background p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-[1200px] mx-auto">
        <h1 className="text-xl font-bold flex items-center gap-4">
          Resume Tailoring Tool
        </h1>
        <Button onClick={onReset} variant="ghost" disabled={isResetDisabled}>
          Reset
        </Button>
      </div>
    </header>
  )
}
