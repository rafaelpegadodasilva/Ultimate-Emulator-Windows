"use strict";
const fs=require('fs'),path=require('path');
const pending=new Map();
const allowed=new Set(['b','a','y','x','l','r','l2','r2']);
function read(folder){return JSON.parse(JSON.stringify(pending.get(folder)||{'1':{},'2':{}}));}
function set(folder,request){const state=read(folder);const p=String(request.player);if(!['1','2'].includes(p)||!['keyboard','joystick'].includes(request.mode))throw Error('Jogador ou entrada inválida');if(request.action&&!allowed.has(request.action))throw Error('Escolha um botão de ação');state[p][request.mode]=request.action||'';pending.set(folder,state);return read(folder);}
function clear(folder){pending.delete(folder);}
function build(database,folder,options,base){
 const selected=read(folder),lines=['config_save_on_exit = "false"','input_turbo_mode = "0"','input_turbo_period = "2"','input_turbo_duty_cycle = "1"','input_allow_turbo_dpad = "false"'];
 const value=k=>{const matches=base.filter(l=>new RegExp('^\\s*'+k+'\\s*=').test(l));return matches.length?matches.at(-1).split('=')[1].trim().replace(/^"|"$/g,''):'nul'};
 for(const p of [1,2]){
  const prefix='input_player'+p+'_',choice=selected[String(p)];
  lines.push(`${prefix}turbo = "${choice.keyboard?value(prefix+choice.keyboard):'nul'}"`);
  for(const kind of ['btn','axis'])lines.push(`${prefix}turbo_${kind} = "${choice.joystick?value(prefix+choice.joystick+'_'+kind):'nul'}"`);
 }
 const dir=path.join(database,'UserData','RetroArchSessions');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'turbo-session.cfg');fs.writeFileSync(file,lines.join('\n')+'\n');clear(folder);return file;
}
module.exports={read,set,clear,build};
