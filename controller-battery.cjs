"use strict";
const {execFile}=require('child_process'),fs=require('fs'),path=require('path');
let cached={controllers:[],connected:false},until=0,pending=null;
function helperPaths(){
 const roots=[];if(process.resourcesPath)roots.push(path.resolve(process.resourcesPath,'..'));roots.push(path.resolve(__dirname,'..'),path.resolve(__dirname,'../..'));
 return roots.map(root=>({exe:path.join(root,'Runtime','StateInput','StateInput.exe'),dll:path.join(root,'Runtime','Frontends','RetroArch')})).filter(x=>fs.existsSync(x.exe)&&fs.existsSync(x.dll));
}
function readSdl(){
 const target=helperPaths()[0];if(!target)return Promise.resolve(null);
 return new Promise(resolve=>execFile(target.exe,[target.dll,'--battery'],{windowsHide:true,timeout:5000,maxBuffer:32768},(error,stdout)=>{
  if(error)return resolve(null);try{const value=JSON.parse(String(stdout||''));const controllers=(value.controllers||[]).filter(x=>x&&Number.isInteger(x.percent)&&x.percent>=0&&x.percent<=100);resolve({connected:!!value.connected,controllers});}catch{resolve(null);}
 }));
}
function read(database,force=false){
 if(force){until=0;if(pending)return pending.then(()=>read(database,true));}
 if(Date.now()<until)return Promise.resolve(cached);if(pending)return pending;
 const text=fs.readFileSync(path.join(__dirname,'controller-battery.ps1'),'utf8');
 pending=readSdl().then(sdl=>new Promise(resolve=>{
  if(sdl&&sdl.controllers.length){cached=sdl;until=Date.now()+5000;pending=null;return resolve(cached);}
  execFile('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-WindowStyle','Hidden','-Command',text],{windowsHide:true,timeout:10000,maxBuffer:128000},(error,stdout)=>{
   cached={controllers:[],connected:!!sdl?.connected};
   try{if(!error){const parsed=JSON.parse(stdout);cached={connected:!!parsed.connected||cached.connected,controllers:(parsed.controllers||[]).filter(x=>x&&Number.isInteger(x.percent)&&x.percent>=0&&x.percent<=100).map(x=>({...x,index:Number(x.index)}))};}}catch{}
   until=Date.now()+5000;pending=null;resolve(cached);
  });
 }));return pending;
}
module.exports={read};
