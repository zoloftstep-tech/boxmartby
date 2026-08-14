import Script from "next/script";

const SEND_TO =
  process.env.NEXT_PUBLIC_GTAG_CONVERSION ?? "AW-18383822231/KSu4CIi1gOAcEJe7i75E";

/** Google Ads conversion — только страница /spasibo. */
export function AdsConversionEvent() {
  if (!SEND_TO) return null;

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
