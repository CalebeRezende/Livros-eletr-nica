import { prisma } from "@/lib/prisma";
import { createSchool } from "@/lib/actions/schools";
import { inviteSchoolAdmin } from "@/lib/actions/invites";
import { SchoolShift } from "@prisma/client";

const SHIFT_LABEL: Record<SchoolShift, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  EVENING: "Noite",
  FULL_TIME: "Integral",
};

export default async function SchoolsPage() {
  const schools = await prisma.school.findMany({
    include: { admins: { include: { user: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Escolas</h1>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium">Nova escola</h2>
        <form action={createSchool} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="name" placeholder="Nome" required className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2" />
          <input name="address" placeholder="Endereço" required className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2" />
          <input name="city" placeholder="Cidade" required className="rounded-lg border border-slate-300 px-3 py-2" />
          <input name="state" placeholder="UF" required maxLength={2} className="rounded-lg border border-slate-300 px-3 py-2" />
          <fieldset className="flex flex-wrap gap-3 sm:col-span-2">
            {Object.values(SchoolShift).map((shift) => (
              <label key={shift} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="shifts" value={shift} />
                {SHIFT_LABEL[shift]}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white sm:col-span-2 sm:w-fit">
            Cadastrar escola
          </button>
        </form>
      </section>

      <ul className="mt-6 space-y-4">
        {schools.map((school) => (
          <li key={school.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="font-medium">{school.name}</p>
            <p className="text-sm text-slate-500">
              {school.address}, {school.city}/{school.state}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Admins: {school.admins.map((a) => a.user.name ?? a.user.email).join(", ") || "nenhum ainda"}
            </p>

            <form action={inviteSchoolAdmin} className="mt-3 flex gap-2">
              <input type="hidden" name="schoolId" value={school.id} />
              <input
                type="email"
                name="email"
                placeholder="E-mail do administrador da escola"
                required
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <button type="submit" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
                Convidar
              </button>
            </form>
          </li>
        ))}
        {schools.length === 0 && <p className="text-slate-500">Nenhuma escola cadastrada.</p>}
      </ul>
    </main>
  );
}
