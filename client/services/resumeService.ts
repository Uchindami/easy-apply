import type { channel } from "diagnostics_channel";
import { Document, Packer, Paragraph } from "docx";

interface GeneratedDocuments {
  resume: string;
  coverLetter: string;
  userId?: string;
  historyId: string;
}

interface ApiResponse {
  resume: string;
  coverLetter: string;
  historyId: string;
}

/**
 * Generates tailored resume and cover letter documents by uploading a resume file and job URL.
 * @param resumeFile - The user's resume file.
 * @param jobUrl - The URL of the job posting.
 * @param userId - The user's unique identifier.
 * @returns A promise resolving to the generated documents.
 * @throws If the API request fails or returns an error status.
 */
export async function generateTailoredDocuments(
  resumeFile: File,
  jobUrl: string,
  userId: string,
  selectedTemplate: object,
  selectedColors: object,
  channelId:string
): Promise<GeneratedDocuments> {
  const missingParams: string[] = [];
  if (!resumeFile) missingParams.push("resumeFile");
  if (!jobUrl) missingParams.push("jobUrl");
  if (!userId) missingParams.push("userId");
  if (!selectedTemplate) missingParams.push("selectedTemplate");
  if (!selectedColors) missingParams.push("selectedColors");

  if (missingParams.length > 0) {
    throw new Error(
      `Missing required parameter(s): ${missingParams.join(", ")}`
    );
  }
  if (!(resumeFile instanceof File)) {
    throw new Error("resumeFile must be a valid File object");
  }
  if (typeof jobUrl !== "string" || typeof userId !== "string") {
    throw new Error("jobUrl and userId must be strings");
  }

  const formData = new FormData();
  formData.append("file", resumeFile);
  formData.append("weblink", jobUrl);
  formData.append("userId", userId);
  formData.append("channelId", channelId); 
  formData.append("selectedTemplate", JSON.stringify(selectedTemplate));
  formData.append("selectedColors", JSON.stringify(selectedColors));

  console.log(resumeFile, jobUrl, userId, selectedTemplate, selectedColors);
  console.log("FormData prepared for upload:", formData);

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {   
      const errorText = await response.text();
      throw new Error(
        `Failed to generate documents. Status: ${response.status}. Message: ${errorText}`
      );
    }

    const data = (await response.json()) as ApiResponse;
    return {
      resume: data.resume,
      coverLetter: data.coverLetter,
      historyId: data.historyId,
      userId,
    };
  } catch (error) {
    console.error("Failed to generate documents:", error);
    throw error;
  }
}

/**
 * Converts HTML content to PDF via backend.
 * @param htmlContent - The HTML string to convert.
 * @returns A Blob representing the PDF file.
 */
export async function convertHtmlToPdf(htmlContent: string): Promise<Blob> {
  const response = await fetch("/convert-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: htmlContent }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to convert HTML to PDF. Status: ${response.status}`
    );
  }

  return await response.blob();
}

/**
 * Converts HTML content to a DOCX Blob using the docx package.
 * @param htmlContent - The HTML string to convert.
 * @returns A Blob representing the DOCX file.
 */
export async function convertHtmlToDocx(htmlContent: string): Promise<Blob> {
  // Simple HTML to text conversion (for demo; for full HTML support, use a parser)
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  const text = tempDiv.innerText || tempDiv.textContent || "";

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [new Paragraph({ text })],
      },
    ],
  });
  const buffer = await Packer.toBlob(doc);
  return buffer;
}
