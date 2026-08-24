"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  getCookieConsent,
  type CookieConsentValue,
} from "@/lib/cookie-consent";

const GTAG_ID = process.env.NEXT_PUBLIC_GTAG_ID ?? "AW-18383822231";

export function GoogleAnalytics() {
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);

  useEffect(() => {
    setConsent(getCookieConsent());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<CookieConsentValue>).detail;
      setConsent(detail);
    }
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, onChange);
  }, []);

  if (!GTAG_ID || consent !== "accepted") return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`} strategy="afterInteractive" />
      <Script id="gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GTAG_ID}');
        `}
      </Script>
    </>
  );
}
