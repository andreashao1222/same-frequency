create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  alias text not null unique,
  artists jsonb not null,
  spotify_url text unique,
  taste_tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Existing projects: let non-Spotify listeners join too.
alter table public.profiles alter column spotify_url drop not null;

alter table public.profiles enable row level security;

drop policy if exists "public can read profiles" on public.profiles;
create policy "public can read profiles"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "public can create profiles" on public.profiles;
create policy "public can create profiles"
on public.profiles for insert
to anon, authenticated
with check (
  jsonb_array_length(artists) = 5
  and jsonb_array_length(taste_tags) >= 1
  and (spotify_url is null or spotify_url like 'https://open.spotify.com/%')
);

grant select, insert on public.profiles to anon, authenticated;
