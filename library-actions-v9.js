"use strict";
// Ultimate Emulator V9: filesystem library actions.
// Delete ONLY scanned/indexed game files by moving to OS recycle bin.
const fs = require('fs');
const path = require('path');
const ROM_EXTENSIONS = new Set(('.zip .7z .chd .cue .bin .iso .img .mdf .m3u .pbp .cso .gdi .cdi .rvz .gcm .wbfs .nkit.iso .nes .sfc .smc .gba .gbc .gb .nds .n64 .z64 .v64 .a26 .a78 .rom .md .gen .sms .xci .nsp .nca .nsz .xcz .pkg .elf .ciso .wbfs .nrg .ccd .cso .d64 .g64 .tap .adf .lha .hdf .st .msa .ipf .fds .gg .sg .ngp .ngc .ws .wsc .pce .sgx .vpk .3ds .cia').split(' '));
function canon(p) { return path.normalize(path.resolve(p)).toLowerCase(); }
function allowedExtension(p) {return ROM_EXTENSIONS.has(path.extname(p).toLowerCase()) || /\.nkit\.iso$/i.test(p);}
function makeIndexedPaths(caches) {
 const allowed = new Set();
 for (const data of caches) {
  if (!data || !data.entries && !data.items)continue;
  let root = null;
  for(const value of data.roots || [])if(typeof value==='string' && fs.existsSync(value)){root=value;break;}
  if (!root)continue;
  for (const entries of Object.values(data.entries||data.items||{})) {
   if(!Array.isArray(entries))continue;
   for(const item of entries){
    if(typeof item?.relative!=='string')continue;
    const full=path.resolve(root,item.relative);
    // Never allow relative paths that escape the saved library root.
    if(full===path.resolve(root)||!canon(full).startsWith(canon(root)+path.sep))continue;
    if(allowedExtension(full))allowed.add(canon(full));
   }
  }
 }
 return allowed;
}
function safeFile(p,allowed) {
 if(typeof p!=='string'||p.length>32767||p.includes('\0'))throw Error('Caminho invalido.');
 const f=path.resolve(p);
 if(!allowed.has(canon(f)))throw Error('Jogo nao encontrado no indice da biblioteca: '+path.basename(f));
 if(!allowedExtension(f))throw Error('Formato nao autorizado para exclusao: '+path.basename(f));
 const s=fs.lstatSync(f);
 if(!s.isFile()||s.isSymbolicLink())throw Error('O item nao e um arquivo de jogo comum.');
 return f;
}
function referencedTracks(cue) {
 if(!/\.cue$/i.test(cue))return [];
 let content='';try{content=fs.readFileSync(cue,'utf8')}catch{return []}
 const values=[];
 for(const match of content.matchAll(/^\s*FILE\s+(?:"([^"]+)"|'([^']+)'|([^\s]+))\s+\S+/gim)){
  const ref=match[1]||match[2]||match[3];
  const dest=path.resolve(path.dirname(cue),ref);
  // Never leave the CUE folder, never touch anything except known track files.
  if(canon(path.dirname(dest))!==canon(path.dirname(cue)))continue;
  if(!/\.(?:bin|img|wav|flac|ape|mp3)$/i.test(dest))continue;
  try{if(fs.lstatSync(dest).isFile())values.push(dest)}catch{}
 }
 return [...new Set(values.map(canon))].map(k=>values.find(v=>canon(v)===k));
}
function plan(files,allowed) {
 if(!Array.isArray(files)||!files.length||files.length>250)throw Error('Selecione de 1 a 250 jogos.');
 const unique=[...new Set(files.map(safe=>safeFile(safe,allowed)).map(canon))];
 const primary=unique.map(k=>files.map(f=>path.resolve(f)).find(f=>canon(f)===k));
 const selected=new Set(primary.map(canon));
 const extras=[];
 for(const cue of primary.filter(x=>/\.cue$/i.test(x))){
  for(const track of referencedTracks(cue)){
   // Do not trash tracks used by another, unselected CUE in the same folder.
   let shared=false;
   for(const sibling of fs.readdirSync(path.dirname(cue))){
    if(!/\.cue$/i.test(sibling))continue;
    const other=path.join(path.dirname(cue),sibling);
    if(selected.has(canon(other)))continue;
    if(referencedTracks(other).some(p=>canon(p)===canon(track))){shared=true;break;}
   }
   if(!shared && !selected.has(canon(track)) && !extras.some(x=>canon(x)===canon(track)))extras.push(track);
  }
 }
 return {primary,extras,files:[...primary,...extras]};
}
async function moveToTrash(files,allowed,trashItem,confirm) {
 const p=plan(files,allowed);
 if(!await confirm(p))return {cancelled:true,removed:[],failed:[]};
 const removed=[],failed=[];
 for(const f of p.files){
  try{
   if(!fs.lstatSync(f).isFile())throw Error('Arquivo nao encontrado ou alterado.');
   await trashItem(f); // no permanent-delete fallback, including network drives
   removed.push(f);
  }catch(e){failed.push({path:f,error:String(e?.message||e)})}
 }
 return {cancelled:false,removed,failed,selected:p.primary,companions:p.extras};
}
module.exports={canon,plan,makeIndexedPaths,safeFile,referencedTracks,moveToTrash};
