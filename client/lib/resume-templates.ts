export interface Template {
  id: string;
  name: string;
  description: string;
  htmlContent: string;
  category: "modern" | "classic" | "creative";
  supportedFormats: ("pdf" | "word" | "html")[];
}

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

export const resumeTemplates: Template[] = [
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Clean, contemporary design with plenty of white space",
    category: "modern",
    supportedFormats: ["pdf", "word", "html"],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Minimal Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 40px;
        }
        
        .resume {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            padding: 60px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #2563eb;
        }
        
        .name {
            font-size: 2.5em;
            font-weight: 300;
            color: #2563eb;
            margin-bottom: 10px;
        }
        
        .title {
            font-size: 1.2em;
            color: #64748b;
            margin-bottom: 20px;
        }
        
        .contact {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
        }
        
        .contact-item {
            color: #64748b;
            font-size: 0.9em;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.4em;
            color: #2563eb;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        
        .experience-item, .education-item {
            margin-bottom: 25px;
        }
        
        .job-title {
            font-size: 1.1em;
            font-weight: 600;
            color: #1e293b;
        }
        
        .company {
            color: #2563eb;
            font-weight: 500;
        }
        
        .date {
            color: #64748b;
            font-size: 0.9em;
            float: right;
        }
        
        .description {
            margin-top: 10px;
            color: #4b5563;
        }
        
        .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .skill {
            background: #f1f5f9;
            color: #2563eb;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="resume">
        <div class="header">
            <h1 class="name">John Doe</h1>
            <p class="title">Senior Software Engineer</p>
            <div class="contact">
                <span class="contact-item">john.doe@email.com</span>
                <span class="contact-item">+1 (555) 123-4567</span>
                <span class="contact-item">LinkedIn: /in/johndoe</span>
                <span class="contact-item">San Francisco, CA</span>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Experience</h2>
            <div class="experience-item">
                <div class="job-title">Senior Software Engineer</div>
                <div class="company">Tech Company Inc.</div>
                <div class="date">2020 - Present</div>
                <div class="description">
                    Led development of scalable web applications using React and Node.js. Mentored junior developers and improved team productivity by 30%.
                </div>
            </div>
            <div class="experience-item">
                <div class="job-title">Software Engineer</div>
                <div class="company">Startup Solutions</div>
                <div class="date">2018 - 2020</div>
                <div class="description">
                    Developed full-stack applications and implemented CI/CD pipelines. Collaborated with cross-functional teams to deliver high-quality products.
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Education</h2>
            <div class="education-item">
                <div class="job-title">Bachelor of Science in Computer Science</div>
                <div class="company">University of Technology</div>
                <div class="date">2014 - 2018</div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Skills</h2>
            <div class="skills">
                <span class="skill">JavaScript</span>
                <span class="skill">React</span>
                <span class="skill">Node.js</span>
                <span class="skill">Python</span>
                <span class="skill">AWS</span>
                <span class="skill">Docker</span>
            </div>
        </div>
    </div>
</body>
</html>`,
  },
  {
    id: "classic-professional",
    name: "Classic Professional",
    description: "Traditional layout perfect for corporate positions",
    category: "classic",
    supportedFormats: ["pdf", "word", "html"],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Classic Professional Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.5;
            color: #000;
            background: white;
            padding: 40px;
        }
        
        .resume {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #000;
        }
        
        .name {
            font-size: 2.2em;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        
        .contact {
            margin-top: 15px;
        }
        
        .contact-line {
            margin-bottom: 5px;
            font-size: 0.95em;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #000;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
        }
        
        .experience-item, .education-item {
            margin-bottom: 20px;
        }
        
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 5px;
        }
        
        .job-title {
            font-weight: bold;
            font-size: 1.05em;
        }
        
        .company {
            font-style: italic;
            margin-bottom: 5px;
        }
        
        .date {
            font-weight: bold;
            font-size: 0.9em;
        }
        
        .description {
            margin-top: 8px;
            text-align: justify;
        }
        
        .skills-list {
            columns: 2;
            column-gap: 40px;
        }
        
        .skill-item {
            margin-bottom: 5px;
            break-inside: avoid;
        }
        
        ul {
            margin-left: 20px;
        }
        
        li {
            margin-bottom: 3px;
        }
    </style>
</head>
<body>
    <div class="resume">
        <div class="header">
            <h1 class="name">JANE SMITH</h1>
            <div class="contact">
                <div class="contact-line">123 Professional Street, Business City, BC 12345</div>
                <div class="contact-line">(555) 987-6543 | jane.smith@email.com</div>
                <div class="contact-line">LinkedIn: linkedin.com/in/janesmith</div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Professional Summary</h2>
            <p>Experienced marketing professional with over 8 years of expertise in digital marketing, brand management, and strategic planning. Proven track record of increasing brand awareness and driving revenue growth through innovative marketing campaigns.</p>
        </div>
        
        <div class="section">
            <h2 class="section-title">Professional Experience</h2>
            <div class="experience-item">
                <div class="job-header">
                    <div class="job-title">Marketing Director</div>
                    <div class="date">2019 - Present</div>
                </div>
                <div class="company">Global Marketing Solutions, Business City, BC</div>
                <div class="description">
                    <ul>
                        <li>Developed and executed comprehensive marketing strategies resulting in 40% increase in brand awareness</li>
                        <li>Managed a team of 12 marketing professionals across multiple departments</li>
                        <li>Oversaw annual marketing budget of $2.5 million with consistent ROI of 300%</li>
                        <li>Launched successful digital transformation initiative increasing online engagement by 65%</li>
                    </ul>
                </div>
            </div>
            <div class="experience-item">
                <div class="job-header">
                    <div class="job-title">Senior Marketing Manager</div>
                    <div class="date">2016 - 2019</div>
                </div>
                <div class="company">Creative Agency Partners, Business City, BC</div>
                <div class="description">
                    <ul>
                        <li>Led cross-functional teams to deliver integrated marketing campaigns for Fortune 500 clients</li>
                        <li>Increased client retention rate by 25% through strategic account management</li>
                        <li>Implemented data-driven marketing approaches resulting in 50% improvement in campaign effectiveness</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Education</h2>
            <div class="education-item">
                <div class="job-header">
                    <div class="job-title">Master of Business Administration (MBA)</div>
                    <div class="date">2014 - 2016</div>
                </div>
                <div class="company">Business University, Business City, BC</div>
                <div class="description">Concentration in Marketing and Strategic Management</div>
            </div>
            <div class="education-item">
                <div class="job-header">
                    <div class="job-title">Bachelor of Arts in Communications</div>
                    <div class="date">2010 - 2014</div>
                </div>
                <div class="company">State University, University Town, UT</div>
                <div class="description">Magna Cum Laude, Marketing Minor</div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Core Competencies</h2>
            <div class="skills-list">
                <div class="skill-item">• Digital Marketing Strategy</div>
                <div class="skill-item">• Brand Management</div>
                <div class="skill-item">• Team Leadership</div>
                <div class="skill-item">• Budget Management</div>
                <div class="skill-item">• Market Research</div>
                <div class="skill-item">• Campaign Development</div>
                <div class="skill-item">• Social Media Marketing</div>
                <div class="skill-item">• Analytics & Reporting</div>
            </div>
        </div>
    </div>
</body>
</html>`,
  },
  {
    id: "creative-bold",
    name: "Creative Bold",
    description: "Eye-catching design for creative industries",
    category: "creative",
    supportedFormats: ["pdf", "html"],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Creative Bold Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        
        .resume {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #7c3aed, #a855f7);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 20px;
            background: white;
            border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        }
        
        .name {
            font-size: 3em;
            font-weight: 900;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .title {
            font-size: 1.3em;
            margin-bottom: 20px;
            opacity: 0.9;
        }
        
        .contact {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
        }
        
        .contact-item {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.5em;
            color: #7c3aed;
            margin-bottom: 20px;
            position: relative;
            padding-left: 30px;
            font-weight: 700;
        }
        
        .section-title::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 20px;
            height: 20px;
            background: linear-gradient(135deg, #7c3aed, #a855f7);
            border-radius: 50%;
        }
        
        .experience-item, .education-item {
            margin-bottom: 25px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 10px;
            border-left: 4px solid #7c3aed;
        }
        
        .job-title {
            font-size: 1.2em;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 5px;
        }
        
        .company {
            color: #7c3aed;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .date {
            background: #7c3aed;
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 10px;
        }
        
        .description {
            color: #4b5563;
        }
        
        .skills {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .skill-category {
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
            padding: 20px;
            border-radius: 10px;
            border-top: 3px solid #7c3aed;
        }
        
        .skill-category h4 {
            color: #7c3aed;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .skill-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .skill {
            background: white;
            color: #7c3aed;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 0.85em;
            font-weight: 600;
            border: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="resume">
        <div class="header">
            <h1 class="name">ALEX CREATIVE</h1>
            <p class="title">Creative Director & UX Designer</p>
            <div class="contact">
                <span class="contact-item">alex@creative.com</span>
                <span class="contact-item">+1 (555) 456-7890</span>
                <span class="contact-item">alexcreative.com</span>
                <span class="contact-item">New York, NY</span>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2 class="section-title">Creative Vision</h2>
                <p>Passionate creative director with 10+ years of experience crafting compelling visual narratives and user experiences. Specialized in brand identity, digital design, and leading creative teams to deliver award-winning campaigns.</p>
            </div>
            
            <div class="section">
                <h2 class="section-title">Experience</h2>
                <div class="experience-item">
                    <div class="job-title">Creative Director</div>
                    <div class="company">Innovative Design Studio</div>
                    <div class="date">2020 - Present</div>
                    <div class="description">
                        Lead a team of 15 designers and developers in creating cutting-edge digital experiences for Fortune 500 clients. Increased client satisfaction by 45% and won 3 industry awards for campaign excellence.
                    </div>
                </div>
                <div class="experience-item">
                    <div class="job-title">Senior UX Designer</div>
                    <div class="company">Tech Startup Inc.</div>
                    <div class="date">2017 - 2020</div>
                    <div class="description">
                        Designed user-centered interfaces for mobile and web applications. Improved user engagement by 60% through innovative design solutions and comprehensive user research.
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Education</h2>
                <div class="education-item">
                    <div class="job-title">Master of Fine Arts in Graphic Design</div>
                    <div class="company">Art Institute of Design</div>
                    <div class="date">2015 - 2017</div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Skills & Expertise</h2>
                <div class="skills">
                    <div class="skill-category">
                        <h4>Design Tools</h4>
                        <div class="skill-list">
                            <span class="skill">Adobe Creative Suite</span>
                            <span class="skill">Figma</span>
                            <span class="skill">Sketch</span>
                            <span class="skill">Principle</span>
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Development</h4>
                        <div class="skill-list">
                            <span class="skill">HTML/CSS</span>
                            <span class="skill">JavaScript</span>
                            <span class="skill">React</span>
                            <span class="skill">Webflow</span>
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Leadership</h4>
                        <div class="skill-list">
                            <span class="skill">Team Management</span>
                            <span class="skill">Creative Strategy</span>
                            <span class="skill">Client Relations</span>
                            <span class="skill">Project Management</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`,
  },
  {
    id: "tech-focused",
    name: "Tech Focused",
    description: "Modern layout optimized for technical roles",
    category: "modern",
    supportedFormats: ["pdf", "html"],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tech Focused Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            line-height: 1.6;
            color: #0d9488;
            background: #0f172a;
            padding: 20px;
        }
        
        .resume {
            max-width: 900px;
            margin: 0 auto;
            background: #1e293b;
            border: 2px solid #0d9488;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 0 30px rgba(13, 148, 136, 0.3);
        }
        
        .header {
            border-bottom: 2px solid #0d9488;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .name {
            font-size: 2.5em;
            color: #14b8a6;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .title {
            font-size: 1.2em;
            color: #64748b;
            margin-bottom: 15px;
        }
        
        .contact {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .contact-item {
            color: #94a3b8;
            font-size: 0.9em;
        }
        
        .contact-item::before {
            content: '> ';
            color: #0d9488;
        }
        
        .section {
            margin-bottom: 35px;
        }
        
        .section-title {
            font-size: 1.3em;
            color: #14b8a6;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
            position: relative;
        }
        
        .section-title::before {
            content: '// ';
            color: #64748b;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 50px;
            height: 2px;
            background: #0d9488;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 25px;
            padding: 20px;
            background: #334155;
            border-left: 4px solid #0d9488;
            border-radius: 4px;
        }
        
        .job-title, .project-title {
            font-size: 1.1em;
            color: #14b8a6;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .company, .tech-stack {
            color: #94a3b8;
            margin-bottom: 5px;
        }
        
        .date {
            color: #64748b;
            font-size: 0.9em;
            float: right;
            background: #475569;
            padding: 2px 8px;
            border-radius: 3px;
        }
        
        .description {
            color: #cbd5e1;
            margin-top: 10px;
        }
        
        .tech-skills {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .skill-category {
            background: #334155;
            padding: 20px;
            border-radius: 4px;
            border-top: 3px solid #0d9488;
        }
        
        .skill-category h4 {
            color: #14b8a6;
            margin-bottom: 15px;
            font-size: 1.1em;
        }
        
        .skill-category h4::before {
            content: 'class ';
            color: #64748b;
            font-size: 0.9em;
        }
        
        .skill-list {
            list-style: none;
        }
        
        .skill-list li {
            color: #cbd5e1;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        
        .skill-list li::before {
            content: '•';
            color: #0d9488;
            position: absolute;
            left: 0;
        }
        
        .code-block {
            background: #0f172a;
            border: 1px solid #0d9488;
            border-radius: 4px;
            padding: 15px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            color: #14b8a6;
            overflow-x: auto;
        }
        
        .comment {
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="resume">
        <div class="header">
            <h1 class="name">SARAH TECH</h1>
            <p class="title">Full Stack Developer | DevOps Engineer</p>
            <div class="contact">
                <div class="contact-item">sarah.tech@email.com</div>
                <div class="contact-item">+1 (555) 321-9876</div>
                <div class="contact-item">github.com/sarahtech</div>
                <div class="contact-item">Seattle, WA</div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">About</h2>
            <div class="code-block">
                <span class="comment">/* Passionate full-stack developer with 6+ years of experience</span><br>
                <span class="comment">   building scalable web applications and cloud infrastructure */</span><br><br>
                const developer = {<br>
                &nbsp;&nbsp;name: "Sarah Tech",<br>
                &nbsp;&nbsp;experience: "6+ years",<br>
                &nbsp;&nbsp;specialties: ["React", "Node.js", "AWS", "Docker"],<br>
                &nbsp;&nbsp;passion: "Clean code & innovative solutions"<br>
                };
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Experience</h2>
            <div class="experience-item">
                <div class="job-title">Senior Full Stack Developer</div>
                <div class="company">CloudTech Solutions</div>
                <div class="date">2021 - Present</div>
                <div class="description">
                    Architected and developed microservices-based applications serving 1M+ users. Led migration to AWS cloud infrastructure, reducing costs by 40% and improving performance by 60%.
                </div>
            </div>
            <div class="experience-item">
                <div class="job-title">Software Engineer</div>
                <div class="company">StartupFlow Inc.</div>
                <div class="date">2019 - 2021</div>
                <div class="description">
                    Built responsive web applications using React and Node.js. Implemented CI/CD pipelines and automated testing, reducing deployment time by 75%.
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Projects</h2>
            <div class="project-item">
                <div class="project-title">E-Commerce Platform</div>
                <div class="tech-stack">React, Node.js, PostgreSQL, Redis, AWS</div>
                <div class="description">
                    Built a scalable e-commerce platform handling 10K+ concurrent users. Implemented real-time inventory management and payment processing.
                </div>
            </div>
            <div class="project-item">
                <div class="project-title">DevOps Automation Suite</div>
                <div class="tech-stack">Docker, Kubernetes, Jenkins, Terraform</div>
                <div class="description">
                    Created automated deployment pipeline reducing manual deployment time from 2 hours to 5 minutes. Implemented infrastructure as code practices.
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Technical Skills</h2>
            <div class="tech-skills">
                <div class="skill-category">
                    <h4>Frontend</h4>
                    <ul class="skill-list">
                        <li>React / Next.js</li>
                        <li>TypeScript / JavaScript</li>
                        <li>HTML5 / CSS3 / SASS</li>
                        <li>Redux / Context API</li>
                    </ul>
                </div>
                <div class="skill-category">
                    <h4>Backend</h4>
                    <ul class="skill-list">
                        <li>Node.js / Express</li>
                        <li>Python / Django</li>
                        <li>PostgreSQL / MongoDB</li>
                        <li>REST APIs / GraphQL</li>
                    </ul>
                </div>
                <div class="skill-category">
                    <h4>DevOps</h4>
                    <ul class="skill-list">
                        <li>AWS / Azure</li>
                        <li>Docker / Kubernetes</li>
                        <li>Jenkins / GitHub Actions</li>
                        <li>Terraform / Ansible</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Education</h2>
            <div class="education-item">
                <div class="job-title">Bachelor of Science in Computer Science</div>
                <div class="company">Tech University</div>
                <div class="date">2015 - 2019</div>
            </div>
        </div>
    </div>
</body>
</html>`,
  },
  {
    id: "executive-elegant",
    name: "Executive Elegant",
    description: "Sophisticated design for senior positions",
    category: "classic",
    supportedFormats: ["pdf", "word", "html"],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Executive Elegant Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Georgia', serif;
            line-height: 1.7;
            color: #2c3e50;
            background: #f8f9fa;
            padding: 40px;
        }
        
        .resume {
            max-width: 850px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 50px 40px;
            text-align: center;
        }
        
        .name {
            font-size: 2.8em;
            font-weight: 300;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        
        .title {
            font-size: 1.3em;
            margin-bottom: 25px;
            opacity: 0.9;
            font-style: italic;
        }
        
        .contact {
            display: flex;
            justify-content: center;
            gap: 40px;
            flex-wrap: wrap;
        }
        
        .contact-item {
            font-size: 0.95em;
            opacity: 0.9;
        }
        
        .content {
            padding: 50px 40px;
        }
        
        .section {
            margin-bottom: 45px;
        }
        
        .section-title {
            font-size: 1.4em;
            color: #2c3e50;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 3px;
            font-weight: 400;
            position: relative;
            padding-bottom: 10px;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 60px;
            height: 2px;
            background: #34495e;
        }
        
        .summary {
            font-size: 1.1em;
            line-height: 1.8;
            color: #34495e;
            text-align: justify;
            font-style: italic;
        }
        
        .experience-item, .education-item {
            margin-bottom: 35px;
            padding-bottom: 25px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .experience-item:last-child, .education-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 8px;
            flex-wrap: wrap;
        }
        
        .job-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .company {
            font-size: 1.05em;
            color: #34495e;
            font-style: italic;
            margin-bottom: 8px;
        }
        
        .date {
            color: #7f8c8d;
            font-size: 0.95em;
            font-weight: 500;
        }
        
        .description {
            margin-top: 12px;
            color: #34495e;
            text-align: justify;
        }
        
        .achievements {
            margin-top: 15px;
        }
        
        .achievements ul {
            margin-left: 25px;
        }
        
        .achievements li {
            margin-bottom: 8px;
            color: #34495e;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
        }
        
        .skill-category {
            text-align: center;
        }
        
        .skill-category h4 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.1em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .skill-items {
            color: #34495e;
            line-height: 1.8;
        }
        
        .certifications {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .certification {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            border-left: 4px solid #34495e;
        }
        
        .cert-name {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .cert-org {
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="resume">
        <div class="header">
            <h1 class="name">MICHAEL EXECUTIVE</h1>
            <p class="title">Chief Executive Officer</p>
            <div class="contact">
                <span class="contact-item">michael.executive@email.com</span>
                <span class="contact-item">+1 (555) 111-2222</span>
                <span class="contact-item">LinkedIn: /in/michaelexecutive</span>
                <span class="contact-item">Boston, MA</span>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2 class="section-title">Executive Summary</h2>
                <p class="summary">
                    Visionary executive leader with over 15 years of experience driving organizational transformation and sustainable growth across Fortune 500 companies. Proven track record of increasing revenue by 300%+ while building high-performing teams and establishing market-leading positions in competitive industries.
                </p>
            </div>
            
            <div class="section">
                <h2 class="section-title">Professional Experience</h2>
                <div class="experience-item">
                    <div class="job-header">
                        <div class="job-title">Chief Executive Officer</div>
                        <div class="date">2018 - Present</div>
                    </div>
                    <div class="company">Global Industries Corporation, Boston, MA</div>
                    <div class="description">
                        Lead strategic vision and operational excellence for $2.5B multinational corporation with 5,000+ employees across 15 countries.
                    </div>
                    <div class="achievements">
                        <ul>
                            <li>Increased annual revenue from $800M to $2.5B through strategic acquisitions and market expansion</li>
                            <li>Improved operational efficiency by 45% through digital transformation initiatives</li>
                            <li>Successfully navigated company through economic challenges while maintaining 98% employee retention</li>
                            <li>Established partnerships with key industry leaders, expanding market reach by 60%</li>
                        </ul>
                    </div>
                </div>
                
                <div class="experience-item">
                    <div class="job-header">
                        <div class="job-title">Chief Operating Officer</div>
                        <div class="date">2014 - 2018</div>
                    </div>
                    <div class="company">Strategic Solutions Inc., Boston, MA</div>
                    <div class="description">
                        Oversaw daily operations and strategic planning for mid-market consulting firm specializing in organizational development.
                    </div>
                    <div class="achievements">
                        <ul>
                            <li>Scaled operations from 200 to 1,200 employees while maintaining service quality standards</li>
                            <li>Implemented lean management principles reducing operational costs by 30%</li>
                            <li>Led successful IPO preparation resulting in $150M capital raise</li>
                        </ul>
                    </div>
                </div>
                
                <div class="experience-item">
                    <div class="job-header">
                        <div class="job-title">Vice President of Strategy</div>
                        <div class="date">2010 - 2014</div>
                    </div>
                    <div class="company">Innovation Partners LLC, New York, NY</div>
                    <div class="description">
                        Developed and executed strategic initiatives for portfolio of technology companies in growth phase.
                    </div>
                    <div class="achievements">
                        <ul>
                            <li>Orchestrated 12 successful acquisitions totaling $400M in transaction value</li>
                            <li>Increased portfolio company valuations by average of 250% over 4-year period</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Education</h2>
                <div class="education-item">
                    <div class="job-header">
                        <div class="job-title">Master of Business Administration</div>
                        <div class="date">2008 - 2010</div>
                    </div>
                    <div class="company">Harvard Business School, Boston, MA</div>
                    <div class="description">Concentration in Strategy and General Management, Baker Scholar (Top 5%)</div>
                </div>
                <div class="education-item">
                    <div class="job-header">
                        <div class="job-title">Bachelor of Science in Economics</div>
                        <div class="date">2004 - 2008</div>
                    </div>
                    <div class="company">Massachusetts Institute of Technology, Cambridge, MA</div>
                    <div class="description">Summa Cum Laude, Phi Beta Kappa</div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Core Competencies</h2>
                <div class="skills-grid">
                    <div class="skill-category">
                        <h4>Leadership</h4>
                        <div class="skill-items">
                            Strategic Planning<br>
                            Team Development<br>
                            Change Management<br>
                            Board Relations
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Operations</h4>
                        <div class="skill-items">
                            P&L Management<br>
                            Process Optimization<br>
                            Risk Management<br>
                            Quality Assurance
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Growth</h4>
                        <div class="skill-items">
                            Market Expansion<br>
                            M&A Strategy<br>
                            Partnership Development<br>
                            Digital Transformation
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Professional Certifications</h2>
                <div class="certifications">
                    <div class="certification">
                        <div class="cert-name">Certified Executive Leadership</div>
                        <div class="cert-org">Executive Leadership Institute</div>
                    </div>
                    <div class="certification">
                        <div class="cert-name">Strategic Management Certificate</div>
                        <div class="cert-org">MIT Sloan Executive Education</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`,
  },
  {
    id: "startup-dynamic",
    name: "Startup Dynamic",
    description: "Fresh, energetic design for startup environments",
    category: "creative",
    supportedFormats: ["pdf", "html"],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Startup Dynamic Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        
        .resume {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            position: relative;
        }
        
        .resume::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #f97316, #ea580c, #dc2626, #be185d, #9333ea, #7c3aed);
        }
        
        .header {
            background: linear-gradient(135deg, #1f2937, #374151);
            color: white;
            padding: 40px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 200px;
            height: 200px;
            background: rgba(249, 115, 22, 0.1);
            border-radius: 50%;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: -30%;
            left: -10%;
            width: 150px;
            height: 150px;
            background: rgba(147, 51, 234, 0.1);
            border-radius: 50%;
        }
        
        .name {
            font-size: 2.8em;
            font-weight: 800;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #f97316, #ea580c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
            z-index: 1;
        }
        
        .title {
            font-size: 1.3em;
            margin-bottom: 20px;
            opacity: 0.9;
            font-weight: 500;
            position: relative;
            z-index: 1;
        }
        
        .contact {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
            position: relative;
            z-index: 1;
        }
        
        .contact-item {
            background: rgba(255,255,255,0.1);
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 0.9em;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.5em;
            color: #1f2937;
            margin-bottom: 25px;
            position: relative;
            padding-left: 25px;
            font-weight: 700;
        }
        
        .section-title::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 30px;
            background: linear-gradient(135deg, #f97316, #ea580c);
            border-radius: 2px;
        }
        
        .intro {
            background: linear-gradient(135deg, #fef3c7, #fed7aa);
            padding: 25px;
            border-radius: 15px;
            border-left: 5px solid #f97316;
            font-size: 1.05em;
            line-height: 1.7;
            color: #92400e;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 30px;
            padding: 25px;
            background: #f9fafb;
            border-radius: 15px;
            border: 1px solid #e5e7eb;
            position: relative;
            transition: all 0.3s ease;
        }
        
        .experience-item:hover, .project-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .job-title, .project-title {
            font-size: 1.2em;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .company, .tech-stack {
            color: #f97316;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .date {
            position: absolute;
            top: 25px;
            right: 25px;
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: 600;
        }
        
        .description {
            color: #4b5563;
            line-height: 1.7;
            margin-top: 10px;
        }
        
        .skills-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
        }
        
        .skill-category {
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            padding: 25px;
            border-radius: 15px;
            border-top: 4px solid #f97316;
            text-align: center;
        }
        
        .skill-category h4 {
            color: #1f2937;
            margin-bottom: 15px;
            font-weight: 700;
            font-size: 1.1em;
        }
        
        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
        }
        
        .skill-tag {
            background: white;
            color: #f97316;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            border: 2px solid #fed7aa;
            transition: all 0.3s ease;
        }
        
        .skill-tag:hover {
            background: #f97316;
            color: white;
            transform: scale(1.05);
        }
        
        .achievements {
            background: linear-gradient(135deg, #ecfdf5, #d1fae5);
            padding: 25px;
            border-radius: 15px;
            border-left: 5px solid #10b981;
        }
        
        .achievements h4 {
            color: #065f46;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .achievement-list {
            list-style: none;
        }
        
        .achievement-list li {
            color: #047857;
            margin-bottom: 8px;
            padding-left: 25px;
            position: relative;
        }
        
        .achievement-list li::before {
            content: '🚀';
            position: absolute;
            left: 0;
        }
    </style>
</head>
<body>
    <div class="resume">
        <div class="header">
            <h1 class="name">EMMA STARTUP</h1>
            <p class="title">Product Manager & Growth Hacker</p>
            <div class="contact">
                <span class="contact-item">emma@startup.com</span>
                <span class="contact-item">+1 (555) 789-0123</span>
                <span class="contact-item">emmastartup.io</span>
                <span class="contact-item">San Francisco, CA</span>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2 class="section-title">Mission Statement</h2>
                <div class="intro">
                    Passionate product leader with 5+ years of experience scaling startups from MVP to millions of users. Expert in growth hacking, user acquisition, and building products that people love. Thrives in fast-paced environments where innovation meets execution.
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Experience</h2>
                <div class="experience-item">
                    <div class="job-title">Senior Product Manager</div>
                    <div class="company">RocketShip Technologies</div>
                    <div class="date">2022 - Present</div>
                    <div class="description">
                        Leading product strategy for B2B SaaS platform serving 50K+ businesses. Drove 300% user growth through data-driven feature development and strategic partnerships.
                    </div>
                </div>
                <div class="experience-item">
                    <div class="job-title">Growth Product Manager</div>
                    <div class="company">ScaleUp Inc.</div>
                    <div class="date">2020 - 2022</div>
                    <div class="description">
                        Spearheaded growth initiatives that increased monthly active users from 10K to 500K. Implemented A/B testing framework and optimized conversion funnels, improving signup rates by 150%.
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Key Projects</h2>
                <div class="project-item">
                    <div class="project-title">AI-Powered Analytics Dashboard</div>
                    <div class="tech-stack">React, Python, TensorFlow, AWS</div>
                    <div class="date">2023</div>
                    <div class="description">
                        Led cross-functional team to build machine learning dashboard that increased user engagement by 200%. Managed $500K budget and delivered 2 weeks ahead of schedule.
                    </div>
                </div>
                <div class="project-item">
                    <div class="project-title">Mobile-First Redesign</div>
                    <div class="tech-stack">React Native, Node.js, MongoDB</div>
                    <div class="date">2022</div>
                    <div class="description">
                        Orchestrated complete mobile experience overhaul resulting in 4.8-star app store rating and 80% increase in mobile conversions.
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Skills & Expertise</h2>
                <div class="skills-container">
                    <div class="skill-category">
                        <h4>Product Strategy</h4>
                        <div class="skill-tags">
                            <span class="skill-tag">Product Roadmaps</span>
                            <span class="skill-tag">User Research</span>
                            <span class="skill-tag">Market Analysis</span>
                            <span class="skill-tag">Competitive Intelligence</span>
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Growth & Analytics</h4>
                        <div class="skill-tags">
                            <span class="skill-tag">A/B Testing</span>
                            <span class="skill-tag">Growth Hacking</span>
                            <span class="skill-tag">Conversion Optimization</span>
                            <span class="skill-tag">Data Analysis</span>
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Technical</h4>
                        <div class="skill-tags">
                            <span class="skill-tag">SQL</span>
                            <span class="skill-tag">Python</span>
                            <span class="skill-tag">Figma</span>
                            <span class="skill-tag">APIs</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Notable Achievements</h2>
                <div class="achievements">
                    <h4>Impact & Recognition</h4>
                    <ul class="achievement-list">
                        <li>Increased company valuation by $50M through successful product launches</li>
                        <li>Featured in TechCrunch for innovative growth strategies</li>
                        <li>Led team that won "Best Product Innovation" at StartupCon 2023</li>
                        <li>Mentored 15+ junior product managers and growth specialists</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">Education</h2>
                <div class="education-item">
                    <div class="job-title">Bachelor of Science in Business Administration</div>
                    <div class="company">Stanford University</div>
                    <div class="date">2016 - 2020</div>
                    <div class="description">Concentration in Entrepreneurship & Innovation</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`,
  },
];

export const colorSchemes: ColorScheme[] = [
  {
    id: "professional-blue",
    name: "Professional Blue",
    primary: "#2563eb",
    secondary: "#64748b",
    accent: "#0ea5e9",
    text: "#1e293b",
  },
  {
    id: "elegant-gray",
    name: "Elegant Gray",
    primary: "#374151",
    secondary: "#6b7280",
    accent: "#9ca3af",
    text: "#111827",
  },
  {
    id: "modern-teal",
    name: "Modern Teal",
    primary: "#0d9488",
    secondary: "#64748b",
    accent: "#14b8a6",
    text: "#1f2937",
  },
  {
    id: "creative-purple",
    name: "Creative Purple",
    primary: "#7c3aed",
    secondary: "#64748b",
    accent: "#a855f7",
    text: "#1e293b",
  },
  {
    id: "warm-orange",
    name: "Warm Orange",
    primary: "#ea580c",
    secondary: "#64748b",
    accent: "#f97316",
    text: "#1f2937",
  },
  {
    id: "classic-black",
    name: "Classic Black",
    primary: "#000000",
    secondary: "#4b5563",
    accent: "#374151",
    text: "#111827",
  },
];
