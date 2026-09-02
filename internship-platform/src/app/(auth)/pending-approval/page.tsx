import { auth, signOut } from "@/auth";
import { registerAsIntern } from "@/lib/actions/internProfile";
import { SchoolShift } from "@prisma/client";

const SHIFT_LABEL: Record<SchoolShift, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  EVENING: "Noite",
  FULL_TIME: "Integral",
};

export default async function PendingApprovalPage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Cadastro em análise</h1>
        <p className="mt-2 text-slate-600">
          Olá, {session?.user?.name?.split(" ")[0]}. Seu login foi feito com sucesso,
          mas seu acesso ainda não foi liberado.
        </p>
      </div>

      <p className="text-sm text-slate-500">
        <strong>Professores e Admins de Escola</strong> precisam receber um convite
        da Secretaria/Direção para este mesmo e-mail. Se você é estagiário, complete
        o formulário abaixo:
      </p>

      <form action={registerAsIntern} className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left">
        <h2 className="font-medium">Sou estagiário</h2>
        <label className="flex flex-col gap-1 text-sm">
          Universidade
          <input name="university" required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Curso
          <input name="course" required placeholder="ex.: Pedagogia" className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Semestre atual
          <input name="semester" type="number" min={1} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend>Turnos disponíveis</legend>
          <div className="flex flex-wrap gap-3">
            {Object.values(SchoolShift).map((shift) => (
              <label key={shift} className="flex items-center gap-1.5">
                <input type="checkbox" name="preferredShifts" value={shift} />
                {SHIFT_LABEL[shift]}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="w-fit rounded-lg bg-slate-900 px-5 py-2 text-sm text-white">
          Completar cadastro
        </button>
      </form>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit" className="text-sm text-slate-500 underline">
          Sair
        </button>
      </form>
    </main>
  );
}
