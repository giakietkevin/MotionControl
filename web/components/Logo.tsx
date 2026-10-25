export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#22d3ee" />
      <circle cx="16" cy="9" r="3" fill="#07090c" />
      <path d="M16 12v6m0 0-4 7m4-7 4 7M9 15l7-3 7 3" stroke="#07090c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
