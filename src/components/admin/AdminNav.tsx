"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";

const adminLinks = [
  {
    href: "/admin", exact: true, label: "דשבורד",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    href: "/admin/students", label: "תלמידים",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    href: "/admin/users/new", label: "תלמיד חדש",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  },
  {
    href: "/admin/calendar", label: "לוח שנה",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
];

const mentorLinks = [
  {
    href: "/admin", exact: true, label: "דשבורד",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    href: "/admin/students", label: "התלמידים שלי",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
];

interface Props {
  role: string;
  userName: string;
}

export default function AdminNav({ role, userName }: Props) {
  const pathname = usePathname();
  const navLinks = role === "ADMIN" ? adminLinks : mentorLinks;

  return (
    <aside className="fixed right-0 top-0 h-full w-60 bg-black border-l border-zinc-800/60 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800/60">
        <div className="relative w-9 h-9">
          <Image src="/logo.png" alt="A2S" width={36} height={36} className="rounded-full" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">A2S Trader</p>
          <p className="text-yellow-500 text-[11px] font-medium">{role === "ADMIN" ? "ניהול" : "מנטור"}</p>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 mx-3 mt-3 bg-zinc-900 border border-zinc-800 rounded-xl">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">מחובר כ</p>
        <p className="text-white text-sm font-medium truncate">{userName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-yellow-500/10 text-yellow-400 font-semibold border border-yellow-500/20"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-white border border-transparent"
              }`}
            >
              <span className={isActive ? "text-yellow-400" : "text-zinc-600"}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-zinc-800/60">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-zinc-600 hover:bg-zinc-900 hover:text-white transition border border-transparent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>יציאה</span>
        </button>
      </div>
    </aside>
  );
}
