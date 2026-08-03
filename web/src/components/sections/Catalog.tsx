import Image from "next/image";

const TYPES = [
  {
    code: "0201",
    title: "Четырёхклапанная",
    use: "Транспортные и архивные коробки. Универсальный стандарт FEFCO для большинства грузов.",
    src: "/catalog/fefco-0201.png",
  },
  {
    code: "0415",
    title: "Лоток с откидными бортами",
    use: "Открытый доступ к содержимому. Для витрины, комплектации и транспортировки штучного товара.",
    src: "/catalog/fefco-0415.png",
  },
  {
    code: "0427",
    title: "Самосборная с крышкой",
    use: "Быстрая сборка без скоб, усиленные стенки. Для розницы, обуви и подарочных отправлений.",
    src: "/catalog/fefco-0427.png",
  },
  {
    code: "0470",
    title: "Самосборная с откидной крышкой",
    use: "Удобная повторная открываемость. Для маркетплейс-отгрузок и серийной комплектации.",
    src: "/catalog/fefco-0470.png",
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
              Схемы раскроя и собранного вида: линии реза, беговки и размеры. Подберём конструкцию
              под товар, способ отгрузки и требования маркетплейса.
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
          {TYPES.map(({ code, title, use, src }) => (
            <li
              key={code}
              className="group overflow-hidden rounded-lg border border-line bg-surface transition-colors duration-200 hover:border-kraft/40"
            >
              <div className="border-b border-line bg-[#F7F3EC] px-3 py-4 sm:px-4">
                <Image
                  src={src}
                  alt={`Схема FEFCO ${code}: раскрой и собранный вид`}
                  width={1400}
                  height={380}
                  className="mx-auto h-auto w-full max-w-lg object-contain"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
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
