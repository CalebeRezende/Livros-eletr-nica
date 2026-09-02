"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/roles";
import { requiredString } from "@/lib/validation";

const INVITE_TTL_DAYS = 14;

function expiresAt() {
  return new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function inviteSchoolAdmin(formData: FormData) {
  const session = await requireRole(Role.SUPER_ADMIN);

  const email = requiredString(formData, "email").toLowerCase();
  const schoolId = requiredString(formData, "schoolId");

  await prisma.invite.create({
    data: {
      email,
      role: UserRole.SCHOOL_ADMIN,
      schoolId,
      invitedById: session.user.id,
      expiresAt: expiresAt(),
    },
  });

  revalidatePath("/admin/escolas");
}

export async function inviteSupervisor(formData: FormData) {
  const session = await requireRole(Role.SCHOOL_ADMIN);

  const email = requiredString(formData, "email").toLowerCase();
  const schoolId = requiredString(formData, "schoolId");

  // Garante que quem convida realmente administra essa escola.
  await prisma.schoolAdmin.findFirstOrThrow({
    where: { userId: session.user.id, schoolId },
  });

  await prisma.invite.create({
    data: {
      email,
      role: UserRole.SUPERVISOR,
      schoolId,
      invitedById: session.user.id,
      expiresAt: expiresAt(),
    },
  });

  revalidatePath("/escola/professores");
}
