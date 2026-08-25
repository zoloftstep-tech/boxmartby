import Link from "next/link";
import {
  buildLandingJsonLd,
  getLanding,
  getRelatedLandings,
  type LandingSlug,
} from "@/lib/landings";
import { LandingShell } from "./LandingShell";

export function LandingContent({ slug }: { slug: LandingSlug }) {
  const page = getLanding(slug);
  const related = getRelatedLandings(slug);
  const jsonLd = buildLandingJsonLd(page);

  return (
    <LandingShell>
      {jsonLd.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      <section className="relative overflow-hidden kraft-texture">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
        <div className="section-pad relative">
          <div className="container-site max-w-3xl pb-14 pt-10 md:pb-20 md:pt-14">
            <nav className="text-sm text-muted" aria-label="Хлебные крошки">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="focus-ring cursor-pointer hover:text-ink">
                    Главная
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-ink-soft">{page.title}</li>
              </ol>
            </nav>

            <p className="mt-8 text-sm font-medium uppercase tracking-[0.16em] text-kraft-dark">
              {page.eyebrow}
            </p>
            <h1 className="font-display mt-3 text-3xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
              {page.h1}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-ink-soft sm:text-lg">{page.intro}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/#calculator"
                className="focus-ring inline-flex cursor-pointer items-center rounded-md bg-cta px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cta-hover"
              >
                {page.ctaLabel}
              </Link>
              <Link
                href="/#catalog"
                className="focus-ring inline-flex cursor-pointer items-center rounded-md border border-line bg-surface-elevated px-5 py-3 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink/20"
              >
                Смотреть конструкции
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad border-t border-line bg-surface-elevated py-16 md:py-24">
        <div className="container-site max-w-3xl space-y-12">
          {page.sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {section.title}
              </h2>
              <div className="mt-4 space-y-3 text-base leading-relaxed text-ink-soft">
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 48)}>{p}</p>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-md border border-line bg-surface px-5 py-6 sm:px-6">
            <p className="font-display text-lg font-semibold text-ink">Готовы посчитать партию?</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Укажите размеры и тираж в калькуляторе — получите цену за штуку и оставьте заявку.
            </p>
            <Link
              href="/#calculator"
              className="focus-ring mt-4 inline-flex cursor-pointer items-center rounded-md bg-cta px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cta-hover"
            >
              {page.ctaLabel}
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad border-t border-line py-14 md:py-20">
        <div className="container-site">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Смотрите также
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.path}
                  className="focus-ring block cursor-pointer rounded-md border border-line bg-surface-elevated p-4 transition-colors duration-200 hover:border-ink/20"
                >
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-kraft-dark">
                    {item.eyebrow}
                  </span>
                  <span className="font-display mt-2 block text-base font-semibold text-ink">
                    {item.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </LandingShell>
  );
}
