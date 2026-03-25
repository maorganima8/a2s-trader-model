import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "A2S Trader",
  description: "Addiction 2 Success — Trader Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased min-h-screen" style={{ backgroundColor: 'var(--md-bg)', color: 'var(--md-on-surface)' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
