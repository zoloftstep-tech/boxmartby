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
