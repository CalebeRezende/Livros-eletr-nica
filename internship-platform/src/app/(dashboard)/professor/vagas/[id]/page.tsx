import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { submitOfferForApproval, closeOffer } from "@/lib/actions/offers";
import { decideApplication } from "@/lib/actions/applications";
import { OfferStatus, ApplicationStatus } from "@prisma/client";

const STATUS_LABEL: Record<OfferStatus, string> = {
  DRAFT: "Rascunho",
  PENDING_SCHOOL_APPROVAL: "Aguardando aprovação da escola",
  OPEN: "Aberta",
  CLOSED: "Encerrada",
  ARCHIVED: "Arquivada",
};

const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  CANCELLED: "Cancelada",
  COMPLETED: "Concluída",
};

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const offer = await prisma.internshipOffer.findFirst({
    where: { id, supervisorProfile: { userId: session.user.id } },
    include: {
      educationStage: true,
      knowledgeAreas: { include: { area: true } },
      applications: { include: { internProfile: { include: { user: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!offer) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">{offer.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {offer.educationStage.label} • {offer.shift} • {STATUS_LABEL[offer.status]}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-slate-700">{offer.description}</p>
      <p className="mt-2 text-xs text-slate-400">
        {offer.knowledgeAreas.map((k) => k.area.name).join(", ")}
      </p>

      <div className="mt-4 flex gap-2">
        {offer.status === "DRAFT" && (
          <form action={submitOfferForApproval}>
            <input type="hidden" name="offerId" value={offer.id} />
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white">
              Enviar para aprovação da escola
            </button>
          </form>
        )}
        {offer.status === "OPEN" && (
          <form action={closeOffer}>
            <input type="hidden" name="offerId" value={offer.id} />
            <button type="submit" className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm hover:bg-slate-50">
              Encerrar vaga
            </button>
          </form>
        )}
      </div>

      <h2 className="mt-10 text-lg font-medium">Candidaturas</h2>
      <ul className="mt-3 space-y-3">
        {offer.applications.map((application) => (
          <li key={application.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-medium">
              {application.internProfile.user.name ?? application.internProfile.user.email}
            </p>
            <p className="text-sm text-slate-500">
              {application.internProfile.university} • {application.internProfile.course} •{" "}
              {APPLICATION_STATUS_LABEL[application.status]}
            </p>
            {application.coverMessage && (
              <p className="mt-1 text-sm text-slate-700">"{application.coverMessage}"</p>
            )}

            {application.status === "PENDING" && (
              <div className="mt-2 flex gap-2">
                <form action={decideApplication}>
                  <input type="hidden" name="applicationId" value={application.id} />
                  <input type="hidden" name="decision" value="APPROVED" />
                  <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1 text-xs text-white">
                    Aprovar
                  </button>
                </form>
                <form action={decideApplication}>
                  <input type="hidden" name="applicationId" value={application.id} />
                  <input type="hidden" name="decision" value="REJECTED" />
                  <button type="submit" className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50">
                    Rejeitar
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
        {offer.applications.length === 0 && (
          <p className="text-slate-500">Nenhuma candidatura ainda.</p>
        )}
      </ul>
    </main>
  );
}
