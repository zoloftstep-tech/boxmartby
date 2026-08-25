"use client";

import { formatByn } from "@/lib/api";
import type { CalcSummary } from "@/lib/types";
import { MIN_ORDER_NOTICE } from "./calculator-draft";

type Props = {
  summary: CalcSummary | null;
  loading: boolean;
  error: string | null;
  canOrder: boolean;
  hasMinQtyViolation: boolean;
  hasOurDiesWithoutCatalog: boolean;
  onOrder: () => void;
};

export function CalculatorResults({
  summary,
  loading,
  error,
  canOrder,
  hasMinQtyViolation,
  hasOurDiesWithoutCatalog,
  onOrder,
}: Props) {
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-lg border border-line bg-surface-elevated p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">Итого по заказу</p>
        <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <p className="text-sm text-ink-soft">Без НДС</p>
            <p className="font-display text-2xl font-semibold text-ink">
              {loading ? "…" : formatByn(summary?.total_no_vat)}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-soft">С НДС 20%</p>
            <p className="font-display text-2xl font-semibold text-ink">
              {loading ? "…" : formatByn(summary?.total_with_vat)}
            </p>
          </div>
        </div>
        {hasOurDiesWithoutCatalog && (
          <p className="mt-2 text-sm text-amber-800">Штанцформы пока не добавлены</p>
        )}
        {hasMinQtyViolation && <p className="mt-2 text-sm text-amber-800">{MIN_ORDER_NOTICE}</p>}
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>

      <button
        type="button"
        disabled={!canOrder}
        onClick={onOrder}
        className="focus-ring inline-flex cursor-pointer items-center justify-center rounded-md bg-cta px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        Оформить заявку
      </button>
    </div>
  );
}
