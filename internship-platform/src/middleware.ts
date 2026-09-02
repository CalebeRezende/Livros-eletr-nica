import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import { isAllowed, homeForRole } from "@/lib/rbac";

// Instância separada do NextAuth, criada só com o config edge-safe (sem
// PrismaAdapter) — ver o comentário em src/auth.config.ts.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isAllowed(pathname, role)) {
    return NextResponse.redirect(new URL(homeForRole(role ?? "PENDING"), req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Protege só as áreas logadas; landing page, login e assets ficam de fora.
  matcher: ["/admin/:path*", "/escola/:path*", "/professor/:path*", "/estagiario/:path*", "/pending-approval"],
};
