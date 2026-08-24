export const COOKIE_CONSENT_KEY = "boxmart-cookie-consent";

export type CookieConsentValue = "accepted" | "rejected";

export const COOKIE_CONSENT_CHANGE_EVENT = "boxmart-cookie-consent-change";

export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
}

export function setCookieConsent(value: CookieConsentValue): void {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: value }),
  );
}
