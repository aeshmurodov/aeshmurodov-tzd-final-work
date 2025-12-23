"use client"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Hexagonal shield */}
      <path
        d="M20 3L32 9V19C32 28 26 35 20 37C14 35 8 28 8 19V9L20 3Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner hexagon */}
      <path d="M20 8L26 11V17C26 22 23 26 20 27C17 26 14 22 14 17V11L20 8Z" fill="currentColor" opacity="0.2" />
      {/* Document icon */}
      <path d="M18 15H22M18 18H22M18 21H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Lock corner accent */}
      <circle cx="24" cy="12" r="3" fill="currentColor" />
      <circle cx="24" cy="12" r="1.5" fill="white" className="dark:fill-background" />
    </svg>
  )
}
