// Create a new package to store constants and avoid circular dependencies
package constants

const (
	ResumeGenModel  = "gpt-4o-mini"
	SubjectGenModel = "meta-llama/Meta-Llama-3.1-70B-Instruct-fast"
)

// Chat prompt roles
const OpenAIInstruction = `
You are a professional resume and cover letter editor. Your task is to analyze and improve a candidate’s resume and create a compelling, customized cover letter for a specific job description.

Inputs You Will Receive:

resume: Raw or unoptimized resume content.
job_description: Full job description text.
cover_letter_template (optional): Any previous or reference cover letter for tone/style inspiration.

Your Output: Return a valid JSON Object only in the following format:
{
	"generated_resume": "<VALID UPDATED HTML RESUME>",
	"generated_cover_letter": "Final polished cover letter in plain text format"
}

Resume Instructions (generated_resume):
- Return only the updated resume in valid HTML format.
- Preserve the layout, tag structure, class names, and CSS styles defined in the provided template.
- Revise content to better match the job description—highlight relevant skills, tools, and experience.
- Omit irrelevant sections and add any necessary sections (e.g., certifications, relevant projects).
- Be concise, quantifiable, and achievement-oriented.

Cover Letter Instructions (generated_cover_letter):
- Write a strong, tailored cover letter using the candidate's resume and the job description.
- Use the following structure:
	• Opening hook: Show awareness of company needs or make a bold relevant statement.
	• Experience alignment: Match the candidate’s background with the job role.
	• Value proposition: Highlight one or two measurable achievements or future opportunities they bring.
	• Forward-facing ending: Express enthusiasm and invite further conversation.
- Keep it to 3–5 paragraphs, professional and personable.
- Use plain text format, no HTML.

Do NOT use triple backticks or triple quotes for the JSON output.
`

// This will be sent as a *user* message, immediately followed by the combined job-posting + resume text.
const AssistantResumeExample = `
HTML Template Example: """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resume Template</title>
  <style>
	body {
	  font-family: Arial, sans-serif;
	  margin: 0;
	  padding: 0;
	  background-color: #f4f4f4;
	}
	.container {
	  display: flex;
	  max-width: 1000px;
	  margin: 2rem auto;
	  background-color: #fff;
	  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}
	.main {
	  flex: 3;
	  padding: 2rem;
	}
	.sidebar {
	  flex: 1;
	  background-color: #f0f0f0;
	  padding: 2rem;
	}
	h1 {
	  color: #2a4ec8;
	  margin-bottom: 0.2rem;
	}
	h2, h3 {
	  margin-top: 1.5rem;
	  color: #444;
	}
	p, li {
	  font-size: 0.95rem;
	  line-height: 1.5;
	  color: #333;
	}
	ul {
	  padding-left: 1.5rem;
	}
	.job-title {
	  font-weight: bold;
	  color: #222;
	}
	.date {
	  float: right;
	  font-size: 0.9rem;
	  color: #777;
	}
	.section {
	  margin-bottom: 2rem;
	}
	.sidebar h3 {
	  margin-top: 0;
	  font-size: 1.2rem;
	  border-bottom: 2px solid #ccc;
	  padding-bottom: 0.3rem;
	}
  </style>
</head>
<body>
  <div class="container">
	<div class="main">
	  <h1>First Last</h1>
	  <h3>Software Engineer Intern</h3>
	  <p>
		Software engineer intern with over 3 years of experience writing and testing code,
		helping develop software system solutions, and updating companies’ knowledge using
		the latest development tools. Well-skilled in software development life cycle,
		including requirement analysis, design, development, and production support. Key
		achievement: collaborated with a 5-member team to release a new system suite,
		saving the company $21K in monthly QA costs.
	  </p>

	  <div class="section">
		<h2>Work Experience</h2>
		<p class="job-title">Software Engineer Intern <span class="date">Nov 2020 – Present</span></p>
		<p>Resume Worded, New York, NY</p>
		<ul>
		  <li>Assisted in developing a CRM software upgrade that saved an annual budget of $80K, improving customer service by 73%.</li>
		  <li>Streamlined 17 existing applications for a more intuitive workflow; reduced interface complexity by 92%.</li>
		  <li>Collaborated with a 5-member team to release a new system suite, saving the company $21K in monthly QA costs.</li>
		  <li>Partnered with 11 supervisors to develop tools that reduced debugging time by 72%.</li>
		</ul>

		<p class="job-title">Software Developer <span class="date">Feb 2019 – Oct 2020</span></p>
		<p>Growthsi, San Francisco, CA</p>
		<ul>
		  <li>Devised 14 web applications using PHP/MySQL framework, increasing site traffic by 80% within the first month.</li>
		  <li>Introduced an automated system for deploying software updates across 29 servers, reducing deployment time from 5 days to 24 hours.</li>
		  <li>Conceived a new system that tracked and analyzed 18TB of customer data, increasing sales by 67% QoQ.</li>
		  <li>Developed scripts for database backups, restores, and server provisioning, saving 72 person-hours weekly.</li>
		</ul>

		<p class="job-title">Computer Technician <span class="date">Jun 2018 – Jan 2019</span></p>
		<p>Resume Worded’s Exciting Company, New York, NY</p>
		<ul>
		  <li>Created an automated system that tracked the time cards of 3K employees, saving 72 hours per week in payroll processing.</li>
		  <li>Installed and configured hardware/software for 2K clients.</li>
		  <li>Maintained a detailed inventory of all computer parts in the warehouse worth over $220K.</li>
		  <li>Updated security patches on 1.5K computers, preventing malware attacks within 13 weeks on the job.</li>
		</ul>
	  </div>
	</div>

	<div class="sidebar">
	  <h3>Contact</h3>
	  <p>Atlanta, GA (Open to Remote)<br>
	  +1-234-456-789<br>
	  email@resumeworded.com<br>
	  linkedin.com/in/username<br>
	  github.com/resumeworded</p>

	  <h3>Skills</h3>
	  <p><strong>Technical Skills:</strong><br>
	  Debugging (Advanced), Coding (Experienced), Web programming,<br>
	  Software design and testing, Web development</p>

	  <p><strong>Industry Knowledge:</strong><br>
	  Software Development, Amazon Web Services (AWS),<br>
	  Object-Oriented Programming (OOP)</p>

	  <p><strong>Tools and Software:</strong><br>
	  XML, .NET Framework, jQuery,<br>
	  PostgreSQL, Laravel</p>

	  <h3>Education</h3>
	  <p><strong>Resume Worded University</strong><br>
	  Bachelor of Science – Computer Science<br>
	  Boston, MA – May 2018<br>
	  Awards: Resume Worded Teaching Fellow (Top 5), Dean’s List 2012 (Top 10%)</p>

	  <h3>Other</h3>
	  <ul>
		<li>AWS Certified Solutions Architect</li>
		<li>Azure Solutions Architect Certification</li>
		<li>Microsoft Certified Solutions Developer</li>
	  </ul>
	</div>
  </div>
</body>
</html>
""" 
`

// For subject generation: respond with nothing but the subject line (no quotes, no punctuation).
const SubjectGenInstruction = `
You are a concise title generator and company name extractor.
For a given conversation, produce:

1. A brief title (1–4 words, max 40 characters) that summarizes the topic, incorporating the job title and company name.
2. A JSON object with two keys:
   • title
   • company_name
   
Return a valid JSON Object only.
`

const SubjectGenAssistantInstruction = `
{"title":"Data Scientist Acme Corp","company_name":"Acme Corp"}
Do NOT use triple backticks or triple quotes for the JSON output.
`
