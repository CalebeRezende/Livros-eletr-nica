"use server";

import { revalidatePath } from "next/cache";
import { ApplicationStatus } from "@prisma/client";

import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/roles";
import { requiredString } from "@/lib/validation";

function numberOrUndefined(value: FormDataEntryValue | null) {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function addActivityLog(formData: FormData) {
  const session = await requireRole(Role.INTERN);

  const applicationId = requiredString(formData, "applicationId");
  const date = requiredString(formData, "date");
  const description = requiredString(formData, "description");
  const hours = Number(formData.get("hours"));

  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error("Informe uma quantidade de horas válida.");
  }

  const application = await prisma.application.findFirstOrThrow({
    where: {
      id: applicationId,
      status: ApplicationStatus.APPROVED,
      internProfile: { userId: session.user.id },
    },
  });

  // Check-in de geolocalização é opcional e vem do navegador (client-side),
  // enviado como campos escondidos do form quando o usuário permite.
  const checkInLat = numberOrUndefined(formData.get("checkInLat"));
  const checkInLng = numberOrUndefined(formData.get("checkInLng"));

  await prisma.activityLog.create({
    data: {
      applicationId: application.id,
      date: new Date(date),
      hours,
      description,
      checkInLat,
      checkInLng,
      checkInAt: checkInLat !== undefined ? new Date() : undefined,
    },
  });

  revalidatePath(`/estagiario/candidaturas/${applicationId}/diario`);
}
