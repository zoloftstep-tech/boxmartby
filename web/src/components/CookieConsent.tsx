"use client";

import { useEffect, useState } from "react";
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentValue,
} from "@/lib/cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getCookieConsent() === null);
  }, []);

  function choose(value: CookieConsentValue) {
    setCookieConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Согласие на использование cookie"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-surface-elevated p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] sm:p-5"
    >
      <div className="container-site flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
          Мы используем cookie для аналитики и рекламы Google. Продолжая, вы можете
          принять их или отклонить — сайт останется доступен. Подробнее в{" "}
          <a
            href="/docs/personal-data-policy.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cta underline-offset-2 hover:underline"
          >
            Положении о политике
          </a>
          .
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="focus-ring inline-flex cursor-pointer items-center justify-center rounded-md border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink/20"
          >
            Отклонить
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="focus-ring inline-flex cursor-pointer items-center justify-center rounded-md bg-cta px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cta-hover"
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
