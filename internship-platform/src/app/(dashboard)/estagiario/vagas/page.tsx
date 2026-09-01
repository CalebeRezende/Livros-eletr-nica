import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function InternOffersPage() {
  const session = await auth();
  if (!session) return null;

  // TODO: filtros por área/campo BNCC, etapa de ensino, turno e escola.
  const offers = await prisma.internshipOffer.findMany({
    where: { status: "OPEN" },
    include: { school: true, educationStage: true, knowledgeAreas: { include: { area: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Vagas disponíveis</h1>

      <ul className="mt-6 space-y-3">
        {offers.map((offer) => (
          <li key={offer.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-medium">{offer.title}</p>
            <p className="text-sm text-slate-500">
              {offer.school.name} • {offer.educationStage.label} • {offer.shift}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {offer.knowledgeAreas.map((k) => k.area.name).join(", ")}
            </p>
            {/* TODO: botão "Candidatar-se" cria uma Application PENDING */}
          </li>
        ))}
        {offers.length === 0 && (
          <p className="text-slate-500">Nenhuma vaga aberta no momento.</p>
        )}
      </ul>
    </main>
  );
}
