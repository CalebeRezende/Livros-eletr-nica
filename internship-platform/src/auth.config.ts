import type { NextAuthConfig } from "next-auth";

import type { Role } from "@/lib/roles";

// Config "edge-safe": sem PrismaAdapter, sem provider com client secret, sem
// nenhum import que puxe o @prisma/client (que não roda no Edge runtime).
// src/middleware.ts usa só isto. src/auth.ts (Node.js — route handlers e
// Server Components) estende este objeto com adapter/providers, e
// sobrescreve `callbacks.jwt` para resolver o bootstrap de role (que
// precisa do Prisma) sem duplicar a parte de id/role/update aqui.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // `user` só vem preenchido no momento do login; nos requests
      // seguintes o token já carrega id/role.
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
      }

      // Disparado por `unstable_update()` (ex.: depois que um estagiário
      // completa o próprio perfil e sai do estado PENDING).
      if (trigger === "update" && session?.user?.role) {
        token.role = session.user.role as Role;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
