// Fallback visuals for storefronts with no uploaded banner or logo. Palette: #e6ebdf / #e7ecdf / brand / ink / line.
export function DefaultBanner({ className = "" }: { className?: string }) {
  return (
    <svg role="img" aria-label="Default storefront banner" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" className={`h-full w-full ${className}`}>
      <rect width="600" height="200" fill="#e6ebdf" />
      <g fill="none" stroke="#1f5d3a" strokeOpacity=".16" strokeWidth="1.5">
        <circle cx="520" cy="30" r="120" /><circle cx="520" cy="30" r="86" /><circle cx="520" cy="30" r="52" />
      </g>
      <g stroke="#1c1b17" strokeOpacity=".08" strokeWidth="1">
        {[40, 80, 120, 160].map((y) => <line key={y} x1="0" y1={y} x2="600" y2={y} />)}
      </g>
      <path d="M0 200 L0 150 Q90 118 180 146 T360 140 T600 128 L600 200 Z" fill="#1f5d3a" fillOpacity=".12" />
      <path d="M0 200 L0 176 Q120 154 240 174 T480 166 T600 160 L600 200 Z" fill="#1f5d3a" fillOpacity=".18" />
    </svg>
  );
}

export function DefaultLogo({ className = "" }: { className?: string }) {
  return (
    <svg role="img" aria-label="Default storefront icon" viewBox="0 0 96 96" className={`h-full w-full ${className}`}>
      <rect width="96" height="96" fill="#e7ecdf" />
      <circle cx="48" cy="48" r="38" fill="none" stroke="#1f5d3a" strokeOpacity=".18" strokeWidth="2" />
      <g fill="none" stroke="#1f5d3a" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M27 40 L31 28 H65 L69 40" />
        <path d="M27 40 Q27 47 34 47 Q41 47 41 40 Q41 47 48 47 Q55 47 55 40 Q55 47 62 47 Q69 47 69 40" />
        <path d="M31 47 V68 H65 V47" />
        <path d="M42 68 V56 H54 V68" />
      </g>
    </svg>
  );
}
