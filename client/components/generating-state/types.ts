export type StepStatus = "pending" | "active" | "complete" | "failed"

export type Step = {
  key: string
  label: string
  status: StepStatus
}

export type ProgressUpdate = {
  step: string
  status: StepStatus
  message?: string
}

export type ConnectionStatus = "connecting" | "connected" | "error"
