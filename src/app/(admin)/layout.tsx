import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "STUDENT") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <AdminNav role={session.user.role} userName={session.user.name ?? ""} />
      <main className="flex-1 mr-64 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
