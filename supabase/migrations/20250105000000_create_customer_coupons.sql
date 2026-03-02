-- Customer coupons: admin can give discounts (e.g. after 5 completed appointments).
-- customer_email = who the coupon is for; used_at set when they use it (optional).

create table if not exists public.customer_coupons (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value integer not null check (discount_value > 0),
  description text,
  created_at timestamptz default now(),
  used_at timestamptz
);

alter table public.customer_coupons enable row level security;

create policy "Allow all for customer_coupons"
  on public.customer_coupons
  for all
  using (true)
  with check (true);

create index if not exists idx_customer_coupons_user_email on public.customer_coupons (user_email);
