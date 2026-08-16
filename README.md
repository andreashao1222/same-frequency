# same frequency.

A music-taste matching site built with Next.js, Supabase, and the Spotify Web API.

## V2

- Real Supabase user pool
- Spotify artist search via server-side Client Credentials
- Five-artist taste profile
- Taste-style summary
- Five curated discovery recommendations biased toward less-obvious artists
- Match score based on both shared artists and shared taste tags
- Clickable Spotify profile links

## Environment variables

Copy `.env.example` to `.env.local` and add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

## Supabase

Run `supabase-schema.sql` in the Supabase SQL Editor.

## Run locally

```bash
npm install
npm run dev
```

The Spotify Web API is used only for catalog artist search. The site does not request Spotify user authorization or private Spotify account data.


### V8 AI report
Reports are generated from the five selected artists using the OpenAI Responses API and saved in `profiles.ai_report`. The old hard-coded recommendation fallback is disabled.
