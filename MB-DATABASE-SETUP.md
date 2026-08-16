# Same Frequency — MusicBrainz database

This version no longer depends on an AI API for taste analysis.

## One-time setup

After you replace the files in GitHub, on your computer, inside the project folder, run:

```bash
npm install
npm run build:musicbrainz
```

This creates `data/artist-tags.json` from the 1000+ names in `artists_seed.txt` using MusicBrainz artist tags/genres. The generated JSON is then committed to GitHub.

After that, Vercel only reads the local JSON. It does **not** call MusicBrainz for each visitor.

If you don't want to run the command yet, the site still builds and uses the existing fallback metadata; the new engine automatically starts using the MusicBrainz catalog as soon as `data/artist-tags.json` contains records.
