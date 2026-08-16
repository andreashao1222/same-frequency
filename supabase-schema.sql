create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  alias text not null unique,
  artists jsonb not null,
  spotify_url text unique,
  music_platform text,
  music_profile_url text,
  taste_tags jsonb not null default '[]'::jsonb,
  ai_report jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists music_platform text;

alter table public.profiles
  add column if not exists ai_report jsonb;

alter table public.profiles
  add column if not exists music_profile_url text;

alter table public.profiles
  alter column spotify_url drop not null;

update public.profiles
set music_platform = coalesce(music_platform, 'Spotify'),
    music_profile_url = coalesce(music_profile_url, spotify_url)
where spotify_url is not null;

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
  and (
    music_profile_url is null
    or music_profile_url like 'https://%'
  )
);

grant select, insert on public.profiles to anon, authenticated;
