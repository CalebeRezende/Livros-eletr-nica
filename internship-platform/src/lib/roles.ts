// Espelho dos valores do enum UserRole (prisma/schema.prisma), sem importar
// @prisma/client. Existe porque o middleware roda no Edge runtime, que não
// suporta o Prisma Client — então qualquer arquivo usado pelo middleware
// (este, e src/auth.config.ts) usa este tipo local em vez do UserRole
// gerado pelo Prisma. Mantenha os dois em sincronia manualmente.
export const Role = {
  PENDING: "PENDING",
  SUPER_ADMIN: "SUPER_ADMIN",
  SCHOOL_ADMIN: "SCHOOL_ADMIN",
  SUPERVISOR: "SUPERVISOR",
  INTERN: "INTERN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
