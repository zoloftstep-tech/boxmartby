"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { calculateQuote, fetchLiveCatalog } from "@/lib/api";
import type {
  BoxCategory,
  CalcItemResult,
  CalcSummary,
  CatalogMaterial,
  MaterialId,
  OurDie,
} from "@/lib/types";
import { blankTypesForCategory, type BlankTypeMeta } from "@/lib/pricing";
import { CalculatorForm } from "./CalculatorForm";
import { CalculatorResults } from "./CalculatorResults";
import { OrderModal } from "./OrderModal";
import {
  DEFAULT_SELF_LOCK_FORMULA,
  type DraftItem,
  FALLBACK_MATERIALS,
  FALLBACK_SELF_LOCK_TYPES,
  applyDieDims,
  defaultMaterialId,
  emptyItem,
  hasQuantityBelowMinimum,
  isComplete,
  toPayload,
} from "./calculator-draft";

export function Calculator() {
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [results, setResults] = useState<CalcItemResult[] | null>(null);
  const [summary, setSummary] = useState<CalcSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ourDies, setOurDies] = useState<OurDie[]>([]);
  const [materials, setMaterials] = useState<CatalogMaterial[]>(FALLBACK_MATERIALS);
  const [blankTypes, setBlankTypes] = useState<BlankTypeMeta[]>(FALLBACK_SELF_LOCK_TYPES);
  const seq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void fetchLiveCatalog()
      .then((data) => {
        if (cancelled) return;
        setOurDies(data.ourDies ?? []);
        const nextMaterials =
          Array.isArray(data.materials) && data.materials.length > 0
            ? data.materials
            : FALLBACK_MATERIALS;
        setMaterials(nextMaterials);
        const nextBlank = blankTypesForCategory(data.blankTypes, "selfLock");
        setBlankTypes(nextBlank.length ? nextBlank : FALLBACK_SELF_LOCK_TYPES);
      })
      .catch(() => {
        if (cancelled) return;
        setOurDies([]);
        setMaterials(FALLBACK_MATERIALS);
        setBlankTypes(FALLBACK_SELF_LOCK_TYPES);
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

  // Синхронизация марки с live-каталогом (reference / first, если текущей нет)
  useEffect(() => {
    if (!materials.length) return;
    const allowed = new Set(materials.map((m) => m.id));
    const fallback = defaultMaterialId(materials);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        category: item.category ?? "fourFlap",
        material: allowed.has(item.material) ? item.material : fallback,
        dieId: item.dieId ?? "",
        formulaTypeId: item.formulaTypeId ?? "",
      })),
    );
  }, [materials]);

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
      const enrichedItems = data.items.map((row, i) => {
        const draftItem = draft[i];
        if (!draftItem || row.formulaTypeId) return row;
        if (draftItem.category === "selfLock") {
          return {
            ...row,
            formulaTypeId: draftItem.formulaTypeId || DEFAULT_SELF_LOCK_FORMULA,
          };
        }
        return row;
      });
      setResults(enrichedItems);
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

  function updateNumeric(
    id: string,
    field: "length" | "width" | "height" | "quantity",
    value: string,
  ) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value.replace(/[^\d]/g, "") } : item,
      ),
    );
  }

  function updateCategory(id: string, category: BoxCategory) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (category === "ourDies") {
          return applyDieDims(
            { ...item, category, dieId: "", formulaTypeId: "" },
            ourDies[0],
          );
        }
        if (category === "selfLock") {
          return {
            ...item,
            category,
            dieId: "",
            formulaTypeId: item.formulaTypeId || DEFAULT_SELF_LOCK_FORMULA,
          };
        }
        return { ...item, category, dieId: "", formulaTypeId: "" };
      }),
    );
  }

  function updateDie(id: string, dieId: string) {
    const die = ourDies.find((d) => d.id === dieId);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? applyDieDims({ ...item, category: "ourDies" }, die) : item,
      ),
    );
  }

  function updateFormulaType(id: string, formulaTypeId: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, formulaTypeId } : item)),
    );
  }

  function updateMaterial(id: string, material: MaterialId) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, material } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem(defaultMaterialId(materials))]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.id !== id)));
  }

  const hasMinQtyViolation = hasQuantityBelowMinimum(items);
  const canOrder = Boolean(results && summary && !loading && !error && !hasMinQtyViolation);
  const hasOurDiesWithoutCatalog =
    items.some((item) => item.category === "ourDies") && ourDies.length === 0;

  return (
    <section id="calculator" className="section-pad border-t border-line bg-surface py-20 md:py-28">
      <div className="container-site">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-kraft-dark">
            Калькулятор
          </p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Рассчитайте стоимость онлайн
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            Укажите размеры, конструкцию, марку картона и тираж. Цены — оптовые, без НДС (если не
            указано иное). При необходимости штанц-формы стоимость оснастки согласуется отдельно.
          </p>
        </div>

        <CalculatorForm
          items={items}
          results={results}
          ourDies={ourDies}
          materials={materials}
          blankTypes={blankTypes}
          onUpdateNumeric={updateNumeric}
          onUpdateCategory={updateCategory}
          onUpdateDie={updateDie}
          onUpdateFormulaType={updateFormulaType}
          onUpdateMaterial={updateMaterial}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />

        <CalculatorResults
          summary={summary}
          loading={loading}
          error={error}
          canOrder={canOrder}
          hasMinQtyViolation={hasMinQtyViolation}
          hasOurDiesWithoutCatalog={hasOurDiesWithoutCatalog}
          onOrder={() => setModalOpen(true)}
        />
      </div>

      {modalOpen && results && summary && (
        <OrderModal
          results={results}
          summary={summary}
          items={items}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  );
}
