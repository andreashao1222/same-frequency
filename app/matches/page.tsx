"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, Share2, Sparkles } from "lucide-react";
import { getTasteProfile, getTasteProfileFromTags, getCulturalMatches, getMusicalOpposite } from "@/lib/taste";
import type { AIReport, CulturalMatch } from "@/lib/ai";

type Profile = {
  id: string;
  alias: string;
  artists: string[];
  music_platform: string | null;
  music_profile_url: string | null;
  spotify_url: string | null;
  taste_tags: string[];
  ai_report?: AIReport | null;
  score?: number;
  sharedArtists?: string[];
  sharedTags?: string[];
};

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function posterSvg(profile: Profile, taste: ReturnType<typeof getTasteProfile>, opposite: { title: string; meta: string; reason: string; url?: string }) {
  const artists = profile.artists.map((artist, i) => `<text x="80" y="${690 + i * 72}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700"><tspan fill="#77736c">0${i + 1}</tspan><tspan dx="24" fill="#171714">${escapeXml(artist)}</tspan></text>`).join("");
  const tags = taste.tags.map((tag, i) => `<rect x="80" y="${1080 + i * 52}" width="${Math.max(150, tag.length * 18 + 48)}" height="38" rx="19" fill="#171714"/><text x="${104}" y="${1107 + i * 52}" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#ffffff">${escapeXml(tag)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <rect width="1200" height="1500" fill="#f5f1e8"/>
    <rect x="35" y="35" width="1130" height="1430" fill="none" stroke="#171714" stroke-width="3"/>
    <text x="80" y="100" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" letter-spacing="4" fill="#171714">SAME FREQUENCY.</text>
    <text x="80" y="205" font-family="Georgia, Times New Roman, serif" font-size="92" font-weight="700" fill="#171714">my frequency.</text>
    <text x="80" y="255" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#77736c">what my music taste says about me</text>
    <rect x="80" y="315" width="1040" height="250" fill="#d9ff57" stroke="#171714" stroke-width="2"/>
    <text x="112" y="365" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" letter-spacing="3" fill="#171714">THE READ</text>
    <foreignObject x="110" y="395" width="970" height="140">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,Helvetica,sans-serif;font-size:31px;line-height:1.25;color:#171714;font-weight:700">${escapeXml(taste.portrait)}</div>
    </foreignObject>
    <line x1="80" y1="625" x2="1120" y2="625" stroke="#171714" stroke-width="2"/>
    <text x="80" y="675" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" letter-spacing="3" fill="#77736c">MY FIVE</text>
    ${artists}
    <text x="700" y="675" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" letter-spacing="3" fill="#77736c">MY SONIC WORLD</text>
    <text x="700" y="735" font-family="Georgia, Times New Roman, serif" font-size="38" font-weight="700" fill="#171714">${escapeXml(taste.color)}</text>
    <text x="700" y="800" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#171714">${escapeXml(taste.weather)}</text>
    <text x="700" y="855" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#171714">${escapeXml(taste.place)}</text>
    <text x="700" y="910" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#171714">${escapeXml(taste.season)}</text>
    <text x="700" y="965" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#171714">${escapeXml(taste.feeling)}</text>
    <line x1="80" y1="1020" x2="1120" y2="1020" stroke="#171714" stroke-width="2"/>
    <text x="80" y="1060" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" letter-spacing="3" fill="#77736c">MY TAGS</text>
    ${tags}
    <rect x="650" y="1070" width="470" height="250" fill="#ff795f" stroke="#171714" stroke-width="2"/>
    <text x="680" y="1115" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" letter-spacing="3" fill="#171714">PROBABLY NOT MY THING</text>
    <text x="680" y="1185" font-family="Georgia, Times New Roman, serif" font-size="43" font-weight="700" fill="#171714">${escapeXml(opposite.title)}</text>
    <text x="680" y="1235" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#171714">${escapeXml(opposite.meta)}</text>
    <foreignObject x="680" y="1260" width="410" height="80"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.35;color:#171714">${escapeXml(opposite.reason)}</div></foreignObject>
    <text x="80" y="1420" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#77736c">same-frequency. / a tiny cultural taste experiment</text>
  </svg>`;
}

async function posterBlob(profile: Profile, taste: ReturnType<typeof getTasteProfile>, opposite: { title: string; meta: string; reason: string; url?: string }) {
  const svg = posterSvg(profile, taste, opposite);
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("poster render failed")); });
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(image, 0, 0);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("poster export failed")), "image/png"));
}

function MatchesContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [shareLabel, setShareLabel] = useState("share my poster");
  const ownIdRef = useRef<string | null>(null);
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");

  useEffect(() => {
    const load = async () => {
      const id = requestedId || localStorage.getItem("sf_profile_id");
      const ownId = localStorage.getItem("sf_profile_id");
      ownIdRef.current = ownId;
      if (!id) { setLoading(false); return; }

      try {
        const res = await fetch(`/api/profile?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        } else if (id === ownId) {
          const artists = JSON.parse(localStorage.getItem("sf_artists") || "[]");
          if (artists.length === 5) {
            const taste = getTasteProfile(artists);
            setProfile({ id, alias: "you", artists, music_platform: localStorage.getItem("sf_music_platform"), music_profile_url: localStorage.getItem("sf_music_profile_url"), spotify_url: localStorage.getItem("sf_music_profile_url"), taste_tags: taste.tags, ai_report: null });
          }
        }
      } catch {}
      setLoading(false);

      if (id === ownId) {
        setMatchesLoading(true);
        try {
          const res = await fetch(`/api/matches?exclude=${encodeURIComponent(id)}`, { cache: "no-store" });
          const data = await res.json();
          if (res.ok) setMatches(data.matches ?? []);
        } finally {
          setMatchesLoading(false);
        }
      }
    };
    setProfile(null);
    setLoading(true);
    setMatches([]);
    load();
  }, [requestedId]);

  if (!profile && !loading) {
    return <main className="min-h-screen grid place-items-center noise p-6"><div className="text-center"><h1 className="display text-5xl">No taste profile yet.</h1><Link href="/join" className="mt-6 inline-block bg-black px-6 py-3 font-bold text-white">Make one →</Link></div></main>;
  }
  if (!profile) return <main className="min-h-screen grid place-items-center noise">Loading…</main>;

  const fallbackTaste = getTasteProfileFromTags(profile.artists, profile.taste_tags);
  const ai = profile.ai_report;
  const taste = ai ? {
    ...fallbackTaste,
    tags: ai.tags,
    description: ai.description,
    portrait: ai.portrait,
    redFlag: ai.redFlag,
    color: ai.color,
    weather: ai.weather,
    place: ai.place,
    season: ai.season,
    feeling: ai.feeling
  } : fallbackTaste;
  const cultural: CulturalMatch[] = ai?.culturalMatches?.length
    ? ai.culturalMatches
    : getCulturalMatches(profile.artists, profile.taste_tags);
  const opposite = ai?.opposite ?? getMusicalOpposite(profile.artists, profile.taste_tags);
  const isOwnReport = profile.id === ownIdRef.current;

  const share = async () => {
    try {
      setShareLabel("making poster…");
      const blob = await posterBlob(profile, taste, opposite);
      const file = new File([blob], "same-frequency-poster.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "same frequency.", text: "my frequency.", files: [file] });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "same-frequency-poster.png";
        a.click();
        URL.revokeObjectURL(a.href);
      }
      setShareLabel("poster ready ✓");
      window.setTimeout(() => setShareLabel("share my poster"), 1800);
    } catch {
      setShareLabel("share my poster");
    }
  };

  return (
    <main className="min-h-screen noise">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-black">same frequency.</Link>
        <div className="flex items-center gap-4">
          {isOwnReport && <button onClick={share} className="flex items-center gap-2 text-sm font-bold underline underline-offset-4"><Share2 size={15}/>{shareLabel}</button>}
          <Link href="/join" className="text-sm font-bold underline">{isOwnReport ? "edit my taste" : "make my own"}</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <div className="border-b-2 border-black pb-12">
          <p className="text-xs font-bold uppercase tracking-[.25em]">{isOwnReport ? "your frequency" : `${profile.alias}'s frequency`}</p>
          <h1 className="display mt-4 max-w-5xl text-6xl leading-[.88] md:text-8xl">What your music<br/><i>says about you.</i></h1>
          <p className="mt-7 max-w-2xl text-lg leading-7 text-neutral-600">A tiny cultural profile built from the five artists this listener picked. The report is an AI reading of their sonic and cultural taste — not a personality test.</p>
          <div className="mt-8 flex flex-wrap gap-2">{taste.tags.map(tag => <span key={tag} className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white">{tag}</span>)}</div>
          {profile.music_profile_url && <a href={profile.music_profile_url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold underline">open {profile.music_platform || "music"} profile <ExternalLink size={14}/></a>}
        </div>

        <section className="mt-12 grid gap-5 md:grid-cols-[1.4fr_.6fr]">
          <div className="card transition-card p-7 md:p-9"><p className="text-xs font-bold uppercase tracking-[.2em]">the read</p><h2 className="display mt-5 text-4xl md:text-5xl">Their taste gives off...</h2><p className="mt-6 max-w-2xl text-xl leading-9">{taste.portrait}</p><div className="mt-8 border-t border-black pt-6 text-sm text-neutral-600">A playful cultural read based only on the artists above.</div></div>
          <div className="bg-[#d9ff57] p-7 md:p-8"><p className="text-xs font-bold uppercase tracking-[.2em]">the five</p><ol className="mt-6 space-y-4">{profile.artists.map((artist, i) => <li key={artist} className="flex gap-4 border-b border-black/20 pb-3 text-sm font-bold"><span className="text-neutral-500">0{i + 1}</span>{artist}</li>)}</ol></div>
        </section>

        <section className="mt-14"><div className="flex items-end justify-between border-b-2 border-black pb-4"><div><p className="text-xs font-bold uppercase tracking-[.2em]">if their taste were...</p><h2 className="display mt-2 text-5xl">a little world.</h2></div><Sparkles className="hidden md:block" /></div><div className="grid gap-3 pt-5 md:grid-cols-5"><Vibe label="a color" value={taste.color}/><Vibe label="the weather" value={taste.weather}/><Vibe label="a place" value={taste.place}/><Vibe label="a season" value={taste.season}/><Vibe label="a feeling" value={taste.feeling}/></div></section>

        <section className="mt-14 border border-black bg-[#d9ff57] p-6 md:p-8"><p className="text-xs font-bold uppercase tracking-[.2em]">cultural matches</p><h2 className="display mt-3 text-5xl md:text-6xl">Their next rabbit holes.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-700">Not more music recommendations — things from the same emotional neighborhood.</p><div className="mt-7 grid gap-3 md:grid-cols-2">{cultural.map(item => <a key={`${item.type}-${item.title}`} href={item.url} target={item.url ? "_blank" : undefined} rel={item.url ? "noreferrer" : undefined} className="group border border-black bg-white/55 p-5 transition hover:-translate-y-1 hover:bg-white"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.18em]">{item.type}</span>{item.url && <ArrowUpRight size={16}/>}</div><h3 className="display mt-8 text-3xl">{item.title}</h3><p className="mt-1 text-xs font-bold text-neutral-500">{item.meta}</p><p className="mt-4 text-sm leading-6 text-neutral-700">{item.reason}</p>{item.url && <p className="mt-5 text-xs font-bold underline group-hover:no-underline">open music ↗</p>}</a>)}</div></section>

        <section className="mt-14 overflow-hidden border border-black bg-black text-white"><div className="grid gap-0 md:grid-cols-[1fr_1.2fr]"><div className="p-7 md:p-9"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#d9ff57]">your musical opposite</p><h2 className="display mt-5 text-5xl md:text-6xl">We found something they might hate.</h2><p className="mt-6 text-sm leading-6 text-neutral-300">Their taste leans one way. We deliberately went the other way.</p></div><div className="bg-[#ff795f] p-7 text-black md:p-9"><p className="text-xs font-bold uppercase tracking-[.2em]">probably not their thing</p><h3 className="display mt-5 text-5xl">{opposite.title}</h3><p className="mt-1 text-sm font-bold">{opposite.meta}</p><p className="mt-6 max-w-xl text-lg leading-7">{opposite.reason}.</p><p className="mt-8 border-t border-black/30 pt-4 text-sm font-black">Will they hate it? <span className="font-normal">Probably.</span></p>{opposite.url && <a href={opposite.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-black underline">prove us wrong <ArrowUpRight size={15}/></a>}</div></div></section>

        <section className="mt-14 border-t-2 border-black pt-8"><p className="text-xs font-bold uppercase tracking-[.2em]">one last thing</p><h2 className="display mt-4 text-5xl md:text-7xl">their music taste&apos;s<br/><i>red flag.</i></h2><p className="mt-7 max-w-3xl text-2xl leading-9">{taste.redFlag}</p></section>

        {isOwnReport && <section className="mt-16 border-t-2 border-black pt-10"><p className="text-xs font-bold uppercase tracking-[.2em]">the people in the pool</p><h2 className="display mt-3 text-5xl md:text-6xl">Find your frequency.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">Everyone who has joined appears here. Open someone&apos;s card to read their full report.</p>{matchesLoading ? <p className="mt-8 text-sm text-neutral-500">finding your people…</p> : matches.length === 0 ? <div className="mt-8 border border-black p-6 text-sm">You&apos;re early. Share the site with a few music-obsessed friends and come back when the pool grows.</div> : <div className="mt-7 grid gap-3 md:grid-cols-2">{matches.map(match => <Link key={match.id} href={`/matches?id=${match.id}`} className="group border border-black bg-white/45 p-5 transition hover:-translate-y-1 hover:bg-[#d9ff57]"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-[.18em]">{match.alias}</span><span className="text-2xl font-black">{match.score}%</span></div><p className="mt-4 text-sm text-neutral-600">{match.sharedArtists?.length ? `${match.sharedArtists.length} shared artist${match.sharedArtists.length === 1 ? "" : "s"}` : "no shared artists"} · {match.sharedTags?.slice(0, 2).join(" · ") || "different sonic worlds"}</p><p className="mt-5 text-xs font-bold underline">open report ↗</p></Link>)}</div>}</section>}

        {isOwnReport && <section className="mt-16 grid-bg border border-black p-7 text-center md:p-12"><p className="text-xs font-bold uppercase tracking-[.2em]">same frequency.</p><h2 className="display mt-5 text-5xl md:text-7xl">Turn your taste<br/><i>into a poster.</i></h2><button onClick={share} className="mt-8 inline-flex items-center gap-3 bg-black px-7 py-4 text-lg font-bold text-white hover:translate-x-1">{shareLabel} <Share2 size={18}/></button></section>}

        <div className="mt-14 border-t border-black pt-6 text-xs leading-5 text-neutral-500">same frequency. is a playful cultural taste experiment. The profile above is generated from the artists selected; it is not a psychological assessment.</div>
      </section>
    </main>
  );
}

export default function MatchesPage() { return <Suspense fallback={<main className="min-h-screen grid place-items-center noise">Loading…</main>}><MatchesContent /></Suspense>; }

function Vibe({ label, value }: { label: string; value: string }) { return <div className="border border-black bg-white/35 p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-neutral-500">{label}</p><p className="mt-8 font-black leading-6">{value}</p></div>; }
