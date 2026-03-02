# Double A Details

Mobile car detailing site: book appointments (exterior / interior / both), view them in a calendar, and see all appointment addresses on a map with red dots.

## Calendar & backend (Supabase)

Appointments are saved to **Supabase** so you can see them in the **Calendar** page (month view + map with red dots per address).

### 1. Create a Supabase project

1. Go to [Supabase](https://supabase.com) and sign in.
2. **New project** → choose org, name, database password, region.
3. Wait for the project to be ready.

### 2. Create the `appointments` table

In the Supabase Dashboard open **SQL Editor** → **New query**, paste and run:

```sql
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  user_name text,
  user_email text,
  user_phone text,
  address text not null,
  date text not null,
  time text not null,
  service text not null,
  price int not null,
  vehicle text,
  completed boolean default false,
  cancelled boolean default false
);

alter table public.appointments enable row level security;

create policy "Allow all for appointments"
  on public.appointments for all using (true) with check (true);
```

### 3. Configure the app

1. In Supabase: **Project Settings** → **API**.
2. Copy **Project URL** and **anon public** key.
3. Copy `.env.example` to `.env` and set:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon public key
4. Restart the dev server (`npm run start`).

If you already had the table without phone numbers, add the column in SQL Editor:  
`alter table public.appointments add column if not exists user_phone text;`

For marking jobs done and cancelling (revenue from completed only), run:  
`alter table public.appointments add column if not exists completed boolean default false, add column if not exists cancelled boolean default false;`

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
