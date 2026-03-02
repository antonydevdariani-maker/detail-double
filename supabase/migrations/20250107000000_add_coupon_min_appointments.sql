-- Coupon is usable only after customer has this many completed appointments (null = no threshold).

alter table public.customer_coupons
  add column if not exists min_appointments integer check (min_appointments is null or min_appointments > 0);

comment on column public.customer_coupons.min_appointments is 'Customer must have this many completed appointments to use the coupon; null = no threshold';
