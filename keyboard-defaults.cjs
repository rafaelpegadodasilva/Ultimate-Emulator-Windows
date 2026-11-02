'use strict';
function keys(folder,player=1){
 if(player===2){
  const out={up:'up',down:'down',left:'left',right:'right',a:'n',b:'v',x:'c',y:'z',l:'b',r:'m',l2:'comma',r2:'slash',start:'o',select:'l'};
  if(folder==='Nintendo 64')Object.assign(out,{up:'home',down:'end',left:'delete',right:'pagedown',b:'z',y:'m',a:'nul',x:'nul',l_x_minus:'left',l_x_plus:'right',l_y_minus:'up',l_y_plus:'down',r_x_minus:'v',r_x_plus:'n',r_y_minus:'c',r_y_plus:'b',select:'nul'});
  return out;
 }
 const out={up:'w',down:'s',left:'a',right:'d',a:'k',b:'j',x:'i',y:'u',l:'q',r:'e',l2:'r',r2:'t',start:'enter',select:'rshift'};
 if(['Mega Drive','Sega CD','Mega Drive 32X'].includes(folder))Object.assign(out,{l:'y',x:'u',r:'i',y:'h',b:'j',a:'k',l2:'q',r2:'e'});
 if(folder==='Sega Saturn')Object.assign(out,{y:'y',x:'u',l:'i',b:'h',a:'j',r:'k',l2:'q',r2:'e'});
 if(folder==='Nintendo 64')Object.assign(out,{up:'up',down:'down',left:'left',right:'right',b:'x',y:'c',a:'v',x:'b',l:'q',r:'e',l2:'r',r2:'t',l_x_minus:'a',l_x_plus:'d',l_y_minus:'w',l_y_plus:'s',r_x_minus:'j',r_x_plus:'l',r_y_minus:'i',r_y_plus:'k'});
 return out;
}
module.exports={keys};
