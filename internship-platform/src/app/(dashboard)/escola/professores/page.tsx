import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { inviteSupervisor } from "@/lib/actions/invites";

export default async function SchoolSupervisorsPage() {
  const session = await auth();
  if (!session) return null;

  const admin = await prisma.schoolAdmin.findFirst({
    where: { userId: session.user.id },
    include: {
      school: {
        include: { supervisors: { include: { user: true } } },
      },
    },
  });

  if (!admin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-slate-500">Você ainda não está vinculado a nenhuma escola.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Professores — {admin.school.name}</h1>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium">Convidar professor</h2>
        <form action={inviteSupervisor} className="mt-3 flex gap-2">
          <input type="hidden" name="schoolId" value={admin.school.id} />
          <input
            type="email"
            name="email"
            placeholder="E-mail do professor"
            required
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
            Convidar
          </button>
        </form>
      </section>

      <ul className="mt-6 space-y-2">
        {admin.school.supervisors.map((supervisor) => (
          <li key={supervisor.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-medium">{supervisor.user.name ?? supervisor.user.email}</p>
            <p className="text-sm text-slate-500">{supervisor.subjectArea ?? "Área não informada"}</p>
          </li>
        ))}
        {admin.school.supervisors.length === 0 && (
          <p className="text-slate-500">Nenhum professor validado ainda.</p>
        )}
      </ul>
    </main>
  );
}
