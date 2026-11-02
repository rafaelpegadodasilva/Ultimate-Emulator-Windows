'use strict';
// Ultimate Emulator V5: Independent P1/P2 keyboard and XInput profiles for MAME.
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');
const CONFIG_VERSION=22;
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
 // Universal arcade keyboard defaults requested for Player 1.
 {up:'w',down:'s',left:'a',right:'d',b1:'y',b2:'u',b3:'i',b4:'h',b5:'j',b6:'k',coin:'9',start:'0'},
 // Player 2 keyboard gameplay stays unbound; coin/start are retained below.
 {up:'NONE',down:'NONE',left:'NONE',right:'NONE',b1:'NONE',b2:'NONE',b3:'NONE',b4:'NONE',b5:'NONE',b6:'NONE',coin:'comma',start:'period'}
];
function joystickDefaults(fam,p){
 // DualSense Share/Select is intercepted by macOS/Parallels as a host capture
 // shortcut.  MAME must receive the physical Options button for a coin instead.
 const common={up:'HAT1UP',down:'HAT1DOWN',left:'HAT1LEFT',right:'HAT1RIGHT',coin:'B10',start:'START'};
 const face=fam==='mk'
  ? {b1:'B3',b2:'B5',b3:'B4',b4:'B1',b5:'B2',b6:'B6'}
  : fam==='sf'
    ? {b1:'B3',b2:'B4',b3:'B5',b4:'B1',b5:'B2',b6:'B6'}
    : {b1:'B3',b2:'B4',b3:'B5',b4:'B1',b5:'B2',b6:'B6'};
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
   if(source[act]==='NONE'){output.controls[f][kind][player][act]='NONE';continue;}
   if(kind==='keyboard'&&keyToken(source[act])){
    const value=String(source[act]).toLowerCase();
    // Automatically migrate only untouched older P1 defaults; custom bindings stay intact.
    const old={up:'up',down:'down',left:'left',right:'right',b1:'z',b2:'x',b3:'a',b4:'s',b5:'q',b6:'w',coin:'5',start:'1'};
    output.controls[f][kind][player][act]=(player==='1' && Number(input.version||0)<18 && value===old[act]) ? KDEFAULT[0][act] : value;
   }
   if(kind==='joystick'&&padToken(source[act],Number(player))){
    let val=String(source[act]).toUpperCase();
    // Explicit V9 request: MK guard uses L1 (B5), not the old L2 trigger.
    if(f==='mk' && act==='b2' && val==='L2')val='B5';
    // Migrate ONLY the former Street Fighter preset, never a personalized button.
    if(f==='sf' && Number(input.version||5)<=5 && ((act==='b3'&&val==='B6') || (act==='b6'&&val==='R2'))) {
      val=act==='b3'?'B5':'B6';
    }
    output.controls[f][kind][player][act]=val;
   }
  }
 }
 // One-time migration: P2 old factory keys conflict with P1. Preserve later edits.
 if(Number(input.version||0)<19){
  const oldP2={up:'i',down:'k',left:'j',right:'l',b1:'u',b2:'o',b3:'h',b4:'n',b5:'m',b6:'y',coin:'6',start:'2'};
  for(const f of FAMILIES){
   if(ACTIONS.every(a=>input.controls?.[f]?.keyboard?.['2']?.[a]===oldP2[a]))output.controls[f].keyboard['2']={...KDEFAULT[1]};
  }
  // Seed the universal arcade preset from the personalized SF profile, independently cloned.
  for(const kind of ['keyboard','joystick'])for(const p of ['1','2'])output.controls.generic[kind][p]={...output.controls.sf[kind][p]};
 }
 // Apply the requested coin/start keys once; preserve all other bindings.
 if(Number(input.version||0)<20){
  for(const f of FAMILIES){
   Object.assign(output.controls[f].keyboard['1'],{coin:'9',start:'0'});
   Object.assign(output.controls[f].keyboard['2'],{coin:'comma',start:'period'});
  }
 }
 // MAME keyboard layout: P1 uses the requested WASD + six-button arcade
 // cluster. P2 keyboard gameplay is intentionally left unbound so it can be
 // configured manually later; coin/start remain available for joining.
 if(Number(input.version||0)<21){
  for(const f of FAMILIES){
   output.controls[f].keyboard['1']={...output.controls[f].keyboard['1'],...KDEFAULT[0]};
   output.controls[f].keyboard['2']={up:'NONE',down:'NONE',left:'NONE',right:'NONE',b1:'NONE',b2:'NONE',b3:'NONE',b4:'NONE',b5:'NONE',b6:'NONE',coin:'comma',start:'period'};
  }
 }
 // The previous coin mapping used JOYCODE_*_SELECT.  On DualSense routed
 // through Parallels that is Share and opens macOS screen recording.  Move the
 // stock profile to raw Options (button 10), retaining deliberate custom maps.
 if(Number(input.version||0)<22){
  for(const f of FAMILIES)for(const player of ['1','2']){
   if(output.controls[f].joystick[player].coin==='SELECT')output.controls[f].joystick[player].coin='B10';
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
 if(pads[act]!=='NONE'&&['up','down','left','right'].includes(act)){
  const suffix={up:'YAXIS_UP_SWITCH',down:'YAXIS_DOWN_SWITCH',left:'XAXIS_LEFT_SWITCH',right:'XAXIS_RIGHT_SWITCH'}[act];
  extras.push(`JOYCODE_${player}_${suffix}`);
 }
 // Keyboard and joystick are intentionally two independent mappings, joined only for MAME input.
 return [...new Set([keyboard,joystick,...extras].filter(Boolean))].join(' OR ')||'NONE';
}
function profileXML(config,fam){
 const c=normalize(config),ports=[
  port('UI_PAUSE','KEYCODE_P'),
  // Ultimate Emulator owns state actions so MAME never opens its native
  // selector. StateInput forwards 1/4, 7/8 and L3/R3 to the thumbnail window.
  port('UI_LOAD_STATE','NONE'),
  port('UI_SAVE_STATE','NONE'),
  port('UI_FAST_FORWARD','KEYCODE_INSERT')
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
// V8: L3 detected by the MAME input DEVICE ITEM NAME, never by an assumed button number.
// V7 hard-coded BUTTON7 for L3; on this Parallels/DualSense setup it triggers on L2.
// Do not remap game buttons or R3. Do not show calibration prompts or overlays.
function luaLiteral(v) { return JSON.stringify(String(v).replace(/\\/g,'/')); }
function ensureLua(database,setName) {
 const directory=path.join(database,'MAME-Ultimate');
 fs.mkdirSync(directory,{recursive:true});
 const stateCommands=path.join(directory,'state-commands',setName);
 fs.mkdirSync(stateCommands,{recursive:true});
 const luaFile=path.join(directory,'quick-state-v7.lua');
 const statePrefix=setName+'/ue_slot_';
 const body=`-- Ultimate Emulator: state commands come from the thumbnail manager.
local machine=manager.machine
local input=machine.input
local lfs=require('lfs')
local state_command_dir=${luaLiteral(stateCommands)}
local state_prefix=${luaLiteral(statePrefix)}
-- StateInput forwards keyboard 1/4 and DualSense/Xbox L3/R3 to Electron.
-- Electron selects a numbered slot and drops a command here. Keeping MAME's
-- UI bindings disabled prevents its own state dialog from appearing.
local function state_commands()
  local ok,names=pcall(function()
    local items={}
    for name in lfs.dir(state_command_dir) do
      if name:match('%.cmd$') then table.insert(items,name) end
    end
    table.sort(items)
    return items
  end)
  if not ok or not names then return end
  for _,name in ipairs(names) do
    local full=state_command_dir..'/'..name
    local f=io.open(full,'rb')
    local command=f and f:read('*a') or ''
    if f then f:close() end
    os.remove(full)
    local action,slot=command:match('^(SAVE)%s+(%d+)%s*$')
    if not action then action,slot=command:match('^(LOAD)%s+(%d+)%s*$') end
    slot=tonumber(slot)
    if action and slot and slot>=0 and slot<15 then
      if action=='SAVE' then
        machine:save(state_prefix..slot)
        pcall(function() machine.video:snapshot() end)
      else machine:load(state_prefix..slot) end
    elseif command:match('^PAUSE%s*$') then
      emu.pause()
    elseif command:match('^RESUME%s*$') then
      emu.unpause()
    end
  end
end
-- V18: re-read the control profile twice a second, live.
-- This never changes MAME save/load bindings or the controls of another system.
local live_path=${luaLiteral('not-used')}
local ack_path=${luaLiteral('not-used-ack')}
local live_last=nil
local live_devices=nil
local live_frames=0
local function live_update()
  local f=io.open(live_path,'rb')
  if not f then return end
  local data=f:read('*a')
  f:close()
  local device_list={}
  local joyclass=manager.machine.input.device_classes.joystick
  if joyclass then for k,dev in pairs(joyclass.devices) do device_list[#device_list+1]=tostring(k)..':'..tostring(dev.name) end end
  table.sort(device_list)
  local device_signature=table.concat(device_list,'|')
  if data==live_last and device_signature==live_devices then return end
  local ok,err=pcall(function()
    local changes={}
    for line in string.gmatch(data,'[^\\r\\n]+') do
      local tag,tokens=string.match(line,'^([^\\t]+)\\t(.+)$')
      if tag and tokens then changes[tag]=tokens end
    end
    local ports=manager.machine.ioport
    for tag,tokens in pairs(changes) do
      local type_id,player=ports:token_to_input_type(tag)
      if type_id then
        local seq=input:seq_from_tokens(tokens)
        if seq and not seq.is_valid then
          -- Missing / disconnected joystick must not also disable WASD.
          seq=input:seq_clean(seq)
        end
        if seq and seq.is_valid then
          ports:set_type_seq(type_id,player,'standard',seq)
          -- Some arcade drivers have per-game overrides: update the live fields too.
          for _,port in pairs(ports.ports) do
            for _,field in pairs(port.fields) do
              if field.type==type_id and field.player==player then
                pcall(function() field:set_input_seq('standard',seq) end)
              end
            end
          end
        end
      end
    end
  end)
  if ok then
    live_last=data
    live_devices=device_signature
    local status=io.open(ack_path,'wb')
    if status then status:write(data);status:close() end
  else emu.print_warning('Ultimate Emulator: live control update failed: '..tostring(err)) end
end
emu.register_frame_done(function()
  state_commands()
  live_frames=live_frames+1
  if live_frames>=30 then live_frames=0;live_update() end
end)
`;
 // Substitute the actual per-game file path into the Lua source.
 const patched=(body+require('./mame-cheats.cjs').bridge(database,setName)+require('./mame-session-turbo.cjs').bridge(database,setName)+require('./mame-live-filters.cjs').bridge(database,setName))
  .replace('local live_path="not-used"', 'local live_path='+luaLiteral(liveFilename(database,setName)))
  .replace('local ack_path="not-used-ack"', 'local ack_path='+luaLiteral(ackFilename(database,setName)));
 if(!fs.existsSync(luaFile)||fs.readFileSync(luaFile,'utf8')!==patched)
   fs.writeFileSync(luaFile,patched,'utf8');
 return luaFile;
}
function resetHotkeys(database) {
 const directory=path.join(database,'MAME-Ultimate');
 for(const name of ['dualsense-l3r3-v6.txt','quick-state-v6.lua']){
   const file=path.join(directory,name);
   if(fs.existsSync(file))fs.unlinkSync(file);
 }
 return true;
}
function buildArgs({exe,setName,romPath,mameRoot,romsRoot,database}){
 if(!/^[a-z0-9_]{1,32}$/i.test(setName))throw new Error('Conjunto MAME invalido');
 const fam=family(setName),ctrlr=ensureConfig(database);
 const romPaths=[romPath?path.dirname(romPath):path.join(romsRoot,'Arcade - MAME','ROMs'),path.join(romsRoot,'Arcade - MAME','BIOS')];
 const cfg=path.join(database,'MAME-Ultimate','cfg-v5');fs.mkdirSync(cfg,{recursive:true});
 const states=path.join(database,'MAME-Ultimate','states');fs.mkdirSync(states,{recursive:true});
 const snapshots=path.join(database,'MAME-Ultimate','state-snapshots');fs.mkdirSync(snapshots,{recursive:true});
 const script=ensureLua(database,setName);
 const cheatFiles=require('./mame-cheats.cjs').files(database,setName);
 for(const file of [cheatFiles.state,cheatFiles.command])try{fs.unlinkSync(file)}catch{}
 try{fs.unlinkSync(ackFilename(database,setName));}catch(_){}
 updateLive(database,setName);
 // Force maximized windows even if the -listxml orientation probe failed.
 // -resolution 1440x840 previously constrained the maximum window size.
 // MAME runs with a writable AppData working directory.  Its plug-ins remain
 // in the portable runtime, so pass this path explicitly; otherwise MAME
 // searches AppData/plugins and aborts with “Could not load plugin: cheat”.
 const args=['-plugins','-plugin','cheat','-pluginspath',path.join(mameRoot,'plugins'),'-window','-maximize','-resolution','auto','-rompath',romPaths.join(';'),'-joystick','-joystickprovider','winhybrid','-background_input','-cheat','-ctrlrpath',ctrlr,'-ctrlr','ue_'+fam,'-cfg_directory',cfg,'-state_directory',states,'-snapshot_directory',snapshots,'-autoboot_script',script];
 // A local MAME cheat database (XML or cheat.7z) is optional.
 const cheats=[path.join(mameRoot,'cheat'),mameRoot,path.join(path.dirname(mameRoot),'Cheats'),path.join(path.dirname(mameRoot),'Cheats','MAME')];
 const found=cheats.filter(p=>fs.existsSync(p) && fs.statSync(p).isDirectory());
 if(found.length)args.push('-cheatpath',found.join(';'));
 const isVertical=vertical(exe,setName,mameRoot);
 if(isVertical===false || (isVertical===null && (fam==='sf'||fam==='mk')))args.push('-aspect','12:7','-nokeepaspect');
 else args.push('-keepaspect','-aspect','auto');
 args.push(setName);
 return {args,profile:fam,isVertical};
}

// V18: the MAME Lua autoboot script watches this file. Runtime profiles are
// updated inside MAME without restarting and without replacing joystick mappings.
function ackFilename(database,setName){
 if(!/^[a-z0-9_]{1,32}$/i.test(setName))throw new Error('MAME set invalido');
 return path.join(database,'MAME-Ultimate','live-ack-'+setName+'.txt');
}
function liveFilename(database,setName){
 if(!/^[a-z0-9_]{1,32}$/i.test(setName))throw new Error('MAME set invalido');
 return path.join(database,'MAME-Ultimate','live-'+setName+'.txt');
}
function liveLines(config,fam){
 const c=normalize(config),lines=[];
 for(const p of [1,2]){
  for(const action of ['up','down','left','right'])
   lines.push(`P${p}_JOYSTICK_${action.toUpperCase()}\t${sequence(c,fam,p,action)}`);
  for(let i=1;i<=6;i++)lines.push(`P${p}_BUTTON${i}\t${sequence(c,fam,p,'b'+i)}`);
  lines.push(`COIN${p}\t${sequence(c,fam,p,'coin')}`);
  lines.push(`START${p}\t${sequence(c,fam,p,'start')}`);
 }
 return lines.join('\n')+'\n';
}
function updateLive(database,setName){
 if(!setName) return null;
 const target=liveFilename(database,setName);
 const text=liveLines(load(database),family(setName));
 fs.mkdirSync(path.dirname(target),{recursive:true});
 const stage=target+'.pending';
 fs.writeFileSync(stage,text,'utf8');
 try{fs.renameSync(stage,target);}catch(err){
  // Windows can prevent replacing an opened file; Lua releases the handle immediately.
  if(fs.existsSync(target))fs.unlinkSync(target);
  fs.renameSync(stage,target);
 }
 return target;
}

function liveStatus(database,setName){
 const sent=liveFilename(database,setName),ack=ackFilename(database,setName);
 try{
  const source=fs.readFileSync(sent,'utf8');
  const applied=fs.readFileSync(ack,'utf8');
  return {running:true,applied:source===applied};
 }catch{return {running:true,applied:false};}
}
module.exports={family,defaults,normalize,load,save,profileXML,ensureConfig,vertical,buildArgs,keyToken,padToken,ensureLua,resetHotkeys,updateLive,liveFilename,liveLines,liveStatus};
