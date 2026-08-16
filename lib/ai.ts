import { getTasteProfile, getTasteProfileFromTags, getCulturalMatches, getMusicalOpposite } from "@/lib/taste";
export type CulturalMatch={type:"artist"|"album"|"movie"|"book";title:string;meta:string;reason:string;url?:string};
export type AIReport={tags:string[];description:string;portrait:string;redFlag:string;color:string;weather:string;place:string;season:string;feeling:string;culturalMatches:CulturalMatch[];opposite:{title:string;meta:string;reason:string;url?:string}};
export async function analyzeTasteWithAI(artists:string[],artistGenres:string[][]=[]):Promise<AIReport>{const p=getTasteProfile(artists,artistGenres);return {...p,culturalMatches:getCulturalMatches(artists,p.tags,4),opposite:getMusicalOpposite(artists,p.tags)};}
export function rebuildLocalReport(artists:string[],storedTags:string[]=[],artistGenres:string[][]=[]):AIReport{const p=storedTags.length?getTasteProfileFromTags(artists,storedTags):getTasteProfile(artists,artistGenres);return {...p,culturalMatches:getCulturalMatches(artists,p.tags,4),opposite:getMusicalOpposite(artists,p.tags)};}
export class AIAnalysisError extends Error{}
