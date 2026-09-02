import { auth, signOut } from "@/auth";

export default async function PendingApprovalPage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Cadastro em análise</h1>
      <p className="text-slate-600">
        Olá, {session?.user?.name?.split(" ")[0]}. Seu login foi feito com
        sucesso, mas seu acesso ainda não foi liberado.
      </p>
      <ul className="text-left text-sm text-slate-600">
        <li>
          • <strong>Professores e Admins de Escola</strong> precisam receber um
          convite da Secretaria/Direção para o mesmo e-mail usado aqui.
        </li>
        <li>
          • <strong>Estagiários</strong>: complete seu perfil de estudante para
          liberar o acesso (fluxo de auto-cadastro).
        </li>
      </ul>

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
