import { IconCarton, IconCheck, IconPrint } from "../icons";

const POINTS = [
  "Подбор марки картона под вес и способ доставки — без перерасхода материала",
  "Габариты под требования Wildberries и Ozon к транспортной упаковке",
  "Флексопечать логотипа для узнаваемости бренда на складе и у покупателя",
];

const GRADES = [
  {
    grade: "Т-22",
    profile: "Трёхслойный",
    best: "Лёгкие товары, где важна экономия материала без потери базовой защиты",
    strength: "Легче и дешевле Т-23",
  },
  {
    grade: "Т-21",
    profile: "Трёхслойный лёгкий",
    best: "Очень лёгкие товары, мелкая фурнитура, расходники — когда важна минимальная толщина и цена",
    strength: "Легче и дешевле Т-22",
  },
  {
    grade: "Т-23",
    profile: "Трёхслойный",
    best: "Лёгкие и средние товары, одежда, аксессуары, косметика",
    strength: "Оптимальное соотношение цена / защита",
  },
  {
    grade: "Профиль Е",
    profile: "Микрогофра (E)",
    best: "Компактная упаковка, аккуратный внешний вид, удобна под печать логотипа",
    strength: "Тонкий профиль волны — не отдельная марка в калькуляторе",
  },
];

export function Sellers() {
  return (
    <section id="sellers" className="section-pad relative overflow-hidden border-t border-line py-20 md:py-28">
      <div className="absolute inset-0 kraft-texture opacity-70" />
      <div className="container-site relative">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-kraft-dark">
              Маркетплейсы
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Работаем с требованиями Wildberries и Ozon
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              Помогаем селлерам закрыть упаковку под FBO/FBS: нужная марка картона, точный
              внутренний размер и опциональная флексопечать — без лишней толщины и переплат.
            </p>

            <ul className="mt-8 space-y-4">
              {POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                  <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-cta" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-md border border-line bg-surface-elevated px-3 py-2 text-xs font-medium text-ink-soft">
                <IconCarton className="h-4 w-4 text-kraft" />
                Марки Т-22 · Т-21 · Т-23
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-line bg-surface-elevated px-3 py-2 text-xs font-medium text-ink-soft">
                <IconPrint className="h-4 w-4 text-kraft" />
                Флексопечать логотипа
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-line bg-surface-elevated">
            <div className="border-b border-line px-5 py-4">
              <h3 className="font-display text-base font-semibold text-ink">Сравнение марок картона</h3>
              <p className="mt-1 text-sm text-muted">Подбор без перерасхода под ваш SKU</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Марка</th>
                    <th className="px-5 py-3 font-medium">Профиль</th>
                    <th className="px-5 py-3 font-medium">Применение</th>
                  </tr>
                </thead>
                <tbody>
                  {GRADES.map((row) => (
                    <tr key={row.grade} className="border-t border-line align-top">
                      <td className="px-5 py-4">
                        <span className="font-display font-semibold text-ink">{row.grade}</span>
                        <p className="mt-1 text-xs text-muted">{row.strength}</p>
                      </td>
                      <td className="px-5 py-4 text-ink-soft">{row.profile}</td>
                      <td className="px-5 py-4 text-ink-soft">{row.best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
