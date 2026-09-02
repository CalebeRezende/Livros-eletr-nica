import Link from "next/link";

import { auth, signOut } from "@/auth";
import { Role } from "@/lib/roles";

const NAV: Record<string, { href: string; label: string }[]> = {
  [Role.SUPER_ADMIN]: [
    { href: "/admin", label: "Painel" },
    { href: "/admin/escolas", label: "Escolas" },
    { href: "/admin/catalogo", label: "Catálogo BNCC" },
  ],
  [Role.SCHOOL_ADMIN]: [
    { href: "/escola", label: "Minha escola" },
    { href: "/escola/professores", label: "Professores" },
    { href: "/escola/vagas", label: "Vagas p/ aprovar" },
  ],
  [Role.SUPERVISOR]: [
    { href: "/professor/vagas", label: "Minhas vagas" },
    { href: "/professor/disponibilidade", label: "Disponibilidade" },
  ],
  [Role.INTERN]: [
    { href: "/estagiario/vagas", label: "Vagas disponíveis" },
    { href: "/estagiario/candidaturas", label: "Minhas candidaturas" },
  ],
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const links = session ? (NAV[session.user.role] ?? []) : [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex gap-4 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-slate-600 hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{session?.user?.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="underline">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
