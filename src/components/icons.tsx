// Small hand-rolled icon set — outlined, 1.75px stroke, matching design-system.md 6.
// Avoids pulling in an icon package dependency for half a dozen glyphs.
import type { SVGProps } from "react";

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </Icon>
  );
}

export function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21" />
      <path d="M4 5.5v15.5" />
    </Icon>
  );
}

export function ClipboardCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="5" y="4.5" width="14" height="16" rx="1.5" />
      <path d="M9 3.5h6a1 1 0 0 1 1 1v1.5H8V4.5a1 1 0 0 1 1-1Z" />
      <path d="m9 13 2 2 4-4" />
    </Icon>
  );
}

export function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m14.5 9.5-1.7 4.3-4.3 1.7 1.7-4.3z" />
    </Icon>
  );
}

export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 20H5.5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5.5 4H9" />
      <path d="M16 16.5 20.5 12 16 7.5" />
      <path d="M20.5 12h-11" />
    </Icon>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 6.5h16" />
      <path d="M4 12h16" />
      <path d="M4 17.5h16" />
    </Icon>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m5 5 14 14" />
      <path d="m19 5-14 14" />
    </Icon>
  );
}

export function WalletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M15 14.5h2.5" />
    </Icon>
  );
}

export function UserCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="10" r="2.75" />
      <path d="M6.2 18.2a6.2 6.2 0 0 1 11.6 0" />
    </Icon>
  );
}

export function ShieldCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 5 6.2v5.3c0 4.4 3 7.8 7 8.9 4-1.1 7-4.5 7-8.9V6.2z" />
      <path d="m9 12 2 2 4-4.2" />
    </Icon>
  );
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m12 4 2.3 4.9 5.3.7-3.9 3.7.9 5.4-4.6-2.5-4.6 2.5.9-5.4-3.9-3.7 5.3-.7z" />
    </Icon>
  );
}

export function CreditCardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M7 14.5h4" />
    </Icon>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.35-4.35" />
    </Icon>
  );
}

export function MoreVerticalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props} strokeWidth={2.5}>
      <circle cx="12" cy="5" r="0.5" fill="currentColor" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
      <circle cx="12" cy="19" r="0.5" fill="currentColor" />
    </Icon>
  );
}

export function ChevronUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m6 15 6-6 6 6" />
    </Icon>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function ImagePlaceholderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m4.5 16.5 4.5-4.5 3 3 3.5-3.5 4 4" />
    </Icon>
  );
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 12h16" />
      <path d="m13 5 7 7-7 7" />
    </Icon>
  );
}

export function CertificateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="9" r="6" />
      <path d="m9.5 14-1.5 6 4-2 4 2-1.5-6" />
    </Icon>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4v16" />
      <path d="M4 12h16" />
    </Icon>
  );
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.65-9.5 9-9.5 9Z" />
    </Icon>
  );
}
