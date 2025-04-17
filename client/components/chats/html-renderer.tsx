"use client";

import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// This is a placeholder for your actual HTML content
const sampleHtmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Portfolio</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    header {
      background-color: #4a5568;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    h1 {
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .project {
      border: 1px solid #ddd;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 5px;
    }
    .project h3 {
      margin-top: 0;
      color: #4a5568;
    }
    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
    }
    .skill {
      background-color: #e2e8f0;
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 14px;
    }
    footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>John Doe - Web Developer</h1>
      <p>Building modern web experiences</p>
    </header>
    
    <section>
      <h2>My Projects</h2>
      
      <div class="project">
        <h3>E-commerce Platform</h3>
        <p>A full-featured online store built with React and Node.js. Includes user authentication, product catalog, shopping cart, and payment processing.</p>
      </div>
      
      <div class="project">
        <h3>Task Management App</h3>
        <p>A productivity application that helps users organize their tasks and projects. Built with Next.js and Firebase.</p>
      </div>
      
      <div class="project">
        <h3>Weather Dashboard</h3>
        <p>A responsive weather application that displays current conditions and forecasts based on user location. Uses OpenWeatherMap API.</p>
      </div>
    </section>
    
    <section>
      <h2>Skills</h2>
      <div class="skills">
        <span class="skill">HTML5</span>
        <span class="skill">CSS3</span>
        <span class="skill">JavaScript</span>
        <span class="skill">TypeScript</span>
        <span class="skill">React</span>
        <span class="skill">Next.js</span>
        <span class="skill">Node.js</span>
        <span class="skill">Express</span>
        <span class="skill">MongoDB</span>
        <span class="skill">Git</span>
      </div>
    </section>
    
    <footer>
      <p>&copy; 2025 John Doe. All rights reserved.</p>
    </footer>
  </div>
</body>
</html>
`;

export default function HtmlRenderer() {
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState(sampleHtmlContent);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Simulate loading the HTML content
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (iframeDocument) {
        iframeDocument.open();
        iframeDocument.write(htmlContent);
        iframeDocument.close();
      }
    }
  }, [loading, htmlContent]);

  const refreshIframe = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (iframeDocument) {
        iframeDocument.open();
        iframeDocument.write(htmlContent);
        iframeDocument.close();
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-1/4" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">HTML Preview</h3>
        <Button variant="outline" size="sm" onClick={refreshIframe}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          className="w-full h-[500px]"
          title="HTML Content"
          sandbox="allow-same-origin"
        />
      </div>

      <div className="text-sm text-muted-foreground">
        Note: This is a preview of the HTML content. Some interactive features
        may be limited.
      </div>
    </div>
  );
}
