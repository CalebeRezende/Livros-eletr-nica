import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// Resolve o role inicial de um usuário recém-logado: bootstrap por
// SUPER_ADMIN_EMAIL, ou convite pendente (SCHOOL_ADMIN/SUPERVISOR). Roda
// dentro do callback jwt() de src/auth.ts, no exato momento de criar o
// token — nunca em events.createUser, porque o objeto `user` que chega no
// jwt() na sequência de login é o mesmo capturado na criação, e não seria
// atualizado por uma mutação feita num event separado.
export async function resolveInitialRole(userId: string, email: string): Promise<UserRole> {
  if (
    process.env.SUPER_ADMIN_EMAIL &&
    email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL.toLowerCase()
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.SUPER_ADMIN },
    });
    return UserRole.SUPER_ADMIN;
  }

  const invite = await prisma.invite.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!invite) return UserRole.PENDING;

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role: invite.role } }),
    prisma.invite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
    ...(invite.role === UserRole.SCHOOL_ADMIN && invite.schoolId
      ? [prisma.schoolAdmin.create({ data: { userId, schoolId: invite.schoolId } })]
      : []),
    // Sem isto, um professor convidado vira SUPERVISOR mas nunca ganha um
    // SupervisorProfile — e toda action de vaga/disponibilidade depende
    // desse registro (findUniqueOrThrow), travando o professor pra sempre.
    ...(invite.role === UserRole.SUPERVISOR && invite.schoolId
      ? [prisma.supervisorProfile.create({ data: { userId, schoolId: invite.schoolId } })]
      : []),
  ]);

  return invite.role;
}
