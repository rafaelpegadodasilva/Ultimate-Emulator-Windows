'use strict';
// Ultimate Emulator V5: Independent P1/P2 keyboard and XInput profiles for MAME.
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');
const CONFIG_VERSION=5;
const FAMILIES=['generic','sf','mk'];
const ACTIONS=['up','down','left','right','b1','b2','b3','b4','b5','b6','coin','start'];
const KEY_CODES={
 up:'UP',down:'DOWN',left:'LEFT',right:'RIGHT',space:'SPACE',enter:'ENTER',tab:'TAB',
 lshift:'LSHIFT',rshift:'RSHIFT',lctrl:'LCONTROL',rctrl:'RCONTROL',lalt:'LALT',ralt:'RALT',
 backspace:'BACKSPACE',esc:'ESC',insert:'INSERT',delete:'DEL',home:'HOME',end:'END',
 pageup:'PGUP',pagedown:'PGDN',comma:'COMMA',period:'STOP',semicolon:'COLON',
 minus:'MINUS',equal:'EQUAL',slash:'SLASH',backslash:'BACKSLASH',
 f1:'F1',f2:'F2',f3:'F3',f4:'F4',f5:'F5',f6:'F6',f7:'F7',f8:'F8',f9:'F9',f10:'F10',f11:'F11',f12:'F12'
};
function family(setName){
 const n=String(setName||'').toLowerCase();
 if(/^(?:mk$|umk3|mk(?:\d|[a-z])|mkr|mkla|mktt|mkturbo)/.test(n))return 'mk';
 if(/^(?:sf2|ssf2|sfa|sfiii|sf3|sfex|sfz|sf|hsf2|hssf2)/.test(n))return 'sf';
 return 'generic';
}
function keyToken(v){
 const s=String(v||'').trim().toLowerCase();
 if(/^[a-z0-9]$/.test(s))return 'KEYCODE_'+s.toUpperCase();
 return KEY_CODES[s] ? 'KEYCODE_'+KEY_CODES[s] : null;
}
function padToken(v,player){
 const n=Number(player);
 const s=String(v||'').trim().toUpperCase();
 if(![1,2].includes(n))return null;
 if(/^B(?:[1-9]|1[0-6])$/.test(s))return `JOYCODE_${n}_BUTTON${s.slice(1)}`;
 if(s==='L2')return `JOYCODE_${n}_SLIDER1_NEG_SWITCH`;
 if(s==='R2')return `JOYCODE_${n}_SLIDER2_NEG_SWITCH`;
 if(s==='START')return `JOYCODE_${n}_START`;
 if(s==='SELECT')return `JOYCODE_${n}_SELECT`;
 if(/^(?:HAT1(?:UP|DOWN|LEFT|RIGHT)|[XY]AXIS_(?:UP|DOWN|LEFT|RIGHT)_SWITCH)$/.test(s))return `JOYCODE_${n}_${s}`;
 return null;
}
const KDEFAULT=[
 {up:'up',down:'down',left:'left',right:'right',b1:'z',b2:'x',b3:'a',b4:'s',b5:'q',b6:'w',coin:'5',start:'1'},
 {up:'i',down:'k',left:'j',right:'l',b1:'u',b2:'o',b3:'h',b4:'n',b5:'m',b6:'y',coin:'6',start:'2'}
];
function joystickDefaults(fam,p){
 const common={up:'HAT1UP',down:'HAT1DOWN',left:'HAT1LEFT',right:'HAT1RIGHT',coin:'SELECT',start:'START'};
 const face=fam==='mk'
  ? {b1:'B3',b2:'L2',b3:'B4',b4:'B1',b5:'B2',b6:'B6'}
  : fam==='sf'
    ? {b1:'B3',b2:'B4',b3:'B6',b4:'B1',b5:'B2',b6:'R2'}
    : {b1:'B1',b2:'B2',b3:'B3',b4:'B4',b5:'B5',b6:'B6'};
 return {...common,...face};
}
function defaults(){
 const controls={};
 for(const fam of FAMILIES){
  controls[fam]={keyboard:{'1':{...KDEFAULT[0]},'2':{...KDEFAULT[1]}},joystick:{'1':joystickDefaults(fam,1),'2':joystickDefaults(fam,2)}};
 }
 return {version:CONFIG_VERSION,controls};
}
function normalize(input){
 const output=defaults();
 if(!input || typeof input!=='object')return output;
 for(const f of FAMILIES)for(const kind of ['keyboard','joystick'])for(const player of ['1','2']){
  const source=input.controls?.[f]?.[kind]?.[player];
  if(!source||typeof source!=='object')continue;
  for(const act of ACTIONS){
   if(!Object.prototype.hasOwnProperty.call(source,act))continue;
   if(kind==='keyboard'&&keyToken(source[act]))output.controls[f][kind][player][act]=String(source[act]).toLowerCase();
   if(kind==='joystick'&&padToken(source[act],Number(player)))output.controls[f][kind][player][act]=String(source[act]).toUpperCase();
  }
 }
 return output;
}
function settingsFile(database){return path.join(database,'MAME-Ultimate','input-v5.json');}
function load(database){try{return normalize(JSON.parse(fs.readFileSync(settingsFile(database),'utf8')));}catch{return defaults();}}
function save(database,config){
 const sanitized=normalize(config),file=settingsFile(database);
 fs.mkdirSync(path.dirname(file),{recursive:true});
 const pending=file+'.pending';
 fs.writeFileSync(pending,JSON.stringify(sanitized,null,2),'utf8');
 fs.renameSync(pending,file);
 return sanitized;
}
function port(type,sequence){return `      <port type="${type}"><newseq type="standard">${sequence}</newseq></port>`;}
function sequence(config,fam,player,act){
 const keys=config.controls[fam].keyboard[String(player)];
 const pads=config.controls[fam].joystick[String(player)];
 const keyboard=keyToken(keys[act]);
 const joystick=padToken(pads[act],player);
 const extras=[];
 if(['up','down','left','right'].includes(act)){
  const suffix={up:'YAXIS_UP_SWITCH',down:'YAXIS_DOWN_SWITCH',left:'XAXIS_LEFT_SWITCH',right:'XAXIS_RIGHT_SWITCH'}[act];
  extras.push(`JOYCODE_${player}_${suffix}`);
 }
 // Keyboard and joystick are intentionally two independent mappings, joined only for MAME input.
 return [...new Set([keyboard,joystick,...extras].filter(Boolean))].join(' OR ');
}
function profileXML(config,fam){
 const c=normalize(config),ports=[
  port('UI_PAUSE','KEYCODE_P'),
  // Current request: L3 loads, R3 saves. These controls may request a save-state slot.
  port('UI_LOAD_STATE','JOYCODE_1_BUTTON9 OR KEYCODE_F7'),
  port('UI_SAVE_STATE','JOYCODE_1_BUTTON10 OR KEYCODE_F6'),
  port('UI_FAST_FORWARD','JOYCODE_1_BUTTON11 OR KEYCODE_INSERT')
 ];
 for(const player of [1,2]){
  for(const act of ['up','down','left','right'])ports.push(port(`P${player}_JOYSTICK_${act.toUpperCase()}`,sequence(c,fam,player,act)));
  for(let i=1;i<=6;i++)ports.push(port(`P${player}_BUTTON${i}`,sequence(c,fam,player,`b${i}`)));
  ports.push(port(`COIN${player}`,sequence(c,fam,player,'coin')));
  ports.push(port(`START${player}`,sequence(c,fam,player,'start')));
 }
 return `<?xml version="1.0" encoding="utf-8"?>\n<mameconfig version="10">\n  <system name="default">\n    <input>\n${ports.join('\n')}\n    </input>\n  </system>\n</mameconfig>\n`;
}
function ensureConfig(database){
 const cfg=load(database),directory=path.join(database,'MAME-Ultimate','ctrlr-v5');
 fs.mkdirSync(directory,{recursive:true});
 for(const fam of FAMILIES){
  const filename=path.join(directory,`ue_${fam}.cfg`),body=profileXML(cfg,fam);
  if(!fs.existsSync(filename)||fs.readFileSync(filename,'utf8')!==body)fs.writeFileSync(filename,body,'utf8');
 }
 return directory;
}
function vertical(exe,setName,cwd){
 if(!/^[a-z0-9_]{1,32}$/i.test(setName))return null;
 try{
  const xml=execFileSync(exe,['-listxml',setName],{cwd,timeout:9000,maxBuffer:3*1024*1024,windowsHide:true,encoding:'utf8'});
  const displays=[...xml.matchAll(/<display\b([^>]+)>?/gi)].map(m=>m[1]);
  if(!displays.length)return null;
  return displays.some(v=>{const m=/\brotate\s*=\s*["'](\d+)["']/i.exec(v);return m&&(Number(m[1])===90||Number(m[1])===270);});
 }catch{return null;}
}
function buildArgs({exe,setName,romPath,mameRoot,romsRoot,database}){
 if(!/^[a-z0-9_]{1,32}$/i.test(setName))throw new Error('Conjunto MAME invalido');
 const fam=family(setName),ctrlr=ensureConfig(database);
 const romPaths=[romPath?path.dirname(romPath):path.join(romsRoot,'Arcade - MAME','ROMs'),path.join(romsRoot,'Arcade - MAME','BIOS')];
 const cfg=path.join(database,'MAME-Ultimate','cfg-v5');fs.mkdirSync(cfg,{recursive:true});
 const args=['-window','-rompath',romPaths.join(';'),'-joystick','-joystickprovider','winhybrid','-ctrlrpath',ctrlr,'-ctrlr','ue_'+fam,'-cfg_directory',cfg];
 const isVertical=vertical(exe,setName,mameRoot);
 if(isVertical===false)args.push('-aspect','12:7','-nokeepaspect','-resolution','1440x840','-maximize');
 else if(isVertical===true)args.push('-keepaspect','-aspect','auto');
 args.push(setName);
 return {args,profile:fam,isVertical};
}
module.exports={family,defaults,normalize,load,save,profileXML,ensureConfig,vertical,buildArgs,keyToken,padToken};
