-- Consola de Revisión Clínica — schema, RLS, and DEMO seed.
-- ADD-ONLY: this migration introduces three brand-new tables and touches
-- nothing that already exists. Safe to run multiple times (idempotent).
--
-- Access model: a single source of truth = the `reviewers` allowlist.
-- A user may read/write the review data only when their auth email is present
-- in `reviewers`. RLS on `reviewers` itself lets a user see only their own row,
-- so the `auth.email() in (select email from reviewers)` predicate below
-- resolves to "the caller is an approved reviewer" without leaking the list.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.reviewers (
  email text primary key
);
-- Simón inserts the 3 reviewer emails after build.

create table if not exists public.gold_fragments (
  id uuid primary key default gen_random_uuid(),
  fragment_text text not null,
  proposed_area text not null check (proposed_area in ('A','B','C','D','E','F','G','H','I')),
  reason text,
  confidence numeric,
  status text not null default 'pending' check (status in ('pending','approved','corrected','rejected')),
  final_area text check (final_area in ('A','B','C','D','E','F','G','H','I')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.robustness_runs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz default now(),
  area text,
  accuracy_before numeric,
  accuracy_after numeric,
  generated int,
  rejected_dup int,
  rejected_review int,
  approved int
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.reviewers enable row level security;
alter table public.gold_fragments enable row level security;
alter table public.robustness_runs enable row level security;

-- reviewers: a user can read only their own allowlist row.
drop policy if exists reviewers_select_own on public.reviewers;
create policy reviewers_select_own on public.reviewers
  for select
  to authenticated
  using (email = auth.email());

-- gold_fragments: reviewers only — SELECT / INSERT / UPDATE.
drop policy if exists gold_fragments_select on public.gold_fragments;
create policy gold_fragments_select on public.gold_fragments
  for select
  to authenticated
  using (auth.email() in (select email from public.reviewers));

drop policy if exists gold_fragments_insert on public.gold_fragments;
create policy gold_fragments_insert on public.gold_fragments
  for insert
  to authenticated
  with check (auth.email() in (select email from public.reviewers));

drop policy if exists gold_fragments_update on public.gold_fragments;
create policy gold_fragments_update on public.gold_fragments
  for update
  to authenticated
  using (auth.email() in (select email from public.reviewers))
  with check (auth.email() in (select email from public.reviewers));

-- robustness_runs: reviewers only — SELECT / INSERT / UPDATE.
drop policy if exists robustness_runs_select on public.robustness_runs;
create policy robustness_runs_select on public.robustness_runs
  for select
  to authenticated
  using (auth.email() in (select email from public.reviewers));

drop policy if exists robustness_runs_insert on public.robustness_runs;
create policy robustness_runs_insert on public.robustness_runs
  for insert
  to authenticated
  with check (auth.email() in (select email from public.reviewers));

drop policy if exists robustness_runs_update on public.robustness_runs;
create policy robustness_runs_update on public.robustness_runs
  for update
  to authenticated
  using (auth.email() in (select email from public.reviewers))
  with check (auth.email() in (select email from public.reviewers));

-- ---------------------------------------------------------------------------
-- DEMO seed — fixed UUIDs + ON CONFLICT keep this idempotent.
-- Remove these rows once real data flows in. (Clearly marked DEMO.)
-- ---------------------------------------------------------------------------

-- DEMO: 3 pending fragments for the review queue.
insert into public.gold_fragments (id, fragment_text, proposed_area, reason, confidence, status)
values
  ('11111111-1111-1111-1111-111111111111',
   'El analista define la conducta objetivo en términos observables y medibles antes de iniciar la recolección de datos de línea base.',
   'C',
   'Describe medición y definición operacional de la conducta, núcleo del área de medición y análisis de datos.',
   0.82,
   'pending'),
  ('22222222-2222-2222-2222-222222222222',
   'Antes de implementar el procedimiento de extinción, se obtiene el consentimiento informado del tutor y se documenta el análisis de riesgos y beneficios.',
   'E',
   'El consentimiento informado y el balance riesgo/beneficio son obligaciones éticas del código profesional.',
   0.74,
   'pending'),
  ('33333333-3333-3333-3333-333333333333',
   'Se aplica un diseño de línea base múltiple a través de tres participantes para demostrar control experimental sobre la variable dependiente.',
   'D',
   'El diseño de línea base múltiple y la demostración de control experimental corresponden al diseño experimental.',
   0.91,
   'pending')
on conflict (id) do nothing;

-- DEMO: 5 robustness runs (one latest run per area drives the weakness map).
insert into public.robustness_runs (id, run_at, area, accuracy_before, accuracy_after, generated, rejected_dup, rejected_review, approved)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', now() - interval '2 days', 'A', 0.71, 0.86, 120,  18, 12, 90),
  ('aaaaaaaa-0000-0000-0000-000000000002', now() - interval '2 days', 'B', 0.83, 0.92, 140,  22, 10, 108),
  ('aaaaaaaa-0000-0000-0000-000000000003', now() - interval '2 days', 'C', 0.64, 0.79,  95,  14, 21, 60),
  ('aaaaaaaa-0000-0000-0000-000000000004', now() - interval '2 days', 'F', 0.88, 0.94, 160,  30,  8, 122),
  ('aaaaaaaa-0000-0000-0000-000000000005', now() - interval '2 days', 'G', 0.69, 0.73, 110,  25, 19, 66)
on conflict (id) do nothing;
