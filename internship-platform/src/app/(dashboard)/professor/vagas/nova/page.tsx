import { prisma } from "@/lib/prisma";
import { createOffer } from "@/lib/actions/offers";
import { SchoolShift, KnowledgeAreaKind } from "@prisma/client";

const SHIFT_LABEL: Record<SchoolShift, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  EVENING: "Noite",
  FULL_TIME: "Integral",
};

const KIND_LABEL: Record<KnowledgeAreaKind, string> = {
  BNCC_EXPERIENCE_FIELD: "Campo de Experiência",
  KNOWLEDGE_AREA: "Área do Conhecimento",
};

export default async function NewOfferPage() {
  const [stages, areas] = await Promise.all([
    prisma.educationStage.findMany({ orderBy: { order: "asc" } }),
    prisma.knowledgeArea.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Nova vaga de estágio</h1>
      <p className="text-slate-600">
        Ao salvar, a vaga fica em rascunho — você pode revisar antes de enviar para a
        escola aprovar.
      </p>

      <form action={createOffer} className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <label className="flex flex-col gap-1 text-sm">
          Título
          <input name="title" required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Descrição (projeto em andamento, tema de interesse)
          <textarea name="description" required rows={4} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Turno
            <select name="shift" required className="rounded-lg border border-slate-300 px-3 py-2">
              {Object.values(SchoolShift).map((shift) => (
                <option key={shift} value={shift}>
                  {SHIFT_LABEL[shift]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Nº de vagas
            <input name="slots" type="number" min={1} defaultValue={1} className="rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Etapa de ensino
          <select name="educationStageId" required className="rounded-lg border border-slate-300 px-3 py-2">
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1">Áreas do Conhecimento / Campos de Experiência</legend>
          <div className="flex flex-wrap gap-3">
            {areas.map((area) => (
              <label key={area.id} className="flex items-center gap-1.5">
                <input type="checkbox" name="knowledgeAreaIds" value={area.id} />
                {area.name}
                <span className="text-xs text-slate-400">({KIND_LABEL[area.kind]})</span>
              </label>
            ))}
            {areas.length === 0 && (
              <p className="text-slate-500">
                Nenhuma área cadastrada ainda — peça para a Secretaria cadastrar no
                catálogo BNCC.
              </p>
            )}
          </div>
        </fieldset>

        <button type="submit" className="w-fit rounded-lg bg-slate-900 px-5 py-2 text-sm text-white">
          Salvar rascunho
        </button>
      </form>
    </main>
  );
}
