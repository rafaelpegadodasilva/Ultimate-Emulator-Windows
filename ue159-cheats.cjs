'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib'),dgram=require('dgram'),{EventEmitter}=require('events');
const catalogs={'Atari 2600':'Atari - 2600','Atari 8-bit':'Atari - 8-bit Family','Atari 5200':'Atari - 5200','Atari 7800':'Atari - 7800','Atari ST':'Atari - ST','Super Nintendo':'Nintendo - Super Nintendo Entertainment System','Nintendo 8 Bits':'Nintendo - Nintendo Entertainment System','Nintendo 64':'Nintendo - Nintendo 64','GameBoy':'Nintendo - Game Boy','GameBoyColor':'Nintendo - Game Boy Color','GameBoyAdvance':'Nintendo - Game Boy Advance','NintendoDS':'Nintendo - Nintendo DS','Master System':'Sega - Master System - Mark III','Mega Drive':'Sega - Mega Drive - Genesis','Mega Drive 32X':'Sega - 32X','Sega CD':'Sega - Mega-CD - Sega CD','Sega Saturn':'Sega - Saturn','Dreamcast':'Sega - Dreamcast','PlayStation Portable':'Sony - PlayStation Portable','3DO':'The 3DO Company - 3DO'};
const names=require('./core-identities.json');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const read=(p,d)=>{try{return JSON.parse(fs.readFileSync(p,'utf8'));}catch{return d;}};
function write(p,v){fs.mkdirSync(path.dirname(p),{recursive:true});const t=p+'.new';fs.writeFileSync(t,JSON.stringify(v,null,2));fs.renameSync(t,p);}
function regions(value){const s=String(value);const out=new Set();for(const m of s.matchAll(/\(([^)]*)\)|\[([^\]]*)\]/g)){for(const t of (m[1]||m[2]).split(/[,/]/).map(x=>x.trim().toLowerCase())){const r={usa:'USA',us:'USA',u:'USA',europe:'Europe',eur:'Europe',e:'Europe',japan:'Japan',jpn:'Japan',j:'Japan',world:'World',w:'World',brazil:'Brazil',brasil:'Brazil',b:'Brazil',korea:'Korea',k:'Korea',australia:'Australia',a:'Australia',germany:'Germany',g:'Germany',france:'France',f:'France',spain:'Spain',s:'Spain',italy:'Italy',i:'Italy'}[t];if(r)out.add(r);}}
 return [...out].sort();}
function revision(value){const s=String(value);let m=/\((?:rev(?:ision)?\s*|v(?:ersion)?\s*)([a-z0-9]+(?:\.\d+)*)\)/i.exec(s);return m?m[1].toLowerCase():'base';}
function title(value){return path.parse(String(value)).name.replace(/(?:[- ](?:nintendinho|nintendnho|ninitendinho|nintedinho)|[- ]BG)+$/ig,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\([^)]*\)|\[[^\]]*\]/g,'').replace(/_/g,' ').toLowerCase().replace(/^\d{3,5}\s+/,'').replace(/[^a-z0-9]+/g,' ').trim();}
function readHeader(rom){
 const stat=fs.statSync(rom);let file=path.basename(rom),ext=path.extname(rom).toLowerCase(),data=null,inner=null,size=stat.size,ambiguous=false;
 if(ext==='.zip'&&stat.size<64*1024*1024){
  const b=fs.readFileSync(rom);let end=-1;
  for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(b.readUInt32LE(i)===0x06054b50){end=i;break;}
  if(end>=0){let p=b.readUInt32LE(end+16),choices=[];
   for(let i=0;i<b.readUInt16LE(end+10)&&p+46<b.length;i++){
    if(b.readUInt32LE(p)!==0x02014b50)break;
    const len=b.readUInt16LE(p+28),extra=b.readUInt16LE(p+30),comment=b.readUInt16LE(p+32),name=b.subarray(p+46,p+46+len).toString('utf8');
    if(/\.(sfc|smc|gba|gb|gbc|nds|nes|z64|n64|v64|md|bin|a26|a78|a52|rom)$/i.test(name))choices.push({name,size:b.readUInt32LE(p+24),compressed:b.readUInt32LE(p+20),method:b.readUInt16LE(p+10),offset:b.readUInt32LE(p+42)});
    p+=46+len+extra+comment;
   }
   ambiguous=choices.length>1;
   if(choices.length===1){const entry=choices[0];inner=path.basename(entry.name);ext=path.extname(inner).toLowerCase();size=entry.size;
    if(entry.size<=32*1024*1024){const begin=entry.offset+30+b.readUInt16LE(entry.offset+26)+b.readUInt16LE(entry.offset+28),raw=b.subarray(begin,begin+entry.compressed);data=(entry.method===8?zlib.inflateRawSync(raw,{maxOutputLength:32*1024*1024}):raw).subarray(0,0x10200);}
   }
  }
 }else{const fd=fs.openSync(rom,'r');data=Buffer.alloc(0x10200);try{const n=fs.readSync(fd,data,0,data.length,0);data=data.subarray(0,n);}finally{fs.closeSync(fd);}}
 return {file,ext,data,inner,size,ambiguous};
}
function romIdentity(rom){let file=path.basename(rom),r=regions(file),source='filename',h,ext=path.extname(rom).toLowerCase(),size=0,inner=null,archiveConflict=false;
 try{const loaded=readHeader(rom);h=loaded.data;ext=loaded.ext;size=loaded.size;inner=loaded.inner;archiveConflict=loaded.ambiguous;const innerRegions=regions(inner||'');archiveConflict=archiveConflict||(r.length&&innerRegions.length&&!r.some(x=>innerRegions.includes(x))); if(!r.length&&innerRegions.length){r=innerRegions;source='filename inside ZIP';}}catch{}
 let header=[],headerRevision=null;
 if(h){
  if(ext==='.gba'&&h.length>0xaf){const code=String.fromCharCode(h[0xaf]);const v={E:'USA',P:'Europe',J:'Japan',D:'Germany',F:'France',I:'Italy',S:'Spain',K:'Korea'}[code];if(v)header=[v];if(h.length>0xbc)headerRevision=h[0xbc];}
  if(ext==='.nds'&&h.length>15){const v={E:'USA',P:'Europe',J:'Japan',D:'Germany',F:'France',I:'Italy',S:'Spain',K:'Korea'}[String.fromCharCode(h[15])];if(v)header=[v];}
  if(ext==='.z64'&&h.length>0x3e){const v={E:'USA',P:'Europe',J:'Japan',D:'Germany',F:'France',I:'Italy',S:'Spain',U:'Australia'}[String.fromCharCode(h[0x3e])];if(v)header=[v];}
  if(['.sfc','.smc'].includes(ext)){const shift=size%1024===512?512:0;let candidates=[];for(const off of [0x7fc0,0xffc0]){if(off+shift+32>h.length)continue;const o=off+shift,check=h.readUInt16LE(o+28),inv=h.readUInt16LE(o+30);if((check^inv)===65535&&check!==0){const v={0:'Japan',1:'USA',2:'Europe',3:'Sweden',6:'France',7:'Netherlands',8:'Spain',9:'Germany',10:'Italy',11:'China',12:'Indonesia',13:'Korea'}[h[o+25]];if(v){candidates.push(v);headerRevision=h[o+27];}}}if(new Set(candidates).size===1)header=[candidates[0]];}
 }
 if(h&&['.md','.bin'].includes(ext)&&h.length>0x200&&h.subarray(0x100,0x110).toString().includes('SEGA')){const tag=h.subarray(0x1f0,0x200).toString().trim();const values=[];if(/U|USA/i.test(tag))values.push('USA');if(/E|EUR/i.test(tag))values.push('Europe');if(/J|JAP/i.test(tag))values.push('Japan');if(values.length)header=values;}
 const conflict=archiveConflict||(r.length&&header.length&&!r.includes(header[0])&&!r.includes('World'));if(!r.length&&header.length){r=header;source='ROM header';}
 const namedRevision=revision(inner||file);const rev=namedRevision==='base'&&headerRevision>0?String(headerRevision):namedRevision;const revisionConflict=headerRevision!==null&&/^\d+$/.test(namedRevision)&&Number(namedRevision)!==headerRevision;
 return {title:title(inner||file),regions:r,revision:rev,source,inner,conflict:!!conflict||revisionConflict,modified:/\b(hack|beta|proto|prototype|unl|translation|traducao|pt-br)\b|\[(?:h\d*|b\d*|f\d*|t[-+])/i.test(file+' '+(inner||''))};
}
let zipCache=null;
function zipIndex(file){if(zipCache?.file===file)return zipCache;const b=fs.readFileSync(file);let e=-1;for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(b.readUInt32LE(i)===0x06054b50){e=i;break;}if(e<0)throw Error('Invalid cheat catalog');let o=b.readUInt32LE(e+16);const map=new Map();for(let n=0;n<b.readUInt16LE(e+10);n++){if(b.readUInt32LE(o)!==0x02014b50)throw Error('Invalid ZIP directory');const len=b.readUInt16LE(o+28),extra=b.readUInt16LE(o+30),comment=b.readUInt16LE(o+32);const name=b.subarray(o+46,o+46+len).toString('utf8');map.set(name,{method:b.readUInt16LE(o+10),size:b.readUInt32LE(o+24),compressed:b.readUInt32LE(o+20),offset:b.readUInt32LE(o+42)});o+=46+len+extra+comment;}zipCache={file,b,map};return zipCache;}
function sourceFiles(system,frontends,database){const cat=catalogs[system];if(!cat)return [];const customFolder=path.join(database,'Cheats','Custom',cat);const custom=fs.existsSync(customFolder)?fs.readdirSync(customFolder).filter(x=>/\.cht$/i.test(x)).map(name=>({name,read:()=>fs.readFileSync(path.join(customFolder,name),'utf8')})):[];const zip=path.join(database,'Cheats','libretro-cheats.zip');if(fs.existsSync(zip)){const z=zipIndex(zip);return custom.concat([...z.map.keys()].filter(x=>x.startsWith(cat+'/')&&/\.cht$/i.test(x)).map(name=>({name:path.basename(name),read(){const e=z.map.get(name);if(e.size>2*1024*1024)throw Error('Cheat file too large');const o=e.offset,begin=o+30+z.b.readUInt16LE(o+26)+z.b.readUInt16LE(o+28),raw=z.b.subarray(begin,begin+e.compressed);return (e.method===8?zlib.inflateRawSync(raw,{maxOutputLength:2*1024*1024}):raw).toString('utf8');}})));}
 const folder=path.join(frontends,'RetroArch','cheats',cat);if(!fs.existsSync(folder))return custom;return custom.concat(fs.readdirSync(folder).filter(x=>/\.cht$/i.test(x)).map(name=>({name,read:()=>fs.readFileSync(path.join(folder,name),'utf8')})));}
function compatible(rom,candidate){if(rom.conflict||rom.modified)return false;if(/\b(beta|proto|prototype|hack|translation|traducao)\b|\[(?:h\d*|b\d*|t[-+])/i.test(candidate))return false;if(title(candidate)!==rom.title||revision(candidate)!==rom.revision)return false;if(/\brumbles\b/i.test(candidate))return false;const r=regions(candidate);if(!r.length)return true;return !!r.includes('World')&&rom.regions.length>0||rom.regions.length>0&&rom.regions.every(x=>r.includes(x));}
function parse(text){const m=new Map();for(const line of text.split(/\r?\n/)){const x=/^\s*cheat(\d+)_([a-z0-9_]+)\s*=\s*(?:"((?:\\.|[^"])*)"|([^#\r\n]*))/i.exec(line);if(!x)continue;const index=Number(x[1]);if(index>10000)continue;if(!m.has(index))m.set(index,{});m.get(index)[x[2]]=x[3]===undefined?x[4].trim():x[3].replace(/\\"/g,'"');}return [...m].sort((a,b)=>a[0]-b[0]).map(x=>x[1]);}
function friendly(s,i){s=String(s||'').replace(/_/g,' ').replace(/\bP([12])\b/g,'Player $1').replace(/\bInf\.?\s/ig,'Infinite ').replace(/\bMax\.?\s/ig,'Maximum ').replace(/\bHP\b/g,'Health').replace(/\bMP\b/g,'Magic Points').replace(/\s+/g,' ').trim();const translations=[[/vida infinita/ig,'Infinite Health'],[/muni[cç][aã]o infinita/ig,'Infinite Ammo'],[/vidas infinitas/ig,'Infinite Lives'],[/tempo infinito/ig,'Infinite Time'],[/invencibilidade/ig,'Invincibility']];for(const [r,v] of translations)s=s.replace(r,v);return s||'Cheat '+(i+1);}
function prepare(rom,system,frontends,database,corePath){const identity=romIdentity(rom);const id=hash(system+'|'+identity.title+'|'+identity.regions.join(',')+'|'+identity.revision).slice(0,24);const core=names[path.basename(corePath||'')];const folder=path.join(database,'UserData','Cheats',id);const stateFile=path.join(folder,'selection.json');const selected=read(stateFile,{});const sources=sourceFiles(system,frontends,database).filter(x=>compatible(identity,x.name)).sort((a,b)=>a.name.localeCompare(b.name));const seen=new Set(),entries=[];
 for(const source of sources)for(const fields of parse(source.read())){const codeFields={...fields};delete codeFields.desc;delete codeFields.enable;const key=hash(JSON.stringify(Object.entries(codeFields).sort()));if(seen.has(key))continue;seen.add(key);const index=entries.length;const actionable=!!fields.code||fields.address!==undefined;entries.push({index,key,name:friendly(fields.desc,index),original:fields.desc||'',source:source.name,fields,actionable,enabled:actionable&&selected[key]===true});}
 const game={rom,system,id,identity,core,corePath,folder,stateFile,entries,sources:sources.map(x=>x.name),cursor:0,loaded:false,events:new EventEmitter(),observed:new Map(),reason:identity.conflict?'ROM edition metadata is conflicting or the archive is ambiguous.':identity.modified?'Modified ROM: no automatic cheat match.':!identity.regions.length?'Region could not be determined.':!sources.length?'No cheats match this title, region and revision.':!core?'Core name is unknown.':'',root:path.join(folder,'runtime')};
 if(core&&entries.length){game.target=path.join(game.root,core,path.parse(rom).name+'.cht');fs.mkdirSync(path.dirname(game.target),{recursive:true});let lines=['cheats = '+entries.length];for(const e of entries){for(const [k,v] of Object.entries(e.fields)){if(k==='enable')continue;lines.push(`cheat${e.index}_${k} = "${String(v).replace(/"/g,'\\"')}"`);}lines.push(`cheat${e.index}_enable = "${e.enabled?'true':'false'}"`);}fs.writeFileSync(game.target,lines.join('\n')+'\n');game.targets=[game.target];if(identity.inner){const innerTarget=path.join(game.root,core,path.parse(identity.inner).name+'.cht');if(innerTarget!==game.target){fs.writeFileSync(innerTarget,lines.join('\n')+'\n');game.targets.push(innerTarget);}}}
 return game;
}
function observe(game,chunk){if(!game)return;game.logBuffer=(game.logBuffer||'')+chunk;let i;while((i=game.logBuffer.indexOf('\n'))>=0){const line=game.logBuffer.slice(0,i);game.logBuffer=game.logBuffer.slice(i+1);if(line.includes('Load game-specific cheatfile:')&&game.target&&(game.targets||[game.target]).some(target=>line.replace(/\\/g,'/').toLowerCase().includes(target.replace(/\\/g,'/').toLowerCase()))){game.loaded=true;game.events.emit('loaded');}const m=/Cheat:\s*#(\d+)\s*\[([^\]]+)\]/.exec(line);if(m){const index=Number(m[1]);game.cursor=index;const val=/^(?:on|ligado|ativado|enabled)$/i.test(m[2]);const off=/^(?:off|desligado|desativado|disabled)$/i.test(m[2]);if(val||off)game.observed.set(index,val);game.events.emit('ack',{index,state:val||off?val:null,line});}}if(game.logBuffer.length>16384)game.logBuffer='';}
function udp(command,reply=false){return new Promise(resolve=>{const s=dgram.createSocket('udp4');let done=false;const timer=setTimeout(()=>finish(null),1300);function finish(v){if(done)return;done=true;clearTimeout(timer);try{s.close();}catch{}resolve(v);}s.on('error',()=>finish(null));if(reply)s.once('message',m=>finish(m.toString()));s.send(Buffer.from(command+'\n'),55355,'127.0.0.1',e=>{if(e)finish(null);else if(!reply)finish('SENT');});});}
function commandAck(game,cmd){return new Promise(async resolve=>{const timer=setTimeout(()=>end(null),1800);const cb=x=>end(x);function end(x){clearTimeout(timer);game.events.removeListener('ack',cb);resolve(x);}await new Promise(r=>setTimeout(r,80));game.events.once('ack',cb);if(await udp(cmd)!=='SENT')end(null);});}
function persist(game){const chosen={};for(const e of game.entries)chosen[e.key]=e.enabled;write(game.stateFile,chosen);if(game.target){let text=fs.readFileSync(game.target,'utf8');text=text.replace(/^\s*cheat\d+_enable\s*=.*(?:\r?\n|$)/gm,'');for(const e of game.entries)text+=`cheat${e.index}_enable = "${e.enabled?'true':'false'}"\n`;for(const target of game.targets||[game.target])fs.writeFileSync(target,text);}}
// UE159_FAST_SELECTED_CHEAT_V1
async function toggle(game,index,enabled,live=false){
 const e=game.entries[index];
 if(!e||!e.actionable)return {ok:false,error:'This entry is informational.'};
 enabled=!!enabled;
 if(live){
  const status=await udp('GET_STATUS',true);
  if(!status||!/^GET_STATUS\s+(PLAYING|PAUSED)/i.test(status))return {ok:false,error:'RetroArch is still starting or is not responding. Try again.'};
  if(!game.loaded)return {ok:false,error:'RetroArch did not confirm loading this game cheat file. Restart the game.'};
  const n=game.entries.length;
  if(!n)return {ok:false,error:'No cheats are loaded.'};
  const startIndex=Number.isInteger(game.cursor)?((game.cursor%n)+n)%n:0;
  let ack={index:startIndex,state:game.observed.has(startIndex)?game.observed.get(startIndex):null};
  const forward=((index-ack.index)%n+n)%n;
  const backward=((ack.index-index)%n+n)%n;
  const command=forward<=backward?'CHEAT_INDEX_PLUS':'CHEAT_INDEX_MINUS';
  const steps=Math.min(forward,backward);
  if(steps>0){
   // NetCMD hotkeys are edge bits, not an input queue. Sending multiple
   // increments in one frame collapses them into one selection change.
   // Wait for the actual cursor acknowledgement before advancing again.
   for(let step=0;step<steps;step++){
    game.progress='Selecionando cheat '+(step+1)+'/'+steps+'…';
    const expected=(ack.index+(command==='CHEAT_INDEX_PLUS'?1:n-1))%n;
    const next=await commandAck(game,command);
    if(!next||next.index!==expected){game.progress='';return {ok:false,error:'RetroArch não confirmou a seleção do cheat. Tente novamente.'};}
    ack=next;
   }
  }
  let currentState=ack.state;
  if(currentState!==true&&currentState!==false){
   currentState=game.observed.has(index)?game.observed.get(index):e.enabled;
  }
  if(currentState!==enabled){
   const toggled=await commandAck(game,'CHEAT_TOGGLE');
   if(!toggled||toggled.index!==index||toggled.state!==enabled)return {ok:false,error:'RetroArch did not confirm this change.'};
  }
 }
 game.progress='';
 e.enabled=enabled;
 persist(game);
 return {ok:true,enabled,live,message:live?'RetroArch confirmed the cheat '+(enabled?'enabled.':'disabled.'):'Saved. Applied automatically on the next launch of this game.'};
}
async function disableAll(game,live=false){
 const enabled=game.entries.filter(e=>e.actionable&&e.enabled).map(e=>e.index);
 let disabled=0;
 for(const index of enabled){
  const result=await toggle(game,index,false,live);
  if(!result.ok)return {...result,disabled};
  disabled++;
 }
 for(const entry of game.entries)if(entry.actionable)entry.enabled=false;
 persist(game);
 return {ok:true,enabled:false,disabled,live,message:live?'Todos os cheats foram desativados no RetroArch.':'Todos os cheats foram desativados para a próxima abertura.'};
}
module.exports={catalogs,regions,revision,title,romIdentity,compatible,parse,friendly,prepare,observe,udp,toggle,disableAll,persist,sourceFiles,readHeader};
