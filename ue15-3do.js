// Ultimate Emulator V15: Preflight of 3DO Opera firmware and disc images.
// No BIOS, ROM, save or user file is ever altered here.
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const validBios={
 'panafz10.bin':'51f2f43ae2f3508a14d9f56597e2d3ce',
 'panafz1.bin':'f47264dd47fe30f73ab3c010015c155b',
 'panafz10-norsa.bin':'1477bda80dc33731a65468c1f5bcbee9',
 'panafz10e-anvil.bin':'a48e6746bd7edec0f40cff078f0bb19f',
 'panafz10e-anvil-norsa.bin':'cf11bbb5a16d7af9875cca9de9a15e09',
 'panafz1j.bin':'a496cfdded3da562759be3561317b605',
 'panafz1j-norsa.bin':'f6c71de7470d16abe4f71b1444883dc8',
 'goldstar.bin':'8639fd5e549bd6238cfee79e3e749114',
 'sanyotry.bin':'35fa1a1ebaaeea286dc5cd15487c13ea',
 '3do_arcade_saot.bin':'8970fc987ab89a7f64da9f8a8c4333ff'
};
const ordering=['panafz10.bin','panafz1.bin',...Object.keys(validBios).filter(x=>!['panafz10.bin','panafz1.bin'].includes(x))];
function unique(arr){return [...new Set(arr.filter(Boolean).map(s=>path.resolve(s).toLowerCase()))];}
function biosDirs(roots){
 const dirs=[];
 for (const root of roots.filter(Boolean)) {
   for(const suffix of ['3DO/BIOS','3DO/Bios','3DO/ROMs/BIOS','BIOS/3DO',
        'BIOS','system','system/3do','RetroArch/system',
        'RetroArch/system/3do','Frontends/RetroArch/system',
        'Runtime/Frontends/RetroArch/system','3do','']) {
     dirs.push(path.resolve(root,suffix));
   }
 }
 const output=[];const seen=new Set();
 for(const d of dirs) {
   const key=process.platform==='win32'?d.toLowerCase():d;
   if(!seen.has(key)){seen.add(key);output.push(d);}
 }
 return output;
}
function locateBios(roots){
 const faulty=[];
 for(const folder of biosDirs(roots)){
   let entries;
   try{entries=fs.readdirSync(folder,{withFileTypes:true}).filter(e=>e.isFile());}catch(_){continue;}
   for(const requested of ordering){
     const found=entries.find(e=>e.name.toLowerCase()===requested);
     if(!found)continue;
     const file=path.join(folder,found.name);
     try{
       const st=fs.statSync(file);
       if(st.size<512*1024||st.size>2*1024*1024){faulty.push(file+' (tamanho invalido)');continue;}
       const digest=crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
       if(digest===validBios[requested]){
         const preference=({'panafz10.bin':'Panasonic FZ-10 (U)',
           'panafz1.bin':'Panasonic FZ-1 (U)',
           'panafz10e-anvil.bin':'Panasonic FZ-10 (E) ANVIL'})[requested]||null;
         return {ok:true,folder,file,name:requested,preference};
       }
       faulty.push(file+' (MD5 nao corresponde a BIOS conhecida)');
     }catch(e){faulty.push(file+' ('+e.message+')');}
   }
 }
 const extra=faulty.length?'\nArquivos de BIOS encontrados, mas invalidos:\n'+faulty.slice(0,4).join('\n'):'';
 return {ok:false,error:'3DO / Opera: BIOS ausente ou invalida. O emulador precisa de panafz10.bin ou panafz1.bin original (1 MB), dentro da pasta BIOS do 3DO ou na pasta system do RetroArch.'+extra};
}
function imageFile(romPath){
 if(!romPath || typeof romPath!=='string')return {ok:false,error:'Nenhum jogo 3DO selecionado.'};
 try{if(!fs.statSync(romPath).isFile())return {ok:false,error:'O caminho nao e um arquivo de jogo.'};}
 catch(_){return {ok:false,error:'Jogo 3DO nao encontrado: '+romPath};}
 let file=romPath;const ext=path.extname(file).toLowerCase();
 if(!['.bin','.cue','.chd','.iso'].includes(ext))return {ok:false,error:'O Opera aceita somente ISO, BIN, CUE ou CHD.'};
 if(ext==='.bin'){
   const alternative=path.join(path.dirname(file),path.basename(file,path.extname(file))+'.cue');
   try {if(fs.statSync(alternative).isFile())file=alternative;}catch(_){}
 }
 if(path.extname(file).toLowerCase()==='.cue') {
   let cue;
   try{cue=fs.readFileSync(file,'utf8');}catch(e){return {ok:false,error:'Nao foi possivel ler CUE: '+e.message};}
   const tracks=[...cue.matchAll(/^\s*FILE\s+(?:"([^"]+)"|(\S+))\s+\S+/gim)];
   if(!tracks.length)return {ok:false,error:'Arquivo CUE sem linhas FILE. Confira a imagem do disco.'};
   const missing=[];
   for(const match of tracks){
      const ref=(match[1]||match[2]);
      if(path.isAbsolute(ref)||ref.includes('..'))return {ok:false,error:'CUE com caminho de trilha invalido: '+ref};
      const dest=path.resolve(path.dirname(file),ref);
      try{if(!fs.statSync(dest).isFile())missing.push(ref);}catch(_){missing.push(ref);}
   }
   if(missing.length)return {ok:false,error:'CUE incompleto. Falta(m) trilha(s): '+missing.slice(0,5).join(', ')};
 } else {
   const bytes=fs.statSync(file).size;
   if(bytes<512*1024)return {ok:false,error:'Imagem do disco 3DO parece incompleta (menos de 512 KB): '+file};
 }
 return {ok:true,file};
}
function inspect({romPath,roots}){
 const rom=imageFile(romPath);if(!rom.ok)return rom;
 const bios=locateBios(roots);
 if(!bios.ok)return bios;
 return {ok:true,romPath:rom.file,biosDir:bios.folder,biosFile:bios.file,biosName:bios.name,preference:bios.preference};
}
module.exports={locateBios,imageFile,inspect};
