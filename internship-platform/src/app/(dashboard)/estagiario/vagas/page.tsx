import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { applyToOffer } from "@/lib/actions/applications";
import { OfferStatus } from "@prisma/client";

export default async function InternOffersPage() {
  const session = await auth();
  if (!session) return null;

  const internProfile = await prisma.internProfile.findUnique({
    where: { userId: session.user.id },
    include: { applications: { select: { offerId: true } } },
  });

  const appliedOfferIds = new Set(internProfile?.applications.map((a) => a.offerId));

  const offers = await prisma.internshipOffer.findMany({
    where: { status: OfferStatus.OPEN },
    include: { school: true, educationStage: true, knowledgeAreas: { include: { area: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Vagas disponíveis</h1>

      <ul className="mt-6 space-y-3">
        {offers.map((offer) => {
          const alreadyApplied = appliedOfferIds.has(offer.id);
          return (
            <li key={offer.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-medium">{offer.title}</p>
              <p className="text-sm text-slate-500">
                {offer.school.name} • {offer.educationStage.label} • {offer.shift}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {offer.knowledgeAreas.map((k) => k.area.name).join(", ")}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{offer.description}</p>

              {alreadyApplied ? (
                <p className="mt-3 text-sm text-slate-500">Você já se candidatou a esta vaga.</p>
              ) : (
                <form action={applyToOffer} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="offerId" value={offer.id} />
                  <textarea
                    name="coverMessage"
                    placeholder="Mensagem opcional para o professor"
                    rows={2}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button type="submit" className="w-fit rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white">
                    Candidatar-se
                  </button>
                </form>
              )}
            </li>
          );
        })}
        {offers.length === 0 && <p className="text-slate-500">Nenhuma vaga aberta no momento.</p>}
      </ul>
    </main>
  );
}
