'use strict';
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
function updateIni(file,section,values){
 if(!fs.existsSync(file))return;
 const original=fs.readFileSync(file,'utf8');let active=false,seen=false;const lines=original.split(/\r?\n/),result=[];
 const emit=()=>{for(const [key,value] of Object.entries(values))result.push(`${key} = ${value}`)};
 for(const line of lines){const header=/^\s*\[([^\]]+)\]/.exec(line);if(header){if(active)emit();active=header[1]===section;seen=seen||active;}
  const key=/^\s*([^=]+?)\s*=/.exec(line)?.[1];if(active&&key&&Object.hasOwn(values,key))continue;result.push(line);
 }
 if(active)emit();if(!seen){result.push(`[${section}]`);emit()}
 const output=result.join('\r\n');if(output!==original)fs.writeFileSync(file,output,'utf8');
}
function mode(exe){const name=path.basename(exe).toLowerCase();if(name==='retroarch.exe')return 'retroarch';if(/^(?:pcsx2.*|duckstation.*|ppssppwindows.*|dolphin)\.exe$/.test(name))return 'native';return null;}
function configure(frontends,exe){
 const name=path.basename(exe).toLowerCase();
 if(name.startsWith('pcsx2'))updateIni(path.join(frontends,'PCSX2','inis','PCSX2.ini'),'Hotkeys',{SaveStateToSlot:'Keyboard/1',LoadStateFromSlot:'Keyboard/4'});
 if(name.startsWith('duckstation'))updateIni(path.join(frontends,'DuckStation','settings.ini'),'Hotkeys',{SaveGlobalState1:'',LoadGlobalState1:'',SaveSelectedSaveState:'Keyboard/1',LoadSelectedSaveState:'Keyboard/4'});
 if(name.startsWith('ppsspp'))updateIni(path.join(frontends,'PPSSPP','memstick','PSP','SYSTEM','controls.ini'),'ControlMapping',{'Save State':'1-8','Load State':'1-11'});
}
function start(frontends,proc,exe,log){
 const kind=mode(exe);if(!kind)return null;
 const helper=path.join(frontends,'..','StateHotkeys','StateHotkeys.exe');
 if(!fs.existsSync(helper)){log('STATE_HOTKEY_ERROR','StateHotkeys.exe missing');return null;}
 const child=spawn(helper,[path.join(frontends,'RetroArch'),String(proc.pid),kind],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.on('error',error=>log('STATE_HOTKEY_ERROR',String(error)));
 child.stdout.on('data',data=>log('STATE_INPUT',String(data).trim()));
 child.stderr.on('data',data=>log('STATE_HOTKEY_ERROR',String(data)));
 child.on('exit',code=>{if(code)log('STATE_HOTKEY_ERROR','helper code='+code)});
 proc.once('exit',()=>{if(child.exitCode===null)child.kill()});
 log('STATE_HOTKEYS','L3 saves; R3 loads on both controllers; target='+proc.pid);
 return child;
}
module.exports={updateIni,mode,configure,start};
