"use strict";
const fs=require('fs'),path=require('path');let cached=null;
function clean(text){return String(text).split(/\r?\n/).filter(line=>!/^\s*input_(?:menu_toggle|desktop_menu_toggle)(?:_btn|_axis|_mbtn|_gamepad_combo|_btn_label)?\s*=/.test(line)).join('\n')+'\n';}
function prepare(frontends,database){
 const source=path.join(frontends,'RetroArch','autoconfig'),target=path.join(database,'UserData','RetroArch','autoconfig-gameplay');
 if(cached===target)return target;
 fs.mkdirSync(target,{recursive:true});const stamp=path.join(target,'version.json');let old={};try{old=JSON.parse(fs.readFileSync(stamp,'utf8'))}catch{}
 if(old.source===source&&old.version===1){cached=target;return target;}
 let count=0;
 function walk(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const full=path.join(folder,entry.name);if(entry.isDirectory())walk(full);else if(entry.isFile()&&/\.cfg$/i.test(entry.name)){const dest=path.join(target,path.relative(source,full));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,clean(fs.readFileSync(full,'utf8')));count++;}}}
 walk(source);fs.writeFileSync(stamp,JSON.stringify({version:1,source,count}));cached=target;return target;
}
module.exports={clean,prepare};
