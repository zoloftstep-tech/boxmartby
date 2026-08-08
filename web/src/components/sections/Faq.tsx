"use client";

import { useId, useState } from "react";
import { FAQ_ITEMS } from "@/lib/site";
import { IconChevron } from "../icons";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" className="section-pad border-t border-line bg-surface-elevated py-20 md:py-28">
      <div className="container-site grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-kraft-dark">FAQ</p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Частые вопросы
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            Коротко о тиражах, печати, оснастке, оплате и доставке. Остальное — в заявке из калькулятора.
          </p>
        </div>

        <div className="divide-y divide-line border-y border-line">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = open === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;
            return (
              <div key={item.q}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    className="focus-ring flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : index)}
                  >
                    <span className="font-display text-base font-semibold text-ink sm:text-lg">
                      {item.q}
                    </span>
                    <IconChevron
                      className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="pb-5 pr-8 text-sm leading-relaxed text-ink-soft"
                >
                  {item.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
