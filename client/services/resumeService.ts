interface GeneratedDocuments {
  resume: string
  coverLetter: string
  userId?: string
}

interface ApiResponse {
  resume: string
  coverLetter: string
}

/**
 * Generates tailored resume and cover letter documents by uploading a resume file and job URL.
 * @param resumeFile - The user's resume file.
 * @param jobUrl - The URL of the job posting.
 * @param userId - The user's unique identifier.
 * @returns A promise resolving to the generated documents.
 * @throws If the API request fails or returns an error status.
 */
export async function generateTailoredDocuments(resumeFile: File, jobUrl: string, userId: string): Promise<GeneratedDocuments> {
  const formData = new FormData()
  formData.append("file", resumeFile)
  formData.append("weblink", jobUrl)
  formData.append("userId", userId)

  // console.log(resumeFile,jobUrl)

  try {
    const response = await fetch("http://localhost:8080/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to generate documents. Status: ${response.status}. Message: ${errorText}`)
    }

    const data = (await response.json()) as ApiResponse
    return {
      resume: data.resume,
      coverLetter: data.coverLetter,
      userId,
    }
  } catch (error) {
    console.error("Failed to generate documents:", error)
    throw error
  }
}
