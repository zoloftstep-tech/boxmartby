import Image from "next/image";
import { IconClock, IconDownload, IconMail, IconPhone } from "../icons";

export function Footer() {
  return (
    <footer id="contacts" className="border-t border-line bg-ink text-slate-300">
      <div className="section-pad">
        <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-start gap-3">
              <Image
                src="/logo-mark.png"
                alt=""
                width={44}
                height={44}
                className="mt-0.5 h-11 w-11 shrink-0 object-contain brightness-0 invert"
              />
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold text-white">БОКСМАРТ</p>
                <p className="mt-2 text-sm text-slate-400">ООО «БОКСМАРТ»</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              Производство картонных коробок и гофротары в Минске. Прямые цены для бизнеса и
              селлеров маркетплейсов.
            </p>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Контакты
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="tel:+375296168169" className="focus-ring inline-flex cursor-pointer items-center gap-2 hover:text-white">
                  <IconPhone className="h-4 w-4 text-kraft-soft" />
                  +375 (29) 616-81-69 (A1)
                </a>
              </li>
              <li>
                <a href="mailto:boxmartprod@gmail.com" className="focus-ring inline-flex cursor-pointer items-center gap-2 hover:text-white">
                  <IconMail className="h-4 w-4 text-kraft-soft" />
                  boxmartprod@gmail.com
                </a>
              </li>
              <li className="flex gap-2">
                <IconClock className="mt-0.5 h-4 w-4 shrink-0 text-kraft-soft" />
                <span>
                  Пн–Пт: 9:00–18:00
                  <br />
                  Сб–Вс: выходной
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Производство
            </h2>
            <p className="mt-4 text-sm leading-relaxed">
              г. Минск
              <br />
              {/* Адрес уточняется при заказе / в договоре */}
              ул. Притыцкого, дом 62, оф. 14, 220140
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              УНП: 193915237 
              <br />
              Полные реквизиты — в файле для скачивания
            </p>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Документы
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href="/docs/requisites.docx"
                className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/15 px-3 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:border-white/30 hover:bg-white/5"
              >
                <IconDownload className="h-4 w-4" />
                Скачать реквизиты
              </a>
              <a
                href="/docs/contract-template.docx"
                className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/15 px-3 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:border-white/30 hover:bg-white/5"
              >
                <IconDownload className="h-4 w-4" />
                Скачать шаблон договора
              </a>
            </div>
          </div>
        </div>

        <div className="container-site flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ООО «БОКСМАРТ». Все права защищены.</p>
          <a href="#calculator" className="focus-ring cursor-pointer text-slate-400 hover:text-white">
            Рассчитать стоимость →
          </a>
        </div>
      </div>
    </footer>
  );
}
