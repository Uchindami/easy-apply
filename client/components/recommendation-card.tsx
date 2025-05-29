import { TrendingUp, Target, Brain, Briefcase, Code, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Recommendation {
  confidence?: string;
  industry?: string;
  domain?: string;
  reasoning?: string;
}

interface RecommendationCardProps {
  recommendation?: Recommendation;
}

export function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  // Return null if no recommendation provided
  if (!recommendation) {
    return null;
  }

  const getConfidenceConfig = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case "high":
        return {
          color:
            "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
          icon: <TrendingUp className="h-3 w-3" />,
          dotColor: "bg-emerald-500 dark:bg-emerald-400",
        };
      case "medium":
        return {
          color:
            "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
          icon: <Target className="h-3 w-3" />,
          dotColor: "bg-amber-500 dark:bg-amber-400",
        };
      default:
        return {
          color:
            "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
          icon: <Brain className="h-3 w-3" />,
          dotColor: "bg-blue-500 dark:bg-blue-400",
        };
    }
  };

  const config = getConfidenceConfig(recommendation.confidence || "medium");

  return (
    <Card className="bg-background/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-6 hover:shadow-lg dark:hover:shadow-gray-900/25 transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Star className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Career Match
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI-powered recommendation
            </p>
          </div>
        </div>

        <Badge className={`${config.color} border px-3 py-1 font-medium`}>
          <div className="flex items-center gap-2">
            {config.icon}
            {recommendation.confidence || "Medium"}
          </div>
        </Badge>
      </div>

      {/* Industry and Domain */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Industry
            </span>
          </div>
          <p className="text-gray-900 dark:text-gray-100 font-medium pl-6">
            {recommendation.industry || "Not specified"}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Domain
            </span>
          </div>
          <p className="text-gray-900 dark:text-gray-100 font-medium pl-6">
            {recommendation.domain || "Not specified"}
          </p>
        </div>
      </div>

      {/* Analysis */}
      {recommendation.reasoning && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${config.dotColor}`}></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Analysis
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed pl-4">
            {recommendation.reasoning}
          </p>
        </div>
      )}
    </Card>
  );
}
