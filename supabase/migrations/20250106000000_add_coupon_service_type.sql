-- Tie coupons to a service type: exterior, interior, both, or null = any service.

alter table public.customer_coupons
  add column if not exists service_type text
  check (service_type is null or service_type in ('exterior', 'interior', 'both'));

comment on column public.customer_coupons.service_type is 'exterior, interior, both, or null for any service';
