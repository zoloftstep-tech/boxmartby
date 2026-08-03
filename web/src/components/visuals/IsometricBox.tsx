"use client";

import { useEffect, useState } from "react";

type IsometricBoxProps = {
  className?: string;
};

/**
 * Hero box: soft assemble from flat blank → closed CSS-3D box,
 * then continuous 360° yaw. Honors prefers-reduced-motion.
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
    const id = window.setTimeout(() => setSpinning(true), 3200);
    return () => window.clearTimeout(id);
  }, [assembled, reduceMotion]);

  return (
    <div
      className={`hero-box ${assembled ? "is-assembled" : ""} ${spinning ? "is-spinning" : ""} ${className}`}
      aria-hidden
    >
      {/* flat blank start */}
      <div className="hero-box-blank" aria-hidden>
        <div className="hero-box-blank-panel" />
        <div className="hero-box-blank-glue" />
        <div className="hero-box-blank-score hero-box-blank-score-v1" />
        <div className="hero-box-blank-score hero-box-blank-score-v2" />
        <div className="hero-box-blank-score hero-box-blank-score-v3" />
        <div className="hero-box-blank-score hero-box-blank-score-h1" />
        <div className="hero-box-blank-score hero-box-blank-score-h2" />
      </div>

      <div className="hero-box-stage">
        <div className="hero-box-shadow" />
        <div className="hero-box-cube">
          <div className="hero-box-side hero-box-front">
            <span className="hero-box-label hero-box-label-d">Д</span>
            <span className="hero-box-label hero-box-label-v">В</span>
          </div>
          <div className="hero-box-side hero-box-back" />
          <div className="hero-box-side hero-box-right">
            <span className="hero-box-label hero-box-label-w">Ш</span>
          </div>
          <div className="hero-box-side hero-box-left" />
          <div className="hero-box-side hero-box-top">
            <span className="hero-box-crease hero-box-crease-h" />
            <span className="hero-box-crease hero-box-crease-v" />
          </div>
          <div className="hero-box-side hero-box-bottom" />
        </div>
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
