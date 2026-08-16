#!/usr/bin/env python3
"""
Build Same Frequency's local artist database from MusicBrainz.

Usage:
  python build_musicbrainz_db.py artists_seed.txt

Output:
  data/artists.json

Important:
- This runs ONCE during database preparation, not on every website request.
- It uses MusicBrainz artist search + artist tags/genres.
- It keeps raw tags and also normalizes obvious spelling variants.
- It caches responses and throttles requests.
- Review the generated file before committing it.
"""

import json, re, sys, time
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

API = "https://musicbrainz.org/ws/2"
OUT = Path("data/artists.json")
CACHE = Path(".mb-cache")
CACHE.mkdir(exist_ok=True)
OUT.parent.mkdir(exist_ok=True)

HEADERS = {
    "User-Agent": "SameFrequency/1.0 (student music project; contact@example.com)",
    "Accept": "application/json",
}

ALIASES = {
    "hip hop": "hip-hop",
    "hip-hop": "hip-hop",
    "r&b": "r&b",
    "rnb": "r&b",
    "alternative r&b": "alternative r&b",
    "dream pop": "dream pop",
    "dream-pop": "dream pop",
    "art pop": "art pop",
    "art-pop": "art pop",
    "indie rock": "indie rock",
    "indie-rock": "indie rock",
    "indie pop": "indie pop",
    "indie-pop": "indie pop",
    "singer songwriter": "singer-songwriter",
    "singer-songwriter": "singer-songwriter",
}

def clean(s):
    s = re.sub(r"\s+", " ", str(s).strip().lower())
    return ALIASES.get(s, s)

def get_json(url, cache_name):
    cache = CACHE / (cache_name + ".json")
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=30) as r:
        data = json.load(r)
    cache.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    time.sleep(1.1)  # keep requests gentle
    return data

def search_artist(name):
    q = quote(f'artist:"{name}"')
    data = get_json(f"{API}/artist/?query={q}&fmt=json&limit=5",
                    "search_" + re.sub(r"[^a-z0-9]+", "_", name.lower()))
    artists = data.get("artists", [])
    if not artists:
        return None
    # Prefer exact normalized name.
    n = clean(name)
    exact = [a for a in artists if clean(a.get("name","")) == n]
    return (exact or artists)[0]

def fetch_tags(mbid):
    data = get_json(f"{API}/artist/{mbid}?inc=tags+genres&fmt=json", "artist_" + mbid)
    tags = []
    for x in data.get("genres", []):
        if x.get("name"): tags.append(x["name"])
    for x in data.get("tags", []):
        if x.get("name"): tags.append(x["name"])
    # preserve order while removing duplicates
    seen, out = set(), []
    for x in tags:
        x = clean(x)
        if x and x not in seen:
            seen.add(x); out.append(x)
    return out

def main():
    seed = Path(sys.argv[1] if len(sys.argv) > 1 else "artists_seed.txt")
    names = [x.strip() for x in seed.read_text(encoding="utf-8").splitlines()
             if x.strip() and not x.lstrip().startswith("#")]
    names = list(dict.fromkeys(names))

    results, missing = [], []
    for i, name in enumerate(names, 1):
        try:
            a = search_artist(name)
            if not a:
                missing.append(name)
                continue
            mbid = a["id"]
            tags = fetch_tags(mbid)
            results.append({
                "name": a.get("name", name),
                "mbid": mbid,
                "sort_name": a.get("sort-name"),
                "type": a.get("type"),
                "country": a.get("country"),
                "tags": tags
            })
            print(f"[{i}/{len(names)}] {name} -> {len(tags)} tags")
        except Exception as e:
            print(f"ERROR {name}: {e}")
            missing.append(name)

    payload = {
        "version": 1,
        "source": "MusicBrainz",
        "generated_at": time.strftime("%Y-%m-%d"),
        "artist_count": len(results),
        "artists": results,
        "missing": missing
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nWrote {OUT} with {len(results)} artists.")
    print(f"Missing: {len(missing)}")

if __name__ == "__main__":
    main()
