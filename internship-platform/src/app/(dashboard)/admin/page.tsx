import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const session = await auth();

  const [schoolCount, offerCount, internCount] = await Promise.all([
    prisma.school.count(),
    prisma.internshipOffer.count({ where: { status: "OPEN" } }),
    prisma.internProfile.count(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Painel da Secretaria</h1>
      <p className="text-slate-600">Olá, {session?.user?.name}.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Escolas cadastradas" value={schoolCount} />
        <StatCard label="Vagas abertas" value={offerCount} />
        <StatCard label="Estagiários cadastrados" value={internCount} />
      </div>

      {/* TODO: CRUD de escolas, catálogo BNCC/áreas do conhecimento,
          etapas de ensino, e relatórios consolidados por escola/área. */}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}
