import { Loader2, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

type Step = {
  key: string;
  label: string;
  status: "pending" | "active" | "complete" | "failed";
};

type ProgressUpdate = {
  step: string;
  status: "pending" | "active" | "complete" | "failed";
  message?: string;
};

const initialSteps: Step[] = [
  { key: "upload", label: "Uploading and validating file", status: "pending" },
  {
    key: "processing",
    label: "Extracting resume & job details",
    status: "pending",
  },
  { key: "analysis", label: "Tailoring documents with AI", status: "pending" },
  { key: "finalizing", label: "Finalizing and saving", status: "pending" },
];

// Helper function to get API URL safely
const getApiUrl = (): string => {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    // Try to get from window object first (if set by your app)
    if ((window as any).API_URL) {
      return (window as any).API_URL;
    }

    // For client-side, you can also check if Next.js has injected the env var
    if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
  }

  // Server-side or fallback
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Default fallback
  return "http://localhost:8080";
};

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
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [currentMessage, setCurrentMessage] = useState(description);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Reset state when channelId changes
  useEffect(() => {
    setSteps(initialSteps);
    setCurrentMessage(description);
    setConnectionStatus("connecting");
    reconnectAttemptsRef.current = 0;
  }, [channelId, description]);

  // Cleanup function
  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Connect to SSE
  const connectSSE = () => {
    if (!channelId) return;

    cleanup(); // Clean up any existing connections

    const apiUrl = getApiUrl();
    const eventSource = new EventSource(`${apiUrl}/events/${channelId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE connection established");
      setConnectionStatus("connected");
      reconnectAttemptsRef.current = 0;

      // Activate first step when connected
      setSteps((current) => {
        const newSteps = [...current];
        if (newSteps[0].status === "pending") {
          newSteps[0].status = "active";
        }
        return newSteps;
      });
    };

    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data) as ProgressUpdate;

        // Skip heartbeat and connection messages
        if (update.step === "heartbeat" || update.step === "connection") {
          return;
        }

        console.log("SSE message received:", update);

        // Update the dynamic message
        if (update.message) {
          setCurrentMessage(update.message);
        }

        // Update step status
        setSteps((currentSteps) => {
          const newSteps = [...currentSteps];
          const stepIndex = newSteps.findIndex((s) => s.key === update.step);

          if (stepIndex !== -1) {
            newSteps[stepIndex].status = update.status;

            // Auto-advance to next step when current step completes
            if (
              update.status === "complete" &&
              stepIndex < newSteps.length - 1
            ) {
              const nextStep = newSteps[stepIndex + 1];
              if (nextStep.status === "pending") {
                nextStep.status = "active";
              }
            }
          }

          return newSteps;
        });
      } catch (error) {
        console.error("Failed to parse SSE message:", event.data, error);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err);
      setConnectionStatus("error");

      // Attempt to reconnect with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          30000
        );
        console.log(
          `Attempting to reconnect in ${delay}ms (attempt ${
            reconnectAttemptsRef.current + 1
          }/${maxReconnectAttempts})`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connectSSE();
        }, delay);
      } else {
        console.error("Max reconnection attempts reached");
        setCurrentMessage(
          "Connection lost. Please refresh the page to try again."
        );
      }
    };
  };

  // Main effect to establish SSE connection
  useEffect(() => {
    if (channelId) {
      connectSSE();
    }

    return cleanup;
  }, [channelId]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

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

        {/* Connection status indicator */}
        <div className="mb-6">
          <div
            className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
              connectionStatus === "connected" && "bg-green-100 text-green-800",
              connectionStatus === "connecting" &&
                "bg-yellow-100 text-yellow-800",
              connectionStatus === "error" && "bg-red-100 text-red-800"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full mr-2",
                connectionStatus === "connected" && "bg-green-600",
                connectionStatus === "connecting" &&
                  "bg-yellow-600 animate-pulse",
                connectionStatus === "error" && "bg-red-600"
              )}
            />
            {connectionStatus === "connected" && "Connected"}
            {connectionStatus === "connecting" && "Connecting..."}
            {connectionStatus === "error" && "Connection Error"}
          </div>
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

function StepItem({
  label,
  status,
  isLast,
  className,
}: {
  label: string;
  status: Step["status"];
  isLast?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-center space-x-4 p-3 rounded-md transition-all duration-200",
        status === "active" && "bg-primary/5 border border-primary/20",
        className
      )}
    >
      <div className="flex-shrink-0">
        {status === "complete" ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
          </motion.div>
        ) : status === "active" ? (
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          </div>
        ) : status === "failed" ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center"
          >
            <X className="h-4 w-4 text-red-500" aria-hidden="true" />
          </motion.div>
        ) : (
          <div className="h-6 w-6 rounded-full border-2 border-muted bg-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-sm font-medium block",
            status === "complete" && "text-green-600",
            status === "active" && "text-foreground",
            status === "pending" && "text-muted-foreground",
            status === "failed" && "text-red-600"
          )}
        >
          {label}
        </span>
      </div>

      {/* Progress line */}
      {!isLast && (
        <div className="absolute left-[23px] top-[60px] w-0.5 h-4 bg-border" />
      )}
    </motion.div>
  );
}
