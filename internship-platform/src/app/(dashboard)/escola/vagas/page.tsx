import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { approveOffer, rejectOffer } from "@/lib/actions/offers";
import { OfferStatus } from "@prisma/client";

export default async function SchoolOffersApprovalPage() {
  const session = await auth();
  if (!session) return null;

  const schoolIds = (
    await prisma.schoolAdmin.findMany({ where: { userId: session.user.id }, select: { schoolId: true } })
  ).map((s) => s.schoolId);

  const offers = await prisma.internshipOffer.findMany({
    where: { schoolId: { in: schoolIds }, status: OfferStatus.PENDING_SCHOOL_APPROVAL },
    include: { supervisorProfile: { include: { user: true } }, educationStage: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Vagas aguardando aprovação</h1>

      <ul className="mt-6 space-y-4">
        {offers.map((offer) => (
          <li key={offer.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="font-medium">{offer.title}</p>
            <p className="text-sm text-slate-500">
              {offer.supervisorProfile.user.name} • {offer.educationStage.label} • {offer.shift}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{offer.description}</p>

            <div className="mt-3 flex gap-2">
              <form action={approveOffer}>
                <input type="hidden" name="offerId" value={offer.id} />
                <button type="submit" className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white">
                  Aprovar
                </button>
              </form>
              <form action={rejectOffer}>
                <input type="hidden" name="offerId" value={offer.id} />
                <button type="submit" className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm hover:bg-slate-50">
                  Devolver para ajuste
                </button>
              </form>
            </div>
          </li>
        ))}
        {offers.length === 0 && <p className="text-slate-500">Nada pendente de aprovação.</p>}
      </ul>
    </main>
  );
}
