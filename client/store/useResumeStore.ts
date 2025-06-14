import { generateTailoredDocuments } from "@/services/resumeService";
import { create } from "zustand";
import { useChatStore } from "./chat-store";
import { useProfileStore } from "./profile-store";

interface ResumeState {
  // File states
  chatId: string | null;
  resumeFile: File | null;
  originalResume: string;

  // Job details
  jobUrl: string;

  // Template and design
  selectedTemplate: any | null;
  selectedColors: any | null;

  // UI states
  activeTab: "upload" | "design" | "preview";
  isGenerating: boolean;
  isComplete: boolean;

  // Generated content
  generatedResume: string;
  generatedCoverLetter: string;

  // SSE channel ID for real-time progress updates
  sseChannelId: string | null;

  // Actions
  setResumeFile: (file: File | null) => void;
  setJobUrl: (url: string) => void;
  setActiveTab: (tab: "upload" | "design" | "preview") => void;
  setSelectedTemplate: (template: any) => void;
  setSelectedColors: (colors: any) => void;
  setGeneratedResume: (content: string) => void;
  setGeneratedCoverLetter: (content: string) => void;
  generateDocuments: () => Promise<void>;
  resetForm: () => void;
}

export const useDocumentStore = create<ResumeState>((set, get) => ({
  // Initial states
  chatId: null,
  resumeFile: null,
  originalResume: "",
  jobUrl: "",
  selectedTemplate: null,
  selectedColors: null,
  activeTab: "upload",
  isGenerating: false,
  isComplete: false,
  generatedResume: "",
  generatedCoverLetter: "",
  sseChannelId: null,

  // Actions
  setResumeFile: (file) => {
    set({ resumeFile: file });
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          set({ originalResume: event.target.result as string });
        }
      };
      reader.readAsText(file);
    } else {
      set({ originalResume: "" });
    }
  },

  setJobUrl: (url) => set({ jobUrl: url }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setSelectedColors: (colors) => set({ selectedColors: colors }),
  setGeneratedResume: (content) => set({ generatedResume: content }),
  setGeneratedCoverLetter: (content) => set({ generatedCoverLetter: content }),

  generateDocuments: async () => {
    const { resumeFile, jobUrl, selectedTemplate, selectedColors } = get();

    if (!resumeFile || !jobUrl) {
      console.error("Resume file or job URL is missing.");
      return;
    }
    if (!selectedTemplate || !selectedColors) {
      console.error("Template or colors are not selected.");
      return;
    }

    // Get user ID from profile store
    const userId = useProfileStore.getState().user?.uid;
    if (!userId) {
      console.error(
        "User ID is not available. Please ensure the user is authenticated."
      );
      return;
    }

    // Start the generation process
    set({ isGenerating: true, activeTab: "preview" });

    // Generate a unique channel ID for SSE connection
    const channelId = crypto.randomUUID();
    set({ sseChannelId: channelId });

    try {
      const { historyId, resume, coverLetter } =
        await generateTailoredDocuments(
          resumeFile,
          jobUrl,
          userId,
          selectedTemplate,
          selectedColors,
          channelId
        );

      set({
        generatedResume: resume,
        generatedCoverLetter: coverLetter,
        chatId: historyId,
        isComplete: true,
      });
    } catch (error) {
      console.error("Error generating documents:", error);
      set({ sseChannelId: null });
      // You might want to set an error state here
    } finally {
      set({ isGenerating: false });
      if (userId) {   
        await useChatStore.getState().fetchChats(userId);
      }
    }
  },

  resetForm: () => {
    set({
      resumeFile: null,
      originalResume: "",
      jobUrl: "",
      selectedTemplate: null,
      selectedColors: null,
      isComplete: false,
      generatedResume: "",
      generatedCoverLetter: "",
      activeTab: "upload",
      chatId: null,
      sseChannelId: null,
      isGenerating: false,
    });
  },
}));
