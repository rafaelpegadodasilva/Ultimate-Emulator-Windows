const fs=require('fs'),path=require('path'),crypto=require('crypto');
const source=__dirname;const dest=process.argv[2]||path.join(source,'..','resources','app.asar');
// Electron keeps ASAR headers in memory. Never replace the live archive:
// lazily loaded modules would read new bytes using offsets from the old header.
if(process.platform==='win32' && path.resolve(dest)===path.resolve(source,'..','resources','app.asar')){
 const {execFileSync}=require('child_process');
 const count=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"@(Get-CimInstance Win32_Process -Filter \"Name='Ultimate Emulator.exe'\" | Where-Object { $_.ExecutablePath -eq $env:UE_BUILD_EXE }).Count"],{windowsHide:true,encoding:'utf8',env:{...process.env,UE_BUILD_EXE:path.resolve(source,'..','Ultimate Emulator.exe')}}).trim();
 if(!/^0$/.test(count))throw Error('Feche o Ultimate Emulator antes de atualizar app.asar. O pacote em uso não foi alterado.');
}
const header={files:{}};const chunks=[];let offset=0;
function walk(folder,node){for(const name of fs.readdirSync(folder).sort()){if(name==='node_modules'||name.startsWith('.')||name==='rebuild.cjs')continue;const full=path.join(folder,name),st=fs.statSync(full);if(st.isDirectory()){node.files[name]={files:{}};walk(full,node.files[name]);}else {const b=fs.readFileSync(full);node.files[name]={size:b.length,offset:String(offset),integrity:{algorithm:'SHA256',hash:crypto.createHash('sha256').update(b).digest('hex'),blockSize:4194304,blocks:Array.from({length:Math.max(1,Math.ceil(b.length/4194304))},(_,i)=>crypto.createHash('sha256').update(b.subarray(i*4194304,(i+1)*4194304)).digest('hex'))}};chunks.push(b);offset+=b.length;}}}
walk(source,header);const json=Buffer.from(JSON.stringify(header));const payloadSize=4+json.length;const aligned=(payloadSize+3)&~3;const pickle=Buffer.alloc(4+aligned);pickle.writeUInt32LE(aligned,0);pickle.writeUInt32LE(json.length,4);json.copy(pickle,8);const size=Buffer.alloc(8);size.writeUInt32LE(4,0);size.writeUInt32LE(pickle.length,4);fs.mkdirSync(path.dirname(dest),{recursive:true});const pending=dest+'.pending';fs.writeFileSync(pending,Buffer.concat([size,pickle,...chunks]));fs.renameSync(pending,dest);console.log(dest);
