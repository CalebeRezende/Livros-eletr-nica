"use server";

import { revalidatePath } from "next/cache";
import { SchoolShift } from "@prisma/client";

import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/roles";
import { requiredEnum, requiredString } from "@/lib/validation";

async function getOwnSupervisorProfile(userId: string) {
  return prisma.supervisorProfile.findUniqueOrThrow({ where: { userId } });
}

export async function addAvailability(formData: FormData) {
  const session = await requireRole(Role.SUPERVISOR);
  const profile = await getOwnSupervisorProfile(session.user.id);

  const weekday = Number(formData.get("weekday"));
  const shift = requiredEnum(formData, "shift", Object.values(SchoolShift));
  const startTime = requiredString(formData, "startTime");
  const endTime = requiredString(formData, "endTime");

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new Error("Dia da semana inválido.");
  }

  await prisma.availability.create({
    data: { supervisorProfileId: profile.id, weekday, shift, startTime, endTime },
  });

  revalidatePath("/professor/disponibilidade");
}

export async function removeAvailability(formData: FormData) {
  const session = await requireRole(Role.SUPERVISOR);
  const profile = await getOwnSupervisorProfile(session.user.id);

  const id = requiredString(formData, "id");

  await prisma.availability.deleteMany({
    where: { id, supervisorProfileId: profile.id },
  });

  revalidatePath("/professor/disponibilidade");
}
