# same frequency.

A small MVP for matching people by music taste.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Current MVP

- Landing page
- Five-artist taste profile
- Spotify profile URL field
- Demo matching algorithm
- Match cards
- Spotify profile links
- LocalStorage for the current user's profile

## Next production steps

1. Replace demo artist suggestions with Spotify Web API artist search.
2. Add Supabase database + Row Level Security.
3. Store user profiles server-side.
4. Calculate matches against the real user pool.
5. Add moderation/reporting and privacy controls.
6. Deploy to Vercel.

The current similarity score is intentionally simple: shared artists / five selected artists.
