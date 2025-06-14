import type { Step } from "./types"

export const INITIAL_STEPS: Step[] = [
  { key: "upload", label: "Uploading and validating file", status: "pending" },
  { key: "processing", label: "Extracting resume & job details", status: "pending" },
  { key: "analysis", label: "Tailoring documents with AI", status: "pending" },
  { key: "finalizing", label: "Finalizing and saving", status: "pending" },
]

export const MAX_RECONNECT_ATTEMPTS = 5
export const BASE_RECONNECT_DELAY = 1000
export const MAX_RECONNECT_DELAY = 30000