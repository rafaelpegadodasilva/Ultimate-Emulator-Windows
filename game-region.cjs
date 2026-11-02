'use strict';
const fs=require('fs/promises'),path=require('path');
const cache=new Map();
const names={USA:'USA',Europe:'Europe',Japan:'Japan',World:'World',Brazil:'Brazil',Asia:'Asia',Australia:'Australia',Korea:'Korea',China:'China',Taiwan:'Taiwan',Canada:'Canada'};
const aliases={usa:'USA',us:'USA',u:'USA',europe:'Europe',eur:'Europe',eu:'Europe',e:'Europe',japan:'Japan',jpn:'Japan',jp:'Japan',j:'Japan',world:'World',w:'World',brazil:'Brazil',brasil:'Brazil',br:'Brazil',asia:'Asia',australia:'Australia',aus:'Australia',a:'Australia',korea:'Korea',kor:'Korea',k:'Korea',china:'China',chn:'China',taiwan:'Taiwan',canada:'Canada'};
function fromName(text){
 const found=new Set();
 // Only explicit region tags and serials, never a country in a game's title or language list.
 const groups=[...String(text).matchAll(/[([]([^\])]+)[\])]/g)].map(m=>m[1]);
 for(const group of groups){
  for(const token of group.split(/\s*[,/+&-]\s*/)){const r=aliases[token.trim().toLowerCase()];if(r)found.add(r);}
 }
 if(/\b(?:SLUS|SCUS|SLUA|SCUA)[ _.-]?\d/i.test(text))found.add('USA');
 if(/\b(?:SLES|SCES|SLED|SCED)[ _.-]?\d/i.test(text))found.add('Europe');
 if(/\b(?:SLPS|SCPS|SLPM|SCPM|PAPX)[ _.-]?\d/i.test(text))found.add('Japan');
 return [...found];
}
async function readAt(file,length,position){const b=Buffer.alloc(length);const {bytesRead}=await file.read(b,0,length,position);return b.subarray(0,bytesRead);}
async function zipNames(file,size){
 const tail=await readAt(file,Math.min(size,65557),Math.max(0,size-65557));
 for(let i=tail.length-22;i>=0;i--){
  if(tail.readUInt32LE(i)!==0x06054b50)continue;
  if(i+22+tail.readUInt16LE(i+20)!==tail.length)continue;
  const length=tail.readUInt32LE(i+12),offset=tail.readUInt32LE(i+16);
  if(length>4*1024*1024||offset+length>size)return [];
  const central=await readAt(file,length,offset),result=[];
  for(let p=0;p+46<=central.length;){
   if(central.readUInt32LE(p)!==0x02014b50)break;
   const n=central.readUInt16LE(p+28),extra=central.readUInt16LE(p+30),comment=central.readUInt16LE(p+32);
   const name=central.subarray(p+46,p+46+n).toString('utf8');
   if(/\.(?:nes|sfc|smc|gba|gbc|gb|nds|n64|z64|v64|bin|md|gen|sms|iso|cue|chd|a26|a78|rom)$/i.test(name))result.push(name);
   p+=46+n+extra+comment;
  }return result;
 }return [];
}
function headerRegion(b,ext){
 const code={E:'USA',P:'Europe',J:'Japan',D:'Germany',F:'France',I:'Italy',S:'Spain',K:'Korea',C:'China',U:'Australia',W:'Taiwan'};
 if(ext==='.nds'&&b.length>=0x160&&b.readUInt32LE(0x20)>0&&b.subarray(0x0c,0x10).toString('ascii').match(/^[A-Z0-9]{4}$/))return code[String.fromCharCode(b[0x0f])]||null;
 if(ext==='.gba'&&b.length>0xb2&&b[0xb2]===0x96)return code[String.fromCharCode(b[0xaf])]||null;
 if(['.z64','.v64','.n64'].includes(ext)&&b.length>=0x40){
  b=Buffer.from(b);if(b.readUInt32BE(0)===0x37804012)b.swap16();else if(b.readUInt32BE(0)===0x40123780)b.swap32();
  if(b.readUInt32BE(0)===0x80371240)return code[String.fromCharCode(b[0x3e])]||null;
 }
 if(['.md','.gen','.bin'].includes(ext)&&b.length>=0x200&&b.subarray(0x100,0x110).toString('ascii').startsWith('SEGA')){
  const text=b.subarray(0x1f0,0x200).toString('ascii').trim();const values=[];
  if(/J/.test(text))values.push('Japan');if(/U/.test(text))values.push('USA');if(/E/.test(text))values.push('Europe');
  return values.length?values.join(' / '):null;
 }return null;
}
async function detect(rom){
 let file;
 try{
  const stat=await fs.stat(rom);if(!stat.isFile())return {region:null};
  const key=rom+'|'+stat.size+'|'+stat.mtimeMs;if(cache.has(key))return cache.get(key);
  let regions=fromName(path.basename(rom));let source='filename';
  if(!regions.length){regions=fromName(path.basename(path.dirname(rom)));source='folder';}
  const ext=path.extname(rom).toLowerCase();
  if(!regions.length){
   file=await fs.open(rom,'r');
   if(ext==='.zip'){
    regions=[...new Set((await zipNames(file,stat.size)).flatMap(fromName))];source='archive';
   }else{
    const r=headerRegion(await readAt(file,Math.min(512,stat.size),0),ext);if(r)regions=[r];source='header';
   }
  }
  const result={region:regions.length?regions.map(r=>names[r]||r).join(' / '):null,source:regions.length?source:null};
  if(cache.size>1000)cache.clear();cache.set(key,result);return result;
 }catch{return {region:null,source:null}}finally{if(file)await file.close()}
}
module.exports={detect,fromName,headerRegion};
