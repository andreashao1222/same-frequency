-- same frequency. V5 profile-link migration
-- Music profile is optional and accepts any HTTPS profile link.

alter table public.profiles
  add column if not exists music_platform text;

alter table public.profiles
  add column if not exists music_profile_url text;


-- Store the AI-generated cultural report so it is generated once and reused.
alter table public.profiles
  add column if not exists ai_report jsonb;

-- Preserve old Spotify data.
update public.profiles
set
  music_platform = coalesce(music_platform, 'Spotify'),
  music_profile_url = coalesce(music_profile_url, spotify_url)
where spotify_url is not null;

alter table public.profiles
  alter column spotify_url drop not null;

-- Replace the old Spotify-specific INSERT restriction.
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
