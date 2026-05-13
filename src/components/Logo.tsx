// components/Logo.tsx
export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg 
    viewBox="0 0 256 256" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
    role="img" 
    aria-label="Grocery Run Logo"
  >
    <title>Grocery Run Logo</title>
    {/* Speed Wisps */}
    <path d="M 20 160 Q 45 160, 75 175" fill="none" stroke="#176a21" strokeWidth="16" strokeLinecap="round" opacity="0.2" />
    <path d="M 15 120 Q 50 125, 80 110" fill="none" stroke="#176a21" strokeWidth="14" strokeLinecap="round" opacity="0.15" />
    <path d="M 25 195 Q 60 195, 95 210" fill="none" stroke="#176a21" strokeWidth="18" strokeLinecap="round" opacity="0.25" />

    <g transform="rotate(15 128 128) translate(20, 0)">
      {/* Brown Bread */}
      <rect x="135" y="35" width="42" height="95" rx="8" fill="#8b5e3c" />
      {/* Red Apple */}
      <circle cx="85" cy="85" r="28" fill="#ef4444" />
      <path d="M 85 58 C 95 58, 102 45, 102 45 C 90 45, 85 58, 85 58 Z" fill="#176a21" />
      {/* Yellow Banana */}
      <path d="M 105 40 Q 135 40, 135 85" fill="none" stroke="#facc15" strokeWidth="18" strokeLinecap="round" />
      {/* Brown Paper Bag */}
      <path d="M 64 200 L 192 200 L 204 96 L 160 80 L 128 96 L 96 80 L 52 96 Z" fill="#D2A679" />
    </g>
  </svg>
);