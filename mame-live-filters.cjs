"use strict";
const fs=require('fs'),path=require('path');
const presets=[{value:'off',label:'Sem filtro'},{value:'crt',label:'CRT · linhas'},{value:'lcd',label:'LCD · grade'},{value:'contrast',label:'Contraste realçado'}];
function files(database,set){if(!/^[a-z0-9_]{1,32}$/i.test(set))throw Error('Jogo MAME inválido');const root=path.join(database,'MAME-Ultimate','live-filters');fs.mkdirSync(root,{recursive:true});return {command:path.join(root,set+'.command.json'),ack:path.join(root,set+'.ack.json'),saved:path.join(root,set+'.json')};}
function read(file,fallback){try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return fallback;}}
function saved(database,set){const v=read(files(database,set).saved,{}).filter;return presets.some(p=>p.value===v)?v:'off';}
function command(database,set,filter){if(!presets.some(p=>p.value===filter))throw Error('Filtro inválido');const seq=Date.now()+'-'+Math.random().toString(16).slice(2);fs.writeFileSync(files(database,set).command,JSON.stringify({seq,filter}));return seq;}
function begin(database,set){command(database,set,saved(database,set));}
async function apply(database,set,filter){const seq=command(database,set,filter),f=files(database,set);for(let n=0;n<35;n++){await new Promise(r=>setTimeout(r,100));const ack=read(f.ack,{});if(ack.seq===seq)return ack.error?{ok:false,error:ack.error}:{ok:true};}return {ok:false,error:'O MAME não confirmou o filtro. Aguarde o jogo iniciar.'};}
function commit(database,set,filter){fs.writeFileSync(files(database,set).saved,JSON.stringify({filter}));}
function bridge(database,set){const f=files(database,set),lit=x=>JSON.stringify(x.replace(/\\/g,'/'));return `
-- Live image effects, isolated from controls and save states.
local ue_fx_command=${lit(f.command)}
local ue_fx_ack=${lit(f.ack)}
local ue_fx_json=require('json')
local ue_fx_seq=nil
local ue_fx_filter='off'
local ue_fx_original={}
local ue_fx_tick=0
emu.register_frame_done(function()
 ue_fx_tick=ue_fx_tick+1
 if ue_fx_tick%6==1 then
  local file=io.open(ue_fx_command,'rb')
  if file then
   local text=file:read('*a');file:close()
   local valid,cmd=pcall(ue_fx_json.parse,text)
   if valid and cmd and cmd.seq~=ue_fx_seq then
    local ok,err=pcall(function()
     assert(cmd.filter=='off' or cmd.filter=='crt' or cmd.filter=='lcd' or cmd.filter=='contrast','Invalid filter')
     for tag,scr in pairs(manager.machine.screens) do
      local settings=scr.container.user_settings
      if not ue_fx_original[tag] then ue_fx_original[tag]={brightness=settings.brightness,contrast=settings.contrast,gamma=settings.gamma} end
      local original=ue_fx_original[tag]
      settings.brightness=original.brightness
      settings.contrast=cmd.filter=='contrast' and original.contrast*1.18 or original.contrast
      settings.gamma=original.gamma
      scr.container.user_settings=settings
     end
     ue_fx_filter=cmd.filter
    end)
    ue_fx_seq=cmd.seq
    local out=io.open(ue_fx_ack,'wb')
    if out then out:write(ue_fx_json.stringify({seq=cmd.seq,filter=ue_fx_filter,error=not ok and tostring(err) or nil}));out:close() end
   end
  end
 end
 if ue_fx_filter=='crt' or ue_fx_filter=='lcd' then
  for _,scr in pairs(manager.machine.screens) do
   local w,h=scr.width,scr.height
   for y=0,h-1,2 do scr:draw_line(0,y,w-1,y,0x50000000) end
   if ue_fx_filter=='lcd' then for x=0,w-1,3 do scr:draw_line(x,0,x,h-1,0x35000000) end end
  end
 end
end)
`;}
module.exports={presets,files,saved,begin,apply,commit,bridge};
