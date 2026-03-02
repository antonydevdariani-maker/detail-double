-- Run in Supabase SQL Editor to add done/cancel support.
alter table public.appointments
  add column if not exists completed boolean default false,
  add column if not exists cancelled boolean default false;
