import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateSchoolProfile } from "@/lib/actions/schools";
import { SchoolShift } from "@prisma/client";

const SHIFT_LABEL: Record<SchoolShift, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  EVENING: "Noite",
  FULL_TIME: "Integral",
};

export default async function SchoolAdminDashboardPage() {
  const session = await auth();
  if (!session) return null;

  const admin = await prisma.schoolAdmin.findFirst({
    where: { userId: session.user.id },
    include: { school: true },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Painel da Escola</h1>
      <p className="text-slate-600">Olá, {session.user.name}.</p>

      {!admin && (
        <p className="mt-6 text-slate-500">
          Você ainda não está vinculado a nenhuma escola. Peça para a Secretaria te
          convidar novamente.
        </p>
      )}

      {admin && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium">{admin.school.name}</h2>
          <form action={updateSchoolProfile} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input type="hidden" name="schoolId" value={admin.school.id} />
            <input
              name="address"
              defaultValue={admin.school.address}
              placeholder="Endereço"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2"
            />
            <input
              name="city"
              defaultValue={admin.school.city}
              placeholder="Cidade"
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              name="state"
              defaultValue={admin.school.state}
              placeholder="UF"
              required
              maxLength={2}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
            <textarea
              name="infra"
              defaultValue={admin.school.infra ?? ""}
              placeholder="Observações de infraestrutura"
              className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2"
            />
            <fieldset className="flex flex-wrap gap-3 sm:col-span-2">
              {Object.values(SchoolShift).map((shift) => (
                <label key={shift} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    name="shifts"
                    value={shift}
                    defaultChecked={admin.school.shifts.includes(shift)}
                  />
                  {SHIFT_LABEL[shift]}
                </label>
              ))}
            </fieldset>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white sm:col-span-2 sm:w-fit"
            >
              Salvar
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
