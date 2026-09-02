import { auth } from "@/auth";
import type { Role } from "@/lib/roles";

// Checagem de role para Server Actions. Complementa o middleware (que já
// bloqueia por rota): aqui garantimos que quem chama a action tem o role
// certo mesmo que a action seja invocada fora do fluxo normal de página.
// Checagens de posse (ex.: "essa vaga é sua?") ficam em cada action, via
// filtro na query — ver comentários em src/lib/actions/*.ts.
export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session) throw new Error("Não autenticado.");
  if (!roles.includes(session.user.role)) {
    throw new Error("Sem permissão para esta ação.");
  }
  return session;
}
