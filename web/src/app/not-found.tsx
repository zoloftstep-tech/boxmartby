import Link from "next/link";
import { LandingShell } from "@/components/landing/LandingShell";

export default function NotFound() {
  return (
    <LandingShell>
      <section className="relative overflow-hidden kraft-texture">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
        <div className="section-pad relative">
          <div className="container-site max-w-xl pb-20 pt-14 text-center md:pb-28 md:pt-20">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-kraft-dark">404</p>
            <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Страница не найдена
            </h1>
            <p className="mt-5 text-base leading-relaxed text-ink-soft sm:text-lg">
              Такой страницы нет или она переехала. Вернитесь на главную или рассчитайте
              стоимость коробок в калькуляторе.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="focus-ring inline-flex cursor-pointer items-center rounded-md bg-cta px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cta-hover"
              >
                На главную
              </Link>
              <a
                href="/#calculator"
                className="focus-ring inline-flex cursor-pointer items-center rounded-md border border-line bg-surface-elevated px-5 py-3 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink/20"
              >
                Калькулятор
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted">
              <Link href="/korobki-kartonnye-minsk" className="focus-ring hover:text-ink">
                Коробки в Минске
              </Link>
              <Link href="/korobki-dlya-wildberries" className="focus-ring hover:text-ink">
                Коробки для Wildberries
              </Link>
              <Link href="/korobki-kartonnye-optom" className="focus-ring hover:text-ink">
                Коробки оптом
              </Link>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
