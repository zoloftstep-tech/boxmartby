"use client";

import { useId, useState } from "react";
import { IconChevron } from "../icons";

const FAQ_ITEMS = [
  {
    q: "Какой минимальный тираж?",
    a: "Работаем и с небольшими партиями для старта продаж, и с оптовыми объёмами. Точный минимум зависит от конструкции и необходимости штанц-формы. Онлайн-калькулятор считает стоимость коробок; если нужна новая штанц-форма — её цена согласуется отдельно.",
  },
  {
    q: "Делаете ли вы печать на коробках?",
    a: "Да, доступна флексопечать логотипа и маркировки. Количество цветов и тираж влияют на стоимость — укажите пожелание в комментарии к заявке.",
  },
  {
    q: "Сроки изготовления штанц-форм (ножей) для нестандартных размеров?",
    a: "Для типовых FEFCO-конструкций часто достаточно имеющегося оснащения. Нестандартные размеры могут потребовать изготовления штанц-формы — срок обычно от нескольких рабочих дней. В случае необходимости изготовления штанц-формы цена оснастки согласуется отдельно и не входит в онлайн-расчёт калькулятора.",
  },
  {
    q: "Как оплатить и получить заказ?",
    a: "Безналичный расчёт для юрлиц и ИП по договору. Самовывоз с производства в Минске или доставка по согласованию. Реквизиты и шаблон договора — в подвале сайта.",
  },
  {
    q: "Доставка",
    a: "Самовывоз с производства или доставка курьерской службой. Собственный транспорт — в планах.",
  },
];

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
