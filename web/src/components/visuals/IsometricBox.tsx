"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

type IsometricBoxProps = {
  className?: string;
};

/**
 * Hero box: one-shot fold from flat blank → isometric, then cursor tilt (desktop).
 * Honors prefers-reduced-motion (static final pose, no tilt).
 */
export function IsometricBox({ className = "" }: IsometricBoxProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [assembled, setAssembled] = useState(false);
  const [tiltReady, setTiltReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      if (mq.matches) {
        setReduceMotion(true);
        setAssembled(true);
        setTiltReady(false);
        setTilt({ rx: 0, ry: 0 });
        return null;
      }
      setReduceMotion(false);
      return window.setTimeout(() => setAssembled(true), 60);
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
    const id = window.setTimeout(() => setTiltReady(true), 2300);
    return () => window.clearTimeout(id);
  }, [assembled, reduceMotion]);

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!tiltReady || reduceMotion || e.pointerType === "touch") return;
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setTilt({
      rx: Math.max(-1, Math.min(1, -ny)) * 6,
      ry: Math.max(-1, Math.min(1, nx)) * 8,
    });
  }

  function onPointerLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

  const sceneStyle = reduceMotion
    ? undefined
    : {
        transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: tiltReady ? "transform 120ms ease-out" : "transform 0.6s ease-out",
      };

  return (
    <div
      ref={wrapRef}
      className={`hero-box ${assembled ? "is-assembled" : ""} ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="hero-box-scene" style={sceneStyle}>
        <svg
          className="h-auto w-full"
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

          {/* ground shadow */}
          <ellipse
            className="hero-box-shadow"
            cx="210"
            cy="318"
            rx="130"
            ry="18"
            fill="rgba(15,23,42,0.08)"
          />

          {/* flat blank (start pose) */}
          <g className="hero-box-blank">
            <rect x="70" y="110" width="280" height="130" rx="2" fill="#E8D5B5" stroke="#6B4F2E" strokeWidth="1.5" />
            <path d="M140 110 V240 M210 110 V240 M280 110 V240" stroke="#9A7348" strokeWidth="1.2" />
            <path
              d="M70 145 H350 M70 205 H350"
              stroke="#6B4F2E"
              strokeWidth="1"
              strokeDasharray="5 4"
              opacity="0.55"
            />
            <path d="M70 110 H50 V240 H70" fill="#D4BC8E" stroke="#6B4F2E" strokeWidth="1.2" />
            <text
              x="210"
              y="182"
              textAnchor="middle"
              fill="#6B4F2E"
              fontSize="14"
              fontFamily="ui-sans-serif, system-ui"
              opacity="0.7"
            >
              FEFCO
            </text>
          </g>

          {/* assembled isometric faces */}
          <g className="hero-box-iso">
            <g className="hero-box-face hero-box-face-left">
              <path d="M210 140 L90 90 L90 230 L210 300 Z" fill="url(#faceLeft)" />
              <path d="M210 140 L90 90 L90 230 L210 300 Z" fill="url(#flute)" />
            </g>
            <g className="hero-box-face hero-box-face-right">
              <path d="M210 140 L330 90 L330 230 L210 300 Z" fill="url(#faceRight)" />
              <path d="M210 140 L330 90 L330 230 L210 300 Z" fill="url(#flute)" opacity="0.5" />
            </g>
            <g className="hero-box-face hero-box-face-top">
              <path d="M210 140 L90 90 L210 40 L330 90 Z" fill="url(#faceTop)" />
              <path d="M210 140 L150 65 L210 40 L270 65 Z" fill="#D4BC8E" opacity="0.85" />
              <path d="M210 140 L210 300" stroke="#6B4F2E" strokeWidth="1.5" opacity="0.45" />
              <path d="M90 90 L210 140 L330 90" stroke="#6B4F2E" strokeWidth="1.2" opacity="0.35" />
              <path
                d="M150 65 L210 140 L270 65"
                stroke="#6B4F2E"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.4"
              />
            </g>
            <g className="hero-box-dims">
              <path d="M70 250 L70 270 M350 250 L350 270" stroke="#0369A1" strokeWidth="1.5" />
              <path d="M70 260 H350" stroke="#0369A1" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
              <text
                x="210"
                y="288"
                textAnchor="middle"
                fill="#0369A1"
                fontSize="13"
                fontFamily="ui-sans-serif, system-ui"
              >
                Д × Ш × В
              </text>
            </g>
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
