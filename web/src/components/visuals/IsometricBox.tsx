/** Isometric cardboard box — closed lid, face labels, no photos */
export function IsometricBox({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="faceTop" x1="210" y1="40" x2="210" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8D5B5" />
          <stop offset="1" stopColor="#C9A87A" />
        </linearGradient>
        <linearGradient id="faceLeft" x1="80" y1="120" x2="180" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B8956A" />
          <stop offset="1" stopColor="#8F6F45" />
        </linearGradient>
        <linearGradient id="faceRight" x1="240" y1="120" x2="340" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A67C52" />
          <stop offset="1" stopColor="#6B4F2E" />
        </linearGradient>
        <pattern id="flute" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <path d="M0 0h2v8H0z" fill="rgba(107,79,46,0.12)" />
        </pattern>
      </defs>

      {/* soft ground shadow */}
      <ellipse cx="210" cy="318" rx="130" ry="18" fill="rgba(15,23,42,0.08)" />

      {/* left face — Ш */}
      <path d="M210 140 L90 90 L90 230 L210 300 Z" fill="url(#faceLeft)" />
      <path d="M210 140 L90 90 L90 230 L210 300 Z" fill="url(#flute)" />

      {/* right face — Д */}
      <path d="M210 140 L330 90 L330 230 L210 300 Z" fill="url(#faceRight)" />
      <path d="M210 140 L330 90 L330 230 L210 300 Z" fill="url(#flute)" opacity="0.5" />

      {/* closed top */}
      <path d="M210 140 L90 90 L210 40 L330 90 Z" fill="url(#faceTop)" />

      {/* rim + front edge */}
      <path d="M210 140 L210 300" stroke="#6B4F2E" strokeWidth="1.5" opacity="0.45" />
      <path d="M90 90 L210 140 L330 90" stroke="#6B4F2E" strokeWidth="1.2" opacity="0.35" />

      {/* single flap crease, center of lid, parallel to Д */}
      <path
        d="M150 115 L270 65"
        stroke="#6B4F2E"
        strokeWidth="1.15"
        strokeDasharray="5 4"
        opacity="0.45"
      />

      {/* face labels */}
      <text
        x="198"
        y="236"
        fill="#6B4F2E"
        fontSize="13"
        fontWeight="600"
        fontFamily="ui-sans-serif, system-ui"
      >
        В
      </text>
      <text
        x="128"
        y="290"
        fill="#6B4F2E"
        fontSize="13"
        fontWeight="600"
        fontFamily="ui-sans-serif, system-ui"
      >
        Ш
      </text>
      <text
        x="278"
        y="290"
        fill="#6B4F2E"
        fontSize="13"
        fontWeight="600"
        fontFamily="ui-sans-serif, system-ui"
      >
        Д
      </text>
    </svg>
  );
}

/** Macro corrugated edge cross-section */
export function CorrugatedCrossSection({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 80" fill="none" aria-hidden>
      <rect width="320" height="80" fill="#EDE4D4" />
      <path
        d="M0 40 Q20 10 40 40 Q60 70 80 40 Q100 10 120 40 Q140 70 160 40 Q180 10 200 40 Q220 70 240 40 Q260 10 280 40 Q300 70 320 40"
        stroke="#9A7348"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M0 18 H320" stroke="#C4A574" strokeWidth="6" />
      <path d="M0 62 H320" stroke="#C4A574" strokeWidth="6" />
    </svg>
  );
}
