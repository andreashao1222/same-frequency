export type User = {
  id: string;
  username: string;
  artists: string[];
  spotify: string;
  bio?: string;
};

export const seedUsers: User[] = [
  {
    id: "1",
    username: "nightbus",
    artists: ["Clairo", "Laufey", "The Marías", "Men I Trust", "beabadoobee"],
    spotify: "https://open.spotify.com/",
    bio: "late-night headphones / soft guitars"
  },
  {
    id: "2",
    username: "softstatic",
    artists: ["Ethel Cain", "Lorde", "Phoebe Bridgers", "Weyes Blood", "Big Thief"],
    spotify: "https://open.spotify.com/",
    bio: "sad songs with excellent production"
  },
  {
    id: "3",
    username: "greenroom.mp3",
    artists: ["The 1975", "Wolf Alice", "Clairo", "Caroline Polachek", "Japanese Breakfast"],
    spotify: "https://open.spotify.com/",
    bio: "indie pop maximalist"
  },
  {
    id: "4",
    username: "velvet.fm",
    artists: ["Mitski", "FKA twigs", "Cocteau Twins", "Lana Del Rey", "Weyes Blood"],
    spotify: "https://open.spotify.com/",
    bio: "dream pop forever"
  },
  {
    id: "5",
    username: "bluehour",
    artists: ["Laufey", "beabadoobee", "The Marías", "Clairo", "Faye Webster"],
    spotify: "https://open.spotify.com/",
    bio: "five artists, no skips"
  }
];

export function scoreTaste(a: string[], b: string[]) {
  const A = new Set(a.map(x => x.trim().toLowerCase()));
  const B = new Set(b.map(x => x.trim().toLowerCase()));
  const overlap = [...A].filter(x => B.has(x)).length;
  return Math.round((overlap / Math.max(A.size, 1)) * 100);
}

export function getMatches(artists: string[], users: User[]) {
  return users
    .map(user => ({ ...user, score: scoreTaste(artists, user.artists) }))
    .sort((a, b) => b.score - a.score);
}