"use strict";
// RetroArch 1.19.1 Windows x64: silence only the index-next/index-previous
// notification calls. Cheat toggles, core application and RARCH_LOG acknowledgements
// are untouched. Source: libretro/RetroArch v1.19.1 cheat_manager.c index_next/prev.
const fs=require('fs'),crypto=require('crypto');
const original='738ca659d2360cedbc62bab7b53c6e9bb20c7d92dfe3de743fa4f3b1fa218e7b';
const patches=[{"offset": 1244263, "before": "e884e2edff"}, {"offset": 1244540, "before": "e86fe1edff"}];
function result(data){return crypto.createHash('sha256').update(data).digest('hex');}
function ensure(file){
 const data=fs.readFileSync(file),hash=result(data);
 const modified=Buffer.from(data);
 if(hash!==original){
  for(const p of patches){if(!data.subarray(p.offset,p.offset+5).equals(Buffer.alloc(5,0x90)))return {ok:false,reason:'Versão do RetroArch não reconhecida; arquivo preservado.'};Buffer.from(p.before,'hex').copy(modified,p.offset);}
  return result(modified)===original?{ok:true,alreadyApplied:true}:{ok:false,reason:'Executável diferente; arquivo preservado.'};
 }
 for(const p of patches)Buffer.alloc(5,0x90).copy(modified,p.offset);
 fs.writeFileSync(file,modified);return {ok:true,applied:true};
}
module.exports={ensure};
