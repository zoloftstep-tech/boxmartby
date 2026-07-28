import { Fefco0201, Fefco0409, Fefco0427, FefcoTray } from "../visuals/FefcoDiagrams";

const TYPES = [
  {
    code: "0201",
    title: "Четырёхклапанная",
    use: "Транспортные и архивные коробки. Универсальный стандарт FEFCO для большинства грузов.",
    Diagram: Fefco0201,
  },
  {
    code: "0427",
    title: "Самосборная",
    use: "Быстрая сборка без скоб. Удобна для розницы, обувных и подарочных отправлений.",
    Diagram: Fefco0427,
  },
  {
    code: "0409",
    title: "С автодном",
    use: "Дно собирается одним движением. Для серийной комплектации и маркетплейс-отгрузок.",
    Diagram: Fefco0409,
  },
  {
    code: "Лоток",
    title: "Открытый лоток",
    use: "Витринные и транспортные лотки под продукцию, требующую быстрого доступа.",
    Diagram: FefcoTray,
  },
];

export function Catalog() {
  return (
    <section id="catalog" className="section-pad border-t border-line bg-surface-elevated py-20 md:py-28">
      <div className="container-site">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-kraft-dark">Каталог</p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Базовые конструкции FEFCO
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Векторные схемы раскроя: линии реза, беговки и клапаны. Подберём конструкцию под
              товар, способ отгрузки и требования маркетплейса.
            </p>
          </div>
          <a
            href="#calculator"
            className="focus-ring inline-flex cursor-pointer self-start text-sm font-semibold text-cta transition-colors duration-200 hover:text-cta-hover md:self-auto"
          >
            Нужен нестандарт — рассчитать →
          </a>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {TYPES.map(({ code, title, use, Diagram }) => (
            <li
              key={code}
              className="group overflow-hidden rounded-lg border border-line bg-surface transition-colors duration-200 hover:border-kraft/40"
            >
              <div className="border-b border-line bg-[#F7F3EC] px-4 pt-4">
                <Diagram className="mx-auto h-36 w-full max-w-sm" />
              </div>
              <div className="p-5 md:p-6">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-xs font-semibold uppercase tracking-wider text-cta">
                    {code}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{use}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
