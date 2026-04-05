import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BottomNav from "@/components/student/BottomNav";
import SideNav from "@/components/student/SideNav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "ADMIN" || session.user.role === "MENTOR") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar — desktop only */}
      <div className="hidden lg:block">
        <SideNav userName={session.user.name} />
      </div>

      {/* Main content */}
      <main className="lg:me-72 min-h-screen pb-24 lg:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
