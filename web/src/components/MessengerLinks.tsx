import { MESSENGERS } from "@/lib/site";
import { IconTelegram, IconViber, IconWhatsApp } from "./icons";

const ICONS = {
  telegram: IconTelegram,
  viber: IconViber,
  whatsapp: IconWhatsApp,
} as const;

const COLORS = {
  telegram: "text-[#24A1DE] hover:bg-[#24A1DE]/10",
  viber: "text-[#7360F2] hover:bg-[#7360F2]/10",
  whatsapp: "text-[#25D366] hover:bg-[#25D366]/10",
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
    <span className={`inline-flex items-center gap-1 ${className}`.trim()}>
      {MESSENGERS.map((m) => {
        const Icon = ICONS[m.id];
        const external = m.href.startsWith("http");
        return (
          <a
            key={m.id}
            href={m.href}
            aria-label={m.label}
            title={m.label}
            className={`focus-ring inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors duration-200 ${COLORS[m.id]}`}
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
