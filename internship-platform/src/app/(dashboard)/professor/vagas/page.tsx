import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function SupervisorOffersPage() {
  const session = await auth();
  if (!session) return null;

  const offers = await prisma.internshipOffer.findMany({
    where: { supervisorProfile: { userId: session.user.id } },
    include: { applications: true, educationStage: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Minhas vagas de estágio</h1>
        <Link href="/professor/vagas/nova" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          Nova vaga
        </Link>
      </div>

      <ul className="mt-6 space-y-3">
        {offers.map((offer) => (
          <li key={offer.id}>
            <Link
              href={`/professor/vagas/${offer.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300"
            >
              <p className="font-medium">{offer.title}</p>
              <p className="text-sm text-slate-500">
                {offer.educationStage.label} • {offer.status} • {offer.applications.length} candidatura(s)
              </p>
            </Link>
          </li>
        ))}
        {offers.length === 0 && (
          <p className="text-slate-500">Você ainda não cadastrou nenhuma vaga.</p>
        )}
      </ul>
    </main>
  );
}
