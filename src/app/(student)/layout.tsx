import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BottomNav from "@/components/student/BottomNav";

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
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--md-bg)' }}>
      {children}
      <BottomNav />
    </div>
  );
}
