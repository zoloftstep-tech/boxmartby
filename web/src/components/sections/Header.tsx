"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { IconPhone } from "../icons";

const NAV = [
  { href: "#about", label: "О нас" },
  { href: "#catalog", label: "Каталог" },
  { href: "#sellers", label: "Селлерам" },
  { href: "#calculator", label: "Калькулятор" },
  { href: "#faq", label: "FAQ" },
  { href: "#faq-delivery", label: "Доставка" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        scrolled ? "bg-surface-elevated/95 border-b border-line backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="section-pad">
        <div className="container-site flex h-16 items-center justify-between gap-3 md:h-[4.5rem] md:gap-4">
          <a href="#top" className="focus-ring group flex shrink-0 cursor-pointer items-center gap-2.5 sm:gap-3">
            <Image
              src="/logo-mark.png"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
              priority
            />
            <span className="min-w-0">
              <span className="font-display block text-lg font-semibold tracking-tight text-ink md:text-xl">
                БОКСМАРТ
              </span>
              <span className="mt-0.5 hidden text-xs text-muted sm:block xl:hidden">
                Производство картонной упаковки в Минске
              </span>
            </span>
          </a>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-x-3.5 xl:flex 2xl:gap-x-5"
            aria-label="Основная навигация"
          >
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="focus-ring shrink-0 cursor-pointer whitespace-nowrap text-sm font-medium text-ink-soft transition-colors duration-200 hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a
              href="tel:+375296168169"
              className="focus-ring hidden cursor-pointer items-center gap-1.5 whitespace-nowrap text-sm font-medium text-ink xl:inline-flex"
            >
              <IconPhone className="h-4 w-4 shrink-0 text-cta" />
              +375 (29) 616-81-69
            </a>
            <a
              href="#calculator"
              className="focus-ring inline-flex cursor-pointer items-center rounded-md bg-cta px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cta-hover sm:px-3.5"
            >
              <span className="sm:hidden">Рассчитать</span>
              <span className="hidden sm:inline">Рассчитать стоимость</span>
            </a>
            <button
              type="button"
              className="focus-ring inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-line xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">Меню</span>
              <span className="flex w-4 flex-col gap-1">
                <span className={`h-0.5 bg-ink transition-transform duration-200 ${open ? "translate-y-1.5 rotate-45" : ""}`} />
                <span className={`h-0.5 bg-ink transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
                <span className={`h-0.5 bg-ink transition-transform duration-200 ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-line bg-surface-elevated xl:hidden">
          <nav className="section-pad flex flex-col gap-1 py-3" aria-label="Мобильная навигация">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="focus-ring cursor-pointer rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="tel:+375296168169"
              className="focus-ring mt-1 cursor-pointer rounded-md px-3 py-2.5 text-sm font-medium text-cta"
              onClick={() => setOpen(false)}
            >
              +375 (29) 616-81-69
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
