import { create } from "zustand"
import { generateTailoredDocuments } from "@/services/resumeService"
import { useProfileStore } from "./profile-store"
import { useChatStore } from "./chat-store"

interface ResumeState {
  // File states
  chatId: string | null
  resumeFile: File | null
  originalResume: string

  // Job details
  jobUrl: string

  // UI states
  activeTab: "upload" | "preview"
  isGenerating: boolean
  isComplete: boolean

  // Generated content
  generatedResume: string
  generatedCoverLetter: string

  // Actions
  setResumeFile: (file: File | null) => void
  setJobUrl: (url: string) => void
  setActiveTab: (tab: "upload" | "preview") => void
  setGeneratedResume: (content: string) => void
  setGeneratedCoverLetter: (content: string) => void
  generateDocuments: () => Promise<void>
  resetForm: () => void
}

export const useDocumentStore = create<ResumeState>((set, get) => ({
  // Initial states
  chatId: null,
  resumeFile: null,
  originalResume: "",
  jobUrl: "",
  activeTab: "upload",
  isGenerating: false,
  isComplete: false,
  generatedResume: "",
  generatedCoverLetter: "",

  // Actions
  setResumeFile: (file) => {
    set({ resumeFile: file })

    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          set({ originalResume: event.target.result as string })
        }
      }
      reader.readAsText(file)
    } else {
      set({ originalResume: "" })
    }
  },

  setJobUrl: (url) => set({ jobUrl: url }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setGeneratedResume: (content) => set({ generatedResume: content }),

  setGeneratedCoverLetter: (content) => set({ generatedCoverLetter: content }),

  generateDocuments: async () => {
    const { resumeFile, jobUrl } = get()

    if (!resumeFile || !jobUrl) return

    const userId = useProfileStore.getState().user?.uid
    if (!userId) {
      console.error("User ID is not available. Please ensure the user is authenticated.")
      return
    }

    set({ isGenerating: true, activeTab: "preview" })

    try {
      const {historyId, resume, coverLetter } = await generateTailoredDocuments(resumeFile, jobUrl, userId)

      set({
        generatedResume: resume,
        generatedCoverLetter: coverLetter,
        chatId: historyId,
        isComplete: true,
      })
    } catch (error) {
      console.error("Error generating documents:", error)
      // You might want to set an error state here
    } finally {
      set({ isGenerating: false })
      if (userId) {
        await useChatStore.getState().fetchChats(userId)
      }
    }
  },

  resetForm: () =>
    set({
      resumeFile: null,
      originalResume: "",
      jobUrl: "",
      isComplete: false,
      generatedResume: "",
      generatedCoverLetter: "",
      activeTab: "upload",
    }),
}))
