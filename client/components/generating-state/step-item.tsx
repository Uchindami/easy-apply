import { motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepStatus } from "./types";

interface StepItemProps {
	label: string;
	status: StepStatus;
	isLast?: boolean;
	className?: string;
}

export const StepItem = ({
	label,
	status,
	isLast,
	className,
}: StepItemProps) => {
	const getStatusIcon = (status: StepStatus) => {
		switch (status) {
			case "complete":
				return (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 500, damping: 30 }}
						className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center"
					>
						<Check className="h-4 w-4 text-green-500" aria-hidden="true" />
					</motion.div>
				);
			case "active":
				return (
					<div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
						<Loader2 className="h-4 w-4 text-primary animate-spin" />
					</div>
				);
			case "failed":
				return (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 500, damping: 30 }}
						className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center"
					>
						<X className="h-4 w-4 text-red-500" aria-hidden="true" />
					</motion.div>
				);
			default:
				return (
					<div className="h-6 w-6 rounded-full border-2 border-muted bg-background" />
				);
		}
	};

	const getTextColor = (status: StepStatus) => {
		switch (status) {
			case "complete":
				return "text-green-600";
			case "active":
				return "text-foreground";
			case "failed":
				return "text-red-600";
			default:
				return "text-muted-foreground";
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3 }}
			className={cn(
				"flex items-center space-x-4 p-3 rounded-md transition-all duration-200 relative",
				status === "active" && "bg-primary/5 border border-primary/20",
				className,
			)}
		>
			<div className="flex-shrink-0">{getStatusIcon(status)}</div>

			<div className="flex-1 min-w-0">
				<span className={cn("text-sm font-medium block", getTextColor(status))}>
					{label}
				</span>
			</div>

			{/* Progress line */}
			{!isLast && (
				<div className="absolute left-[23px] top-[60px] w-0.5 h-4 bg-border" />
			)}
		</motion.div>
	);
};
