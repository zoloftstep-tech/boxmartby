import { MESSENGERS } from "@/lib/site";
import { IconTelegram, IconViber, IconWhatsApp } from "./icons";

const ICONS = {
  telegram: IconTelegram,
  viber: IconViber,
  whatsapp: IconWhatsApp,
} as const;

type Props = {
  className?: string;
  iconClassName?: string;
};

export function MessengerLinks({
  className = "",
  iconClassName = "h-5 w-5",
}: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`.trim()}>
      {MESSENGERS.map((m) => {
        const Icon = ICONS[m.id];
        const external = m.href.startsWith("http");
        return (
          <a
            key={m.id}
            href={m.href}
            aria-label={m.label}
            title={m.label}
            className="focus-ring inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-ink-soft transition-colors duration-200 hover:bg-surface hover:text-ink"
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            <Icon className={iconClassName} />
          </a>
        );
      })}
    </span>
  );
}
