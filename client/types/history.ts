export interface HistoryData {
    timestamp: Date
    status: "processing" | "completed" | "failed"
    original: {
      resumePath: string
      jobLink: string
    }
    generated: {
      resumePath: string
      coverLetterPath: string
    }
    jobDetails: {
      title: string
      company: string
      source: string
    }
  }
  