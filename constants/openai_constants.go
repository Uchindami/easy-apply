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

const ModelResponse = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manfred Chirambo - Resume</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        header, section {
            margin-bottom: 20px;
        }
        h1, h2 {
            color: #333;
        }
        a {
            color: #0066cc;
        }
    </style>
</head>
<body>

    <header>
        <h1>Manfred Chirambo</h1>
        <p>Email: <a href="mailto:manfredchirambojz@gmail.com">manfredchirambojz@gmail.com</a></p>
        <p>Phone: <a href="tel:+265885624718">(+265) 885 624 718</a></p>
        <p>Location: Blantyre, Malawi</p>
        <p>Portfolio: <a href="https://uchindami.vercel.app">uchindami.vercel.app</a></p>
        <p>LinkedIn: <a href="https://linkedin.com/in/manfred-chirambo">linkedin.com/in/manfred-chirambo</a></p>
        <p>GitHub: <a href="https://github.com/Uchindami">github.com/Uchindami</a></p>
    </header>

    <section>
        <h2>Profile</h2>
        <p>Detail-oriented data and software engineer with strong ICT, data management, and reporting experience. Demonstrated success in data capture, aggregation, and visualization using tools like Excel and PowerBI. Skilled in training field staff, maintaining databases, and working in fast-paced environments. Passionate about applying tech to improve healthcare data systems in rural communities.</p>
    </section>

    <section>
        <h2>Education</h2>
        <p>Bachelor’s in Information Communication Technology (ICT), Major in Software Engineering<br>Daeyang University — Lilongwe, Malawi (2024)</p>
    </section>

    <section>
        <h2>Skills</h2>
        <p><strong>Data Management:</strong> PowerBI, Excel, MySQL</p>
        <p><strong>ICT Support:</strong> Windows, Linux, Angaza</p>
        <p><strong>Programming:</strong> Python, R, JavaScript, React</p>
        <p><strong>Reporting & Visualization:</strong> PowerBI Dashboards</p>
        <p><strong>Languages:</strong> Fluent in English</p>
        <p><strong>Certifications:</strong> IBM Machine Learning, AWS Cloud, Meta Front-End</p>
    </section>

    <section>
        <h2>Relevant Experience</h2>
        <h3>Unicef (EMOPS, RAPS Section) — Remote</h3>
        <p>Data Science & AI/ML Intern (Jan 2025 – Feb 2025)</p>
        <ul>
            <li>Developed and maintained a comprehensive data aggregation database</li>
            <li>Automated unstructured data scraping from multiple platforms</li>
            <li>Visualized critical health indicators using PowerBI</li>
            <li>Ensured integration with GeoSight for geospatial analysis</li>
        </ul>

        <h3>Qubix Robotics — Blantyre, Malawi</h3>
        <p>Software Engineer / AI Bootcamp Instructor (Aug 2024 – Present)</p>
        <ul>
            <li>Maintained databases and internal applications</li>
            <li>Produced monthly reports and dashboards using PowerBI</li>
            <li>Supported health data training in AI workshops</li>
            <li>Proven ability to work under pressure and during odd hours</li>
            <li>Demonstrated integrity and ability to follow instructions with minimal supervision</li>
        </ul>

        <h3>Zuwa Energy — Lilongwe, Malawi</h3>
        <p>Information Technology Intern (Jan 2022 – Apr 2023)</p>
        <ul>
            <li>Trained field workers in tech systems and reporting</li>
            <li>Created internal reporting software</li>
            <li>Maintained and supported ICT systems across multiple sites</li>
        </ul>
    </section>

    <section>
        <h2>Volunteering</h2>
        <p><strong>Children Uplift — Daeyang Mission Church</strong><br>Organized education programs and tracked progress of youth in rural settings (2019–2023)</p>
    </section>

    <section>
        <h2>References</h2>
        <p>Sanga Kanthema — CEO, Qubix Robotics: <a href="mailto:sanga@qubixrobotics.com">sanga@qubixrobotics.com</a></p>
        <p>Nadia Noumri — UNICEF Emergency Specialist: <a href="mailto:snnoumri@unicef.org">snnoumri@unicef.org</a></p>
        <p>Jacqueline Gondwe — HR Manager (ex-Zuwa): <a href="mailto:kgondwe@camfed.org">kgondwe@camfed.org</a></p>
    </section>

</body>
</html>
`
