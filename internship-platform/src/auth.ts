import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { resolveInitialRole } from "@/lib/bootstrap-role";

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: updateSession,
} = NextAuth({
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
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);

      // Só resolve bootstrap/convite logo no login (params.user vem
      // populado) e enquanto o usuário ainda estiver PENDING — evita
      // reconsultar o banco em todo request subsequente.
      if (params.user?.id && params.user.email && token.role === UserRole.PENDING) {
        token.role = await resolveInitialRole(params.user.id, params.user.email);
      }

      return token;
    },
  },
});
