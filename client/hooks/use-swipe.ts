"use client"

import { useState, useRef, useCallback } from "react"
import type React from "react"

/**
 * Custom hook for handling swipe gestures
 * @param onSwipeLeft Function to call when swiped left
 * @param onSwipeRight Function to call when swiped right
 * @param minDistance Minimum distance to trigger swipe (default: 50px)
 */
export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void, minDistance = 50) {
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  
  // Use refs to avoid unnecessary re-renders
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const isDragging = useRef<boolean>(false)
  const isHorizontalSwipe = useRef<boolean>(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchStartY.current = e.targetTouches[0].clientY
    touchEndX.current = 0
    isDragging.current = false
    isHorizontalSwipe.current = false
    setSwipeDirection(null)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const currentX = e.targetTouches[0].clientX
    const currentY = e.targetTouches[0].clientY
    touchEndX.current = currentX

    const deltaX = touchStartX.current - currentX
    const deltaY = touchStartY.current - currentY

    // Only determine swipe direction once we have significant movement
    if (!isDragging.current && (Math.abs(deltaX) > 15 || Math.abs(deltaY) > 15)) {
      isDragging.current = true
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY)
    }

    // If this is a horizontal swipe, prevent default and show direction
    if (isDragging.current && isHorizontalSwipe.current) {
      e.preventDefault()
      
      // Only update direction state when crossing threshold to minimize renders
      const threshold = minDistance / 3
      if (deltaX > threshold && swipeDirection !== "left") {
        setSwipeDirection("left")
      } else if (deltaX < -threshold && swipeDirection !== "right") {
        setSwipeDirection("right")
      } else if (Math.abs(deltaX) < threshold && swipeDirection !== null) {
        setSwipeDirection(null)
      }
    }
  }, [minDistance, swipeDirection])

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current || !isHorizontalSwipe.current || touchEndX.current === 0) {
      setSwipeDirection(null)
      return
    }

    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minDistance
    const isRightSwipe = distance < -minDistance

    if (isLeftSwipe) {
      onSwipeLeft()
    } else if (isRightSwipe) {
      onSwipeRight()
    }

    // Reset state
    setSwipeDirection(null)
    isDragging.current = false
    isHorizontalSwipe.current = false
  }, [onSwipeLeft, onSwipeRight, minDistance])

  return {
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    swipeState: {
      swiping: isDragging.current && isHorizontalSwipe.current,
      swipeDirection,
    },
  }
}