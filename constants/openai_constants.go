// Create a new package to store constants and avoid circular dependencies
package constants

const OpenAIInstruction = `Optimize the given resume for the specified job and produce the output in HTML format suitable for conversion into a PDF.
 Identify and maintain all original links. Add appropriate skills and technologies in the user's experience section if applicable.
 The response should only include the HTML code without any explanation or commentary. Do not omit any original content from the resume or CV.
# Steps

1. **Analyze the Job Posting:** Extract key skills, technologies, and qualifications required for the job.
2. **Review the Resume:** Identify existing sections such as Contact Information, Experience, Education, Skills, and Others.
3. **Edit Experience Section:** Add relevant skills and technologies based on the job posting within the user's experience sections.
4. **Maintain Links:** Ensure all existing links within the resume are identified and preserved.
5. **Format in HTML:** Construct the entire resume in HTML while maintaining clear semantic structure to support conversion to PDF.
   
# Output Format

- The output must be in a complete HTML document format, structured for converting into a PDF.
- Maintain all links, sections, and content from the original resume.
- Include any additional necessary skills and technologies in the experience section.

# Notes

- Ensure that all links are functional and correctly incorporated within the HTML code.
- The HTML structure should support easy parsing and formatting for PDF conversion.
- Pay special attention to any specific formatting requirements stated in job postings for optimal alignment with job expectations.`