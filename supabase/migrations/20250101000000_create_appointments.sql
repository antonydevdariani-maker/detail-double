-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- or via Supabase CLI: supabase db push

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  user_name text,
  user_email text,
  address text not null,
  date text not null,
  time text not null,
  service text not null,
  price int not null,
  vehicle text
);

-- Allow anonymous read/write for the app (use Row Level Security in production)
alter table public.appointments enable row level security;

create policy "Allow all for appointments"
  on public.appointments
  for all
  using (true)
  with check (true);
