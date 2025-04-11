import { create } from "zustand"
import { generateTailoredDocuments } from "@/services/resumeService"

interface ResumeState {
    // File states
    resumeFile: File | null
    originalResume: string

    // Job details
    jobUrl: string

    // UI states
    activeTab: "upload" | "preview"
    isGenerating: boolean
    isComplete: boolean
    showDiff: boolean

    // Generated content
    generatedResume: string
    generatedCoverLetter: string

    // Actions
    setResumeFile: (file: File | null) => void
    setJobUrl: (url: string) => void
    setActiveTab: (tab: "upload" | "preview") => void
    setShowDiff: (show: boolean) => void
    setGeneratedResume: (content: string) => void
    setGeneratedCoverLetter: (content: string) => void
    generateDocuments: () => Promise<void>
    resetForm: () => void
}

export const useResumeStore = create<ResumeState>((set, get) => ({
    // Initial states
    resumeFile: null,
    originalResume: "",
    jobUrl: "",
    activeTab: "upload",
    isGenerating: false,
    isComplete: false,
    showDiff: false,
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

    setShowDiff: (show) => set({ showDiff: show }),

    setGeneratedResume: (content) => set({ generatedResume: content }),

    setGeneratedCoverLetter: (content) => set({ generatedCoverLetter: content }),

    generateDocuments: async () => {
        const { resumeFile, jobUrl } = get()

        if (!resumeFile || !jobUrl) return

        set({ isGenerating: true, activeTab: "preview" })

        try {
            const { resume, coverLetter } = await generateTailoredDocuments(resumeFile, jobUrl)

            set({
                generatedResume: resume,
                generatedCoverLetter: coverLetter,
                isComplete: true,
            })
        } catch (error) {
            console.error("Error generating documents:", error)
            // You might want to set an error state here
        } finally {
            set({ isGenerating: false })
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
