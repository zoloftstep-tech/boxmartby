import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
};

export function IconFactory(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V10l7-5 7 5v11" />
      <path d="M9 21v-6h6v6" />
      <path d="M10 10h4" />
    </svg>
  );
}

export function IconRuler(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16v10H4z" />
      <path d="M8 7v3M12 7v4M16 7v3" />
    </svg>
  );
}

export function IconStack(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8l8-4 8 4-8 4-8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </svg>
  );
}

export function IconCalc(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0M8 18h2M12 18h2" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
    </svg>
  );
}

export function IconPhone(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 005.5 5.5l1.5-2 4 1.5v3A2 2 0 0118 19 14 14 0 015 6a2 2 0 011.5-2.5z" />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4v10M8 10l4 4 4-4M5 18h14" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 7h14M10 11v6M14 11v6M9 7V5h6v2M7 7l1 12h8l1-12" />
    </svg>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export function IconPrint(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 8V4h10v4M7 16H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2" />
      <rect x="7" y="14" width="10" height="6" rx="1" />
    </svg>
  );
}

export function IconCarton(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9l8-4 8 4v10l-8 4-8-4V9z" />
      <path d="M12 5v14M4 9l8 4 8-4" />
    </svg>
  );
}

const fillBase = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true as const,
};

export function IconTelegram(props: IconProps) {
  return (
    <svg {...fillBase} {...props}>
      <path d="M21.5 3.1 2.8 10.3c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.7.4.9 1 .9.6 0 .9-.3 1.2-.6l2.8-2.7 5.8 4.3c1.1.6 1.8.3 2.1-1l3.7-17.4c.4-1.5-.5-2.1-1.6-1.7zM9.3 13.9l9.4-5.9c.5-.3.9-.1.5.2l-7.6 6.9-.3 3.3-1.9-4.5z" />
    </svg>
  );
}

export function IconViber(props: IconProps) {
  return (
    <svg {...fillBase} {...props}>
      <path d="M11.4 2.1c4.4-.2 8.2 2.7 9 6.8.5 2.6-.1 5.3-1.7 7.4-.3.4-.4.9-.3 1.4l.5 2.8c.1.6-.4 1.1-1 1l-2.9-.6c-.4-.1-.9 0-1.3.2-1.8.9-3.9 1.2-5.9.8C3.8 20.7 1 16.8 1.3 12.5c.3-4.6 4.1-8.2 8.7-8.4h1.4zm.3 1.7c-3.6.1-6.6 2.9-6.9 6.5-.3 3.4 1.8 6.5 5.1 7.4 1.5.4 3.1.2 4.5-.5.6-.3 1.3-.4 1.9-.3l1.8.4-.3-1.7c-.1-.7 0-1.4.4-2 1.2-1.6 1.7-3.6 1.3-5.6-.6-3.2-3.6-5.5-7.1-5.6l-.7.4zm.8 2.3c.4 0 .7.3.7.7v.1c0 2.2.9 3.3 3.1 4.1.4.1.6.5.5.9-.1.3-.4.5-.7.5h-.2c-2.8-.9-4.2-2.5-4.2-5.5 0-.4.3-.8.8-.8zm-2.6.9c.3 0 .6.2.7.5.3 1.5 1.1 2.4 2.5 2.9.4.1.6.5.5.9-.1.3-.4.5-.7.5h-.2c-1.9-.7-3-2.1-3.4-4.1 0-.4.3-.7.6-.7zm5.8 3.5c.3-.1.7 0 .9.3l.1.1c.6.8 1.4 1.3 2.3 1.5.4.1.6.5.5.9-.1.3-.4.5-.7.5h-.1c-1.3-.3-2.4-1-3.2-2-.3-.3-.2-.7.2-.9v-.4z" />
    </svg>
  );
}

export function IconWhatsApp(props: IconProps) {
  return (
    <svg {...fillBase} {...props}>
      <path d="M12 2a9.9 9.9 0 00-8.5 14.9L2 22l5.3-1.4A9.9 9.9 0 1012 2zm0 1.8a8.1 8.1 0 018.1 8.1 8.1 8.1 0 01-8.1 8.1 8 8 0 01-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.1 8.1 0 0112 3.8zm4.6 10.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.2-.3.2-.5.1-.2-.1-.9-.3-1.8-1.1-.7-.6-1.1-1.3-1.2-1.5-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.1 0 1.2.9 2.4 1 2.5.1.2 1.8 2.8 4.4 3.9 2.6 1.1 2.6.7 3.1.7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1 0-.3-.1-.5-.2z" />
    </svg>
  );
}
