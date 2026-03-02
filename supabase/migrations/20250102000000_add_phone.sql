-- Run in Supabase SQL Editor if you already have the appointments table.
-- Adds phone number for guest bookings.

alter table public.appointments
  add column if not exists user_phone text;
