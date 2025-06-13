import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Step = {
  label: string;
  status: "pending" | "active" | "complete";
};

interface StepItemProps {
  label: string;
  status: "pending" | "active" | "complete";
  className?: string;
}

interface GeneratingStateProps {
  title?: string;
  description?: string;
  steps?: Step[];
  duration?: number;
  className?: string;
}

export function GeneratingState({
  title = "Generating Your Documents",
  description = "We're analyzing the job posting and tailoring your resume and cover letter to maximize your chances of success. This typically takes 45-60 seconds...",
  steps = [
    { label: "Analyzing resume content", status: "complete" },
    { label: "Extracting job requirements", status: "complete" },
    { label: "Tailoring resume content", status: "active" },
    { label: "Creating cover letter", status: "pending" },
    { label: "Finalizing documents", status: "pending" },
  ],
  duration = 45,
  className,
}: GeneratingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "p-8 md:p-12 bg-card rounded-lg shadow-md border border-border",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-primary" />
          </div>
        </div>

        <h3 className="text-2xl font-semibold mt-6 mb-2">{title}</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {description}
        </p>

        <div className="w-full max-w-md mt-8">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration, ease: "linear" }}
            />
          </div>

          <div className="mt-8 space-y-2">
            {steps.map((step, index) => (
              <StepItem key={index} label={step.label} status={step.status} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function StepItem({ label, status, className }: StepItemProps) {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {status === "complete" ? (
        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
          <Check className="h-3 w-3 text-primary" aria-hidden="true" />
          <span className="sr-only">Step complete</span>
        </div>
      ) : status === "active" ? (
        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      ) : (
        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center" />
      )}
      <span
        className={cn(
          "text-sm",
          status === "complete"
            ? "text-primary"
            : status === "active"
            ? "text-foreground"
            : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}
