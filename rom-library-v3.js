'use strict';
// Biblioteca pura. Não altera ROMs, saves ou arquivos do usuário.
const fs = require('fs');
const mameMachines=require('./mame-machines.json');
const discTitles=require('./disc-titles.cjs');
const path = require('path');
const DISC_EXT = new Set(['.iso','.bin','.img','.mdf','.cue','.chd','.pbp','.m3u','.gdi','.cdi']);
const IGNORE_DIR = new Set(['bios','cache','cheats','config','configuration','configuracao','database','logs','saves','save states','savestates','states','savegames','screenshots','snapshots','firmware','updates','update','dlc','patch','patches','covers','capas','assets','drivers','tools','temp','tmp','download','downloads']);
const JUNK_STEM = /^(?:eboot|boot|default|disc|discimage|image|track[ _-]*\d+|audio[ _-]*\d+|data[ _-]*\d+|system|firmware|bios|readme|license|update|patch|game[ _-]?data)$/i;
const AUX_EXT=new Set(['.txt','.nfo','.xml','.json','.cfg','.ini','.dat','.db','.log','.mds','.sub','.ccd','.sbi','.sfv','.jpg','.jpeg','.png','.webp','.exe','.dll','.sav','.srm','.state','.bak','.pdf','.zip.tmp']);
const INVALID_DISPLAY_DIR = /^(?:roms?|games?|jogos?|playstation\s*[12]|ps[12]|psx|psp|eboot|pbp|iso|images?|discs?|arquivos?|sistemas?\s*roms)$/i;
const serialPattern = /^(?:S[CLU][A-Z]{1,2}|SLPS|SCPS|SCUS|SLUS|SLES|SCES|SLED|PBP)[-_\s]?\d{3,8}(?:[.-]\d+)?$/i;

function cleanName(input) {
 return String(input||'')
  .replace(/\.(?:chd|m3u|cue|gdi|cdi|iso|img|bin|mdf|pbp|zip|7z|rvz|gcm|wbfs|cso|xci|nsp)$/i,'')
  .replace(/_+/g,' ')
  .replace(/\s*\((?:www\.|https?:)[^)]*\)/gi,'')
  .replace(/\s+/g,' ').trim();
}
function normTitle(value){
 return cleanName(value)
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/\((?:usa|us|europe|eur|japan|jpn|world|brazil|brasil|asia|australia|rev\s*\w*|pt-br|en(?:,\w+)*|multi\w*)\)/gi,'')
  .replace(/\[(?:!|\w{1,4}|[a-z0-9_ -]*release[a-z0-9_ -]*)\]/gi,'')
  .replace(/\b(?:disc|disk|cd)\s*(\d+)\b/g,'disc$1')
  .replace(/\b\d{4}\b/g, m=>m) // preserve numbered game names
  .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function catalogTitle(file,system) {
 const base=path.parse(file).name;
 const embedded=discTitles.pbpTitle(file);if(embedded)return cleanName(embedded);
 if (/^eboot$/i.test(base) && (system?.id==='psx'||system?.id==='psp')) {
   const parent=path.basename(path.dirname(file));
   if(INVALID_DISPLAY_DIR.test(parent)||IGNORE_DIR.has(parent.toLowerCase())||serialPattern.test(parent))return null;
   return cleanName(parent);
 }
 return cleanName(base);
}
function isGenericFile(file,system) {
 const base=path.parse(file).name;
 const ext=path.extname(file).toLowerCase();
 if(system?.id==='arcade'){const m=mameMachines[base.toLowerCase()];if(m&&(m.isBios||m.isDevice||m.runnable===false))return true;}
 if (!fs.existsSync(file)) return true;
 if(AUX_EXT.has(ext))return true;
 if(Array.isArray(system?.extensions)&&system.extensions.length&&!system.extensions.map(x=>x.toLowerCase()).includes(ext))return true;
 const segments=path.dirname(file).split(/[\\/]+/).map(s=>s.toLowerCase());
 const folder=String(system?.folder||'').toLowerCase();
 const systemAt=segments.lastIndexOf(folder);
 const relevant=systemAt>=0?segments.slice(systemAt+1):segments.slice(-3);
 if(relevant.some(s=>IGNORE_DIR.has(s))) return true;
 if(JUNK_STEM.test(base)) {
   // EBOOT.PBP is a playable PS1/PSP container only when folder names a game.
   if(ext==='.pbp'&&(system?.id==='psx'||system?.id==='psp')&&catalogTitle(file,system))return false;
   // disc images literally called disc.iso may be valid, but not reliably identifiable.
   return true;
 }
 if(ext==='.elf'&&['ps2','psp'].includes(system?.id))return true;
 if(['psx','ps2','psp'].includes(system?.id) && DISC_EXT.has(ext) && !['.cue','.m3u','.gdi'].includes(ext)) {
  try {if(fs.statSync(file).size < 1024*1024)return true;} catch{return true;}
 }
 return false;
}
function discReferences(files){
 const refs=new Set();
 for(const file of files){
  const ext=path.extname(file).toLowerCase();
  if(!['.cue','.gdi','.m3u'].includes(ext))continue;
  let content='';try{content=fs.readFileSync(file,'utf8');}catch{continue;}
  let names=[];
  if(ext==='.cue') {
   const rx=/^\s*FILE\s+(?:"([^"]+)"|([^\s]+))\s+/gim;let m;
   while((m=rx.exec(content)))names.push(m[1]||m[2]);
  } else if(ext==='.gdi') {
   for(const line of content.split(/\r?\n/)){
    const m=/^\s*\d+\s+\d+\s+\d+\s+\d+\s+(?:"([^"]+)"|(\S+))\s+\d+/i.exec(line);
    if(m)names.push(m[1]||m[2]);
   }
  } else {
   names=content.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
  }
  for(const name of names){
   if(!name||/^(?:[a-z]+:|\/\/)/i.test(name))continue;
   refs.add(path.resolve(path.dirname(file),name.replace(/\\/g,path.sep)).toLowerCase());
  }
 }
 return refs;
}
function priority(file) {
 const ext=path.extname(file).toLowerCase();
 const scores={'.m3u':110,'.chd':100,'.rvz':100,'.gcm':90,'.cue':90,'.gdi':90,'.cdi':85,'.iso':80,'.cso':80,'.xiso':80,'.pbp':75,'.pkg':75,'.vpk':75,'.zip':70,'.7z':68,'.img':60,'.mdf':60,'.bin':40};
 return scores[ext]||50;
}
function groupKey(record, system) {
 if(system?.id==='vita'||system?.folder==='PlayStation Vita'){
  const id=path.basename(record.path).match(/\b([A-Z]{4}\d{5})\b/i)?.[1];
  if(id)return 'vita|'+id.toUpperCase();
 }
 const title=normTitle(record.name||'');
 if(!title)return '';
 return String(system.folder||system.id||'').toLowerCase()+'|'+title;
}
function prefer(candidate, current){
 const a=priority(candidate.path),b=priority(current.path);
 if(a!==b)return a>b;
 // Same game in multiple folders or repeated scan: deterministic choice.
 return candidate.path.toLowerCase().localeCompare(current.path.toLowerCase())<0;
}
function compactEntries(entries,system,opts={}){
 const ignoreMissing=!!opts.ignoreMissing;
 const refs=discReferences((entries||[]).map(x=>x?.path).filter(Boolean));
 const candidates=new Map(),seenPath=new Set();
 for(const original of entries||[]){
  if(!original||typeof original.path!=='string')continue;
  const full=path.resolve(original.path),canonical=full.toLowerCase();
  if(seenPath.has(canonical))continue;
  seenPath.add(canonical);
  if(refs.has(canonical))continue;
  if(!ignoreMissing && !fs.existsSync(full))continue;
  if(isGenericFile(full,system))continue;
  const display=catalogTitle(full,system);
  if(!display)continue;
  const record={name:display,fileName:path.basename(full),path:full};
  // Respect MAME descriptive names from the metadata source.
  if(system?.id==='arcade'&&original.name)record.name=String(original.name);
  const key=groupKey(record,system)||canonical;
  const prior=candidates.get(key);
  if(!prior||prefer(record,prior))candidates.set(key,record);
 }
 return [...candidates.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base'}));
}
function cleanLibraries(libraries,systems){
 const indexed=new Map((systems||[]).map(s=>[s.folder,s]));
 const output={};
 for(const [folder,rows] of Object.entries(libraries||{})){
  const system=indexed.get(folder)||{folder,id:''};
  output[folder]=compactEntries(rows,system);
 }
 return output;
}
module.exports={cleanName,normTitle,catalogTitle,discReferences,isGenericFile,compactEntries,cleanLibraries};
