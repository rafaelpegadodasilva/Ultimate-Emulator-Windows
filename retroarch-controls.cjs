'use strict';
const digital={b:'0',a:'1',y:'2',x:'3',select:'4',start:'6',l:'9',r:'10',up:'11',down:'12',left:'13',right:'14',l3:'nul',r3:'nul'};
const analog={l2:'+4',r2:'+5',l_x_minus:'-0',l_x_plus:'+0',l_y_minus:'-1',l_y_plus:'+1',r_x_minus:'-2',r_x_plus:'+2',r_y_minus:'-3',r_y_plus:'+3'};
const actions=new Set([...Object.keys(digital),...Object.keys(analog)]);
function normalize(opt={}){
 const result=JSON.parse(JSON.stringify(opt));
 const legacy=opt.bindingFormat!=='sdl2-standard-v1'&&['auto','xinput'].includes(opt.driver||'auto');
 const xinput={0:'0',1:'1',2:'2',3:'3',4:'9',5:'10',6:'6',7:'4',8:'7',9:'8',10:'5'};
 const hats={h0up:'11',h0down:'12',h0left:'13',h0right:'14'};
 for(const field of ['buttons','buttonsP2']){
  result[field]={...result[field]};
  for(const [action,button] of Object.entries(result[field])){
   if(hats[button])result[field][action]=hats[button];
   else if(legacy&&button!=='nul'&&xinput[button]!==undefined)result[field][action]=xinput[button];
  }
 }
 result.driver='sdl2';result.bindingFormat='sdl2-standard-v1';return result;
}
function resolve(payload={}){
 if(payload.standard!==true)return {ok:false,error:'Este controle não fornece o mapeamento padrão do Windows. Use o automático ou configure no RetroArch.'};
 if(Number.isInteger(payload.axis)&&payload.axis>=0&&payload.axis<4&&[1,-1].includes(payload.sign))return {ok:true,kind:'axis',value:(payload.sign>0?'+':'-')+payload.axis,profile:'SDL2 · controle padrão'};
 const map=['0','1','2','3','9','10','+4','+5','4','6','7','8','11','12','13','14','5','20'];
 const value=map[payload.button];
 if(!Number.isInteger(payload.button)||!value)return {ok:false,error:'Botão não reconhecido.'};
 if([10,11,16,17].includes(payload.button))return {ok:false,error:'L3, R3, PS/Guide e touchpad são reservados para os atalhos do emulador.'};
 return {ok:true,kind:/^[+-]/.test(value)?'axis':'button',value,profile:'SDL2 · controle padrão'};
}
function apply(lines,opt={},folder=''){
 const values={input_joypad_driver:'sdl2'};
 for(const player of [1,2]){
  const suffix=player===1?'':'P2',buttons=opt['buttons'+suffix]||{},axes=opt['axes'+suffix]||{},keys={...require('./keyboard-defaults.cjs').keys(folder,player),...(opt['keys'+suffix]||{})};
  const baseButtons={...digital};
  if(folder==='Nintendo 8 Bits')Object.assign(baseButtons,{a:'0',b:'1',x:'nul',y:'nul'});
  for(const action of actions){
   const prefix=`input_player${player}_${action}`;
   values[prefix+'_btn']=baseButtons[action]??'nul';values[prefix+'_axis']=analog[action]??'nul';
   const button=buttons[action],axis=axes[action];
   if(typeof button==='string'&&/^(?:nul|\d{1,3})$/.test(button)){values[prefix+'_btn']=button;values[prefix+'_axis']='nul';}
   if(typeof axis==='string'&&/^(?:nul|[+-]\d{1,2})$/.test(axis)){values[prefix+'_axis']=axis;if(axis!=='nul')values[prefix+'_btn']='nul';}
   if(typeof keys[action]==='string'&&/^[a-z0-9_]{1,12}$/.test(keys[action]))values[prefix]=keys[action];
  }
 }
 const managed=new Set(Object.keys(values));
 return lines.filter(line=>!managed.has(/^\s*(\w+)\s*=/.exec(line)?.[1])).concat(Object.entries(values).map(([k,v])=>`${k} = "${v}"`));
}
module.exports={apply,resolve,normalize};
