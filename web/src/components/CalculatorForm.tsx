"use client";

import { formatByn } from "@/lib/api";
import type { BoxCategory, CalcItemResult, CatalogMaterial, MaterialId, OurDie } from "@/lib/types";
import type { BlankTypeMeta } from "@/lib/pricing";
import { IconPlus, IconTrash } from "./icons";
import { MessengerLinks } from "./MessengerLinks";
import {
  DEFAULT_SELF_LOCK_FORMULA,
  type DraftItem,
  MIN_POSITION_QUANTITY_NOTICE,
  OUR_DIES_NOTICE,
  SPECIAL_RETAIL_NOTICE,
  draftDimWarnings,
  isQuantityBelowMinimum,
  isSpecialRetailDims,
  selfLockStockNotice,
} from "./calculator-draft";

type Props = {
  items: DraftItem[];
  results: CalcItemResult[] | null;
  ourDies: OurDie[];
  materials: CatalogMaterial[];
  blankTypes: BlankTypeMeta[];
  onUpdateNumeric: (
    id: string,
    field: "length" | "width" | "height" | "quantity",
    value: string,
  ) => void;
  onUpdateCategory: (id: string, category: BoxCategory) => void;
  onUpdateDie: (id: string, dieId: string) => void;
  onUpdateFormulaType: (id: string, formulaTypeId: string) => void;
  onUpdateMaterial: (id: string, material: MaterialId) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
};

export function CalculatorForm({
  items,
  results,
  ourDies,
  materials,
  blankTypes,
  onUpdateNumeric,
  onUpdateCategory,
  onUpdateDie,
  onUpdateFormulaType,
  onUpdateMaterial,
  onAddItem,
  onRemoveItem,
}: Props) {
  return (
    <>
      <div className="mt-10 space-y-4">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <span>Нужна помощь? Напишите нам</span>
          <MessengerLinks />
        </p>
        {items.map((item, index) => {
          const result = results?.[index];
          const dimsLocked = item.category === "ourDies";
          const selfLockNotice = selfLockStockNotice(item, ourDies);
          return (
            <article
              key={item.id}
              className="rounded-lg border border-line bg-surface-elevated p-4 sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-semibold text-ink">
                    Позиция №{index + 1}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-muted">
                    {dimsLocked
                      ? "Размеры заданы штанцформой"
                      : "Внутренний размер коробки"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={items.length === 1}
                  onClick={() => onRemoveItem(item.id)}
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
                        onUpdateNumeric(item.id, field, e.target.value);
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
                    onChange={(e) => onUpdateCategory(item.id, e.target.value as BoxCategory)}
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
                      onChange={(e) => onUpdateDie(item.id, e.target.value)}
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

                {item.category === "selfLock" && (
                  <label className="block text-xs font-medium text-muted">
                    Тип развёртки FEFCO
                    <select
                      value={item.formulaTypeId || DEFAULT_SELF_LOCK_FORMULA}
                      onChange={(e) => onUpdateFormulaType(item.id, e.target.value)}
                      className="focus-ring mt-1.5 w-full cursor-pointer rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
                    >
                      {blankTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block text-xs font-medium text-muted">
                  Материал картона
                  <select
                    value={item.material}
                    onChange={(e) => onUpdateMaterial(item.id, e.target.value)}
                    className="focus-ring mt-1.5 w-full cursor-pointer rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
                  >
                    {materials.map((m) => (
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
                    onChange={(e) => onUpdateNumeric(item.id, "quantity", e.target.value)}
                    className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
                    placeholder="100"
                    autoComplete="off"
                  />
                </label>
              </div>

              {isQuantityBelowMinimum(item) && (
                <p
                  role="status"
                  className="mt-3 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950"
                >
                  {MIN_POSITION_QUANTITY_NOTICE}
                </p>
              )}

              {selfLockNotice && (
                <p
                  role="status"
                  className="mt-3 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950"
                >
                  {selfLockNotice}
                </p>
              )}

              {item.category === "ourDies" && (
                <p
                  role="status"
                  className="mt-3 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950"
                >
                  {OUR_DIES_NOTICE}
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
                    {result ? `${result.area_m2.toFixed(2)} м²` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Цена за 1 шт.</p>
                  <p className="mt-1 font-display text-lg font-semibold text-ink">
                    {formatByn(result?.price_per_unit_no_vat)}
                  </p>
                  <p className="text-[11px] text-muted">*цена без НДС</p>
                  {(() => {
                    const hint = result?.next_tier_hint;
                    if (!hint || hint.add_qty <= 0 || hint.add_qty > 50) return null;
                    const batch = Math.round(hint.next_qty * hint.unit_price_no_vat * 100) / 100;
                    return (
                      <p className="mt-2 text-xs leading-snug text-ink-soft">
                        Если добавите ещё{" "}
                        <span className="font-semibold text-ink">
                          {hint.add_qty.toLocaleString("ru-RU")}
                        </span>{" "}
                        шт (до {hint.next_qty.toLocaleString("ru-RU")}), цена будет{" "}
                        <span className="font-semibold text-ink">
                          {formatByn(hint.unit_price_no_vat)}
                        </span>
                        /шт, партия{" "}
                        <span className="font-semibold text-ink">{formatByn(batch)}</span>{" "}
                        без НДС
                      </p>
                    );
                  })()}
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
        onClick={onAddItem}
        className="focus-ring mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors duration-200 hover:border-cta hover:text-cta"
      >
        <IconPlus className="h-4 w-4" />
        Добавить позицию
      </button>
    </>
  );
}
