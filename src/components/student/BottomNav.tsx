"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", icon: "home", label: "בית" },
  { href: "/checklist", icon: "fact_check", label: "צ'קליסט" },
  { href: "/journal", icon: "menu_book", label: "יומן" },
  { href: "/statistics", icon: "query_stats", label: "סטטס" },
  { href: "/model", icon: "psychology", label: "מודל" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-20 px-2 bg-white border-t border-outline-variant/20">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <div
              className={`flex items-center justify-center w-14 h-8 rounded-full transition-all duration-200 ${
                active ? "bg-primary-container" : "bg-transparent"
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  active ? "text-on-primary-container" : "text-on-surface-variant"
                }`}
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {link.icon}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold transition-all ${
                active ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
