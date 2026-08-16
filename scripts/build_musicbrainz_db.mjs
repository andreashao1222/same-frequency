import fs from 'node:fs/promises';
import path from 'node:path';

const seedPath = process.argv[2] || 'artists_seed.txt';
const outPath = process.argv[3] || 'data/artist-tags.json';
const cacheDir = '.mb-cache';
const API = 'https://musicbrainz.org/ws/2';
const UA = 'SameFrequency/1.0 (student music project)';

const aliases = new Map([
  ['hip hop','hip-hop'], ['hip-hop','hip-hop'], ['rnb','r&b'], ['r&b','r&b'],
  ['alternative r&b','alternative r&b'], ['dream-pop','dream pop'], ['dream pop','dream pop'],
  ['art-pop','art pop'], ['art pop','art pop'], ['indie-pop','indie pop'], ['indie pop','indie pop'],
  ['indie-rock','indie rock'], ['indie rock','indie rock'], ['singer songwriter','singer-songwriter'],
  ['singer-songwriter','singer-songwriter']
]);
const clean = s => aliases.get(String(s).trim().toLowerCase().replace(/\s+/g,' ')) ?? String(s).trim().toLowerCase().replace(/\s+/g,' ');
const safe = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,80);

await fs.mkdir(cacheDir,{recursive:true});
await fs.mkdir(path.dirname(outPath),{recursive:true});
const names = [...new Set((await fs.readFile(seedPath,'utf8')).split(/\r?\n/).map(x=>x.trim()).filter(x=>x && !x.startsWith('#')))];

async function get(url, key){
  const file = path.join(cacheDir, `${key}.json`);
  try { return JSON.parse(await fs.readFile(file,'utf8')); } catch {}
  const res = await fetch(url, {headers:{'User-Agent':UA,'Accept':'application/json'}});
  if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  await fs.writeFile(file, JSON.stringify(data));
  await new Promise(r=>setTimeout(r,1100));
  return data;
}

async function search(name){
  const q = encodeURIComponent(`artist:"${name}"`);
  const data = await get(`${API}/artist/?query=${q}&fmt=json&limit=5`, `search_${safe(name)}`);
  const artists = data.artists ?? [];
  const n = name.toLowerCase();
  return artists.find(a=>String(a.name||'').toLowerCase()===n) ?? artists[0] ?? null;
}

async function tags(mbid){
  const data = await get(`${API}/artist/${mbid}?inc=tags+genres&fmt=json`, `artist_${mbid}`);
  const all = [...(data.genres??[]), ...(data.tags??[])].map(x=>clean(x.name)).filter(Boolean);
  return [...new Set(all)];
}

const artists=[]; const missing=[];
for(let i=0;i<names.length;i++){
  const name=names[i];
  try{
    const a=await search(name);
    if(!a){missing.push(name); continue;}
    artists.push({name:a.name, mbid:a.id, tags:await tags(a.id)});
    console.log(`[${i+1}/${names.length}] ${name} -> ${artists.at(-1).tags.length} tags`);
  }catch(e){ console.error(`ERROR ${name}: ${e.message}`); missing.push(name); }
}
await fs.writeFile(outPath, JSON.stringify({version:1,source:'MusicBrainz',generatedAt:new Date().toISOString(),artistCount:artists.length,artists,missing},null,2));
console.log(`\nWrote ${outPath}: ${artists.length} artists; ${missing.length} missing.`);
