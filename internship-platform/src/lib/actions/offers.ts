"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { OfferStatus, SchoolShift } from "@prisma/client";

import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/roles";
import { requiredString, requiredEnum } from "@/lib/validation";

async function getOwnSupervisorProfile(userId: string) {
  return prisma.supervisorProfile.findUniqueOrThrow({ where: { userId } });
}

export async function createOffer(formData: FormData) {
  const session = await requireRole(Role.SUPERVISOR);
  const profile = await getOwnSupervisorProfile(session.user.id);

  const title = requiredString(formData, "title");
  const description = requiredString(formData, "description");
  const shift = requiredEnum(formData, "shift", Object.values(SchoolShift));
  const educationStageId = requiredString(formData, "educationStageId");
  const slots = Math.max(1, Number(formData.get("slots")) || 1);
  const knowledgeAreaIds = formData.getAll("knowledgeAreaIds").map(String);

  if (knowledgeAreaIds.length === 0) {
    throw new Error("Selecione ao menos uma área do conhecimento / campo de experiência.");
  }

  const offer = await prisma.internshipOffer.create({
    data: {
      title,
      description,
      shift,
      slots,
      educationStageId,
      schoolId: profile.schoolId,
      supervisorProfileId: profile.id,
      status: OfferStatus.DRAFT,
      knowledgeAreas: { create: knowledgeAreaIds.map((areaId) => ({ areaId })) },
    },
  });

  revalidatePath("/professor/vagas");
  redirect(`/professor/vagas/${offer.id}`);
}

export async function submitOfferForApproval(formData: FormData) {
  const session = await requireRole(Role.SUPERVISOR);
  const offerId = requiredString(formData, "offerId");

  const { count } = await prisma.internshipOffer.updateMany({
    where: {
      id: offerId,
      supervisorProfile: { userId: session.user.id },
      status: OfferStatus.DRAFT,
    },
    data: { status: OfferStatus.PENDING_SCHOOL_APPROVAL },
  });
  if (count === 0) throw new Error("Vaga não encontrada ou não está em rascunho.");

  revalidatePath(`/professor/vagas/${offerId}`);
}

export async function closeOffer(formData: FormData) {
  const session = await requireRole(Role.SUPERVISOR);
  const offerId = requiredString(formData, "offerId");

  const { count } = await prisma.internshipOffer.updateMany({
    where: { id: offerId, supervisorProfile: { userId: session.user.id } },
    data: { status: OfferStatus.CLOSED },
  });
  if (count === 0) throw new Error("Vaga não encontrada.");

  revalidatePath(`/professor/vagas/${offerId}`);
}

export async function approveOffer(formData: FormData) {
  const session = await requireRole(Role.SCHOOL_ADMIN);
  const offerId = requiredString(formData, "offerId");

  const offer = await prisma.internshipOffer.findFirstOrThrow({
    where: { id: offerId, status: OfferStatus.PENDING_SCHOOL_APPROVAL },
  });
  await prisma.schoolAdmin.findFirstOrThrow({
    where: { userId: session.user.id, schoolId: offer.schoolId },
  });

  await prisma.internshipOffer.update({
    where: { id: offer.id },
    data: { status: OfferStatus.OPEN },
  });

  revalidatePath("/escola/vagas");
}

export async function rejectOffer(formData: FormData) {
  const session = await requireRole(Role.SCHOOL_ADMIN);
  const offerId = requiredString(formData, "offerId");

  const offer = await prisma.internshipOffer.findFirstOrThrow({
    where: { id: offerId, status: OfferStatus.PENDING_SCHOOL_APPROVAL },
  });
  await prisma.schoolAdmin.findFirstOrThrow({
    where: { userId: session.user.id, schoolId: offer.schoolId },
  });

  // Volta pra DRAFT em vez de CLOSED: o professor pode ajustar e reenviar.
  await prisma.internshipOffer.update({
    where: { id: offer.id },
    data: { status: OfferStatus.DRAFT },
  });

  revalidatePath("/escola/vagas");
}
