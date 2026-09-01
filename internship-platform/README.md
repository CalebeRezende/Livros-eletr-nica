# Plataforma de Gerenciamento de Estágios de Licenciatura

Conecta Secretarias de Educação, Escolas, Professores Supervisores/Preceptores
e Estagiários de Licenciatura, automatizando a oferta, alocação e
acompanhamento de vagas de estágio.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma ORM ·
PostgreSQL · NextAuth (Auth.js) v5 com Google OAuth 2.0.

Todo o boilerplate deste repositório foi **testado de ponta a ponta** antes
do commit: `next build` completo (type-check incluso) sem erros nem warnings
de Edge Runtime, e a `prisma/schema.prisma` foi migrada contra um Postgres
real com um smoke test escrevendo o grafo inteiro (Escola → Professor → Vaga
→ Candidatura → Diário de bordo) e lendo de volta com sucesso.

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
  logar com esse e-mail, o role e o vínculo com a escola são aplicados
  automaticamente (`events.createUser` em `src/auth.ts`).
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
   convidar o e-mail dele como `SUPERVISOR`.
2. Após aceitar o convite (novo login com o mesmo e-mail), cai em
   `/professor/vagas`.
3. **Configura disponibilidade** (turnos/horários) — tela própria de
   `Availability`, pré-requisito para criar vagas.
4. **Cria uma vaga**: título, descrição (projeto/tema), turno, etapa de
   ensino, uma ou mais Áreas do Conhecimento/Campos de Experiência, número
   de vagas. Vaga nasce `DRAFT` → some para `PENDING_SCHOOL_APPROVAL`.
5. Depois de aprovada pela Escola (`OPEN`), acompanha candidaturas
   recebidas em `/professor/vagas/[id]/candidaturas`: aprova ou rejeita
   cada `Application`.
6. Ao longo do estágio, revisa o diário de bordo do estagiário aprovado e,
   ao final, registra a `Evaluation`.

### Estagiário

1. Login Google → primeiro acesso cai em `/pending-approval`, mas com CTA
   "Completar meu perfil" (não depende de convite).
2. Preenche `InternProfile`: universidade, curso, semestre, turnos
   preferidos → sai do estado `PENDING`, vira `INTERN`.
3. Cai em `/estagiario/vagas`: lista de vagas `OPEN`, com filtros por
   turno, etapa de ensino e área/campo de experiência (e, com o diferencial
   #1, ordenadas por match com o próprio perfil).
4. Abre uma vaga, lê o projeto/tema do professor, envia candidatura
   (`Application` nasce `PENDING`, com mensagem opcional).
5. Acompanha o status em `/estagiario/candidaturas`. Se `APPROVED`, passa a
   ver o botão "Registrar atividade".
6. Ao longo do estágio, preenche o **diário de bordo** (`ActivityLog`): data,
   horas, descrição, opcionalmente foto/anexo e check-in de geolocalização.
7. Ao concluir, vê a avaliação do professor e pode registrar a própria
   avaliação da experiência.

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
    ├── auth.ts                # config completa: adapter, provider Google, eventos de RBAC
    ├── middleware.ts           # protege rotas por role, fora do Node.js runtime
    ├── lib/
    │   ├── prisma.ts           # singleton do Prisma Client
    │   ├── roles.ts            # espelho local do enum UserRole (edge-safe)
    │   └── rbac.ts             # mapa rota -> roles permitidos
    ├── types/
    │   └── next-auth.d.ts      # augmenta Session/JWT com id + role
    └── app/
        ├── page.tsx                          # landing
        ├── (auth)/login/page.tsx
        ├── (auth)/pending-approval/page.tsx
        ├── (dashboard)/admin/page.tsx         # SUPER_ADMIN
        ├── (dashboard)/escola/page.tsx        # SCHOOL_ADMIN
        ├── (dashboard)/professor/vagas/page.tsx  # SUPERVISOR
        ├── (dashboard)/estagiario/vagas/page.tsx # INTERN
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
alguém pela UI de admin só reflete no próximo login (ou via
`unstable_update()` do NextAuth, se quiser refletir na hora).

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
