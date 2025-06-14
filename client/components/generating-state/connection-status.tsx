import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "./types";

interface ConnectionStatusProps {
	status: ConnectionStatus;
}

export const ConnectionStatusIndicator = ({
	status,
}: ConnectionStatusProps) => {
	const getStatusConfig = (status: ConnectionStatus) => {
		switch (status) {
			case "connected":
				return {
					containerClass: "bg-green-100 text-green-800",
					dotClass: "bg-green-600",
					label: "Connected",
				};
			case "connecting":
				return {
					containerClass: "bg-yellow-100 text-yellow-800",
					dotClass: "bg-yellow-600 animate-pulse",
					label: "Connecting...",
				};
			case "error":
				return {
					containerClass: "bg-red-100 text-red-800",
					dotClass: "bg-red-600",
					label: "Connection Error",
				};
		}
	};

	const config = getStatusConfig(status);

	return (
		<div
			className={cn(
				"inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
				config.containerClass,
			)}
		>
			<div className={cn("w-2 h-2 rounded-full mr-2", config.dotClass)} />
			{config.label}
		</div>
	);
};
