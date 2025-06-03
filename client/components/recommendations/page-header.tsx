"use client";

import { Button } from "@/components/ui/button";
import { Brain, RefreshCw, FileText, Sparkles } from "lucide-react";
import type { RecommendationData } from "@/store/profile-store";

interface PageHeaderProps {
  recommendation: RecommendationData | null;
  currentDocument: string | null | undefined;
  onRefresh: () => void;
  onChangeDocument: () => void;
  isLoading: boolean;
  canRefresh: boolean;
}

export function PageHeader({
  recommendation,
  currentDocument,
  onRefresh,
  onChangeDocument,
  isLoading,
  canRefresh,
}: PageHeaderProps) {
  return (
    <div className="border-b bg-gradient-to-r from-background via-background to-primary/5">
      <div className="px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Section - Brand & Info */}
          <div className="flex items-start gap-4">
            {/* Title & Meta Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="flex gap-2 text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Career Intelligence Hub
                  <div className="relative items-baseline justify-center">
                    <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <Brain className="h-4 w-4 text-primary-foreground" />
                    </div>
                    {recommendation && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                        <Sparkles className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>
                </h1>

                {isLoading && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span className="hidden sm:inline">Analyzing...</span>
                  </div>
                )}
              </div>

              {/* Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                <p className="text-muted-foreground text-sm lg:text-base">
                  AI-powered career recommendations
                </p>
              </div>

              {/* Document & Industry Info */}
              {(currentDocument || recommendation?.industry) && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-3 text-sm">
                    {currentDocument && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Document:
                        </span>
                        <span className="ml-1 font-medium">
                          {currentDocument}
                        </span>
                      </div>
                    )}
                    {currentDocument && recommendation?.industry && (
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    )}
                    {recommendation?.industry && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Industry:
                        </span>
                        <span className="ml-1 font-medium text-primary">
                          {recommendation.industry}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onChangeDocument}
              className=" hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Change Document</span>
              <span className="sm:hidden">Change</span>
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        {recommendation && (
          <div className="mt-4 pt-4 border-t border-muted/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Recommendations Active
                </span>
                {recommendation.confidence && (
                  <>
                    <span>Confidence Level:</span>
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">
                        {recommendation.confidence.toUpperCase()}
                      </span>
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>AI Powered</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
