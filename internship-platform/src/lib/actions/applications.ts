"use server";

import { revalidatePath } from "next/cache";
import { ApplicationStatus, OfferStatus, Prisma } from "@prisma/client";

import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/roles";
import { requiredString, optionalString, requiredEnum } from "@/lib/validation";

async function getOwnInternProfile(userId: string) {
  return prisma.internProfile.findUniqueOrThrow({ where: { userId } });
}

export async function applyToOffer(formData: FormData) {
  const session = await requireRole(Role.INTERN);
  const profile = await getOwnInternProfile(session.user.id);

  const offerId = requiredString(formData, "offerId");
  const coverMessage = optionalString(formData, "coverMessage");

  const offer = await prisma.internshipOffer.findFirstOrThrow({
    where: { id: offerId, status: OfferStatus.OPEN },
  });

  try {
    await prisma.application.create({
      data: { offerId: offer.id, internProfileId: profile.id, coverMessage },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Você já se candidatou a esta vaga.");
    }
    throw error;
  }

  revalidatePath("/estagiario/candidaturas");
  revalidatePath("/estagiario/vagas");
}

export async function cancelApplication(formData: FormData) {
  const session = await requireRole(Role.INTERN);
  const profile = await getOwnInternProfile(session.user.id);
  const applicationId = requiredString(formData, "applicationId");

  await prisma.application.updateMany({
    where: { id: applicationId, internProfileId: profile.id, status: ApplicationStatus.PENDING },
    data: { status: ApplicationStatus.CANCELLED },
  });

  revalidatePath("/estagiario/candidaturas");
}

export async function decideApplication(formData: FormData) {
  const session = await requireRole(Role.SUPERVISOR);

  const applicationId = requiredString(formData, "applicationId");
  const decision = requiredEnum(formData, "decision", ["APPROVED", "REJECTED"] as const);
  const decisionNote = optionalString(formData, "decisionNote");

  const application = await prisma.application.findFirstOrThrow({
    where: { id: applicationId, offer: { supervisorProfile: { userId: session.user.id } } },
  });

  await prisma.application.update({
    where: { id: application.id },
    data: { status: decision, decidedAt: new Date(), decisionNote },
  });

  revalidatePath(`/professor/vagas/${application.offerId}`);
}
