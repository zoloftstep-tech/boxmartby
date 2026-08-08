/** Site-wide SEO and structured data constants */

export const SITE_URL = "https://www.boxmart.by";

export const SITE_NAME = "БОКСМАРТ";

export const SITE_TITLE = "БОКСМАРТ — производство картонных коробок в Минске";

export const SITE_DESCRIPTION =
  "Гофрокартонные коробки любых размеров напрямую от производителя. Расчёт онлайн для бизнеса и селлеров Wildberries и Ozon.";

export const SITE_PHONE = "+375296168169";
export const SITE_EMAIL = "boxmartprod@gmail.com";
export const SITE_ADDRESS = {
  street: "ул. Притыцкого 62",
  city: "Минск",
  country: "BY",
};

export const FAQ_ITEMS = [
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
] as const;

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ООО «БОКСМАРТ»",
    alternateName: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-mark.png`,
    email: SITE_EMAIL,
    telephone: SITE_PHONE,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_ADDRESS.street,
      addressLocality: SITE_ADDRESS.city,
      addressCountry: SITE_ADDRESS.country,
    },
    areaServed: {
      "@type": "Country",
      name: "Belarus",
    },
  };
}

export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "ООО «БОКСМАРТ»",
    image: `${SITE_URL}/logo-full.png`,
    url: SITE_URL,
    telephone: SITE_PHONE,
    email: SITE_EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_ADDRESS.street,
      addressLocality: SITE_ADDRESS.city,
      addressCountry: SITE_ADDRESS.country,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    description: SITE_DESCRIPTION,
  };
}

export function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
