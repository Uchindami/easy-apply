package constants

const OpenRouterInstrunctions = `Extract key information from the provided job description and return a well-structured JSON with the following fields:

1. "jobTitle": The exact title of the position
2. "organization": Full name of the hiring organization  
3. "location": Where the job is based (city/country)
4. "grade": Job grade/level if mentioned
5. "reportingTo": Direct supervisor role
6. "responsibleFor": Subordinate roles if any
7. "department": Department or section name
8. "purpose": A concise summary of the job purpose
9. "keyResponsibilities": An array of the main job responsibilities
10. "requiredQualifications": An array of required educational qualifications
11. "requiredExperience": Years and type of experience needed
12. "requiredMemberships": Any professional memberships required
13. "applicationDeadline": Last date to apply
14. "contactDetails": Application submission information
15. "additionalNotes": Any special notes about the application process
16. "tags": An array of tags that provide additional context about the job (e.g. ["internship", "remote", "health", "construction"])
17. "industry": The primary industry category from the provided taxonomy (e.g. "Information & Communications Technology (ICT)", "Healthcare & Life Sciences", etc.)
18. "domain": The specific domain or subcategory within the industry (e.g. "Cybersecurity", "Financial Analysis", etc.)

For any field where information is not available in the job description, use "N/A" as the value to maintain consistency. Analyze the complete job description, paying special attention to formatting and section headers. For the "industry" and "domain" fields, carefully match the job responsibilities and requirements to the provided taxonomy categories. Use your best judgment to identify relevant tags for the "tags" field based on job location, work arrangement, industry focus, and other key characteristics. Return only the structured JSON output without explanations. Ensure all information is extracted accurately and completely.

{
  "Information & Communications Technology (ICT)": {
    "Software Development": [
      "programming", "JavaScript", "Python", "REST API", "CI/CD", "Git", "agile",
      "full-stack", "DevOps", "microservices", "API integration", "containerization"
    ],
    "Data Science & Analytics": [
      "machine learning", "data modelling", "SQL", "TensorFlow", "ETL", "Power BI",
      "statistics", "big data", "predictive analytics", "data mining", "Tableau"
    ],
    "Network & Infrastructure": [
      "LAN/WAN", "firewall", "Cisco", "VPN", "Linux", "server", "virtualization",
      "cloud migration", "AWS", "Azure", "load balancing", "DNS management"
    ],
    "Cybersecurity": [
      "pen testing", "SIEM", "ISO 27001", "vulnerability assessment", "encryption",
      "incident response", "SOC", "NIST", "GDPR compliance", "threat intelligence"
    ],
    "UX/UI & Design": [
      "wireframes", "Figma", "user research", "prototyping", "Adobe XD",
      "accessibility", "interaction design", "design systems", "user testing"
    ]
  },
  "Construction & Engineering": {
    "Civil Engineering": [
      "site survey", "structural design", "AutoCAD", "soil testing", "project management",
      "road construction", "water systems", "geotechnical", "BIM", "ASCE standards"
    ],
    "Mechanical Engineering": [
      "CAD", "solid mechanics", "HVAC", "CFD", "manufacturing",
      "thermal analysis", "mechatronics", "FEA", "prototyping", "GD&T"
    ],
    "Electrical Engineering": [
      "PLC", "circuit design", "SCADA", "power systems", "PCB",
      "renewable energy", "smart grid", "IoT devices", "embedded systems"
    ],
    "Architectural Design": [
      "Revit", "building codes", "3D modelling", "rendering", "landscape design",
      "sustainable design", "LEED certification", "urban planning", "BIM coordination"
    ],
    "Project & Site Management": [
      "SOP", "cost estimation", "safety compliance", "Gantt", "budget control",
      "stakeholder management", "risk assessment", "procurement", "quality assurance"
    ]
  },
  "Healthcare & Life Sciences": {
    "Clinical Care": [
      "patient assessment", "nursing", "EMR", "vital signs", "medication administration",
      "critical care", "patient advocacy", "telemedicine", "clinical protocols"
    ],
    "Medical Laboratory": [
      "PCR", "blood analysis", "microscopy", "quality control", "CLIA",
      "histopathology", "mass spectrometry", "flow cytometry", "CLSI guidelines"
    ],
    "Pharmaceuticals & R&D": [
      "formulation", "GMP", "clinical trials", "regulatory affairs", "HPLC",
      "drug discovery", "ICH guidelines", "bioavailability", "pharmacovigilance"
    ],
    "Public Health & Epidemiology": [
      "health surveys", "disease surveillance", "biostatistics", "health policy",
      "contact tracing", "vaccination programs", "health promotion", "outbreak investigation"
    ],
    "Health IT & Informatics": [
      "HL7", "EHR integration", "FHIR", "data interoperability",
      "clinical decision support", "digital health", "telehealth platforms"
    ]
  },
  "Finance & Accounting": {
    "Financial Analysis": [
      "forecasting", "variance analysis", "Excel modelling", "financial statements",
      "valuation", "KPI tracking", "business intelligence", "ROI analysis"
    ],
    "Accounting": [
      "GAAP", "reconciliation", "ledger", "accounts payable", "audit",
      "IFRS", "financial reporting", "tax preparation", "SOX compliance"
    ],
    "Investment & Asset Management": [
      "portfolio", "equities", "risk modelling", "CFA", "fund performance",
      "asset allocation", "derivatives", "wealth management", "ESG investing"
    ],
    "Banking & Lending": [
      "credit analysis", "loan origination", "KYC", "AML", "mortgage",
      "trade finance", "corporate banking", "credit risk", "loan servicing"
    ],
    "Tax & Compliance": [
      "tax planning", "VAT", "transfer pricing", "regulatory reporting",
      "tax audits", "BEPS", "tax treaties", "compliance frameworks"
    ]
  },
  "Education & Training": {
    "K-12 Teaching": [
      "curriculum", "lesson planning", "classroom management", "pedagogy",
      "differentiated instruction", "STEM education", "special needs", "IB curriculum"
    ],
    "Higher Education & Research": [
      "grant writing", "peer review", "syllabus development", "tenure track",
      "academic publishing", "research methodology", "dissertation supervision"
    ],
    "Corporate Training & L&D": [
      "workshops", "e-learning", "instructional design", "LMS", "facilitation",
      "leadership development", "competency mapping", "needs assessment"
    ],
    "Educational Technology": [
      "Moodle", "Blackboard", "SCORM", "learning analytics",
      "adaptive learning", "gamification", "LTI integration", "MOOC development"
    ]
  },
  "Sales, Marketing & Communications": {
    "Digital Marketing": [
      "SEO", "SEM", "Google Analytics", "content strategy", "PPC",
      "social media ads", "conversion optimization", "marketing automation"
    ],
    "Brand & Product Marketing": [
      "brand positioning", "go-to-market", "campaign management", "A/B testing",
      "product launches", "competitive analysis", "customer segmentation"
    ],
    "Sales & Business Development": [
      "lead generation", "CRM", "account executive", "quota", "cold calling",
      "sales pipeline", "contract negotiation", "channel management"
    ],
    "Public Relations & Corporate Communications": [
      "press releases", "media relations", "crisis communications", "stakeholder engagement",
      "reputation management", "internal communications", "CSR initiatives"
    ],
    "Content & Social Media": [
      "copywriting", "editorial calendar", "social strategy", "influencer outreach",
      "content marketing", "community management", "brand voice", "SEO writing"
    ]
  },
  "Manufacturing & Operations": {
    "Production & Assembly": [
      "lean manufacturing", "Six Sigma", "quality assurance", "Kaizen", "SOP",
      "production scheduling", "assembly line", "OEE improvement", "5S methodology"
    ],
    "Supply Chain & Logistics": [
      "inventory management", "ERP", "warehouse", "freight", "demand planning",
      "logistics optimization", "vendor management", "JIT delivery", "customs clearance"
    ],
    "Quality Control & Assurance": [
      "ISO 9001", "auditing", "fail-safe", "inspection protocols",
      "statistical process control", "calibration", "non-conformance", "CAPA"
    ],
    "Maintenance & Reliability": [
      "preventive maintenance", "CMMS", "root cause analysis", "downtime",
      "predictive maintenance", "reliability engineering", "equipment lifecycle"
    ]
  },
  "Agriculture & Environmental": {
    "Crop Production & Agronomy": [
      "soil fertility", "pesticide application", "irrigation", "yield analysis",
      "precision agriculture", "crop rotation", "hydroponics", "IPM strategies"
    ],
    "Animal Husbandry & Veterinary": [
      "livestock management", "vaccination", "breeding", "animal welfare",
      "feed formulation", "veterinary surgery", "dairy management", "poultry science"
    ],
    "Environmental Science & Conservation": [
      "biodiversity", "impact assessment", "GIS", "ecosystem management",
      "carbon footprint", "waste management", "environmental auditing", "sustainability"
    ],
    "Agri-Tech & Research": [
      "drone monitoring", "precision farming", "remote sensing", "data fusion",
      "smart irrigation", "bioinformatics", "gene editing", "soil sensors"
    ]
  },
  "Legal & Compliance": {
    "Corporate Law": [
      "M&A", "contract drafting", "compliance", "intellectual property",
      "corporate governance", "regulatory filings", "shareholder agreements"
    ],
    "Litigation & Dispute Resolution": [
      "civil litigation", "arbitration", "legal research", "discovery",
      "settlement negotiations", "trial preparation", "evidence management"
    ],
    "Employment Law": [
      "labor relations", "workplace safety", "EEOC compliance", "employee contracts",
      "discrimination claims", "wage/hour laws", "HR policy development"
    ],
    "International Law": [
      "trade agreements", "sanctions compliance", "cross-border transactions",
      "treaty interpretation", "export controls", "diplomatic immunity"
    ]
  },
  "Creative Arts & Media": {
    "Graphic Design": [
      "Adobe Creative Suite", "brand identity", "print design", "typography",
      "packaging design", "visual storytelling", "motion graphics"
    ],
    "Audio/Video Production": [
      "video editing", "sound mixing", "storyboarding", "color grading",
      "post-production", "broadcast engineering", "live streaming"
    ],
    "Journalism & Publishing": [
      "investigative reporting", "copy editing", "fact-checking", "AP style",
      "content curation", "multimedia journalism", "book publishing"
    ],
    "Performing Arts": [
      "stage management", "choreography", "script writing", "talent coordination",
      "arts administration", "cultural programming", "event production"
    ]
  }
}`