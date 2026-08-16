import artistCatalog from "@/data/artist-tags.json";
import culturalDatabase from "@/data/cultural_database.json";

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
type CatalogArtist = { name: string; mbid?: string; tags?: string[] };
const catalog = ((artistCatalog as any)?.artists ?? []) as CatalogArtist[];

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const catalogByName = new Map(catalog.map(a => [normalize(a.name), a]));

const knownArtistFallbacks: Record<string, string[]> = {
  "clairo": ["bedroom pop", "indie pop", "dream pop"], "phoebe bridgers": ["indie folk", "singer-songwriter", "alternative"],
  "laufey": ["jazz pop", "soft vocals", "singer-songwriter"], "the 1975": ["indie pop", "alternative", "synth pop"],
  "ethel cain": ["dark americana", "alternative", "dreamy", "gothic"], "lorde": ["alternative pop", "art pop", "synth pop"],
  "the marías": ["dream pop", "indie pop", "psychedelic pop"], "mitski": ["indie rock", "singer-songwriter", "alternative"],
  "beabadoobee": ["indie rock", "bedroom pop", "alternative"], "caroline polachek": ["art pop", "experimental pop", "alternative"],
  "weyes blood": ["art pop", "singer-songwriter", "dreamy"], "big thief": ["indie folk", "indie rock", "singer-songwriter"],
  "fka twigs": ["art pop", "experimental pop", "alternative", "dark"], "wolf alice": ["indie rock", "alternative", "dream pop"],
  "japanese breakfast": ["indie pop", "indie rock", "dream pop"], "men i trust": ["dream pop", "indie pop", "soft vocals"],
  "faye webster": ["indie folk", "singer-songwriter", "soft vocals", "dreamy"], "lana del rey": ["alternative pop", "dreamy", "dark", "nostalgic"]
};

const genreRules: Array<[RegExp, string[]]> = [
  [/experimental hip hop|experimental rap|abstract hip hop|alternative hip hop|underground rap|conscious hip hop|conscious rap/, ["hip-hop","rap","experimental rap","lyrical"]],
  [/pop rap|trap|drill|grime|gangsta rap|southern hip hop|west coast hip hop|east coast hip hop|hip hop|hip-hop|rap/, ["hip-hop","rap","rhythm-driven"]],
  [/r&b|rnb|neo soul|neo-soul|alternative r&b|contemporary r&b|soul/, ["r&b","soul","groove"]],
  [/hyperpop/, ["hyperpop","experimental pop","maximalist"]], [/art pop|art-pop/, ["art pop","experimental pop","alternative pop"]],
  [/experimental pop|avant-garde pop|experimental/, ["experimental pop","art pop","unconventional"]], [/psychedelic|neo-psychedelia|psych rock/, ["psychedelic pop","dreamy","experimental pop"]],
  [/shoegaze/, ["shoegaze","dream pop","atmospheric"]], [/dream pop|dream-pop/, ["dream pop","atmospheric","soft vocals"]],
  [/bedroom pop|bedroom|lo-fi|lofi/, ["bedroom pop","lo-fi","intimate"]], [/indie folk|folk pop|singer-songwriter|acoustic folk|folk/, ["indie folk","singer-songwriter","acoustic"]],
  [/indie rock/, ["indie rock","guitar-driven"]], [/garage rock/, ["garage rock","guitar-driven"]], [/post-punk/, ["post-punk","guitar-driven","dark"]], [/alternative rock/, ["alternative rock","guitar-driven"]], [/indie pop/, ["indie pop","melodic","alternative pop"]],
  [/indie folk/, ["indie folk","singer-songwriter","acoustic"]], [/synth pop|synthpop|electropop|electronic pop/, ["synth pop","electronic","alternative pop"]],
  [/electronic|electronica|techno|house|dance|disco/, ["electronic","dance","euphoric"]], [/jazz|nu jazz/, ["jazz pop","jazz","soft vocals"]],
  [/metal|doom|black metal|heavy metal/, ["metal","dark","heavy"]], [/punk|hardcore/, ["punk","guitar-driven","high energy"]],
  [/country|americana|alt-country/, ["americana","country","storytelling"]], [/goth|gothic|darkwave/, ["gothic","dark","atmospheric"]],
  [/classical|chamber|neoclassical/, ["classical","minimalist","orchestral"]], [/ambient|drone/, ["ambient","atmospheric","minimalist"]], [/trip hop|trip-hop/, ["trip-hop","downtempo","atmospheric"]], [/funk|funky/, ["funk","groove","rhythm-driven"]], [/afrobeats|afrobeat/, ["afrobeat","groove","rhythm-driven"]], [/reggaeton|latin trap/, ["latin","rhythm-driven","dance"]], [/emo|midwest emo/, ["emo","guitar-driven","intimate"]], [/slowcore/, ["slowcore","minimalist","atmospheric"]], [/noise rock/, ["noise rock","experimental rock","abrasive"]], [/art rock/, ["art rock","experimental rock","guitar-driven"]], [/alt-country/, ["alt-country","americana","storytelling"]], [/alternative/, ["alternative"]], [/pop/, ["pop"]]
];

export function genreTags(genres: string[]): string[] {
  const out:string[]=[];
  for(const genre of genres){
    const value=genre.toLowerCase();
    for(const [rule,tags] of genreRules) if(rule.test(value)) for(const tag of tags) if(!out.includes(tag)) out.push(tag);
  }
  return out;
}

function artistTagScores(artist:string, genres:string[]=[]):TagScore[]{
  const dbTags=catalogByName.get(normalize(artist))?.tags ?? [];
  const sourceTags=dbTags.length ? dbTags : (genres.length ? genres : (knownArtistFallbacks[normalize(artist)] ?? []));
  const tags=genreTags(sourceTags);
  if(!tags.length) return [];
  const scores=new Map<string,number>();
  tags.forEach((tag,index)=>scores.set(tag,(scores.get(tag)??0)+Math.max(1,4-index*.35)));
  return [...scores.entries()].map(([tag,score])=>({tag,score}));
}

export function getArtistTags(artist:string, genres:string[]=[]){ return artistTagScores(artist,genres).sort((a,b)=>b.score-a.score).map(x=>x.tag).slice(0,10); }

const portraitBits:Record<string,string>={
  "hip-hop":"you care about rhythm, voice, and personality arriving at the same time", "rap":"you listen for flow and phrasing as much as melody",
  "r&b":"you care about groove as much as melody", "experimental rap":"you like rap artists who treat production as part of the argument",
  "dream pop":"you have a soft spot for things that feel slightly out of reach", "indie folk":"you notice tiny emotional details other people walk past",
  "singer-songwriter":"you want lyrics to feel lived-in, not manufactured", "alternative":"you get bored when everything is too polished",
  "art pop":"you like when something is beautiful and a little strange", "experimental pop":"you are unusually tolerant of songs that make everyone else say 'what is this?'",
  "shoegaze":"you appreciate atmosphere almost as much as melody", "electronic":"you enjoy a good synthetic detail when it changes the emotional temperature",
  "hyperpop":"you have a high tolerance for beautiful excess", "dark":"you don't mind a little emotional weather", "indie rock":"you want a little mess around the edges"
};

// Multiple phrasings keep broad genres from producing the same canned report.
const portraitVariants:Record<string,string[]>={
  "alternative":[
    "you tend to trust music that leaves a little room for rough edges and ambiguity",
    "you seem happiest when a song has its own weird internal logic instead of following a clean formula",
    "you have a low tolerance for music that feels overly polished or emotionally pre-approved",
    "you gravitate toward artists who sound like they made their own little universe",
    "you like music with fingerprints on it — imperfect, specific, and slightly hard to categorize"
  ],
  "indie rock":[
    "you like guitars with personality rather than guitars that simply behave",
    "you seem drawn to bands that let the edges show",
    "you want a little friction in the music — something human pushing against the arrangement",
    "you hear charm in songs that feel assembled by people rather than optimized by committee"
  ],
  "dream pop":[
    "you like songs that feel half-remembered, as if the atmosphere arrived before the melody",
    "you are drawn to music that makes distance itself feel emotional",
    "you seem to prefer softness with something slightly uncanny underneath",
    "you like when a song blurs the line between background atmosphere and the main event"
  ],
  "art pop":[
    "you enjoy pop most when someone has clearly made a strange decision on purpose",
    "you like beauty with a slight structural malfunction",
    "you want your pop music to have at least one moment that makes you stop and go 'wait'",
    "you are attracted to artists who treat a catchy song like a place to experiment"
  ],
  "shoegaze":[
    "you don't need every instrument to introduce itself before the feeling starts",
    "you like melodies that emerge from the fog rather than sit cleanly on top of it",
    "you seem to hear texture as part of the emotion, not just decoration",
    "you enjoy music that rewards getting lost inside the mix"
  ]
};

const redFlags:Record<string,string>={
  "hip-hop":"You have absolutely judged a song by its production before admitting you liked the lyrics.", "r&b":"You will forgive an entire album for one perfect bassline.",
  "dream pop":"You have described at least one song as 'ethereal' and meant it sincerely.", "indie folk":"You could probably turn a minor inconvenience into a devastating acoustic ballad.",
  "art pop":"You will defend the weird track everyone else skipped.", "alternative":"You think being slightly difficult to categorize is a personality trait.",
  "electronic":"You will forgive a song almost anything if the synth sound is good enough.", "shoegaze":"You like music that sounds better the less clearly you can hear it.",
};

const redFlagVariants:Record<string,string[]>={
  "alternative":[
    "You have called something 'underrated' and immediately started making a 40-song playlist about it.",
    "You are suspicious of anything described as 'the next big thing' — and probably right to be.",
    "You will choose the slightly stranger version even when the obvious version is objectively easier.",
    "Your idea of a casual recommendation somehow turns into a three-hour music rabbit hole.",
    "You have definitely defended an artist with the phrase 'you just have to get into the production.'"
  ],
  "indie rock":[
    "You can hear one slightly crunchy guitar tone and suddenly the entire song has your attention.",
    "You have strong opinions about whether a band is actually indie anymore.",
    "You will forgive a questionable chorus if the bridge has enough personality.",
    "You probably know at least one band primarily because someone called them 'criminally underrated.'"
  ],
  "dream pop":[
    "You have absolutely used the word 'ethereal' in a music conversation without irony.",
    "A good reverb tail can convince you that a song is emotionally profound.",
    "You don't need to know what the lyrics mean if the atmosphere is doing enough work.",
    "You are capable of becoming attached to a song almost entirely because of its texture."
  ],
  "art pop":[
    "You will defend the strangest track on an album and call everyone else 'not ready yet.'",
    "You can mistake a bizarre production choice for a personality trait — because sometimes it is.",
    "You are more interested in an artist making an interesting mistake than a predictable hit.",
    "You have probably sent someone a song with the warning: 'okay, just trust me on this one.'"
  ],
  "shoegaze":[
    "You have spent more time describing a wall of sound than the actual song.",
    "If the vocals disappear into the mix, you may consider that a feature.",
    "You will call a song beautiful even when you can barely tell where one instrument ends.",
    "You are unusually willing to let a six-minute intro happen if the texture is right."
  ]
};

const scenery=["#d8df62","#b8b1a3","#c98f87","#a8b6b0","#d4b86a","#aaa29a"];
const weather=["overcast but electric","warm rain at midnight","a clear night with too many stars","fog lifting slowly","humid summer air","cold sunlight"];
const places=["a record store after closing","the back seat of a night bus","a tiny cinema","a crowded city street at 1 a.m.","a bedroom with the window open","a museum on a weekday"];
const seasons=["late autumn","humid summer","early spring","winter","golden October","the week between seasons"];

function buildTaste(artists:string[],tags:string[]):TasteProfile{
  const lead=tags[0]??"alternative"; const second=tags[1]??lead;
  const hash=artists.join("|").split("").reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),7);
  const variants=portraitVariants[lead] ?? portraitVariants[second];
  const portrait=variants?.[hash%variants.length] ?? portraitBits[lead] ?? `you seem drawn to ${lead} textures and strong musical personalities`;
  const flags=redFlagVariants[lead] ?? redFlagVariants[second];
  const redFlag=flags?.[(hash>>>3)%flags.length] ?? redFlags[lead] ?? redFlags[second] ?? "Your music taste is annoyingly specific in a way that probably makes playlists better.";
  const descriptionVariants=[
    `Your taste sits around ${tags.slice(0,3).join(", ")}. You seem to prefer music with a clear point of view, even when the sounds themselves are hard to pin down.`,
    `${tags.slice(0,3).join(" / ")} keeps showing up in your picks. More than a single genre, your choices suggest a preference for texture, personality, and songs that know exactly what they want to be.`,
    `There is a ${tags.slice(0,3).join(", ")} thread running through your five artists. You seem less interested in fitting a genre box than in finding music with a distinct atmosphere and identity.`,
    `Your five picks cluster around ${tags.slice(0,3).join(", ")}, but the interesting part is the combination: you seem to chase a particular feeling more than a particular genre.`
  ];
  const description=descriptionVariants[hash%descriptionVariants.length];
  return {tags,description,portrait,redFlag,color:scenery[hash%scenery.length],weather:weather[hash%weather.length],place:places[hash%places.length],season:seasons[hash%seasons.length],feeling:`${lead} with a little ${second}`};
}

export function getTasteProfile(artists:string[],genreHints:GenreHints=[]){
  const counts=new Map<string,number>();
  artists.forEach((artist,i)=>{
    const raw = catalogByName.get(normalize(artist))?.tags ?? genreHints[i] ?? [];
    const mapped = artistTagScores(artist,genreHints[i]??[]);
    // Preserve specific subgenre information instead of letting the broad "alternative" bucket dominate.
    const rawSpecific = raw.map(normalize).filter(t => t && t !== "alternative" && t !== "pop");
    rawSpecific.slice(0,8).forEach((t,j)=>counts.set(t,(counts.get(t)??0)+Math.max(.35,1-j*.08)));
    mapped.forEach(({tag,score})=>{
      const penalty = tag === "alternative" ? .18 : tag === "pop" ? .22 : tag === "alternative pop" ? .45 : 1;
      counts.set(tag,(counts.get(tag)??0)+score*penalty);
    });
  });
  const tags=[...counts.entries()]
    .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
    .map(([tag])=>tag)
    .filter((tag,i,arr)=>tag !== "alternative" || arr.length < 3)
    .slice(0,8);
  return buildTaste(artists,tags.length?tags:["alternative"]);
}
export function getTasteProfileFromTags(artists:string[],tags:string[]){return buildTaste(artists,tags.length?tags:getTasteProfile(artists).tags);}

type CulturalMatch={type:"movie"|"book"|"artist"|"album";title:string;reason:string;url?:string;meta:string};

type Candidate={title:string;tags:string[];meta:string;url:string};
const candidateArtists:Candidate[] = [
  ["Little Simz",["hip-hop","rap","lyrical","experimental rap"],"artist · alternative hip-hop"], ["Vince Staples",["hip-hop","rap","experimental rap","minimalist"],"artist · alternative rap"],
  ["Noname",["hip-hop","rap","jazz pop","lyrical"],"artist · jazz rap"], ["Smino",["hip-hop","rap","r&b","experimental rap"],"artist · melodic rap / R&B"],
  ["Tierra Whack",["hip-hop","rap","experimental rap","high energy"],"artist · experimental hip-hop"], ["MIKE",["hip-hop","rap","experimental rap","lo-fi"],"artist · underground rap"],
  ["Doechii",["hip-hop","rap","r&b","high energy"],"artist · genre-bending rap"], ["Kelela",["r&b","electronic","experimental pop","atmospheric"],"artist · alternative R&B"],
  ["Raveena",["r&b","soul","dreamy","soft vocals"],"artist · R&B / soul"], ["Sudan Archives",["r&b","experimental pop","electronic","art pop"],"artist · experimental R&B"],
  ["Yaeji",["electronic","dance","r&b","dream pop"],"artist · electronic / alt dance"], ["Magdalena Bay",["synth pop","hyperpop","art pop","electronic"],"artist · synth / art pop"],
  ["Kero Kero Bonito",["hyperpop","indie pop","electronic","experimental pop"],"artist · electronic pop"], ["Julia Holter",["art pop","ambient","experimental pop","classical"],"artist · experimental pop"],
  ["SASAMI",["alternative","indie rock","art pop","guitar-driven"],"artist · alternative"], ["Nilüfer Yanya",["indie rock","alternative","r&b","guitar-driven"],"artist · alternative"],
  ["Blonde Redhead",["dream pop","indie rock","shoegaze","experimental pop"],"artist · art rock"], ["Slowdive",["shoegaze","dream pop","atmospheric","guitar-driven"],"artist · shoegaze"],
  ["Grouper",["ambient","dream pop","minimalist","intimate"],"artist · ambient / folk"], ["Cassandra Jenkins",["indie folk","ambient","singer-songwriter","atmospheric"],"artist · indie folk"],
  ["Jessica Pratt",["indie folk","singer-songwriter","dreamy","intimate"],"artist · folk"], ["Wednesday",["indie rock","guitar-driven","americana","alternative"],"artist · alt-country / indie rock"],
  ["Porridge Radio",["indie rock","dramatic","alternative","guitar-driven"],"artist · indie rock"], ["MUNA",["indie pop","synth pop","euphoric","alternative pop"],"artist · indie pop"],
  ["Arlo Parks",["indie pop","r&b","soft vocals","singer-songwriter"],"artist · indie / R&B"], ["Kali Uchis",["r&b","dreamy","psychedelic pop","soft vocals"],"artist · alternative R&B"],
  ["Arooj Aftab",["jazz","ambient","singer-songwriter","atmospheric"],"artist · experimental jazz"], ["Ichiko Aoba",["ambient","singer-songwriter","classical","intimate"],"artist · folk / ambient"],
  ["Mk.gee",["indie rock","r&b","dream pop","experimental pop"],"artist · experimental pop / R&B"], ["Yves Tumor",["experimental pop","art rock","electronic","dark"],"artist · experimental"],
  ["Tirzah",["r&b","electronic","minimalist","experimental pop"],"artist · experimental R&B"], ["Shygirl",["hyperpop","electronic","r&b","high energy"],"artist · club / experimental pop"],
  ["Arca",["electronic","experimental pop","art pop","dark"],"artist · experimental electronic"], ["Eartheater",["experimental pop","ambient","art pop","electronic"],"artist · experimental"],
  ["SAULT",["r&b","soul","groove","hip-hop"],"artist · soul / R&B collective"], ["Kokoroko",["jazz","soul","groove","electronic"],"artist · jazz / afrobeat"],
  ["BADBADNOTGOOD",["jazz","r&b","groove","experimental"],"artist · jazz / hip-hop"], ["Nubya Garcia",["jazz","groove","soul","experimental"],"artist · contemporary jazz"],
  ["Parannoul",["shoegaze","indie rock","lo-fi","dream pop"],"artist · shoegaze / indie"], ["Mid-Air Thief",["indie folk","experimental pop","dreamy","electronic"],"artist · experimental folk"],
  ["Japanese House",["dream pop","indie pop","electronic","atmospheric"],"artist · dream pop"], ["Wednesday",["indie rock","americana","guitar-driven","alternative"],"artist · indie rock"],
].map(([title,tags,meta])=>({title:title as string,tags:tags as string[],meta:meta as string,url:`https://open.spotify.com/search/${encodeURIComponent(title as string)}`}));

const profiles = (culturalDatabase as any).profiles ?? [];
const curated = profiles.flatMap((p:any)=>[
  ...(p.movies??[]).map((title:string)=>({type:"movie",title,meta:"movie · cultural match",tags:p.tags??[],reason:p.read})),
  ...(p.books??[]).map((title:string)=>({type:"book",title,meta:"book · cultural match",tags:p.tags??[],reason:p.read})),
  ...(p.artists??[]).map((title:string)=>({type:"artist",title,meta:"artist · cultural match",tags:p.tags??[],reason:p.read,url:`https://open.spotify.com/search/${encodeURIComponent(title)}`}))
]) as Array<CulturalMatch & {tags:string[]}>;

function score(tags:string[], candidateTags:string[]){
  const weights=new Map(tags.map((t,i)=>[t,Math.max(.22,1-i*.10)]));
  const exact = candidateTags.reduce((s,t)=>s+(weights.get(t)??0),0);
  // Generic labels should never overwhelm distinctive subgenre matches.
  const generic = candidateTags.filter(t=>["alternative","pop","alternative pop"].includes(t)).length;
  const specificBonus = candidateTags.filter(t=>weights.has(t) && !["alternative","pop","alternative pop"].includes(t)).length * .12;
  return exact - generic*.35 + specificBonus;
}
function seededNumber(input:string){let h=2166136261;for(const c of input){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0)/4294967296;}

const matchReasonVariants=[
  (tags:string[])=>`this feels like a left-field cousin of your ${tags.slice(0,2).join(" / ")} taste — recognizable, but not a carbon copy`,
  (tags:string[])=>`a nearby branch of your ${tags.slice(0,2).join(" / ")} world, with enough difference to feel like an actual discovery`,
  (tags:string[])=>`it shares some DNA with your ${tags.slice(0,2).join(" / ")} picks without simply repeating what you already listen to`,
  (tags:string[])=>`the connection is more about mood and instinct than genre labels: your ${tags.slice(0,2).join(" / ")} side should have something to grab onto here`
];

export function getCulturalMatches(artists:string[],storedTags?:string[],count=4){
  const profile=storedTags?.length?getTasteProfileFromTags(artists,storedTags):getTasteProfile(artists);
  const input=new Set(artists.map(normalize));
  const all=[
    ...candidateArtists.map(c=>({type:"artist" as const,title:c.title,meta:c.meta,reason:matchReasonVariants[Math.floor(seededNumber(artists.join("|")+c.title)*matchReasonVariants.length)](profile.tags),url:c.url,tags:c.tags})),
    ...curated
  ].filter(x=>!input.has(normalize(x.title)));
  const ranked=all.map((x,i)=>({...x,score:score(profile.tags,x.tags)+(seededNumber(artists.join("|")+x.title)-.5)*1.1+i*.000001})).sort((a,b)=>b.score-a.score);
  const chosen=[]; const used=new Set<string>(); const usedFamilies=new Set<string>();
  const family=(x:any)=>x.tags.find((t:string)=>profile.tags.includes(t) && !["alternative","pop","alternative pop"].includes(t)) ?? x.tags[0] ?? "misc";
  for(const item of ranked){const key=`${item.type}:${item.title}`;if(used.has(key))continue;const fam=family(item);
    // Prefer different subgenres so five alternative listeners do not all get the same recommendation set.
    if(usedFamilies.has(fam) && chosen.length < count-1) continue;
    used.add(key); usedFamilies.add(fam); chosen.push(item); if(chosen.length>=count)break;
  }
  if(chosen.length<count){for(const item of ranked){const key=`${item.type}:${item.title}`;if(!used.has(key)){used.add(key);chosen.push(item);if(chosen.length>=count)break;}}}
  return chosen.map(({tags,score,...item})=>item) as CulturalMatch[];
}

const alternativeOppositePools=[
  {tags:["alternative","indie rock"],items:[
    {title:"Future Nostalgia",meta:"album · Dua Lipa",reason:"you like rough edges and band-room energy; this is polished, precise dance-pop built to move",url:"https://open.spotify.com/search/Dua%20Lipa%20Future%20Nostalgia"},
    {title:"Mamma Mia!",meta:"movie · 2008",reason:"you like ambiguity and restraint; this is unapologetically bright, familiar musical joy"},
    {title:"1989",meta:"album · Taylor Swift",reason:"you tend toward idiosyncratic arrangements; this is sleek, controlled pop architecture",url:"https://open.spotify.com/search/Taylor%20Swift%201989"},
    {title:"Top Gun: Maverick",meta:"movie · 2022",reason:"you like inward, slightly messy music; this is polished blockbuster momentum from start to finish"}
  ]},
  {tags:["alternative","dream pop"],items:[
    {title:"Brat",meta:"album · Charli xcx",reason:"you like haze and emotional distance; this is blunt, immediate and deliberately in-your-face",url:"https://open.spotify.com/search/Charli%20xcx%20Brat"},
    {title:"Whiplash",meta:"movie · 2014",reason:"you like drifting atmospheres; this is pressure, speed and confrontation",url:"https://open.spotify.com/search/Whiplash%202014"},
    {title:"Future Nostalgia",meta:"album · Dua Lipa",reason:"you prefer soft edges and ambiguity; this is crisp, bright and relentlessly danceable",url:"https://open.spotify.com/search/Dua%20Lipa%20Future%20Nostalgia"},
    {title:"Barbie",meta:"movie · 2023",reason:"you gravitate toward muted emotional worlds; this is maximal color, obvious hooks and pop spectacle",url:"https://open.spotify.com/search/Barbie%202023"}
  ]},
  {tags:["alternative","art pop"],items:[
    {title:"Mamma Mia!",meta:"movie · 2008",reason:"you like strange choices and ambiguity; this is proudly obvious, familiar and joyfully uncomplicated"},
    {title:"1989",meta:"album · Taylor Swift",reason:"you enjoy unconventional structures; this is precision-engineered mainstream pop",url:"https://open.spotify.com/search/Taylor%20Swift%201989"},
    {title:"The Greatest Showman",meta:"movie · 2017",reason:"you prefer eccentricity and restraint; this goes all-in on spectacle and sing-along certainty"},
    {title:"Future Nostalgia",meta:"album · Dua Lipa",reason:"you like pop with strange little detours; this keeps the architecture exceptionally clean",url:"https://open.spotify.com/search/Dua%20Lipa%20Future%20Nostalgia"}
  ]}
];

const oppositePools=[
  {tags:["hip-hop","rap","experimental rap"],items:[{title:"Kind of Blue",meta:"album · Miles Davis",reason:"you lean toward beat-first personality and forward motion; this is spacious, restrained and almost weightless",url:"https://open.spotify.com/search/Miles%20Davis%20Kind%20of%20Blue"},{title:"The Sound of Music",meta:"movie · 1965",reason:"you like restless modern production; this is deliberately traditional musical-theater comfort"}]},
  {tags:["dream pop","shoegaze","ambient"],items:[{title:"Brat",meta:"album · Charli xcx",reason:"you like hazy restraint; this is blunt, bright and aggressively immediate",url:"https://open.spotify.com/search/Charli%20xcx%20Brat"},{title:"Mad Max: Fury Road",meta:"movie · 2015",reason:"you like atmosphere and drift; this is nearly two hours of forward motion"}]},
  {tags:["indie folk","singer-songwriter"],items:[{title:"The Wolf of Wall Street",meta:"movie · 2013",reason:"you like quiet observation; this is loud, glossy, relentless spectacle"},{title:"Future Nostalgia",meta:"album · Dua Lipa",reason:"you like lived-in roughness; this is polished dance-pop architecture",url:"https://open.spotify.com/search/Dua%20Lipa%20Future%20Nostalgia"}]},
  {tags:["art pop","experimental pop"],items:[{title:"Mamma Mia!",meta:"movie · 2008",reason:"you like strange details and ambiguity; this is unapologetically familiar musical joy"},{title:"1989",meta:"album · Taylor Swift",reason:"you like unusual structures; this is precision-engineered mainstream pop",url:"https://open.spotify.com/search/Taylor%20Swift%201989"}]},
  {tags:["r&b","soul"],items:[{title:"Metal Machine Music",meta:"album · Lou Reed",reason:"you like warmth and groove; this is abrasive, abstract and intentionally hostile",url:"https://open.spotify.com/search/Lou%20Reed%20Metal%20Machine%20Music"},{title:"The Lighthouse",meta:"movie · 2019",reason:"you like emotional smoothness; this is noisy, claustrophobic and severe"}]}
];
export function getMusicalOpposite(artists:string[],storedTags?:string[]){
  const tags=storedTags?.length?storedTags:getTasteProfile(artists).tags;
  const ranked=oppositePools.map((p,i)=>({p,s:score(tags,p.tags)+(seededNumber(artists.join("|")+p.tags.join("/"))-0.5)*.9,i}))
    .sort((a,b)=>b.s-a.s);
  const top=ranked.slice(0,Math.min(3,ranked.length));
  const pick=top[Math.floor(seededNumber(artists.join("|")+"opposite-pool")*top.length)]?.p;
  const items=pick?.items??[{title:"The Sound of Music",meta:"movie · 1965",reason:"your taste is hard to pin down, so we went gloriously traditional"}];
  return items[Math.floor(seededNumber(artists.join("|")+"opposite")*items.length)];
}
