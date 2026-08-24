"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getCookieConsent } from "@/lib/cookie-consent";

const SEND_TO =
  process.env.NEXT_PUBLIC_GTAG_CONVERSION ?? "AW-18383822231/KSu4CIi1gOAcEJe7i75E";

/** Google Ads conversion — только /spasibo и только при принятых cookie. */
export function AdsConversionEvent() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(getCookieConsent() === "accepted");
  }, []);

  if (!SEND_TO || !allowed) return null;

  return (
    <Script id="gtag-conversion" strategy="afterInteractive">
      {`
        function fireAdsConversion() {
          if (typeof gtag === 'function') {
            gtag('event', 'conversion', {
              send_to: '${SEND_TO}',
              value: 1.0,
              currency: 'USD'
            });
            return;
          }
          setTimeout(fireAdsConversion, 50);
        }
        fireAdsConversion();
      `}
    </Script>
  );
}
