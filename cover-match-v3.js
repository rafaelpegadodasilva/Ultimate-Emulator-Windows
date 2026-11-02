'use strict';
// Resolver títulos de capas no catálogo público Libretro, sem adivinhar jogos.
const path=require('path');
function normalize(value){
 return String(value||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/\.(?:png|jpe?g|webp|chd|iso|cue|bin|pbp|m3u)$/i,'')
  .replace(/\([^)]*(?:https?:|www\.)[^)]*\)/gi,'')
  .replace(/\((?:usa[\s,]+europe|europe[\s,]+usa|usa[\s,]+canada|canada|germany|france|korea)\)/gi,'')
  .replace(/\((?:usa|us|europe|eur|japan|jpn|world|brazil|brasil|asia|australia|en(?:,[a-z]+)*|pt-br(?:\s+dub)?|rev\s*\w*|disc\s*\d+|disk\s*\d+|v(?:ersion)?\s*\d+(?:[.,]\d+)+)\)/gi,'')
  .replace(/\b(?:disc|disk|cd)\s*\d+\b/gi,'')
  .replace(/\((?:u|e|j|w|a|f|g|i|s|ntsc|pal)\)/gi,'')
  .replace(/_/g,' ').replace(/\bii\b/gi,'2').replace(/\biii\b/gi,'3').replace(/\biv\b/gi,'4')
  .replace(/(?:\.(?:zip|7z|sfc|smc|nes|gb|gbc|gba|nds|a26|a78|a52|rom|md|bin|z64|n64|v64))+$/i,'')
  .replace(/(?:[- ](?:nintendinho|nintendnho|ninitendinho|nintedinho)|[- ]BG)+$/ig,'')
  .replace(/\([^)]*\)|\[[^\]]*\]/g,'')
  .replace(/\bthe\b/g,'')
  .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function htmlDecode(x){return String(x||'').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#(?:39|x27);/gi,"'");}
function parseIndex(html){
 const names=[];const seen=new Set();
 const re=/<a\s+[^>]*?href\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/gi;
 let m;while((m=re.exec(html))){
  let href=htmlDecode(m[1]||m[2]);
  if(!/\.png(?:$|\?)/i.test(href)||href.includes('/')||href.includes('\\'))continue;
  try{href=decodeURIComponent(href.split('?')[0]);}catch{continue;}
  if(href.length>240||!href.toLowerCase().endsWith('.png')||seen.has(href.toLowerCase()))continue;
  seen.add(href.toLowerCase());names.push(href);
 }
 return names;
}
function gameStem(value){
 return normalize(String(value).replace(/\.(?:png|jpe?g|webp)$/i,'').replace(/\s*\([^)]*\)\s*$/,'')).trim();
}
function bestCover(gameName, available){
 const raw=String(gameName||'');
 const name=normalize(raw);
 if(!name||name.length<3||/^(?:eboot|sf2|sfzbr1|scus\s?\d+|slus\s?\d+|sc[eul]s\s?\d+)$/i.test(name))return null;
 let selected=null,score=-1;
 // First require same complete title including revision/region where possible.
 for(const file of available||[]){
  if(normalize(file)!==name)continue;
  let points=10;
  const requestedDisc=/\b(?:disc|disk|cd)\s*(\d+)\b/i.exec(raw)?.[1];
  const selectedDisc=/\b(?:disc|disk|cd)\s*(\d+)\b/i.exec(file)?.[1];
  if(requestedDisc && selectedDisc===requestedDisc)points+=7;
  if(requestedDisc && selectedDisc && selectedDisc!==requestedDisc)points-=8;
  const requestedRegion=/\b(USA|Europe|Japan|Canada|Brazil|World)\b/i.exec(raw)?.[1];
  if(requestedRegion && new RegExp('\\b'+requestedRegion+'\\b','i').test(file))points+=5;
  if(/\busa?\b/i.test(file))points+=2;
  if(/\bbrazil\b/i.test(file))points+=1;
  if(points>score){score=points;selected=file;}
 }
 if(selected)return selected;
 // MAME often has version metadata such as (USA 980904) in boxart names,
 // while the game cache contains (USA 980904) or (US, 980904).
 // Do not match a short title against unrelated sequels or editions.
 const stem=gameStem(raw);
 if(stem.length<7)return null;
 const candidates=(available||[]).filter(file=>gameStem(file)===stem);
 if(!candidates.length)return null;
 const region=/\b(?:usa?|world|euro|japan|brazil|brasil)\b/i.exec(raw)?.[0]?.toLowerCase();
 const year=/\b\d{6}\b/.exec(raw)?.[0];
 const ranked=candidates.map(file=>{
  const lower=file.toLowerCase();
  return {file,score:(region && lower.includes(region)?4:0)+(year && lower.includes(year)?8:0)
    +(/\(USA/i.test(file)?1:0)};
 }).sort((a,b)=>b.score-a.score);
 // If the title exists in multiple regional versions without an identifying
 // hint, avoid guessing unless the result represents a single unique title.
 if(ranked.length>1 && ranked[0].score===ranked[1].score && ranked[0].score===0)return null;
 return ranked[0].file;
}
module.exports={normalize,parseIndex,bestCover};
