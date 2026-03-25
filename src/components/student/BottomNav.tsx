"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/dashboard",
    label: "בית",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#EAB308" : "none"} stroke={active ? "#EAB308" : "#cac4d0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/checklist",
    label: "צ'קליסט",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#EAB308" : "#cac4d0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    href: "/journal",
    label: "יומן",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#EAB308" : "#cac4d0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    href: "/model",
    label: "המודל",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#EAB308" : "#cac4d0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-20 px-2"
      style={{ backgroundColor: 'var(--md-surface-low)', borderTop: '1px solid var(--md-outline-variant)' }}
    >
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-1 flex-1"
          >
            {/* M3 Active indicator pill */}
            <div
              className="flex items-center justify-center w-16 h-8 rounded-full transition-all duration-200"
              style={{ backgroundColor: active ? 'var(--md-primary-container)' : 'transparent' }}
            >
              {link.icon(active)}
            </div>
            <span
              className="text-[11px] font-medium transition-all"
              style={{ color: active ? 'var(--md-primary)' : 'var(--md-on-surface-variant)' }}
            >
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
