"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ExternalLink, Share2, Sparkles } from "lucide-react";
import { getTasteProfile, getCulturalMatches, getMusicalOpposite } from "@/lib/taste";

type Profile = {
  id: string;
  alias: string;
  artists: string[];
  spotify_url: string | null;
  taste_tags: string[];
  score?: number;
  sharedArtists?: string[];
  sharedTags?: string[];
};

export default function MatchesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") || localStorage.getItem("sf_profile_id");
    const artists = JSON.parse(localStorage.getItem("sf_artists") || "[]");
    const spotify = localStorage.getItem("sf_spotify") || "";
    if (!id || !artists.length) { setLoading(false); return; }
    const taste = getTasteProfile(artists);
    setProfile({ id, alias: "you", artists, spotify_url: spotify, taste_tags: taste.tags });
    setLoading(false);
  }, []);

  const share = async () => {
    const url = window.location.href;
    const text = "my frequency. same frequency.";
    try {
      if (navigator.share) await navigator.share({ title: "same frequency.", text, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
    } catch {}
  };

  if (!profile && !loading) {
    return (
      <main className="min-h-screen grid place-items-center noise p-6">
        <div className="text-center">
          <h1 className="display text-5xl">No taste profile yet.</h1>
          <Link href="/join" className="mt-6 inline-block bg-black px-6 py-3 font-bold text-white">Make one →</Link>
        </div>
      </main>
    );
  }
  if (!profile) return <main className="min-h-screen grid place-items-center noise">Loading…</main>;

  const taste = getTasteProfile(profile.artists);
  const cultural = getCulturalMatches(profile.artists);
  const opposite = getMusicalOpposite(profile.artists);

  return (
    <main className="min-h-screen noise">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-black">same frequency.</Link>
        <div className="flex items-center gap-4">
          <button onClick={share} className="flex items-center gap-2 text-sm font-bold underline underline-offset-4">
            <Share2 size={15}/>{shared ? "copied!" : "share my frequency"}
          </button>
          <Link href="/join" className="text-sm font-bold underline">edit my taste</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <div className="border-b-2 border-black pb-12">
          <p className="text-xs font-bold uppercase tracking-[.25em]">your frequency</p>
          <h1 className="display mt-4 max-w-5xl text-6xl leading-[.88] md:text-8xl">What your music<br/><i>says about you.</i></h1>
          <p className="mt-7 max-w-2xl text-lg leading-7 text-neutral-600">A tiny cultural profile built only from the five artists you picked. Not a personality test — just the vibe your taste gives off.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {taste.tags.map(tag => <span key={tag} className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white">{tag}</span>)}
          </div>
        </div>

        <section className="mt-12 grid gap-5 md:grid-cols-[1.4fr_.6fr]">
          <div className="card transition-card p-7 md:p-9">
            <p className="text-xs font-bold uppercase tracking-[.2em]">the read</p>
            <h2 className="display mt-5 text-4xl md:text-5xl">Your taste gives off...</h2>
            <p className="mt-6 max-w-2xl text-xl leading-9">{taste.portrait}</p>
            <div className="mt-8 border-t border-black pt-6 text-sm text-neutral-600">You seem to be drawn to music that feels personal, slightly off-center, and worth sitting with.</div>
          </div>
          <div className="bg-[#d9ff57] p-7 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[.2em]">your five</p>
            <ol className="mt-6 space-y-4">
              {profile.artists.map((artist, i) => <li key={artist} className="flex gap-4 border-b border-black/20 pb-3 text-sm font-bold"><span className="text-neutral-500">0{i + 1}</span>{artist}</li>)}
            </ol>
          </div>
        </section>

        <section className="mt-14">
          <div className="flex items-end justify-between border-b-2 border-black pb-4">
            <div><p className="text-xs font-bold uppercase tracking-[.2em]">if your taste were...</p><h2 className="display mt-2 text-5xl">a little world.</h2></div>
            <Sparkles className="hidden md:block" />
          </div>
          <div className="grid gap-3 pt-5 md:grid-cols-5">
            <Vibe label="a color" value={taste.color}/>
            <Vibe label="the weather" value={taste.weather}/>
            <Vibe label="a place" value={taste.place}/>
            <Vibe label="a season" value={taste.season}/>
            <Vibe label="a feeling" value={taste.feeling}/>
          </div>
        </section>

        <section className="mt-14 border border-black bg-[#d9ff57] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[.2em]">cultural matches</p>
          <h2 className="display mt-3 text-5xl md:text-6xl">Your next rabbit holes.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-700">Not more music recommendations — things from the same emotional neighborhood.</p>
          <div className="mt-7 grid gap-3 md:grid-cols-2">
            {cultural.map(item => (
              <a key={`${item.type}-${item.title}`} href={item.url} target={item.url ? "_blank" : undefined} rel={item.url ? "noreferrer" : undefined} className="group border border-black bg-white/55 p-5 transition hover:-translate-y-1 hover:bg-white">
                <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.18em]">{item.type}</span>{item.url && <ArrowUpRight size={16}/>}</div>
                <h3 className="display mt-8 text-3xl">{item.title}</h3>
                <p className="mt-1 text-xs font-bold text-neutral-500">{item.meta}</p>
                <p className="mt-4 text-sm leading-6 text-neutral-700">{item.reason}</p>
                {item.url && <p className="mt-5 text-xs font-bold underline group-hover:no-underline">open on Spotify ↗</p>}
              </a>
            ))}
          </div>
        </section>

        <section className="mt-14 overflow-hidden border border-black bg-black text-white">
          <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
            <div className="p-7 md:p-9">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#d9ff57]">your musical opposite</p>
              <h2 className="display mt-5 text-5xl md:text-6xl">We found something you might hate.</h2>
              <p className="mt-6 text-sm leading-6 text-neutral-300">Your taste leans one way. We deliberately went the other way.</p>
            </div>
            <div className="bg-[#ff795f] p-7 text-black md:p-9">
              <p className="text-xs font-bold uppercase tracking-[.2em]">probably not your thing</p>
              <h3 className="display mt-5 text-5xl">{opposite.title}</h3>
              <p className="mt-1 text-sm font-bold">{opposite.meta}</p>
              <p className="mt-6 max-w-xl text-lg leading-7">{opposite.reason}.</p>
              <p className="mt-8 border-t border-black/30 pt-4 text-sm font-black">Will you hate it? <span className="font-normal">Probably.</span></p>
              {opposite.url && <a href={opposite.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-black underline">prove us wrong <ArrowUpRight size={15}/></a>}
            </div>
          </div>
        </section>

        <section className="mt-14 border-t-2 border-black pt-8">
          <p className="text-xs font-bold uppercase tracking-[.2em]">one last thing</p>
          <h2 className="display mt-4 text-5xl md:text-7xl">your music taste&apos;s<br/><i>red flag.</i></h2>
          <p className="mt-7 max-w-3xl text-2xl leading-9">{taste.redFlag}</p>
        </section>

        <section className="mt-16 grid-bg border border-black p-7 text-center md:p-12">
          <p className="text-xs font-bold uppercase tracking-[.2em]">same frequency.</p>
          <h2 className="display mt-5 text-5xl md:text-7xl">Tell us what you listen to.<br/><i>We&apos;ll tell you what it says about you.</i></h2>
          <button onClick={share} className="mt-8 inline-flex items-center gap-3 bg-black px-7 py-4 text-lg font-bold text-white hover:translate-x-1">Share my frequency <Share2 size={18}/></button>
        </section>

        <div className="mt-14 border-t border-black pt-6 text-xs leading-5 text-neutral-500">same frequency. is a playful cultural taste experiment. The profile above is generated from the artists you selected; it is not a psychological assessment.</div>
      </section>
    </main>
  );
}

function Vibe({ label, value }: { label: string; value: string }) {
  return <div className="border border-black bg-white/35 p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-neutral-500">{label}</p><p className="mt-8 font-black leading-6">{value}</p></div>;
}
