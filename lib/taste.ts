export type TasteProfile = {
  tags: string[];
  description: string;
};

type ArtistStyle = {
  tags: string[];
  discovery?: number;
};

const styles: Record<string, ArtistStyle> = {
  "clairo": { tags: ["bedroom pop", "indie pop", "dream pop", "soft vocals"] },
  "phoebe bridgers": { tags: ["indie folk", "singer-songwriter", "alternative", "soft vocals"] },
  "laufey": { tags: ["jazz pop", "soft vocals", "singer-songwriter", "dreamy"] },
  "the 1975": { tags: ["indie pop", "alternative", "synth pop", "nostalgic"] },
  "ethel cain": { tags: ["dark americana", "alternative", "dreamy", "gothic"] },
  "lorde": { tags: ["alternative pop", "art pop", "synth pop", "nostalgic"] },
  "the marías": { tags: ["dream pop", "indie pop", "psychedelic pop", "soft vocals"] },
  "mitski": { tags: ["indie rock", "singer-songwriter", "alternative", "dramatic"] },
  "beabadoobee": { tags: ["indie rock", "bedroom pop", "alternative", "nostalgic"] },
  "caroline polachek": { tags: ["art pop", "experimental pop", "alternative", "dreamy"] },
  "weyes blood": { tags: ["art pop", "singer-songwriter", "dreamy", "psychedelic pop"] },
  "big thief": { tags: ["indie folk", "indie rock", "singer-songwriter", "alternative"] },
  "fka twigs": { tags: ["art pop", "experimental pop", "alternative", "dark"] },
  "wolf alice": { tags: ["indie rock", "alternative", "dream pop", "shoegaze"] },
  "japanese breakfast": { tags: ["indie pop", "indie rock", "dream pop", "nostalgic"] },
  "men i trust": { tags: ["dream pop", "indie pop", "soft vocals", "psychedelic pop"] },
  "faye webster": { tags: ["indie folk", "singer-songwriter", "soft vocals", "dreamy"] },
  "lana del rey": { tags: ["alternative pop", "dreamy", "dark", "nostalgic"] },

  // Curated discovery pool — deliberately less obvious than the main artists.
  "hatchie": { tags: ["dream pop", "shoegaze", "indie pop", "nostalgic"], discovery: 92 },
  "cults": { tags: ["dream pop", "indie pop", "psychedelic pop", "nostalgic"], discovery: 88 },
  "heavenly": { tags: ["indie pop", "dream pop", "nostalgic", "soft vocals"], discovery: 94 },
  "frankie cosmos": { tags: ["bedroom pop", "indie pop", "singer-songwriter", "soft vocals"], discovery: 90 },
  "field medic": { tags: ["indie folk", "singer-songwriter", "bedroom pop", "soft vocals"], discovery: 91 },
  "jockstrap": { tags: ["experimental pop", "art pop", "alternative", "dreamy"], discovery: 86 },
  "yeule": { tags: ["experimental pop", "dream pop", "alternative", "dark"], discovery: 84 },
  "florist": { tags: ["indie folk", "singer-songwriter", "soft vocals", "dreamy"], discovery: 95 },
  "haley heynderickx": { tags: ["indie folk", "singer-songwriter", "soft vocals", "dreamy"], discovery: 93 },
  "sasami": { tags: ["alternative", "indie rock", "dreamy", "dark"], discovery: 87 },
  "crumb": { tags: ["dream pop", "psychedelic pop", "indie pop", "soft vocals"], discovery: 85 },
  "homeshake": { tags: ["bedroom pop", "dream pop", "indie pop", "soft vocals"], discovery: 89 },
  "sobs": { tags: ["bedroom pop", "indie pop", "nostalgic", "soft vocals"], discovery: 96 },
  "dora jar": { tags: ["indie pop", "alternative", "art pop", "dreamy"], discovery: 97 },
  "emily yacina": { tags: ["bedroom pop", "dream pop", "soft vocals", "singer-songwriter"], discovery: 98 },
  "flatsound": { tags: ["indie folk", "bedroom pop", "singer-songwriter", "soft vocals"], discovery: 99 },
  "julia jacklin": { tags: ["indie rock", "singer-songwriter", "alternative", "nostalgic"], discovery: 83 },
  "soccer mommy": { tags: ["indie rock", "bedroom pop", "alternative", "singer-songwriter"], discovery: 80 },
  "snail mail": { tags: ["indie rock", "alternative", "bedroom pop", "nostalgic"], discovery: 79 },
  "indigo de souza": { tags: ["indie rock", "singer-songwriter", "alternative", "dramatic"], discovery: 81 },
  "spellling": { tags: ["art pop", "experimental pop", "dark", "dramatic"], discovery: 88 },
  "ivy lab": { tags: ["experimental pop", "alternative", "dark", "dreamy"], discovery: 93 },
  "bar italia": { tags: ["indie rock", "alternative", "dream pop", "dark"], discovery: 86 },
  "dry cleaning": { tags: ["indie rock", "alternative", "dark", "nostalgic"], discovery: 82 },
  "pinkpantheress": { tags: ["indie pop", "experimental pop", "nostalgic", "dreamy"], discovery: 78 },
  "squid": { tags: ["indie rock", "alternative", "experimental pop", "dark"], discovery: 91 },
  "black country new road": { tags: ["indie rock", "alternative", "dramatic", "indie folk"], discovery: 77 },
  "slow pulp": { tags: ["indie rock", "dream pop", "alternative", "nostalgic"], discovery: 90 },
  "menace beach": { tags: ["dream pop", "indie rock", "shoegaze", "alternative"], discovery: 97 },
  "just mustard": { tags: ["indie rock", "alternative", "dark", "shoegaze"], discovery: 96 }
};

const fallback = ["indie", "alternative"];

export function getArtistTags(artist: string) {
  return styles[artist.trim().toLowerCase()]?.tags ?? fallback;
}

export function getTasteProfile(artists: string[]): TasteProfile {
  const counts = new Map<string, number>();
  for (const artist of artists) {
    for (const tag of getArtistTags(artist)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const tags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 4);

  const labels: Record<string, string> = {
    "bedroom pop": "bedroom-pop",
    "dream pop": "dream-pop",
    "indie pop": "indie-pop",
    "indie rock": "indie-rock",
    "indie folk": "indie-folk",
    "art pop": "art-pop",
    "experimental pop": "experimental",
    "alternative": "alternative",
    "soft vocals": "soft-vocal",
    "singer-songwriter": "singer-songwriter",
    "nostalgic": "nostalgic",
    "dark": "dark",
    "dreamy": "dreamy",
    "psychedelic pop": "psychedelic",
    "synth pop": "synth-pop",
    "gothic": "gothic",
    "dramatic": "dramatic",
    "shoegaze": "shoegaze",
    "dark americana": "dark-americana",
  };

  const human = tags.map(t => labels[t] ?? t);
  const description = human.length > 1
    ? `${human.slice(0, -1).join(", ")} + ${human.at(-1)}`
    : human[0] ?? "indie / alternative";

  return { tags, description };
}

export function recommendArtists(artists: string[], count = 5) {
  const userTags = new Set(artists.flatMap(getArtistTags));
  const selected = new Set(artists.map(a => a.toLowerCase()));

  return Object.entries(styles)
    .filter(([name, meta]) => meta.discovery && !selected.has(name))
    .map(([name, meta]) => ({
      name,
      score: meta.tags.filter(tag => userTags.has(tag)).length + (meta.discovery! / 1000),
      tags: meta.tags,
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(name)}`
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}
