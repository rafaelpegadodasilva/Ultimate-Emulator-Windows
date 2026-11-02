'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const sessions=new Map();
function files(database,set){if(!/^[a-z0-9_]{1,32}$/i.test(set))throw Error('Jogo MAME inválido');const root=path.join(database,'MAME-Ultimate');return {data:path.join(root,'turbo-'+set+'.txt'),ack:path.join(root,'turbo-ack-'+set+'.txt')};}
function write(database,set,s){const f=files(database,set);fs.mkdirSync(path.dirname(f.data),{recursive:true});const text=[s.nonce,...s.bindings.map(b=>`${b.player}\t${b.action}\t${b.token}`)].join('\n')+'\n';fs.writeFileSync(f.data,text,'utf8');return text;}
function begin(database,set){const s={nonce:crypto.randomBytes(12).toString('hex'),bindings:[]};sessions.set(set,s);write(database,set,s);return s.nonce;}
function end(database,set){const s=sessions.get(set);if(s){s.bindings=[];write(database,set,s);sessions.delete(set);}}
function configure(database,set,request,mame){
 const s=sessions.get(set);if(!s)throw Error('Abra um jogo MAME antes de configurar o turbo.');
 if(request.clear===true)s.bindings=[];
 else {
  const player=Number(request.player),action=String(request.action||'');
  if(![1,2].includes(player)||!/^b[1-6]$/.test(action))throw Error('Selecione um botão de ação do jogador.');
  const token=request.mode==='keyboard'?mame.keyToken(request.code):request.mode==='joystick'?mame.padToken(request.code,player):null;
  if(!token||/KEYCODE_(?:ESC|TAB|P|F[1-9]|F1[0-2])$/.test(token)||/^B(?:7|8|11|12)$/i.test(String(request.code)))throw Error('Escolha um botão de ação livre, sem usar atalhos do emulador.');
  s.bindings=s.bindings.filter(b=>!(b.player===player&&b.action===action));s.bindings.push({player,action,token,mode:request.mode,code:request.code});
 }
 s.nonce=crypto.randomBytes(12).toString('hex');write(database,set,s);return status(database,set);
}
function status(database,set){const s=sessions.get(set);if(!s)return {running:false,bindings:[]};let ack='';try{ack=fs.readFileSync(files(database,set).ack,'utf8')}catch{}
 const parts=ack.trim().split('\n');return {running:true,bindings:s.bindings,applied:parts[0]===s.nonce&&Number(parts[1])===s.bindings.length,controllers:Number(parts[2])||0,pulses:Number(parts[3])||0,error:parts[4]||''};}
function bridge(database,set){const f=files(database,set);const literal=v=>JSON.stringify(v.replace(/\\/g,'/'));
return `
-- Session-only autofire: never writes persistent control or plugin settings.
local ue_turbo_path=${literal(f.data)}
local ue_turbo_ack=${literal(f.ack)}
local ue_turbo_nonce=nil
local ue_turbo_text=nil
local ue_turbo_buttons={}
local ue_turbo_frames=0
local ue_turbo_pulses=0
local function ue_turbo_release()
 for _,b in ipairs(ue_turbo_buttons) do for _,field in ipairs(b.fields) do pcall(function() field:clear_value() end) end end
 ue_turbo_buttons={}
end
local function ue_turbo_update()
 local file=io.open(ue_turbo_path,'rb');if not file then return end
 local text=file:read('*a');file:close()
 if text==ue_turbo_text then return end
 local nonce=string.match(text,'^([^\\r\\n]+)')
 local pending={}
 for p,a,tokens in string.gmatch(text,'[\\r\\n](%d+)\\t(b%d)\\t([^\\r\\n]+)') do
  local player=tonumber(p);local number=tonumber(string.sub(a,2))
  local typ,portplayer=machine.ioport:token_to_input_type('P'..p..'_BUTTON'..number)
  local seq=input:seq_from_tokens(tokens)
  local fields={}
  if typ and seq and seq.is_valid then
   for _,port in pairs(machine.ioport.ports) do for _,field in pairs(port.fields) do if field.type==typ and field.player==portplayer then table.insert(fields,field) end end end
   if #fields>0 then table.insert(pending,{fields=fields,seq=seq,counter=0,held=false}) end
  end
 end
 ue_turbo_release();ue_turbo_buttons=pending;ue_turbo_text=text;ue_turbo_nonce=nonce
end
local function ue_turbo_report()
 local devices=input.device_classes['joystick'];local count=0
 if devices then for _,device in pairs(devices.devices) do count=count+1 end end
 local f=io.open(ue_turbo_ack,'wb')
 if f then f:write((ue_turbo_nonce or '')..'\\n'..#ue_turbo_buttons..'\\n'..count..'\\n'..ue_turbo_pulses..'\\n');f:close() end
end
_G.ue_turbo_frame_subscription=emu.add_machine_frame_notifier(function()
 ue_turbo_frames=ue_turbo_frames+1
 if ue_turbo_frames%6==1 then local ok,err=pcall(ue_turbo_update);if not ok then emu.print_warning('UE turbo: '..tostring(err)) end end
 for _,b in ipairs(ue_turbo_buttons) do
  local held=input:seq_pressed(b.seq)
  if held then
   local value=b.counter%2==0 and 1 or 0
   for _,field in ipairs(b.fields) do field:set_value(value) end
   b.counter=b.counter+1;b.held=true;ue_turbo_pulses=ue_turbo_pulses+1
  elseif b.held then for _,field in ipairs(b.fields) do field:clear_value() end;b.counter=0;b.held=false end
 end
 if ue_turbo_frames%30==0 then ue_turbo_report() end
end)
`;
}
module.exports={begin,end,configure,status,bridge};
