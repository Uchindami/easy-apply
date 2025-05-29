"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorAlertProps {
  error: string
  onRetry: () => void
}

export function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  return (
    <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="dark:text-red-300">{error}</span>
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}
