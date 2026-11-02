'use strict';
const fs=require('fs/promises'),path=require('path'),{execFile}=require('child_process');
// RetroArch RDB contains MessagePack records after a 16-byte header.
function decodeRdb(b){
 if(b.subarray(0,8).toString('ascii')!=='RARCHDB\0')throw Error('Invalid RDB');
 let pos=16;const end=Number(b.readBigUInt64BE(8)),records=[];
 function take(n){if(n<0||pos+n>b.length)throw Error('Truncated RDB');const v=b.subarray(pos,pos+n);pos+=n;return v}
 function number(n,signed=false){const v=take(n);return n===8?Number(signed?v.readBigInt64BE():v.readBigUInt64BE()):signed?v.readIntBE(0,n):v.readUIntBE(0,n)}
 function text(n){return take(n).toString('utf8')}
 function array(n,depth){if(n>1000000)throw Error('Invalid array');return Array.from({length:n},()=>read(depth+1))}
 function map(n,depth){if(n>1000000)throw Error('Invalid map');const o={};for(let i=0;i<n;i++){const k=read(depth+1),v=read(depth+1);if(k!=='__proto__')o[k]=v}return o}
 function read(depth=0){if(depth>32)throw Error('RDB nesting');const t=number(1);if(t<=0x7f)return t;if(t>=0xe0)return t-256;if(t>=0xa0&&t<=0xbf)return text(t&31);if(t>=0x90&&t<=0x9f)return array(t&15,depth);if(t>=0x80&&t<=0x8f)return map(t&15,depth);
 switch(t){case 0xc0:return null;case 0xc2:return false;case 0xc3:return true;case 0xc4:return take(number(1));case 0xc5:return take(number(2));case 0xc6:return take(number(4));case 0xca:return take(4).readFloatBE();case 0xcb:return take(8).readDoubleBE();case 0xcc:return number(1);case 0xcd:return number(2);case 0xce:return number(4);case 0xcf:return number(8);case 0xd0:return number(1,true);case 0xd1:return number(2,true);case 0xd2:return number(4,true);case 0xd3:return number(8,true);case 0xd9:return text(number(1));case 0xda:return text(number(2));case 0xdb:return text(number(4));case 0xdc:return array(number(2),depth);case 0xdd:return array(number(4),depth);case 0xde:return map(number(2),depth);case 0xdf:return map(number(4),depth);default:throw Error('Unsupported RDB tag '+t)}
 }
 while(pos<end&&pos<b.length){const row=read();if(!row)break;records.push(row)}return records;
}
module.exports={decodeRdb};
const {fromName}=require('./game-region.cjs');
function normalized(v){return path.basename(String(v)).replace(/\.(?:zip|7z|sfc|smc|fig|nes|gba|gbc?|nds|z64|n64|v64|sms|md|gen|smd|a26|a52|a78|bin|cue|chd|iso|cso|pbp|rvz|gcm|gcz|vpk|atr|st|msa|rom)$/i,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\([^)]*\)|\[[^\]]*\]/g,'').replace(/(?:\s*[- ]\s*(?:BG|PT-BR|nintendinho))+$/ig,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function value(v){if(Array.isArray(v))return v.filter(x=>typeof x==='string').join(' / ');return typeof v==='string'?v.trim():null}
function consensus(rows,key){const vals=[...new Set(rows.map(r=>key==='releaseyear'?String(r[key]||''):value(r[key])).filter(Boolean))];return vals.length===1?vals[0]:null}
function summarize(rows,source,match){const developer=consensus(rows,'developer'),publisher=consensus(rows,'publisher'),year=consensus(rows,'releaseyear');return {developer,publisher,company:developer||publisher,companyRole:developer?'developer':publisher?'publisher':null,year:/^\d{4}$/.test(year||'')?year:null,source,match}}
const databases=new Map(),answers=new Map();
async function database(file){const stat=await fs.stat(file),key=file+'|'+stat.size+'|'+stat.mtimeMs;if(databases.has(key))return databases.get(key);const promise=fs.readFile(file).then(b=>{const rows=decodeRdb(b).filter(r=>r.name&&(r.developer||r.publisher||r.releaseyear)).map(({name,developer,publisher,releaseyear,region,crc})=>({name,developer,publisher,releaseyear,region,crc:Buffer.isBuffer(crc)?crc.toString('hex'):null}));const names=new Map(),crcs=new Map();for(const r of rows){const n=normalized(r.name);if(!names.has(n))names.set(n,[]);names.get(n).push(r);if(r.crc){if(!crcs.has(r.crc))crcs.set(r.crc,[]);crcs.get(r.crc).push(r)}}return {names,crcs}});databases.set(key,promise);if(databases.size>8)databases.delete(databases.keys().next().value);try{return await promise}catch(e){databases.delete(key);throw e}}
async function zipIdentity(file,size){let fd;try{fd=await fs.open(file,'r');const tail=Buffer.alloc(Math.min(size,65557));await fd.read(tail,0,tail.length,size-tail.length);let e=-1;for(let i=tail.length-22;i>=0;i--)if(tail.readUInt32LE(i)===0x06054b50){e=i;break}if(e<0)return null;const length=tail.readUInt32LE(e+12),offset=tail.readUInt32LE(e+16);if(length>4*1024*1024||offset+length>size)return null;const dir=Buffer.alloc(length);await fd.read(dir,0,length,offset);let p=0,roms=[];while(p+46<=length&&dir.readUInt32LE(p)===0x02014b50){const n=dir.readUInt16LE(p+28),extra=dir.readUInt16LE(p+30),comment=dir.readUInt16LE(p+32),name=dir.subarray(p+46,p+46+n).toString('utf8');if(/\.(?:sfc|smc|fig|nes|gba|gbc?|nds|z64|n64|v64|sms|md|gen|a26|a52|a78|bin)$/i.test(name))roms.push({name,crc:dir.readUInt32LE(p+16).toString(16).padStart(8,'0')});p+=46+n+extra+comment}return roms.length===1?roms[0]:null}finally{if(fd)await fd.close()}}
function mameInfo(exe,set){return new Promise(resolve=>execFile(exe,['-listxml',set],{windowsHide:true,timeout:12000,maxBuffer:8*1024*1024},(error,xml)=>{if(error)return resolve({});const machine=/<machine\b[^>]*\bname="([^"]+)"[^>]*>([\s\S]*?)<\/machine>/.exec(xml);if(!machine||machine[1]!==set)return resolve({});const decode=s=>s?.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'")||null;const company=decode(/<manufacturer>([\s\S]*?)<\/manufacturer>/.exec(machine[2])?.[1]),year=/<year>([^<]+)<\/year>/.exec(machine[2])?.[1]||null;resolve({company,companyRole:'manufacturer',developer:null,publisher:null,year,source:'MAME',match:'set'})}));}
async function detect({rom,catalog,rdbRoot,mameExe}){
 try{const st=await fs.stat(rom);if(!st.isFile())return {};const key=rom+'|'+st.size+'|'+st.mtimeMs+'|'+catalog;if(answers.has(key))return answers.get(key);let result={};
 if(catalog==='MAME'){const set=path.parse(rom).name;if(/^[a-z0-9_]{1,32}$/i.test(set))result=await mameInfo(mameExe,set)}
 else if(catalog){const db=await database(path.join(rdbRoot,catalog+'.rdb'));const inner=/\.zip$/i.test(rom)?await zipIdentity(rom,st.size):null;let candidates=inner?db.crcs.get(inner.crc):null,match='crc';
 if(!candidates?.length){match='title';const names=[path.basename(rom),inner?.name,path.basename(path.dirname(rom))].filter(Boolean);for(const name of names){const found=db.names.get(normalized(name));if(!found)continue;const exact=found.filter(r=>r.name.toLowerCase()===path.parse(name).name.toLowerCase());candidates=exact.length?exact:found;const regions=fromName(name);if(regions.length){const regional=candidates.filter(r=>regions.some(region=>String(r.region||r.name).includes(region)));if(regional.length)candidates=regional}break}}
 if(candidates?.length)result=summarize(candidates,'Libretro · '+catalog,match);
 }
 if(answers.size>=1000)answers.delete(answers.keys().next().value);answers.set(key,result);return result;
 }catch{return {}}
}
module.exports={decodeRdb,detect,normalized,summarize};
