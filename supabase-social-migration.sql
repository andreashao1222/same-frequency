-- same frequency. social profile migration
-- Run this in Supabase SQL Editor before deploying the social-board version.

alter table public.profiles
  add column if not exists music_platform text;

alter table public.profiles
  add column if not exists music_profile_url text;

-- Preserve existing Spotify profile data if the old column exists.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'spotify_url'
  ) then
    update public.profiles
    set music_platform = coalesce(music_platform, 'Spotify'),
        music_profile_url = coalesce(music_profile_url, spotify_url)
    where spotify_url is not null;
  end if;
end $$;
