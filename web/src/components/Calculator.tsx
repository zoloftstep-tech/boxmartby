"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  calculateQuote,
  fetchLiveCatalog,
  formatByn,
  formatPhoneMask,
  phoneToE164,
  submitOrder,
} from "@/lib/api";
import type { BoxCategory, CalcItemResult, CalcSummary, MaterialId, OurDie } from "@/lib/types";
import { dimWarningsForItem, MIN_DIMS } from "@/lib/pricing";
import { IconClose, IconPlus, IconTrash } from "./icons";

type DraftItem = {
  id: string;
  length: string;
  width: string;
  height: string;
  quantity: string;
  category: BoxCategory;
  material: MaterialId;
  dieId: string;
};

function emptyItem(): DraftItem {
  return {
    id: crypto.randomUUID(),
    length: "",
    width: "",
    height: "",
    quantity: "100",
    category: "fourFlap",
    material: "t22",
    dieId: "",
  };
}

function applyDieDims(item: DraftItem, die: OurDie | undefined): DraftItem {
  if (!die) return { ...item, dieId: "", length: "", width: "", height: "" };
  return {
    ...item,
    dieId: die.id,
    length: String(die.A),
    width: String(die.B),
    height: String(die.H),
  };
}

function toPayload(items: DraftItem[]) {
  return items.map((item) => ({
    length: Number(item.length),
    width: Number(item.width),
    height: Number(item.height),
    quantity: Number(item.quantity),
    category: item.category ?? "fourFlap",
    material: item.material ?? "t22",
    dieId: item.category === "ourDies" && item.dieId ? item.dieId : undefined,
  }));
}

function isComplete(item: DraftItem) {
  if (item.category === "ourDies") {
    if (!item.dieId) return false;
  }
  const vals = [item.length, item.width, item.height, item.quantity].map(Number);
  return vals.every((n) => Number.isFinite(n) && n > 0);
}

/** 600×400×400 в любом порядке полей — инф. предупреждение (п. 4.3), цена не скрывается */
function isSpecialRetailDims(length: string, width: string, height: string): boolean {
  const dims = [Number(length), Number(width), Number(height)].sort((a, b) => a - b);
  return dims[0] === 400 && dims[1] === 400 && dims[2] === 600;
}

const SPECIAL_RETAIL_NOTICE =
  "Это специальная розничная позиция. Пожалуйста, позвоните или напишите нам, и мы предложим вам наиболее актуальную и выгодную цену. Вы также можете оставить заявку через форму — менеджер уточнит условия.";

const OUR_DIES_NOTICE =
  "Нет нужного размера? Выберите «Самосборные», укажите параметры и оставьте заявку — менеджер согласует детали.";

const SELF_LOCK_NOTICE =
  "Этого формата нет в наличии. Выберите «Наши штанцформы» или оставьте заявку — менеджер согласует детали.";

function draftDimWarnings(item: DraftItem): string[] {
  if (item.category !== "fourFlap" || !isComplete(item)) return [];
  return dimWarningsForItem(
    {
      length: Number(item.length),
      width: Number(item.width),
      height: Number(item.height),
      category: item.category,
    },
    MIN_DIMS,
  );
}

const SELECTABLE_MATERIALS: { id: MaterialId; label: string }[] = [
  { id: "t22", label: "Т-22" },
  { id: "t23", label: "Т-23" },
];

export function Calculator() {
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [results, setResults] = useState<CalcItemResult[] | null>(null);
  const [summary, setSummary] = useState<CalcSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ourDies, setOurDies] = useState<OurDie[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void fetchLiveCatalog()
      .then((data) => {
        if (!cancelled) setOurDies(data.ourDies ?? []);
      })
      .catch(() => {
        if (!cancelled) setOurDies([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Когда каталог подгрузился — заполнить выбранные ourDies без dieId
  useEffect(() => {
    if (!ourDies.length) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.category !== "ourDies") return item;
        if (item.dieId && ourDies.some((d) => d.id === item.dieId)) {
          const die = ourDies.find((d) => d.id === item.dieId)!;
          return applyDieDims(item, die);
        }
        return applyDieDims(item, ourDies[0]);
      }),
    );
  }, [ourDies]);

  // HMR / старый state мог быть без category/material — дозаполняем; материал только из SELECTABLE
  useEffect(() => {
    const allowed = new Set(SELECTABLE_MATERIALS.map((m) => m.id));
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        category: item.category ?? "fourFlap",
        material: allowed.has(item.material) ? item.material : "t22",
        dieId: item.dieId ?? "",
      })),
    );
  }, []);

  const recalculate = useCallback(async (draft: DraftItem[]) => {
    const hasEmptyDies = draft.some((item) => item.category === "ourDies" && !item.dieId);
    if (hasEmptyDies || !draft.every(isComplete)) {
      setResults(null);
      setSummary(null);
      setError(null);
      return;
    }

    const requestId = ++seq.current;
    setLoading(true);
    setError(null);

    try {
      const data = await calculateQuote(toPayload(draft));
      if (requestId !== seq.current) return;
      setResults(data.items);
      setSummary(data.summary);
    } catch (err) {
      if (requestId !== seq.current) return;
      setResults(null);
      setSummary(null);
      setError(err instanceof Error ? err.message : "Ошибка расчёта");
    } finally {
      if (requestId === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void recalculate(items);
    }, 350);
    return () => window.clearTimeout(t);
  }, [items, recalculate]);

  function updateNumeric(id: string, field: "length" | "width" | "height" | "quantity", value: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value.replace(/[^\d]/g, "") } : item)),
    );
  }

  function updateCategory(id: string, category: BoxCategory) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (category === "ourDies") {
          return applyDieDims({ ...item, category, dieId: "" }, ourDies[0]);
        }
        return { ...item, category, dieId: "" };
      }),
    );
  }

  function updateDie(id: string, dieId: string) {
    const die = ourDies.find((d) => d.id === dieId);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? applyDieDims({ ...item, category: "ourDies" }, die) : item)),
    );
  }

  function updateMaterial(id: string, material: MaterialId) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, material } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.id !== id)));
  }

  const canOrder = Boolean(results && summary && !loading && !error);
  const hasOurDiesWithoutCatalog = items.some((item) => item.category === "ourDies") && ourDies.length === 0;

  return (
    <section id="calculator" className="section-pad border-t border-line bg-surface py-20 md:py-28">
      <div className="container-site">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-kraft-dark">Калькулятор</p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Рассчитайте стоимость онлайн
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            Укажите размеры, конструкцию, марку картона и тираж. Цены — оптовые, без НДС (если не
            указано иное). При необходимости штанц-формы стоимость оснастки согласуется отдельно.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {items.map((item, index) => {
            const result = results?.[index];
            const dimsLocked = item.category === "ourDies";
            return (
              <article
                key={item.id}
                className="rounded-lg border border-line bg-surface-elevated p-4 sm:p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-display text-sm font-semibold text-ink">
                    Позиция №{index + 1}
                  </h3>
                  <button
                    type="button"
                    disabled={items.length === 1}
                    onClick={() => removeItem(item.id)}
                    className="focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted transition-colors duration-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Удалить позицию ${index + 1}`}
                  >
                    <IconTrash className="h-4 w-4" />
                    Удалить
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    [
                      ["length", "Длина, мм", "400"],
                      ["width", "Ширина, мм", "300"],
                      ["height", "Высота, мм", "250"],
                    ] as const
                  ).map(([field, label, placeholder]) => (
                    <label key={field} className="block text-xs font-medium text-muted">
                      {label}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item[field]}
                        readOnly={dimsLocked}
                        aria-readonly={dimsLocked}
                        title={dimsLocked ? "Размеры заданы штанцформой" : undefined}
                        onChange={(e) => {
                          if (dimsLocked) return;
                          updateNumeric(item.id, field, e.target.value);
                        }}
                        className={`focus-ring mt-1.5 w-full rounded-md border border-line px-3 py-2.5 text-sm text-ink ${
                          dimsLocked ? "cursor-not-allowed bg-slate-50 text-ink-soft" : "bg-white"
                        }`}
                        placeholder={placeholder}
                        autoComplete="off"
                      />
                    </label>
                  ))}

                  <label className="block text-xs font-medium text-muted">
                    Категория коробки
                    <select
                      value={item.category}
                      onChange={(e) => updateCategory(item.id, e.target.value as BoxCategory)}
                      className="focus-ring mt-1.5 w-full cursor-pointer rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
                    >
                      <option value="fourFlap">Четырёхклапанная</option>
                      <option value="selfLock">Самосборная</option>
                      <option value="ourDies">Наши штанцформы</option>
                    </select>
                  </label>

                  {item.category === "ourDies" && (
                    <label className="block text-xs font-medium text-muted">
                      Штанцформа
                      <select
                        value={item.dieId}
                        onChange={(e) => updateDie(item.id, e.target.value)}
                        disabled={ourDies.length === 0}
                        className="focus-ring mt-1.5 w-full cursor-pointer rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink disabled:cursor-not-allowed disabled:bg-slate-50"
                      >
                        {ourDies.length === 0 ? (
                          <option value="">Нет доступных штанцформ</option>
                        ) : (
                          ourDies.map((die) => (
                            <option key={die.id} value={die.id}>
                              {die.name} ({die.A}×{die.B}×{die.H})
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                  )}

                  <label className="block text-xs font-medium text-muted">
                    Материал картона
                    <select
                      value={item.material}
                      onChange={(e) => updateMaterial(item.id, e.target.value as MaterialId)}
                      className="focus-ring mt-1.5 w-full cursor-pointer rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
                    >
                      {SELECTABLE_MATERIALS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-medium text-muted">
                    Тираж, шт.
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(e) => updateNumeric(item.id, "quantity", e.target.value)}
                      className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
                      placeholder="100"
                      autoComplete="off"
                    />
                  </label>
                </div>

                {item.category === "ourDies" && (
                  <p
                    role="status"
                    className="mt-3 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950"
                  >
                    {OUR_DIES_NOTICE}
                  </p>
                )}

                {item.category === "selfLock" && (
                  <p
                    role="status"
                    className="mt-3 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950"
                  >
                    {SELF_LOCK_NOTICE}
                  </p>
                )}

                <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted">Внутренний объём</p>
                    <p className="mt-1 font-display text-lg font-semibold text-ink">
                      {result ? `${result.volume_liters.toFixed(1)} л` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Площадь заготовки</p>
                    <p className="mt-1 font-display text-lg font-semibold text-ink">
                      {result ? `${result.area_m2.toFixed(4)} м²` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Цена за 1 шт.</p>
                    <p className="mt-1 font-display text-lg font-semibold text-ink">
                      {formatByn(result?.price_per_unit_no_vat)}
                    </p>
                    <p className="text-[11px] text-muted">*цена без НДС</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Итого за тираж</p>
                    <p className="mt-1 font-display text-lg font-semibold text-ink">
                      {formatByn(result?.total_price_no_vat)}
                    </p>
                    <p className="text-[11px] text-muted">*цена без НДС</p>
                  </div>
                </div>

                {isSpecialRetailDims(item.length, item.width, item.height) && (
                  <p
                    role="status"
                    className="mt-4 rounded-md border border-kraft/30 bg-kraft-soft/50 px-3 py-2.5 text-sm leading-relaxed text-kraft-dark"
                  >
                    {SPECIAL_RETAIL_NOTICE}
                  </p>
                )}

                {draftDimWarnings(item).length > 0 && (
                  <p
                    role="status"
                    className="mt-4 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950"
                  >
                    {draftDimWarnings(item).map((w) => (
                      <span key={w} className="block">
                        ⚠ {w}
                      </span>
                    ))}
                  </p>
                )}
              </article>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="focus-ring mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors duration-200 hover:border-cta hover:text-cta"
        >
          <IconPlus className="h-4 w-4" />
          Добавить позицию
        </button>

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
            {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          </div>

          <button
            type="button"
            disabled={!canOrder}
            onClick={() => setModalOpen(true)}
            className="focus-ring inline-flex cursor-pointer items-center justify-center rounded-md bg-cta px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Оформить заявку
          </button>
        </div>
      </div>

      {modalOpen && results && summary && (
        <OrderModal results={results} summary={summary} onClose={() => setModalOpen(false)} />
      )}
    </section>
  );
}

function OrderModal({
  results,
  summary,
  onClose,
}: {
  results: CalcItemResult[];
  summary: CalcSummary;
  onClose: () => void;
}) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+375");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

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

    setSubmitting(true);
    try {
      await submitOrder({
        name: name.trim(),
        phone: e164,
        email: email.trim() || undefined,
        comment: comment.trim() || undefined,
        items: results,
        summary: {
          total_no_vat: summary.total_no_vat,
          total_with_vat: summary.total_with_vat,
        },
      });
      setDone(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось отправить");
    } finally {
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
          {done ? (
            <p className="py-6 text-center text-base leading-relaxed text-ink">
              Спасибо за заявку! Наш менеджер свяжется с вами в течение 15 минут.
            </p>
          ) : (
            <>
              <div className="rounded-md border border-line bg-surface p-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Сводка заказа</p>
                <ul className="mt-2 space-y-2">
                  {results.map((item, i) => (
                    <li key={`${item.length}-${item.category}-${i}`} className="flex justify-between gap-3 text-ink-soft">
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="focus-ring inline-flex w-full cursor-pointer items-center justify-center rounded-md bg-cta px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cta-hover disabled:opacity-60"
                >
                  {submitting ? "Отправка…" : "Отправить заказ"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
