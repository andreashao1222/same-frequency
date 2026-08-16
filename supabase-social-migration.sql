-- same frequency. V4 social migration
-- Run once in Supabase SQL Editor before deploying the updated app.

alter table public.profiles
  add column if not exists music_platform text;

alter table public.profiles
  add column if not exists music_profile_url text;

-- The old Spotify-only column is kept for backwards compatibility,
-- but it must be optional now.
alter table public.profiles
  alter column spotify_url drop not null;

-- Move existing Spotify links into the new generic profile fields.
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
    or (
      music_platform = 'Spotify'
      and music_profile_url like 'https://open.spotify.com/%'
    )
    or music_platform <> 'Spotify'
  )
);

grant select, insert on public.profiles to anon, authenticated;
