import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useSSEConnection } from "@/hooks/use-sse-connection";
import { ConnectionStatusIndicator } from "./connection-status";
import { StepItem } from "./step-item";

interface GeneratingStateProps {
  title?: string;
  description?: string;
  className?: string;
  channelId?: string | null;
}

export function GeneratingState({
  title = "Generating Your Documents",
  description = "We're analyzing the job posting and tailoring your resume and cover letter to maximize your chances of success...",
  className,
  channelId,
}: GeneratingStateProps) {
  const { steps, currentMessage, connectionStatus } = useSSEConnection({
    channelId,
    description,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "p-8 md:p-12 bg-card rounded-lg shadow-md border border-border",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          {connectionStatus === "error" && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>

        <h3 className="text-2xl font-semibold mb-2">{title}</h3>

        <div className="min-h-[60px] flex items-center justify-center mb-4">
          <p className="text-muted-foreground max-w-md">{currentMessage}</p>
        </div>

        <div className="mb-6">
          <ConnectionStatusIndicator status={connectionStatus} />
        </div>

        <div className="w-full max-w-md">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <StepItem
                key={step.key}
                label={step.label}
                status={step.status}
                isLast={index === steps.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
