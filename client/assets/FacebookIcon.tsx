import * as React from "react"
import { type SVGProps } from "react"
const FacebookIcon = ({ className, ...props }: SVGProps<SVGSVGElement> & { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width={100}
    height={100}
    viewBox="0 0 48 48"
    {...props}
  >
    <path fill="#039be5" d="M24 5a19 19 0 1 0 0 38 19 19 0 1 0 0-38Z" />
    <path
      fill="#fff"
      d="M26.572 29.036h4.917l.772-4.995h-5.69v-2.73c0-2.075.678-3.915 2.619-3.915h3.119v-4.359c-.548-.074-1.707-.236-3.897-.236-4.573 0-7.254 2.415-7.254 7.917v3.323h-4.701v4.995h4.701v13.729c.931.14 1.874.235 2.842.235.875 0 1.729-.08 2.572-.194v-13.77z"
    />
  </svg>
)
export default FacebookIcon
