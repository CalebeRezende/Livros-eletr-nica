import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ActivityLogForm } from "@/components/ActivityLogForm";

export default async function ActivityLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const application = await prisma.application.findFirst({
    where: { id, status: "APPROVED", internProfile: { userId: session.user.id } },
    include: {
      offer: true,
      activityLogs: { orderBy: { date: "desc" } },
    },
  });

  if (!application) notFound();

  const totalHours = application.activityLogs.reduce((sum, log) => sum + log.hours, 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Diário de bordo — {application.offer.title}</h1>
      <p className="text-slate-600">Total registrado: {totalHours}h</p>

      <ActivityLogForm applicationId={application.id} />

      <ul className="mt-6 space-y-3">
        {application.activityLogs.map((log) => (
          <li key={log.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium">
              {log.date.toLocaleDateString("pt-BR")} • {log.hours}h
              {log.checkInAt && <span className="ml-2 text-xs text-green-700">check-in ✓</span>}
            </p>
            <p className="mt-1 text-sm text-slate-700">{log.description}</p>
          </li>
        ))}
        {application.activityLogs.length === 0 && (
          <p className="text-slate-500">Nenhum registro ainda.</p>
        )}
      </ul>
    </main>
  );
}
