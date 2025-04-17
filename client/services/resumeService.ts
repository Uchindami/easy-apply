
interface GeneratedDocuments {
  resume: string
  coverLetter: string
}

export async function generateTailoredDocuments(resumeFile: File, jobUrl: string): Promise<GeneratedDocuments> {
  const formData = new FormData()
  formData.append("file", resumeFile)
  formData.append("weblink", jobUrl)
  formData.append("weblink", jobUrl)

  // console.log(resumeFile,jobUrl)

  try {
    const response = await fetch("http://localhost:8080/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }

    const data = await response.json()
    return {
      resume: data.resume,
      coverLetter: data.coverLetter,
    }
  } catch (error) {
    console.error("Failed to generate documents:", error)
    throw error
  }
}
