// "use client";

// import { useState, useEffect } from "react";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
// import { Download, Edit, Save } from "lucide-react";
// import RichTextEditor from "@/components/chats/rich-text-editor";

// // Convert markdown-like content to HTML for the rich text editor
// function convertToHtml(markdownContent: string): string {
//   let html = markdownContent
//     // Convert headings
//     .replace(/^# (.*$)/gm, "<h1>$1</h1>")
//     .replace(/^## (.*$)/gm, "<h2>$1</h2>")
//     .replace(/^### (.*$)/gm, "<h3>$1</h3>")
//     // Convert bold
//     .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
//     // Convert italic
//     .replace(/\*(.*?)\*/g, "<em>$1</em>")
//     // Convert bullet lists
//     .replace(/^- (.*$)/gm, "<li>$1</li>");

//   // Wrap lists in <ul> tags
//   const listItems = html.match(/<li>.*?<\/li>/g);
//   if (listItems) {
//     listItems.forEach((item) => {
//       html = html.replace(item, `<ul>${item}</ul>`);
//     });
//   }

//   // Convert line breaks to paragraphs
//   html = html
//     .split("\n\n")
//     .map((para) => {
//       if (!para.trim()) return "";
//       if (
//         para.includes("<h1>") ||
//         para.includes("<h2>") ||
//         para.includes("<h3>") ||
//         para.includes("<ul>") ||
//         para.includes("<ol>")
//       ) {
//         return para;
//       }
//       return `<p>${para}</p>`;
//     })
//     .join("");

//   return html;
// }

// // This is a placeholder for your actual resume content
// const initialResumeContent = `
// # John Doe
// ## Software Engineer

// **Contact Information**
// - Email: john.doe@example.com
// - Phone: (123) 456-7890
// - LinkedIn: linkedin.com/in/johndoe

// **Skills**
// - JavaScript, TypeScript, React, Next.js
// - Node.js, Express
// - HTML, CSS, Tailwind CSS
// - Git, GitHub
// - AWS, Vercel

// **Experience**
// ### Senior Software Engineer | Tech Company Inc.
// *January 2020 - Present*
// - Developed and maintained multiple web applications using React and Next.js
// - Implemented responsive designs and improved performance by 40%
// - Collaborated with cross-functional teams to deliver features on time

// ### Software Developer | Digital Solutions LLC
// *June 2017 - December 2019*
// - Built RESTful APIs using Node.js and Express
// - Created front-end interfaces with React
// - Participated in code reviews and mentored junior developers

// **Education**
// ### Bachelor of Science in Computer Science
// *University of Technology | 2013 - 2017*
// - GPA: 3.8/4.0
// - Relevant coursework: Data Structures, Algorithms, Web Development
// `;

// export default function ResumeViewer() {
//   const [loading, setLoading] = useState(true);
//   const [resumeContent, setResumeContent] = useState("");
//   const [htmlContent, setHtmlContent] = useState("");
//   const [isEditing, setIsEditing] = useState(false);

//   useEffect(() => {
//     // Simulate loading the resume content
//     const timer = setTimeout(() => {
//       const html = convertToHtml(initialResumeContent);
//       setHtmlContent(html);
//       setResumeContent(initialResumeContent);
//       setLoading(false);
//     }, 1000);

//     return () => clearTimeout(timer);
//   }, []);

//   const handleEditorChange = (newContent: string) => {
//     setHtmlContent(newContent);
//   };

//   const handleSave = () => {
//     // In a real app, you would convert HTML back to markdown or store as HTML
//     setIsEditing(false);
//   };

//   const handleDownload = () => {
//     // For simplicity, we'll download the original markdown content
//     // In a real app, you might want to convert the HTML back to markdown or text
//     const blob = new Blob([resumeContent], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "resume.txt";
//     document.body.appendChild(a);
//     a.click();

//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   const handleDownloadPDF = () => {
//     // In a real application, you would use a library like jsPDF or
//     // a server-side solution to generate a PDF
//     alert(
//       "In a production app, this would generate a PDF using a library like jsPDF or a server-side solution."
//     );

//     // For demonstration purposes, we'll just download as text
//     handleDownload();
//   };

//   if (loading) {
//     return (
//       <div className="space-y-4">
//         <Skeleton className="h-8 w-3/4" />
//         <Skeleton className="h-6 w-1/2" />
//         <Skeleton className="h-32 w-full" />
//         <Skeleton className="h-24 w-full" />
//         <Skeleton className="h-24 w-full" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
//         <div className="flex items-center space-x-2">
//           <Switch
//             id="edit-mode"
//             checked={isEditing}
//             onCheckedChange={setIsEditing}
//           />
//           <Label htmlFor="edit-mode" className="flex items-center">
//             <Edit className="h-4 w-4 mr-1" />
//             <span>Edit Mode</span>
//           </Label>
//         </div>

//         <div className="flex space-x-2">
//           <Button variant="outline" size="sm" onClick={handleDownload}>
//             <Download className="h-4 w-4 mr-1" />
//             <span>Download .txt</span>
//           </Button>
//           <Button variant="default" size="sm" onClick={handleDownloadPDF}>
//             <Download className="h-4 w-4 mr-1" />
//             <span>Download PDF</span>
//           </Button>
//         </div>
//       </div>

//       {isEditing ? (
//         <div className="space-y-2">
//           <RichTextEditor content={htmlContent} onChange={handleEditorChange} />
//           <div className="flex justify-end">
//             <Button onClick={handleSave} className="mt-2">
//               <Save className="h-4 w-4 mr-1" />
//               <span>Save Changes</span>
//             </Button>
//           </div>
//         </div>
//       ) : (
//         <div
//           className="prose max-w-none dark:prose-invert"
//           dangerouslySetInnerHTML={{ __html: htmlContent }}
//         />
//       )}
//     </div>
//   );
// }
