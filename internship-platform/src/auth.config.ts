import type { NextAuthConfig } from "next-auth";

import type { Role } from "@/lib/roles";

// Config "edge-safe": sem PrismaAdapter, sem provider com client secret, sem
// nenhum import que puxe o @prisma/client (que não roda no Edge runtime).
// src/middleware.ts usa só isto. src/auth.ts (Node.js — route handlers e
// Server Components) estende este objeto com adapter/providers/events.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      // `user` só vem preenchido no momento do login; nos requests
      // seguintes o token já carrega id/role.
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
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
