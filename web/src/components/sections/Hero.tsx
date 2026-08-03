import { IsometricBox } from "../visuals/IsometricBox";

const STATS = [
  { value: "FEFCO", label: "стандарты конструкций" },
  { value: "Т-22 / Т-23", label: "марки гофрокартона" },
  { value: "от 1 дня", label: "типовые тиражи" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden kraft-texture pt-24 md:pt-28">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
      <div className="absolute inset-y-0 right-0 hidden w-1/2 opacity-40 lg:block">
        <div className="corrugated-band absolute inset-y-12 right-0 w-3 opacity-60" />
      </div>

      <div className="section-pad relative">
        <div className="container-site grid items-center gap-10 pb-16 pt-8 lg:grid-cols-2 lg:gap-12 lg:pb-24 lg:pt-12">
          <div className="animate-[fade-up_0.7s_ease-out_both]">
            <p className="font-display text-sm font-medium uppercase tracking-[0.18em] text-kraft-dark">
              ООО «БОКСМАРТ»
            </p>
            <h1 className="font-display mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
              Надежная упаковка для вашего бизнеса напрямую от производителя
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
              Изготавливаем картонные коробки любых размеров. Точная геометрия, прочный
              гофрокартон и честные цены без посредников.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#calculator"
                className="focus-ring inline-flex cursor-pointer items-center rounded-md bg-cta px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-cta-hover"
              >
                Рассчитать мою коробку
              </a>
              <a
                href="#catalog"
                className="focus-ring inline-flex cursor-pointer items-center rounded-md border border-line bg-surface-elevated px-5 py-3 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink/20"
              >
                Смотреть конструкции
              </a>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-line/80 pt-8">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-sm font-semibold text-ink sm:text-base">{stat.value}</dt>
                  <dd className="mt-1 text-xs text-muted sm:text-sm">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative animate-[fade-up_0.7s_ease-out_0.12s_both]">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <IsometricBox className="w-full drop-shadow-sm motion-safe:animate-[float-soft_6s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
