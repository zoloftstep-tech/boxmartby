/** Site-wide SEO and structured data constants */

export const SITE_URL = "https://www.boxmart.by";

export const SITE_NAME = "БОКСМАРТ";

export const SITE_TITLE = "Купить картонные коробки в Минске — БОКСМАРТ";

export const SITE_DESCRIPTION =
  "Купить гофрокартонные коробки напрямую от производителя в Минске. Расчёт онлайн, самовывоз с ул. Притыцкого 62. Для бизнеса и селлеров WB и Ozon.";

export const SITE_PHONE = "+375296168169";
export const SITE_EMAIL = "boxmartprod@gmail.com";

export const MESSENGERS = [
  { id: "telegram", label: "Telegram", href: "https://t.me/boxmartby" },
  { id: "viber", label: "Viber", href: "viber://chat?number=%2B375296168169" },
  { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/375296168169" },
] as const;
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
    a: "Пока нет — изготавливаем только сами коробки. Флексопечать логотипа и маркировки планируем позже.",
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

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: "ООО «БОКСМАРТ»",
    },
    inLanguage: "ru-BY",
  };
}
