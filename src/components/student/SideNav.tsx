"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navLinks = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/checklist", icon: "fact_check", label: "Checklist" },
  { href: "/journal", icon: "menu_book", label: "Journal" },
  { href: "/statistics", icon: "query_stats", label: "Statistics" },
  { href: "/model", icon: "psychology", label: "המודל" },
];

export default function SideNav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const initials = userName
    ? userName.split(" ").slice(0, 2).map((n) => n[0]).join("")
    : "?";

  return (
    <aside className="fixed inset-y-0 end-0 w-72 h-full z-50 bg-white shadow-[24px_0_48px_-12px_rgba(28,27,27,0.08)] flex flex-col p-6 space-y-8">
      {/* Brand */}
      <div className="flex items-center gap-4 px-2">
        <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center shadow-sm">
          <span
            className="material-symbols-outlined text-on-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            analytics
          </span>
        </div>
        <div>
          <h1 className="text-xl font-black text-on-surface tracking-tighter">A2S Trader</h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
            The Modern Curator
          </p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {navLinks.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                active
                  ? "bg-primary-container text-on-primary-container shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {link.icon}
              </span>
              <span className="font-medium text-sm uppercase tracking-widest">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-3 pt-2">
        <Link href="/journal/new">
          <div className="w-full bg-primary-container text-on-primary-container font-bold py-4 rounded-xl shadow hover:scale-[0.98] transition-all text-center text-sm">
            + עסקה חדשה
          </div>
        </Link>
        <div className="flex items-center justify-between px-2 pt-3 border-t border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-on-primary-container font-black text-sm">{initials}</span>
            </div>
            <span className="text-sm font-bold text-on-surface truncate max-w-[100px]">{userName}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-error hover:bg-error-container/20 rounded-lg transition-colors"
            title="יציאה"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
