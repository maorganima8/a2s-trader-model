"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";

const links = [
  { href: "/admin", label: "סקירה כללית", icon: "📊", exact: true },
  { href: "/admin/students", label: "תלמידים", icon: "👥" },
  { href: "/admin/users/new", label: "תלמיד חדש", icon: "➕" },
  { href: "/admin/calendar", label: "לוח שנה", icon: "📅" },
];

const mentorLinks = [
  { href: "/admin", label: "סקירה כללית", icon: "📊", exact: true },
  { href: "/admin/students", label: "התלמידים שלי", icon: "👥" },
];

interface Props {
  role: string;
  userName: string;
}

export default function AdminNav({ role, userName }: Props) {
  const pathname = usePathname();
  const navLinks = role === "ADMIN" ? links : mentorLinks;

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-zinc-900 border-l border-zinc-800 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
        <Image src="/logo.png" alt="A2S" width={36} height={36} />
        <div>
          <p className="text-white font-bold text-sm">A2S Trader</p>
          <p className="text-yellow-500 text-xs">{role === "ADMIN" ? "Admin" : "Mentor"}</p>
        </div>
      </div>

      {/* User */}
      <div className="px-5 py-3 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs">מחובר כ</p>
        <p className="text-white text-sm font-medium truncate">{userName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href) && link.href !== "/admin";
          const exactActive = link.exact && pathname === link.href;
          const isActive = link.exact ? exactActive : active;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                isActive
                  ? "bg-yellow-500/15 text-yellow-400 font-medium"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-zinc-800 hover:text-white transition"
        >
          <span>🚪</span>
          <span>יציאה</span>
        </button>
      </div>
    </aside>
  );
}
