create table if not exists public.paystack_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subscription_code text not null,
  email_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.paystack_subscriptions enable row level security;
revoke all on public.paystack_subscriptions from anon, authenticated;
grant all on public.paystack_subscriptions to service_role;

alter table public.profiles
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists paystack_subscription_code text;