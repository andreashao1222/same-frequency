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

type GenreHints = string[][];

type TagScore = { tag: string; score: number };

/*
 * Local taste engine.
 *
 * The important bit: artists do NOT need to be listed here one by one.
 * When Spotify/Deezer returns genre metadata, the generic genre rules below
 * turn that metadata into taste dimensions. The small known-artist map is only
 * a fallback for a handful of artists whose public genre metadata is missing.
 */
const knownArtistFallbacks: Record<string, string[]> = {
  "clairo": ["bedroom pop", "indie pop", "dream pop", "soft vocals"],
  "phoebe bridgers": ["indie folk", "singer-songwriter", "alternative", "soft vocals"],
  "laufey": ["jazz pop", "soft vocals", "singer-songwriter", "dreamy"],
  "the 1975": ["indie pop", "alternative", "synth pop", "nostalgic"],
  "ethel cain": ["dark americana", "alternative", "dreamy", "gothic"],
  "lorde": ["alternative pop", "art pop", "synth pop", "nostalgic"],
  "the marías": ["dream pop", "indie pop", "psychedelic pop", "soft vocals"],
  "mitski": ["indie rock", "singer-songwriter", "alternative", "dramatic"],
  "beabadoobee": ["indie rock", "bedroom pop", "alternative", "nostalgic"],
  "caroline polachek": ["art pop", "experimental pop", "alternative", "dreamy"],
  "weyes blood": ["art pop", "singer-songwriter", "dreamy", "psychedelic pop"],
  "big thief": ["indie folk", "indie rock", "singer-songwriter", "alternative"],
  "fka twigs": ["art pop", "experimental pop", "alternative", "dark"],
  "wolf alice": ["indie rock", "alternative", "dream pop", "shoegaze"],
  "japanese breakfast": ["indie pop", "indie rock", "dream pop", "nostalgic"],
  "men i trust": ["dream pop", "indie pop", "soft vocals", "psychedelic pop"],
  "faye webster": ["indie folk", "singer-songwriter", "soft vocals", "dreamy"],
  "lana del rey": ["alternative pop", "dreamy", "dark", "nostalgic"],
};

// Broad public genre strings → stable local taste dimensions.
// Order matters: specific genres are checked before broad ones.
const genreRules: Array<[RegExp, string[]]> = [
  [/experimental hip hop|experimental rap|abstract hip hop|alternative hip hop|underground rap|conscious hip hop|conscious rap/, ["hip-hop", "rap", "experimental rap", "lyrical"]],
  [/pop rap|trap|drill|grime|gangsta rap|southern hip hop|west coast hip hop|east coast hip hop|hip hop|hip-hop|rap/, ["hip-hop", "rap", "rhythm-driven"]],
  [/r&b|rnb|neo soul|neo-soul|alternative r&b|contemporary r&b|soul/, ["r&b", "soul", "groove"]],
  [/hyperpop/, ["hyperpop", "experimental pop", "maximalist"]],
  [/art pop|art-pop/, ["art pop", "experimental pop", "alternative pop"]],
  [/experimental pop|avant-garde pop|experimental/, ["experimental pop", "art pop", "unconventional"]],
  [/psychedelic|neo-psychedelia|psych rock/, ["psychedelic pop", "dreamy", "experimental pop"]],
  [/shoegaze/, ["shoegaze", "dream pop", "atmospheric"]],
  [/dream pop|dream-pop/, ["dream pop", "atmospheric", "soft vocals"]],
  [/bedroom pop|bedroom|lo-fi|lofi/, ["bedroom pop", "lo-fi", "intimate"]],
  [/indie folk|folk pop|singer-songwriter|acoustic folk|folk/, ["indie folk", "singer-songwriter", "acoustic"]],
  [/indie rock|garage rock|post-punk|alternative rock/, ["indie rock", "alternative", "guitar-driven"]],
  [/indie pop/, ["indie pop", "alternative pop"]],
  [/indie/, ["indie pop", "alternative"]],
  [/synth pop|synthpop|electropop|electronic pop/, ["synth pop", "electronic", "alternative pop"]],
  [/electronic|electronica|techno|house|dance|disco/, ["electronic", "dance", "euphoric"]],
  [/jazz|nu jazz/, ["jazz pop", "jazz", "soft vocals"]],
  [/metal|doom|black metal|heavy metal/, ["metal", "dark", "heavy"]],
  [/punk|hardcore/, ["punk", "guitar-driven", "high energy"]],
  [/country|americana|alt-country/, ["americana", "country", "storytelling"]],
  [/goth|gothic|darkwave/, ["gothic", "dark", "atmospheric"]],
  [/classical|chamber|neoclassical/, ["classical", "minimalist", "orchestral"]],
  [/ambient|drone/, ["ambient", "atmospheric", "minimalist"]],
  [/pop/, ["pop", "alternative pop"]],
];

export function genreTags(genres: string[]): string[] {
  const out: string[] = [];
  for (const genre of genres) {
    const value = genre.toLowerCase();
    for (const [rule, tags] of genreRules) {
      if (rule.test(value)) {
        for (const tag of tags) if (!out.includes(tag)) out.push(tag);
      }
    }
  }
  return out;
}

function artistTagScores(artist: string, genres: string[] = []): TagScore[] {
  const metadataTags = genreTags(genres);
  const fallbackTags = knownArtistFallbacks[artist.trim().toLowerCase()] ?? [];
  const tags = metadataTags.length ? metadataTags : fallbackTags;

  if (!tags.length) return [];

  const scores = new Map<string, number>();
  // Earlier tags in each artist's metadata are treated as slightly more useful.
  tags.forEach((tag, index) => scores.set(tag, (scores.get(tag) ?? 0) + Math.max(1, 4 - index * 0.45)));
  return [...scores.entries()].map(([tag, score]) => ({ tag, score }));
}

export function getArtistTags(artist: string, genres: string[] = []) {
  return artistTagScores(artist, genres).sort((a, b) => b.score - a.score).map(x => x.tag).slice(0, 8);
}

const labels: Record<string, string> = {
  "bedroom pop": "bedroom-pop", "dream pop": "dream-pop", "indie pop": "indie-pop",
  "indie rock": "indie-rock", "indie folk": "indie-folk", "art pop": "art-pop",
  "experimental pop": "experimental", "alternative": "alternative", "soft vocals": "soft-vocal",
  "singer-songwriter": "singer-songwriter", "nostalgic": "nostalgic", "dark": "dark",
  "dreamy": "dreamy", "psychedelic pop": "psychedelic", "synth pop": "synth-pop",
  "gothic": "gothic", "dramatic": "dramatic", "shoegaze": "shoegaze", "dark americana": "dark-americana",
  "alternative pop": "alternative-pop", "jazz pop": "jazz-pop", "atmospheric": "atmospheric",
  "lo-fi": "lo-fi", "intimate": "intimate", "guitar-driven": "guitar-driven",
  "electronic": "electronic", "r&b": "r&b", "soul": "soul", "groove": "groove",
  "hip-hop": "hip-hop", "rap": "rap", "rhythm-driven": "rhythm-driven", "experimental rap": "experimental-rap",
  "lyrical": "lyrical", "pop rap": "pop-rap", "high energy": "high-energy",
  "hyperpop": "hyperpop", "maximalist": "maximalist", "dance": "dance", "euphoric": "euphoric",
  "americana": "americana", "country": "country", "storytelling": "storytelling",
  "ambient": "ambient", "minimalist": "minimalist", "classical": "classical",
  "metal": "metal", "heavy": "heavy", "punk": "punk", "acoustic": "acoustic",
  "unconventional": "unconventional", "pop": "pop", "orchestral": "orchestral"
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
  "shoegaze": "you appreciate atmosphere almost as much as melody",
  "guitar-driven": "you like songs that still feel touched by human hands",
  "electronic": "you enjoy a good synthetic detail when it changes the emotional temperature",
  "r&b": "you care about groove as much as melody",
  "jazz pop": "you notice phrasing and texture more than most people do",
  "ambient": "you don't need a song to hurry to the point",
  "hyperpop": "you have a high tolerance for beautiful excess",
  "americana": "you like stories that sound lived-in",
  "hip-hop": "you care about rhythm, voice, and personality arriving at the same time",
  "rap": "you listen for flow and phrasing as much as melody",
  "rhythm-driven": "you need the beat to have an actual point of view",
  "experimental rap": "you like rap artists who treat production as part of the argument",
  "lyrical": "you notice lines that have enough personality to survive outside the song",
  "high energy": "you are not particularly interested in music sitting quietly in the corner",
  "groove": "you want the rhythm to feel physical, not decorative",
  "metal": "you have a high tolerance for intensity and texture",
  "punk": "you like music that sounds like it might break something",
  "classical": "you notice arrangement and movement even when there are no lyrics",
};

const redFlags: Record<string, string> = {
  "bedroom pop": "You hear a quiet voice over a guitar and immediately trust it with your entire evening.",
  "dream pop": "You have described at least one song as 'ethereal' and meant it sincerely.",
  "indie folk": "You could probably turn a minor inconvenience into a devastating acoustic ballad.",
  "alternative": "You think being slightly difficult to categorize is a personality trait.",
  "art pop": "You will defend the weird track everyone else skipped.",
  "experimental pop": "You say 'it's an acquired taste' like that is a recommendation.",
  "nostalgic": "You miss eras you were not even alive for.",
  "dark": "You call emotional devastation 'the vibe.'",
  "indie rock": "You think a little distortion automatically makes a song more sincere.",
  "electronic": "You will forgive a song almost anything if the synth sound is good enough.",
  "hip-hop": "You have absolutely judged a song by the first ten seconds of its beat.",
  "rap": "You will replay one bar because the delivery was simply too good.",
  "experimental rap": "You call a beat switch a personality trait.",
  "lyrical": "You have definitely paused a song just to appreciate one line.",
  "high energy": "You need the chorus to arrive like it has somewhere to be.",
  "groove": "You are suspicious of any song that cannot make a room move.",
  "metal": "You consider 'too much' a promising starting point.",
  "punk": "You trust a little chaos more than a polished press release.",
};

const palettes: Record<string, [string, string, string, string, string]> = {
  "bedroom pop": ["washed-out yellow", "rain at 6 PM", "a bedroom with the window open", "late October", "a feeling you can't quite name"],
  "dream pop": ["foggy blue", "light rain", "a half-empty cinema", "early November", "déjà vu"],
  "indie folk": ["warm brown", "overcast afternoon", "a train window", "late autumn", "quiet longing"],
  "art pop": ["electric violet", "a storm before it breaks", "a gallery after closing", "spring at midnight", "beautiful confusion"],
  "dark": ["deep burgundy", "thunder after dark", "an empty motel", "late winter", "romantic dread"],
  "indie rock": ["faded red", "windy evening", "a basement venue", "September", "restlessness"],
  "nostalgic": ["sun-faded orange", "golden hour", "a childhood bedroom", "October", "remembering something differently"],
  "hip-hop": ["acid green", "humid city night", "the back seat of a car with the bass up", "August", "swagger"],
  "rap": ["silver chrome", "3 AM city lights", "a studio at midnight", "summer", "momentum"],
  "experimental rap": ["electric blue", "a thunderstorm over downtown", "a tiny club with enormous speakers", "late summer", "controlled chaos"],
  "r&b": ["deep plum", "warm night air", "a dimly lit room", "August", "slow confidence"],
  "electronic": ["chrome silver", "city lights after rain", "an empty train platform", "February", "electric anticipation"],
  "ambient": ["pale blue", "fog before sunrise", "a quiet museum", "January", "weightlessness"],
  "americana": ["dusty gold", "late afternoon", "an old roadside diner", "October", "homesickness"],
  "shoegaze": ["washed lavender", "heavy clouds", "a rehearsal room", "November", "beautiful noise"],
  "metal": ["black steel", "a storm at midnight", "an underground venue", "January", "adrenaline"],
  "punk": ["signal red", "hot summer pavement", "a tiny basement venue", "July", "defiance"],
  "classical": ["ivory", "fog before sunrise", "an old concert hall", "early spring", "stillness"],
};

function buildTaste(artists: string[], tags: string[]): TasteProfile {
  const cleanTags = [...new Set(tags)].slice(0, 6);
  const human = cleanTags.map(t => labels[t] ?? t);
  const description = human.length > 1 ? `${human.slice(0, -1).join(", ")} + ${human.at(-1)}` : human[0] ?? "hard to categorize";
  const lead = cleanTags[0] ?? "alternative";
  const second = cleanTags[1] ?? "dreamy";
  const bits = cleanTags.slice(0, 3).map(t => portraitBits[t]).filter(Boolean);
  const portrait = bits.length >= 2
    ? `${bits[0]}. ${bits[1]}${bits[2] ? `. ${bits[2]}` : ""}.`
    : "Your five artists don't fit neatly into one box — which is probably more interesting than a genre label anyway.";
  const p = palettes[lead] ?? palettes[second] ?? ["off-white", "cloudy evening", "a tiny room with good speakers", "late autumn", "quiet anticipation"];
  return {
    tags: cleanTags.length ? cleanTags : ["mixed taste"],
    description,
    portrait,
    redFlag: redFlags[lead] ?? redFlags[second] ?? "Your music taste is annoyingly specific in a way that probably makes playlists better.",
    color: p[0], weather: p[1], place: p[2], season: p[3], feeling: p[4]
  };
}

export function getTasteProfile(artists: string[], genreHints: GenreHints = []) {
  const counts = new Map<string, number>();
  artists.forEach((artist, i) => {
    const scores = artistTagScores(artist, genreHints[i] ?? []);
    for (const { tag, score } of scores) counts.set(tag, (counts.get(tag) ?? 0) + score);
  });

  // Do not let broad words such as "alternative" or "pop" dominate a profile.
  const broadPenalty: Record<string, number> = {
    "alternative": 0.45,
    "pop": 0.35,
    "alternative pop": 0.65,
  };

  const tags = [...counts.entries()]
    .map(([tag, score]) => [tag, score * (broadPenalty[tag] ?? 1)] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)
    .slice(0, 6);

  return buildTaste(artists, tags);
}

export function getTasteProfileFromTags(artists: string[], tags: string[]) {
  return buildTaste(artists, tags.length ? tags : getTasteProfile(artists).tags);
}

type CulturalMatch = { type: "movie" | "book" | "artist" | "album"; title: string; reason: string; url?: string; meta: string };

type CandidateArtist = { title: string; tags: string[]; meta: string; url: string };

const candidateArtists: CandidateArtist[] = [
  ["Little Simz", ["hip-hop", "rap", "lyrical", "experimental rap"], "artist · alternative hip-hop"],
  ["Vince Staples", ["hip-hop", "rap", "experimental rap", "minimalist"], "artist · alternative rap"],
  ["Noname", ["hip-hop", "rap", "jazz pop", "lyrical"], "artist · jazz rap"],
  ["Smino", ["hip-hop", "rap", "r&b", "experimental rap"], "artist · melodic rap / R&B"],
  ["Tierra Whack", ["hip-hop", "rap", "experimental rap", "high energy"], "artist · experimental hip-hop"],
  ["MIKE", ["hip-hop", "rap", "experimental rap", "lo-fi"], "artist · underground rap"],
  ["Doechii", ["hip-hop", "rap", "r&b", "high energy"], "artist · genre-bending rap"],
  ["Kelela", ["r&b", "electronic", "experimental pop", "atmospheric"], "artist · alternative R&B"],
  ["Raveena", ["r&b", "soul", "dreamy", "soft vocals"], "artist · R&B / soul"],
  ["Sudan Archives", ["r&b", "experimental pop", "electronic", "art pop"], "artist · experimental R&B"],
  ["Yaeji", ["electronic", "dance", "r&b", "dream pop"], "artist · electronic / alt dance"],
  ["Magdalena Bay", ["synth pop", "hyperpop", "art pop", "electronic"], "artist · synth / art pop"],
  ["Kero Kero Bonito", ["hyperpop", "indie pop", "electronic", "experimental pop"], "artist · electronic pop"],
  ["Spellling", ["art pop", "experimental pop", "dark", "atmospheric"], "artist · art pop"],
  ["Julia Holter", ["art pop", "ambient", "experimental pop", "classical"], "artist · experimental pop"],
  ["SASAMI", ["alternative", "indie rock", "art pop", "guitar-driven"], "artist · alternative"],
  ["Nilüfer Yanya", ["indie rock", "alternative", "r&b", "guitar-driven"], "artist · alternative"],
  ["Blonde Redhead", ["dream pop", "indie rock", "shoegaze", "experimental pop"], "artist · art rock"],
  ["Slowdive", ["shoegaze", "dream pop", "atmospheric", "guitar-driven"], "artist · shoegaze"],
  ["Grouper", ["ambient", "dream pop", "minimalist", "intimate"], "artist · ambient / folk"],
  ["Cassandra Jenkins", ["indie folk", "ambient", "singer-songwriter", "atmospheric"], "artist · indie folk"],
  ["Jessica Pratt", ["indie folk", "singer-songwriter", "dreamy", "intimate"], "artist · folk"],
  ["Helena Deland", ["indie folk", "dream pop", "intimate", "alternative"], "artist · indie / art pop"],
  ["Wednesday", ["indie rock", "guitar-driven", "americana", "alternative"], "artist · alt-country / indie rock"],
  ["Porridge Radio", ["indie rock", "dramatic", "alternative", "guitar-driven"], "artist · indie rock"],
  ["MUNA", ["indie pop", "synth pop", "euphoric", "alternative pop"], "artist · indie pop"],
  ["Arlo Parks", ["indie pop", "r&b", "soft vocals", "singer-songwriter"], "artist · indie / R&B"],
  ["Kali Uchis", ["r&b", "dreamy", "psychedelic pop", "soft vocals"], "artist · alternative R&B"],
  ["Arooj Aftab", ["jazz", "ambient", "singer-songwriter", "atmospheric"], "artist · experimental jazz"],
  ["Ichiko Aoba", ["ambient", "singer-songwriter", "classical", "intimate"], "artist · folk / ambient"],
].map(([title, tags, meta]) => ({
  title: title as string,
  tags: tags as string[],
  meta: meta as string,
  url: `https://open.spotify.com/search/${encodeURIComponent(title as string)}`
}));

const culturalByTag: Record<string, CulturalMatch[]> = {
  "bedroom pop": [
    { type: "movie", title: "Frances Ha", meta: "movie · 2012", reason: "small feelings, messy friendships, and a life that refuses to become a neat narrative" },
    { type: "book", title: "Normal People", meta: "book · Sally Rooney", reason: "intimacy, awkwardness, and the strange gravity between two people" },
    { type: "album", title: "Jubilee", meta: "album · Japanese Breakfast", reason: "bright surfaces with a very human ache underneath", url: "https://open.spotify.com/search/Japanese%20Breakfast%20Jubilee" },
  ],
  "dream pop": [
    { type: "movie", title: "Lost in Translation", meta: "movie · 2003", reason: "soft-focus loneliness, atmosphere, and feelings that never fully become words" },
    { type: "book", title: "The Virgin Suicides", meta: "book · Jeffrey Eugenides", reason: "dreamy distance and an almost photographic sense of atmosphere" },
    { type: "album", title: "Titanic Rising", meta: "album · Weyes Blood", reason: "lush songwriting that balances intimacy with scale", url: "https://open.spotify.com/search/Weyes%20Blood%20Titanic%20Rising" },
  ],
  "indie folk": [
    { type: "movie", title: "Paterson", meta: "movie · 2016", reason: "quiet observation and the beauty of ordinary routines" },
    { type: "book", title: "The Idiot", meta: "book · Elif Batuman", reason: "observant, awkward, funny, and very interested in tiny human details" },
    { type: "album", title: "Dragon New Warm Mountain I Believe in You", meta: "album · Big Thief", reason: "restless, earthy songwriting with room for weird little moments", url: "https://open.spotify.com/search/Big%20Thief%20Dragon%20New%20Mountain" },
  ],
  "art pop": [
    { type: "movie", title: "The Lobster", meta: "movie · 2015", reason: "beautiful, strange, deadpan, and deliberately difficult to categorize" },
    { type: "book", title: "Orlando", meta: "book · Virginia Woolf", reason: "playful identity, surreal shifts, and a love of bending the rules" },
    { type: "album", title: "Desire, I Want to Turn Into You", meta: "album · Caroline Polachek", reason: "maximalist detail without losing the emotional center", url: "https://open.spotify.com/search/Caroline%20Polachek%20Desire" },
  ],
  "dark": [
    { type: "movie", title: "The Green Knight", meta: "movie · 2021", reason: "beautiful dread, myth, and a willingness to sit in the uncomfortable part" },
    { type: "book", title: "The Secret History", meta: "book · Donna Tartt", reason: "beautiful people, bad decisions, atmosphere for days" },
    { type: "album", title: "Preacher's Daughter", meta: "album · Ethel Cain", reason: "slow-burn storytelling that treats atmosphere as part of the plot", url: "https://open.spotify.com/search/Ethel%20Cain%20Preachers%20Daughter" },
  ],
  "r&b": [
    { type: "movie", title: "Moonlight", meta: "movie · 2016", reason: "quiet intimacy, identity, and emotion carried as much by atmosphere as dialogue" },
    { type: "book", title: "Giovanni's Room", meta: "book · James Baldwin", reason: "interior emotion and beautifully controlled prose" },
    { type: "album", title: "Ctrl", meta: "album · SZA", reason: "messy honesty and sharp emotional self-awareness", url: "https://open.spotify.com/search/SZA%20Ctrl" },
  ],
  "hip-hop": [
    { type: "movie", title: "Do the Right Thing", meta: "movie · 1989", reason: "rhythm, personality, color, and a whole world built around music and voice" },
    { type: "book", title: "The Sellout", meta: "book · Paul Beatty", reason: "sharp cultural satire with the same restless intelligence and swagger" },
    { type: "album", title: "Sometimes I Might Be Introvert", meta: "album · Little Simz", reason: "cinematic rap with huge emotional and orchestral scale", url: "https://open.spotify.com/search/Little%20Simz%20Sometimes%20I%20Might%20Be%20Introvert" },
  ],
  "rap": [
    { type: "movie", title: "Uncut Gems", meta: "movie · 2019", reason: "restless momentum, sensory overload, and zero interest in sitting still" },
    { type: "book", title: "The Brief Wondrous Life of Oscar Wao", meta: "book · Junot Díaz", reason: "voice-forward storytelling with humor, rhythm, and cultural texture" },
    { type: "album", title: "Big Fish Theory", meta: "album · Vince Staples", reason: "rap pushed through electronic production until the edges blur", url: "https://open.spotify.com/search/Vince%20Staples%20Big%20Fish%20Theory" },
  ],
  "electronic": [
    { type: "movie", title: "After Yang", meta: "movie · 2021", reason: "soft futurism, memory, and tiny emotional details" },
    { type: "book", title: "Klara and the Sun", meta: "book · Kazuo Ishiguro", reason: "quiet speculative fiction with an uncanny emotional center" },
    { type: "album", title: "Oil of Every Pearl's Un-Insides", meta: "album · SOPHIE", reason: "synthetic textures pushed into something emotionally physical", url: "https://open.spotify.com/search/SOPHIE%20Oil%20of%20Every%20Pearl%27s%20Un-Insides" },
  ],
  "shoegaze": [
    { type: "movie", title: "In the Mood for Love", meta: "movie · 2000", reason: "texture, repetition, longing, and emotion kept just below the surface" },
    { type: "book", title: "The Waves", meta: "book · Virginia Woolf", reason: "impressionistic interiority that feels closer to atmosphere than plot" },
    { type: "album", title: "Heaven or Las Vegas", meta: "album · Cocteau Twins", reason: "dreamy density where voice becomes part of the texture", url: "https://open.spotify.com/search/Cocteau%20Twins%20Heaven%20or%20Las%20Vegas" },
  ],
};

const oppositeByTag: Record<string, { title: string; meta: string; reason: string; url?: string }> = {
  "bedroom pop": { title: "Brat", meta: "album · Charli xcx", reason: "you like intimate and understated; this is fluorescent, blunt, maximalist pop energy", url: "https://open.spotify.com/search/Charli%20xcx%20Brat" },
  "dream pop": { title: "Spring Breakers", meta: "movie · 2012", reason: "you like hazy restraint; this is neon, abrasive, chaotic excess" },
  "indie folk": { title: "The Wolf of Wall Street", meta: "movie · 2013", reason: "you like quiet observation; this is loud, glossy, relentless spectacle" },
  "art pop": { title: "Fast & Furious 7", meta: "movie · 2015", reason: "you like strange little details; this is pure blockbuster momentum" },
  "dark": { title: "Mamma Mia!", meta: "movie · 2008", reason: "you lean toward gothic weather; this is aggressively sunny musical joy" },
  "r&b": { title: "Metal Machine Music", meta: "album · Lou Reed", reason: "you like groove and warmth; this is abrasive, abstract, and intentionally hostile", url: "https://open.spotify.com/search/Lou%20Reed%20Metal%20Machine%20Music" },
  "hip-hop": { title: "Kind of Blue", meta: "album · Miles Davis", reason: "you like beat-first personality and forward momentum; this is cool, spacious, and almost allergic to excess", url: "https://open.spotify.com/search/Miles%20Davis%20Kind%20of%20Blue" },
  "rap": { title: "Kind of Blue", meta: "album · Miles Davis", reason: "you like flow and rhythmic attack; this is restrained, spacious, and almost weightless", url: "https://open.spotify.com/search/Miles%20Davis%20Kind%20of%20Blue" },
  "experimental rap": { title: "The Sound of Music", meta: "movie · 1965", reason: "you like fractured production and unpredictable bars; this is polished, traditional musical-theater comfort" },
  "electronic": { title: "The Sound of Music", meta: "movie · 1965", reason: "you like synthetic edges; this is maximal old-school musical warmth" },
  "indie rock": { title: "Future Nostalgia", meta: "album · Dua Lipa", reason: "you like rough edges; this is sleek, polished dance-pop architecture", url: "https://open.spotify.com/search/Dua%20Lipa%20Future%20Nostalgia" },
  "shoegaze": { title: "Future Nostalgia", meta: "album · Dua Lipa", reason: "you like washed-out density; this is bright, precise, polished dance-pop", url: "https://open.spotify.com/search/Dua%20Lipa%20Future%20Nostalgia" },
};

function overlapScore(a: string[], b: string[]) {
  const A = new Set(a);
  const B = new Set(b);
  return [...A].filter(x => B.has(x)).length;
}

function chooseArtistMatch(tags: string[], inputArtists: string[]) {
  const excluded = new Set(inputArtists.map(x => x.toLowerCase()));
  const scored = candidateArtists
    .filter(c => !excluded.has(c.title.toLowerCase()))
    .map(c => {
      const shared = overlapScore(tags, c.tags);
      const exactCore = c.tags.filter(t => tags.slice(0, 3).includes(t)).length;
      const novelty = c.tags.filter(t => !tags.includes(t)).length * 0.08;
      return { ...c, score: shared * 2 + exactCore + novelty };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return scored[0];
}

export function getCulturalMatches(artists: string[], storedTags?: string[], count = 4) {
  const profile = storedTags?.length ? getTasteProfileFromTags(artists, storedTags) : getTasteProfile(artists);
  const artist = chooseArtistMatch(profile.tags, artists);
  const pool: CulturalMatch[] = [];
  if (artist && artist.score > 0) {
    pool.push({ type: "artist", title: artist.title, meta: artist.meta, reason: `a left-field connection to your ${profile.tags.slice(0, 3).join(" / ")} taste — close enough to make sense, different enough to be a discovery`, url: artist.url });
  }

  const seen = new Set(pool.map(x => `${x.type}:${x.title}`));
  for (const tag of profile.tags) {
    for (const item of culturalByTag[tag] ?? []) {
      const key = `${item.type}:${item.title}`;
      if (!seen.has(key)) { pool.push(item); seen.add(key); }
      if (pool.length >= count) return pool.slice(0, count);
    }
  }

  const defaults: CulturalMatch[] = [
    { type: "movie", title: "Perfect Days", meta: "movie · 2023", reason: "quiet observation, ritual, and finding beauty in ordinary details" },
    { type: "book", title: "The Anthropocene Reviewed", meta: "book · John Green", reason: "small cultural observations turned into unexpectedly intimate essays" },
    { type: "album", title: "Titanic Rising", meta: "album · Weyes Blood", reason: "lush songwriting that balances intimacy with scale", url: "https://open.spotify.com/search/Weyes%20Blood%20Titanic%20Rising" },
  ];
  for (const item of defaults) {
    const key = `${item.type}:${item.title}`;
    if (!seen.has(key)) { pool.push(item); seen.add(key); }
    if (pool.length >= count) break;
  }
  return pool.slice(0, count);
}

export function getMusicalOpposite(artists: string[], storedTags?: string[]) {
  const profile = storedTags?.length ? getTasteProfileFromTags(artists, storedTags) : getTasteProfile(artists);
  return oppositeByTag[profile.tags[0]] ?? {
    title: "The Sound of Music",
    meta: "movie · 1965",
    reason: "your taste is hard to pin down, so we went for something gloriously traditional instead",
  };
}
