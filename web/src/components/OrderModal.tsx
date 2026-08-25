"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  formatByn,
  formatPhoneMask,
  phoneToE164,
  submitOrder,
} from "@/lib/api";
import type { CalcItemResult, CalcSummary } from "@/lib/types";
import { IconClose } from "./icons";
import {
  type DraftItem,
  MIN_ORDER_NOTICE,
  hasQuantityBelowMinimum,
} from "./calculator-draft";

export function OrderModal({
  results,
  summary,
  items,
  onClose,
}: {
  results: CalcItemResult[];
  summary: CalcSummary;
  items: DraftItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+375");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [personalDataConsent, setPersonalDataConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (inFlightRef.current) return;
    setFormError(null);

    if (!name.trim()) {
      setFormError("Укажите имя");
      return;
    }
    const e164 = phoneToE164(phone);
    if (!/^\+375\d{9}$/.test(e164)) {
      setFormError("Телефон в формате +375 (XX) XXX-XX-XX");
      return;
    }
    if (hasQuantityBelowMinimum(items)) {
      setFormError(MIN_ORDER_NOTICE);
      return;
    }
    if (!personalDataConsent) {
      setFormError("Нужно согласие на обработку персональных данных");
      return;
    }

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = `site:${crypto.randomUUID()}`;
    }
    inFlightRef.current = true;
    setSubmitting(true);
    try {
      await submitOrder(
        {
          name: name.trim(),
          phone: e164,
          email: email.trim() || undefined,
          comment: comment.trim() || undefined,
          personalDataConsent: true,
          items: results,
          summary: {
            total_no_vat: summary.total_no_vat,
            total_with_vat: summary.total_with_vat,
          },
        },
        { idempotencyKey: idempotencyKeyRef.current },
      );
      idempotencyKeyRef.current = null;
      router.push("/spasibo");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось отправить");
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-line bg-surface-elevated shadow-xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface-elevated px-5 py-4">
          <h3 id={titleId} className="font-display text-lg font-semibold text-ink">
            Оформление заявки
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring cursor-pointer rounded-md p-1.5 text-muted hover:text-ink"
            aria-label="Закрыть"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="rounded-md border border-line bg-surface p-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Сводка заказа</p>
            <ul className="mt-2 space-y-2">
              {results.map((item, i) => (
                <li
                  key={`${item.length}-${item.category}-${i}`}
                  className="flex justify-between gap-3 text-ink-soft"
                >
                  <span>
                    {item.length}×{item.width}×{item.height} мм · {item.category_label} ·{" "}
                    {item.material_label} · {item.quantity} шт.
                  </span>
                  <span className="shrink-0 font-medium text-ink">
                    {formatByn(item.total_price_no_vat)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-line pt-3 font-medium text-ink">
              <span>Без НДС / с НДС</span>
              <span>
                {formatByn(summary.total_no_vat)} / {formatByn(summary.total_with_vat)}
              </span>
            </div>
          </div>

          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <label className="block text-xs font-medium text-muted">
              Имя *
              <input
                ref={firstFieldRef}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
                autoComplete="name"
              />
            </label>
            <label className="block text-xs font-medium text-muted">
              Телефон *
              <input
                required
                value={phone}
                onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
                className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+375 (XX) XXX-XX-XX"
              />
            </label>
            <label className="block text-xs font-medium text-muted">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
                autoComplete="email"
              />
            </label>
            <label className="block text-xs font-medium text-muted">
              Комментарий менеджеру
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="focus-ring mt-1.5 w-full resize-y rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
              />
            </label>

            {formError && <p className="text-sm text-red-700">{formError}</p>}

            <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed text-muted">
              <input
                type="checkbox"
                checked={personalDataConsent}
                onChange={(e) => setPersonalDataConsent(e.target.checked)}
                className="focus-ring mt-0.5 h-4 w-4 shrink-0 rounded border-line text-cta"
              />
              <span>
                Согласен на обработку персональных данных согласно{" "}
                <a
                  href="/docs/personal-data-policy.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cta underline-offset-2 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Положению о политике
                </a>{" "}
                и{" "}
                <a
                  href="/docs/personal-data-terms.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cta underline-offset-2 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Условиям обработки
                </a>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !personalDataConsent}
              className="focus-ring inline-flex w-full cursor-pointer items-center justify-center rounded-md bg-cta px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cta-hover disabled:opacity-60"
            >
              {submitting ? "Отправка…" : "Отправить заказ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
