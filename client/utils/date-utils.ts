/**
 * Format a date string or Firebase timestamp object to a relative time string (e.g. "2 days ago")
 * @param input A date string or an object with seconds and nanoseconds (e.g. { seconds: 1747353600, nanoseconds: 0 })
 * @returns A formatted relative time string
 */
export function formatRelativeTime(
  input: string | { seconds: number; nanoseconds: number }
): string {
  try {
    if (!input) return "Unknown date"

    let date: Date

    if (typeof input === "string") {
      // Normalize a string like "12 May 2025 at 02:00:00 UTC+2"
      const normalized = input
        .replace(" at ", " ")
        .replace(/UTC([+-]\d+)/, "GMT$1")
      date = new Date(normalized)
    } else if (
      typeof input === "object" &&
      typeof input.seconds === "number"
    ) {
      date = new Date(input.seconds * 1000)
    } else {
      return "Invalid date"
    }

    if (isNaN(date.getTime())) return "Invalid date"

    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} ${days === 1 ? "day" : "days"} ago`
    }
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800)
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
    }
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000)
      return `${months} ${months === 1 ? "month" : "months"} ago`
    }

    const years = Math.floor(diffInSeconds / 31536000)
    return `${years} ${years === 1 ? "year" : "years"} ago`
  } catch (error) {
    console.error("Error formatting relative time:", error)
    return "Unknown date"
  }
}
