import Link from "next/link";
import { ArrowUpRight, Headphones, Users, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen noise">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-mono text-sm font-black uppercase tracking-[.18em]">same frequency.</Link>
        <Link href="/join" className="retro-button px-4 py-2 text-xs font-black uppercase tracking-[.12em] hover:bg-black hover:text-white">
          join the pool →
        </Link>
      </nav>

      <section className="grid-bg mx-4 mt-2 min-h-[72vh] border border-black px-6 py-16 md:mx-8 md:px-14 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="retro-kicker mb-7">a tiny social experiment in music taste</p>
          <h1 className="display max-w-5xl text-7xl leading-[.82] md:text-[10rem]">
            Tell us what you're<br />
            listening <span className="italic">to.</span>
          </h1>

          <div className="mt-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-lg leading-7 text-neutral-600">
              Pick five artists you love. We’ll turn your taste into a tiny cultural profile — music, movies, books, vibes, and one thing you will probably hate.
            </p>
            <Link href="/join" className="retro-button group inline-flex w-fit items-center gap-3 bg-black px-7 py-4 text-lg font-bold text-white">
              Find my frequency
              <ArrowUpRight className="transition group-hover:rotate-45" />
            </Link>
          </div>
        </div>
      </section>

      <div className="marquee mt-10">
        <div className="marquee-track text-sm font-black uppercase tracking-[.22em]">
          Clairo · Phoebe Bridgers · The 1975 · Ethel Cain · Laufey · Caroline Polachek · Lorde · The Marías · Mitski · Weyes Blood · Clairo · Phoebe Bridgers · The 1975 · Ethel Cain · Laufey · Caroline Polachek · Lorde · The Marías · Mitski · Weyes Blood ·
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-16 md:grid-cols-3">
        <Feature icon={<Headphones />} number="01" title="Pick five" text="Your five favorite artists are the only profile you need." />
        <Feature icon={<Sparkles />} number="02" title="Get matched" text="Get a playful read on what your taste says about you." />
        <Feature icon={<Users />} number="03" title="Share it" text="Turn your frequency into a screenshot-worthy cultural identity." />
      </section>

      <footer className="border-t border-black px-6 py-8 text-sm text-neutral-500">
        same frequency. / made for people who care a little too much about music.
      </footer>
    </main>
  );
}

function Feature({ icon, number, title, text }: { icon: React.ReactNode; number: string; title: string; text: string }) {
  return (
    <div className="border-t-2 border-black pt-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold">{number}</span>
        {icon}
      </div>
      <h2 className="display mt-8 text-4xl">{title}</h2>
      <p className="mt-3 max-w-sm leading-6 text-neutral-600">{text}</p>
    </div>
  );
}