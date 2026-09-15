-- Between the Pages — Phase 2: Journal
-- Daily prompt system, linked to the journal_entries.prompt_id column that
-- was left unconstrained in Phase 1 (the table didn't exist yet).

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_text text not null,
  theme text,
  active_date date unique,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.journal_entries
  add constraint journal_entries_prompt_id_fkey
  foreign key (prompt_id) references public.prompts (id) on delete set null;

alter table public.prompts enable row level security;

-- Prompts carry no personal content — safe to read for anyone the app lets
-- reach the Today page. Only 'active' prompts are exposed; draft/archived
-- rows stay invisible to anon/authenticated and are managed via the
-- moderator dashboard (service role) in a later phase.
create policy "active prompts are publicly readable"
  on public.prompts for select
  to anon, authenticated
  using (status = 'active');

-- journal_entries.deleted_at was reserved in Phase 1 but deletion turns out
-- to be a hard delete (private text has no reason to linger once a user
-- asks for it gone) — drop the unused column rather than carry dead schema.
alter table public.journal_entries drop column deleted_at;
