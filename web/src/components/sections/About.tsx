import { IconCalc, IconFactory, IconRuler, IconStack } from "../icons";
import { CorrugatedCrossSection } from "../visuals/IsometricBox";

const FEATURES = [
  {
    icon: IconFactory,
    title: "Собственное производство",
    text: "Полный контроль качества без переплат посредникам — от раскроя до отгрузки.",
  },
  {
    icon: IconRuler,
    title: "Точность размеров",
    text: "Идеальная геометрия реза и беговки: коробка садится на товар без люфтов.",
  },
  {
    icon: IconStack,
    title: "Гибкие тиражи",
    text: "Условия для малого бизнеса и оптовых партий — от пробных партий до сезонных объёмов.",
  },
  {
    icon: IconCalc,
    title: "Прозрачное ценообразование",
    text: "Мгновенный расчёт онлайн: видите объём и стоимость до звонка менеджеру.",
  },
];

export function About() {
  return (
    <section id="about" className="section-pad border-t border-line bg-surface py-20 md:py-28">
      <div className="container-site">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-kraft-dark">О нас</p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Производитель, а не перекупщик
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">
            ООО «БОКСМАРТ» — производство гофротарной упаковки в Минске. Работаем с малым
            бизнесом и селлерами маркетплейсов: точные размеры, понятные сроки, цена без лишних звеньев.
            Для физических лиц возможна оплата через ЕРИП.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-md border border-line">
          <CorrugatedCrossSection className="h-14 w-full sm:h-16" />
        </div>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="border-t border-line pt-6">
              <Icon className="h-6 w-6 text-cta" />
              <h3 className="font-display mt-4 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
