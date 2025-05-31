export interface HistoryData {
    timestamp: Date
    status: "processing" | "completed" | "failed"
    original: {
      resumeText: string
      jobLink: string
    }
    generated: {
      resumeText: string
      coverLetterText: string
    }
    jobDetails: {
      title: string
      company: string
      source: string
    }
  }
  
  export interface UpdateResume {
    generated: {
      resumePath: string
    }
  }
  