export type TasteProfile = {
  tags: string[];
  description: string;
  portrait: string;
  redFlag: string;
  color: string;
  weather: string;
  place: string;
  season: string;
  feeling: string;
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
};

const fallback = ["indie", "alternative"];

export function getArtistTags(artist: string) {
  return styles[artist.trim().toLowerCase()]?.tags ?? fallback;
}

const labels: Record<string, string> = {
  "bedroom pop": "bedroom-pop", "dream pop": "dream-pop", "indie pop": "indie-pop",
  "indie rock": "indie-rock", "indie folk": "indie-folk", "art pop": "art-pop",
  "experimental pop": "experimental", "alternative": "alternative", "soft vocals": "soft-vocal",
  "singer-songwriter": "singer-songwriter", "nostalgic": "nostalgic", "dark": "dark",
  "dreamy": "dreamy", "psychedelic pop": "psychedelic", "synth pop": "synth-pop",
  "gothic": "gothic", "dramatic": "dramatic", "shoegaze": "shoegaze", "dark americana": "dark-americana",
  "alternative pop": "alternative-pop", "jazz pop": "jazz-pop"
};

const portraitBits: Record<string, string> = {
  "bedroom pop": "you probably prefer intimacy over spectacle",
  "dream pop": "you have a soft spot for things that feel slightly out of reach",
  "indie folk": "you notice tiny emotional details other people walk past",
  "singer-songwriter": "you want lyrics to feel lived-in, not manufactured",
  "alternative": "you get bored when everything is too polished",
  "art pop": "you like when something is beautiful and a little strange",
  "experimental pop": "you are unusually tolerant of songs that make everyone else say 'what is this?'",
  "soft vocals": "you seem to trust a quiet voice more than a big chorus",
  "nostalgic": "you can make a memory out of almost anything",
  "dark": "you don't mind a little emotional weather",
  "dreamy": "you like art that leaves some room for interpretation",
  "indie rock": "you want a little mess around the edges",
  "dramatic": "you believe a bridge should occasionally ruin your evening",
  "shoegaze": "you appreciate atmosphere almost as much as melody",
  "psychedelic pop": "you like familiar shapes with something slightly wrong inside them",
};

const redFlags: Record<string, string> = {
  "bedroom pop": "You hear a woman whisper over a guitar and immediately trust her with your entire evening.",
  "dream pop": "You have described at least one song as 'ethereal' and meant it sincerely.",
  "indie folk": "You could probably turn a minor inconvenience into a devastating acoustic ballad.",
  "singer-songwriter": "You care about lyrics enough to forgive almost anything else.",
  "alternative": "You think being slightly difficult to categorize is a personality trait.",
  "art pop": "You will defend the weird track everyone else skipped.",
  "experimental pop": "You say 'it's an acquired taste' like that is a recommendation.",
  "soft vocals": "You are dangerously susceptible to a quiet voice and a sad chord progression.",
  "nostalgic": "You miss eras you were not even alive for.",
  "dark": "You call emotional devastation 'the vibe.'",
  "dreamy": "You have mentally edited your life into a music video at least once.",
  "indie rock": "You think a little distortion automatically makes a song more sincere.",
  "dramatic": "You believe every inconvenience deserves a bridge.",
};

export function getTasteProfile(artists: string[]): TasteProfile {
  const counts = new Map<string, number>();
  for (const artist of artists) for (const tag of getArtistTags(artist)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag).slice(0, 4);
  const human = tags.map(t => labels[t] ?? t);
  const description = human.length > 1 ? `${human.slice(0, -1).join(", ")} + ${human.at(-1)}` : human[0] ?? "indie / alternative";
  const lead = tags[0] ?? "alternative";
  const second = tags[1] ?? "dreamy";
  const bits = tags.slice(0, 3).map(t => portraitBits[t]).filter(Boolean);
  const portrait = bits.length >= 2
    ? `${bits[0]}. ${bits[1]}. ${bits[2] ? `${bits[2]}.` : ""}`
    : "You seem drawn to music that feels personal, a little off-center, and worth sitting with.";
  const palettes: Record<string, [string,string,string,string,string]> = {
    "bedroom pop": ["washed-out yellow", "rain at 6 PM", "a bedroom with the window open", "late October", "a feeling you can't quite name"],
    "dream pop": ["foggy blue", "light rain", "a half-empty cinema", "early November", "déjà vu"],
    "indie folk": ["warm brown", "overcast afternoon", "a train window", "late autumn", "quiet longing"],
    "art pop": ["electric violet", "a storm before it breaks", "a gallery after closing", "spring at midnight", "beautiful confusion"],
    "dark": ["deep burgundy", "thunder after dark", "an empty motel", "late winter", "romantic dread"],
    "indie rock": ["faded red", "windy evening", "a basement venue", "September", "restlessness"],
    "nostalgic": ["sun-faded orange", "golden hour", "a childhood bedroom", "October", "remembering something differently"],
  };
  const p = palettes[lead] ?? ["off-white", "cloudy evening", "a tiny room with good speakers", "late autumn", "quiet anticipation"];
  return { tags, description, portrait, redFlag: redFlags[lead] ?? redFlags[second] ?? "You have a suspiciously specific emotional soundtrack.", color: p[0], weather: p[1], place: p[2], season: p[3], feeling: p[4] };
}

export type CulturalMatch = { type: "movie" | "book" | "artist" | "album"; title: string; reason: string; url?: string; meta: string };

const culturalByTag: Record<string, CulturalMatch[]> = {
  "bedroom pop": [
    { type: "movie", title: "Frances Ha", meta: "movie · 2012", reason: "small feelings, messy friendships, and a life that refuses to become a neat narrative" },
    { type: "book", title: "Normal People", meta: "book · Sally Rooney", reason: "intimacy, awkwardness, and the strange gravity between two people" },
    { type: "artist", title: "Faye Webster", meta: "artist · indie folk", reason: "deadpan tenderness with the same low-volume emotional precision", url: "https://open.spotify.com/search/Faye%20Webster" },
    { type: "album", title: "Jubilee", meta: "album · Japanese Breakfast", reason: "bright surfaces with a very human ache underneath", url: "https://open.spotify.com/search/Japanese%20Breakfast%20Jubilee" },
  ],
  "dream pop": [
    { type: "movie", title: "Lost in Translation", meta: "movie · 2003", reason: "soft-focus loneliness, atmosphere, and feelings that never fully become words" },
    { type: "book", title: "The Waves", meta: "book · Virginia Woolf", reason: "more mood than plot, with consciousness moving like music" },
    { type: "artist", title: "Men I Trust", meta: "artist · dream pop", reason: "silky textures, low-key grooves, and a little emotional distance", url: "https://open.spotify.com/search/Men%20I%20Trust" },
    { type: "album", title: "Bloom", meta: "album · Beach House", reason: "lush, floating, and quietly enormous", url: "https://open.spotify.com/search/Beach%20House%20Bloom" },
  ],
  "indie folk": [
    { type: "movie", title: "Past Lives", meta: "movie · 2023", reason: "quiet longing without forcing every feeling into a speech" },
    { type: "book", title: "The Idiot", meta: "book · Elif Batuman", reason: "observant, awkward, funny, and very interested in tiny human details" },
    { type: "artist", title: "Florist", meta: "artist · indie folk", reason: "spare, intimate songwriting that rewards paying attention", url: "https://open.spotify.com/search/Florist" },
    { type: "album", title: "Dragon New Warm Mountain I Believe in You", meta: "album · Big Thief", reason: "restless, earthy songwriting with room for weird little moments", url: "https://open.spotify.com/search/Big%20Thief%20Dragon%20New%20Warm%20Mountain" },
  ],
  "art pop": [
    { type: "movie", title: "The Lobster", meta: "movie · 2015", reason: "beautiful, strange, deadpan, and deliberately difficult to categorize" },
    { type: "book", title: "Orlando", meta: "book · Virginia Woolf", reason: "playful identity, surreal shifts, and a love of bending the rules" },
    { type: "artist", title: "Spellling", meta: "artist · art pop", reason: "world-building, theatricality, and pop instincts pushed somewhere uncanny", url: "https://open.spotify.com/search/Spellling" },
    { type: "album", title: "Desire, I Want to Turn Into You", meta: "album · Caroline Polachek", reason: "maximalist detail without losing the emotional center", url: "https://open.spotify.com/search/Caroline%20Polachek%20Desire" },
  ],
  "dark": [
    { type: "movie", title: "The Green Knight", meta: "movie · 2021", reason: "beautiful dread, myth, and a willingness to sit in the uncomfortable part" },
    { type: "book", title: "The Secret History", meta: "book · Donna Tartt", reason: "beautiful people, bad decisions, atmosphere for days" },
    { type: "artist", title: "Chelsea Wolfe", meta: "artist · dark alternative", reason: "heavy atmosphere with a surprisingly intimate core", url: "https://open.spotify.com/search/Chelsea%20Wolfe" },
    { type: "album", title: "Preacher's Daughter", meta: "album · Ethel Cain", reason: "slow-burn storytelling that treats atmosphere as part of the plot", url: "https://open.spotify.com/search/Ethel%20Cain%20Preachers%20Daughter" },
  ],
};

const oppositeByTag: Record<string, { title: string; meta: string; reason: string; url?: string }> = {
  "bedroom pop": { title: "Brat", meta: "album · Charli xcx", reason: "you like intimate and understated; this is fluorescent, blunt, maximalist pop energy", url: "https://open.spotify.com/search/Charli%20xcx%20Brat" },
  "dream pop": { title: "Spring Breakers", meta: "movie · 2012", reason: "you like hazy restraint; this is neon, abrasive, chaotic excess" },
  "indie folk": { title: "The Wolf of Wall Street", meta: "movie · 2013", reason: "you like quiet observation; this is loud, glossy, relentless spectacle" },
  "art pop": { title: "Fast & Furious 7", meta: "movie · 2015", reason: "you like strange little details; this is pure blockbuster momentum" },
  "dark": { title: "Mamma Mia!", meta: "movie · 2008", reason: "you lean toward gothic weather; this is aggressively sunny musical joy" },
  "indie rock": { title: "Future Nostalgia", meta: "album · Dua Lipa", reason: "you like rough edges; this is sleek, polished dance-pop architecture", url: "https://open.spotify.com/search/Dua%20Lipa%20Future%20Nostalgia" },
  "nostalgic": { title: "Uncut Gems", meta: "movie · 2019", reason: "you like wistful reflection; this is anxiety turned into a two-hour sprint" },
};

export function getCulturalMatches(artists: string[], count = 4) {
  const profile = getTasteProfile(artists);
  const pool = [...profile.tags.flatMap(tag => culturalByTag[tag] ?? []), ...culturalByTag["bedroom pop"]];
  const seen = new Set<string>();
  return pool.filter(item => !seen.has(`${item.type}:${item.title}`) && seen.add(`${item.type}:${item.title}`)).slice(0, count);
}

export function getMusicalOpposite(artists: string[]) {
  const profile = getTasteProfile(artists);
  return oppositeByTag[profile.tags[0]] ?? oppositeByTag["indie rock"];
}
