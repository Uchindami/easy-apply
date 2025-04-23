// Create a new package to store constants and avoid circular dependencies
package constants

const (
	ResumeGenModel  = "gpt-4o"
	SubjectGenModel = "microsoft/Phi-3.5-mini-instruct"
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
const SubjectGenInstruction = `You are a concise title generator and company name extractor.  
For a given conversation, produce:

1. A brief title (1–4 words, max 40 characters) that summarizes the topic, incorporating the job title and company name.  
2. A JSON object with two keys:
   • title  
   • company_name  

Respond with the title text only (no punctuation, no commentary), then output the JSON.`

const SubjectGenAssistantInstruction = `"""{\"title\":\"Data Scientist Acme Corp\",\"company_name\":\"Acme Corp\"}"""`