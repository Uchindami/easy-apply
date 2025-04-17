"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ResumeViewer from "@/components/chats/resume-viewer";
import CoverLetterViewer from "@/components/chats/cover-letter-viewer";
import HtmlRenderer from "@/components/chats/html-renderer";
import { Header } from "@/components/Header";

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState("resume");

  return (
    <div className="container mx-auto py-10 px-4">
      <Header title={`render count ${console.count}`} />
      <Tabs
        defaultValue="resume"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
          <TabsTrigger value="html-page">HTML Page</TabsTrigger>
        </TabsList>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              {activeTab === "resume" && "My Resume"}
              {activeTab === "cover-letter" && "Cover Letter"}
              {activeTab === "html-page" && "HTML Page"}
            </CardTitle>
            <CardDescription>
              {activeTab === "resume" && "Professional experience and skills"}
              {activeTab === "cover-letter" &&
                "Introduction and qualifications"}
              {activeTab === "html-page" && "Custom HTML content"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TabsContent value="resume" className="mt-0">
              <ResumeViewer />
            </TabsContent>

            <TabsContent value="cover-letter" className="mt-0">
              <CoverLetterViewer />
            </TabsContent>

            <TabsContent value="html-page" className="mt-0">
              <HtmlRenderer />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
