"use strict";
const fs=require('fs'),path=require('path');
module.exports=function create(paths){
 const file=path.join(paths.database,'component-locations.json');let state={cores:{},directories:{},issues:{}};try{state={...state,...JSON.parse(fs.readFileSync(file,'utf8'))}}catch{}
 function write(){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(state,null,2));}
 const key=dir=>path.relative(paths.root,path.resolve(dir)).replace(/\\/g,'/').toLowerCase();
 function directory(dir){return state.directories[key(dir)]||dir;}
 // Um registro de reparo pode vir de outro PC ou unidade. Se ele não existe
 // mais, o core que acompanha o pacote sempre tem prioridade sobre um caminho
 // antigo salvo nas preferências.
 function coreFile(name){
  const saved=state.cores[name];
  if(saved){try{if(fs.statSync(saved).isFile())return saved;}catch{}}
  return path.join(paths.cores,name);
 }
 function coreCheck(name){
  const full=coreFile(name);
  try{
   const stat=fs.statSync(full);if(!stat.isFile()||stat.size<1024)return {ok:false,reason:'Core ausente ou incompleto: '+name};
   const h=Buffer.alloc(64),fd=fs.openSync(full,'r');
   try{
    fs.readSync(fd,h,0,64,0);if(h.toString('ascii',0,2)!=='MZ')return {ok:false,reason:'Arquivo de core inválido: '+name};
    const offset=h.readUInt32LE(60),pe=Buffer.alloc(24);fs.readSync(fd,pe,0,24,offset);
    if(pe.readUInt32LE(0)!==0x4550||pe.readUInt16LE(4)!==0x8664)return {ok:false,reason:'O core precisa ser uma DLL Windows x64: '+name};
   }finally{fs.closeSync(fd);}
   const issue=state.issues[name];if(issue&&issue.mtime===stat.mtimeMs)return {ok:false,reason:issue.reason};
   return {ok:true,reason:'Core Windows x64 encontrado',path:full};
  }catch{return {ok:false,reason:'Core ausente: '+name};}
 }
 function setCore(name,full){
  if(!/^[a-z0-9_.-]+_libretro\.dll$/i.test(name)||path.basename(full).toLowerCase()!==name.toLowerCase())throw Error('Selecione a pasta com o core correto.');
  const previous=state.cores[name];state.cores[name]=full;delete state.issues[name];const result=coreCheck(name);
  if(!result.ok){if(previous)state.cores[name]=previous;else delete state.cores[name];throw Error(result.reason);}
  write();return result;
 }
 function setDirectory(original,selected){state.directories[key(original)]=selected;write();}
 function failed(name,reason){try{state.issues[name]={mtime:fs.statSync(coreFile(name)).mtimeMs,reason};write();}catch{}}
 return {directory,coreFile,coreCheck,setCore,setDirectory,failed};
};
