"use strict";
const fs=require('fs'),path=require('path');
module.exports=function create(database){
 const file=path.join(database,'controller-preferences.json');
 function read(){try{const value=JSON.parse(fs.readFileSync(file,'utf8'));return {rumble:value.rumble!==false};}catch{return {rumble:true};}}
 function setRumble(enabled){if(typeof enabled!=='boolean')throw Error('Opção de vibração inválida.');const value={...read(),rumble:enabled};fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2));return value;}
 function config(){const enabled=read().rumble;return {input_rumble_gain:enabled?'100':'0',enable_device_vibration:enabled?'true':'false'};}
 return {read,setRumble,config};
};
