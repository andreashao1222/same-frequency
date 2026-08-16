"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, Share2, Sparkles } from "lucide-react";
import { getTasteProfile } from "@/lib/taste";
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
  const W = 900;
  const ink = "#171714";
  const paper = "#f3eee2";
  const red = "#a94f42";
  const muted = "#6f6a62";
  const mono = `Courier New, Courier, monospace`;
  const serif = `Georgia, Times New Roman, serif`;

  const text = (value: string) => escapeXml(String(value || ""));
  const wrap = (value: string, maxChars: number) => {
    const words = String(value || "").split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };
  const multiline = (value: string, x: number, y: number, maxChars: number, lineHeight: number, attrs: string) =>
    wrap(value, maxChars).map((line, i) => `<text x="${x}" y="${y + i * lineHeight}" ${attrs}>${text(line)}</text>`).join("");

  const portraitLines = wrap(taste.portrait, 58);
  const readStart = 350;
  const readEnd = readStart + portraitLines.length * 34 + 36;
  const sectionTop = Math.max(500, readEnd + 22);

  // Left column: artist names get their own vertical space, so long names never collide.
  let artistY = sectionTop + 92;
  const artistMarkup: string[] = [];
  for (let i = 0; i < 5; i++) {
    const artist = profile.artists[i] || "";
    const lines = wrap(artist, 25);
    const nameStart = artistY;
    artistMarkup.push(`<text x="76" y="${nameStart}" font-family="${mono}" font-size="21" fill="${muted}">${String(i + 1).padStart(2, "0")}</text>`);
    artistMarkup.push(multiline(artist, 128, nameStart, 25, 24, `font-family="${mono}" font-size="22" font-weight="700" fill="${ink}"`));
    const dividerY = nameStart + lines.length * 24 + 10;
    artistMarkup.push(`<line x1="76" y1="${dividerY}" x2="490" y2="${dividerY}" stroke="${ink}" stroke-opacity=".16"/>`);
    artistY = dividerY + 28;
  }
  const artistsEnd = artistY;

  // Right column: every line item is positioned after the previous one, not on fixed y values.
  const sonicX = 548;
  const sonicWidth = 26;
  let sonicY = sectionTop + 88;
  const sonicMarkup: string[] = [];
  sonicMarkup.push(`<text x="${sonicX}" y="${sonicY}" font-family="${serif}" font-size="28" font-weight="700" fill="${ink}">${text(taste.color)}</text>`);
  sonicY += 58;
  for (const item of [taste.weather, taste.place, taste.season, taste.feeling]) {
    const lines = wrap(item, sonicWidth);
    sonicMarkup.push(multiline(item, sonicX, sonicY, sonicWidth, 23, `font-family="${mono}" font-size="16" fill="${ink}"`));
    const dividerY = sonicY + lines.length * 23 + 10;
    sonicMarkup.push(`<line x1="${sonicX}" y1="${dividerY}" x2="822" y2="${dividerY}" stroke="${ink}" stroke-opacity=".16"/>`);
    sonicY = dividerY + 25;
  }
  const sonicEnd = sonicY;
  const tasteWorldEnd = Math.max(artistsEnd, sonicEnd) + 6;

  // Tags start below the entire two-column block, so they can never overlap the artist list.
  const tagsLabelY = tasteWorldEnd + 30;
  const tagStartY = tagsLabelY + 42;
  let tagY = tagStartY;
  let tagX = 76;
  const tagMarkup: string[] = [];
  for (const tag of taste.tags.slice(0, 6)) {
    const width = Math.max(112, Math.min(300, tag.length * 9.2 + 34));
    if (tagX + width > 824) {
      tagX = 76;
      tagY += 42;
    }
    tagMarkup.push(`<rect x="${tagX}" y="${tagY - 21}" width="${width}" height="30" rx="15" fill="none" stroke="${ink}" stroke-width="1.2"/>`);
    tagMarkup.push(`<text x="${tagX + 15}" y="${tagY - 1}" font-family="${mono}" font-size="13" font-weight="700" fill="${ink}">${text(tag)}</text>`);
    tagX += width + 10;
  }
  const tagsEnd = tagY + 25;

  const oppositeLabelY = tagsEnd + 45;
  const oppositeTitleY = oppositeLabelY + 45;
  const oppositeMetaY = oppositeTitleY + 28;
  const reasonStart = oppositeMetaY + 34;
  const reasonLines = wrap(opposite.reason, 62);
  const barcodeTop = reasonStart + reasonLines.length * 24 + 44;
  const barcodeHeight = 66;
  const footerTextY = barcodeTop + barcodeHeight + 38;
  const H = Math.max(1240, footerTextY + 82);

  const bars = Array.from({ length: 54 }, (_, i) => {
    const widths = [2, 3, 1, 4, 2, 1, 3, 2, 4];
    const w = widths[i % widths.length];
    const x = 235 + i * 8;
    return `<rect x="${x}" y="${barcodeTop}" width="${w}" height="${barcodeHeight}" fill="${ink}"/>`;
  }).join("");
  const zigzag = (y: number) => Array.from({ length: 45 }, (_, i) => `${i * 20},${y + (i % 2 ? 8 : 0)}`).join(" ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${paper}"/>
    <!-- narrow dark trim stays outside the content-safe paper area -->
    <rect x="0" y="0" width="28" height="${H}" fill="#080808"/>
    <rect x="872" y="0" width="28" height="${H}" fill="#080808"/>
    <polygon points="${zigzag(20)}" fill="${paper}"/>
    <polygon points="${zigzag(H - 20)}" fill="${paper}" transform="translate(0,-8)"/>
    <!-- small ticket notches on the side edges; they never enter the text area -->
    ${Array.from({ length: 18 }, (_, i) => {
      const y = 52 + i * ((H - 104) / 17);
      return `<polygon points="28,${y - 7} 28,${y + 7} 36,${y}" fill="#080808"/><polygon points="872,${y - 7} 872,${y + 7} 864,${y}" fill="#080808"/>`;
    }).join("")}

    <text x="76" y="72" font-family="${mono}" font-size="14" font-weight="700" letter-spacing="2.5" fill="${ink}">SAME FREQUENCY.</text>
    <text x="824" y="72" text-anchor="end" font-family="${mono}" font-size="13" fill="${ink}">NO. ${text(profile.id.slice(0, 6).toUpperCase())}</text>
    <text x="76" y="96" font-family="${mono}" font-size="11" fill="${muted}">a tiny cultural taste experiment</text>
    <line x1="76" y1="120" x2="824" y2="120" stroke="${ink}" stroke-dasharray="4 7"/>

    <text x="76" y="205" font-family="${serif}" font-size="67" font-weight="700" fill="${ink}">my frequency.</text>
    <text x="76" y="238" font-family="${mono}" font-size="12" font-weight="700" letter-spacing="1.6" fill="${muted}">WHAT MY MUSIC TASTE SAYS ABOUT ME</text>
    <line x1="76" y1="268" x2="824" y2="268" stroke="${ink}" stroke-dasharray="4 7"/>

    <text x="76" y="310" font-family="${mono}" font-size="13" font-weight="700" letter-spacing="2" fill="${red}">THE READ</text>
    ${multiline(taste.portrait, 76, readStart, 58, 34, `font-family="${mono}" font-size="23" font-weight="700" fill="${ink}"`)}

    <line x1="76" y1="${sectionTop - 24}" x2="824" y2="${sectionTop - 24}" stroke="${ink}" stroke-dasharray="4 7"/>
    <text x="76" y="${sectionTop}" font-family="${mono}" font-size="13" font-weight="700" letter-spacing="2" fill="${ink}">MY FIVE</text>
    <text x="548" y="${sectionTop}" font-family="${mono}" font-size="13" font-weight="700" letter-spacing="2" fill="${ink}">MY SONIC WORLD</text>
    <line x1="520" y1="${sectionTop + 22}" x2="520" y2="${tasteWorldEnd - 4}" stroke="${ink}" stroke-dasharray="3 6"/>
    ${artistMarkup.join("")}
    ${sonicMarkup.join("")}

    <line x1="76" y1="${tagsLabelY - 22}" x2="824" y2="${tagsLabelY - 22}" stroke="${ink}" stroke-dasharray="4 7"/>
    <text x="76" y="${tagsLabelY}" font-family="${mono}" font-size="13" font-weight="700" letter-spacing="2" fill="${red}">MY TAGS</text>
    ${tagMarkup.join("")}

    <line x1="76" y1="${tagsEnd + 8}" x2="824" y2="${tagsEnd + 8}" stroke="${ink}" stroke-dasharray="4 7"/>
    <text x="76" y="${oppositeLabelY}" font-family="${mono}" font-size="13" font-weight="700" letter-spacing="2" fill="${red}">PROBABLY NOT MY THING</text>
    <text x="76" y="${oppositeTitleY}" font-family="${serif}" font-size="35" font-weight="700" fill="${ink}">${text(opposite.title)}</text>
    <text x="76" y="${oppositeMetaY}" font-family="${mono}" font-size="13" font-weight="700" fill="${ink}">${text(opposite.meta)}</text>
    ${multiline(opposite.reason, 76, reasonStart, 62, 24, `font-family="${mono}" font-size="16" fill="${ink}"`)}

    <line x1="76" y1="${barcodeTop - 25}" x2="824" y2="${barcodeTop - 25}" stroke="${ink}" stroke-dasharray="4 7"/>
    ${bars}
    <text x="450" y="${footerTextY}" text-anchor="middle" font-family="${mono}" font-size="12" font-weight="700" letter-spacing="1.2" fill="${ink}">THANKS FOR SHARING YOUR FREQUENCY.</text>
    <text x="450" y="${footerTextY + 25}" text-anchor="middle" font-family="${mono}" font-size="12" font-weight="700" letter-spacing="1.2" fill="${red}">SAME-FREQUENCY.</text>
  </svg>`;
}

async function posterBlob(profile: Profile, taste: ReturnType<typeof getTasteProfile>, opposite: { title: string; meta: string; reason: string; url?: string }) {
  const svg = posterSvg(profile, taste, opposite);
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("poster render failed")); });
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || 900;
  canvas.height = image.naturalHeight || 1400;
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

  const ai = profile.ai_report;
  if (!ai) {
    return (
      <main className="min-h-screen grid place-items-center noise p-6">
        <div className="max-w-xl text-center">
          <p className="retro-kicker">same frequency.</p>
          <h1 className="display mt-5 text-5xl">Taste report unavailable.</h1>
          <p className="mt-5 text-neutral-600">We couldn't build this report yet. Please try opening it again in a moment.</p>
          <Link href="/join" className="mt-7 inline-block bg-black px-6 py-3 font-bold text-white">make my own →</Link>
        </div>
      </main>
    );
  }

  const taste = {
    tags: ai.tags,
    description: ai.description,
    portrait: ai.portrait,
    redFlag: ai.redFlag,
    color: ai.color,
    weather: ai.weather,
    place: ai.place,
    season: ai.season,
    feeling: ai.feeling
  } as ReturnType<typeof getTasteProfile>;

  const cultural: CulturalMatch[] = ai.culturalMatches;
  const opposite = ai.opposite;
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
        <Link href="/" className="font-mono text-sm font-black uppercase tracking-[.18em]">same frequency.</Link>
        <div className="flex items-center gap-4">
          {isOwnReport && <button onClick={share} className="flex items-center gap-2 text-sm font-bold underline underline-offset-4"><Share2 size={15}/>{shareLabel}</button>}
          <Link href="/join" className="text-sm font-bold underline">{isOwnReport ? "edit my taste" : "make my own"}</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <div className="border-b-2 border-black pb-12">
          <p className="retro-kicker">{isOwnReport ? "your frequency" : `${profile.alias}'s frequency`}</p>
          <h1 className="display mt-4 max-w-5xl text-6xl leading-[.88] md:text-8xl">What your music<br/><i>says about you.</i></h1>
          <p className="mt-7 max-w-2xl text-lg leading-7 text-neutral-600">A tiny cultural profile built from the five artists this listener picked. The report is a playful local reading of their sonic and cultural taste — not a personality test.</p>
          <div className="mt-8 flex flex-wrap gap-2">{taste.tags.map(tag => <span key={tag} className="retro-tag px-4 py-2">{tag}</span>)}</div>
          {profile.music_profile_url && <a href={profile.music_profile_url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold underline">open {profile.music_platform || "music"} profile <ExternalLink size={14}/></a>}
        </div>

        <section className="mt-12 grid gap-5 md:grid-cols-[1.4fr_.6fr]">
          <div className="card transition-card p-7 md:p-9"><p className="retro-kicker">the read</p><h2 className="display mt-5 text-4xl md:text-5xl">Their taste gives off...</h2><p className="mt-6 max-w-2xl text-xl leading-9">{taste.portrait}</p><div className="mt-8 border-t border-black pt-6 text-sm text-neutral-600">A playful cultural read based only on the artists above.</div></div>
          <div className="bg-[#d8df62] p-7 md:p-8"><p className="retro-kicker">the five</p><ol className="mt-6 space-y-4">{profile.artists.map((artist, i) => <li key={artist} className="flex gap-4 border-b border-black/20 pb-3 text-sm font-bold"><span className="text-neutral-500">0{i + 1}</span>{artist}</li>)}</ol></div>
        </section>

        <section className="mt-14"><div className="flex items-end justify-between border-b-2 border-black pb-4"><div><p className="retro-kicker">if their taste were...</p><h2 className="display mt-2 text-5xl">a little world.</h2></div><Sparkles className="hidden md:block" /></div><div className="grid gap-3 pt-5 md:grid-cols-5"><Vibe label="a color" value={taste.color}/><Vibe label="the weather" value={taste.weather}/><Vibe label="a place" value={taste.place}/><Vibe label="a season" value={taste.season}/><Vibe label="a feeling" value={taste.feeling}/></div></section>

        <section className="mt-14 border border-black bg-[#d8df62] p-6 md:p-8"><p className="retro-kicker">cultural matches</p><h2 className="display mt-3 text-5xl md:text-6xl">Their next rabbit holes.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-700">Not more music recommendations — things from the same emotional neighborhood.</p><div className="mt-7 grid gap-3 md:grid-cols-2">{cultural.map(item => <a key={`${item.type}-${item.title}`} href={item.url} target={item.url ? "_blank" : undefined} rel={item.url ? "noreferrer" : undefined} className="group border border-black bg-white/55 p-5 transition hover:-translate-y-1 hover:bg-white"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.18em]">{item.type}</span>{item.url && <ArrowUpRight size={16}/>}</div><h3 className="display mt-8 text-3xl">{item.title}</h3><p className="mt-1 text-xs font-bold text-neutral-500">{item.meta}</p><p className="mt-4 text-sm leading-6 text-neutral-700">{item.reason}</p>{item.url && <p className="mt-5 text-xs font-bold underline group-hover:no-underline">open music ↗</p>}</a>)}</div></section>

        <section className="mt-14 overflow-hidden border border-black bg-black text-white"><div className="grid gap-0 md:grid-cols-[1fr_1.2fr]"><div className="p-7 md:p-9"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#d8df62]">your musical opposite</p><h2 className="display mt-5 text-5xl md:text-6xl">We found something they might hate.</h2><p className="mt-6 text-sm leading-6 text-neutral-300">Their taste leans one way. We deliberately went the other way.</p></div><div className="bg-[#b65a4c] p-7 text-black md:p-9"><p className="retro-kicker">probably not their thing</p><h3 className="display mt-5 text-5xl">{opposite.title}</h3><p className="mt-1 text-sm font-bold">{opposite.meta}</p><p className="mt-6 max-w-xl text-lg leading-7">{opposite.reason}.</p><p className="mt-8 border-t border-black/30 pt-4 text-sm font-black">Will they hate it? <span className="font-normal">Probably.</span></p>{opposite.url && <a href={opposite.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-black underline">prove us wrong <ArrowUpRight size={15}/></a>}</div></div></section>

        <section className="mt-14 border-t-2 border-black pt-8"><p className="retro-kicker">one last thing</p><h2 className="display mt-4 text-5xl md:text-7xl">their music taste&apos;s<br/><i>red flag.</i></h2><p className="mt-7 max-w-3xl text-2xl leading-9">{taste.redFlag}</p></section>

        {isOwnReport && <section className="mt-16 border-t-2 border-black pt-10"><p className="retro-kicker">the people in the pool</p><h2 className="display mt-3 text-5xl md:text-6xl">Find your frequency.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">Everyone who has joined appears here. Open someone&apos;s card to read their full report.</p>{matchesLoading ? <p className="mt-8 text-sm text-neutral-500">finding your people…</p> : matches.length === 0 ? <div className="mt-8 border border-black p-6 text-sm">You&apos;re early. Share the site with a few music-obsessed friends and come back when the pool grows.</div> : <div className="mt-7 grid gap-3 md:grid-cols-2">{matches.map(match => <Link key={match.id} href={`/matches?id=${match.id}`} className="group border border-black bg-white/45 p-5 transition hover:-translate-y-1 hover:bg-[#d8df62]"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-[.18em]">{match.alias}</span><span className="text-2xl font-black">{match.score}%</span></div><p className="mt-4 text-sm text-neutral-600">{match.sharedArtists?.length ? `${match.sharedArtists.length} shared artist${match.sharedArtists.length === 1 ? "" : "s"}` : "no shared artists"} · {match.sharedTags?.slice(0, 2).join(" · ") || "different sonic worlds"}</p><p className="mt-5 text-xs font-bold underline">open report ↗</p></Link>)}</div>}</section>}

        {isOwnReport && <section className="mt-16 grid-bg border border-black p-7 text-center md:p-12"><p className="retro-kicker">same frequency.</p><h2 className="display mt-5 text-5xl md:text-7xl">Turn your taste<br/><i>into a poster.</i></h2><button onClick={share} className="mt-8 inline-flex items-center gap-3 bg-black px-7 py-4 text-lg font-bold text-white hover:translate-x-1">{shareLabel} <Share2 size={18}/></button></section>}

        <div className="mt-14 border-t border-black pt-6 text-xs leading-5 text-neutral-500">same frequency. is a playful cultural taste experiment. The profile above is generated from the artists selected; it is not a psychological assessment.</div>
      </section>
    </main>
  );
}

export default function MatchesPage() { return <Suspense fallback={<main className="min-h-screen grid place-items-center noise">Loading…</main>}><MatchesContent /></Suspense>; }

function Vibe({ label, value }: { label: string; value: string }) { return <div className="border border-black bg-white/35 p-5"><p className="retro-label text-[10px] font-black uppercase text-neutral-500">{label}</p><p className="mt-8 font-black leading-6">{value}</p></div>; }
