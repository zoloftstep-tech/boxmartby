type FefcoProps = { className?: string };

/** FEFCO 0201 — regular slotted container (RSC) blank */
export function Fefco0201({ className = "" }: FefcoProps) {
  return (
    <svg className={className} viewBox="0 0 280 180" fill="none" aria-hidden>
      <rect x="20" y="20" width="240" height="140" fill="#F3EEE6" stroke="#9A7348" strokeWidth="1.5" />
      {/* vertical panels */}
      <path d="M80 20 V160 M140 20 V160 M200 20 V160" stroke="#9A7348" strokeWidth="1.2" />
      {/* horizontal flap lines */}
      <path d="M20 55 H260 M20 125 H260" stroke="#6B4F2E" strokeWidth="1" strokeDasharray="5 4" />
      {/* cut marks on flaps */}
      <path d="M80 20 V55 M140 20 V55 M200 20 V55 M80 125 V160 M140 125 V160 M200 125 V160" stroke="#0F172A" strokeWidth="1.2" />
      <text x="110" y="95" fill="#64748B" fontSize="11" fontFamily="ui-monospace, monospace">
        FEFCO 0201
      </text>
    </svg>
  );
}

/** FEFCO 0427 — foldable tray / self-locking */
export function Fefco0427({ className = "" }: FefcoProps) {
  return (
    <svg className={className} viewBox="0 0 280 180" fill="none" aria-hidden>
      <path
        d="M90 30 H190 L240 70 V130 L190 150 H90 L40 130 V70 Z"
        fill="#F3EEE6"
        stroke="#9A7348"
        strokeWidth="1.5"
      />
      <path d="M90 30 V150 M190 30 V150 M40 70 H240 M40 130 H240" stroke="#6B4F2E" strokeWidth="1" strokeDasharray="5 4" />
      <path d="M90 30 L40 70 M190 30 L240 70 M90 150 L40 130 M190 150 L240 130" stroke="#0F172A" strokeWidth="1" />
      <text x="108" y="105" fill="#64748B" fontSize="11" fontFamily="ui-monospace, monospace">
        FEFCO 0427
      </text>
    </svg>
  );
}

/** FEFCO 0409 — crash-lock / auto-bottom style simplified blank */
export function Fefco0409({ className = "" }: FefcoProps) {
  return (
    <svg className={className} viewBox="0 0 280 180" fill="none" aria-hidden>
      <rect x="40" y="40" width="200" height="100" fill="#F3EEE6" stroke="#9A7348" strokeWidth="1.5" />
      <path d="M90 40 V140 M140 40 V140 M190 40 V140" stroke="#9A7348" strokeWidth="1.2" />
      <path d="M40 70 H240 M40 110 H240" stroke="#6B4F2E" strokeWidth="1" strokeDasharray="5 4" />
      {/* lock tabs */}
      <path d="M90 110 L115 140 L140 110 L165 140 L190 110" stroke="#0369A1" strokeWidth="1.5" fill="none" />
      <text x="108" y="95" fill="#64748B" fontSize="11" fontFamily="ui-monospace, monospace">
        FEFCO 0409
      </text>
    </svg>
  );
}

/** Simple tray / open box blank */
export function FefcoTray({ className = "" }: FefcoProps) {
  return (
    <svg className={className} viewBox="0 0 280 180" fill="none" aria-hidden>
      <path
        d="M70 50 H210 V70 H240 V130 H210 V150 H70 V130 H40 V70 H70 Z"
        fill="#F3EEE6"
        stroke="#9A7348"
        strokeWidth="1.5"
      />
      <path d="M70 70 H210 V130 H70 Z" stroke="#6B4F2E" strokeWidth="1" strokeDasharray="5 4" />
      <text x="112" y="108" fill="#64748B" fontSize="11" fontFamily="ui-monospace, monospace">
        ЛОТОК
      </text>
    </svg>
  );
}
