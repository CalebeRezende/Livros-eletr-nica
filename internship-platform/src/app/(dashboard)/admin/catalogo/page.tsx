import { prisma } from "@/lib/prisma";
import { createKnowledgeArea, createEducationStage } from "@/lib/actions/catalog";
import { KnowledgeAreaKind, EducationStageLevel } from "@prisma/client";

const KIND_LABEL: Record<KnowledgeAreaKind, string> = {
  BNCC_EXPERIENCE_FIELD: "Campo de Experiência (Ed. Infantil)",
  KNOWLEDGE_AREA: "Área do Conhecimento",
};

const LEVEL_LABEL: Record<EducationStageLevel, string> = {
  EARLY_CHILDHOOD: "Educação Infantil",
  ELEMENTARY_1: "Fundamental I",
  ELEMENTARY_2: "Fundamental II",
  HIGH_SCHOOL: "Ensino Médio",
  EJA: "EJA",
};

export default async function CatalogPage() {
  const [areas, stages] = await Promise.all([
    prisma.knowledgeArea.findMany({ orderBy: { name: "asc" } }),
    prisma.educationStage.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Catálogo BNCC</h1>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium">Campos de Experiência / Áreas do Conhecimento</h2>
          <form action={createKnowledgeArea} className="mt-4 flex flex-col gap-2">
            <input name="name" placeholder="Nome (ex.: Matemática)" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select name="kind" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {Object.values(KnowledgeAreaKind).map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABEL[kind]}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
              Adicionar
            </button>
          </form>

          <ul className="mt-4 space-y-1 text-sm">
            {areas.map((area) => (
              <li key={area.id} className="flex justify-between border-b border-slate-100 py-1.5">
                <span>{area.name}</span>
                <span className="text-slate-400">{KIND_LABEL[area.kind]}</span>
              </li>
            ))}
            {areas.length === 0 && <p className="text-slate-500">Nenhum item cadastrado.</p>}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium">Etapas de ensino</h2>
          <form action={createEducationStage} className="mt-4 flex flex-col gap-2">
            <input name="label" placeholder="Rótulo (ex.: 3º ano - Fund. I)" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select name="level" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {Object.values(EducationStageLevel).map((level) => (
                <option key={level} value={level}>
                  {LEVEL_LABEL[level]}
                </option>
              ))}
            </select>
            <input name="order" type="number" placeholder="Ordem de exibição" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
              Adicionar
            </button>
          </form>

          <ul className="mt-4 space-y-1 text-sm">
            {stages.map((stage) => (
              <li key={stage.id} className="flex justify-between border-b border-slate-100 py-1.5">
                <span>{stage.label}</span>
                <span className="text-slate-400">{LEVEL_LABEL[stage.level]}</span>
              </li>
            ))}
            {stages.length === 0 && <p className="text-slate-500">Nenhuma etapa cadastrada.</p>}
          </ul>
        </section>
      </div>
    </main>
  );
}
