"use server";

import { revalidatePath } from "next/cache";
import { KnowledgeAreaKind, EducationStageLevel } from "@prisma/client";

import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/roles";
import { requiredString, requiredEnum } from "@/lib/validation";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createKnowledgeArea(formData: FormData) {
  await requireRole(Role.SUPER_ADMIN);

  const name = requiredString(formData, "name");
  const kind = requiredEnum(formData, "kind", Object.values(KnowledgeAreaKind));

  await prisma.knowledgeArea.create({ data: { name, kind, slug: slugify(name) } });

  revalidatePath("/admin/catalogo");
}

export async function createEducationStage(formData: FormData) {
  await requireRole(Role.SUPER_ADMIN);

  const label = requiredString(formData, "label");
  const level = requiredEnum(formData, "level", Object.values(EducationStageLevel));
  const order = Number(formData.get("order")) || 0;

  await prisma.educationStage.create({ data: { label, level, order } });

  revalidatePath("/admin/catalogo");
}
