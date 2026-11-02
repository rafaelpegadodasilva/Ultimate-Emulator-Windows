'use strict';
const fs=require('fs'),path=require('path');
const {updateIni}=require('./state-hotkeys.cjs');
function configure(frontends,roms,exe,mutableRoot){
 const name=path.basename(exe).toLowerCase();
 if(name.startsWith('pcsx2')){
  const folder=path.join(roms,'PlayStation 2','BIOS');
   // PCSX2 must never write its INI beside the bundled executable. That
   // directory can be protected by Windows Controlled Folder Access.
   const cfgRoot=path.join(mutableRoot||process.env.LOCALAPPDATA||frontends,'PCSX2');
   const ini=path.join(cfgRoot,'inis','PCSX2.ini');
   fs.mkdirSync(path.dirname(ini),{recursive:true});
   if(!fs.existsSync(ini)){
    const bundled=path.join(frontends,'PCSX2','inis','PCSX2.ini');
    if(fs.existsSync(bundled))fs.copyFileSync(bundled,ini);
    else fs.writeFileSync(ini,'[Folders]\r\n','utf8');
   }
  updateIni(ini,'Folders',{Bios:folder});
  const current=/^BIOS\s*=\s*(.*?)\s*$/m.exec(fs.readFileSync(ini,'utf8'))?.[1];
  if(!current||!fs.existsSync(path.join(folder,path.basename(current)))){
   let candidates=[];try{candidates=fs.readdirSync(folder).filter(n=>/\.bin$/i.test(n)&&fs.statSync(path.join(folder,n)).size>=4*1024*1024).sort()}catch{}
   if(candidates.length)updateIni(ini,'Filenames',{BIOS:candidates[0]});
  }
 }
 if(name.startsWith('duckstation')){
  const userDir=path.join(mutableRoot||process.env.LOCALAPPDATA||frontends,'DuckStation');
  fs.mkdirSync(userDir,{recursive:true});
  const ini=path.join(userDir,'settings.ini');
  if(!fs.existsSync(ini))fs.writeFileSync(ini,'[BIOS]\r\n','utf8');
  updateIni(ini,'BIOS',{SearchDirectory:path.join(roms,'PlayStation 1','BIOS')});
 }
}
module.exports={configure};
