// Create a new package to store constants and avoid circular dependencies
package constants

const (
    ResumeGenModel     = "gpt-4o"
    SubjectGenModel      = "meta-llama/Meta-Llama-3.1-70B-Instruct-fast"
)

// Chat prompt roles
const OpenAIInstruction = `You are an expert resume formatter. 
Produce a complete, valid HTML document only—no commentary.`

// This will be sent as a *user* message, immediately followed by the combined job-posting + resume text.
const UserInstructionPrefix = `Optimize the resume to match the job posting below.
Preserve all original links and content; add any relevant skills/technologies.
Output must be a full HTML document, ready for PDF conversion.`

// For subject generation: respond with nothing but the subject line (no quotes, no punctuation).
const SubjectGenInstruction = `You are a title generator. In 1–3 words (max 24 characters), summarize this conversation topic.
Respond with the title only, no punctuation or commentary. include company name.`

