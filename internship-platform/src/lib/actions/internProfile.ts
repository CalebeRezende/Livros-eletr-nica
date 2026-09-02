"use server";

import { redirect } from "next/navigation";
import { SchoolShift, UserRole } from "@prisma/client";

import { auth, updateSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/roles";
import { requiredString, enumList } from "@/lib/validation";

// Único fluxo de acesso que não depende de convite: qualquer login novo
// (role PENDING) pode se auto-declarar estagiário completando o perfil.
export async function registerAsIntern(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Não autenticado.");
  if (session.user.role !== Role.PENDING) {
    throw new Error("Este login já tem um papel definido.");
  }

  const university = requiredString(formData, "university");
  const course = requiredString(formData, "course");
  const semesterRaw = Number(formData.get("semester"));
  const semester = Number.isFinite(semesterRaw) && semesterRaw > 0 ? semesterRaw : undefined;
  const preferredShifts = enumList(formData, "preferredShifts", Object.values(SchoolShift));

  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { role: UserRole.INTERN } }),
    prisma.internProfile.create({
      data: { userId: session.user.id, university, course, semester, preferredShifts },
    }),
  ]);

  // Sem isto, o JWT (já emitido) continuaria com role PENDING até o
  // próximo login, e o middleware mandaria de volta pra /pending-approval.
  await updateSession({ user: { ...session.user, role: UserRole.INTERN } });

  redirect("/estagiario/vagas");
}
