import { auth } from "@/auth";

export default async function SchoolAdminDashboardPage() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Painel da Escola</h1>
      <p className="text-slate-600">Olá, {session?.user?.name}.</p>

      {/* TODO: perfil da escola (turnos, infraestrutura, endereço),
          convite/validação de professores, aprovação de vagas propostas
          pelos professores da unidade. */}
    </main>
  );
}
