export const FIVE_TITLES_SINCE='2026-10-24';
export const titleEnding=(t:string)=>t.split(/[,，]\s*/).at(-1)!.trim();
export function checkTitleDiversity(candidates:string[],selected:string,recentTitles:string[]=[]):string[]{
 const errs:string[]=[],ends=candidates.map(titleEnding);
 if(candidates.length!==5||new Set(candidates).size!==5||!candidates.includes(selected))errs.push('five_titles_required');
 if(new Set(ends).size!==ends.length)errs.push('title_ending_repeated');
 if(recentTitles.slice(0,10).map(titleEnding).includes(titleEnding(selected)))errs.push('title_ending_matches_recent');
 return errs;}
export function legacySevenTitlesAllowed(asOfDate:string,candidates:string[],selected:string):boolean{
 return asOfDate<FIVE_TITLES_SINCE&&candidates.length===7&&new Set(candidates).size===7&&candidates.includes(selected);}
