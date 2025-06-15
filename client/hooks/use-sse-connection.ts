import { useEffect, useRef, useState, useCallback } from "react";
import type {
	ConnectionStatus,
	ProgressUpdate,
	Step,
} from "@/components/generating-state/types";
import {
	INITIAL_STEPS,
	MAX_RECONNECT_ATTEMPTS,
} from "@/components/generating-state/constants";

interface UseSSEConnectionProps {
	channelId?: string | null;
	description: string;
}

const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;


export const calculateReconnectDelay = (attempt: number): number => {
	return Math.min(BASE_RECONNECT_DELAY * 2 ** attempt, MAX_RECONNECT_DELAY);
};

export const useSSEConnection = ({
	channelId,
	description,
}: UseSSEConnectionProps) => {
	const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
	const [currentMessage, setCurrentMessage] = useState(description);
	const [connectionStatus, setConnectionStatus] =
		useState<ConnectionStatus>("connecting");

	const eventSourceRef = useRef<EventSource | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef(0);

	// Reset state when channelId changes
	useEffect(() => {
		setSteps(INITIAL_STEPS);
		setCurrentMessage(description);
		setConnectionStatus("connecting");
		reconnectAttemptsRef.current = 0;
	}, [channelId, description]);

	const cleanup = useCallback(() => {
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}
	}, []);

	const updateSteps = useCallback((update: ProgressUpdate) => {
		setSteps((currentSteps) => {
			const newSteps = [...currentSteps];
			const stepIndex = newSteps.findIndex((s) => s.key === update.step);

			// Find the step from the backend message and update its status.
			if (stepIndex !== -1) {
				newSteps[stepIndex].status = update.status;
			}

			return newSteps;
		});
	}, []);

	const handleMessage = useCallback(
		(event: MessageEvent) => {
			try {
				const update = JSON.parse(event.data) as ProgressUpdate;

				// Skip heartbeat and connection messages from the backend
				if (update.step === "heartbeat" || update.step === "connection") {
					return;
				}

				console.log("SSE message received:", update);

				if (update.message) {
					setCurrentMessage(update.message);
				}

				updateSteps(update);
			} catch (error) {
				console.error("Failed to parse SSE message:", event.data, error);
			}
		},
		[updateSteps],
	);

	const handleError = useCallback(() => {
		console.error("EventSource error occurred");
		setConnectionStatus("error");

		if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
			const delay = calculateReconnectDelay(reconnectAttemptsRef.current);
			console.log(
				`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`,
			);

			reconnectTimeoutRef.current = setTimeout(() => {
				reconnectAttemptsRef.current++;
				connectSSE();
			}, delay);
		} else {
			console.error("Max reconnection attempts reached");
			setCurrentMessage(
				"Connection lost. Please refresh the page to try again.",
			);
		}
	}, []); // `connectSSE` is removed from dependency array to avoid cycles

	const connectSSE = useCallback(() => {
		if (!channelId) return;

		cleanup();


		const eventSource = new EventSource(`/events/${channelId}`);
		eventSourceRef.current = eventSource;

		eventSource.onopen = () => {
			console.log("SSE connection established");
			setConnectionStatus("connected");
			reconnectAttemptsRef.current = 0;
			// Removed logic that auto-activates the first step.
			// The frontend will now wait for the backend to send the first "active" step message.
		};

		eventSource.onmessage = handleMessage;
		eventSource.onerror = handleError;
	}, [channelId, cleanup, handleMessage, handleError]);

	useEffect(() => {
		if (channelId) {
			connectSSE();
		}
		return cleanup;
	}, [channelId, connectSSE, cleanup]);

	return {
		steps,
		currentMessage,
		connectionStatus,
	};
};