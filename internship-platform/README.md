# Plataforma de Gerenciamento de Estágios de Licenciatura

Conecta Secretarias de Educação, Escolas, Professores Supervisores/Preceptores
e Estagiários de Licenciatura, automatizando a oferta, alocação e
acompanhamento de vagas de estágio.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma ORM ·
PostgreSQL · NextAuth (Auth.js) v5 com Google OAuth 2.0.

**Status:** o CRUD completo do ciclo de vida principal está implementado e
funcionando (não é só boilerplate) — cadastro de escolas e catálogo BNCC,
convites, disponibilidade, criação/aprovação de vaga, candidatura, decisão
do professor e diário de bordo com check-in de geolocalização. Certificado
automático, avaliação 360°, gamificação, match inteligente e banco de boas
práticas (seção 1) continuam como ideias de próximos passos, não
implementadas.

Tudo foi **testado de ponta a ponta** antes de cada commit: `next build`
completo (type-check incluso) sem erros nem warnings de Edge Runtime, e um
smoke test rodando o ciclo de vida inteiro contra um Postgres real —
convite de admin de escola, convite de professor (com criação automática do
`SupervisorProfile`, um bug real que esse teste pegou antes do commit),
criação/aprovação de vaga, auto-cadastro de estagiário, candidatura
(incluindo bloqueio de candidatura duplicada), decisão do professor (com
checagem de que só o dono da vaga decide) e diário de bordo com
geolocalização.

---

## 1. Diferenciais sugeridos

Recursos que vão além do CRUD básico de vagas/candidaturas:

1. **Match inteligente** — ao invés de só filtrar, ranqueia vagas para cada
   estagiário cruzando curso/área de formação, turno disponível e
   Campos de Experiência/Áreas do Conhecimento de interesse (declarados no
   perfil). Mesmo algoritmo, invertido, sugere ao professor os estagiários
   mais aderentes a uma vaga recém-aberta.
2. **Diário de bordo estruturado** — o `ActivityLog` do schema já modela
   isso: cada registro tem data, horas, descrição e anexo, permitindo gerar
   automaticamente o relatório final de horas cumpridas (em vez do
   estagiário preencher uma planilha à parte).
3. **Check-in por geolocalização** — ao registrar uma atividade, captura
   lat/lng do navegador e confere contra a localização cadastrada da escola
   (`School.latitude/longitude`), sinalizando divergência para o professor
   validar. Campos já previstos em `ActivityLog.checkInLat/Lng/At`.
4. **Certificado automático** — ao atingir a carga horária mínima
   configurada (parâmetro global do Super Admin) e ter avaliação final
   positiva, gera automaticamente um PDF de certificado de conclusão,
   assinado digitalmente pelo professor supervisor.
5. **Avaliação 360°** — o modelo `Evaluation` já suporta avaliação nos dois
   sentidos (`SUPERVISOR` avalia o estagiário e vice-versa), fechando o
   ciclo com feedback estruturado, não só uma nota.
6. **Gamificação leve** — badges por marcos (primeira candidatura aprovada,
   10 registros no diário de bordo, avaliação 5 estrelas) para engajar
   estagiários; ranking opcional por universidade para a coordenação de
   estágio institucional acompanhar.
7. **Banco de boas práticas** — professor pode marcar um projeto/tema de
   uma vaga encerrada como "modelo público"; outros professores da rede
   descobrem e reaproveitam a descrição ao criar novas vagas, aumentando a
   qualidade média das ofertas ao longo do tempo.

---

## 2. Perfis de acesso (RBAC)

| Role (`UserRole`) | Quem | Pode |
|---|---|---|
| `SUPER_ADMIN` | Secretaria de Educação | Cadastrar escolas, manter catálogos globais (BNCC/áreas, etapas de ensino), ver dashboards consolidados |
| `SCHOOL_ADMIN` | Direção/Coordenação | Gerenciar perfil da escola, convidar/validar professores, aprovar vagas |
| `SUPERVISOR` | Professor/Preceptor | Definir disponibilidade, criar vagas, aprovar candidatos |
| `INTERN` | Estagiário | Completar perfil, filtrar/candidatar-se a vagas, registrar diário de bordo |
| `PENDING` | Qualquer login novo | Nada — tela de espera até ganhar um role |

Login é **só** Google OAuth (não há senha própria). O papel de cada pessoa
**não** vem do domínio de e-mail (estagiários usam e-mail pessoal ou da
universidade) — vem de:

- **Bootstrap**: o e-mail em `SUPER_ADMIN_EMAIL` vira `SUPER_ADMIN` no
  primeiro login.
- **Convite** (`Invite`): Super Admin convida um e-mail para `SCHOOL_ADMIN`
  de uma escola; Admin de Escola convida um e-mail para `SUPERVISOR`. Ao
  logar com esse e-mail, o role, o vínculo com a escola (`SchoolAdmin`) e,
  para professor, o `SupervisorProfile`, são criados automaticamente —
  resolvido em `resolveInitialRole()` (`src/lib/bootstrap-role.ts`), chamado
  de dentro do callback `jwt()` em `src/auth.ts`.
- **Auto-cadastro**: um `INTERN` não precisa de convite — ao preencher o
  próprio perfil de estagiário, sai do estado `PENDING`.

---

## 3. Modelo de dados

Schema completo em [`prisma/schema.prisma`](./prisma/schema.prisma) — aqui
vai o resumo das entidades e como se relacionam:

```
User (role: PENDING|SUPER_ADMIN|SCHOOL_ADMIN|SUPERVISOR|INTERN)
 ├─ Account / Session / VerificationToken   (tabelas exigidas pelo NextAuth)
 ├─ SchoolAdmin[]        ── N:N com School (um admin pode gerir +1 escola)
 ├─ SupervisorProfile?   ── 1:1, só se role = SUPERVISOR
 └─ InternProfile?       ── 1:1, só se role = INTERN

Invite (email, role, schoolId?) ── convite pendente para SCHOOL_ADMIN/SUPERVISOR

School
 ├─ shifts: SchoolShift[]         (MORNING | AFTERNOON | EVENING | FULL_TIME)
 ├─ SupervisorProfile[]
 └─ InternshipOffer[]

SupervisorProfile
 ├─ Availability[]        (turnos/horários em que aceita estagiários)
 └─ InternshipOffer[]

KnowledgeArea (kind: BNCC_EXPERIENCE_FIELD | KNOWLEDGE_AREA)  ── catálogo global
EducationStage (level: EARLY_CHILDHOOD..EJA, label)           ── catálogo global

InternshipOffer (status: DRAFT|PENDING_SCHOOL_APPROVAL|OPEN|CLOSED|ARCHIVED)
 ├─ pertence a School + SupervisorProfile + EducationStage
 ├─ N:N com KnowledgeArea (via InternshipOfferKnowledgeArea)
 └─ Application[]

InternProfile
 └─ Application[] (status: PENDING|APPROVED|REJECTED|CANCELLED|COMPLETED)
     ├─ ActivityLog[]   (diário de bordo: data, horas, descrição, geo check-in)
     └─ Evaluation[]    (evaluatorRole: SUPERVISOR|INTERN, score, feedback)
```

Decisões de modelagem relevantes:

- **Campos de Experiência x Áreas do Conhecimento** viraram uma entidade só
  (`KnowledgeArea` com `kind`) — evita duplicar toda a estrutura de N:N
  para "é Educação Infantil" vs. "é Fundamental/Médio"; o filtro por `kind`
  resolve isso.
- **`Invite` não é o único jeito de ganhar acesso**: só `SCHOOL_ADMIN` e
  `SUPERVISOR` exigem convite (alguém precisa vinculá-los a uma escola).
  `INTERN` se auto-cadastra.
- **`ActivityLog` tem os campos de geolocalização desde já** (diferencial
  #3), mesmo antes de implementar a UI — evita migration extra depois.

---

## 4. Fluxos de tela

### Professor Supervisor

1. Login Google → primeiro acesso fica em `/pending-approval` até a Direção
   convidar o e-mail dele como `SUPERVISOR` (`/escola/professores`).
2. Após aceitar o convite (novo login com o mesmo e-mail), cai em
   `/professor/vagas`.
3. **Configura disponibilidade** em `/professor/disponibilidade` (turnos e
   horários em que aceita estagiários).
4. **Cria uma vaga** em `/professor/vagas/nova`: título, descrição
   (projeto/tema), turno, etapa de ensino, uma ou mais Áreas do
   Conhecimento/Campos de Experiência, número de vagas. Nasce `DRAFT`.
5. Na página da vaga (`/professor/vagas/[id]`), clica em "Enviar para
   aprovação da escola" → `PENDING_SCHOOL_APPROVAL`.
6. Depois de aprovada pela Escola (`OPEN`), acompanha e decide as
   candidaturas recebidas na mesma página (`/professor/vagas/[id]`):
   aprova ou rejeita cada `Application`.
7. Pode encerrar a vaga (`CLOSED`) quando as vagas forem preenchidas.

*Ainda não implementado nesta tela:* registrar a `Evaluation` final do
estagiário (o modelo já existe no schema).

### Estagiário

1. Login Google → primeiro acesso cai em `/pending-approval`, com um
   formulário "Sou estagiário" (não depende de convite).
2. Preenche `InternProfile`: universidade, curso, semestre, turnos
   preferidos → sai do estado `PENDING`, vira `INTERN`, e é redirecionado
   direto para `/estagiario/vagas` (a troca de role no JWT em andamento é
   propagada na hora via `unstable_update()`, sem precisar de novo login).
3. Em `/estagiario/vagas`: lista de vagas `OPEN` (escola, etapa de ensino,
   turno, áreas), com botão "Candidatar-se" e mensagem opcional.
4. Acompanha o status em `/estagiario/candidaturas`: cancela candidaturas
   `PENDING`, ou abre o diário de bordo das `APPROVED`.
5. Em `/estagiario/candidaturas/[id]/diario`, registra atividades: data,
   horas, descrição, e um botão opcional "Marcar localização" que captura
   lat/lng do navegador (`navigator.geolocation`) e envia junto no
   `ActivityLog`.

*Ainda não implementado nesta tela:* filtro/match por área e turno na
listagem de vagas, e a avaliação da experiência pelo estagiário (modelo
`Evaluation` já existe no schema, sem UI ainda).

---

## 5. Estrutura de pastas

```
internship-platform/
├── prisma/
│   ├── schema.prisma
│   └── migrations/            # migração inicial já commitada (npx prisma migrate deploy)
├── docker-compose.yml         # só o Postgres, para dev local
├── .env.example
└── src/
    ├── auth.config.ts         # config NextAuth "edge-safe" (sem Prisma) — usado pelo middleware
    ├── auth.ts                # config completa: adapter, provider Google, resolução de role no login
    ├── middleware.ts          # protege rotas por role, fora do Node.js runtime
    ├── components/
    │   └── ActivityLogForm.tsx   # client component: captura geolocalização antes de submeter
    ├── lib/
    │   ├── prisma.ts           # singleton do Prisma Client
    │   ├── roles.ts            # espelho local do enum UserRole (edge-safe)
    │   ├── rbac.ts             # mapa rota -> roles permitidos (usado pelo middleware)
    │   ├── auth-guards.ts      # requireRole() para Server Actions
    │   ├── validation.ts       # helpers de validação de FormData
    │   ├── bootstrap-role.ts   # bootstrap/convite -> role, chamado do jwt() em auth.ts
    │   └── actions/            # Server Actions, uma por área: schools, catalog, invites,
    │                           # availability, offers, applications, activityLogs, internProfile
    ├── types/
    │   └── next-auth.d.ts      # augmenta Session/JWT com id + role
    └── app/
        ├── page.tsx                                    # landing
        ├── (auth)/login/page.tsx
        ├── (auth)/pending-approval/page.tsx             # + auto-cadastro de estagiário
        ├── (dashboard)/layout.tsx                       # nav por role + botão sair
        ├── (dashboard)/admin/{page,escolas,catalogo}.tsx        # SUPER_ADMIN
        ├── (dashboard)/escola/{page,professores,vagas}.tsx      # SCHOOL_ADMIN
        ├── (dashboard)/professor/{vagas,vagas/nova,vagas/[id],disponibilidade}.tsx  # SUPERVISOR
        ├── (dashboard)/estagiario/{vagas,candidaturas,candidaturas/[id]/diario}.tsx # INTERN
        └── api/auth/[...nextauth]/route.ts
```

**Por que `auth.config.ts` existe separado de `auth.ts`:** o middleware do
Next.js roda no Edge Runtime, que não suporta o Prisma Client (usa uma
engine WASM/Node-only). Colocar `PrismaAdapter` ou qualquer import de
`@/lib/prisma` num arquivo que o middleware importa quebra o build (ou pior,
falha silenciosamente em produção). `auth.config.ts` só tem o que roda no
Edge (estratégia JWT, callbacks de role, página de login); `auth.ts` estende
isso com o adapter e os providers para uso em Server Components e Route
Handlers (Node.js runtime). Isso já é exercitado neste repo — o build foi
validado exatamente para pegar esse tipo de regressão.

Roles ficam no **JWT**, não em sessão de banco: middleware não pode
consultar o Postgres a cada request. Trade-off aceito: mudar o role de
alguém pela UI de admin só reflete no próximo login daquela pessoa. A
exceção é o próprio fluxo de auto-cadastro do estagiário
(`registerAsIntern` em `src/lib/actions/internProfile.ts`): como o usuário
sai de `PENDING` e precisa ser redirecionado na hora para a área de
estagiário, essa action chama `unstable_update()` para re-assinar o JWT
antes do redirect — sem isso o middleware o mandaria de volta pra
`/pending-approval` com a role antiga.

---

## 6. Como rodar localmente

Pré-requisitos: Node 20+, Docker (para o Postgres).

```bash
cd internship-platform
cp .env.example .env
# preencha AUTH_SECRET (openssl rand -base64 33), AUTH_GOOGLE_ID/SECRET
# (console.cloud.google.com → APIs & Services → Credentials → OAuth Client
#  ID, tipo "Web application", redirect URI: http://localhost:3000/api/auth/callback/google)

docker compose up -d          # sobe o Postgres
npm install
npx prisma migrate deploy     # aplica a migração já commitada
npm run dev                   # http://localhost:3000
```

Para virar Super Admin no primeiro login, coloque seu e-mail em
`SUPER_ADMIN_EMAIL` no `.env` antes do primeiro `Entrar com Google`.
