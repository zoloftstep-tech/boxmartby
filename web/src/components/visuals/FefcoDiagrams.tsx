type FefcoProps = { className?: string };

const stroke = "#6B4F2E";
const strokeSoft = "#9A7348";
const fill = "#F3EEE6";
const cut = "#0F172A";
const muted = "#64748B";

/** FEFCO 0201 — RSC: blank + open 3D */
export function Fefco0201({ className = "" }: FefcoProps) {
  return (
    <svg className={className} viewBox="0 0 360 160" fill="none" aria-hidden>
      <text x="8" y="22" fill={stroke} fontSize="14" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
        0201
      </text>
      {/* Blank */}
      <g transform="translate(8, 32)">
        <rect x="12" y="8" width="16" height="88" fill={fill} stroke={cut} strokeWidth="1.2" />
        <rect x="28" y="8" width="36" height="88" fill={fill} stroke={cut} strokeWidth="1.2" />
        <rect x="64" y="8" width="36" height="88" fill={fill} stroke={cut} strokeWidth="1.2" />
        <rect x="100" y="8" width="36" height="88" fill={fill} stroke={cut} strokeWidth="1.2" />
        <rect x="136" y="8" width="36" height="88" fill={fill} stroke={cut} strokeWidth="1.2" />
        {/* flaps */}
        <path d="M28 8 V0 H64 V8 M64 8 V0 H100 V8 M100 8 V0 H136 V8 M136 8 V0 H172 V8" stroke={cut} strokeWidth="1.2" fill={fill} />
        <path d="M28 96 V104 H64 V96 M64 96 V104 H100 V96 M100 96 V104 H136 V96 M136 96 V104 H172 V96" stroke={cut} strokeWidth="1.2" fill={fill} />
        <path d="M28 8 V96 M64 8 V96 M100 8 V96 M136 8 V96" stroke={strokeSoft} strokeWidth="1" strokeDasharray="4 3" />
        <path d="M28 28 H172 M28 76 H172" stroke={strokeSoft} strokeWidth="1" strokeDasharray="4 3" />
        <text x="40" y="56" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Д
        </text>
        <text x="78" y="56" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Ш
        </text>
        <text x="114" y="56" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Д
        </text>
        <text x="150" y="56" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Ш
        </text>
      </g>
      {/* 3D */}
      <g transform="translate(210, 28)">
        <path d="M20 40 L70 20 L120 40 L70 60 Z" fill={fill} stroke={cut} strokeWidth="1.2" />
        <path d="M20 40 L20 90 L70 110 L70 60 Z" fill="#EDE6DA" stroke={cut} strokeWidth="1.2" />
        <path d="M70 60 L120 40 L120 90 L70 110 Z" fill="#E8DFD0" stroke={cut} strokeWidth="1.2" />
        {/* open top flaps */}
        <path d="M20 40 L10 10 L55 0 L70 20" fill="none" stroke={cut} strokeWidth="1.1" />
        <path d="M120 40 L130 12 L80 0 L70 20" fill="none" stroke={cut} strokeWidth="1.1" />
        <path d="M20 40 L0 55 L0 70 L20 90" fill="none" stroke={strokeSoft} strokeWidth="1" strokeDasharray="3 2" />
        <text x="62" y="48" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Д
        </text>
        <text x="28" y="78" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          В
        </text>
        <text x="92" y="78" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Ш
        </text>
      </g>
    </svg>
  );
}

/** FEFCO 0415 — tray / folder with side walls */
export function Fefco0415({ className = "" }: FefcoProps) {
  return (
    <svg className={className} viewBox="0 0 360 160" fill="none" aria-hidden>
      <text x="8" y="22" fill={stroke} fontSize="14" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
        0415
      </text>
      <g transform="translate(16, 36)">
        {/* center base */}
        <rect x="48" y="36" width="72" height="48" fill={fill} stroke={cut} strokeWidth="1.2" />
        {/* four walls */}
        <path d="M48 36 L48 8 H120 V36" fill={fill} stroke={cut} strokeWidth="1.2" />
        <path d="M48 84 L48 112 H120 V84" fill={fill} stroke={cut} strokeWidth="1.2" />
        <path d="M48 36 H16 V84 H48" fill={fill} stroke={cut} strokeWidth="1.2" />
        <path d="M120 36 H152 V84 H120" fill={fill} stroke={cut} strokeWidth="1.2" />
        {/* side tabs */}
        <path d="M16 36 H0 V52 M16 68 H0 V84" stroke={cut} strokeWidth="1.1" fill={fill} />
        <path d="M152 36 H168 V52 M152 68 H168 V84" stroke={cut} strokeWidth="1.1" fill={fill} />
        <path d="M48 36 H120 M48 84 H120 M48 36 V84 M120 36 V84" stroke={strokeSoft} strokeWidth="1" strokeDasharray="4 3" />
        <text x="78" y="64" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Д
        </text>
        <text x="28" y="64" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          В
        </text>
        <text x="78" y="24" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Ш
        </text>
      </g>
      <g transform="translate(210, 36)">
        <path d="M24 70 L74 50 L124 70 L74 90 Z" fill={fill} stroke={cut} strokeWidth="1.2" />
        <path d="M24 70 L24 40 L74 20 L74 50" fill="#EDE6DA" stroke={cut} strokeWidth="1.2" />
        <path d="M124 70 L124 40 L74 20 L74 50" fill="#E8DFD0" stroke={cut} strokeWidth="1.2" />
        <path d="M24 70 L74 90 L74 110 L24 90 Z" fill="#E6DCCB" stroke={cut} strokeWidth="1.1" />
        <path d="M124 70 L74 90 L74 110 L124 90 Z" fill="#E2D7C4" stroke={cut} strokeWidth="1.1" />
        <text x="68" y="68" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Д
        </text>
        <text x="40" y="48" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Ш
        </text>
        <text x="100" y="100" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          В
        </text>
      </g>
    </svg>
  );
}

/** FEFCO 0427 — self-lock with hinged lid, double walls */
export function Fefco0427({ className = "" }: FefcoProps) {
  return (
    <svg className={className} viewBox="0 0 360 160" fill="none" aria-hidden>
      <text x="8" y="22" fill={stroke} fontSize="14" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
        0427
      </text>
      <g transform="translate(10, 30)">
        <rect x="40" y="40" width="56" height="40" fill={fill} stroke={cut} strokeWidth="1.2" />
        <rect x="40" y="8" width="56" height="32" fill={fill} stroke={cut} strokeWidth="1.2" />
        <rect x="40" y="80" width="56" height="32" fill={fill} stroke={cut} strokeWidth="1.2" />
        <rect x="8" y="40" width="32" height="40" fill={fill} stroke={cut} strokeWidth="1.2" />
        <rect x="96" y="40" width="32" height="40" fill={fill} stroke={cut} strokeWidth="1.2" />
        {/* lid extension */}
        <path d="M40 8 H96 V0 H40 Z" fill={fill} stroke={cut} strokeWidth="1.1" />
        <path d="M8 40 H40 M96 40 H128 M40 40 V80 M40 8 V40 M40 80 V112" stroke={strokeSoft} strokeWidth="1" strokeDasharray="4 3" />
        <text x="62" y="64" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Д
        </text>
        <text x="18" y="64" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          В
        </text>
        <text x="62" y="28" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Ш
        </text>
      </g>
      <g transform="translate(200, 28)">
        <path d="M30 70 L80 50 L130 70 L80 90 Z" fill={fill} stroke={cut} strokeWidth="1.2" />
        <path d="M30 70 L30 100 L80 120 L80 90 Z" fill="#EDE6DA" stroke={cut} strokeWidth="1.2" />
        <path d="M130 70 L130 100 L80 120 L80 90 Z" fill="#E8DFD0" stroke={cut} strokeWidth="1.2" />
        {/* open lid */}
        <path d="M30 70 L20 30 L70 10 L80 50" fill="#F3EEE6" stroke={cut} strokeWidth="1.2" opacity="0.95" />
        <path d="M20 30 L10 40 M70 10 L80 0" stroke={strokeSoft} strokeWidth="1" />
        <text x="72" y="78" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Д
        </text>
        <text x="40" y="100" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          В
        </text>
        <text x="108" y="100" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Ш
        </text>
      </g>
    </svg>
  );
}

/** FEFCO 0470 — self-lock mailer with hinged lid */
export function Fefco0470({ className = "" }: FefcoProps) {
  return (
    <svg className={className} viewBox="0 0 360 160" fill="none" aria-hidden>
      <text x="8" y="22" fill={stroke} fontSize="14" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
        0470
      </text>
      <g transform="translate(8, 34)">
        <rect x="20" y="36" width="100" height="36" fill={fill} stroke={cut} strokeWidth="1.2" />
        <rect x="20" y="8" width="100" height="28" fill={fill} stroke={cut} strokeWidth="1.2" />
        <rect x="20" y="72" width="100" height="28" fill={fill} stroke={cut} strokeWidth="1.2" />
        <path d="M0 36 H20 V72 H0 Z" fill={fill} stroke={cut} strokeWidth="1.2" />
        <path d="M120 36 H140 V72 H120 Z" fill={fill} stroke={cut} strokeWidth="1.2" />
        <path d="M20 8 H120 M20 36 H120 M20 72 H120 M40 8 V100 M100 8 V100" stroke={strokeSoft} strokeWidth="1" strokeDasharray="4 3" />
        <text x="62" y="58" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Д
        </text>
        <text x="6" y="58" fill={muted} fontSize="8" fontFamily="ui-sans-serif, system-ui">
          В
        </text>
        <text x="62" y="26" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Ш
        </text>
      </g>
      <g transform="translate(200, 30)">
        <path d="M16 78 L90 58 L150 78 L76 98 Z" fill={fill} stroke={cut} strokeWidth="1.2" />
        <path d="M16 78 L16 108 L76 128 L76 98 Z" fill="#EDE6DA" stroke={cut} strokeWidth="1.2" />
        <path d="M150 78 L150 108 L76 128 L76 98 Z" fill="#E8DFD0" stroke={cut} strokeWidth="1.2" />
        <path d="M16 78 L6 28 L70 8 L90 58" fill="#F3EEE6" stroke={cut} strokeWidth="1.2" />
        <text x="78" y="86" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Д
        </text>
        <text x="30" y="108" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          В
        </text>
        <text x="118" y="108" fill={muted} fontSize="9" fontFamily="ui-sans-serif, system-ui">
          Ш
        </text>
      </g>
    </svg>
  );
}
