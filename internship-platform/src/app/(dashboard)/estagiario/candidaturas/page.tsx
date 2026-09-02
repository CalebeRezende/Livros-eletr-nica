import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cancelApplication } from "@/lib/actions/applications";
import { ApplicationStatus } from "@prisma/client";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  CANCELLED: "Cancelada",
  COMPLETED: "Concluída",
};

export default async function MyApplicationsPage() {
  const session = await auth();
  if (!session) return null;

  const applications = await prisma.application.findMany({
    where: { internProfile: { userId: session.user.id } },
    include: { offer: { include: { school: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Minhas candidaturas</h1>

      <ul className="mt-6 space-y-3">
        {applications.map((application) => (
          <li key={application.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-medium">{application.offer.title}</p>
            <p className="text-sm text-slate-500">
              {application.offer.school.name} • {STATUS_LABEL[application.status]}
            </p>

            <div className="mt-2 flex gap-3">
              {application.status === "PENDING" && (
                <form action={cancelApplication}>
                  <input type="hidden" name="applicationId" value={application.id} />
                  <button type="submit" className="text-sm text-red-600 underline">
                    Cancelar candidatura
                  </button>
                </form>
              )}
              {application.status === "APPROVED" && (
                <Link href={`/estagiario/candidaturas/${application.id}/diario`} className="text-sm text-slate-900 underline">
                  Diário de bordo
                </Link>
              )}
            </div>
          </li>
        ))}
        {applications.length === 0 && (
          <p className="text-slate-500">Você ainda não se candidatou a nenhuma vaga.</p>
        )}
      </ul>
    </main>
  );
}
