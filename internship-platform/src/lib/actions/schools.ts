"use server";

import { revalidatePath } from "next/cache";
import { SchoolShift } from "@prisma/client";

import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/roles";
import { requiredString, optionalString, enumList } from "@/lib/validation";

export async function createSchool(formData: FormData) {
  await requireRole(Role.SUPER_ADMIN);

  const name = requiredString(formData, "name");
  const address = requiredString(formData, "address");
  const city = requiredString(formData, "city");
  const state = requiredString(formData, "state");
  const shifts = enumList(formData, "shifts", Object.values(SchoolShift));

  await prisma.school.create({ data: { name, address, city, state, shifts } });

  revalidatePath("/admin/escolas");
}

export async function updateSchoolProfile(formData: FormData) {
  const session = await requireRole(Role.SCHOOL_ADMIN);
  const schoolId = requiredString(formData, "schoolId");

  // Só quem administra essa escola pode editar o perfil dela.
  await prisma.schoolAdmin.findFirstOrThrow({
    where: { userId: session.user.id, schoolId },
  });

  const address = requiredString(formData, "address");
  const city = requiredString(formData, "city");
  const state = requiredString(formData, "state");
  const infra = optionalString(formData, "infra");
  const shifts = enumList(formData, "shifts", Object.values(SchoolShift));

  await prisma.school.update({
    where: { id: schoolId },
    data: { address, city, state, infra, shifts },
  });

  revalidatePath("/escola");
}
