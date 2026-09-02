import { Role } from "@/lib/roles";

// Prefixo de rota -> roles autorizados. Usado pelo middleware e reaproveitado
// nas páginas para checagens finas (ex.: um SUPER_ADMIN também pode entrar
// em /escola para inspecionar, mas quem cria vaga é sempre o SUPERVISOR).
export const ROUTE_ROLES: Record<string, Role[]> = {
  "/admin": [Role.SUPER_ADMIN],
  "/escola": [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN],
  "/professor": [Role.SUPERVISOR],
  "/estagiario": [Role.INTERN],
};

export function isAllowed(pathname: string, role: Role | undefined): boolean {
  const entry = Object.entries(ROUTE_ROLES).find(([prefix]) => pathname.startsWith(prefix));
  if (!entry) return true; // rota não mapeada: não é área restrita por role
  if (!role) return false;
  const [, allowedRoles] = entry;
  return allowedRoles.includes(role);
}

// Para onde mandar cada role depois do login.
export function homeForRole(role: Role): string {
  switch (role) {
    case Role.SUPER_ADMIN:
      return "/admin";
    case Role.SCHOOL_ADMIN:
      return "/escola";
    case Role.SUPERVISOR:
      return "/professor/vagas";
    case Role.INTERN:
      return "/estagiario/vagas";
    case Role.PENDING:
    default:
      return "/pending-approval";
  }
}
