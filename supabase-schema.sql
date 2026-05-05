create table if not exists public.transportplanner_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.transportplanner_state enable row level security;

drop policy if exists "transportplanner_state_select" on public.transportplanner_state;
drop policy if exists "transportplanner_state_insert" on public.transportplanner_state;
drop policy if exists "transportplanner_state_update" on public.transportplanner_state;

create policy "transportplanner_state_select"
on public.transportplanner_state
for select
to anon
using (true);

create policy "transportplanner_state_insert"
on public.transportplanner_state
for insert
to anon
with check (true);

create policy "transportplanner_state_update"
on public.transportplanner_state
for update
to anon
using (true)
with check (true);

insert into public.transportplanner_state (id, data)
values ('main', '{"taken":[],"aanvragen":[],"geblokt":[],"meld":[]}'::jsonb)
on conflict (id) do nothing;
