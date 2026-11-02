'use strict';
/* Ultimate Emulator: independent MAME input profiles. No changes to user's existing MAME cfg. */
const fs = require('fs');
const path = require('path');
const {execFileSync}=require('child_process');
const PROFILES={
  // Mortal Kombat arcade driver layout: 1 HP, 2 BLOCK, 3 HK, 4 LP, 5 LK, 6 RUN.
  // DualSense exposed by Windows/XInput: Square=B3, Cross=B1, Triangle=B4,
  // Circle=B2, L1=B5, R1=B6, Options=Start, Create=Select.
  mk: {1:3,2:5,3:4,4:1,5:2,6:6},
  // Street Fighter six-button Capcom layout: LP, MP, HP, LK, MK, HK.
  sf: {1:3,2:4,3:6,4:1,5:2,6:5},
  generic: null
};
function family(setName){
 const name=String(setName||'').toLowerCase();
 if(/^(?:mk$|umk3|mk(?:\d|[a-z])|mkr|mkla|mktt|mkturbo)/.test(name))return 'mk';
 if(/^(?:sf2|ssf2|sfa|sfiii|sf3|sfex|sfz|sf|hsf2|hssf2)/.test(name))return 'sf';
 return 'generic';
}
function port(name,seq){return `      <port type="${name}"><newseq type="standard">${seq}</newseq></port>`;}
function mkProfile(profile){
 const ports=[
  port('UI_SAVE_STATE','JOYCODE_1_BUTTON9 OR KEYCODE_F7 KEYCODE_LSHIFT'),
  port('UI_LOAD_STATE','JOYCODE_1_BUTTON10 OR KEYCODE_F7'),
  // Touchpad click is usually not forwarded by Parallels XInput. BUTTON11
  // provides the direct-MAME mapping only if Windows exposes that signal;
  // Insert is a guaranteed fallback. UI_FAST_FORWARD is momentary (hold).
  port('UI_FAST_FORWARD','JOYCODE_1_BUTTON11 OR KEYCODE_INSERT'),
  port('P1_JOYSTICK_UP','JOYCODE_1_HAT1UP OR JOYCODE_1_YAXIS_UP_SWITCH OR KEYCODE_UP'),
  port('P1_JOYSTICK_DOWN','JOYCODE_1_HAT1DOWN OR JOYCODE_1_YAXIS_DOWN_SWITCH OR KEYCODE_DOWN'),
  port('P1_JOYSTICK_LEFT','JOYCODE_1_HAT1LEFT OR JOYCODE_1_XAXIS_LEFT_SWITCH OR KEYCODE_LEFT'),
  port('P1_JOYSTICK_RIGHT','JOYCODE_1_HAT1RIGHT OR JOYCODE_1_XAXIS_RIGHT_SWITCH OR KEYCODE_RIGHT'),
  port('START1','JOYCODE_1_START OR KEYCODE_1'),
  port('COIN1','JOYCODE_1_SELECT OR KEYCODE_5')
 ];
 if(PROFILES[profile])for(let n=1;n<=6;n++)ports.push(port('P1_BUTTON'+n,`JOYCODE_1_BUTTON${PROFILES[profile][n]}`));
 return `<?xml version="1.0" encoding="utf-8"?>\n<mameconfig version="10">\n  <system name="default">\n    <input>\n${ports.join('\n')}\n    </input>\n  </system>\n</mameconfig>\n`;
}
function ensureConfig(root){
 const target=path.join(root,'MAME-Ultimate','ctrlr');
 fs.mkdirSync(target,{recursive:true});
 for(const f of Object.keys(PROFILES)){
  const dest=path.join(target,'ue_'+f+'.cfg'),content=mkProfile(f);
  if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==content)fs.writeFileSync(dest,content);
 }
 return target;
}
function vertical(exe,setName,cwd){
 // Verify actual driver display orientation, not a blacklist of guessed ROM names.
 const driver=String(setName||'');
 if(!/^[a-z0-9_]{1,32}$/i.test(driver))return null;
 try{
  const xml=execFileSync(exe,['-listxml',driver],{cwd,timeout:9000,maxBuffer:3*1024*1024,windowsHide:true,encoding:'utf8'});
  const displays=[...xml.matchAll(/<display\b([^>]+)>?/gi)].map(m=>m[1]);
  if(!displays.length)return null;
  const angles=displays.map(x=>/\brotate\s*=\s*["'](\d+)["']/i.exec(x)).map(x=>x?Number(x[1]):0);
  return angles.some(n=>n===90||n===270);
 }catch{return null;}
}
function buildArgs({exe,setName,romPath,mameRoot,romsRoot,database}){
 if(!/^[a-z0-9_]{1,32}$/i.test(setName))throw new Error('Nome de conjunto MAME invalido');
 const profile=family(setName),ctrlr=ensureConfig(database);
 const romPaths=[romPath?path.dirname(romPath):path.join(romsRoot,'Arcade - MAME','ROMs'),path.join(romsRoot,'Arcade - MAME','BIOS')];
 const args=['-window','-rompath',romPaths.join(';'),'-joystick','-joystickprovider','winhybrid',
  '-ctrlrpath',ctrlr,'-ctrlr','ue_'+profile];
 // Dedicated configs: user's existing MAME cfg files are not changed/removed.
 const cfg=path.join(database,'MAME-Ultimate','cfg');fs.mkdirSync(cfg,{recursive:true});
 args.push('-cfg_directory',cfg);
 const isVertical=vertical(exe,setName,mameRoot);
 if(isVertical===false){
   // 12:7 only for confirmed horizontal games. MAME can still be resized.
   args.push('-aspect','12:7','-nokeepaspect','-resolution','1440x840','-maximize');
 } else if(isVertical===true){args.push('-keepaspect','-aspect','auto');}
 args.push(setName);
 return {args,profile,isVertical};
}
module.exports={PROFILES,family,port,mkProfile,ensureConfig,vertical,buildArgs};
