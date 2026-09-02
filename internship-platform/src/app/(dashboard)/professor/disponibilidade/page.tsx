import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addAvailability, removeAvailability } from "@/lib/actions/availability";
import { SchoolShift } from "@prisma/client";

const SHIFT_LABEL: Record<SchoolShift, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  EVENING: "Noite",
  FULL_TIME: "Integral",
};

const WEEKDAY_LABEL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function AvailabilityPage() {
  const session = await auth();
  if (!session) return null;

  const profile = await prisma.supervisorProfile.findUnique({
    where: { userId: session.user.id },
    include: { availabilities: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] } },
  });

  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-slate-500">Seu perfil de professor ainda não foi criado pela escola.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Minha disponibilidade</h1>
      <p className="text-slate-600">Turnos e horários em que você pode receber estagiários.</p>

      <form action={addAvailability} className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
        <select name="weekday" required className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
          {WEEKDAY_LABEL.map((label, i) => (
            <option key={label} value={i}>
              {label}
            </option>
          ))}
        </select>
        <select name="shift" required className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
          {Object.values(SchoolShift).map((shift) => (
            <option key={shift} value={shift}>
              {SHIFT_LABEL[shift]}
            </option>
          ))}
        </select>
        <input type="time" name="startTime" required className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
        <input type="time" name="endTime" required className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
        <button type="submit" className="col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white sm:col-span-4 sm:w-fit">
          Adicionar horário
        </button>
      </form>

      <ul className="mt-6 space-y-2">
        {profile.availabilities.map((slot) => (
          <li key={slot.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-sm">
              {WEEKDAY_LABEL[slot.weekday]} • {SHIFT_LABEL[slot.shift]} • {slot.startTime}–{slot.endTime}
            </span>
            <form action={removeAvailability}>
              <input type="hidden" name="id" value={slot.id} />
              <button type="submit" className="text-sm text-red-600 underline">
                Remover
              </button>
            </form>
          </li>
        ))}
        {profile.availabilities.length === 0 && (
          <p className="text-slate-500">Nenhum horário cadastrado ainda.</p>
        )}
      </ul>
    </main>
  );
}
