# same frequency. V5 profile-link update

This version removes the music-platform selector entirely. Users can paste any HTTPS music profile link, or leave it blank.

1. Run `supabase-social-migration.sql` in Supabase SQL Editor.
2. Replace the corresponding files in GitHub.
3. Let Vercel auto-deploy.
4. Test submitting with the profile link blank and with a non-Spotify HTTPS profile link.

Do not upload `.env.local` or secrets.
