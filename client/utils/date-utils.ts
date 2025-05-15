/**
 * Format a date string to a relative time string (e.g. "2 days ago")
 * @param dateString The date string to format
 * @returns A formatted relative time string
 */
export function formatRelativeTime(dateString: string): string {
  try {
    if (!dateString) return "Unknown date"

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid date"

    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    // Less than a minute
    if (diffInSeconds < 60) {
      return "Just now"
    }

    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
    }

    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
    }

    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} ${days === 1 ? "day" : "days"} ago`
    }

    // Less than a month
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800)
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
    }

    // Less than a year
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000)
      return `${months} ${months === 1 ? "month" : "months"} ago`
    }

    // More than a year
    const years = Math.floor(diffInSeconds / 31536000)
    return `${years} ${years === 1 ? "year" : "years"} ago`
  } catch (error) {
    console.error("Error formatting relative time:", error)
    return "Unknown date"
  }
}
