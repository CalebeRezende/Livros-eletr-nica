import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      // Restringe a tela de consentimento a contas Google normais; a
      // separação por perfil (Super Admin / Escola / Professor / Estagiário)
      // acontece DEPOIS do login, via role no banco — não por domínio de
      // e-mail, já que estagiários usam e-mails pessoais e universitários.
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  events: {
    // Roda uma única vez, na criação do usuário (primeiro login via Google).
    async createUser({ user }) {
      if (!user.id || !user.email) return;

      // Bootstrap: o e-mail configurado em SUPER_ADMIN_EMAIL vira Super
      // Admin automaticamente no primeiro login.
      if (
        process.env.SUPER_ADMIN_EMAIL &&
        user.email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL.toLowerCase()
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.SUPER_ADMIN },
        });
        return;
      }

      // Convite pendente (Admin de Escola convidando um Professor, ou Super
      // Admin convidando um Admin de Escola): aplica o role/escola do
      // convite e marca como usado.
      const invite = await prisma.invite.findFirst({
        where: {
          email: { equals: user.email, mode: "insensitive" },
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (invite) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { role: invite.role },
          }),
          prisma.invite.update({
            where: { id: invite.id },
            data: { usedAt: new Date() },
          }),
          ...(invite.role === UserRole.SCHOOL_ADMIN && invite.schoolId
            ? [
                prisma.schoolAdmin.create({
                  data: { userId: user.id, schoolId: invite.schoolId },
                }),
              ]
            : []),
        ]);
        return;
      }

      // Sem convite e sem bootstrap: usuário fica com role PENDING. A tela
      // /pending-approval explica que um Estagiário deve completar o
      // próprio perfil (não depende de convite), enquanto Professor e
      // Admin de Escola precisam ser convidados.
    },
  },
});
