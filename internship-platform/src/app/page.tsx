import Link from "next/link";
import { auth } from "@/auth";
import { homeForRole } from "@/lib/rbac";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-bold">Plataforma de Estágios</h1>
      <p className="text-slate-600">
        Conectando Secretarias de Educação, escolas, professores supervisores e
        estagiários de Licenciatura.
      </p>

      {session ? (
        <Link
          href={homeForRole(session.user.role)}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-700"
        >
          Ir para o meu painel
        </Link>
      ) : (
        <Link
          href="/login"
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-700"
        >
          Entrar com Google
        </Link>
      )}
    </main>
  );
}
