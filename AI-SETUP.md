# same frequency. — Free local taste analysis

This version does **not** call OpenAI, Doubao, Volcengine Ark, or any other paid AI API.

The report is generated locally from the five selected artists and the genre metadata returned by Spotify search. The resulting report is then saved to Supabase in `ai_report` and reused when the profile is opened.

## Setup

No new AI environment variables are required.

Keep the existing Supabase and Spotify variables you already use:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

## What changed

- Removed the OpenAI dependency from the report-generation flow.
- Removed the Doubao / Ark dependency from the report-generation flow.
- Hip-hop, rap, trap, R&B, electronic, rock, folk, pop, etc. are inferred from Spotify artist genres.
- Added a larger hip-hop / rap recommendation pool so rap-heavy inputs do not collapse into indie recommendations.
- Taste report, cultural matches, musical opposite, and the screenshot/poster flow continue to use the existing Supabase structure.
- Existing saved `ai_report` records are reused.
- Older profiles without a report can be rebuilt locally when their profile is opened.

This keeps the public website usable without API credits.
