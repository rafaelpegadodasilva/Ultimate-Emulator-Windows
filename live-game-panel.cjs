"use strict";
const fs=require('fs'),path=require('path');
module.exports=function create(deps){
 const {BrowserWindow,ipcMain,globalShortcut,paths,getSession,readOptions,writeShader,shaderPath,shaderPresets,udp,log,focusGame}=deps;
 let win=null,session=null,selected=null,pending=Promise.resolve(),opening=false,shortcut=false,confirming=false;
 const valid=()=>session&&getSession()?.proc===session.proc&&session.proc.exitCode===null;
 function filters(){return session.kind==='mame'?require('./mame-live-filters.cjs').presets:[{value:'off',label:'Sem filtro'},...shaderPresets()];}
 function readFilter(s){return s.kind==='mame'?require('./mame-live-filters.cjs').saved(paths.database,s.set):(readOptions(s.system).shader||'off');}
 async function preview(value){
  if(!valid())return {ok:false,error:'O jogo foi encerrado ou trocado.'};
  if(!filters().some(p=>p.value===value))return {ok:false,error:'Filtro indisponível.'};
  let result;
  if(session.kind==='mame')result=await require('./mame-live-filters.cjs').apply(paths.database,session.set,value);
  else {
   let file=shaderPath(value);
   if(value==='off'){
    const folder=path.join(paths.database,'UserData','RetroArch','live-filters');fs.mkdirSync(folder,{recursive:true});
    file=path.join(folder,'no-filter.slangp');
    const stock=path.join(paths.frontends,'RetroArch','shaders','shaders_slang','stock.slang');
    fs.writeFileSync(file,'shaders = 1\nshader0 = "'+stock.replace(/\\/g,'/')+'"\nfilter_linear0 = false\nscale_type0 = source\nscale0 = 1.0\n');
   }
   result=(await udp('SET_SHADER '+file))==='SENT'?{ok:true}:{ok:false,error:'Não foi possível enviar o filtro.'};
  }
  if(result.ok){selected=value;log('LIVE_FILTER',session.kind+' '+value);}
  return result;
 }
 function queue(task){const run=pending.then(task);pending=run.catch(()=>{});return run;}
 async function confirm(){
  if(!win||win.isDestroyed()||confirming)return {ok:true};
  confirming=true;
  return queue(async()=>{
   if(!valid()){confirming=false;return {ok:false,error:'O jogo foi encerrado.'};}
   if(session.kind==='mame')require('./mame-live-filters.cjs').commit(paths.database,session.set,selected);
   else writeShader(session.system,selected);
   const current=win;win=null;session=null;current.close();confirming=false;focusGame();return {ok:true};
  });
 }
 function info(){
  if(!valid())return {ok:false,error:'Nenhum jogo compatível em execução.'};
  let g=session.game;
  if(session.kind==='mame')g=require('./mame-cheats.cjs').info(g);
  return {ok:true,title:session.title,kind:session.kind,systemFolder:session.kind==='retroarch'?session.system:null,selected,filters:filters(),reason:g?.reason||'',entries:(g?.entries||[]).map(e=>({index:e.index,name:e.name,enabled:!!e.enabled,actionable:!!e.actionable,parameter:e.parameter,oneshot:e.oneshot,value:e.value}))};
 }
 async function open(){
  if(win&&!win.isDestroyed()){win.show();win.focus();return {ok:true};}
  if(opening)return {ok:true};opening=true;
  try{
   session=getSession();if(!session)return {ok:false,error:'Abra um jogo RetroArch ou MAME.'};
   selected=readFilter(session);
   if(!filters().some(p=>p.value===selected))selected='off';
   const width=900,height=710;
   win=new BrowserWindow({width,height,minWidth:600,minHeight:450,title:'Filtros e cheats · '+session.title,frame:false,transparent:true,resizable:true,show:false,alwaysOnTop:true,skipTaskbar:true,backgroundColor:'#00000000',webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:false}});
   const current=win;confirming=false;current.setAlwaysOnTop(true,'screen-saver');
   current.webContents.on('did-fail-load',(_event,code,description,url)=>log('LIVE_PANEL_LOAD_ERROR',`code=${code} description=${description} url=${url}`));
   current.once('ready-to-show',()=>{if(!current.isDestroyed()){current.show();current.focus();}});
   current.on('closed',()=>{if(win===current){win=null;session=null;}focusGame();});
   await current.loadFile(path.join(__dirname,'renderer','live-game-panel.html'));return {ok:true};
  }catch(e){log('LIVE_PANEL_ERROR',String(e));return {ok:false,error:e.message};}finally{opening=false;}
 }
 async function toggle(){return win&&!win.isDestroyed()?confirm():open();}
 function stop(){confirming=false;if(win&&!win.isDestroyed())win.destroy();win=null;session=null;if(shortcut){globalShortcut.unregister('Control+K');shortcut=false;}}
 function bind(){if(shortcut)return;shortcut=globalShortcut.register('Control+K',()=>toggle().catch(e=>log('LIVE_PANEL_ERROR',String(e))));}
 function authorized(event){return win&&!win.isDestroyed()&&event.sender===win.webContents;}
 ipcMain.handle('ue-live-info',event=>authorized(event)?info():{ok:false,error:'Painel fechado.'});
 ipcMain.handle('ue-live-filter',(event,value)=>authorized(event)?queue(()=>preview(value)):{ok:false});
 ipcMain.handle('ue-live-confirm',event=>authorized(event)?confirm():{ok:false});
 ipcMain.handle('ue-live-cheat',(event,index,request)=>authorized(event)?queue(async()=>{
  if(!valid())return {ok:false,error:'O jogo foi trocado.'};
  const entry=session.game?.entries.find(e=>e.index===index);
  if(!Number.isInteger(index)||!entry)return {ok:false,error:'Cheat inválido para este jogo.'};
  if(session.kind==='mame')return require('./mame-cheats.cjs').toggle(session.game,index,request);
  return require('./ue159-cheats.cjs').toggle(session.game,index,typeof request==='object'?!!request.enabled:!!request,true);
 }):{ok:false});
 return {open,toggle,stop,bind};
};
