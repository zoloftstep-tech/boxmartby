"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

type IsometricBoxProps = {
  className?: string;
};

/**
 * Hero box: soft fold blank → isometric with two open flaps,
 * then horizontal yaw (rotateY) from cursor. Honors reduced motion.
 */
export function IsometricBox({ className = "" }: IsometricBoxProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [assembled, setAssembled] = useState(false);
  const [yawReady, setYawReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [yaw, setYaw] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      if (mq.matches) {
        setReduceMotion(true);
        setAssembled(true);
        setYawReady(false);
        setYaw(0);
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
    const id = window.setTimeout(() => setYawReady(true), 3400);
    return () => window.clearTimeout(id);
  }, [assembled, reduceMotion]);

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!yawReady || reduceMotion || e.pointerType === "touch") return;
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    setYaw(Math.max(-1, Math.min(1, nx)) * 22);
  }

  function onPointerLeave() {
    setYaw(0);
  }

  const sceneStyle = reduceMotion
    ? undefined
    : {
        transform: `rotateY(${yaw}deg)`,
        transition: yawReady ? "transform 180ms ease-out" : "transform 0.8s ease-out",
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
            <linearGradient id="faceTop" x1="210" y1="40" x2="210" y2="160" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EDE0C8" />
              <stop offset="1" stopColor="#D4BC8E" />
            </linearGradient>
            <linearGradient id="faceLeft" x1="100" y1="120" x2="200" y2="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C4A574" />
              <stop offset="1" stopColor="#9A7348" />
            </linearGradient>
            <linearGradient id="faceRight" x1="240" y1="120" x2="340" y2="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A67C52" />
              <stop offset="1" stopColor="#6B4F2E" />
            </linearGradient>
            <linearGradient id="flapGrad" x1="210" y1="40" x2="210" y2="140" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F0E4D0" />
              <stop offset="1" stopColor="#D9C49A" />
            </linearGradient>
            <pattern id="flute" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
              <path d="M0 0h2v8H0z" fill="rgba(107,79,46,0.12)" />
            </pattern>
          </defs>

          <ellipse
            className="hero-box-shadow"
            cx="210"
            cy="322"
            rx="128"
            ry="16"
            fill="rgba(15,23,42,0.09)"
          />

          {/* flat blank */}
          <g className="hero-box-blank">
            <rect x="78" y="118" width="264" height="118" rx="2" fill="#E8D5B5" stroke="#6B4F2E" strokeWidth="1.4" />
            <path d="M144 118 V236 M210 118 V236 M276 118 V236" stroke="#9A7348" strokeWidth="1.1" />
            <path
              d="M78 148 H342 M78 206 H342"
              stroke="#6B4F2E"
              strokeWidth="1"
              strokeDasharray="5 4"
              opacity="0.5"
            />
            <path d="M78 118 H58 V236 H78" fill="#D4BC8E" stroke="#6B4F2E" strokeWidth="1.2" />
          </g>

          <g className="hero-box-iso">
            {/* body walls */}
            <g className="hero-box-face hero-box-face-left">
              <path d="M210 158 L102 108 L102 248 L210 308 Z" fill="url(#faceLeft)" />
              <path d="M210 158 L102 108 L102 248 L210 308 Z" fill="url(#flute)" />
            </g>
            <g className="hero-box-face hero-box-face-right">
              <path d="M210 158 L318 108 L318 248 L210 308 Z" fill="url(#faceRight)" />
              <path d="M210 158 L318 108 L318 248 L210 308 Z" fill="url(#flute)" opacity="0.45" />
            </g>

            {/* inner floor hint */}
            <g className="hero-box-face hero-box-face-floor">
              <path
                d="M210 158 L145 128 L210 188 L275 128 Z"
                fill="#C9B089"
                opacity="0.55"
              />
            </g>

            {/* two major top flaps, open */}
            <g className="hero-box-face hero-box-flap-left">
              <path
                d="M102 108 L210 158 L175 58 L85 48 Z"
                fill="url(#flapGrad)"
                stroke="#6B4F2E"
                strokeWidth="1.1"
                opacity="0.95"
              />
              <path
                d="M102 108 L210 158"
                stroke="#6B4F2E"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.45"
              />
            </g>
            <g className="hero-box-face hero-box-flap-right">
              <path
                d="M210 158 L318 108 L335 48 L245 58 Z"
                fill="url(#flapGrad)"
                stroke="#6B4F2E"
                strokeWidth="1.1"
                opacity="0.92"
              />
              <path
                d="M210 158 L318 108"
                stroke="#6B4F2E"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.45"
              />
            </g>

            {/* rim / crease */}
            <path d="M102 108 L210 158 L318 108" stroke="#6B4F2E" strokeWidth="1.2" opacity="0.4" />
            <path d="M210 158 L210 308" stroke="#6B4F2E" strokeWidth="1.4" opacity="0.4" />

            {/* edge labels */}
            <g className="hero-box-dims">
              {/* В — height (front vertical edge) */}
              <text
                x="198"
                y="238"
                fill="#6B4F2E"
                fontSize="13"
                fontWeight="600"
                fontFamily="ui-sans-serif, system-ui"
              >
                В
              </text>
              {/* Ш — width (left bottom edge) */}
              <text
                x="128"
                y="292"
                fill="#6B4F2E"
                fontSize="13"
                fontWeight="600"
                fontFamily="ui-sans-serif, system-ui"
              >
                Ш
              </text>
              {/* Д — length (right bottom edge) */}
              <text
                x="268"
                y="292"
                fill="#6B4F2E"
                fontSize="13"
                fontWeight="600"
                fontFamily="ui-sans-serif, system-ui"
              >
                Д
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
