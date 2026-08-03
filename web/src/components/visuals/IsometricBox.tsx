"use client";

import { useEffect, useState } from "react";

type IsometricBoxProps = {
  className?: string;
};

/**
 * Soft SVG assemble (flat blank → closed isometric box), then continuous yaw.
 * No dimension labels. Honors prefers-reduced-motion.
 */
export function IsometricBox({ className = "" }: IsometricBoxProps) {
  const [assembled, setAssembled] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      if (mq.matches) {
        setReduceMotion(true);
        setAssembled(true);
        setSpinning(false);
        return null;
      }
      setReduceMotion(false);
      return window.setTimeout(() => setAssembled(true), 80);
    };

    let timer = sync();
    const onChange = () => {
      if (timer != null) window.clearTimeout(timer);
      timer = sync();
    };
    mq.addEventListener("change", onChange);
    return () => {
      if (timer != null) window.clearTimeout(timer);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    if (!assembled || reduceMotion) return;
    const id = window.setTimeout(() => setSpinning(true), 3000);
    return () => window.clearTimeout(id);
  }, [assembled, reduceMotion]);

  return (
    <div
      className={`hero-box ${assembled ? "is-assembled" : ""} ${spinning ? "is-spinning" : ""} ${className}`}
      aria-hidden
    >
      <div className="hero-box-scene">
        <svg
          className="h-auto w-full"
          viewBox="0 0 420 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hbTop" x1="210" y1="50" x2="210" y2="150" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EDE0C8" />
              <stop offset="1" stopColor="#D4BC8E" />
            </linearGradient>
            <linearGradient id="hbLeft" x1="90" y1="120" x2="200" y2="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C4A574" />
              <stop offset="1" stopColor="#9A7348" />
            </linearGradient>
            <linearGradient id="hbRight" x1="230" y1="120" x2="340" y2="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A67C52" />
              <stop offset="1" stopColor="#6B4F2E" />
            </linearGradient>
            <pattern id="hbFlute" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
              <path d="M0 0h2v8H0z" fill="rgba(107,79,46,0.12)" />
            </pattern>
          </defs>

          <ellipse
            className="hero-box-shadow"
            cx="210"
            cy="308"
            rx="118"
            ry="15"
            fill="rgba(15,23,42,0.09)"
          />

          {/* flat blank */}
          <g className="hero-box-blank">
            <rect x="86" y="108" width="248" height="112" rx="2" fill="#E8D5B5" stroke="#6B4F2E" strokeWidth="1.4" />
            <path d="M148 108 V220 M210 108 V220 M272 108 V220" stroke="#9A7348" strokeWidth="1.1" />
            <path
              d="M86 136 H334 M86 192 H334"
              stroke="#6B4F2E"
              strokeWidth="1"
              strokeDasharray="5 4"
              opacity="0.5"
            />
            <path d="M86 108 H68 V220 H86" fill="#D4BC8E" stroke="#6B4F2E" strokeWidth="1.2" />
          </g>

          {/* assembled closed box — proportions L > W ≈ H */}
          <g className="hero-box-iso">
            <g className="hero-box-face hero-box-face-left">
              {/* length×height face */}
              <path d="M210 148 L95 100 L95 248 L210 308 Z" fill="url(#hbLeft)" />
              <path d="M210 148 L95 100 L95 248 L210 308 Z" fill="url(#hbFlute)" />
            </g>
            <g className="hero-box-face hero-box-face-right">
              {/* width×height face — slightly shorter depth than length */}
              <path d="M210 148 L310 108 L310 248 L210 308 Z" fill="url(#hbRight)" />
              <path d="M210 148 L310 108 L310 248 L210 308 Z" fill="url(#hbFlute)" opacity="0.45" />
            </g>
            <g className="hero-box-face hero-box-face-top">
              {/* closed top with flap creases */}
              <path d="M210 148 L95 100 L210 52 L310 108 Z" fill="url(#hbTop)" stroke="#6B4F2E" strokeWidth="1" />
              {/* major flaps meet on length midline */}
              <path
                d="M152 124 L210 148 L268 128"
                stroke="#6B4F2E"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.4"
              />
              <path d="M210 100 L210 148" stroke="#6B4F2E" strokeWidth="1" opacity="0.35" />
              <path d="M95 100 L210 148 L310 108" stroke="#6B4F2E" strokeWidth="1.1" opacity="0.35" />
            </g>
            <path d="M210 148 L210 308" stroke="#6B4F2E" strokeWidth="1.3" opacity="0.35" />
          </g>
        </svg>
      </div>
    </div>
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
