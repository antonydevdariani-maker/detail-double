-- Blocked time slots: when admin is busy, customers cannot book these hours.
-- One row per hour (e.g. 14:00 = 2 PM block for that date).

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  date text not null,
  time text not null
);

alter table public.blocked_slots enable row level security;

create policy "Allow all for blocked_slots"
  on public.blocked_slots
  for all
  using (true)
  with check (true);

create index if not exists idx_blocked_slots_date on public.blocked_slots (date);
