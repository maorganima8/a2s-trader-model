import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { studentProfile: { select: { hasPersonalModel: true, mentorId: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">תלמידים ({students.length})</h1>
        <Link href="/admin/users/new" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition">
          + הוסף תלמיד
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-zinc-800">
          {students.map((student) => {
            const daysLeft = student.accessExpiresAt
              ? Math.ceil((student.accessExpiresAt.getTime() - Date.now()) / 86400000)
              : null;
            const dayNumber = student.joinedAt
              ? Math.floor((Date.now() - student.joinedAt.getTime()) / 86400000) + 1
              : null;
            const expired = daysLeft !== null && daysLeft <= 0;

            return (
              <Link
                key={student.id}
                href={`/admin/students/${student.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-zinc-800/50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-sm">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{student.name}</p>
                    <p className="text-zinc-500 text-xs">{student.email} · {student.phone ?? "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {student.studentProfile?.hasPersonalModel && (
                    <span className="text-xs bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-md border border-yellow-800">
                      מודל אישי
                    </span>
                  )}
                  {dayNumber && (
                    <span className="text-xs text-zinc-500">יום {dayNumber}</span>
                  )}
                  {daysLeft !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded-md border ${
                      expired
                        ? "text-red-400 bg-red-950/30 border-red-900"
                        : daysLeft <= 14
                        ? "text-orange-400 bg-orange-950/30 border-orange-900"
                        : "text-zinc-500 bg-zinc-800 border-zinc-700"
                    }`}>
                      {expired ? "פג" : `${daysLeft} ימים`}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          {students.length === 0 && (
            <div className="px-5 py-12 text-center text-zinc-500 text-sm">
              אין תלמידים עדיין
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
