import { useState } from "react";
import type React from "react";

/**
 * Custom hook for handling swipe gestures
 * @param onSwipeLeft Function to call when swiped left
 * @param onSwipeRight Function to call when swiped right
 * @param minDistance Minimum distance to trigger swipe (default: 50px)
 */
export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  minDistance = 50
) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwiping(true);
    setSwipeDirection(null);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);

    if (touchStart && e.targetTouches[0].clientX) {
      const distance = touchStart - e.targetTouches[0].clientX;
      if (distance > minDistance / 2) {
        setSwipeDirection("left");
      } else if (distance < -minDistance / 2) {
        setSwipeDirection("right");
      } else {
        setSwipeDirection(null);
      }
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwiping(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minDistance;
    const isRightSwipe = distance < -minDistance;

    if (isLeftSwipe) {
      onSwipeLeft();
    }

    if (isRightSwipe) {
      onSwipeRight();
    }

    setSwiping(false);
    setSwipeDirection(null);
  };

  return {
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    swipeState: {
      swiping,
      swipeDirection,
    },
  };
}
