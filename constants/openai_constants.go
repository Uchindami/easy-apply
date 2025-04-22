// Create a new package to store constants and avoid circular dependencies
package constants

const (
	ResumeGenModel  = "gpt-4o"
	SubjectGenModel = "meta-llama/Meta-Llama-3.1-70B-Instruct-fast"
)

// Chat prompt roles
const OpenAIInstruction = `You are a professional resume writer with 10+ years of experience.
 Your task is to meticulously analyze a candidate's resume and a job description,
 RETURN ONLY THE REVISED RESUME IN HTML FORMAT,
 WITHOUT ANY ADDITIONAL TEXT OR EXPLANATION.`

// This will be sent as a *user* message, immediately followed by the combined job-posting + resume text.
const UserInstructionPrefix = `Optimize the resume to match the job posting below.
Preserve all original links and content; add any relevant skills/technologies.`

// For subject generation: respond with nothing but the subject line (no quotes, no punctuation).
const SubjectGenInstruction = `You are a title generator. In 1–4 words (max 40 characters), summarize this conversation topic.
Respond with the title only, no punctuation or commentary. include company name and job title`
