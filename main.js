const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Software rendering is kept as an explicit fallback for problematic virtual
// GPU setups. Normal Windows launches use Chromium's compositor so moving the
// launcher window stays smooth.
if (process.platform === 'win32' && process.env.UE_FORCE_SOFTWARE_RENDERING === '1') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('in-process-gpu');
}
const { spawn, execFile, execFileSync } = require('child_process');
const os = require('os');
const crypto = require('crypto');

// Runtime logs belong in AppData, not beside the portable installation.
// Desktop folders can be protected by Windows Controlled Folder Access.
function ueRuntimeLogPath() {
  const dir = path.join(app.getPath('userData'), 'Database', 'Logs');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
  return path.join(dir, 'EMULADOR.log');
}

const ownsInstance = app.requestSingleInstanceLock();
if (!ownsInstance) app.quit();
app.on('second-instance', () => {
  if (!mainWindow || mainWindow.isDestroyed()) { if(app.isReady())createWindow(); return; }
  if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus();
});

process.on('uncaughtException', (error) => {
  try { fs.appendFileSync(ueRuntimeLogPath(), `[${new Date().toISOString()}] [UNCAUGHT] ${error && error.stack ? error.stack : String(error)}\n`); } catch (_) {}
});
process.on('unhandledRejection', (reason) => {
  try { fs.appendFileSync(ueRuntimeLogPath(), `[${new Date().toISOString()}] [UNHANDLED] ${reason && reason.stack ? reason.stack : String(reason)}\n`); } catch (_) {}
});

// Serialise the full launch transaction: stop old game before preparing the next one.
let ue20LaunchQueue=Promise.resolve();
const ue20Launchers=new Map();
function ue20HandleLaunch(channel,handler){
 ue20Launchers.set(channel,handler);
 ipcMain.handle(channel,(...args)=>{
  const run=ue20LaunchQueue.then(async()=>{
   const payload=args[1]||{};
   // Um toque residual do controle não pode derrubar o jogo atual para
   // reabrir a mesma ROM. Isso acontecia quando L3/R3 era lido também como
   // selecionar pelo frontend enquanto o RetroArch ainda estava em foco.
   if(channel==='launch-retroarch' && ue7RetroArchRunning() && ue13ActiveGame &&
      typeof payload.romPath==='string' &&
      path.resolve(payload.romPath)===path.resolve(ue13ActiveGame.romPath)) {
    log('LAUNCH_DUPLICATE_IGNORED', `RetroArch ja executando ${payload.romPath}`);
    return {ok:true,alreadyRunning:true};
   }
   await ue20StopActive();
   return handler(...args)
  });
  ue20LaunchQueue=run.catch(()=>{});return run;
 });
}
async function ue20StopActive(keepCheatWindow=false){
 const old=activeEmulator;
 if(ueLiveTools)ueLiveTools.stop();
 ueLiveMame=null;
 ue159Paused=false;
 ue13PendingLoad=null;
 if(!keepCheatWindow&&ue159Window&&!ue159Window.isDestroyed())ue159Window.close();
 ue159ReleaseTab();
 if(!old||old.exitCode!==null){ue159Game=null;ue13ActiveGame=null;return;}
 const exited=()=>old.exitCode!==null||old.signalCode!==null||activeEmulator!==old;
 const wait=async(ms)=>{for(let i=0;i<ms/100;i++){if(exited())return true;await new Promise(r=>setTimeout(r,100))}return exited()};
 if(/retroarch\.exe$/i.test(old.spawnfile||''))await ue159Engine().udp('QUIT');
 else if(process.platform==='win32')await new Promise(r=>execFile('taskkill.exe',['/PID',String(old.pid),'/T'],{windowsHide:true},()=>r()));
 else old.kill('SIGTERM');
 if(!await wait(10000)){
  if(process.platform==='win32')await new Promise(r=>execFile('taskkill.exe',['/PID',String(old.pid),'/T','/F'],{windowsHide:true},()=>r()));
  else old.kill('SIGKILL');
  if(!await wait(2000))throw Error('Nao foi possivel encerrar o jogo anterior.');
 }
 ue159Game=null;
 ue13ActiveGame=null;
}

// ─── Portable root detection ───────────────────────────────────────────────
// Works both when running from source (npm start) and from the packaged .exe.
// The portable layout is:
//   <root>/
//     Ultimate Emulator.exe   ← execPath when packaged
//     Runtime/
//       Cores/        ← *.dll libretro cores
//       Frontends/    ← RetroArch, PCSX2, Dolphin, xemu, Vita3K
//       MAME/
//       Database/
//     ROMS/
//       Sistemas Roms/<system>/
//     Capas/

function findPortableRoot() {
  const candidates = [];

  // 1. Packaged: exe lives at <root>/Ultimate Emulator.exe
  if (app.isPackaged) {
    candidates.push(path.dirname(process.execPath));
    candidates.push(path.join(path.dirname(process.execPath), '..'));
    // electron-builder's directory target puts the executable in
    // <root>/dist-win/win-*-unpacked.  Walk back to the portable project
    // root so its existing ROMS/Capas/Runtime folders remain in use.
    candidates.push(path.join(path.dirname(process.execPath), '..', '..'));
  }

  // O atalho compatível do Parallels executa somente o motor Electron no
  // disco local e deixa este ponteiro ao lado dele. A leitura do arquivo é
  // confiável mesmo quando o Explorer não repassa variáveis de ambiente.
  if (app.isPackaged) {
    try {
      const pointer = fs.readFileSync(path.join(path.dirname(process.execPath), '.ue-portable-root'), 'utf8').trim();
      if (pointer && fs.existsSync(pointer)) return path.resolve(pointer);
    } catch (_) {}
  }

  // 2. Development: __dirname is <root>/Runtime
  candidates.push(path.join(__dirname, '..'));
  candidates.push(__dirname);

  // A camada Electron precisa executar de um disco local no Parallels: iniciar
  // diretamente de uma pasta compartilhada (PrlSF/SMB) encerra o processo
  // principal do Chromium. O iniciador local passa esta raiz para que o motor
  // local continue utilizando ROMS, Runtime e Capas no disco compartilhado.
  const portableOverride = app.commandLine.getSwitchValue('ue-portable-root') ||
    process.env.EMULADORES_PORTABLE_ROOT;
  if (portableOverride && fs.existsSync(portableOverride)) {
    return path.resolve(portableOverride);
  }
  // V17: o diretorio do executavel prevalece quando não houver uma raiz
  // explícita (por exemplo, numa instalação normal em disco local).
  if (app.isPackaged) {
    const home = path.dirname(process.execPath);
    if (fs.existsSync(path.join(home,'resources','app.asar')) &&
        fs.existsSync(path.join(home,'.ultimate-emulator-projeto'))) return home;
  }

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    // A valid root has Runtime/Cores or ROMS/Sistemas Roms next to it
    if (fs.existsSync(path.join(resolved, '.ultimate-emulator-projeto'))) return resolved;
    const hasRuntime = fs.existsSync(path.join(resolved, 'Runtime', 'Cores'));
    const hasRoms = fs.existsSync(path.join(resolved, 'ROMS', 'Sistemas Roms'));
    const hasCores = fs.existsSync(path.join(resolved, 'Cores')); // root IS runtime
    if (hasRuntime || hasRoms || hasCores) return resolved;
  }

  // Fallback: dirname of __dirname
  return path.resolve(path.join(__dirname, '..'));
}

const PORTABLE_ROOT = findPortableRoot();
// Dados do usuário fazem parte da distribuição portátil. Não usar AppData
// garante que capas, saves, cheats e ajustes acompanhem a pasta do programa
// ao copiá-la para outro computador.
const APPDATA_DATABASE_ROOT = path.join(app.getPath('userData'), 'Database');
// Quando o iniciador portátil define --user-data-dir, app.getPath('userData')
// já aponta para ElectronData dentro do pacote. Esta é a localização padrão
// usada pelas versões anteriores, antes da migração para a pasta portátil.
const LEGACY_APPDATA_DATABASE_ROOT = path.join(
  process.env.APPDATA || app.getPath('appData'),
  'ultimate-emulator-windows',
  'Database'
);
const USER_DATA_ROOT = path.join(PORTABLE_ROOT, 'Database');
const USER_LIBRARY_LOCATION = path.join(USER_DATA_ROOT, 'library-location.json');
const LEGACY_LIBRARY_LOCATION = path.join(PORTABLE_ROOT, 'library-location.json');

// Runtime may be next to exe OR we may be inside Runtime already
function runtimePath(...parts) {
  const next = path.join(PORTABLE_ROOT, 'Runtime', ...parts);
  if (fs.existsSync(next)) return next;
  const self = path.join(PORTABLE_ROOT, ...parts);
  return self;
}

const PATHS = {
  root: PORTABLE_ROOT,
  runtime: runtimePath(),
  cores: runtimePath('Cores'),
  frontends: runtimePath('Frontends'),
  mame: runtimePath('MAME'),
  // Mutable data lives in AppData so Defender's Controlled Folder Access
  // cannot block scans, profiles, logs or RetroArch session writes.
  database: USER_DATA_ROOT,
  roms: path.join(PORTABLE_ROOT, 'ROMS', 'Sistemas Roms'),
  capas: path.join(PORTABLE_ROOT, 'Capas'),
  log: ueRuntimeLogPath(),
};

const ueComponents=require('./component-repair.cjs')(PATHS);
ipcMain.handle('ue-controller-battery',(_,force)=>require('./controller-battery.cjs').read(PATHS.database,force===true));
const ueControllerPreferences=require('./controller-preferences.cjs')(PATHS.database);
ipcMain.handle('ue-controller-preferences',()=>ueControllerPreferences.read());
ipcMain.handle('ue-controller-rumble',(_,enabled)=>{
 const value=ueControllerPreferences.setRumble(enabled);
 return {ok:true,...value,applies:activeEmulator&&activeEmulator.exitCode===null?'next-launch':'next-game'};
});

function migrateLegacyDatabase() {
  const legacyFolders = [APPDATA_DATABASE_ROOT, LEGACY_APPDATA_DATABASE_ROOT, runtimePath('Database')]
    .filter((folder, index, all) => folder &&
      path.resolve(folder).toLowerCase() !== path.resolve(USER_DATA_ROOT).toLowerCase() &&
      all.findIndex(other => path.resolve(other).toLowerCase() === path.resolve(folder).toLowerCase()) === index &&
      fs.existsSync(folder));
  if (!legacyFolders.length) return;
  fs.mkdirSync(USER_DATA_ROOT, { recursive: true });
  for (const legacy of legacyFolders) {
    for (const entry of fs.readdirSync(legacy, { withFileTypes: true })) {
      const source = path.join(legacy, entry.name);
      const target = path.join(USER_DATA_ROOT, entry.name);
      if (fs.existsSync(target)) continue;
      fs.cpSync(source, target, { recursive: true });
    }
  }
  if (!fs.existsSync(USER_LIBRARY_LOCATION) && fs.existsSync(LEGACY_LIBRARY_LOCATION)) {
    fs.copyFileSync(LEGACY_LIBRARY_LOCATION, USER_LIBRARY_LOCATION);
  }
}
try { migrateLegacyDatabase(); } catch (error) {
  try { fs.appendFileSync(ueRuntimeLogPath(),
    `[${new Date().toISOString()}] [DATA_MIGRATION] ${error && error.stack ? error.stack : String(error)}\n`); } catch (_) {}
}

function resolveSavedLibraryRoot() {
  for (const file of [USER_LIBRARY_LOCATION, LEGACY_LIBRARY_LOCATION]) {
    try {
      const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
      const candidates = [
        saved.relativeRoot ? path.resolve(PORTABLE_ROOT, saved.relativeRoot) : null,
        typeof saved.root === 'string' ? saved.root : null,
      ];
      const found = candidates.find(candidate => candidate &&
        fs.existsSync(candidate) && fs.statSync(candidate).isDirectory());
      if (found) return found;
    } catch (_) {}
  }
  return null;
}

// The selected Global Scan root wins on the next launch. Only fall back to
// the bundled ROM folder when no saved root exists.
function resolveRomLibrary() {
  const saved = resolveSavedLibraryRoot();
  if (saved) return saved;
  const local = PATHS.roms;
  if (fs.existsSync(local) && fs.statSync(local).isDirectory()) return local;
  const root = path.parse(PORTABLE_ROOT).root;
  const sharedOriginal = path.join(root, 'Jogos', 'Ultimate Emulator', 'ROMS', 'Sistemas Roms');
  try { if (fs.existsSync(sharedOriginal)) return sharedOriginal; } catch (_) {}
  return local;
}
PATHS.scanRoms = resolveRomLibrary();

// Names consumed by the renderer. Keep these paths portable so the same
// package works from a drive letter, a network share, or a USB installation.
PATHS.romsRoot = PATHS.roms;
PATHS.emulatorRoot = PATHS.runtime;
const ue15ThreeDO = require('./ue15-3do');
function ue15BiosRoots(gamePath) {
  const roots=[PATHS.scanRoms,PATHS.roms,PATHS.frontends,
    path.join(PATHS.frontends,'RetroArch'),PORTABLE_ROOT,
    PATHS.runtime];
  if(gamePath){
    let p=path.dirname(path.resolve(gamePath));
    for(let i=0;i<5;i++){roots.push(p);const parent=path.dirname(p);if(parent===p)break;p=parent;}
  }
  return roots;
}
const ue3Library = require('./rom-library-v3');
const ue4Mame = require('./mame-controls-v7');
function ue3System(folder) {
 const id=({'PlayStation 1':'psx','PlayStation 2':'ps2','PlayStation Portable':'psp','PlayStation Vita':'vita','Arcade - MAME':'arcade'})[folder] || '';
 const extensions=({'PlayStation 1':['.cue','.bin','.iso','.chd','.pbp','.mdf','.m3u'],'PlayStation 2':['.iso','.bin','.img','.mdf','.chd'],'PlayStation Portable':['.iso','.cso','.pbp'],'Arcade - MAME':['.zip','.7z','.chd']})[folder] || [];
 return {id,folder,extensions};
}

// ─── Logger ─────────────────────────────────────────────────────────────────
// UE_PATCH_143
const UE_CACHE = path.join(PATHS.database, 'ultimate-library.json');
const UE_SETTINGS = path.join(PATHS.database, 'ultimate-settings.json');

function ueReadJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (_) { return fallback; }
}
function ueWriteJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}
function ueRel(file) {
  if (!file) return null;
  return path.relative(PORTABLE_ROOT, file);
}
function ueResolve(rel, absolute) {
  if (typeof rel === 'string') {
    const found = path.resolve(PORTABLE_ROOT, rel);
    if (fs.existsSync(found)) return found;
  }
  return absolute && fs.existsSync(absolute) ? absolute : null;
}
function ueCleanTitle(name) {
  let title = String(name || '')
    .replace(/\.(zip|7z|iso|chd|cue|gdi|bin|sfc|smc|gba|gbc|gb|nds|nes|n64|z64|v64|cso|pbp)$/i, '')
    .replace(/^\s*\d{1,5}\s*[-_.]\s*/, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s*\((?:USA|Europe|Japan|World|Brazil|Asia|Korea|Australia|Rev\s*[^)]*|En(?:,[A-Za-z]+)*|[A-Z]{2,3}|M\d+|Proto|Beta|Demo|Unl)\)/gi, '')
    .replace(/\s*\[(?:[^\]]*(?:SLUS|SCUS|SLES|SCES|SCPH|DISC|DISK|REV|USA|EUR|JPN|!|\bU\b|\bE\b|\bJ\b)[^\]]*)\]/gi, '')
    .replace(/\s+\d{2}[.-]\d{2}[.-]\d{2}(?:\s+(?:BG|PT-BR))?\s*$/i, '')
    .replace(/\s+(?:BG|PT-BR)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return title || name;
}

let ueMameNames = null;
function ueLoadMameNames() {
  if (ueMameNames) return ueMameNames;
  ueMameNames = new Map();
  const executable = findExe(PATHS.mame, 'mame.exe', 'mame64.exe');
  if (!executable) return ueMameNames;
  try {
    const output = execFileSync(executable, ['-listfull'], {
      cwd: PATHS.mame,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 15000,
      maxBuffer: 16 * 1024 * 1024
    });
    for (const line of output.split(/\r?\n/)) {
      const match = /^([^\s]+)\s+"(.*)"$/.exec(line.trim());
      if (match) ueMameNames.set(match[1].toLowerCase(), match[2]);
    }
  } catch (error) {
    log('MAME_NAMES', error && error.message ? error.message : String(error));
  }
  return ueMameNames;
}

function ueFriendlyCachedName(system, entry) {
  const fileName = entry && (entry.fileName || entry.name) || '';
  const stem = path.parse(fileName).name;
  if (system === 'Arcade - MAME') {
    return ueLoadMameNames().get(stem.toLowerCase()) || ueCleanTitle(stem);
  }
  return ueCleanTitle(entry && entry.name ? entry.name : stem);
}
function ueSaveLibrary(root, libraries) {
  const items = {};
  for (const [system, list] of Object.entries(libraries || {})) {
    items[system] = (list || []).filter(x => x && x.path).map(x => ({
      relative: path.relative(root, x.path),
      name: ueCleanTitle(x.name || x.fileName),
      fileName: x.fileName
    }));
  }
  ueWriteJSON(UE_CACHE, {
    version: 1,
    root,
    relativeRoot: ueRel(root),
    updatedAt: new Date().toISOString(),
    items
  });
}
ipcMain.handle('get-library-cache', () => {
  const saved = ueReadJSON(UE_CACHE, null);
  if (!saved || !saved.items) return null;
  const root = ueResolve(saved.relativeRoot, saved.root);
  if (!root) return { available: false, libraries: {} };
  const libraries = {};
  for (const [system, entries] of Object.entries(saved.items)) {
    libraries[system] = ue3Library.compactEntries((entries || []).map(entry => ({
      name: ueFriendlyCachedName(system, entry),
      fileName: entry.fileName,
      path: path.resolve(root, entry.relative)
    })), ue3System(system));
  }
  PATHS.scanRoms = root;
  return { available: true, root, libraries, updatedAt: saved.updatedAt };
});
ipcMain.handle('get-system-settings', (_, folder) => {
  const all = ueReadJSON(UE_SETTINGS, {});
  return all[String(folder)] || {};
});
ipcMain.handle('save-system-settings', (_, payload) => {
  if (!payload || typeof payload.folder !== 'string') throw new Error('Sistema invalido');
  const all = ueReadJSON(UE_SETTINGS, {});
  all[payload.folder] = {
    driver: ['auto','sdl2','xinput','dinput'].includes(payload.driver) ? payload.driver : 'auto',
    keys: payload.keys && typeof payload.keys === 'object' ? payload.keys : {},
    buttons: payload.buttons && typeof payload.buttons === 'object' ? payload.buttons : {},
    shader: typeof payload.shader === 'string' ? payload.shader : ''
  };
  ueWriteJSON(UE_SETTINGS, all);
  return { ok: true };
});
function ueShaderRoot() {
  return path.join(PATHS.frontends, 'RetroArch', 'shaders');
}
function ueShaderPath(rel) {
  if (!rel || typeof rel !== 'string') return null;
  const root = path.resolve(ueShaderRoot());
  const target = path.resolve(root, rel);
  if (!target.toLowerCase().startsWith((root + path.sep).toLowerCase())) return null;
  return /\.slangp$/i.test(target) && fs.existsSync(target) ? target : null;
}
ipcMain.handle('list-video-presets', () => {
  const root = ueShaderRoot();
  const results = [];
  if (!fs.existsSync(root)) return results;
  const stack = [root];
  while (stack.length && results.length < 150) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (_) { continue; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/\.slangp$/i.test(entry.name) &&
        /(crt|scanline|lcd|ntsc|sharp|xbr|pixel|bilinear|nearest)/i.test(entry.name)) {
        results.push({
          value: path.relative(root, full),
          label: entry.name.replace(/\.slangp$/i, '').replace(/[-_]+/g, ' ')
        });
      }
    }
  }
  return results.sort((a,b) => a.label.localeCompare(b.label));
});
ipcMain.handle('apply-live-shader', async (_, rel) => {
  const preset = ueShaderPath(rel);
  if (!preset) return { ok: false, error: 'Preset indisponivel ou incompatível.' };
  if (!activeEmulator || activeEmulator.exitCode !== null ||
      !/retroarch\.exe$/i.test(activeEmulator.spawnfile || '')) {
    return { ok: false, error: 'Abra primeiro um jogo no RetroArch.' };
  }
  return new Promise(resolve => {
    const udp = require('dgram').createSocket('udp4');
    const command = Buffer.from('SET_SHADER ' + preset, 'utf8');
    udp.send(command, 55355, '127.0.0.1', error => {
      udp.close();
      resolve(error
        ? { ok: false, error: error.message }
        : { ok: true, message: 'Comando enviado ao RetroArch.' });
    });
  });
});
// UE_ASAR_PATCH_146
const UE6_LIBRARY = path.join(PATHS.database,'ultimate-library-146.json');
const UE6_SETTINGS = path.join(PATHS.database,'ultimate-settings-146.json');

function ue6Read(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file,'utf8')); }
  catch (_) { return fallback; }
}
function ue6Write(file, value) {
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const temporary = file + '.tmp';
  fs.writeFileSync(temporary,JSON.stringify(value,null,2),'utf8');
  fs.renameSync(temporary,file);
}
function ue6Options(folder) {
  return require('./retroarch-controls.cjs').normalize(ue6Read(UE6_SETTINGS,{})[folder] || {});
}

function ue6BuildLibraryData(root, libraries) {
  const entries = {};
  for (const [system,list] of Object.entries(libraries || {})) {
    entries[system] = ue3Library.compactEntries((list || []).filter(x => x && x.path), ue3System(system)).map(x => ({
      relative: path.relative(root, x.path),
      name: ueFriendlyCachedName(system, x),
      fileName: x.fileName
    }));
  }
  return {
    root,
    relativeRoot: path.relative(PORTABLE_ROOT, root),
    entries,
    date: new Date().toISOString()
  };
}

function ue6LegacyLibraryData() {
  const legacy = ueReadJSON(UE_CACHE, null);
  if (!legacy || !legacy.items) return null;
  const entries = {};
  for (const [system,list] of Object.entries(legacy.items)) {
    entries[system] = (list || []).map(x => ({
      relative: x.relative,
      name: x.name,
      fileName: x.fileName
    }));
  }
  return {
    root: legacy.root,
    relativeRoot: legacy.relativeRoot,
    entries,
    date: legacy.updatedAt || new Date().toISOString()
  };
}

ipcMain.handle('ue6-save-library',(_,payload)=>{
  const root = path.resolve(payload.root);
  if (!fs.existsSync(root)) throw new Error('Biblioteca indisponivel');
  ue6Write(UE6_LIBRARY, ue6BuildLibraryData(root, payload.libraries));
  ue6Write(USER_LIBRARY_LOCATION, { root, relativeRoot: path.relative(PORTABLE_ROOT, root) });
  PATHS.scanRoms = root;
  return {ok:true};
});

ipcMain.handle('ue6-load-library',()=>{
  const data = ue6Read(UE6_LIBRARY, null) || ue6LegacyLibraryData();
  if (!data || !data.entries) {
    log('LIBRARY_LOAD', `empty data file=${UE6_LIBRARY}`);
    return null;
  }

  const roots = [
    data.relativeRoot ? path.resolve(PORTABLE_ROOT, data.relativeRoot) : null,
    typeof data.root === 'string' ? path.resolve(data.root) : null,
    resolveSavedLibraryRoot(),
  ].filter(Boolean);
  const root = roots.find(x => x && fs.existsSync(x) && fs.statSync(x).isDirectory());
  if (!root) {
    log('LIBRARY_LOAD', `root unavailable file=${UE6_LIBRARY} roots=${roots.filter(Boolean).join('|')}`);
    // Keep the last selected folder even when an external SSD is disconnected.
    // The renderer must not fall back to the bundled ROM folder and overwrite
    // this location on the next launch.
    return {available:false, rememberedRoot:roots[0] || null, date:data.date || data.updatedAt || null};
  }

  const libraries = {};
  for (const [system,list] of Object.entries(data.entries)) {
    libraries[system] = ue3Library.compactEntries((list || []).map(x => ({
      path: path.resolve(root, x.relative),
      name: ueFriendlyCachedName(system, x),
      fileName: x.fileName
    })), ue3System(system));
  }
  PATHS.scanRoms = root;
  log('LIBRARY_LOAD', `restored root=${root} systems=${Object.keys(libraries).length} games=${Object.values(libraries).reduce((n,list)=>n+list.length,0)}`);
  return {available:true,root,libraries,date:data.date};
});
ipcMain.handle('ue6-read-options',(_,folder)=>ue6Options(folder));

ipcMain.handle('ue6-save-options',(_,payload)=>{
  const folder = String(payload.folder || '');
  if (!folder || folder.length > 128) throw new Error('Console invalido');
  const all = ue6Read(UE6_SETTINGS,{});
  all[folder] = {
    ...all[folder],
    bindingFormat:'sdl2-standard-v1',
    aspect:['16:9','4:3','original'].includes(payload.aspect)
      ? payload.aspect : '16:9',
    internalScale: Math.min(5,Math.max(1,
      Number(payload.internalScale || 2))),
    shader:String(payload.shader || ''),
    latency:[128,192,256].includes(Number(payload.latency))
      ? Number(payload.latency) : 192,
    driver:['auto','sdl2','xinput','dinput'].includes(payload.driver)
      ? payload.driver : 'auto',
    joypadIndex: Number.isInteger(payload.joypadIndex) && payload.joypadIndex>=0 && payload.joypadIndex<16 ? payload.joypadIndex : 0,
    joypadIndexP2: Number.isInteger(payload.joypadIndexP2) && payload.joypadIndexP2>=0 && payload.joypadIndexP2<16 ? payload.joypadIndexP2 : 1,
    player2Enabled:payload.player2Enabled===true,
    keys:payload.keys || {},
    buttons:payload.buttons || {},
    axes:payload.axes || {},
    keysP2:payload.keysP2 || {},
    buttonsP2:payload.buttonsP2 || {},
    axesP2:payload.axesP2 || {},
    audioMode:'auto',
    fastForwardButton:/^\d{1,3}$/.test(String(payload.fastForwardButton))
      ? Number(payload.fastForwardButton) : 10,
    saveButton:Number(payload.saveButton ?? 10),
    loadButton:Number(payload.loadButton ?? 11)
  };
  ue6Write(UE6_SETTINGS,all);
  // Create/refresh persistent per-system config immediately on Save, even if
  // the system was never launched. The running core reads binds at next start.
  const activeProfile=ue153PersistentConfig(folder);
  ue153UpdateProfile(folder,payload);
  return {ok:true,profile:path.basename(activeProfile),applies:'next-launch'};
});

function ue6ShaderPath(name) {
  if (!name) return null;
  const root = path.resolve(PATHS.frontends,'RetroArch','shaders');
  const full = path.resolve(root,name);
  if (!full.toLowerCase().startsWith((root + path.sep).toLowerCase()))
    return null;
  return /\.slangp$/i.test(full) && fs.existsSync(full) ? full : null;
}

ipcMain.handle('ue6-list-shaders',()=>{
  const root = path.join(PATHS.frontends,'RetroArch','shaders');
  const result = [];
  if (!fs.existsSync(root)) return result;
  const stack = [root];

  while(stack.length && result.length < 250) {
    const dir = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(dir,{withFileTypes:true}); }
    catch (_) { continue; }

    for(const entry of entries) {
      const full = path.join(dir,entry.name);
      if(entry.isDirectory()) stack.push(full);
      else if(/\.slangp$/i.test(entry.name) &&
        /(crt|scanline|lcd|sharp|xbr|ntsc|nearest|bilinear|pixel)/i.test(entry.name)) {
        result.push({
          value:path.relative(root,full),
          label:entry.name.replace(/\.slangp$/i,'').replace(/[-_]/g,' ')
        });
      }
    }
  }
  return result.sort((a,b)=>a.label.localeCompare(b.label));
});

ipcMain.handle('ue6-apply-shader',(_,name)=>{
  const file = ue6ShaderPath(name);
  if(!file) return {ok:false,error:'Shader inexistente'};
  return new Promise(resolve=>{
    const socket = require('dgram').createSocket('udp4');
    socket.send(Buffer.from('SET_SHADER '+file),
      55355,'127.0.0.1',error=>{
        socket.close();
        resolve(error ? {ok:false,error:error.message} : {ok:true});
      });
  });
});
const MAX_LOG = 20 * 1024 * 1024;
const TRIM_LOG = 10 * 1024 * 1024;

function log(context, message) {
  try {
    const ts = new Date().toISOString();
    const line = `[${ts}] [${context}] ${message}\n`;
    if (fs.existsSync(PATHS.log)) {
      const size = fs.statSync(PATHS.log).size;
      if (size >= MAX_LOG) {
        const data = fs.readFileSync(PATHS.log);
        fs.writeFileSync(PATHS.log, data.slice(data.length - TRIM_LOG));
      }
    }
    fs.appendFileSync(PATHS.log, line, 'utf8');
  } catch (_) {}
}

// ─── Window ─────────────────────────────────────────────────────────────────
let mainWindow = null;
let stateChooserWindow = null;
let stateChooserReady = false;
let stateChooserPending = null;
let stateToastPending = null;

function ue13StateChooserBounds() {
  try {
    const anchor = mainWindow && !mainWindow.isDestroyed()
      ? mainWindow.getBounds()
      : screen.getPrimaryDisplay().bounds;
    return screen.getDisplayMatching(anchor).bounds;
  } catch (_) {
    return screen.getPrimaryDisplay().bounds;
  }
}

function ue13EnsureStateChooserWindow() {
  if (stateChooserWindow && !stateChooserWindow.isDestroyed()) return stateChooserWindow;
  stateChooserReady = false;
  stateChooserWindow = new BrowserWindow({
    ...ue13StateChooserBounds(),
    title: 'Ultimate Emulator - Save States',
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  stateChooserWindow.setAlwaysOnTop(true, 'screen-saver');
  stateChooserWindow.webContents.on('did-finish-load', () => {
    stateChooserReady = true;
    if (stateChooserPending && stateChooserWindow && !stateChooserWindow.isDestroyed()) {
      stateChooserWindow.webContents.send('ue10-state-chooser', {states: stateChooserPending});
    }
    if (stateToastPending && stateChooserWindow && !stateChooserWindow.isDestroyed()) {
      stateChooserWindow.webContents.send('ue10-state-toast', {message: stateToastPending});
      stateToastPending = null;
    }
  });
  stateChooserWindow.loadFile(path.join(__dirname, 'renderer', 'state-chooser.html'))
    .catch(error => log('STATE_CHOOSER_WINDOW_ERROR', String(error)));
  stateChooserWindow.on('closed', () => {
    stateChooserWindow = null;
    stateChooserReady = false;
    stateChooserPending = null;
    stateToastPending = null;
  });
  return stateChooserWindow;
}

function ue13ShowStateChooser(states) {
  const win = ue13EnsureStateChooserWindow();
  stateChooserPending = Array.isArray(states) ? states : [];
  try {
    win.setBounds(ue13StateChooserBounds());
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setIgnoreMouseEvents(false);
    win.setFocusable(true);
    win.show();
    win.focus();
    if (stateChooserReady) win.webContents.send('ue10-state-chooser', {states: stateChooserPending});
  } catch (error) {
    log('STATE_CHOOSER_WINDOW_ERROR', String(error));
  }
}

function ue13ShowStateToast(message) {
  const win = ue13EnsureStateChooserWindow();
  stateToastPending = String(message || '');
  try {
    win.setBounds(ue13StateChooserBounds());
    win.setAlwaysOnTop(true, 'screen-saver');
    // The toast must never steal focus from the game or block its controls.
    win.setFocusable(false);
    win.setIgnoreMouseEvents(true, {forward: true});
    if (typeof win.showInactive === 'function') win.showInactive();
    else win.show();
    if (stateChooserReady) {
      win.webContents.send('ue10-state-toast', {message: stateToastPending});
      stateToastPending = null;
    }
  } catch (error) {
    log('STATE_TOAST_ERROR', String(error));
  }
}

function ue13HideStateChooser() {
  if (!stateChooserWindow || stateChooserWindow.isDestroyed()) return;
  try {
    stateChooserWindow.setIgnoreMouseEvents(false);
    stateChooserWindow.hide();
    stateChooserWindow.setAlwaysOnTop(false);
    stateChooserPending = null;
    stateToastPending = null;
  } catch (_) {}
}

function createWindow() {
  log('WINDOW_CREATE', 'creating BrowserWindow');
  mainWindow = new BrowserWindow({
    width: 1470,
    height: 900,
    minWidth: 620,
    minHeight: 440,
    title: 'Ultimate Emulator',
    backgroundColor: nativeTheme.shouldUseDarkColors?'#171b23':'#f6f8fc',
    ...(process.platform === 'darwin' ? { titleBarStyle: 'hiddenInset' } : { titleBarStyle: 'hidden', titleBarOverlay: { color: '#651d3b', symbolColor: '#ffffff', height: 40 } }),
    // Keep a native Windows frame while validating the portable build. It
    // prevents a shared-folder launch from producing an invisible borderless
    // window before Chromium has finished loading the renderer.
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  log('WINDOW_CREATED', 'BrowserWindow created');

  mainWindow.once('ready-to-show', () => {
    log('WINDOW_READY', 'renderer ready; showing main window');
    mainWindow.show();
    mainWindow.focus();
  });
  mainWindow.webContents.on('did-fail-load', (_, code, description, url) => {
    log('WINDOW_LOAD_ERROR', `code=${code} description=${description} url=${url}`);
  });
  mainWindow.webContents.on('render-process-gone', (_, details) => {
    log('RENDERER_EXIT', `reason=${details.reason} exitCode=${details.exitCode}`);
  });
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(0.85);
    log('WINDOW_FINISHED_LOAD', 'index.html loaded; interface scale=85%');
  });
  mainWindow.webContents.on('console-message', (_, level, message, line, sourceId) => {
    log('RENDERER_CONSOLE', `level=${level} ${sourceId}:${line} ${message}`);
  });
  mainWindow.on('unresponsive', () => log('WINDOW_UNRESPONSIVE', 'renderer did not respond'));

  if (app.isPackaged) {
    const indexPath = path.join(__dirname, 'renderer', 'index.html');
    log('WINDOW_LOAD', `index=${indexPath}`);
    // Load the local renderer through file:// so Chromium treats the launcher
    // as a trustworthy local context and exposes the Gamepad API. Some shared
    // drives can stall file navigation, so keep the old inline document as a
    // fallback for those machines.
    let documentHTML = fs.readFileSync(indexPath, 'utf8');
    for(const script of ['app.js','windows-design.js','sidebar-resize.js','hero-collapse.js']){
      const rendererScript=fs.readFileSync(path.join(__dirname,'renderer',script),'utf8');
      documentHTML=documentHTML.replace(`<script src="${script}"></script>`,`<script>${rendererScript}</script>`);
    }
    mainWindow.loadFile(indexPath).catch((error) => {
      log('WINDOW_FILE_LOAD_ERROR', error && error.stack ? error.stack : String(error));
      return mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(documentHTML)}`);
    }).catch((error) => {
      log('WINDOW_LOAD_ERROR', error && error.stack ? error.stack : String(error));
    });
  } else {
    // Dev server (Vite / CRA)
    if(process.env.DEV_PORT) {
      mainWindow.loadURL(`http://localhost:${Number(process.env.DEV_PORT)||3000}`);
    } else {
      mainWindow.loadFile(path.join(__dirname,'renderer','index.html'));
    }
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  log('APP_START', `version=${app.getVersion()} windows-x64 portable root=${PORTABLE_ROOT}`);
  if (!ownsInstance) return;
  createWindow();
  app.on('activate', () => { if (!mainWindow || mainWindow.isDestroyed()) createWindow(); });
});

app.on('window-all-closed', () => {
  log('APP_STOP', 'normal termination');
  app.quit();
});

// ─── IPC: paths ─────────────────────────────────────────────────────────────
ipcMain.handle('get-paths', () => PATHS);

const IGNORED_LIBRARY_FOLDERS = new Set([
  'bios', 'cache', 'cheats', 'configuracao', 'diff', 'installers', 'logs',
  'nvram', 'runtime', 'save states', 'saves', 'snapshots', 'updates',
]);

function normalizedExtensionSet(system) {
  return new Set((system && Array.isArray(system.extensions) ? system.extensions : [])
    .map(ext => String(ext).toLowerCase()));
}

function isSupportedRom(file, system) {
  if (!file || path.basename(file).startsWith('.')) return false;
  return normalizedExtensionSet(system).has(path.extname(file).toLowerCase());
}

function zipEntryExtensions(file) {
  try {
    const data = fs.readFileSync(file);
    const min = Math.max(0, data.length - 0x10016);
    let eocd = -1;
    for (let offset = data.length - 22; offset >= min; offset -= 1) {
      if (data.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
    }
    if (eocd < 0) return new Set();
    const entries = data.readUInt16LE(eocd + 10);
    let offset = data.readUInt32LE(eocd + 16);
    const extensions = new Set();
    for (let index = 0; index < entries && offset + 46 <= data.length; index += 1) {
      if (data.readUInt32LE(offset) !== 0x02014b50) break;
      const nameLength = data.readUInt16LE(offset + 28);
      const extraLength = data.readUInt16LE(offset + 30);
      const commentLength = data.readUInt16LE(offset + 32);
      const name = data.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
      if (name && !name.endsWith('/')) extensions.add(path.extname(name).toLowerCase());
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return extensions;
  } catch (_) {
    return new Set();
  }
}

function cueReferencedFiles(files) {
  const referenced = new Set();
  for (const cue of files.filter(file => path.extname(file).toLowerCase() === '.cue')) {
    try {
      const contents = fs.readFileSync(cue, 'utf8');
      const expression = /^\s*FILE\s+(?:"([^"]+)"|([^\s]+))\s+/gim;
      let match;
      while ((match = expression.exec(contents))) {
        referenced.add(path.resolve(path.dirname(cue), match[1] || match[2]).toLowerCase());
      }
    } catch (_) {}
  }
  return referenced;
}

function createSystemIndexes(systems) {
  const byFolder = new Map();
  const byExt = new Map();
  for (const system of systems) {
    for (const label of [system.folder, system.name]) {
      if (label) byFolder.set(String(label).toLowerCase(), system);
    }
    for (const ext of (system.extensions || [])) {
      const key = String(ext).toLowerCase();
      if (!byExt.has(key)) byExt.set(key, []);
      byExt.get(key).push(system);
    }
  }
  return { byFolder, byExt };
}

function classifyRom(file, systems, indexes) {
  if (!file || path.basename(file).startsWith('.') || /^keys\.bin$/i.test(path.basename(file))) return null;
  const ext = path.extname(file).toLowerCase();
  const parts = path.resolve(file).split(/[\\/]+/).filter(Boolean);
  const lowerParts = parts.map(part => part.toLowerCase());
  let system = null;
  let systemIndex = -1;
  for (let index = 0; index < lowerParts.length - 1; index += 1) {
    const match = indexes.byFolder.get(lowerParts[index]);
    if (match) { system = match; systemIndex = index; }
  }

  if (system) {
    const tailFolders = lowerParts.slice(systemIndex + 1, -1);
    const insideRomsFolder = tailFolders.includes('roms');
    if (tailFolders.some(folder => IGNORED_LIBRARY_FOLDERS.has(folder))) return null;
    return normalizedExtensionSet(system).has(ext) ? system : null;
  }

  let candidates = indexes.byExt.get(ext) || [];
  if (ext === '.zip') {
    const inside = zipEntryExtensions(file);
    candidates = systems.filter(candidate => {
      const allowed = normalizedExtensionSet(candidate);
      for (const innerExt of inside) if (innerExt !== '.zip' && innerExt !== '.7z' && allowed.has(innerExt)) return true;
      return false;
    });
  }
  return candidates.length === 1 ? candidates[0] : null;
}

function romRecord(file, system) {
  const stem = path.parse(file).name;
  const mameName = system && system.id === 'arcade'
    ? ueLoadMameNames().get(stem.toLowerCase()) : null;
  return { name: mameName || ue3Library.catalogTitle(file, system) || ueCleanTitle(stem), fileName: path.basename(file), path: file };
}

ipcMain.handle('scan-roms', async (_, payload) => {
  const systems = Array.isArray(payload?.systems) ? payload.systems : [];
  const system = systems.find(s => s.folder === payload?.folder);
  if (!system?.folder || path.basename(system.folder) !== system.folder) throw new Error('Plataforma inválida');
  const locationsFile=path.join(PATHS.database,'system-library-folders.json');
  const locations=ue6Read(locationsFile,{});
  const previous=locations[system.folder];
  const savedRoot=previous ? ueResolve(previous.relative,previous.absolute) : null;
  if(previous&&!savedRoot&&!payload.chooseFolder)throw new Error('Pasta de jogos indisponível. Use BUSCAR ROMS MANUAL para escolher outra.');
  if(payload.chooseFolder){
    const picked=await dialog.showOpenDialog(mainWindow,{
      title:'Buscar ROMs — '+system.name,
      defaultPath:savedRoot||path.join(PATHS.scanRoms,system.folder),
      properties:['openDirectory']
    });
    if(picked.canceled||!picked.filePaths?.[0])return null;
    const chosen=path.resolve(picked.filePaths[0]);
    const games=ue21ScanFolder(chosen,[system],system)[system.folder]||[];
    locations[system.folder]={relative:ueRel(chosen),absolute:chosen};
    ue6Write(locationsFile,locations);
    return games;
  }
  if(savedRoot)return ue21ScanFolder(savedRoot,[system],system)[system.folder]||[];
  const scoped = path.join(PATHS.scanRoms, system.folder);
  if (!fs.existsSync(scoped)) throw new Error('Pasta desta plataforma não encontrada: ' + scoped);
  const roms = path.join(scoped, 'ROMs');
  const root = fs.existsSync(roms) ? roms : scoped;
  return ue21ScanFolder(root, [system], system)[system.folder] || [];
});

// Scan every configured system in one pass. Results remain keyed by system
// folder so a library can never leak a ROM into another emulator.
ipcMain.handle('choose-scan-folder', async () => {
  const owner = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
  if (owner) {
    owner.setAlwaysOnTop(false);
    owner.show();
    owner.focus();
  }
  const sharedRoot = path.join(path.parse(PORTABLE_ROOT).root, 'Jogos', 'Ultimate Emulator', 'ROMS', 'Sistemas Roms');
  const picked = await dialog.showOpenDialog(owner, {
    title: 'Escolher pasta para o Global Scan',
    defaultPath: fs.existsSync(PATHS.roms) ? PATHS.roms :
      (fs.existsSync(sharedRoot) ? sharedRoot : PORTABLE_ROOT),
    properties: ['openDirectory', 'createDirectory'],
  });
  if (picked.canceled || !picked.filePaths?.[0]) return null;
  const chosen = path.resolve(picked.filePaths[0]);
  // Remember the selection before scanning starts. If the scan is interrupted
  // or the SSD is disconnected later, the next launch still knows this folder.
  ue6Write(USER_LIBRARY_LOCATION, {root:chosen, relativeRoot:ueRel(chosen)});
  return chosen;
});

function ue21ScanFolder(root, systems, forcedSystem = null) {
  if (!root || !fs.existsSync(root)) throw new Error('Pasta de ROMs indisponível');
  const result = Object.fromEntries(systems.map(s => [s.folder, []]));
  const indexes = createSystemIndexes(systems);
  const files = [];
  const walk = (dir) => {
    let entries = [];
    entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) { if (!IGNORED_LIBRARY_FOLDERS.has(entry.name.toLowerCase())) walk(full); } else files.push(full);
    }
  };
  walk(root);
  const referencedByCue = cueReferencedFiles(files);
  const seen = new Set();
  for (const file of files) {
    const normalized = path.resolve(file).toLowerCase();
    if (seen.has(normalized) || referencedByCue.has(normalized)) continue;
    const system = forcedSystem ? (isSupportedRom(file,forcedSystem) ? forcedSystem : null) : classifyRom(file, systems, indexes);
    if (!system || !result[system.folder]) continue;
    seen.add(normalized);
    result[system.folder].push(romRecord(file, system));
  }
  for (const system of systems) result[system.folder] = ue3Library.compactEntries(result[system.folder], system);
  return result;
}

ipcMain.handle('scan-global-folder', async (_, payload) => {
  const root = typeof payload?.folder === 'string' ? payload.folder : '';
  const systems = Array.isArray(payload?.systems) ? payload.systems : [];
  const result = ue21ScanFolder(root, systems);
  ueSaveLibrary(root, result);
  // Persist from the main process itself; the UI is not the only writer.
  // This survives restarts even when the renderer is closed immediately.
  ue6Write(UE6_LIBRARY, ue6BuildLibraryData(root, result));
  ue6Write(USER_LIBRARY_LOCATION, {root, relativeRoot: ueRel(root)});
  PATHS.scanRoms = root;
  return result;
});

ipcMain.handle('scan-global-files', async (_, payload) => {
  const files = Array.isArray(payload && payload.files) ? payload.files : [];
  const systems = Array.isArray(payload && payload.systems) ? payload.systems : [];
  const result = Object.fromEntries(systems.map(s => [s.folder, []]));
  const indexes = createSystemIndexes(systems);
  const referencedByCue = cueReferencedFiles(files);
  const seen = new Set();
  for (const file of files) {
    if (typeof file !== 'string') continue;
    const normalized = path.resolve(file).toLowerCase();
    if (seen.has(normalized) || referencedByCue.has(normalized)) continue;
    const system = classifyRom(file, systems, indexes);
    if (!system || !result[system.folder]) continue;
    seen.add(normalized);
    result[system.folder].push(romRecord(file, system));
  }
  for (const system of systems) result[system.folder] = ue3Library.compactEntries(result[system.folder], system);
  return result;
});

ipcMain.handle('scan-all-roms', async (_, systemFolders) => {
  const result = {};
  for (const folder of (Array.isArray(systemFolders) ? systemFolders : [])) {
    const dir = path.join(PATHS.scanRoms, path.basename(String(folder)), 'ROMs');
    result[folder] = [];
    try {
      if (!fs.existsSync(dir)) continue;
      result[folder] = ue3Library.compactEntries(fs.readdirSync(dir, { withFileTypes: true })
        .filter(d => d.isFile())
        .map(d => romRecord(path.join(dir, d.name), ue3System(folder))), ue3System(folder));
    } catch (_) {}
  }
  return result;
});


// V19: verifica presenca real do frontend e core no pacote portatil.
// Presenca nao equivale a boot/teste de compatibilidade.
ipcMain.handle('ue19-system-health',(_evt, systems)=>{
 const allowed={
  retroarch:{dir:path.join(PATHS.frontends,'RetroArch'),exe:['retroarch.exe']},
  pcsx2:{dir:path.join(PATHS.frontends,'PCSX2'),exe:['pcsx2-qt.exe','PCSX2.exe','pcsx2*.exe']},
  ppsspp:{dir:path.join(PATHS.frontends,'PPSSPP'),exe:['PPSSPPWindows64.exe','PPSSPPWindows.exe']},
  dolphin:{dir:ueAuditDolphinDir(),exe:['Dolphin.exe','DolphinQt2.exe']},
  vita3k:{dir:path.join(PATHS.frontends,'Vita3K'),exe:['Vita3K.exe']},
  mame:{dir:PATHS.mame,exe:['mame.exe','mame64.exe']}
 };
 const result={};
 for(const info of Array.isArray(systems)?systems.slice(0,64):[]){
  if(!info||typeof info.id!=='string'||!/^[a-z0-9_-]{1,40}$/i.test(info.id))continue;
  const type=String(info.launcher||'');
  if(type==='retroarch'&&info.id==='psx'){
    const folder=path.join(PATHS.frontends,'DuckStation');
    const exe=findExe(folder,'duckstation-qt-x64-ReleaseLTCG.exe','duckstation-qt.exe','duckstation.exe');
    result[info.id]={ok:!!exe,reason:exe?'DuckStation encontrado':'DuckStation nao encontrado na pasta Runtime/Frontends/DuckStation'};
    continue;
  }
  const entry=allowed[type];
  if(!entry){result[info.id]={ok:false,reason:'Emulador nao identificado'};continue;}
  const exe=findExe(entry.dir,...entry.exe);
  if(!exe){result[info.id]={ok:false,reason:'Executavel '+type+' ausente no pacote portatil'};continue;}
  if(type==='retroarch'){
    const filename=String(info.core||'');
    if(!/^[a-z0-9_.-]+_libretro\.dll$/i.test(filename)){
      result[info.id]={ok:false,reason:'Nome de core invalido'};continue;
    }
    const check=ueComponents.coreCheck(filename);
    if(!check.ok){result[info.id]=check;continue;}
  }
  result[info.id]={ok:true,reason:'Arquivos principais encontrados (execucao nao testada)'};
 }
 return result;
});

ipcMain.handle('ue-repair-component',async(_,request)=>{
 const info=request||{},type=String(info.launcher||'');
 const specs={retroarch:{dir:path.join(PATHS.frontends,'RetroArch'),names:['retroarch.exe']},pcsx2:{dir:path.join(PATHS.frontends,'PCSX2'),names:['pcsx2-qt.exe','PCSX2.exe','pcsx2*.exe']},ppsspp:{dir:path.join(PATHS.frontends,'PPSSPP'),names:['PPSSPPWindows64.exe','PPSSPPWindows.exe']},dolphin:{dir:ueAuditDolphinDir(),names:['Dolphin.exe','DolphinQt2.exe']},vita3k:{dir:path.join(PATHS.frontends,'Vita3K'),names:['Vita3K.exe']},mame:{dir:PATHS.mame,names:['mame.exe','mame64.exe']}};
 let spec=specs[type];
 if(info.id==='psx')spec={dir:path.join(PATHS.frontends,'DuckStation'),names:['duckstation-qt-x64-ReleaseLTCG.exe','duckstation-qt.exe','duckstation.exe']};
 if(!spec)return {ok:false,error:'Emulador não identificado.'};
 const core=type==='retroarch'&&info.id!=='psx'&&findExe(spec.dir,...spec.names)?String(info.core||''):null;
 if(core&&!Object.hasOwn(require('./core-identities.json'),core))return {ok:false,error:'Core não reconhecido.'};
 const result=await dialog.showOpenDialog(mainWindow,{title:core?'Selecione a pasta que contém '+core:'Selecione a pasta do emulador ('+spec.names[0]+')',defaultPath:core?PATHS.cores:ueComponents.directory(spec.dir),properties:['openDirectory']});
 if(result.canceled||!result.filePaths.length)return {ok:false,cancelled:true};
 const selected=result.filePaths[0];
 try{
  if(core){
   let found=null;const folders=[{dir:selected,depth:0}];let scanned=0;
   while(folders.length&&scanned<500){const node=folders.shift();scanned++;const candidate=path.join(node.dir,core);if(fs.existsSync(candidate)){found=candidate;break;}if(node.depth<3){for(const entry of fs.readdirSync(node.dir,{withFileTypes:true})){if(entry.isDirectory())folders.push({dir:path.join(node.dir,entry.name),depth:node.depth+1});}}}
   if(!found)return {ok:false,error:'Não encontrei '+core+' nesta pasta. Escolha a pasta com esse core Windows x64.'};
   ueComponents.setCore(core,found);
   if(typeof info.folder==='string'&&/^[\p{L}\p{N} _()-]{1,100}$/u.test(info.folder))ue153PersistentConfig(info.folder);
  }else{
   if(!findExe(selected,...spec.names))return {ok:false,error:'O executável '+spec.names[0]+' não foi encontrado nesta pasta.'};
   ueComponents.setDirectory(spec.dir,selected);
  }
  log('COMPONENT_REPAIR',core||type);return {ok:true};
 }catch(error){return {ok:false,error:error.message};}
});

ipcMain.handle('list-cores', async () => {
  try {
    if (!fs.existsSync(PATHS.cores)) return [];
    return fs.readdirSync(PATHS.cores)
      .filter(f => f.endsWith('_libretro.dll'));
  } catch { return []; }
});

// ─── IPC: launch ────────────────────────────────────────────────────────────
// RetroArch launcher
ue20HandleLaunch('launch-retroarch', async (_, { romPath, corePath, systemFolder, extraArgs }) => {
  const retroarchExe = findExe(path.join(PATHS.frontends, 'RetroArch'),'retroarch.exe') || path.join(PATHS.frontends,'RetroArch','retroarch.exe');
  if (!fs.existsSync(retroarchExe)) {
    return { ok: false, error: `RetroArch não encontrado em: ${retroarchExe}` };
  }

  const libraryBios = path.join(PATHS.scanRoms, systemFolder, 'BIOS');
  const biosDir = fs.existsSync(libraryBios) ? libraryBios
    : path.join(PATHS.roms, systemFolder, 'BIOS');
  const saveDir = path.join(PATHS.database, 'UserData', systemFolder, 'Saves');
  const saveStateDir = path.join(PATHS.database, 'UserData', systemFolder, 'Save States');

  [biosDir, saveDir, saveStateDir].forEach(d => { try { fs.mkdirSync(d, { recursive: true }); } catch {} });

  const localCore = ueComponents.coreFile(path.basename(corePath));
  if (!fs.existsSync(localCore)) {
    return {ok: false, error: 'Nucleo ausente: ' + path.basename(localCore)};
  }
  if (systemFolder === '3DO') {
    const check=ue15ThreeDO.inspect({romPath,roots:ue15BiosRoots(romPath)});
    if (!check.ok) {
      log('3DO_PRECHECK',check.error);
      dialog.showMessageBox(mainWindow,{
        type:'warning',title:'3DO - verificacao de BIOS/disco',
        message:'O 3DO nao pode iniciar corretamente.',detail:check.error,
        buttons:['Entendi']
      }).catch(()=>{});
      return {ok:false,error:check.error};
    }
    romPath=check.romPath;
    log('3DO_PRECHECK','BIOS='+check.biosFile+' game='+romPath);
  }
  const args = [
    '--verbose','-L', localCore,
    '--config', ue153PersistentConfig(systemFolder),
    romPath,
    ...(extraArgs || []),
  ];

  // RetroArch 1.19 uses the CLI preset path; video_shader in the config
  // alone is ignored at startup. An empty value explicitly disables presets.
  const graphicsProfile = ue153Lines(fs.readFileSync(args[args.indexOf('--config') + 1], 'utf8'));
  const startupShader = graphicsProfile.get('video_shader_enable') === 'true'
    ? ue6ShaderPath(path.relative(path.join(PATHS.frontends, 'RetroArch', 'shaders'), graphicsProfile.get('video_shader') || '')) : null;
  args.push('--set-shader=' + (startupShader || ''));
  log('SHADER_START', `system=${systemFolder} preset=${startupShader || 'off'}`);

  // State-manager context is deliberately kept outside the ROM tree. This
  // lets the same portable package run from Desktop, USB or an external SSD
  // without asking Windows to write beside the executable.
  ue13ActiveGame = {
    romPath,
    systemFolder,
    corePath:localCore,
    stateRoot: saveStateDir,
    currentSlot: 0,
    stateBase: null,
    manifestPath: ue13StateManifestPath(romPath, systemFolder)
  };
  ue13PendingLoad = null;

  log('LAUNCH', `RetroArch ${path.basename(corePath)} game=${romPath}`);
  // UE154_CHEAT_FIX
  // Registrar todo jogo ativo, mesmo sem correspondencia exata.
  ue153Game = ue153FindGameCheats(romPath,systemFolder) || {
    romPath,
    folder:systemFolder,
    region:ue153Region(romPath),
    matched:null,
    descriptions:[]
  };
  ue153Game = null;
  // Cheats isolados: uma falha nunca cancela o jogo.
  try {
    ue159Game=ue159Engine().prepare(
      romPath,systemFolder,PATHS.frontends,PATHS.database,localCore
    );
  } catch(error) {
    ue159Game=null;
    log('CHEATS_PREPARE_ERROR',String(error));
  }

  if(ue159Game){
    const profile=ue153Lines(fs.readFileSync(args[args.indexOf('--config')+1],'utf8'));
    for(const [k,v] of Object.entries({cheat_database_path:ue159Game.root,apply_cheats_after_toggle:'true',apply_cheats_after_load:'true',network_cmd_enable:'true',network_cmd_port:'55355',cheevos_hardcore_mode_enable:'false',auto_overrides_enable:'false',pause_nonactive:'false'}))profile.set(k,String(v));
    ue153WriteConfig(args[args.indexOf('--config')+1],profile);
  }
  const turboBase=fs.readFileSync(args[args.indexOf('--config')+1],'utf8').split(/\r?\n/);
  args.push('--appendconfig',require('./retroarch-session-turbo.cjs').build(PATHS.database,systemFolder,ue6Options(systemFolder),turboBase));
  const result=await spawnDetached(retroarchExe,args,ueMutableCwd('RetroArch'));

  try {
    ue159Menu();

  } catch(error) {
    log('CHEATS_UI_ERROR',String(error));
  }

  return result;
});

// PCSX2 launcher
ue20HandleLaunch('launch-pcsx2', async (_, options = {}) => {
  // UE_PS2_NULL_OPTIONS_FIX_20261019
  const { romPath } = options || {};
  const exePath = findExe(path.join(PATHS.frontends, 'PCSX2'), 'pcsx2*.exe', 'pcsx2-qt.exe', 'PCSX2.exe');
  if (!exePath) return { ok: false, error: 'PCSX2.exe não encontrado.' };
  const userDir=path.join(PATHS.database,'UserData','PCSX2');
  fs.mkdirSync(userDir,{recursive:true});
  // PCSX2 Qt uses -datapath (not the legacy --cfgpath switch). Keeping all
  // mutable BIOS, memcards, saves and settings under the user data directory
  // avoids write failures when the portable folder is read-only.
  const args = romPath
    ? ['-datapath',userDir,'-batch','--',romPath]
    : ['-datapath',userDir];
  log('LAUNCH', `PCSX2 game=${romPath}`);
  return spawnDetached(exePath, args,ueMutableCwd('PCSX2'));
});

// Dolphin launcher
ue20HandleLaunch('launch-dolphin', async (_, { romPath }) => {
  const exePath = findExe(ueAuditDolphinDir(), 'Dolphin.exe', 'DolphinQt2.exe');
  if (!exePath) return { ok: false, error: 'Dolphin.exe não encontrado.' };
  const runtime = await ueEnsureVCRedist();
  if (!runtime.ok) return runtime;
  const userDir=path.join(PATHS.database,'UserData','Dolphin');
  fs.mkdirSync(userDir,{recursive:true});
  const args = ['--user',userDir,...(romPath ? ['-e', romPath] : [])];
  log('LAUNCH', `Dolphin game=${romPath}`);
  return spawnDetached(exePath, args,ueMutableCwd('Dolphin'));
});

function uePspNativeArgs(romPath) {
  const frontend=path.join(PATHS.frontends,'PPSSPP');
  const oldSaves=path.join(PATHS.roms,'PlayStation Portable','Saves','PPSSPP');
  const memstick=path.join(PATHS.database,'UserData','PPSSPP','memstick');
  fs.mkdirSync(memstick,{recursive:true});
  // Migrate the existing save tree once, without creating a backup copy in
  // the protected emulator folder. PPSSPP's --memstick option is official.
  if(fs.existsSync(oldSaves)){
    try{fs.cpSync(oldSaves,memstick,{recursive:true,force:false,errorOnExist:false})}catch(error){log('PPSSPP_SAVE_MIGRATION',String(error))}
  }
  try{
    const bundledMemstick=path.join(frontend,'memstick');
    if(fs.existsSync(bundledMemstick))fs.cpSync(bundledMemstick,memstick,{recursive:true,force:false,errorOnExist:false});
  }catch(error){log('PPSSPP_SAVE_MIGRATION',String(error))}
  return ['--memstick',memstick,'--graphics=directx11','--windowed',...(romPath?[romPath]:[])];
}
ue20HandleLaunch('launch-ppsspp',async(_,{romPath}={})=>{
  const exe=findExe(path.join(PATHS.frontends,'PPSSPP'),'PPSSPPWindows64.exe','PPSSPPWindows.exe');
  if(!exe)return {ok:false,error:'PPSSPP não encontrado no pacote.'};
  if(romPath&&(!fs.existsSync(romPath)||!['.iso','.cso','.pbp'].includes(path.extname(romPath).toLowerCase())))
    return {ok:false,error:'Jogo PSP não encontrado ou formato inválido.'};
  const args=uePspNativeArgs(romPath);log('LAUNCH','PPSSPP Direct3D11 game='+(romPath||'configuracao'));
  return spawnDetached(exe,args,ueMutableCwd('DuckStation'));
});
// Vita3K launcher
function ueVitaPaths(){
  const root=path.join(PATHS.database,'UserData','Vita3K');
  return {root,config:path.join(root,'config.yml'),data:path.join(root,'data')};
}
function ueVitaPrepare(exePath){
  const paths=ueVitaPaths();
  fs.mkdirSync(paths.root,{recursive:true});
  const bundled=path.join(PATHS.frontends,'Vita3K','config.yml');
  if(!fs.existsSync(paths.config)){
    if(fs.existsSync(bundled))fs.copyFileSync(bundled,paths.config);
    else fs.writeFileSync(paths.config,'pref-path: '+paths.data.replace(/\\/g,'/')+'\nbackend-renderer: Vulkan\naudio-backend: SDL\n','utf8');
  }
  let text=fs.readFileSync(paths.config,'utf8');
  const pref=paths.data.replace(/\\/g,'/');
  if(/^pref-path:\s*.*$/m.test(text))text=text.replace(/^pref-path:\s*.*$/m,'pref-path: '+pref);
  else text+='\npref-path: '+pref+'\n';
  if(/^audio-backend:\s*.*$/m.test(text))text=text.replace(/^audio-backend:\s*.*$/m,'audio-backend: SDL');
  else text+='audio-backend: SDL\n';
  fs.writeFileSync(paths.config,text,'utf8');
  const biosDir=path.join(PATHS.roms,'PlayStation Vita','BIOS');
  let firmware=null;
  try{firmware=fs.readdirSync(biosDir).filter(name=>/\.pup$/i.test(name)).map(name=>path.join(biosDir,name)).filter(file=>fs.statSync(file).size>8*1024*1024).sort((a,b)=>fs.statSync(b).size-fs.statSync(a).size)[0]||null}catch(_){ }
  if(firmware&&!fs.existsSync(path.join(paths.data,'vs0'))){
    try{
      const result=execFileSync(exePath,['--config-location',paths.root,'--firmware',firmware],{cwd:paths.root,windowsHide:true,timeout:300000,encoding:'utf8'});
      log('VITA3K_FIRMWARE','Firmware installed automatically '+path.basename(firmware)+' '+String(result||'').slice(0,300));
    }catch(error){log('VITA3K_FIRMWARE','Automatic firmware install failed: '+String(error?.message||error))}
  }
  return paths;
}
ue20HandleLaunch('launch-vita3k', async (_, { titleId, romPath } = {}) => {
  const exePath = findExe(path.join(PATHS.frontends, 'Vita3K'), 'Vita3K.exe');
  if (!exePath) return { ok: false, error: 'Vita3K.exe não encontrado.' };
  const resolvedId = String(titleId || path.basename(romPath || '').match(/\b([A-Z]{4}\d{5})\b/i)?.[1] || '').toUpperCase();
  if(romPath && !resolvedId)return {ok:false,error:'Não foi possível identificar o ID deste jogo Vita.'};
  const vita=ueVitaPrepare(exePath);
  if(resolvedId){
    if(!/^[A-Z]{4}\d{5}$/.test(resolvedId))return {ok:false,error:'ID de jogo Vita inválido.'};
    if(!fs.existsSync(path.join(vita.data,'ux0','app',resolvedId,'eboot.bin')))
      return {ok:false,error:'Jogo '+resolvedId+' ainda não está instalado no Vita3K. Instale o pacote e sua licença no emulador.'};
  }
  const args = ['--config-location',vita.root,...(resolvedId ? ['-r', resolvedId] : [])];
  log('LAUNCH', `Vita3K titleId=${resolvedId || 'biblioteca'}`);
  return spawnDetached(exePath, args,ueMutableCwd('Vita3K'));
});

// V18: remember the active arcade set so UI changes can be applied immediately.
let ue18ActiveMameSet = null;
// MAME V5 input setup: two independent player keyboards + pads.
ipcMain.handle('ue-mame5-read', () => ({...ue4Mame.load(PATHS.database),defaults:ue4Mame.defaults()}));
ipcMain.handle('ue-mame6-reset-hotkeys', () => { ue4Mame.resetHotkeys(PATHS.database); return {ok:true}; });
ipcMain.handle('ue-mame5-save', (_, settings) => {
  const saved = ue4Mame.save(PATHS.database, settings);
  ue4Mame.ensureConfig(PATHS.database);
  const active=ue18ActiveMameSet;
  if(active)ue4Mame.updateLive(PATHS.database,active);
  log('MAME_INPUT', 'P1/P2 profiles saved'+(active?' and sent to MAME '+active:' for next launch'));
  return {ok:true,settings:saved,livePending:Boolean(active),activeSet:active};
});
ipcMain.handle('ue20-mame-live-status',()=>{
 const active=ue18ActiveMameSet;
 return active?ue4Mame.liveStatus(PATHS.database,active):{running:false,applied:false};
});
// MAME launcher: per-family DualSense layouts, 12:7 only on horizontal drivers.
ue20HandleLaunch('launch-mame', async (_, { setName, romPath }) => {
  const exePath = findExe(PATHS.mame, 'mame.exe', 'mame64.exe');
  if (!exePath) return { ok: false, error: 'mame.exe não encontrado.' };
  try {
    require('./mame-session-turbo.cjs').begin(PATHS.database,setName);
    require('./mame-live-filters.cjs').begin(PATHS.database,setName);
    ueLiveMame=require('./mame-cheats.cjs').preview(romPath || path.join(PATHS.scanRoms,'Arcade - MAME','ROMs',setName+'.zip'),PATHS.mame,PATHS.database);
    const preset=ue4Mame.buildArgs({exe:exePath,setName,romPath,mameRoot:PATHS.mame,romsRoot:PATHS.scanRoms,database:PATHS.database});
    ueMameStateGame=ueMameStateContext(setName,romPath);
    log('LAUNCH', `MAME set=${setName} controls=${preset.profile} vertical=${preset.isVertical} game=${romPath}`);
    // UE_MAME_EXCLUSIVE_FULLSCREEN_20261019
    const ueMameFullscreenArgs = preset.args.filter(arg => !['-window','-w','-maximize','-max','-nowindow'].includes(String(arg).toLowerCase()));
    ueMameFullscreenArgs.unshift('-nowindow');
    log('MAME_VIDEO', 'Fullscreen real forcado com -nowindow.');
    const outcome = await spawnDetached(exePath, ueMameFullscreenArgs, ueMutableCwd('MAME'));
    if(outcome?.ok)ue18ActiveMameSet=setName;
    return outcome;
  } catch(error) { return {ok:false,error:error.message}; }
});

// Open folder
ipcMain.handle('open-folder', async (_, folderPath) => {
  shell.openPath(folderPath);
  return { ok: true };
});

// Select folder dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

// Download core from buildbot
ipcMain.handle('download-core', async (_, coreName) => {
  return downloadCore(coreName);
});

// Check if exe exists
ipcMain.handle('check-exe', async (_, exePath) => fs.existsSync(exePath));

// ─── Helpers ────────────────────────────────────────────────────────────────
function ueAuditDolphinDir() {
  return path.join(PATHS.frontends,'Dolphin-x64');
}

function findExe(dir, ...names) {
  dir=ueComponents.directory(dir);
  for (const name of names) {
    const full = path.join(dir, name);
    if (fs.existsSync(full)) return full;
  }
  // Check subfolders of this frontend only (a 7z often contains an extra root folder).
  if (fs.existsSync(dir)) {
    const stack=[{folder:dir,depth:0}]; let checked=0;
    while(stack.length && checked<400) {
      const node=stack.shift(); let list=[];
      try{list=fs.readdirSync(node.folder,{withFileTypes:true});}catch{continue;}
      for(const f of list){
        if(++checked>400)break;
        const item=path.join(node.folder,f.name);
        if(f.isFile() && f.name.toLowerCase().endsWith('.exe') &&
           names.some(n=>n.includes('*')?new RegExp('^'+n.split('*').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$','i').test(f.name):f.name.toLowerCase()===n.toLowerCase()))return item;
        if(f.isDirectory() && node.depth<3)stack.push({folder:item,depth:node.depth+1});
      }
    }
  }
  return null;
}

let activeEmulator = null;
let ue13ActiveGame = null;
let ue13PendingLoad = null;
let ueMameStateGame = null;
function ueMutableCwd(name) {
  const dir = path.join(PATHS.database, 'UserData', String(name || 'Launcher'));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function ueStateSessionChanged(running) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('ue-game-session', {running});
}
function ueStartStateInput(proc, mode = 'managed') {
  const exe = path.join(PATHS.runtime, 'StateInput', 'StateInput.exe');
  const child = spawn(exe, [path.join(PATHS.frontends, 'RetroArch'), String(proc.pid), mode, String(process.pid)],
    {windowsHide:true, stdio:['pipe','pipe','pipe']});
  proc.ueStateInput=child;
  child.stdin.on('error',error=>log('STATE_INPUT_ERROR',String(error)));
  child.once('exit',()=>{if(proc.ueStateInput===child)proc.ueStateInput=null;});
  let pending = '';
  child.stdout.on('data', data => {
    pending += data.toString();
    const lines = pending.split(/\r?\n/); pending = lines.pop();
    for (const line of lines) {
      log('STATE_INPUT', line);
      if(line === 'ACTION OPEN_PANEL' && activeEmulator === proc && !ue13PendingLoad){
        ueLiveTools.toggle().catch(error=>log('LIVE_PANEL_ERROR',String(error)));
        continue;
      }
      const action = /^ACTION (SAVE_STATE|LOAD_STATE)$/.exec(line)?.[1];
      if (action && activeEmulator === proc && !ue13PendingLoad) {
        const run = mode === 'mame' ? ueMameStateAction(action) : ue13StateAction(action);
        run.then(result => {
          if (!result.ok) log('STATE_ERROR', result.error);
        }).catch(error => log('STATE_ERROR', String(error)));
      }
    }
  });
  child.stderr.on('data', data => log('STATE_INPUT_ERROR', String(data).slice(0,1000)));
  child.on('error', error => log('STATE_INPUT_ERROR', String(error)));
  child.on('exit', code => log('STATE_INPUT_EXIT', String(code)));
  proc.once('exit', () => {if(child.exitCode === null) child.kill();});
}
async function spawnDetached(exe, args, cwd) {
  const isDuckStation = /duckstation.*\.exe$/i.test(exe);
  require('./portable-settings.cjs').configure(PATHS.frontends,PATHS.scanRoms,exe,path.join(PATHS.database,'UserData'));
  // All bundled emulators keep their own state bindings. Do not start the
  // external memory-hotkey helper: Controlled Folder Access can flag its
  // process-memory writes as an unauthorized modification.
  const isRetroArch = /retroarch\.exe$/i.test(exe);
  if(isRetroArch){const fix=require('./retroarch-cheat-osd.cjs').ensure(exe);log('CHEAT_OSD_FIX',JSON.stringify(fix));}

  return new Promise(resolve => {
    let settled = false;
    let startupFallback = null;
    const finish = result => {
      if (settled) return;
      settled = true;
      if (startupFallback) clearTimeout(startupFallback);
      resolve(result);
    };
    const env = isDuckStation
      ? {...process.env, LOCALAPPDATA:path.join(PATHS.database,'UserData')}
      : process.env;
    const proc = spawn(exe, args, { stdio: ['ignore', 'pipe', 'pipe'], cwd: cwd || path.dirname(exe), env });
    // Some standalone Windows builds do not deliver Node's spawn event
    // reliably when their GUI creates a second process. Do not leave the
    // renderer's loading dialog open forever when the emulator is running.
    startupFallback = setTimeout(() => {
      if (proc.exitCode === null) finish({ok:true,pid:proc.pid,delayed:true});
    }, 3500);
    activeEmulator = proc;
    ueStateSessionChanged(true);
    if (isRetroArch) {
      ue153RefreshMenu();
      ue153RegisterTab();
      // The launcher owns save/load shortcuts so LOAD_STATE can open the
      // chooser instead of silently loading the current RetroArch slot.
      ue13StartHotkeys();
      ueStartStateInput(proc);
    }
    if(isRetroArch || /mame(?:64)?\.exe$/i.test(exe)){
      ueLiveTools.bind();
      if(!isRetroArch)ueStartStateInput(proc, 'mame');
    }
    // Teclas 1/4 tratadas pelo RetroArch, sem duplicacao global.
    if (/retroarch\.exe$/i.test(exe)) ue7RegisterFullscreen();
    for (const stream of [proc.stdout, proc.stderr]) stream.on('data', data => {
      const text=data.toString();log('EMULATOR',text.slice(0,6000));
      if(/retroarch\.exe$/i.test(exe)){
        ue159Engine().observe(ue159Game,text);ue13ObserveStateSlot(ue13ActiveGame,text);
        if(ue13ActiveGame?.corePath&&/Failed to (?:open|load).*?(?:libretro|core)|Error opening libretro/i.test(text))ueComponents.failed(path.basename(ue13ActiveGame.corePath),'O RetroArch não conseguiu carregar este core. Selecione uma pasta com uma DLL compatível.');
      }
    });
    proc.on('error', error => { activeEmulator = null; ueStateSessionChanged(false); finish({ok: false, error: error.message}); });
    proc.on('exit', (code, signal) => {
      if (activeEmulator === proc) { activeEmulator = null; ueLiveTools.stop(); ueLiveMame=null; ueStateSessionChanged(false); }
      if (/mame(?:64)?\.exe$/i.test(exe)) {if(ue18ActiveMameSet)require('./mame-session-turbo.cjs').end(PATHS.database,ue18ActiveMameSet);ue18ActiveMameSet=null;ueMameStateGame=null;ue13PendingLoad=null;}
      if (/retroarch\.exe$/i.test(exe)) {
        ue7UnregisterFullscreen();
        ue13StopHotkeys();
        ue13PendingLoad = null;
        ue13ActiveGame = null;
      }
      log('EMULATOR_EXIT', `${path.basename(exe)} code=${code} signal=${signal}`);
      finish({ok: false, error: `O emulador encerrou durante a abertura (código ${code}). Consulte EMULADOR.log.`});
    });
    proc.on('spawn', () => setTimeout(() => finish({ok: true, pid: proc.pid}), 1800));
  });
}

let ueVcRedistPromise = null;
async function ueEnsureVCRedist() {
  if (process.platform !== 'win32') return {ok:true};
  const systemDir = process.env.WINDIR || 'C:\\Windows';
  const runtimeReady = () =>
    fs.existsSync(path.join(systemDir,'System32','vcruntime140_1.dll')) &&
    fs.existsSync(path.join(systemDir,'System32','msvcp140.dll'));
  if (runtimeReady()) return {ok:true,already:true};

  const installer = path.join(PATHS.frontends,'Dolphin-x64','vc_redist.x64.exe');
  if (!fs.existsSync(installer)) {
    return {ok:false,error:'Microsoft Visual C++ Runtime x64 não encontrado no pacote.'};
  }
  if (!ueVcRedistPromise) {
    ueVcRedistPromise = new Promise(resolve => {
      log('DEPENDENCY','Instalando Microsoft Visual C++ Runtime x64 do pacote.');
      execFile(installer,['/install','/quiet','/norestart'],{windowsHide:true},() => {
        setTimeout(() => resolve(runtimeReady()
          ? {ok:true,installed:true}
          : {ok:false,error:'O Microsoft Visual C++ Runtime x64 não pôde ser instalado.'}), 800);
      });
    });
  }
  return ueVcRedistPromise;
}

function buildRetroArchConfig(systemFolder) {
  const opt = ue6Options(systemFolder);
  const isNintendoDS = systemFolder === 'NintendoDS';
  // Handhelds are opened in a portrait window.  The core continues to choose
  // its native image proportion, so GBA games are never stretched just to
  // fill a tall window and the DS can show its two screens one above another.
  const isPortraitHandheld = ['GameBoy','GameBoyColor','GameBoyAdvance','NintendoDS']
    .includes(systemFolder);
  const effectiveAspect = '16:9';
  // VM-friendly buffer: set per system; do not keep old undersized manual settings.
  const effectiveLatency = [128,192,256].includes(Number(opt.latency)) ? Number(opt.latency) : 192; // VM-friendly fixed buffer, no small/stale buffers
    // UE_DUALSENSE_TOUCHPAD_HOLD_V5_20261019
  // XInput nao expoe o clique do touchpad como botao independente. Para DualSense conhecido,
  // usar SDL2, cujo botao de touchpad e o indice SDL_CONTROLLER_BUTTON_TOUCHPAD (20).
  const ueTouchPadDevice = ue9ReadDevice();
  const ueTouchPadIdentity = String(ueTouchPadDevice && ueTouchPadDevice.id || '') + ' ' +
    String(ueTouchPadDevice && ueTouchPadDevice.profile || '');
  const ueTouchPadIsDualSense = /dual.?sense|dual.?shock|playstation.?5|ps5/i.test(ueTouchPadIdentity) ||
    /vendor:\s*(?:054c|1356)(?:\D|$)/i.test(ueTouchPadIdentity);
  let joypadDriver = 'sdl2'; // Shared DualSense-compatible controller mapping.
  if (ueTouchPadIsDualSense && (!opt.driver || opt.driver === 'auto' || opt.driver === 'xinput')) {
    joypadDriver = 'sdl2';
  }
  const defaults = ue8AutoKeyboard(systemFolder);
  const previous = opt.keys || {};
  opt.keys = {...defaults};
  for (const [action,key] of Object.entries(previous)) {
    if ((Object.prototype.hasOwnProperty.call(defaults,action)||/^[lr]_[xy]_(?:minus|plus)$/.test(action)) &&
        typeof key === 'string' &&
        /^(?:[a-z0-9]{1,12}|rshift|lshift|enter|up|down|left|right)$/.test(key) &&
        !['dead','meta','control','alt'].includes(key)) {
      opt.keys[action] = key;
    }
  }
  const dataRoot = path.join(PATHS.database,'UserData',systemFolder);

  // Runtime data must never be written beside the portable installation.
  // Desktop/Documents may be protected by Windows Controlled Folder Access;
  // keeping saves and states in AppData also makes the package relocatable.
  const saves = path.join(dataRoot,'Saves');
  const states = path.join(dataRoot,'Save States');
  for(const dir of [saves,states]) fs.mkdirSync(dir,{recursive:true});

  // All RetroArch-generated folders live in AppData. The ROM/BIOS tree stays
  // a portable read-only source, so launching a game never asks Windows to
  // authorize writes inside Desktop or an external drive.
  const portablePaths = ueAuditPortableRetroArchPaths();
  for(const key of ['assets_directory','audio_filter_dir','video_filter_dir',
    'content_database_path','core_assets_directory','dynamic_wallpapers_directory',
    'osk_overlay_directory','overlay_directory','recording_config_directory',
    'rgui_config_directory','thumbnails_directory','log_dir','playlist_directory',
    'recording_output_directory','screenshot_directory']) {
    if(portablePaths[key]) fs.mkdirSync(portablePaths[key],{recursive:true});
  }

  const libraryBios = path.join(PATHS.scanRoms,systemFolder,'BIOS');
  let bios = fs.existsSync(libraryBios) ? libraryBios
    : path.join(PATHS.roms,systemFolder,'BIOS');
  if(systemFolder === '3DO') {
    const found=ue15ThreeDO.locateBios(ue15BiosRoots());
    if(found.ok)bios=found.folder;
  }

  const q = value=>String(value).replace(/\\/g,'/').replace(/"/g,'');

  const cfg = [
    'video_fullscreen = "false"',
    `video_windowed_fullscreen = "${isPortraitHandheld ? 'false' : 'true'}"`,
    `video_window_width = "${isPortraitHandheld ? '720' : '960'}"`,
    `video_window_height = "${isPortraitHandheld ? '960' : '720'}"`,
    'video_scale_integer = "false"',
    'video_driver = "d3d11"',
    'video_smooth = "true"',
    'video_force_aspect = "true"',
    'video_vsync = "true"',
    'video_threaded = "false"',
    'video_max_swapchain_images = "3"',
    'audio_driver = "sdl2"',
    'audio_device = ""',
    'audio_enable = "true"',
    'audio_mute_enable = "false"',
    'audio_wasapi_exclusive_mode = "false"',
    'audio_out_rate = "48000"',
    `audio_latency = "${effectiveLatency}"`,
    'audio_sync = "true"',
    'audio_rate_control = "true"',
    'audio_rate_control_delta = "0.010"',
    'audio_max_timing_skew = "0.050"',
    'video_frame_delay = "0"',
    'run_ahead_enabled = "false"',
    'rewind_enable = "false"',
    'input_autodetect_enable = "true"',
    // Per-console explicit physical binds should not be overridden by stale .rmp remaps.
    // Keep RetroArch's plug-and-play detection for unspecified buttons.
    'input_remap_binds_enable = "true"',
    'auto_remaps_enable = "true"',
    'remap_save_on_exit = "false"',
    `input_remapping_directory = "${q(path.join(PATHS.database,'UserData','Remaps-Isolados',systemFolder))}"`,
    `input_player1_joypad_index = "${Number.isInteger(opt.joypadIndex) ? opt.joypadIndex : 0}"`,
    `input_player2_joypad_index = "${Number.isInteger(opt.joypadIndexP2) ? opt.joypadIndexP2 : 1}"`,
    'input_player1_analog_dpad_mode = "0"',
    'input_player2_analog_dpad_mode = "0"',
    `input_joypad_driver = "${joypadDriver}"`,
    // Save/load are handled by the launcher so loading can open the
    // thumbnail chooser. RetroArch still receives the actual state command
    // through the network control interface.
    'input_save_state = "nul"',
    'input_load_state = "nul"',
    'state_slot = "0"',
    'savestate_auto_index = "false"',
    'savestate_max_keep = "15"',
    'savestate_thumbnail_enable = "true"',
    'network_cmd_enable = "true"',
    'network_cmd_port = "55355"',
    'config_save_on_exit = "false"',
    `savefile_directory = "${q(saves)}"`,
    `savestate_directory = "${q(states)}"`,
    `system_directory = "${q(bios)}"`,
    `joypad_autoconfig_dir = "${q(path.join(PATHS.frontends,'RetroArch','autoconfig'))}"`,
    `video_shader_dir = "${q(path.join(PATHS.frontends,'RetroArch','shaders'))}"`,
    ...Object.entries(portablePaths).map(([key,value])=>`${key} = "${q(value)}"`)
  ];
  // RetroArch index 1 selects 16:9; 22 selects the core-provided aspect.
  // Portrait handhelds must preserve the original LCD proportion inside their
  // tall window (Game Boy, Color, Advance and two-screen Nintendo DS).
  if (isPortraitHandheld) {
    cfg.push('aspect_ratio_index = "22"');
    cfg.push('video_aspect_ratio_auto = "true"');
  } else {
    cfg.push('aspect_ratio_index = "1"');
    cfg.push('video_aspect_ratio_auto = "false"');
    cfg.push('video_aspect_ratio = "1.777778"');
  }
  const allowed = new Set([
    'up','down','left','right','a','b','x','y',
    'start','select','l','r','l2','r2','l3','r3',
    'l_x_minus','l_x_plus','l_y_minus','l_y_plus',
    'r_x_minus','r_x_plus','r_y_minus','r_y_plus'
  ]);
  for(const [action,key] of Object.entries(opt.keys || {})) {
    if(allowed.has(action) && /^[a-z0-9_]+$/i.test(String(key)))
      cfg.push(`input_player1_${action} = "${key}"`);
  }
  for(const [action,index] of Object.entries(opt.buttons || {})) {
    if(allowed.has(action) && /^(?:nul|\d{1,2}|h\d+(?:up|down|left|right))$/i.test(String(index)))
      { cfg.push(`input_player1_${action}_axis = "nul"`); cfg.push(`input_player1_${action}_btn = "${index}"`); }
  }

  // SMAA if installed; otherwise the fast UE antialiasing shader shipped with V12.
  // Explicit off remains off; an invalid old path must not silently disable AA.
  const defaultSMAA = 'shaders_slang/anti-aliasing/smaa.slangp';
  const defaultFastAA = 'shaders_slang/anti-aliasing/ue-fast-aa.slangp';
  // The preset alone is not enough: SMAA needs 3 passes, textures and stock.slang.
  const smaaRoot=path.join(PATHS.frontends,'RetroArch','shaders','shaders_slang','anti-aliasing');
  const smaaParts=['smaa.slangp','../stock.slang','shaders/smaa/smaa-pass0.slang',
    'shaders/smaa/smaa-pass1.slang','shaders/smaa/smaa-pass2.slang',
    'shaders/smaa/AreaTex.png','shaders/smaa/SearchTex.png'];
  const smaaReady=smaaParts.every(x=>fs.existsSync(path.resolve(smaaRoot,x)));
  const availableDefault = smaaReady ? defaultSMAA :
    (ue6ShaderPath(defaultFastAA) ? defaultFastAA : '');
  const chosenShader = opt.shader === 'off' ? '' :
    ((opt.shader===defaultSMAA&&!smaaReady)?availableDefault:
     (ue6ShaderPath(opt.shader) ? opt.shader : availableDefault));
  // Custom axis bindings coexist with keyboard; all other joypad controls use autodetect.
  for(const [player,suffix] of [[1,''],[2,'P2']]) {
    const axes = (suffix ? opt.axesP2 : opt.axes) || {};
    for(const [action,axis] of Object.entries(axes)) {
      if(allowed.has(action) && /^(?:nul|[+-]\d{1,2})$/.test(String(axis)))
        { cfg.push(`input_player${player}_${action}_btn = "nul"`); cfg.push(`input_player${player}_${action}_axis = "${axis}"`); }
    }
    if(player!==2)continue;
    const keys = opt.keysP2 || {};
    const buttons = opt.buttonsP2 || {};
    for(const [action,key] of Object.entries(keys)) {
      if(allowed.has(action) && /^(?:[a-z0-9]{1,12}|rshift|lshift|enter|up|down|left|right)$/.test(String(key)))
        cfg.push(`input_player2_${action} = "${key}"`);
    }
    for(const [action,value] of Object.entries(buttons)) {
      if(allowed.has(action) && /^(?:nul|\d{1,3}|h\d+(?:up|down|left|right))$/.test(String(value)))
        { cfg.push(`input_player2_${action}_axis = "nul"`); cfg.push(`input_player2_${action}_btn = "${value}"`); }
    }
  }

  // The original monochrome Game Boy is the only system that receives the
  // green DMG LCD treatment.  Color, Advance and every other core keep the
  // player's selected shader untouched.
  const gameBoyDmgShader = 'shaders_slang/handheld/gb-palette-dmg.slangp';
  const shader = ue6ShaderPath(systemFolder === 'GameBoy' ? gameBoyDmgShader : chosenShader);
  if(shader) {
    cfg.push('video_shader_enable = "true"');
    cfg.push(`video_shader = "${q(shader)}"`);
  } else {
    cfg.push('video_shader_enable = "false"');
  }

  // UE_PATCH_147: teclas globais do RetroArch
  const shortcuts = {
    input_pause_toggle: 'p',
    input_hold_fast_forward: 'space',
    input_toggle_fast_forward: 'nul',
    input_save_state: 'num1',
    input_load_state: 'num4',
    input_reset: 'nul',
    input_reset_btn: 'nul',
    input_toggle_fullscreen: 'f11',
    input_grab_mouse_toggle: 'nul',
    input_enable_hotkey: 'nul'
  };

  for (const [key,value] of Object.entries(shortcuts)) {
    const line = `${key} = "${value}"`;
    const index = cfg.findIndex(x => x.startsWith(key + ' = '));
    if (index >= 0) cfg[index] = line;
    else cfg.push(line);
  }

  // O DualSense chega ao Windows ARM do Parallels como controle XInput.
  // Nesse caminho, o clique do touchpad e exposto como o botao Guide (10).
  // Mantemos o atalho em modo hold: pressionou acelera, soltou normaliza.
  // UE_DUALSENSE_STATE_TOUCHPAD_REPAIR_20261019
  // Resolve a touchpad-labelled button from the active driver's autoconfig file.
  // The autoconfig helper returns { file, get, score }, not a Map; read its file.
  let fastForwardButton = '';
  const ueFfRequested = String(opt.fastForwardButton || '').trim();
  if (/^\d{1,3}$/.test(ueFfRequested)) fastForwardButton = ueFfRequested;

  const ueFfDevice = ue9ReadDevice();
  let ueFfProfile = null;
  let ueFfProfileText = '';
  if (ueFfDevice && ueFfDevice.id) {
    try {
      ueFfProfile = ue9Profile(ueFfDevice.id, joypadDriver);
      if (ueFfProfile && ueFfProfile.file) {
        ueFfProfileText = fs.readFileSync(
          path.join(PATHS.frontends, 'RetroArch', 'autoconfig', String(joypadDriver), ueFfProfile.file),
          'utf8'
        );
      }
    } catch (_) { ueFfProfile = null; ueFfProfileText = ''; }
  }

  let ueFfTouchButton = '';
  if (ueFfProfile && ueFfProfileText) {
    const ueFfLabel = /^\s*(input_[a-z0-9_]+)_label\s*=\s*"([^"]*(?:touch\s*pad|touchpad|trackpad)[^"]*)"/im.exec(ueFfProfileText);
    if (ueFfLabel) {
      const ueFfValue = ueFfProfile.get(ueFfLabel[1]);
      if (/^\d{1,3}$/.test(String(ueFfValue || ''))) ueFfTouchButton = String(ueFfValue);
    }
  }

  let ueFfIdentity = '';
  let ueFfSelectLabel = '';
  try {
    ueFfIdentity = String(ueFfDevice && ueFfDevice.id || '') + ' ' +
      String(ueFfProfile ? ueFfProfile.get('input_device_display_name') : '') + ' ' +
      String(ueFfProfile ? ueFfProfile.get('input_device') : '');
    ueFfSelectLabel = ueFfProfile ? String(ueFfProfile.get('input_select_btn_label') || '') : '';
  } catch (_) {}
  const ueFfIsSony = /dual.?sense|dual.?shock|ps5|sony/i.test(ueFfIdentity);
  // opt.fastForwardButton defaults to 10; let a named touchpad profile override that fallback.
  if (ueFfTouchButton && (!ueFfRequested || ['10', '5'].includes(ueFfRequested))) fastForwardButton = ueFfTouchButton;
  // DirectInput's extra DualSense touchpad-click button is not available through
  // XInput. Use the documented driver-specific index only for a recognized Sony profile.
  if ((!fastForwardButton || ['10', '5'].includes(fastForwardButton)) && ueFfIsSony && /dinput|directinput/i.test(String(joypadDriver)) && /^(create|share)$/i.test(ueFfSelectLabel)) {
    fastForwardButton = '13';
  }
  if ((!fastForwardButton || ['10', '5'].includes(fastForwardButton)) && ueFfIsSony && /sdl2|sdl3/i.test(String(joypadDriver))) {
    fastForwardButton = '20';
  }
  // Keep the existing fallback for other devices. XInput does not expose a
  // distinct touchpad control; 10 works only if the virtualization layer maps it there.
  if (!fastForwardButton) fastForwardButton = String(joypadDriver).toLowerCase() === 'sdl2' ? '5' : '10';
  cfg.push(`input_hold_fast_forward_btn = "${fastForwardButton}"`);
  cfg.push('input_menu_toggle_btn = "nul"');
  log('FAST_FORWARD_BINDING',
      `driver=${joypadDriver} device=${ueFfIdentity.slice(0,180)} ` +
      `profile=${ueFfProfile ? ueFfProfile.file : 'none'} touchpad=${ueFfTouchButton || 'not-labelled'} button=${fastForwardButton}`);

  // UE149: nao usar indices fixos do joystick.
  // Atalhos fisicos so serao habilitados com perfil identificado.
  const pad = ue9ReadDevice();
  cfg.push(`input_save_state_btn = "${pad ? pad.l3 : 'nul'}"`);
  cfg.push(`input_load_state_btn = "${pad ? pad.r3 : 'nul'}"`);
  cfg.push('video_font_enable = "true"');

  // UE150_STATES_FIX
  // Remove valores anteriores e possiveis conflitos de hotkeys.
  for (let i = cfg.length - 1; i >= 0; i--) {
    if (/^input_(save_state|load_state|enable_hotkey)(?:_btn)?\s*=/.test(cfg[i]) ||
        /^notification_show_(save_state|screenshot)\s*=/.test(cfg[i]) ||
        /^video_font_size\s*=/.test(cfg[i]) ||
        /^cheevos_hardcore_mode_enable\s*=/.test(cfg[i])) {
      cfg.splice(i, 1);
    }
  }

  cfg.push('input_enable_hotkey = "nul"');
  cfg.push('input_enable_hotkey_btn = "nul"');
  cfg.push('input_save_state = "num1"');
  cfg.push('input_load_state = "num4"');
  cfg.push('input_save_state_btn = "nul"');
  cfg.push('input_load_state_btn = "nul"');

  // Mensagens nativas do RetroArch para salvar/carregar.
  cfg.push('video_font_enable = "true"');
  cfg.push('video_font_size = "16.000000"');
  cfg.push('pause_nonactive = "false"');
  cfg.push('notification_show_save_state = "false"');
  cfg.push('notification_show_screenshot = "false"');
  cfg.push('video_message_pos_x = "0.020000"');
  cfg.push('video_message_pos_y = "0.940000"');

  // Hardcore impede carregar estados. Desativar somente nesta sessao.
  cfg.push('cheevos_hardcore_mode_enable = "false"');

  // Ativa os atalhos fisicos apenas com perfil validado.
  const device = ue9ReadDevice();

  if (device &&
      /^\d{1,3}$/.test(String(device.l3)) &&
      /^\d{1,3}$/.test(String(device.r3)) &&
      device.l3 !== device.r3) {

    cfg.push(`input_save_state_btn = "${device.l3}"`);
    cfg.push(`input_load_state_btn = "${device.r3}"`);
  }

  if (systemFolder === '3DO') {
    // V16: respeitar proporcao escolhida no editor (16:9 por padrao).
    // V15 sobrescrevia 16:9 com 4:3 na ultima linha da config.
    cfg.push('global_core_options = "true"');
    cfg.push('game_specific_options = "false"');
    cfg.push('video_window_width = "1280"');
    cfg.push('video_window_height = "720"');
  }

  // UE_PS1_CORE_FIX_20261014
  if (systemFolder === 'PlayStation 1') {
    // Permite usar core_options_path em vez de ignorar
    // o arquivo de opcoes personalizado.
    cfg.push('global_core_options = "true"');

    // Impede que um arquivo .opt antigo do jogo
    // substitua silenciosamente a resolucao escolhida.
    cfg.push('game_specific_options = "false"');

    // O upscaling do SwanStation precisa de GPU por hardware.
    cfg.push('video_driver = "d3d11"');

    // Perfil de audio conservador para o Parallels.
    cfg.push('audio_latency = "256"');
    cfg.push('audio_rate_control = "true"');

    log('PS1_CONFIG',
      'D3D11 solicitado; escala interna=' +
      String(opt.internalScale || 2) + 'x');
  }

  // UE1414_CORRECTION: identificar os nucleos e suas capacidades.
  const ue14Info = path.join(PATHS.frontends,'RetroArch','info');

  cfg.push(`libretro_directory = "${q(PATHS.cores)}"`);
  cfg.push(`libretro_info_path = "${q(ue14Info)}"`);

  // SwanStation suporta Save States; evita bloqueio por metadados
  // antigos ou nao detectados. Nao interfere no upscaling do PS1.
  if (systemFolder === 'PlayStation 1') {
    cfg.push('core_info_savestate_bypass = "true"');
  }

  // UE152_MENU_FEATURES
  // Tab abre o menu RetroArch, pausando o nucleo.
  cfg.push('input_menu_toggle = "tab"');
  cfg.push('menu_pause_libretro = "true"');

  cfg.push(`cheat_database_path = "${q(path.join(PATHS.frontends,'RetroArch','cheats'))}"`);
  cfg.push('apply_cheats_after_toggle = "true"');

  const coreOptions = ue11CoreOptions(systemFolder,opt);
  if(coreOptions) {
    cfg.push(`core_options_path = "${q(coreOptions)}"`);
    // Keep every core's mutable options in the AppData file above. Without
    // this flag RetroArch falls back to Runtime\Frontends\RetroArch\config
    // and writes <core>.opt beside the protected portable installation.
    cfg.push('global_core_options = "true"');
    cfg.push('game_specific_options = "false"');
  }

  // UE_V13_STATES: L3 salva, R3 carrega; apenas esta ultima configuracao e efetiva.
  // Remove duplicatas introduzidas pelos patches anteriores.
  for (let i = cfg.length - 1; i >= 0; i--) {
    if (/^input_(?:save_state|load_state|enable_hotkey)(?:_btn)?\s*=/.test(cfg[i])) {
      cfg.splice(i,1);
    }
  }

  cfg.push('input_enable_hotkey = "nul"');
  cfg.push('input_enable_hotkey_btn = "nul"');
  cfg.push('input_save_state = "num1"');
  cfg.push('input_load_state = "num4"');

  // Cheats use NetCMD from the launcher; gameplay keys must not select/toggle codes.
  for (const action of ['cheat_index_minus','cheat_index_plus','cheat_toggle','frame_advance']) {
    for (const suffix of ['', '_btn', '_axis', '_mbtn']) {
      const key='input_'+action+suffix;
      for(let i=cfg.length-1;i>=0;i--)if(cfg[i].startsWith(key+' ='))cfg.splice(i,1);
      cfg.push(key+' = "nul"');
    }
  }

  let ue13L3 = null;
  let ue13R3 = null;

  // UE151_PROFILE_SAFE_STATES: only use a verified profile and never overlap Start/Option.
  const detected = ue9ReadDevice();
  if (detected && detected.driver === joypadDriver) {
    const profile = ue9Profile(detected.id, detected.driver);
    const profileL3 = profile ? profile.get('input_l3_btn') : '';
    const profileR3 = profile ? profile.get('input_r3_btn') : '';
    const profileStart = profile ? profile.get('input_start_btn') : '';
    const validButton = value => /^\d{1,3}$/.test(String(value));

    if (profile &&
        validButton(profileL3) && validButton(profileR3) && validButton(profileStart) &&
        String(detected.l3) === profileL3 &&
        String(detected.r3) === profileR3 &&
        profileL3 !== profileR3 &&
        profileL3 !== profileStart &&
        profileR3 !== profileStart) {
      ue13L3 = profileL3;
      ue13R3 = profileR3;
    }
  }

  // UE_DUALSENSE_STATE_REPAIR_20261019
  // Default indices from the bundled RetroArch autoconfig profiles.
  if (!ue13L3 || !ue13R3) {
    const ueStateFallbacks = {
      xinput: { l3: '8', r3: '9', start: '6', select: '7' },
      dinput: { l3: '10', r3: '11', start: '9', select: '8' },
      sdl2: { l3: '7', r3: '8', start: '6', select: '4' },
      hid: { l3: '14', r3: '15', start: '3', select: '2' }
    };
    const ueStateFallback = ueStateFallbacks[String(joypadDriver || '').toLowerCase()];
    if (ueStateFallback &&
        ueStateFallback.l3 !== ueStateFallback.r3 &&
        ueStateFallback.l3 !== ueStateFallback.start &&
        ueStateFallback.r3 !== ueStateFallback.start &&
        ueStateFallback.l3 !== ueStateFallback.select &&
        ueStateFallback.r3 !== ueStateFallback.select) {
      ue13L3 = ueStateFallback.l3;
      ue13R3 = ueStateFallback.r3;
    }
  }
  cfg.push(`input_save_state_btn = "${ue13L3 || 'nul'}"`);
  cfg.push(`input_load_state_btn = "${ue13R3 || 'nul'}"`);

  cfg.push('pause_nonactive = "false"');
  cfg.push('notification_show_save_state = "false"');
  cfg.push('notification_show_screenshot = "false"');
  cfg.push('video_font_size = "16.000000"');
  cfg.push('video_message_pos_x = "0.020000"');
  cfg.push('video_message_pos_y = "0.940000"');
  cfg.push('video_font_enable = "true"');

  cfg.push('network_cmd_enable = "true"');
  cfg.push('network_cmd_port = "55355"');

  log('STATE_BINDINGS',
      `system=${systemFolder} driver=${joypadDriver} ` +
      `keyboard=1/4 (+7/9) save=L3:${ue13L3 || 'off'} load=R3:${ue13R3 || 'off'}`);

  // Rebase inherited RetroArch paths on every launch after moving the package.
  for (const [key,value] of Object.entries(ueAuditPortableRetroArchPaths())) {
    cfg.push(`${key} = "${q(value)}"`);
  }
  // UE_DUALSENSE_TOUCHPAD_HOLD_V5_20261019
  // Normalize the final config after all legacy settings. SDL2 button 20 is the held DualSense touchpad click.
  if (ueTouchPadIsDualSense && joypadDriver === 'sdl2') {
    const ueTouchFinalKeys = new Set([
      'input_joypad_driver',
      'input_hold_fast_forward_btn',
      'input_save_state_btn',
      'input_load_state_btn'
    ]);
    for (let i = cfg.length - 1; i >= 0; i--) {
      const ueLineKey = /^\s*([a-z0-9_]+)\s*=/.exec(cfg[i]);
      if (ueLineKey && ueTouchFinalKeys.has(ueLineKey[1])) cfg.splice(i, 1);
    }
    cfg.push('input_joypad_driver = "sdl2"');
    cfg.push('input_hold_fast_forward = "space"');
    cfg.push('input_hold_fast_forward_btn = "20"');
    // SDL2 DualSense profile: L3 button 7 saves; R3 button 8 loads.
    cfg.push('input_save_state_btn = "7"');
    cfg.push('input_load_state_btn = "8"');
  }
  // UE_NES_FACEBUTTONS_NO_TURBO_20261019
  // Nestopia maps RetroPad X/Y to Turbo A/B. For NES only, use explicit XInput binds
  // so Square/Triangle are unbound while Cross/Circle and the D-pad keep working.
  if (systemFolder === 'Nintendo 8 Bits') {
    const ueNesManualBinds = {
      input_autodetect_enable: 'false',
      input_player1_up_btn: '11',
      input_player1_down_btn: '12',
      input_player1_left_btn: '13',
      input_player1_right_btn: '14',
      input_player1_a_btn: '0',
      input_player1_b_btn: '1',
      input_player1_x_btn: 'nul',
      input_player1_y_btn: 'nul',
      input_player1_x_axis: 'nul',
      input_player1_y_axis: 'nul',
      input_player1_start_btn: '6',
      input_player1_select_btn: '4',
      input_player1_l_btn: '9',
      input_player1_r_btn: '10',
      input_player1_l2_btn: 'nul',
      input_player1_r2_btn: 'nul',
      input_player1_l3_btn: 'nul',
      input_player1_r3_btn: 'nul'
    };
    for (const [key, value] of Object.entries(ueNesManualBinds)) {
      for (let i = cfg.length - 1; i >= 0; i--) {
        if (cfg[i].startsWith(key + ' =')) cfg.splice(i, 1);
      }
      cfg.push(`${key} = "${value}"`);
    }
  }
  // Apply hotkeys once, after legacy overrides; native hold actions stop on release.
  const finalHotkeys=require('./retroarch-hotkeys.cjs').apply(require('./retroarch-controls.cjs').apply(cfg,opt,systemFolder));
  cfg.splice(0,cfg.length,...finalHotkeys);
  // retroarch-hotkeys is shared by older profiles and restores the native
  // 1/4 bindings. Override them here for the state manager, which owns the
  // 15-slot rotation and the load dialog.
  for (let i = cfg.length - 1; i >= 0; i--) {
    const key = /^\s*([a-z0-9_]+)\s*=/.exec(cfg[i])?.[1];
    if (key && ['input_save_state','input_load_state','input_save_state_btn',
      'input_load_state_btn','state_slot','savestate_auto_index',
      'input_exit_emulator_btn','input_exit_emulator_axis','input_exit_emulator_mbtn',
      'input_state_slot_increase','input_state_slot_decrease',
      'input_state_slot_increase_btn','input_state_slot_decrease_btn',
      'input_state_slot_increase_axis','input_state_slot_decrease_axis',
      'input_state_slot_increase_mbtn','input_state_slot_decrease_mbtn',
      'notification_show_save_state','notification_show_screenshot',
      'notification_show_state_slot',
      'video_font_enable','video_font_size','pause_nonactive'].includes(key)) {
      cfg.splice(i,1);
    }
  }
  cfg.push('input_save_state = "nul"');
  cfg.push('input_load_state = "nul"');
  cfg.push('input_save_state_btn = "nul"');
  cfg.push('input_load_state_btn = "nul"');
  // Sair continua sendo apenas pela tecla Escape. Nenhum botão do controle,
  // especialmente L3/R3, pode encerrar o RetroArch.
  cfg.push('input_exit_emulator_btn = "nul"');
  cfg.push('input_exit_emulator_axis = "nul"');
  cfg.push('input_exit_emulator_mbtn = "nul"');
  cfg.push('state_slot = "0"');
  cfg.push('savestate_auto_index = "false"');
  cfg.push('savestate_max_keep = "15"');
  cfg.push('savestate_thumbnail_enable = "true"');
  cfg.push('input_state_slot_increase = "nul"');
  cfg.push('input_state_slot_decrease = "nul"');
  cfg.push('input_state_slot_increase_btn = "nul"');
  cfg.push('input_state_slot_decrease_btn = "nul"');
  cfg.push('input_state_slot_increase_axis = "nul"');
  cfg.push('input_state_slot_decrease_axis = "nul"');
  cfg.push('input_state_slot_increase_mbtn = "nul"');
  cfg.push('input_state_slot_decrease_mbtn = "nul"');
  // OSD pequeno no canto superior esquerdo. O seletor de varios saves
  // continua sendo a sobreposicao transparente do Ultimate Emulator.
  cfg.push('notification_show_save_state = "false"');
  cfg.push('notification_show_screenshot = "false"');
  cfg.push('notification_show_state_slot = "false"');
  cfg.push('video_font_size = "16.000000"');
  cfg.push('video_message_pos_x = "0.020000"');
  cfg.push('video_message_pos_y = "0.940000"');
  cfg.push('pause_nonactive = "false"');
  cfg.push('video_font_enable = "true"');
  cfg.push('notification_show_fast_forward = "true"');
  for(const [key,value] of Object.entries(ueControllerPreferences.config())){
    for(let i=cfg.length-1;i>=0;i--)if(cfg[i].startsWith(key+' ='))cfg.splice(i,1);
    cfg.push(key+' = "'+value+'"');
  }
  const file = path.join(PATHS.database, 'UserData', 'retroarch-session.cfg');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file,cfg.join('\n'),'utf8');
  return file;
}

async function downloadCore(coreName) {
  if(typeof coreName!=='string'||! /^[a-z0-9_]+_libretro$/i.test(coreName))return {ok:false,error:'Nome de core invalido'};
  const https = require('https');
  const zlib = require('zlib');
  const url = `https://buildbot.libretro.com/nightly/windows/x86_64/latest/${coreName}.dll.zip`;
  const zipPath = path.join(PATHS.cores, `${coreName}.zip`);
  const dllPath = path.join(PATHS.cores, `${coreName}.dll`);

  if (fs.existsSync(dllPath)) return { ok: true, already: true, path: dllPath };

  return new Promise((resolve) => {
    fs.mkdirSync(PATHS.cores, { recursive: true });
    const file = fs.createWriteStream(zipPath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        resolve({ ok: false, error: `HTTP ${res.statusCode}` });
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        // Extract .dll from zip using PowerShell (available on Win10+)
        const ps = spawn('powershell', [
          '-NoProfile', '-Command',
          `Expand-Archive -Force -LiteralPath '${zipPath.replace(/'/g,"''")}' -DestinationPath '${PATHS.cores.replace(/'/g,"''")}'`
        ]);
        ps.on('close', (code) => {
          try { fs.unlinkSync(zipPath); } catch {}
          resolve({ ok: code === 0 && fs.existsSync(dllPath), path: dllPath });
        });
      });
    }).on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });
  });
}

// UE_PATCH_147
const {Menu, globalShortcut} = require('electron');

function ue7RetroArchRunning() {
  return !!(activeEmulator &&
    activeEmulator.exitCode === null &&
    /retroarch\.exe$/i.test(activeEmulator.spawnfile || ''));
}

function ue7Command(command) {
  const allowed = [
    'RESET','PAUSE_TOGGLE','FULLSCREEN_TOGGLE','MENU_TOGGLE','CHEAT_TOGGLE','CHEAT_INDEX_PLUS','CHEAT_INDEX_MINUS'
  ];
  if (!allowed.includes(command))
    return Promise.resolve({ok:false,error:'Comando invalido'});
  if (!ue7RetroArchRunning())
    return Promise.resolve({ok:false,error:'Nenhum jogo RetroArch aberto'});

  return new Promise(resolve => {
    const socket = require('dgram').createSocket('udp4');
    socket.send(Buffer.from(command),55355,'127.0.0.1',err=>{
      socket.close();
      resolve(err
        ? {ok:false,error:err.message}
        : {ok:true});
    });
  });
}

ipcMain.handle('ue7-command',(_,command)=>ue7Command(command));

let ue7FullscreenRegistered = false;

function ue7RegisterFullscreen() {
  if (ue7FullscreenRegistered) return;
  try {
    ue7FullscreenRegistered = globalShortcut.register(
      'Control+Return',
      ()=>{ ue7Command('FULLSCREEN_TOGGLE'); }
    );
    if (!ue7FullscreenRegistered)
      log('SHORTCUT','Ctrl+Enter indisponivel');
  } catch(error) {
    log('SHORTCUT',String(error));
  }
}

function ue7UnregisterFullscreen() {
  if (!ue7FullscreenRegistered) return;
  try { globalShortcut.unregister('Control+Return'); }
  catch(_) {}
  ue7FullscreenRegistered = false;
}

app.on('will-quit',ue7UnregisterFullscreen);

app.whenReady().then(()=>{
  const openPanel = tab => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('ue7-open-panel',tab);
    }
  };
  const template = [
    {
      label:'Jogo',
      submenu:[
        {label:'Pausar / continuar',click:()=>ue7Command('PAUSE_TOGGLE')},
        {label:'Reiniciar jogo',click:()=>ue7Command('RESET')},
        {type:'separator'},
        {label:'Tela cheia',click:()=>ue7Command('FULLSCREEN_TOGGLE')}
      ]
    },
    {
      label:'Controles',
      submenu:[
        {label:'Configurar controle e teclado',click:()=>openPanel('controls')}
      ]
    },
    {
      label:'Gráficos',
      submenu:[
        {label:'Proporção, shaders e filtros',click:()=>openPanel('video')}
      ]
    }
  ];
  template.push({
    label:'Sobre',
    submenu:[
      {
        label:'Sobre o Ultimate Emulator',
        click:()=>{
          dialog.showMessageBox(mainWindow,{
            type:'info',
            title:'Sobre o Ultimate Emulator',
            message:'Ultimate Emulator',
            detail:
              'Desenvolvedor: Rafael Pegado Da Silva\n' +
              'YouTube: Rafael_Info\n' +
              'Contato: rafaelpds@me.com'
          });
        }
      }
    ]
  });

  ue152BuildMenu(/^pt(?:-|$)/i.test(app.getLocale()) ? 'pt' : 'en');
});
// UE148_AUTO_KEYBOARD
function ue8AutoKeyboard(folder) {return require('./keyboard-defaults.cjs').keys(folder,1);}
// UE149_SAFE_GAMEPAD
const UE9_DEVICE = path.join(PATHS.database,'ultimate-gamepad-149.json');

function ue9ReadDevice() {
  try {
    const data = JSON.parse(fs.readFileSync(UE9_DEVICE,'utf8'));
    if (!/^\d{1,3}$/.test(String(data.l3)) ||
        !/^\d{1,3}$/.test(String(data.r3)) ||
        data.l3 === data.r3) return null;
    return data;
  } catch (_) { return null; }
}

function ue9Profile(id, driver) {
  const root = path.join(PATHS.frontends,'RetroArch','autoconfig');
  const clean = s => String(s || '').toLowerCase()
    .replace(/\(.*?\)/g,'')
    .replace(/[^a-z0-9]/g,'');

  const name = clean(id);
  const dirName = driver === 'sdl2' || driver === 'dinput'
    ? driver : 'xinput';
  const dir = path.join(root,dirName);

  if (!fs.existsSync(dir)) return null;

  const browserVendor = /vendor:\s*([0-9a-f]+)/i.exec(id);
  const browserProduct = /product:\s*([0-9a-f]+)/i.exec(id);
  const vendor = browserVendor ? parseInt(browserVendor[1],16) : null;
  const product = browserProduct ? parseInt(browserProduct[1],16) : null;

  let best = null, bestScore = 0, tied = false;

  for (const file of fs.readdirSync(dir)) {
    if (!/\.cfg$/i.test(file)) continue;

    const full = path.join(dir,file);
    let source;
    try { source = fs.readFileSync(full,'utf8'); }
    catch (_) { continue; }

    const get = key => {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const match = new RegExp(
        '^\\s*' + escaped + '\\s*=\\s*"?([^"\\r\\n]+)"?',
        'm'
      ).exec(source);
      return match ? match[1].trim() : '';
    };

    const dev = clean(get('input_device'));
    const display = clean(get('input_device_display_name'));
    const filename = clean(path.basename(file,'.cfg'));

    let score = 0;
    if (name && name === dev) score += 120;
    else if (name && name === display) score += 110;
    else if (name.length > 8 && dev.length > 8 &&
        (name.includes(dev) || dev.includes(name))) score += 45;
    else if (name.length > 8 && filename.length > 8 &&
        (name.includes(filename) || filename.includes(name))) score += 30;

    const v = Number(get('input_vendor_id'));
    const p = Number(get('input_product_id'));

    if (vendor !== null && product !== null &&
        v === vendor && p === product) score += 200;

    if (score < 40) continue;

    const candidate = {file, get, score};

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
      tied = false;
    } else if (score === bestScore) {
      tied = true;
    }
  }

  return tied ? null : best;
}

ipcMain.handle('ue9-sync-device',(_,payload)=>{
  const pad = ue9Profile(payload.id,payload.driver);
  if (!pad) return {ok:false,error:'Perfil do controle nao identificado com seguranca.'};

  const l3 = pad.get('input_l3_btn');
  const r3 = pad.get('input_r3_btn');
  const start = pad.get('input_start_btn');

  // UE151_START_GUARD: Start/Option must never be a save/load button.
  if (!/^\d{1,3}$/.test(l3) ||
      !/^\d{1,3}$/.test(r3) ||
      !/^\d{1,3}$/.test(start) ||
      l3 === r3 || l3 === start || r3 === start) {
    return {ok:false,error:'Perfil sem L3/R3 seguros ou com conflito no Start/Option.'};
  }

  const face = ['b','a','y','x'];
  for (const action of face) {
    if ([l3,r3].includes(pad.get('input_'+action+'_btn')))
      return {ok:false,error:'Conflito com botao principal. Atalhos nao ativados.'};
  }

  fs.mkdirSync(path.dirname(UE9_DEVICE),{recursive:true});
  fs.writeFileSync(UE9_DEVICE,JSON.stringify({
    id:payload.id,driver:payload.driver,
    profile:pad.file,l3,r3,start
  },null,2),'utf8');

  return {ok:true,profile:pad.file,l3,r3,start};
});

ipcMain.handle('ue9-resolve-button',(_,payload)=>{
  const pad = ue9Profile(payload.id,payload.driver);
  if (!pad) return {ok:false,error:'Perfil nao identificado. Mapeamento automatico preservado.'};

  const standard = [
    'b','a','y','x','l','r','l2','r2',
    'select','start','l3','r3',
    'up','down','left','right','menu_toggle','touchpad'
  ];
  const action = standard[payload.button];
  if (!action) return {ok:false,error:'Botao nao mapeavel.'};

  const physical = action === 'touchpad'
    ? ({xinput:'',sdl2:'20',dinput:'13'}[payload.driver] || '')
    : pad.get('input_'+action+'_btn');

  if (!/^(?:nul|\d{1,3}|h\d+(?:up|down|left|right))$/i.test(physical))
    return {ok:false,error:'Botao sem correspondencia no RetroArch.'};

  return {ok:true,value:physical,profile:pad.file};
});

// UE10: resolve physical browser controls from a verified RetroArch autoconfig;
// standard XInput fallback only for recognized XInput-like devices.
function ue10ResolvePhysical(payload) { return require('./retroarch-controls.cjs').resolve(payload); }
ipcMain.handle('ue10-resolve-control',(_,payload)=>ue10ResolvePhysical(payload));

const UE9_PRESETS = [
  ['sharp','Nítido HD','shaders_slang/pixel-art-scaling/sharp-bilinear-simple.slangp'],
  ['fxaa','Antisserrilhamento FXAA','shaders_slang/anti-aliasing/fxaa.slangp'],
  ['smaa','Antisserrilhamento SMAA','shaders_slang/anti-aliasing/smaa.slangp'],
  ['crt','CRT Guest Advanced','shaders_slang/crt/crt-guest-advanced.slangp'],
  ['royale','CRT Royale','shaders_slang/crt/crt-royale.slangp'],
  ['easymode','CRT Leve','shaders_slang/crt/crt-easymode.slangp'],
  ['lcd','LCD Grid V2','shaders_slang/handheld/lcd-grid-v2.slangp']
];

ipcMain.handle('ue9-presets',()=>{
  return UE9_PRESETS.filter(x=>ue6ShaderPath(x[2]))
    .map(x=>({id:x[0],label:x[1],value:x[2]}));
});

ipcMain.handle('ue9-preview',(_,value)=>{
  const preset = UE9_PRESETS.find(x=>x[2] === value);
  if (!preset || !ue6ShaderPath(value))
    return {ok:false,error:'Filtro indisponivel.'};

  if (!activeEmulator || activeEmulator.exitCode !== null ||
      !/retroarch\.exe$/i.test(activeEmulator.spawnfile || '')) {
    return {ok:false,error:'Abra um jogo RetroArch para visualizar a prévia.'};
  }

  return new Promise(resolve=>{
    const socket = require('dgram').createSocket('udp4');
    socket.send(Buffer.from('SET_SHADER '+ue6ShaderPath(value)),
      55355,'127.0.0.1',error=>{
        if (error) {
          socket.close();
          return resolve({ok:false,error:error.message});
        }
        socket.send(Buffer.from('SHOW_MSG Filtro: '+preset[1]),
          55355,'127.0.0.1',()=>{
            socket.close();
            resolve({ok:true,sent:true,label:preset[1]});
          });
      });
  });
});
// UE150_STATES_BACKEND
ipcMain.handle('ue10-state-status', () => {
  const pad = ue9ReadDevice();
  const mame=ueMameStateGame&&activeEmulator&&/mame(?:64)?\.exe$/i.test(activeEmulator.spawnfile||'');
  const states = ue13ActiveGame && ue7RetroArchRunning()
    ? ue13StateList(ue13ActiveGame).map(ue13StatePublic)
    : mame ? ueMameStateList(ueMameStateGame).map(ue13StatePublic) : [];
  return {
    keyboardSave: '1',
    keyboardLoad: '4',
    joystickReady: !!pad,
    l3: pad ? pad.l3 : null,
    r3: pad ? pad.r3 : null,
    profile: pad ? pad.profile : null,
    states
  };
});

ipcMain.handle('ue10-state-action', (_, action) =>
  ueMameStateGame&&activeEmulator&&/mame(?:64)?\.exe$/i.test(activeEmulator.spawnfile||'')
    ? ueMameStateAction(action) : ue13StateAction(action)
);
ipcMain.handle('ue10-state-modal-closed', () => {
  ue13HideStateChooser();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(false);
  }
  setTimeout(ue13FocusActiveEmulator, 120);
  return {ok:true};
});
ipcMain.handle('ue10-state-toast-closed', () => {
  if (!stateChooserPending) ue13HideStateChooser();
  return {ok:true};
});
// UE1411_CORE_OPTIONS

function ue11CoreOptions(folder,opt) {
  // Every RetroArch core may persist an *.opt file. Keep the full set in
  // AppData; otherwise cores such as Nestopia write back into the portable
  // Runtime\Frontends\RetroArch\config folder on the Desktop.
  const dest = path.join(PATHS.database,'UserData','CoreOptions',
    folder.replace(/[^a-z0-9]/gi,'_')+'.cfg');

  fs.mkdirSync(path.dirname(dest),{recursive:true});

  const globalFile = path.join(
    PATHS.frontends,'RetroArch','retroarch-core-options.cfg'
  );

  let source = '';
  try {
    source = fs.readFileSync(
      fs.existsSync(dest) ? dest : globalFile,'utf8'
    );
  } catch (_) {}

  const entries = new Map();

  for(const line of source.split(/\r?\n/)) {
    const match = /^\s*([a-z0-9_-]+)\s*=\s*"([^"]*)"/i.exec(line);
    if(match) entries.set(match[1],match[2]);
  }

  const scale = Math.min(5,Math.max(1,
    Number.isFinite(Number(opt.internalScale))
      ? Number(opt.internalScale) : (folder === 'PlayStation 1' ? 4 : 2)));
  // V4 removido: os atalhos sao gerados em buildRetroArchConfig().

  if(folder === '3DO') {
    // Correct BIOS selection; use conservative Opera settings for Parallels.
    const chosen=ue15ThreeDO.locateBios(ue15BiosRoots());
    if(chosen.ok && chosen.preference)entries.set('opera_bios',chosen.preference);
    entries.set('opera_high_resolution','disabled');
    entries.set('opera_swi_hle','enabled');
    entries.set('opera_active_devices',opt.player2Enabled?'2':'1');
  }

  if(folder === 'Nintendo 64') {
    const resolutions43 = [
      '320x240','640x480','960x720','1280x960','1600x1200'
    ];
    const resolutions169 = [
      '640x360','960x540','1280x720','1920x1080','2560x1440'
    ];
    if (!entries.has('mupen64plus-rdp-plugin')) entries.set('mupen64plus-rdp-plugin','gliden64');
    if (!entries.has('mupen64plus-rsp-plugin')) entries.set('mupen64plus-rsp-plugin','hle');
    if (!entries.has('mupen64plus-ThreadedRenderer')) entries.set('mupen64plus-ThreadedRenderer','True');
    if (!entries.has('mupen64plus-EnableNativeResFactor')) entries.set('mupen64plus-EnableNativeResFactor',String(scale));
    if (!entries.has('mupen64plus-MultiSampling')) entries.set('mupen64plus-MultiSampling','0');
    if (!entries.has('mupen64plus-FXAA')) entries.set('mupen64plus-FXAA','0');
    if (!entries.has('mupen64plus-43screensize')) entries.set('mupen64plus-43screensize',resolutions43[scale-1]);
    if (!entries.has('mupen64plus-169screensize')) entries.set('mupen64plus-169screensize',resolutions169[scale-1]);
  }

  if(folder === 'PlayStation 1') {
    if (!entries.has('swanstation_CPU_ExecutionMode')) entries.set('swanstation_CPU_ExecutionMode','Recompiler');
    if (!entries.has('swanstation_GPU_Renderer')) entries.set('swanstation_GPU_Renderer','D3D11');
    if (!entries.has('swanstation_GPU_ResolutionScale')) entries.set('swanstation_GPU_ResolutionScale',String(scale));
    if (!entries.has('swanstation_GPU_MSAA')) entries.set('swanstation_GPU_MSAA','1');
    if (!entries.has('swanstation_GPU_ShaderPrecompile')) entries.set('swanstation_GPU_ShaderPrecompile','Enabled');
  }

  if(folder === 'NintendoDS') {
    // Do not preserve stale horizontal layouts: DS always opens as the
    // physical console, with the second screen below the first one.
    entries.set('melonds_number_of_screen_layouts','1');
    entries.set('melonds_screen_layout1','top-bottom');
    entries.set('melonds_screen_gap','0');
    if (!entries.has('melonds_touch_mode')) entries.set('melonds_touch_mode','auto');
    if (!entries.has('melonds_show_cursor')) entries.set('melonds_show_cursor','timeout');
    if (!entries.has('melonds_jit_enable')) entries.set('melonds_jit_enable','enabled');
    if (!entries.has('melonds_jit_block_size')) entries.set('melonds_jit_block_size','32');
    if (!entries.has('melonds_jit_branch_optimisations')) entries.set('melonds_jit_branch_optimisations','enabled');
    if (!entries.has('melonds_jit_literal_optimisations')) entries.set('melonds_jit_literal_optimisations','enabled');
    if (!entries.has('melonds_jit_fast_memory')) entries.set('melonds_jit_fast_memory','enabled');
    if (!entries.has('melonds_render_mode')) entries.set('melonds_render_mode','software');
    if (!entries.has('melonds_audio_interpolation')) entries.set('melonds_audio_interpolation','disabled');
  }

  const data = [...entries]
    .map(([key,value])=>`${key} = "${value}"`).join('\n');

  fs.writeFileSync(dest,data+'\n','utf8');
  return dest;
}

// UE1413_STATE_COMMANDS
const ue13Dgram = require('dgram');
const ue13Timers = [];
const ue13Keys = [];

const UE13_MAX_STATES = 15;

function ue13StateHash(romPath, systemFolder) {
  return crypto.createHash('sha1')
    .update(String(systemFolder || '') + '\0' + path.resolve(String(romPath || '')))
    .digest('hex')
    .slice(0, 20);
}

function ue13StateManifestPath(romPath, systemFolder) {
  return path.join(PATHS.database, 'UserData', 'State Library',
    String(systemFolder || 'Unknown').replace(/[^a-z0-9 _-]/gi, '_'),
    ue13StateHash(romPath, systemFolder) + '.json');
}

function ue13StateThumbRoot(game) {
  return path.join(PATHS.database, 'UserData', 'RetroArch',
    'state-thumbnails', ue13StateHash(game.romPath, game.systemFolder));
}

function ue13StateReadManifest(game) {
  const fallback = {version: 1, base: null, nextSlot: 0, slots: []};
  try {
    const value = JSON.parse(fs.readFileSync(game.manifestPath, 'utf8'));
    if (!value || typeof value !== 'object') return fallback;
    return {
      version: 1,
      base: typeof value.base === 'string' ? value.base : null,
      nextSlot: Number.isInteger(value.nextSlot) && value.nextSlot >= 0 && value.nextSlot < UE13_MAX_STATES ? value.nextSlot : 0,
      slots: Array.isArray(value.slots) ? value.slots.filter(item =>
        item && Number.isInteger(item.slot) && item.slot >= 0 && item.slot < UE13_MAX_STATES
      ) : []
    };
  } catch (_) {
    return fallback;
  }
}

function ue13StateWriteManifest(game, value) {
  try {
    fs.mkdirSync(path.dirname(game.manifestPath), {recursive: true});
    fs.writeFileSync(game.manifestPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
  } catch (error) {
    log('STATE_METADATA_ERROR', String(error));
  }
}

function ue13StateTitle(value) {
  return path.basename(String(value || ''))
    .replace(/\.state\d*$/i, '')
    .replace(/-[0-9a-f]{16}$/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

function ue13StateBaseCandidates(game) {
  const found = new Map();
  const root = game && game.stateRoot;
  if (!root || !fs.existsSync(root)) return [];
  const walk = (folder, depth) => {
    if (depth > 5) return;
    let entries;
    try { entries = fs.readdirSync(folder, {withFileTypes: true}); } catch (_) { return; }
    for (const entry of entries) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        if (/\.state\.history$/i.test(entry.name)) {
          const base = full.replace(/\.history$/i, '');
          found.set(path.resolve(base).toLowerCase(), base);
        } else {
          walk(full, depth + 1);
        }
      } else if (entry.isFile() && /\.state\d*$/i.test(entry.name)) {
        const base = full.replace(/\.state\d*$/i, '.state');
        found.set(path.resolve(base).toLowerCase(), base);
      }
    }
  };
  walk(root, 0);
  return [...found.values()];
}

function ue13StateBaseExists(base) {
  if (!base) return false;
  if (fs.existsSync(base) || fs.existsSync(base + '.history')) return true;
  // RetroArch can create only numbered files (.state1, .state2, ...).
  // They still belong to this state family even when slot 0 is absent.
  try {
    const folder = path.dirname(base);
    const stem = path.basename(base);
    return fs.readdirSync(folder).some(name =>
      name.startsWith(stem) && /^\d+$/.test(name.slice(stem.length))
    );
  } catch (_) {
    return false;
  }
}

function ue13FindStateBase(game, preferLatest = false) {
  const target = ue13StateTitle(path.parse(String(game.romPath || '')).name);
  const candidates = ue13StateBaseCandidates(game).map(base => {
    let mtime = 0;
    let numberedBytes = 0;
    try {
      const file = fs.existsSync(base) ? base : base + '.history';
      mtime = fs.statSync(file).mtimeMs;
    } catch (_) {}
    try {
      const stem = path.basename(base);
      for (const name of fs.readdirSync(path.dirname(base))) {
        if (!name.startsWith(stem) || !/^\d+$/.test(name.slice(stem.length))) continue;
        const stat = fs.statSync(path.join(path.dirname(base), name));
        if (stat.isFile() && stat.size > 0) numberedBytes += stat.size;
      }
    } catch (_) {}
    const title = ue13StateTitle(base);
    let score = 0;
    if (title === target) score += 1000;
    if (title.includes(target) || target.includes(title)) score += 300;
    if (numberedBytes > 0) score += 250;
    return {base, mtime, score};
  }).sort((a, b) => (b.score - a.score) || (b.mtime - a.mtime));
  // Prefer the exact current-ROM family before trusting a stale manifest
  // from an older core/profile layout.
  const exact = candidates.find(item => item.score >= 1000);
  if (exact) {
    game.stateBase = exact.base;
    return exact.base;
  }
  if (ue13StateBaseExists(game && game.stateBase)) return game.stateBase;
  const manifest = ue13StateReadManifest(game);
  if (ue13StateBaseExists(manifest.base)) {
    game.stateBase = manifest.base;
    return game.stateBase;
  }
  const chosen = candidates.find(item => item.score > 0) ||
    (preferLatest ? candidates[0] : null);
  if (!chosen) return null;
  game.stateBase = chosen.base;
  return chosen.base;
}

function ue13StateSlotFile(base, slot) {
  return Number(slot) === 0 ? base : base + String(Number(slot));
}

function ue13FocusActiveEmulator() {
  if (process.platform !== 'win32' || !activeEmulator || activeEmulator.exitCode !== null) return;
  const pid = Number(activeEmulator && activeEmulator.pid);
  if (!Number.isInteger(pid) || pid <= 0) return;
  const input=activeEmulator.ueStateInput;
  if(input&&input.exitCode===null&&input.stdin&&!input.stdin.destroyed){
    input.stdin.write('FOCUS\n');
    return;
  }
  // RetroArch is a separate native window. AppActivate changes only the
  // foreground window; it does not alter fullscreen/windowed state, so the
  // mode selected by the user is preserved and Alt+Tab remains manual.
  const command = [
    `$p=Get-Process -Id ${pid} -ErrorAction SilentlyContinue`,
    `$w=Get-Process -Id ${pid} -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowHandle -ne 0} | Select-Object -First 1`,
    `if($p -and $p.MainWindowHandle -ne 0){$w=$p}`,
    `if($w){$s=New-Object -ComObject WScript.Shell; $s.AppActivate($w.Id) | Out-Null}`
  ].join(';');
  try {
    const focus = spawn('powershell.exe', [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden',
      '-Command', command
    ], {stdio:'ignore', windowsHide:true});
    focus.on('error', error => log('STATE_FOCUS_ERROR', String(error)));
  } catch (error) {
    log('STATE_FOCUS_ERROR', String(error));
  }
}

function ue13StateRecordId(file, slot = null) {
  if (Number.isInteger(slot)) return 'slot-' + slot;
  return 'legacy-' + crypto.createHash('sha1').update(String(file)).digest('hex').slice(0, 16);
}

function ue13StateList(game) {
  const base = ue13FindStateBase(game, false);
  if (!base) return [];
  const manifest = ue13StateReadManifest(game);
  const records = [];
  const bySlot = new Map(manifest.slots.map(item => [item.slot, item]));
  for (let slot = 0; slot < UE13_MAX_STATES; slot++) {
    const file = ue13StateSlotFile(base, slot);
    if (!fs.existsSync(file)) continue;
    let stat;
    try { stat = fs.statSync(file); } catch (_) { continue; }
    if (!stat.isFile() || stat.size <= 0) continue;
    const meta = bySlot.get(slot) || {};
    const metadataMatches = Number.isFinite(meta.stateMtimeMs)
      ? Math.abs(meta.stateMtimeMs-stat.mtimeMs)<2
      : Math.abs(new Date(meta.createdAt||0).getTime()-stat.mtimeMs)<10000;
    const thumbnail = metadataMatches && typeof meta.thumbnail === 'string' && fs.existsSync(meta.thumbnail)
      ? meta.thumbnail : null;
    records.push({
      id: ue13StateRecordId(file, slot), slot, file, base,
      createdAt: stat.mtime.toISOString(),
      thumbnail,
      thumbnailUrl: thumbnail ? pathToFileURL(thumbnail).href+'?v='+stat.mtimeMs : null,
      legacy: false
    });
  }

  // Older packages used RetroArch's .state.history format. Keep those saves
  // visible until the new slot manager starts creating direct 0..14 files.
  // They are loaded through a temporary slot and do not become extra saves.
  if (!records.length) {
    const historyDir = base + '.history';
    let files = [];
    try {
      files = fs.readdirSync(historyDir)
        .filter(name => /\.state$/i.test(name))
        .map(name => path.join(historyDir, name))
        .filter(file => {
          const stat = fs.statSync(file);
          return stat.isFile() && stat.size > 0;
        })
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
        .slice(0, UE13_MAX_STATES);
    } catch (_) {}
    for (const file of files) {
      const stat = fs.statSync(file);
      records.push({
        id: ue13StateRecordId(file), slot: null, file, base,
        createdAt: stat.mtime.toISOString(), thumbnail: null,
        thumbnailUrl: null, legacy: true
      });
    }
  }
  return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function ue13StatePublic(record) {
  return {
    id: record.id,
    slot: record.slot,
    createdAt: record.createdAt,
    thumbnailUrl: record.thumbnailUrl,
    legacy: Boolean(record.legacy)
  };
}

async function ue13Wait(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

const ue13StateEvents = new (require('events').EventEmitter)();
function ue13ObserveStateSlot(game, chunk) {
  if(!game)return;
  game.stateLogBuffer=(game.stateLogBuffer||'')+chunk;
  let newline;
  while((newline=game.stateLogBuffer.indexOf('\n'))>=0){
    const line=game.stateLogBuffer.slice(0,newline);game.stateLogBuffer=game.stateLogBuffer.slice(newline+1);
    const match=/\[(?:State|Estado)\]:\s*(?:State slot|Compartimento de salvamento|Slot de estado)\s*:\s*(-?\d+)/i.exec(line);
    if(match){game.currentSlot=Number(match[1]);ue13StateEvents.emit('slot',{game,slot:game.currentSlot});}
    const loaded=/\[(?:State|Estado)\]:\s*(?:Loading state|Carregando jogo salvo)\s+"([^"]+\.state\d*)"/i.exec(line);
    if(loaded)ue13StateEvents.emit('loaded',{game,file:loaded[1]});
  }
  if(game.stateLogBuffer.length>16384)game.stateLogBuffer='';
}
async function ue13SetStateSlot(game, target) {
  const next=Math.max(0,Math.min(99,Number(target)||0));
  for(let step=0;game.currentSlot!==next&&step<100;step++){
    const direction=next>game.currentSlot?1:-1;
    const expected=game.currentSlot+direction;
    const received=new Promise(resolve=>{
      let timer;const finish=value=>{clearTimeout(timer);ue13StateEvents.removeListener('slot',onSlot);resolve(value);};
      const onSlot=event=>{if(event.game===game)finish(event.slot);};
      ue13StateEvents.on('slot',onSlot);timer=setTimeout(()=>finish(null),3000);
    });
    await ue13Udp(direction>0?'STATE_SLOT_PLUS':'STATE_SLOT_MINUS');
    const actual=await received;
    if(actual!==expected)throw Error('RetroArch não confirmou o slot '+(expected+1)+'. O save não foi gravado.');
    await ue13Wait(70);
  }
  if(game.currentSlot!==next)throw Error('Não foi possível selecionar o slot do save.');
}
async function ue13LoadStateFile(game,slot,file){
  const normalize=value=>path.resolve(value).toLowerCase();
  const observed=new Promise(resolve=>{
    let timer;const finish=ok=>{clearTimeout(timer);ue13StateEvents.removeListener('loaded',onLoad);resolve(ok);};
    const onLoad=event=>{if(event.game===game&&normalize(event.file)===normalize(file))finish(true);};
    ue13StateEvents.on('loaded',onLoad);timer=setTimeout(()=>finish(false),6000);
  });
  const reply=await ue13Udp('LOAD_STATE_SLOT '+slot,true);
  if(!await observed)return null;
  if(!String(reply||'').startsWith('LOAD_STATE_SLOT '+slot))return null;
  await ue13Wait(100);
  return 'SENT';
}
async function ue13PauseForSave(wasPlaying){
  if(!wasPlaying)return;
  await ue13Udp('PAUSE_TOGGLE');
  for(let i=0;i<30;i++){
    const value=await ue13Udp('GET_STATUS',true);
    if(/^GET_STATUS\s+PAUSED\b/i.test(value||''))return;
    await ue13Wait(30);
  }
  throw Error('Não foi possível pausar o jogo para salvar o instante correto.');
}
function ue13StateFileSignature(file){
  try{const stat=fs.statSync(file);return stat.isFile()&&stat.size>0?`${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`:null;}catch{return null;}
}
async function ue13WaitSavedFile(game,target,before){
  let previous=null;
  for(let i=0;i<100;i++){
    const base=ue13FindStateBase(game,true),file=base&&ue13StateSlotFile(base,target);
    const signature=file&&ue13StateFileSignature(file);
    if(signature&&signature!==before.get(file)){
      if(previous===signature)return {base,file,stat:fs.statSync(file)};
      previous=signature;
    }
    await ue13Wait(50);
  }
  throw Error('O RetroArch não gravou o arquivo do slot escolhido. Nenhum novo save foi confirmado.');
}

async function ue13CaptureStateThumbnail(game, slot) {
  const screenshotRoot = ueAuditPortableRetroArchPaths().screenshot_directory;
  const thumbnailRoot = ue13StateThumbRoot(game);
  try { fs.mkdirSync(screenshotRoot, {recursive: true}); } catch (_) {}
  try { fs.mkdirSync(thumbnailRoot, {recursive: true}); } catch (_) {}
  // O RetroArch pode demorar mais no primeiro screenshot em computadores
  // antigos. Guarda o estado anterior e espera pelo arquivo novo/alterado,
  // em vez de depender de uma única janela fixa de 450 ms.
  const beforeFiles = new Map();
  try {
    for (const name of fs.readdirSync(screenshotRoot)) {
      if (!/\.(?:png|jpg|jpeg)$/i.test(name)) continue;
      const file = path.join(screenshotRoot, name);
      try { beforeFiles.set(file, fs.statSync(file).mtimeMs); } catch (_) {}
    }
  } catch (_) {}
  const startedAt = Date.now();
  const result = await ue13Udp('SCREENSHOT');
  if (result !== 'SENT') return null;
  let candidates = [];
  for (let attempt = 0; attempt < 18; attempt++) {
    await ue13Wait(attempt === 0 ? 220 : 100);
    try {
      candidates = fs.readdirSync(screenshotRoot)
        .filter(name => /\.(?:png|jpg|jpeg)$/i.test(name))
        .map(name => path.join(screenshotRoot, name))
        .filter(file => {
          try {
            const stat = fs.statSync(file);
            const previousMtime = beforeFiles.get(file);
            return stat.isFile() && stat.size > 0 &&
              ((!Number.isFinite(previousMtime) && stat.mtimeMs >= startedAt - 250) ||
               (Number.isFinite(previousMtime) && stat.mtimeMs > previousMtime));
          } catch (_) { return false; }
        })
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    } catch (_) { candidates = []; }
    if (candidates.length) break;
  }
  const source = candidates[0];
  if (!source) return null;
  const target = path.join(thumbnailRoot, `slot-${slot}.png`);
  try {
    fs.copyFileSync(source, target);
    return target;
  } catch (error) {
    log('STATE_THUMBNAIL_ERROR', String(error));
    return null;
  }
}

function ue13NotifyStateChooser(states) {
  if ((!mainWindow || mainWindow.isDestroyed()) && !app.isReady()) return;
  // O seletor fica em uma janela transparente própria, acima do RetroArch.
  // Assim o jogo permanece visível e escurecido atrás das miniaturas.
  ue13ShowStateChooser(states);
}

function ue13Udp(command, expectReply = false) {
  return new Promise(resolve => {
    const socket = ue13Dgram.createSocket('udp4');
    let finished = false;

    const timer = setTimeout(() => done(null), 1000);

    function done(value) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try { socket.close(); } catch (_) {}
      resolve(value);
    }

    socket.once('error', () => done(null));

    if (expectReply) {
      socket.once('message', data => done(data.toString('utf8')));
    }

    socket.send(Buffer.from(command,'utf8'),
      55355,'127.0.0.1',error => {
        if (error) done(null);
        else if (!expectReply) done('SENT');
      });
  });
}

let ue13StateActionBusy = false;

async function ue13StateAction(request) {
  // Uma captura de miniatura faz parte do save. Se outra tecla/L3 chegar
  // antes dela terminar, os comandos se misturam e o frontend pode perder o
  // foco. Um comando por vez mantém o jogo aberto e o slot consistente.
  if (ue13StateActionBusy) {
    log('STATE_BUSY', 'Comando de save/load ignorado enquanto outro termina.');
    return {ok:false,error:'Aguarde o save state terminar.'};
  }
  ue13StateActionBusy = true;
  try {
    return await ue13StateActionInternal(request);
  } finally {
    ue13StateActionBusy = false;
  }
}

async function ue13StateActionInternal(request) {
  const action = typeof request === 'string' ? request : request?.action;
  if (!['SAVE_STATE','LOAD_STATE','LOAD_STATE_SLOT','CANCEL_LOAD_STATE'].includes(action)) {
    return {ok:false,error:'Comando de estado invalido.'};
  }

  if (!ue7RetroArchRunning() || !ue13ActiveGame) {
    return {ok:false,error:'Nenhum jogo RetroArch em execucao.'};
  }

  const status = await ue13Udp('GET_STATUS',true);
  const statusMatch = status && /^GET_STATUS\s+(PLAYING|PAUSED)\b/i.exec(status);
  if (!statusMatch) {
    log('STATE_ERROR','RetroArch nao respondeu GET_STATUS: '+String(status));
    return {
      ok:false,
      error:'RetroArch nao respondeu ao comando. Verifique network_cmd_enable.'
    };
  }
  const wasPlaying = statusMatch[1].toUpperCase() === 'PLAYING';

  // A modal owns the pending pause until selection/cancel; repeated shortcuts
  // must not reset that pause or save behind the chooser.
  if (ue13PendingLoad && (action === 'SAVE_STATE' || action === 'LOAD_STATE')) {
    return {ok:false,error:'Escolha um save ou cancele o carregamento.'};
  }

  if (action === 'CANCEL_LOAD_STATE') {
    if (ue13PendingLoad?.wasPlaying) await ue13Udp('PAUSE_TOGGLE');
    ue13PendingLoad = null;
    return {ok:true,cancelled:true};
  }

  if (action === 'LOAD_STATE') {
    const states = ue13StateList(ue13ActiveGame);
    if (!states.length) return {ok:false,error:'Este jogo ainda não possui save states.'};
    if (states.length > 1) {
      if (wasPlaying) await ue13Udp('PAUSE_TOGGLE');
      ue13PendingLoad = {wasPlaying, game: ue13ActiveGame};
      const publicStates = states.map((record,index)=>({...ue13StatePublic(record),latest:index===0}));
      ue13NotifyStateChooser(publicStates);
      log('STATE_CHOOSER', `aberto ${publicStates.length} saves para ${path.basename(ue13ActiveGame.romPath)}`);
      return {ok:true,choose:true,states:publicStates,paused:wasPlaying};
    }
    request = {action:'LOAD_STATE_SLOT', id:states[0].id};
  }

  if (action === 'SAVE_STATE') {
    const manifest = ue13StateReadManifest(ue13ActiveGame);
    const existing = ue13StateList(ue13ActiveGame);
    const used = new Set(existing.filter(item => Number.isInteger(item.slot)).map(item => item.slot));
    let target = Number.isInteger(manifest.nextSlot) ? manifest.nextSlot : 0;
    if (!manifest.slots.length) {
      target = [...Array(UE13_MAX_STATES).keys()].find(slot => !used.has(slot));
      if (!Number.isInteger(target)) target = 0;
    }
    const game=ue13ActiveGame;
    await ue13PauseForSave(wasPlaying);
    try {
      await ue13SetStateSlot(game,target);
      const before=new Map(ue13StateBaseCandidates(game).map(base=>{
        const file=ue13StateSlotFile(base,target);return [file,ue13StateFileSignature(file)];
      }));
      if(await ue13Udp('SAVE_STATE')!=='SENT')throw Error('Falha ao enviar o save.');
      const saved=await ue13WaitSavedFile(game,target,before);
      const thumbnail=await ue13CaptureStateThumbnail(game,target);
      const now=saved.stat.mtime.toISOString();
      const slots=manifest.slots.filter(item=>item.slot!==target);
      slots.push({slot:target,createdAt:now,stateMtimeMs:saved.stat.mtimeMs,thumbnail:thumbnail||null});
      slots.sort((a,b)=>a.slot-b.slot);
      ue13StateWriteManifest(game,{version:1,base:saved.base,nextSlot:(target+1)%UE13_MAX_STATES,slots});
      ue13ShowStateToast('SAVE SALVO · SLOT '+(target+1));
      log('STATE_COMMAND',`SAVE_STATE confirmed slot=${target} file=${saved.file} ${status}`);
      return {ok:true,sent:true,status,slot:target,thumbnailUrl:thumbnail?pathToFileURL(thumbnail).href:null};
    } catch(error) {
      log('STATE_ERROR',String(error));ue13ShowStateToast('NÃO FOI POSSÍVEL SALVAR');
      return {ok:false,error:error.message};
    } finally {
      if(wasPlaying&&ue13ActiveGame===game){
        const current=await ue13Udp('GET_STATUS',true);
        if(/^GET_STATUS\s+PAUSED\b/i.test(current||''))await ue13Udp('PAUSE_TOGGLE');
      }
    }
  }

  const states = ue13StateList(ue13ActiveGame);
  const id = request?.id;
  const selected = states.find(item => item.id === id) ||
    (Number.isInteger(request?.slot) ? states.find(item => item.slot === request.slot) : null);
  if (!selected) return {ok:false,error:'O save selecionado não está mais disponível.'};

  if (wasPlaying && !ue13PendingLoad) {
    await ue13Udp('PAUSE_TOGGLE');
    ue13PendingLoad = {wasPlaying:true,game:ue13ActiveGame};
  }
  let result;
  if (Number.isInteger(selected.slot)) {
    result = await ue13LoadStateFile(ue13ActiveGame,selected.slot,selected.file);
  } else {
    // Legacy .state.history entries have no RetroArch slot number. Copy only
    // the selected file to a temporary high slot, load it, then remove it.
    // This is a loader scratch file, not a backup and never appears in the UI.
    const scratch = ue13StateSlotFile(selected.base, 99);
    try {
      fs.copyFileSync(selected.file, scratch);
      result = await ue13LoadStateFile(ue13ActiveGame,99,scratch);
      setTimeout(() => { try { fs.unlinkSync(scratch); } catch (_) {} }, 2500);
    } catch (error) {
      log('STATE_LOAD_ERROR', String(error));
      result = null;
    }
  }
  if (result !== 'SENT') return {ok:false,error:'Falha ao carregar o estado selecionado.'};
  const resume = ue13PendingLoad?.wasPlaying;
  ue13PendingLoad = null;
  if (resume) await ue13Udp('PAUSE_TOGGLE');
  // Hide the focused chooser before reusing its window as an inactive toast.
  // showInactive alone cannot release focus from an already active window.
  ue13HideStateChooser();
  ue13FocusActiveEmulator();
  ue13ShowStateToast('SAVE CARREGADO');
  setTimeout(ue13FocusActiveEmulator, 180);
  log('STATE_COMMAND', `LOAD_STATE ${selected.id} ${status}`);
  return {ok:true,sent:true,status,slot:selected.slot,loaded:true};
}

// ─── MAME state library ───────────────────────────────────────────────────
// MAME exposes machine:save/load to the autoboot Lua script.  The app writes
// tiny command files, which lets it use the same 15-slot thumbnail chooser as
// RetroArch without ever showing MAME's built-in state UI.
function ueMameStateContext(setName, romPath) {
  const set=String(setName||'').toLowerCase();
  if(!/^[a-z0-9_]{1,32}$/.test(set))throw Error('Conjunto MAME inválido para save state.');
  const identity=romPath || path.join(PATHS.scanRoms,'Arcade - MAME','ROMs',set+'.zip');
  const root=path.join(PATHS.database,'MAME-Ultimate','states',set);
  const commands=path.join(PATHS.database,'MAME-Ultimate','state-commands',set);
  const snapshots=path.join(PATHS.database,'MAME-Ultimate','state-snapshots');
  const thumbs=path.join(PATHS.database,'UserData','MAME','state-thumbnails',set);
  for(const folder of [root,commands,snapshots,thumbs])fs.mkdirSync(folder,{recursive:true});
  return {kind:'mame',setName:set,romPath:identity,systemFolder:'Arcade - MAME',stateRoot:root,
    commandRoot:commands,snapshotRoot:snapshots,thumbRoot:thumbs,currentSlot:0,
    manifestPath:ue13StateManifestPath(identity,'Arcade - MAME')};
}
function ueMameStateFile(game,slot){return path.join(game.stateRoot,'ue_slot_'+Number(slot)+'.sta');}
function ueMameStateSignature(file){return ue13StateFileSignature(file);}
function ueMameStateList(game){
  if(!game)return [];
  const manifest=ue13StateReadManifest(game),bySlot=new Map(manifest.slots.map(item=>[item.slot,item]));
  const rows=[];
  for(let slot=0;slot<UE13_MAX_STATES;slot++){
    const file=ueMameStateFile(game,slot);let stat;try{stat=fs.statSync(file);}catch{continue;}
    if(!stat.isFile()||stat.size<=0)continue;
    const meta=bySlot.get(slot)||{};
    const match=Number.isFinite(meta.stateMtimeMs)&&Math.abs(meta.stateMtimeMs-stat.mtimeMs)<2;
    const thumbnail=match&&typeof meta.thumbnail==='string'&&fs.existsSync(meta.thumbnail)?meta.thumbnail:null;
    rows.push({id:'mame-slot-'+slot,slot,file,createdAt:stat.mtime.toISOString(),thumbnail,
      thumbnailUrl:thumbnail?pathToFileURL(thumbnail).href+'?v='+stat.mtimeMs:null,legacy:false});
  }
  return rows.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
}
function ueMameSnapshotFiles(folder){
  const result=[];const walk=(dir,depth)=>{if(depth>4)return;let items=[];try{items=fs.readdirSync(dir,{withFileTypes:true});}catch{return;}
    for(const item of items){const full=path.join(dir,item.name);if(item.isDirectory())walk(full,depth+1);else if(/\.png$/i.test(item.name)){
      try{const stat=fs.statSync(full);if(stat.isFile()&&stat.size>0)result.push({file:full,mtimeMs:stat.mtimeMs});}catch{}
    }}
  };walk(folder,0);return result;
}
function ueMameStateCommand(game,command){
  const safe=/^(?:SAVE|LOAD)\s+(?:[0-9]|1[0-4])$|^(?:PAUSE|RESUME)$/.test(String(command));
  if(!safe)throw Error('Comando MAME de estado inválido.');
  fs.mkdirSync(game.commandRoot,{recursive:true});
  const base=Date.now().toString(36)+'-'+crypto.randomBytes(5).toString('hex');
  const pending=path.join(game.commandRoot,base+'.pending'),target=path.join(game.commandRoot,base+'.cmd');
  fs.writeFileSync(pending,String(command)+'\n','utf8');fs.renameSync(pending,target);
}
async function ueMameWaitForState(game,slot,before){
  const file=ueMameStateFile(game,slot);let previous=null;
  for(let i=0;i<120;i++){
    const signature=ueMameStateSignature(file);
    if(signature&&signature!==before){
      if(previous===signature)return {file,stat:fs.statSync(file)};
      previous=signature;
    }
    await ue13Wait(50);
  }
  throw Error('MAME não confirmou o save state.');
}
async function ueMameCaptureStateThumbnail(game,slot,before){
  for(let i=0;i<35;i++){
    await ue13Wait(i===0?100:80);
    const source=ueMameSnapshotFiles(game.snapshotRoot)
      .filter(item=>item.mtimeMs>(before.get(item.file)||0))
      .sort((a,b)=>b.mtimeMs-a.mtimeMs)[0];
    if(!source)continue;
    const target=path.join(game.thumbRoot,'slot-'+slot+'.png');
    try{fs.copyFileSync(source.file,target);return target;}catch(error){log('MAME_STATE_THUMB_ERROR',String(error));return null;}
  }
  return null;
}
async function ueMameStateAction(request){
  const action=typeof request==='string'?request:request?.action;
  if(!['SAVE_STATE','LOAD_STATE','LOAD_STATE_SLOT','CANCEL_LOAD_STATE'].includes(action))return {ok:false,error:'Comando de estado inválido.'};
  const game=ueMameStateGame;
  if(!game||!activeEmulator||!/mame(?:64)?\.exe$/i.test(activeEmulator.spawnfile||''))return {ok:false,error:'Nenhum jogo MAME em execução.'};
  if(ue13StateActionBusy)return {ok:false,error:'Aguarde o save state terminar.'};
  ue13StateActionBusy=true;
  try{
    if(action==='CANCEL_LOAD_STATE'){
      if(ue13PendingLoad?.engine==='mame'&&ue13PendingLoad.wasPlaying)ueMameStateCommand(game,'RESUME');
      ue13PendingLoad=null;return {ok:true,cancelled:true};
    }
    if(ue13PendingLoad&&(action==='SAVE_STATE'||action==='LOAD_STATE'))return {ok:false,error:'Escolha um save ou cancele o carregamento.'};
    if(action==='LOAD_STATE'){
      const states=ueMameStateList(game);
      if(!states.length)return {ok:false,error:'Este jogo ainda não possui save states.'};
      if(states.length>1){
        ueMameStateCommand(game,'PAUSE');await ue13Wait(90);
        ue13PendingLoad={wasPlaying:true,engine:'mame',game};
        const publicStates=states.map((record,index)=>({...ue13StatePublic(record),latest:index===0}));
        ue13NotifyStateChooser(publicStates);return {ok:true,choose:true,states:publicStates,paused:true};
      }
      request={action:'LOAD_STATE_SLOT',id:states[0].id};
    }
    if(action==='SAVE_STATE'){
      const manifest=ue13StateReadManifest(game),states=ueMameStateList(game),used=new Set(states.map(item=>item.slot));
      let target=Number.isInteger(manifest.nextSlot)?manifest.nextSlot:0;
      if(!manifest.slots.length){target=[...Array(UE13_MAX_STATES).keys()].find(slot=>!used.has(slot));if(!Number.isInteger(target))target=0;}
      const file=ueMameStateFile(game,target),before=ueMameStateSignature(file),snapshots=new Map(ueMameSnapshotFiles(game.snapshotRoot).map(item=>[item.file,item.mtimeMs]));
      ueMameStateCommand(game,'SAVE '+target);
      const saved=await ueMameWaitForState(game,target,before);
      const thumbnail=await ueMameCaptureStateThumbnail(game,target,snapshots);
      const slots=manifest.slots.filter(item=>item.slot!==target);
      slots.push({slot:target,createdAt:saved.stat.mtime.toISOString(),stateMtimeMs:saved.stat.mtimeMs,thumbnail:thumbnail||null});slots.sort((a,b)=>a.slot-b.slot);
      ue13StateWriteManifest(game,{version:1,base:game.stateRoot,nextSlot:(target+1)%UE13_MAX_STATES,slots});
      ue13ShowStateToast('SAVE SALVO · SLOT '+(target+1));
      return {ok:true,sent:true,slot:target,thumbnailUrl:thumbnail?pathToFileURL(thumbnail).href:null};
    }
    const states=ueMameStateList(game),id=request?.id;
    const selected=states.find(item=>item.id===id)||(Number.isInteger(request?.slot)?states.find(item=>item.slot===request.slot):null);
    if(!selected)return {ok:false,error:'O save selecionado não está mais disponível.'};
    ueMameStateCommand(game,'LOAD '+selected.slot);await ue13Wait(140);
    const resume=ue13PendingLoad?.engine==='mame'&&ue13PendingLoad.wasPlaying;ue13PendingLoad=null;
    if(resume)ueMameStateCommand(game,'RESUME');
    ue13HideStateChooser();ue13FocusActiveEmulator();ue13ShowStateToast('SAVE CARREGADO');setTimeout(ue13FocusActiveEmulator,180);
    return {ok:true,sent:true,slot:selected.slot,loaded:true};
  }catch(error){log('MAME_STATE_ERROR',String(error));return {ok:false,error:error.message};}
  finally{ue13StateActionBusy=false;}
}

function ue13StopHotkeys() {
  for (const timer of ue13Timers.splice(0)) clearTimeout(timer);

  for (const key of ue13Keys.splice(0)) {
    try { globalShortcut.unregister(key); } catch (_) {}
  }
}

function ue13StartHotkeys() {
  ue13StopHotkeys();
  // Windows helper observes foreground keyboard edges together with controllers.
  // RegisterHotKey can succeed while DirectInput has grabbed the keyboard.
  if(process.platform==='win32'){log('STATE_HOTKEY','Teclado 1/4, 7/9 e numpad pelo StateInput nativo');return;}

  // Aguarda o jogo inicializar, antes de assumir as teclas
  // globais. Se a interface UDP falhar, RetroArch conserva
  // os atalhos desativados para evitar comandos duplicados.
  // RetroArch may need several seconds to load a core before NetCMD starts
  // listening. Keep retrying during startup instead of giving up before the
  // port exists (the previous two attempts were too early on old PCs).
  for (const delay of [2200,5000,8000,11000,16000]) {
    ue13Timers.push(setTimeout(async () => {
      if (!ue7RetroArchRunning() || ue13Keys.length) return;

      const status = await ue13Udp('GET_STATUS',true);
      if (!status || !/^GET_STATUS\s+(PLAYING|PAUSED)\b/i.test(status)) {
        log('STATE_HOTKEY','Interface UDP indisponivel');
        return;
      }

      for (const [key,action] of [
        ['7','SAVE_STATE'],
        ['num7','SAVE_STATE'],
        ['9','LOAD_STATE'],
        ['num9','LOAD_STATE']
      ]) {
        try {
          if(globalShortcut.register(key,() => {
            ue13StateAction(action).then(result => {
              if (!result.ok) log('STATE_ERROR',result.error);
            }).catch(error => log('STATE_ERROR',String(error)));
          })) {
            ue13Keys.push(key);
          } else {
            log('STATE_HOTKEY','Tecla ocupada: '+key);
          }
        } catch (error) {
          log('STATE_HOTKEY',String(error));
        }
      }

      log('STATE_HOTKEY',
        'Atalhos globais registrados: '+ue13Keys.join(','));
    },delay));
  }
}

app.on('will-quit',ue13StopHotkeys);
// UE1414_NATIVE_CONFIG
ue20HandleLaunch('ue14-open-configurator',async(_,launcher)=>{
  const available = {
    mame: [PATHS.mame,['mame.exe','mame64.exe']],
    dolphin: [ueAuditDolphinDir(),
      ['Dolphin.exe','DolphinQt2.exe']],
    pcsx2: [path.join(PATHS.frontends,'PCSX2'),
      ['pcsx2-qt.exe','PCSX2.exe','pcsx2*.exe']],

    vita3k: [path.join(PATHS.frontends,'Vita3K'),
      ['Vita3K.exe']],
    ppsspp: [path.join(PATHS.frontends,'PPSSPP'),['PPSSPPWindows64.exe','PPSSPPWindows.exe']]
  };

  let exe = null;

  if (Object.prototype.hasOwnProperty.call(available,launcher)) {
    const [folder,names] = available[launcher];
    exe = findExe(folder,...names);
  }

  if (!exe) {
    return {ok:false,error:
      'Executavel deste emulador nao encontrado. Configure apos a instalacao.'};
  }

  const vita=launcher==='vita3k'?ueVitaPrepare(exe):null;
  const cwd=ueMutableCwd(launcher==='ppsspp'?'PPSSPP':launcher==='pcsx2'?'PCSX2':launcher==='dolphin'?'Dolphin':launcher==='vita3k'?'Vita3K':launcher);
  return spawnDetached(exe,launcher==='ppsspp'?uePspNativeArgs():launcher==='pcsx2'?['-datapath',path.join(PATHS.database,'UserData','PCSX2')]:launcher==='dolphin'?['--user',path.join(PATHS.database,'UserData','Dolphin')]:launcher==='vita3k'?['--config-location',vita.root]:[],cwd);
});
// UE152_MENU_RUNTIME
function ue152BuildMenu(language) {
  ue153Language=language;
  const pt = language === 'pt';
  const tr = (portuguese,english)=>pt ? portuguese : english;

  const panel = tab=>{
    if(mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('ue7-open-panel',tab);
    }
  };

  const run = async command=>{
    const result = await ue7Command(command);
    if (!result.ok) {
      dialog.showMessageBox(mainWindow,{
        type:'info',
        message:result.error || 'Command unavailable'
      });
    }
  };

  const template = [
    {
      label:tr('Jogo','Game'),
      submenu:[
        {label:tr('Pausar / continuar','Pause / Resume'),
         click:()=>run('PAUSE_TOGGLE')},
        {label:tr('Reiniciar','Restart'),
         click:()=>run('RESET')},
        {label:tr('Tela cheia','Fullscreen'),
         click:()=>run('FULLSCREEN_TOGGLE')},
        {label:'RetroArch Menu',
         click:()=>run('MENU_TOGGLE')}
      ]
    },
    {
      label:tr('Controles','Controls'),
      submenu:[{
        label:tr('Configurar controles','Configure controls'),
        click:()=>panel('controls')
      }]
    },
    {
      label:tr('Gráficos','Graphics'),
      submenu:[{
        label:tr('Configurar gráficos','Configure graphics'),
        click:()=>panel('video')
      }]
    },
    {
      label:'Cheats',
      enabled:false,
      click:()=>{}
    },
    {
      label:tr('Sobre','About'),
      submenu:[{
        label:tr('Sobre Ultimate Emulator','About Ultimate Emulator'),
        click:()=>dialog.showMessageBox(mainWindow,{
          type:'info',
          title:'Ultimate Emulator',
          message:'Ultimate Emulator',
          detail:'Desenvolvedor / Developer: Rafael Pegado Da Silva\n' +
                 'YouTube: Rafael_Info\n' +
                 'Contato / Contact: rafaelpds@me.com'
        })
      }]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  return {ok:true};
}

ipcMain.handle('ue152-language',(_,language)=>
  ue152BuildMenu(language === 'pt' ? 'pt':'en')
);
// UE153_PERSISTENT_CONFIG
const UE153_ROOT = path.join(
  PATHS.database,'UserData','RetroArchProfiles'
);

function ue153Lines(contents) {
  const map=new Map();
  for(const line of String(contents).split(/\r?\n/)) {
    const match=/^\s*([a-z][a-z0-9_]*)\s*=\s*"([^"]*)"/i.exec(line);
    if(match) map.set(match[1],match[2]);
  }
  return map;
}

function ue153WriteConfig(file,map) {
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const lines=[...map].map(([key,value])=>
    `${key} = "${String(value).replace(/"/g,'')}"`);
  fs.writeFileSync(file,lines.join('\n')+'\n','utf8');
}

// UE10: refresh only managed RetroArch values in already-created profiles.
// Never overwrite player profiles, save files, MAME or unrelated RetroArch options.
function ueAuditPortableRetroArchPaths() {
  const ra=path.join(PATHS.frontends,'RetroArch');
  const profiles=path.join(PATHS.database,'UserData','RetroArchProfiles');
  const result={cache_directory:os.tmpdir()};
  const directories={assets_directory:'assets',audio_filter_dir:'filters/audio',
    video_filter_dir:'filters/video',content_database_path:'database/rdb',
    core_assets_directory:'downloads',dynamic_wallpapers_directory:'assets/wallpapers',
    osk_overlay_directory:'overlays/keyboards',overlay_directory:'overlays',
    recording_config_directory:'config/record',rgui_config_directory:'config',
    thumbnails_directory:'thumbnails'};
  for(const [key,relative] of Object.entries(directories))result[key]=path.join(ra,relative);
  result.joypad_autoconfig_dir=require('./retroarch-safe-autoconfig.cjs').prepare(PATHS.frontends,PATHS.database);
  const writable=path.join(PATHS.database,'UserData','RetroArch');
  try { fs.mkdirSync(writable,{recursive:true}); } catch (_) {}
  // Keep bundled resources readable in the installation, but move every
  // directory RetroArch may populate (downloads, thumbnails, recordings and
  // menu configuration) to AppData so Controlled Folder Access is never hit.
  result.core_assets_directory=path.join(writable,'downloads');
  result.dynamic_wallpapers_directory=path.join(writable,'assets','wallpapers');
  result.recording_config_directory=path.join(writable,'config','record');
  result.rgui_config_directory=path.join(writable,'config');
  result.thumbnails_directory=path.join(writable,'thumbnails');
  for(const [key,relative] of Object.entries({log_dir:'logs',playlist_directory:'playlists',
    recording_output_directory:'recordings',screenshot_directory:'screenshots'}))
    result[key]=path.join(writable,relative);
  // Cria os destinos graváveis antes de o RetroArch ler o perfil. Se a pasta
  // de screenshots ainda não existir, o RetroArch ignora o caminho e a captura
  // do save state fica sem miniatura (e pode gerar o alerta de pasta bloqueada).
  for (const key of ['core_assets_directory','dynamic_wallpapers_directory',
    'recording_config_directory','rgui_config_directory','thumbnails_directory',
    'log_dir','playlist_directory','recording_output_directory','screenshot_directory']) {
    try { fs.mkdirSync(result[key], {recursive:true}); } catch (_) {}
  }
  for(const name of ['content_history','content_favorites','content_image_history',
    'content_music_history','content_video_history'])result[name+'_path']=path.join(profiles,name+'.lpl');
  return result;
}
function ue10RefreshPersistentProfile(folder,file) {
  if(!fs.existsSync(file))return;
  const stored=ue153Lines(fs.readFileSync(file,'utf8'));
  const generated=ue153Lines(fs.readFileSync(buildRetroArchConfig(folder),'utf8'));
  // Refresh session-wide state shortcuts and A/V options on EVERY launch.
  // Previously hotkeys were not in this list, so old L3/R3 mappings won.
  // UE_ASPECT_16_9_PERSISTENT_SYNC_20261019
  const managed=/^(?:input_player[12]_(?:[a-z0-9_]+)|input_(?:joypad_driver|autodetect_enable|save_state|load_state|menu_toggle|menu_toggle_gamepad_combo|exit_emulator|enable_hotkey|hold_fast_forward|toggle_fast_forward|toggle_fullscreen|grab_mouse_toggle|state_slot_increase|state_slot_decrease)(?:_btn|_axis|_mbtn)?|audio_(?:driver|device|enable|mute_enable|wasapi_exclusive_mode|out_rate|latency|sync|rate_control|rate_control_delta|max_timing_skew)|video_(?:shader|shader_enable|driver|smooth|frame_delay|threaded|max_swapchain_images|vsync|force_aspect|aspect_ratio|aspect_ratio_auto|windowed_fullscreen|font_size|message_pos_x|message_pos_y)|aspect_ratio_index|state_slot|savestate_auto_index|savestate_max_keep|savestate_thumbnail_enable|run_ahead_enabled|pause_nonactive|notification_show_save_state|notification_show_screenshot|notification_show_state_slot)$/;
  for(const key of ['fastforward_ratio','fastforward_ratio_throttle_enable','audio_fastforward_mute','notification_show_fast_forward','video_font_enable','input_rumble_gain','enable_device_vibration']){
    if(generated.has(key))stored.set(key,generated.get(key));
  }
  for(const key of [...stored.keys()])if(managed.test(key))stored.delete(key);
  for(const [key,value] of generated)if(managed.test(key))stored.set(key,value);
  for (const key of [...Object.keys(ueAuditPortableRetroArchPaths()),'system_directory','savefile_directory','savestate_directory',
    'joypad_autoconfig_dir','video_shader_dir','libretro_directory','libretro_info_path',
     'input_remapping_directory','cheat_database_path','core_options_path','video_aspect_ratio','video_aspect_ratio_auto',
    'aspect_ratio_index','video_force_aspect','global_core_options','game_specific_options']) {
    if(generated.has(key))stored.set(key,generated.get(key));
  }
  if(folder === '3DO') {
    // Refresh BIOS and core options in existing per-system profiles too.
    for(const key of ['system_directory','core_options_path','global_core_options',
      'game_specific_options','video_aspect_ratio','video_aspect_ratio_auto',
      'aspect_ratio_index','video_window_width','video_window_height',
      'video_force_aspect']) {
      if(generated.has(key))stored.set(key,generated.get(key));
    }
  }
  ue153WriteConfig(file,stored);
}
function ue153PersistentConfig(folder) {
  const file=path.join(
    UE153_ROOT,folder.replace(/[^a-z0-9_-]/gi,'_')+'.cfg'
  );

  if(fs.existsSync(file)) {
    ue10RefreshPersistentProfile(folder,file);
    return file;
  }

  const original=path.join(
    PATHS.frontends,'RetroArch','retroarch.cfg'
  );

  const globalText=fs.existsSync(original)
    ? fs.readFileSync(original,'utf8') : '';

  const session=buildRetroArchConfig(folder);
  const sessionText=fs.readFileSync(session,'utf8');

  const map=ue153Lines(globalText);

  for(const [key,value] of ue153Lines(sessionText))
    map.set(key,value);

  // The launcher owns the per-system profile. RetroArch must not try to write
  // its global portable config on exit inside the protected installation.
  map.set('config_save_on_exit','false');
  map.set('video_fullscreen','false');
  map.set('fastforward_ratio','3.0');
  map.set('fastforward_ratio_throttle_enable','true');
  map.set('audio_fastforward_mute','true');
  map.set('audio_rate_control','true');
  map.set('video_swap_interval','1');
  map.set('input_menu_toggle','tab');

  ue153WriteConfig(file,map);
  log('CONFIG','Criado perfil persistente: '+file);
  return file;
}

function ue153UpdateProfile(folder,payload) {
  const file=path.join(UE153_ROOT,folder.replace(/[^a-z0-9_-]/gi,'_')+'.cfg');
  ue10RefreshPersistentProfile(folder,file);

  if(folder === 'PlayStation 1') {
    const optionsFile=path.join(
      PATHS.database,'UserData','CoreOptions','PlayStation_1.cfg'
    );

    if(fs.existsSync(optionsFile)) {
      const data=ue153Lines(fs.readFileSync(optionsFile,'utf8'));
      const scale=Math.min(5,Math.max(1,
        Number(payload.internalScale)||3));
      data.set('swanstation_GPU_ResolutionScale',String(scale));
      ue153WriteConfig(optionsFile,data);
    }
  }
}

let ue153Game=null; ue55Game=null;
let ue153Language=/^pt(?:-|$)/i.test(app.getLocale())?'pt':'en';
let ue153TabRegistered=false;

function ue153Title(file) {
  return path.parse(file).name
    .replace(/\([^)]*(?:USA|Europe|Japan|Disc|Disk|Rev)[^)]*\)/gi,'')
    .replace(/\[[^\]]+\]/g,'')
    .replace(/[^a-z0-9]+/gi,'')
    .toLowerCase();
}

function ue153Region(text) {
  if(/(?:USA|SCUS[-_]?\d|SLUS[-_]?\d)/i.test(text)) return 'USA';
  if(/(?:Europe|SLES[-_]?\d|SCES[-_]?\d)/i.test(text)) return 'Europe';
  if(/(?:Japan|SLPS[-_]?\d|SLPM[-_]?\d)/i.test(text)) return 'Japan';
  return null;
}

function ue153FindGameCheats(romPath,folder) {
  const directories={
    'PlayStation 1':'Sony - PlayStation',
    'Super Nintendo':'Nintendo - Super Nintendo Entertainment System',
    'Nintendo 8 Bits':'Nintendo - Nintendo Entertainment System'
  };

  const database=directories[folder];
  if(!database) return null;

  const dir=path.join(
    PATHS.frontends,'RetroArch','cheats',database
  );

  if(!fs.existsSync(dir)) return null;

  const region=ue153Region(romPath);
  if(!region) return null;

  const title=ue153Title(romPath);

  const matches=fs.readdirSync(dir)
    .filter(x=>/\.cht$/i.test(x))
    .filter(x=>ue153Region(x)===region)
    .filter(x=>ue153Title(x)===title);

  if(matches.length!==1) return null;

  const file=path.join(dir,matches[0]);
  const source=fs.readFileSync(file,'utf8');
  const descriptions=[];

  for(const line of source.split(/\r?\n/)) {
    const match=/^\s*cheat(\d+)_desc\s*=\s*"([^"]+)"/i.exec(line);
    if(match) descriptions.push({
      index:Number(match[1]),
      description:match[2]
    });
  }

  descriptions.sort((a,b)=>a.index-b.index);

  if(!descriptions.length) return null;

  return {
    romPath,folder,region,file,descriptions
  };
}

function ue153CanOpen() {
  return !!ue153Game && ue7RetroArchRunning();
}

function ue153RefreshMenu() {
  if(typeof ue152BuildMenu==='function')
    ue152BuildMenu(ue153Language);
}

function ue153RegisterTab() {
  // Tab belongs to RetroArch itself; never intercept it with the legacy cheat UI.
  ue153StopTab();
}

function ue153StopTab() {
  if(ue153TabRegistered) {
    globalShortcut.unregister('Tab');
    ue153TabRegistered=false;
  }
}

function ue154GameKey(filename) {
  return path.parse(filename).name
    .replace(/\[[^\]]+\]|\([^)]*\)/g,' ')
    .replace(/dual[\s-]*shock(?:\s*ver)?/gi,' ')
    .replace(/director.?s cut/gi,' ')
    .replace(/\b(?:disc|disk)\s*\d+/gi,' ')
    .replace(/\b(?:gameshark|game buster|action replay|ver)\b/gi,' ')
    .replace(/[^a-z0-9]+/gi,'')
    .toLowerCase();
}

function ue154Descriptions(filename) {
  const content = fs.readFileSync(filename,'utf8');
  const result=[];

  for(const line of content.split(/\r?\n/)) {
    const match=/^\s*cheat(\d+)_desc\s*=\s*"([^"]+)"/i.exec(line);
    if(match) result.push({
      index:Number(match[1]),
      name:match[2]
    });
  }

  return result.sort((a,b)=>a.index-b.index);
}

async function ue153ShowCheats() {
  if(!ue153CanOpen()) return;

  const current=ue153Game;
  const folders={
    'PlayStation 1':'Sony - PlayStation',
    'Super Nintendo':'Nintendo - Super Nintendo Entertainment System',
    'Nintendo 8 Bits':'Nintendo - Nintendo Entertainment System'
  };

  const category=folders[current.folder];

  if(!category) {
    await dialog.showMessageBox(mainWindow,{
      type:'info',
      title:'Cheats',
      message:'Este sistema ainda precisa de integracao de cheats.',
      buttons:['OK']
    });
    return;
  }

  const root=path.join(
    PATHS.frontends,'RetroArch','cheats',category
  );

  if(!fs.existsSync(root)) {
    await dialog.showMessageBox(mainWindow,{
      type:'warning',
      title:'Cheats',
      message:'Banco de cheats nao encontrado.',
      detail:'Pasta esperada:\n'+root+
        '\n\nInstale o banco oficial de cheats do RetroArch.',
      buttons:['OK']
    });
    return;
  }

  const key=ue154GameKey(current.romPath);
  const files=fs.readdirSync(root)
    .filter(name=>/\.cht$/i.test(name))
    .filter(name=>ue154GameKey(name)===key)
    .sort((a,b)=>a.localeCompare(b));

  let chosen=null;

  if(files.length) {
    const shown=files.slice(0,4);
    const buttons=[
      ...shown.map((_,i)=>'Edicao '+(i+1)),
      'Escolher arquivo...',
      'Cancelar'
    ];

    const result=await dialog.showMessageBox(mainWindow,{
      type:'question',
      title:'Cheats — '+path.parse(current.romPath).name,
      message:'Escolha a edicao do jogo',
      detail:
        'Jogo aberto:\n'+path.basename(current.romPath)+
        '\n\nArquivos encontrados:\n'+
        shown.map((x,i)=>(i+1)+'. '+x).join('\n')+
        '\n\nConfira a regiao e a versao antes de usar os codigos.',
      buttons,
      defaultId:buttons.length-1,
      cancelId:buttons.length-1,
      noLink:true
    });

    if(result.response<shown.length) {
      chosen=path.join(root,shown[result.response]);
    } else if(result.response===shown.length) {
      const pick=await dialog.showOpenDialog(mainWindow,{
        title:'Selecionar arquivo de cheats deste jogo',
        defaultPath:root,
        properties:['openFile'],
        filters:[{name:'RetroArch Cheats',extensions:['cht']}]
      });
      if(!pick.canceled) chosen=pick.filePaths[0];
    }
  } else {
    const result=await dialog.showMessageBox(mainWindow,{
      type:'info',
      title:'Cheats',
      message:'Nenhuma edicao correspondente foi identificada automaticamente.',
      detail:
        'Jogo: '+path.basename(current.romPath)+
        '\n\nVoce pode procurar manualmente o arquivo .cht correto.',
      buttons:['Escolher arquivo .cht','Cancelar'],
      defaultId:1,
      cancelId:1
    });

    if(result.response===0) {
      const pick=await dialog.showOpenDialog(mainWindow,{
        title:'Selecionar cheat para o jogo atual',
        defaultPath:root,
        properties:['openFile'],
        filters:[{name:'RetroArch Cheats',extensions:['cht']}]
      });
      if(!pick.canceled) chosen=pick.filePaths[0];
    }
  }

  if(!chosen) return;

  let descriptions;

  try {
    descriptions=ue154Descriptions(chosen);
  } catch(error) {
    await dialog.showMessageBox(mainWindow,{
      type:'error',
      message:'Nao foi possivel ler o arquivo de cheats.',
      detail:String(error)
    });
    return;
  }

  const preview=descriptions.slice(0,45)
    .map(x=>'• '+x.name).join('\n');

  const answer=await dialog.showMessageBox(mainWindow,{
    type:'info',
    title:'Cheats — '+path.parse(current.romPath).name,
    message:descriptions.length+
      ' cheats encontrados nesta edicao',
    detail:
      'Arquivo selecionado:\n'+chosen+'\n\n'+preview+
      (descriptions.length>45 ?
        '\n\n...e mais '+(descriptions.length-45)+' cheats.':'')+
      '\n\nPara ativar, carregue este arquivo em:'+
      '\nRetroArch > Quick Menu > Cheats > Load Cheat File (Replace).'+
      '\nDepois ative os codigos e escolha Apply Changes.',
    buttons:['Abrir menu RetroArch','Fechar'],
    defaultId:1,
    cancelId:1
  });

  if(answer.response===0) {
    const result=await ue7Command('MENU_TOGGLE');
    if(!result.ok)
      log('CHEATS','Nao foi possivel abrir menu: '+result.error);
  }
}
app.on('will-quit',ue153StopTab);
// UE155_LIVE_CHEATS
const UE55_ROOT=path.join(
  PATHS.database,'UserData','UECheats'
);

const UE55_SELECTED=path.join(
  UE55_ROOT,'selected.json'
);

var ue55Game=null; // UE158_LAUNCH_FIX
let ue55Win=null;
let ue55Cursor=0;
let ue55Queue=Promise.resolve();
let ue55Paused=false;

function ue55Read(file,fallback) {
  try { return JSON.parse(fs.readFileSync(file,'utf8')); }
  catch(_) { return fallback; }
}

function ue55Config(folder) {
  // UE157_LAUNCH_RECOVERY
  return ue153PersistentConfig(folder);
  const file=ue153PersistentConfig(folder);

  if(folder!=='PlayStation 1') return file;

  let content=fs.readFileSync(file,'utf8');

  const changes={
    cheat_database_path:UE55_ROOT.replace(/\\/g,'/'),
    network_cmd_enable:'true',
    network_cmd_port:'55355',
    apply_cheats_after_load:'true',
    apply_cheats_after_toggle:'true',
    notification_show_cheats_applied:'true'
  };

  for(const [key,value] of Object.entries(changes)) {
    const expression=new RegExp(
      '^\\s*'+key+'\\s*=.*(?:\\r?\\n|$)','gm'
    );
    content=content.replace(expression,'');
    content+=`\n${key} = "${value}"`;
  }

  fs.writeFileSync(file,content+'\n','utf8');
  return file;
}

function ue55Normalize(filename) {
  return path.parse(filename).name
    .replace(/\([^)]*\)|\[[^\]]*\]/g,'')
    .replace(/[^a-z0-9]/gi,'')
    .toLowerCase();
}

function ue55Region(filename) {
  if(/\b(?:USA|SLUS|SCUS)\b/i.test(filename)) return 'USA';
  if(/\b(?:Europe|SLES|SCES)\b/i.test(filename)) return 'Europe';
  if(/\b(?:Japan|SLPS|SLPM)\b/i.test(filename)) return 'Japan';
  return null;
}

function ue55Entries(content) {
  const entries=[];

  for(const match of content.matchAll(
    /^\s*cheat(\d+)_desc\s*=\s*"([^"]*)"/gm
  )) {
    entries.push({
      index:Number(match[1]),
      name:match[2]
    });
  }

  return entries.sort((a,b)=>a.index-b.index);
}

function ue55Prepare(romPath,folder) {
  // Desativado ate a integracao de cheats estar validada.
  return null;
  ue55Cursor=0;
  ue55Queue=Promise.resolve();

  if(folder!=='PlayStation 1') return null;

  const database=path.join(
    PATHS.frontends,'RetroArch','cheats',
    'Sony - PlayStation'
  );

  if(!fs.existsSync(database)) {
    log('CHEATS','Banco PlayStation ausente.');
    return null;
  }

  const game=path.basename(romPath);
  const region=ue55Region(game);
  if(!region) return null;

  const normalized=ue55Normalize(game);

  let candidates=fs.readdirSync(database)
    .filter(name=>/\.cht$/i.test(name))
    .filter(name=>ue55Region(name)===region)
    .filter(name=>ue55Normalize(name)===normalized);

  // Resident Evil 2 Dual Shock: disco americano 1 = Leon,
  // disco americano 2 = Claire.
  if(/resident\s*evil\s*2/i.test(game) &&
     /dual[\s-]*shock/i.test(game)) {
    if(/\bdisc\s*1\b/i.test(game))
      candidates=candidates.filter(x=>/\(Leon\)/i.test(x));
    else if(/\bdisc\s*2\b/i.test(game))
      candidates=candidates.filter(x=>/\(Claire\)/i.test(x));
  }

  if(candidates.length!==1) {
    log('CHEATS','Edicao ambigua ou inexistente: '+game+
      ' candidatos='+candidates.length);
    return null;
  }

  const source=path.join(database,candidates[0]);
  const sourceText=fs.readFileSync(source,'utf8');
  const cheats=ue55Entries(sourceText);

  if(!cheats.length) return null;

  const id=require('crypto').createHash('sha256')
    .update(path.resolve(romPath).toLowerCase())
    .digest('hex').slice(0,24);

  const saved=ue55Read(UE55_SELECTED,{});
  const profile=saved[id] || {};
  const enabled=profile.source===candidates[0]
    ? (profile.enabled || {}) : {};

  // Arquivo gerenciado apenas pelo Ultimate Emulator.
  // O banco original do Libretro permanece intacto.
  const dir=path.join(UE55_ROOT,'SwanStation');
  fs.mkdirSync(dir,{recursive:true});

  const output=path.join(
    dir,path.parse(romPath).name+'.cht'
  );

  let text=sourceText.replace(
    /^\s*cheat\d+_enable\s*=.*(?:\r?\n|$)/gm,''
  );

  for(const cheat of cheats) {
    text+=`\ncheat${cheat.index}_enable = "${
      enabled[cheat.index] ? 'true':'false'
    }"`;
  }

  fs.writeFileSync(output,text+'\n','utf8');

  log('CHEATS','Arquivo por jogo preparado: '+output);

  return {
    id,romPath,folder,region,
    source:candidates[0],
    output,cheats,enabled:{...enabled}
  };
}

function ue55Send(command,reply=false) {
  return new Promise(resolve=>{
    const socket=require('dgram').createSocket('udp4');
    let done=false;

    const timeout=setTimeout(()=>finish(null),900);

    function finish(value) {
      if(done) return;
      done=true;
      clearTimeout(timeout);
      try { socket.close(); } catch(_) {}
      resolve(value);
    }

    socket.on('error',()=>finish(null));

    if(reply) {
      socket.once('message',data=>
        finish(data.toString('utf8')));
    }

    socket.send(
      Buffer.from(command,'utf8'),
      55355,'127.0.0.1',
      error=>{
        if(error) finish(null);
        else if(!reply) finish('SENT');
      }
    );
  });
}

const ue55Delay=ms=>
  new Promise(resolve=>setTimeout(resolve,ms));

ipcMain.handle('ue55-info',()=>{
  if(!ue55Game || !ue7RetroArchRunning())
    return {ok:false,error:'Nenhum jogo compatível em execução.'};

  return {
    ok:true,
    title:path.parse(ue55Game.romPath).name,
    region:ue55Game.region,
    source:ue55Game.source,
    cheats:ue55Game.cheats.map(x=>({
      ...x,
      enabled:!!ue55Game.enabled[x.index]
    }))
  };
});

async function ue55DoToggle(payload) {
  const game=ue55Game;

  if(!game || !ue7RetroArchRunning())
    return {ok:false,error:'O jogo não está em execução.'};

  const entry=game.cheats.find(x=>x.index===payload.index);

  if(!entry)
    return {ok:false,error:'Código não encontrado.'};

  const enabled=!!payload.enabled;
  if(!!game.enabled[entry.index]===enabled)
    return {ok:true,enabled,unchanged:true};

  const status=await ue55Send('GET_STATUS',true);

  if(!status || !/^GET_STATUS\s+(PLAYING|PAUSED)\b/i.test(status))
    return {ok:false,error:'RetroArch não respondeu. Nenhum código foi alterado.'};

  // O RetroArch inicia o cursor dos cheats no índice zero.
  // Navegação sequencial, sem comandos simultâneos.
  const size=game.cheats.length;
  const steps=(entry.index-ue55Cursor+size)%size;

  for(let i=0;i<steps;i++) {
    if(await ue55Send('CHEAT_INDEX_PLUS')!=='SENT')
      return {ok:false,error:'Falha ao selecionar o código.'};
    await ue55Delay(55);
  }

  ue55Cursor=entry.index;

  if(await ue55Send('CHEAT_TOGGLE')!=='SENT')
    return {ok:false,error:'Falha ao enviar alteração.'};

  game.enabled[entry.index]=enabled;

  const saved=ue55Read(UE55_SELECTED,{});
  saved[game.id]={
    source:game.source,
    enabled:game.enabled
  };

  fs.mkdirSync(path.dirname(UE55_SELECTED),{
    recursive:true
  });

  fs.writeFileSync(
    UE55_SELECTED,
    JSON.stringify(saved,null,2),'utf8'
  );

  log('CHEATS','Alteração solicitada: '+
    entry.name+' = '+enabled);

  return {
    ok:true,enabled,
    message:'Comando enviado. Confira o OSD do RetroArch.'
  };
}

ipcMain.handle('ue55-toggle',(_,payload)=>{
  const next=ue55Queue.then(()=>ue55DoToggle(payload));
  ue55Queue=next.catch(()=>{});
  return next;
});

ipcMain.handle('ue55-close',()=>{
  if(ue55Win && !ue55Win.isDestroyed())
    ue55Win.close();
  return {ok:true};
});

function ue55Html() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cheats — Ultimate Emulator</title>
<style>
*{box-sizing:border-box}
body{font:14px Segoe UI,Arial,sans-serif;
background:#191b1e;color:#eee;margin:0}
header{background:#25282d;padding:18px 22px;
position:sticky;top:0;z-index:2;border-bottom:1px solid #444}
h1{font-size:19px;margin:0 0 8px}
small,.hint{color:#bbb;line-height:1.5}
#search{width:100%;padding:11px;background:#30343a;color:white;
border:1px solid #53575d;border-radius:8px;margin-top:12px}
#items{padding:15px;display:grid;gap:8px}
.cheat{display:flex;gap:12px;align-items:center;
padding:11px;background:#292d32;border:1px solid #3b4046;
border-radius:9px;cursor:pointer}
.cheat input{width:19px;height:19px;accent-color:#a35be1}
.cheat span{flex:1}
footer{position:sticky;bottom:0;background:#24272b;
padding:13px;border-top:1px solid #444}
button{background:#66359b;color:white;border:0;
padding:10px 17px;border-radius:7px;cursor:pointer}
#status{font-size:12px;color:#bcbcbc;margin-top:8px}
</style>
</head>
<body>
<header>
<h1 id="title">Cheats do jogo</h1>
<small id="edition"></small>
<input id="search" placeholder="Pesquisar vida, munição, armas, itens...">
</header>
<main id="items"></main>
<footer>
<button id="close">Fechar e voltar ao jogo</button>
<div id="status">Carregando códigos...</div>
</footer>
<script>
const api=window.electronAPI;
let cheats=[];
const list=document.getElementById('items');
const status=document.getElementById('status');

function render(){
 list.replaceChildren();
 const text=document.getElementById('search').value.toLowerCase();
 for(const item of cheats){
  if(!item.name.toLowerCase().includes(text))continue;
  const label=document.createElement('label');
  label.className='cheat';
  const input=document.createElement('input');
  input.type='checkbox';
  input.checked=item.enabled;
  const name=document.createElement('span');
  name.textContent=item.name;
  label.append(input,name);
  input.onchange=async()=>{
   input.disabled=true;
   status.textContent='Enviando alteração...';
   try{
    const result=await api.ue55Toggle(item.index,input.checked);
    if(!result.ok){
     input.checked=item.enabled;
     status.textContent=result.error;
    }else{
     item.enabled=!!result.enabled;
     status.textContent=result.message ||
       'Alteração solicitada ao RetroArch.';
    }
   }catch(error){
    input.checked=item.enabled;
    status.textContent=String(error);
   }
   input.disabled=false;
  };
  list.appendChild(label);
 }
}
async function init(){
 const data=await api.ue55Info();
 if(!data.ok){
  status.textContent=data.error;
  return;
 }
 cheats=data.cheats;
 document.getElementById('title').textContent=data.title;
 document.getElementById('edition').textContent=
   data.region+' — '+data.source+
   ' — '+cheats.length+' cheats';
 status.textContent='Marque um código e confira a mensagem no jogo.';
 render();
}
document.getElementById('search').oninput=render;
document.getElementById('close').onclick=()=>api.ue55Close();
document.addEventListener('keydown',event=>{
 if(event.key==='Escape')api.ue55Close();
});
init().catch(e=>status.textContent=String(e));
</script>
</body>
</html>`;
}

async function ue55Open() {
  if(!ue55Game || !ue7RetroArchRunning()) return;

  if(ue55Win && !ue55Win.isDestroyed()) {
    ue55Win.focus();
    return;
  }

  ue55Paused=false;
  const status=await ue55Send('GET_STATUS',true);

  if(!status || !/^GET_STATUS\s+(PLAYING|PAUSED)\b/i.test(status)) {
    dialog.showMessageBox(mainWindow,{
      type:'warning',
      message:'RetroArch não respondeu.',
      detail:'Verifique se o jogo está aberto e os comandos de rede estão habilitados.'
    });
    return;
  }

  if(/^GET_STATUS\s+PLAYING\b/i.test(status)) {
    ue55Paused=await ue55Send('PAUSE_TOGGLE')==='SENT';
  }

  ue55Win=new BrowserWindow({
    width:670,
    height:690,
    minWidth:400,
    minHeight:370,
    parent:mainWindow,
    autoHideMenuBar:true,
    backgroundColor:'#191b1e',
    webPreferences:{
      preload:path.join(__dirname,'preload.js'),
      contextIsolation:true,
      nodeIntegration:false,
      sandbox:false
    }
  });

  ue55Win.loadURL(
    'data:text/html;charset=utf-8,'+
    encodeURIComponent(ue55Html())
  );

  ue55Win.on('closed',()=>{
    ue55Win=null;
    if(ue55Paused && ue7RetroArchRunning())
      ue55Send('PAUSE_TOGGLE');
    ue55Paused=false;
  });
}

// Game-specific cheats: exact region/revision, isolated source, live acknowledgement.
var ue159Game=null,ue159Window=null,ue159Paused=false,ue20CheatView=null;
var ue159Sequence=Promise.resolve();
function ue159Engine(){return require('./ue159-cheats.cjs')}
function ue159Running(){return !!ue159Game&&!!activeEmulator&&activeEmulator.exitCode===null}
function ue159Menu(){}
function ue159ReleaseTab(){}
function ue159BindTab(){}
function ue20CheatInfo(){
 let g=ue20CheatView;if(!g)return {ok:false,error:'No game selected.'};
 if(g.kind==='mame')g=require('./mame-cheats.cjs').info(g);
 const live=g.kind==='mame'?!!g.live:ue159Running()&&ue159Game.rom===g.rom;
 return {ok:true,progress:g.progress||'',title:path.parse(g.rom).name,region:g.kind==='mame'?'Exact MAME set '+g.set:(g.identity.regions.join(', ')||'Unknown region'),revision:g.identity?.revision||'',source:g.source||g.sources?.join(' · ')||'',reason:(g.kind==='mame'&&g.live?'':g.reason)||'',live,loaded:g.kind==='mame'?!!g.live:live&&ue159Game.loaded,entries:g.entries.map(({index,name,original,enabled,actionable,parameter,oneshot,value})=>({index,name:ue159Engine().friendly(name,index),original,enabled,actionable,parameter,oneshot,value}))};
}
ipcMain.handle('ue159-info',()=>ue20CheatInfo());
ipcMain.handle('ue159-toggle',(_,index,enabled)=>{
 const view=ue20CheatView;
 const run=ue159Sequence.then(async()=>{
  if(view!==ue20CheatView)return {ok:false,error:'The selected game changed.'};
  if(view.kind==='mame')return require('./mame-cheats.cjs').toggle(view,Number(index),enabled);
  const live=ue159Running()&&ue159Game.rom===view.rom;
  const game=live?ue159Game:view;
  const result=await ue159Engine().toggle(game,Number(index),enabled,live);
  if(result.ok&&view.entries[index])view.entries[index].enabled=result.enabled;
  return result;
 });ue159Sequence=run.catch(()=>{});return run;
});
ipcMain.handle('ue159-disable-all',()=>{
 const view=ue20CheatView;
 const run=ue159Sequence.then(async()=>{
  if(!view||view!==ue20CheatView)return {ok:false,error:'The selected game changed.'};
  if(view.kind==='mame'){
   const manager=require('./mame-cheats.cjs');
   const info=manager.info(view);
   let disabled=0;
   for(const entry of info.entries||[]){
    if(!entry.actionable||!entry.enabled)continue;
    const result=manager.toggle(view,Number(entry.index),false);
    if(!result.ok)return {...result,disabled};
    disabled++;
   }
   return {ok:true,disabled,message:'Todos os cheats do MAME foram desativados.'};
  }
  const live=ue159Running()&&ue159Game.rom===view.rom;
  const game=live?ue159Game:view;
  const result=await ue159Engine().disableAll(game,live);
  if(result.ok&&view.entries)for(const entry of view.entries)if(entry.actionable)entry.enabled=false;
  return result;
 });
 ue159Sequence=run.catch(()=>{});return run;
});
ipcMain.handle('ue20-cheats-play',()=>{
 const view=ue20CheatView;if(!view)return {ok:false,error:'No game selected.'};
 const launcher=view.kind==='mame'?'mame':'retroarch';
 const payload=launcher==='mame'?{romPath:view.rom,setName:view.set}:{romPath:view.rom,corePath:view.corePath,systemFolder:view.system};
 const run=ue20LaunchQueue.then(async()=>{await ue20StopActive(true);const r=await ue20Launchers.get('launch-'+launcher)(null,payload);if(r?.ok&&launcher==='retroarch')ue20CheatView=ue159Game;return r;});
 ue20LaunchQueue=run.catch(()=>{});return run;
});
ipcMain.handle('ue159-close',()=>{if(ue159Window&&!ue159Window.isDestroyed())ue159Window.close();return {ok:true}});
ipcMain.handle('ue20-cheats-open',async(_,request)=>{
 const {romPath,systemFolder,core,launcher,id}=request||{};
 if(typeof romPath!=='string'||!fs.existsSync(romPath))return {ok:false,error:'Game file not found.'};
 if(id==='vita'||launcher==='vita3k'){
  const message='Cheats ainda não são suportados pelo Vita3K oficial.';
  await dialog.showMessageBox(mainWindow,{
   type:'info',title:'Cheats — PlayStation Vita',message,
   detail:'Não há uma lista de códigos para ativar neste emulador. Os códigos do RetroArch/MAME não se aplicam ao Vita3K. Patches do Vita3K são um recurso separado e não equivalem a suporte a cheats.',
   buttons:['Entendi'],noLink:true
  });
  return {ok:false,unsupported:true,error:message};
 }
 if(['psx','ps2','gamecube'].includes(id))return {ok:false,external:true,error:'Use the native emulator cheat manager.'};
 if(launcher==='mame'){
  const view=require('./mame-cheats.cjs').preview(romPath,PATHS.mame,PATHS.database);
  await ue159Open(view);return {ok:true};
 }
 if(launcher!=='retroarch')return {ok:false,error:'This emulator requires its own native cheat implementation; RetroArch codes cannot be applied to it.'};
 const view=ue159Running()&&ue159Game.rom===romPath?ue159Game:ue159Engine().prepare(romPath,systemFolder,PATHS.frontends,PATHS.database,core);
 await ue159Open(view);return {ok:true};
});
async function ue159Open(game=ue159Game){
 if(!game)return;
 if(ue159Window&&!ue159Window.isDestroyed()){ue159Window.close();}
 ue20CheatView=game;
 ue159Window=new BrowserWindow({width:740,height:760,minWidth:420,minHeight:400,parent:mainWindow,autoHideMenuBar:true,backgroundColor:'#191b1e',webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:false}});
 const current=ue159Window;
 const html=fs.readFileSync(path.join(__dirname,'renderer','ue159-cheats.html'),'utf8');
 current.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html));
 current.on('closed',()=>{if(ue159Window===current){ue159Window=null;ue20CheatView=null;}});
}

// UE1511_DUCKSTATION
function ue1511FindDuckStation() {
  const root = path.join(PATHS.frontends,'DuckStation');

  if (!fs.existsSync(root)) return null;

  const folders = [{folder:root,depth:0}];
  const matches = [];

  while (folders.length) {
    const current = folders.pop();

    for (const entry of fs.readdirSync(current.folder,{
      withFileTypes:true
    })) {
      const full = path.join(current.folder,entry.name);

      if (entry.isDirectory() && current.depth < 4) {
        folders.push({
          folder:full,
          depth:current.depth+1
        });
      } else if (entry.isFile() &&
          /^duckstation.*x64.*\.exe$/i.test(entry.name)) {
        matches.push(full);
      }
    }
  }

  matches.sort((a,b)=>{
    const score=x=>/releaseLTCG/i.test(x)?0:1;
    return score(a)-score(b);
  });

  return matches[0] || null;
}

ue20HandleLaunch('ue1511-duckstation',async(_,request)=>{
  const exe = ue1511FindDuckStation();

  if (!exe) {
    return {
      ok:false,
      error:'DuckStation Intel x64 nao encontrado na pasta Frontends.'
    };
  }

  const runtime = await ueEnsureVCRedist();
  if (!runtime.ok) return runtime;

  const mode = request && request.mode === 'play'
    ? 'play' : 'config';

  if (mode === 'config') {
    return spawnDetached(exe,[],ueMutableCwd('DuckStation'));
  }

  const rom = request && request.romPath;

  if (typeof rom !== 'string' ||
      !/\.(chd|cue|iso|img|pbp|mdf|bin|m3u)$/i.test(rom) ||
      !fs.existsSync(rom) ||
      !fs.statSync(rom).isFile()) {
    return {
      ok:false,
      error:'Selecione um arquivo de jogo PS1 valido.'
    };
  }

  log('DUCKSTATION_LAUNCH',path.basename(rom));

  // -nofullscreen respeita a preferencia de abrir em janela.
  // -- indica que o argumento seguinte e o arquivo do jogo.
  return spawnDetached(
    exe,['-nofullscreen','--',rom],ueMutableCwd('DuckStation')
  );
});

// UE2: persistent game statistics and safely loaded cover art
const ue2Crypto = require('crypto');
const ue3Covers = require('./cover-match-v3');
const ue2Https = require('https');
const ue2DbFile = path.join(PATHS.database,'ue2-library.json');
const ue2PreferencesFile=path.join(PATHS.database,'ue2-preferences.json');
function ue17RebaseFavorite(value) {
 if (typeof value !== 'string') return value;
 if (fs.existsSync(value)) return value;
 const m = /[\/]Sistemas Roms[\/]/i.exec(value);
 if (!m) return value;
 const sub=value.slice(m.index+m[0].length);
 const candidate=path.resolve(PATHS.roms,sub);
 const rel=path.relative(PATHS.roms,candidate);
 if (rel && !rel.startsWith('..') && !path.isAbsolute(rel) &&
     fs.existsSync(candidate)) return candidate;
 return value;
}
ipcMain.handle('ue2-preferences-load',()=>{
 const p=ueReadJSON(ue2PreferencesFile,{});
 for(const field of ['favorites','recent'])
  if(Array.isArray(p[field]))p[field]=p[field].map(ue17RebaseFavorite);
 return p;
});
ipcMain.handle('ue2-preferences-save',(_,p)=>{
 const prefs={view:['grid','list','carousel'].includes(p?.view)?p.view:'grid',
 palette:['dark','light'].includes(p?.palette)?p.palette:'dark',
 favorites:Array.isArray(p?.favorites)?p.favorites.filter(x=>typeof x==='string').slice(0,12000):[],
 recent:Array.isArray(p?.recent)?p.recent.filter(x=>typeof x==='string').slice(0,35):[]};
 ueWriteJSON(ue2PreferencesFile,prefs);return {ok:true};
});
// V17: IDs das ROMs internas nao dependem da letra do drive / caminho do PC.
function ue17GameIdentity(value) {
 const raw=String(value);
 const abs=path.resolve(raw);
 const relative=path.relative(PATHS.roms,abs);
 if (relative && relative!=='.' && relative!=='..' &&
     !relative.startsWith('..'+path.sep) && !path.isAbsolute(relative))
   return 'portable:'+relative.split(path.sep).join('/').toLowerCase();
 return raw;
}
const ue2Hash = value => ue2Crypto.createHash('sha256')
  .update(ue17GameIdentity(value)).digest('hex').slice(0,32);
const ue2Exts = ['.png','.jpg','.jpeg','.webp'];
const ue2Cache = new Map();
// Sinopses ficam fora do pacote ASAR, em arquivos de texto persistentes. Isso
// permite reaproveitar o resultado depois de fechar ou reinstalar o launcher,
// sem consultar a internet novamente para o mesmo jogo.
const ue2DescriptionsRoot=path.join(PATHS.database,'Game Descriptions');
const ue2DescriptionCache=new Map();
function ue2DescriptionFile(rom){return path.join(ue2DescriptionsRoot,ue2Hash(rom)+'.txt')}
function ue2DescriptionUsableText(value){
 const text=String(value||'').replace(/\s+/g,' ').trim();
 if(text.length<40)return false;
 if(/^You can only search for subpages of one page at a time\.?$/i.test(text))return false;
 if(/(?:\.{3}|…)\s*$/.test(text))return false;
 return true;
}
function ue2DescriptionRead(rom){
 const key=ue2Hash(rom),known=ue2DescriptionCache.get(key);if(known)return known;
 const file=ue2DescriptionFile(rom);let raw;
 try{raw=fs.readFileSync(file,'utf8')}catch{return null}
 const marker='\n---\n',at=raw.indexOf(marker),head=at>=0?raw.slice(0,at):raw,body=at>=0?raw.slice(at+marker.length).trim():'';
 const fields={};for(const line of head.split(/\r?\n/)){const i=line.indexOf('=');if(i>0)fields[line.slice(0,i).trim()]=line.slice(i+1).trim()}
 if(fields.VERSION!=='2'||/^Title:\s*(?:Resultados da pesquisa|Search results)/i.test(body)||/^Title:\s*$/i.test(body))return null;
 const manual=fields.STATUS==='manual';
 if(!manual&&fields.STATUS==='ok'&&!ue2DescriptionUsableText(body))return null;
 const result={status:manual?'ok':(fields.STATUS||'ok'),manual,title:fields.TITLE||'',source:fields.SOURCE||'',url:fields.URL||'',fetchedAt:fields.FETCHED_AT||'',text:body,cached:true};
 ue2DescriptionCache.set(key,result);return result;
}
function ue2DescriptionWrite(rom,data){
 const persistedStatus=data.status==='manual'?'manual':(data.status==='not-found'?'not-found':'ok');
 const result={status:persistedStatus==='manual'?'ok':persistedStatus,manual:persistedStatus==='manual',title:String(data.title||''),source:String(data.source||''),url:String(data.url||''),fetchedAt:String(data.fetchedAt||new Date().toISOString()),text:String(data.text||'').replace(/\r\n/g,'\n').trim(),cached:true};
 fs.mkdirSync(ue2DescriptionsRoot,{recursive:true});
 const lines=['# Ultimate Emulator — sinopse do jogo','VERSION=2','STATUS='+persistedStatus,'TITLE='+result.title.replace(/[\r\n=]/g,' '),'SOURCE='+result.source.replace(/[\r\n=]/g,' '),'URL='+result.url.replace(/[\r\n=]/g,' '),'FETCHED_AT='+result.fetchedAt.replace(/[\r\n=]/g,' '),'---',result.text,''];
 fs.writeFileSync(ue2DescriptionFile(rom),lines.join('\n'),'utf8');ue2DescriptionCache.set(ue2Hash(rom),result);return result;
}
function ue2DescriptionReply(rom){return ue2DescriptionRead(rom)||{status:'missing',text:'',cached:false}}
let ue2DescriptionNextRequestAt=0;
async function ue2DescriptionThrottle(){
 const now=Date.now(),wait=Math.max(0,ue2DescriptionNextRequestAt-now);
 ue2DescriptionNextRequestAt=Math.max(now,ue2DescriptionNextRequestAt)+1200;
 if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
}
async function ue2DescriptionHttpJson(url,maxBytes=2*1024*1024,timeout=14000){await ue2DescriptionThrottle();return new Promise((resolve,reject)=>{
 let parsed;try{parsed=new URL(url)}catch{return reject(Error('URL inválida'))}
 if(!['pt.wikipedia.org','en.wikipedia.org'].includes(parsed.hostname)||parsed.protocol!=='https:')return reject(Error('Fonte não permitida'));
 const parts=[];let size=0;const request=ue2Https.get(parsed.href,{timeout,headers:{'User-Agent':'UltimateEmulator/3.0 (game metadata)','Accept':'application/json'}},response=>{
  if([301,302,307,308].includes(response.statusCode)&&response.headers.location){response.resume();let next;try{next=new URL(response.headers.location,parsed.href).href}catch{return reject(Error('Redirecionamento inválido'))}return ue2DescriptionHttpJson(next,maxBytes,timeout).then(resolve,reject)}
  if(response.statusCode!==200){response.resume();return reject(Error('HTTP '+response.statusCode))}
  response.on('data',part=>{size+=part.length;if(size>maxBytes){request.destroy(Error('Limite de metadados excedido'));return}parts.push(part)});
  response.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(parts).toString('utf8')))}catch(error){reject(error)}});response.on('error',reject);
 });
 request.on('timeout',()=>request.destroy(Error('Tempo de resposta esgotado')));request.on('error',reject);
})}
// Fallback textual para quando a API REST da Wikipédia estiver limitada (429).
// O proxy somente devolve o conteúdo público da página de resultados; nenhum
// dado de conta ou credencial é enviado.
async function ue2DescriptionHttpText(url,maxBytes=2*1024*1024,timeout=18000){await ue2DescriptionThrottle();return new Promise((resolve,reject)=>{
 let parsed;try{parsed=new URL(url)}catch{return reject(Error('URL inválida'))}
 if(parsed.protocol!=='https:'||parsed.hostname!=='r.jina.ai')return reject(Error('Fonte não permitida'));
 const parts=[];let size=0;const request=ue2Https.get(parsed.href,{timeout,headers:{'User-Agent':'UltimateEmulator/3.0 (game metadata)','Accept':'text/plain'}},response=>{
  if([301,302,307,308].includes(response.statusCode)&&response.headers.location){response.resume();let next;try{next=new URL(response.headers.location,parsed.href).href}catch{return reject(Error('Redirecionamento inválido'))}return ue2DescriptionHttpText(next,maxBytes,timeout).then(resolve,reject)}
  if(response.statusCode!==200){response.resume();return reject(Error('HTTP '+response.statusCode))}
  response.setEncoding('utf8');response.on('data',part=>{size+=Buffer.byteLength(part);if(size>maxBytes){request.destroy(Error('Limite de metadados excedido'));return}parts.push(part)});
  response.on('end',()=>resolve(parts.join('')));response.on('error',reject);
 });
 request.on('timeout',()=>request.destroy(Error('Tempo de resposta esgotado')));request.on('error',reject);
})}
function ue2DescriptionPlain(value){return String(value||'').replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[*_`>#|]/g,' ').replace(/\s+/g,' ').trim()}
async function ue2DescriptionJina(clean,system){
 // Quando a API REST responde 429, tente primeiro a página direta. O texto
 // principal do artigo é mais confiável que os pequenos trechos da página de
 // resultados, que podem terminar em reticências ou mensagens de erro.
 for(const lang of ['pt','en']){
  try{
   const pageTitle=String(clean||'').replace(/\s+/g,'_');
   const raw=await ue2DescriptionHttpText('https://r.jina.ai/http://'+lang+'.wikipedia.org/wiki/'+encodeURIComponent(pageTitle));
   const paragraphs=raw.split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&line.length>=80&&!/^\|/.test(line)&&!/^#/.test(line)&&!/^\[!?/.test(line)&&!/^\*\s+/.test(line)&&!/^(?:Title:|URL Source:|Published Time:|Markdown Content:)/i.test(line));
   const picked=ue2DescriptionPlain(paragraphs[0]||'');
   if(ue2DescriptionUsableText(picked))return {status:'ok',title:clean,source:'Wikipédia ('+lang.toUpperCase()+')',url:'https://'+lang+'.wikipedia.org/wiki/'+encodeURIComponent(pageTitle),fetchedAt:new Date().toISOString(),text:picked};
  }catch(error){log('DESCRIPTION_LOOKUP','Jina page fallback: '+String(error?.message||error));}
 }
 const words=String(clean||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(word=>word.length>2);
 const queries=[clean+' '+system+' video game',clean+' video game'];
 for(const lang of ['pt','en'])for(const query of queries){
  try{
   const target='http://'+lang+'.wikipedia.org/w/index.php?search='+encodeURIComponent(query);
   const raw=await ue2DescriptionHttpText('https://r.jina.ai/'+target);
   const candidates=raw.split(/\r?\n/).filter(line=>/^\s*\*\s+/.test(line)).map(line=>line.replace(/^\s*\*\s+/,'').trim()).filter(line=>line.length>=45&&!/^\d+\s+KB\s*\(/i.test(line)&&!/^\[?!?\[?Image|^Miniatura para/i.test(line));
   const scored=candidates.map(line=>{const normalized=ue2DescriptionPlain(line).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');return {line,score:words.filter(word=>normalized.includes(word)).length};}).sort((a,b)=>b.score-a.score);
   const picked=ue2DescriptionPlain((scored.find(item=>item.score>0)||scored[0]||{}).line||'').replace(/\s+\d+\s+KB\s*\([^)]*\)\s*[-–—]?\s*$/i,'').trim();
   if(ue2DescriptionUsableText(picked)){
    return {status:'ok',title:clean,source:'Wikipédia ('+lang.toUpperCase()+')',url:'https://'+lang+'.wikipedia.org/w/index.php?search='+encodeURIComponent(query),fetchedAt:new Date().toISOString(),text:picked};
   }
  }catch(error){log('DESCRIPTION_LOOKUP','Jina fallback: '+String(error?.message||error));}
 }
 return null;
}
function ue2DescriptionQueryTitle(title,systemId){
 return String(title||'').replace(/(?:\.(?:nkit|zip|7z|iso|chd|cue|gdi|bin|sfc|smc|gba|gbc|gb|nds|nes|n64|z64|v64|cso|pbp|rvz|gcm|wbfs))+$/i,'').replace(/\s*(?:\([^)]*\)|\[[^\]]*\])/g,'').replace(/\s+\d{2}[.-]\d{2}[.-]\d{2}\s*$/,'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
}
async function ue2DescriptionOnline(title,systemId){
 const clean=ue2DescriptionQueryTitle(title,systemId);if(!clean)return {status:'not-found',title:clean,source:'Wikipedia'};
 const catalogName=ue2Catalog[systemId]||String(systemId||'');
 const system=catalogName.split(' - ').pop()||String(systemId||'').replace(/([a-z])([A-Z])/g,'$1 $2');
 const directTitles=[clean,clean.replace(/,\s*The$/i,' The')].filter((value,index,array)=>value&&array.indexOf(value)===index);
 let hadError=false;
 for(const lang of ['pt','en'])for(const directTitle of directTitles){
  try{
   const direct=await ue2DescriptionHttpJson('https://'+lang+'.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(directTitle.replace(/ /g,'_')));
   const extract=String(direct?.extract||'').replace(/\s+/g,' ').trim();
   if(ue2DescriptionUsableText(extract)&&!/disambiguation/i.test(String(direct?.type||'')))return {status:'ok',title:clean,source:'Wikipédia ('+lang.toUpperCase()+')',url:direct?.content_urls?.desktop?.page||'https://'+lang+'.wikipedia.org/wiki/'+encodeURIComponent(String(direct?.title||directTitle).replace(/ /g,'_')),fetchedAt:new Date().toISOString(),text:extract};
  }catch(error){const message=String(error?.message||'');if(/^HTTP 429\b/.test(message)){const fallback=await ue2DescriptionJina(clean,system);if(fallback)return fallback;return {status:'retry',title:clean,source:'Wikipedia',fetchedAt:new Date().toISOString(),text:''};}if(!/^HTTP 404\b/.test(message))hadError=true;}
 }
 if(hadError)return {status:'retry',title:clean,source:'Wikipedia',fetchedAt:new Date().toISOString(),text:''};
 const queries=['"'+clean+'" video game',clean+' '+system+' video game',clean+' game'];
 for(const lang of ['pt','en'])for(const query of queries){
  try{
   const searchParams=new URLSearchParams({action:'query',list:'search',srsearch:query,srnamespace:'0',srlimit:'5',format:'json',formatversion:'2',utf8:'1'});
   const search=await ue2DescriptionHttpJson('https://'+lang+'.wikipedia.org/w/api.php?'+searchParams.toString());
   const candidates=(search?.query?.search||[]).filter(item=>item?.title&&!/^list of |^category:|\(disambiguation\)/i.test(String(item.title)));
   for(const candidate of candidates.slice(0,5)){
    const extractParams=new URLSearchParams({action:'query',prop:'extracts',titles:candidate.title,exintro:'1',explaintext:'1',exsentences:'8',exchars:'1200',redirects:'1',format:'json',formatversion:'2',utf8:'1'});
    const page=await ue2DescriptionHttpJson('https://'+lang+'.wikipedia.org/w/api.php?'+extractParams.toString());
    const extract=String(page?.query?.pages?.[0]?.extract||'').replace(/\s+/g,' ').trim();
    if(!ue2DescriptionUsableText(extract))continue;
    return {status:'ok',title:clean,source:'Wikipédia ('+lang.toUpperCase()+')',url:'https://'+lang+'.wikipedia.org/wiki/'+encodeURIComponent(String(candidate.title).replace(/ /g,'_')),fetchedAt:new Date().toISOString(),text:extract};
   }
  }catch(error){hadError=true;const message=String(error?.message||'');log('DESCRIPTION_LOOKUP',message);if(/^HTTP 429\b/.test(message))return {status:'retry',title:clean,source:'Wikipedia',fetchedAt:new Date().toISOString(),text:''};}
 }
 return {status:hadError?'retry':'not-found',title:clean,source:'Wikipedia',fetchedAt:new Date().toISOString(),text:''};
}
function ue2Db(){return ueReadJSON(ue2DbFile,{})}
let ue3LocalIndex=null;
function ue3ScanLocalCovers(){
 if(ue3LocalIndex)return ue3LocalIndex;
 const index=new Map(),stack=[{dir:PATHS.capas,depth:0}];
 let visited=0;
 while(stack.length&&visited<22000){
  const {dir,depth}=stack.pop();let entries=[];
  try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{continue}
  for(const entry of entries){
   if(++visited>22000)break;
   const full=path.join(dir,entry.name);
   if(entry.isDirectory()&&depth<3){stack.push({dir:full,depth:depth+1});continue;}
   if(!entry.isFile()||!ue2Exts.includes(path.extname(entry.name).toLowerCase()))continue;
   const normalized=ue3Covers.normalize(path.parse(entry.name).name);
   if(normalized&&!index.has(normalized))index.set(normalized,full);
  }
 }
 ue3LocalIndex=index;return index;
}
let ue20CoverLibrary;
function ue20CoverStore(){return ue20CoverLibrary||(ue20CoverLibrary=require('./cover-library.cjs').create(PATHS.capas,PATHS.scanRoms));}
function ue2Asset(rom){
 const registered=ue20CoverStore().get(rom);if(registered)return registered;
 const key=ue2Hash(rom);
 for(const ext of ue2Exts){const file=path.join(PATHS.capas,key+ext);if(fs.existsSync(file))return file;}
 const stem=path.parse(String(rom)).name;
 const parent=path.basename(path.dirname(rom));
 const names=[stem];
 if(/^eboot$/i.test(stem))names.unshift(parent);
 const local=ue3ScanLocalCovers();
 for(const name of names){
  const val=local.get(ue3Covers.normalize(name));
  if(val&&fs.existsSync(val))return val;
 }
 return null;
}
// Capas da biblioteca usam JPEG de qualidade média para manter a interface
// leve. A conversão é feita com o decodificador nativo do Electron, sem
// adicionar dependências externas ao pacote portátil.
const UE2_COVER_JPEG_QUALITY=72;
function ue2CoverJpeg(buffer){
 const image=nativeImage.createFromBuffer(buffer);
 if(image.isEmpty())throw Error('Imagem de capa inválida');
 const jpeg=image.toJPEG(UE2_COVER_JPEG_QUALITY);
 if(!jpeg?.length)throw Error('Não foi possível converter a capa');
 return jpeg;
}
function ue2WriteCoverJpeg(source,destination){
 const jpeg=ue2CoverJpeg(fs.readFileSync(source));
 fs.writeFileSync(destination,jpeg);
 return jpeg;
}
function ue2CoverData(file){
 if(!file)return null;
 try{
  const st=fs.statSync(file);if(st.size>8*1024*1024)return null;
  const cached=ue2Cache.get(file);if(cached&&cached.mtime===st.mtimeMs)return cached.url;
  const source=fs.readFileSync(file);
  // Mesmo capas PNG/WebP já existentes são entregues como JPEG médio ao
  // renderer, evitando data URLs grandes. Arquivos JPEG também são
  // recompactados quando necessário; os JPEGs gerados pelo próprio app já
  // estão em qualidade média e podem ser enviados diretamente.
  const ext=path.extname(file).toLowerCase();
  const jpeg=(ext==='.jpg'||ext==='.jpeg')?source:ue2CoverJpeg(source);
  const url='data:image/jpeg;base64,'+jpeg.toString('base64');
  if(ue2Cache.size>70)ue2Cache.clear();ue2Cache.set(file,{mtime:st.mtimeMs,url});return url;
 }catch{return null;}
}
function ue2Reply(rom){const db=ue2Db();return {...(db[ue2Hash(rom)]||{}),cover:ue2CoverData(ue2Asset(rom))};}
ipcMain.handle('ue-modern-get',(_,rom)=>ue2Reply(String(rom)));
ipcMain.handle('ue-modern-get-many',(_,roms)=>{
 const list=[...new Set(Array.isArray(roms)?roms.map(String):[])].slice(0,400);
 return list.map(pathname=>({path:pathname,data:ue2Reply(pathname)}));
});
ipcMain.handle('ue-modern-library-size',async(_,request)=>{
 const payload=Array.isArray(request)?{paths:request}:((request&&typeof request==='object')?request:{});
 const list=[...new Set(Array.isArray(payload.paths)?payload.paths.map(value=>String(value||'')).filter(Boolean):[])].slice(0,200000);
 const roots=[...new Set(Array.isArray(payload.roots)?payload.roots.map(value=>String(value||'')).filter(Boolean):[])]
   .map(value=>path.resolve(value)).filter((value,index,array)=>array.indexOf(value)===index);
 const extensions=new Set((Array.isArray(payload.extensions)?payload.extensions:[]).map(value=>String(value||'').toLowerCase()).filter(value=>value.startsWith('.')));
 const files=new Map();
 const ignored=new Set([...IGNORED_LIBRARY_FOLDERS,'capas','database','covers','images','textures','fmvs'].map(value=>value.toLowerCase()));
 const addFile=async pathname=>{
  try{const stat=await fs.promises.stat(pathname);if(!stat.isFile())return;const ext=path.extname(pathname).toLowerCase();if(extensions.size&&!extensions.has(ext))return;files.set(path.resolve(pathname),stat.size);}catch{}
 };
 // Os caminhos já registrados continuam sendo considerados mesmo quando a
 // biblioteca ainda não foi atualizada depois de uma troca de pasta.
 for(const pathname of list)await addFile(pathname);
 const pending=roots.map(root=>path.resolve(root));let visited=0;
 while(pending.length&&visited<200000){
  const current=pending.pop();visited++;
  let entries;try{entries=await fs.promises.readdir(current,{withFileTypes:true});}catch{continue;}
  for(const entry of entries){
   if(!entry||entry.name.startsWith('.'))continue;
   const full=path.join(current,entry.name);
   if(entry.isDirectory()){
    if(!ignored.has(entry.name.toLowerCase()))pending.push(full);
   }else if(entry.isFile())await addFile(full);
  }
 }
 let bytes=0;for(const size of files.values())bytes+=Number(size)||0;
 return {bytes,files:files.size,total:files.size,roots:roots.length,complete:pending.length===0&&visited<200000};
});
ipcMain.handle('ue-modern-played',(_,rom)=>{
 const db=ue2Db(),key=ue2Hash(rom),prev=db[key]||{};
 db[key]={...prev,plays:(prev.plays||0)+1,lastPlayed:new Date().toISOString()};
 ueWriteJSON(ue2DbFile,db);return ue2Reply(rom);
});
ipcMain.handle('ue-modern-pick-cover',async(_,rom)=>{
 const picked=await dialog.showOpenDialog(mainWindow,{properties:['openFile'],filters:[{name:'Imagens',extensions:['png','jpg','jpeg','webp']}]});
 if(picked.canceled||!picked.filePaths?.[0])return ue2Reply(rom);
 const chosen=picked.filePaths[0];const ext=path.extname(chosen).toLowerCase();
 if(!ue2Exts.includes(ext)||fs.statSync(chosen).size>8*1024*1024)throw Error('Formato inválido ou imagem acima de 8 MB.');
 fs.mkdirSync(PATHS.capas,{recursive:true});const key=ue2Hash(rom);
 for(const old of ue2Exts)try{fs.unlinkSync(path.join(PATHS.capas,key+old))}catch{}
 const destination=path.join(PATHS.capas,key+'.jpg');
 ue2WriteCoverJpeg(chosen,destination);
 ue20CoverStore().register(rom,destination);ue2Cache.clear();ue3LocalIndex=null;return ue2Reply(rom);
});
const ue2Catalog={atari8bit:'Atari - 8-bit',atarist:'Atari - ST',megadrive32x:'Sega - 32X',vita:'Sony - PlayStation Vita',snes:'Nintendo - Super Nintendo Entertainment System',nes:'Nintendo - Nintendo Entertainment System',n64:'Nintendo - Nintendo 64',gba:'Nintendo - Game Boy Advance',gbc:'Nintendo - Game Boy Color',gameboy:'Nintendo - Game Boy',nds:'Nintendo - Nintendo DS',gamecube:'Nintendo - GameCube',megadrive:'Sega - Mega Drive - Genesis',mastersystem:'Sega - Master System - Mark III',psx:'Sony - PlayStation',psp:'Sony - PlayStation Portable',atari2600:'Atari - 2600',atari5200:'Atari - 5200',atari7800:'Atari - 7800',dreamcast:'Sega - Dreamcast',segacd:'Sega - Mega-CD - Sega CD',saturn:'Sega - Saturn',ps2:'Sony - PlayStation 2','3do':'The 3DO Company - 3DO',arcade:'MAME'};
// Consulta 1 índice por plataforma, não dezenas de requisições às cegas por jogo.
// Um título sem correspondência exata é mantido sem capa, jamais recebe a capa errada.
const ue3CatalogCache=new Map();
const ue3Misses=new Map();
function ue3HttpsBuffer(url,maxBytes,timeout=13000,redirects=2){return new Promise((resolve,reject)=>{
 if(typeof url!=='string'||!url.startsWith('https://thumbnails.libretro.com/'))return reject(Error('Endereco nao permitido'));
 const parts=[];let size=0;
 const request=ue2Https.get(url,{timeout,headers:{'User-Agent':'UltimateEmulator/3.0','Accept':'image/png,text/html'}},response=>{
  if([301,302,307,308].includes(response.statusCode)&&response.headers.location&&redirects>0){
   response.resume();let next;
   try{next=new URL(response.headers.location,url).href;}catch{return reject(Error('Redirecionamento invalido'))}
   return ue3HttpsBuffer(next,maxBytes,timeout,redirects-1).then(resolve,reject);
  }
  if(response.statusCode!==200){response.resume();return reject(Error('HTTP '+response.statusCode));}
  response.on('data',part=>{size+=part.length;if(size>maxBytes){request.destroy(Error('Limite de download excedido'));return}parts.push(part)});
  response.on('end',()=>resolve(Buffer.concat(parts)));
  response.on('error',reject);
 });
 request.on('timeout',()=>request.destroy(Error('Tempo de resposta esgotado')));
 request.on('error',reject);
})}
function ue3CatalogIndex(catalog,force=false){
 if(force)ue3CatalogCache.delete(catalog);
 if(ue3CatalogCache.has(catalog))return ue3CatalogCache.get(catalog);
 const url='https://thumbnails.libretro.com/'+encodeURIComponent(catalog)+'/Named_Boxarts/';
 const offline=ue20CoverStore().readIndex(catalog,'Named_Boxarts');
 const pending=(!force&&offline.length)?Promise.resolve(offline):ue3HttpsBuffer(url,12*1024*1024,15000).then(b=>{const names=ue3Covers.parseIndex(b.toString('utf8'));ue20CoverStore().saveIndex(catalog,'Named_Boxarts',names);return names;}).catch(()=>offline);
 ue3CatalogCache.set(catalog,pending);return pending;
}
function ue12CatalogIndex(catalog,folder,force=false){
 if(folder==='Named_Boxarts')return ue3CatalogIndex(catalog,force);
 const key=catalog+'/'+folder;
 if(force)ue3CatalogCache.delete(key);
 if(ue3CatalogCache.has(key))return ue3CatalogCache.get(key);
 const url='https://thumbnails.libretro.com/'+encodeURIComponent(catalog)+'/'+folder+'/';
 const offline=ue20CoverStore().readIndex(catalog,folder);
 const pending=(!force&&offline.length)?Promise.resolve(offline):ue3HttpsBuffer(url,20*1024*1024,18000)
   .then(b=>{const names=ue3Covers.parseIndex(b.toString('utf8'));ue20CoverStore().saveIndex(catalog,folder,names);return names;})
   .catch(err=>{log('COVER_INDEX',String(err));return offline;});
 ue3CatalogCache.set(key,pending);return pending;
}
function ue3CandidateNames(rom,displayName='',systemId=''){
 const base=path.parse(String(rom)).name;
 const dirname=path.basename(path.dirname(rom));
 // Never trust a short MAME set identifier as a public catalogue title.
 const raw=[displayName,/^eboot$/i.test(base)?dirname:base,base];
 // Alias oficial de capa do 3DO: Slayer aparece no catalogo como
 // "Advanced Dungeons _ Dragons - Slayer". Sem correspondencia por prefixos aleatorios.
 if(systemId==='3do' && ue3Covers.normalize(displayName||base)==='slayer')
   raw.push('Advanced Dungeons _ Dragons - Slayer');
 if(systemId==='gamecube') {
   for(const title of [displayName,base]) {
     if(!title) continue;
     const clean=String(title)
       // Alguns dumps do GameCube usam nomes duplos como .nkit.iso. O
       // catálogo Libretro publica o título sem esse marcador intermediário.
       .replace(/\.(?:nkit|rvz|gcm|wbfs)$/ig,'')
       .replace(/\((?:PT[ -]?BR\s*)?DUB(?:LADO)?\)/ig,'')
       .replace(/\(PT[ -]?BR\)/ig,'')
       .replace(/\s*-\s*\(Disc\s*(\d+)\)/ig,' (Disc $1)')
       .replace(/\bDisc(\d+)\b/ig,'Disc $1')
       .replace(/\s{2,}/g,' ').trim();
     raw.push(clean);
     if(/^resident evil 3(?:\s|$)/i.test(clean)&&!/(?:nemesis)/i.test(clean))
       raw.push(clean.replace(/^resident evil 3/i,'Resident Evil 3 - Nemesis'));
     if(/resident evil.*code.*veronica/i.test(clean))
       raw.push(clean.replace(/resident evil\s*[-:]?\s*code\s*[-:]?\s*veronica\s*x?/i,
          'Resident Evil - Code - Veronica X'));
   }
 }
 return [...new Set(raw.map(s=>String(s||'').replace(/\s*\((?:www\.|https?:)[^)]*\)/gi,'').trim())
   .filter(s=>s&&s.length<241))];
}
ipcMain.handle('ue-modern-auto-cover',async(_,rom,systemId,force=false,displayName='')=>{
 // A capa local sempre tem prioridade nas buscas automáticas. A exceção é
 // o comando explícito do menu de contexto (force=true), que permite pedir
 // uma nova capa da internet e substituir a associação atual.
 if(!force&&ue2Asset(rom))return ue2Reply(rom);
 const catalog=ue2Catalog[systemId];if(!catalog)return ue2Reply(rom);
 const key=ue2Hash(rom),until=ue3Misses.get(key)||0;
 if(!force&&Date.now()<until)return ue2Reply(rom);
 const names=ue3CandidateNames(rom,displayName,systemId);
 const types=systemId==='arcade' ? ['Named_Boxarts','Named_Snaps'] :
   systemId==='gamecube' ? ['Named_Boxarts','Named_Snaps'] : ['Named_Boxarts'];
 for(const folder of types){
   const index=await ue12CatalogIndex(catalog,folder,force);
   let file=null;
   for(const name of names){file=ue3Covers.bestCover(name,index);if(file)break;}
   if(!file)continue;
   try {
     const url='https://thumbnails.libretro.com/'+encodeURIComponent(catalog)+'/'+folder+'/'+encodeURIComponent(file);
     const img=await ue3HttpsBuffer(url,5*1024*1024,14000);
     if(img.length<100||img.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('PNG invalido');
     fs.mkdirSync(PATHS.capas,{recursive:true});
     const downloaded=path.join(PATHS.capas,key+'.jpg');
     fs.writeFileSync(downloaded,ue2CoverJpeg(img));
     ue20CoverStore().register(rom,downloaded,{title:displayName,catalog,sourceName:file,url});
     ue2Cache.clear();ue3LocalIndex=null;ue3Misses.delete(key);
     return ue2Reply(rom);
   }catch(error){log('COVER_ERROR',String(error));}
 }
 // Transient network failure should not suppress the next scan for half a day.
 ue3Misses.set(key,Date.now()+30*60*1000);
 return ue2Reply(rom);
});


// ULTIMATE EMULATOR V9 — actual game-file recycle-bin management.
const ue9LibraryOps = require('./library-actions-v9');
function ue9LibraryCacheRecords(){
  const result=[];
  const old=ueReadJSON(UE_CACHE,null);
  if(old)result.push({...old,roots:[ueResolve(old.relativeRoot,old.root),old.root].filter(Boolean)});
  const recent=ue6Read(UE6_LIBRARY,null);
  if(recent)result.push({...recent,roots:[
    recent.relativeRoot ? path.resolve(PORTABLE_ROOT,recent.relativeRoot):null,
    recent.root
  ].filter(Boolean)});
  return result;
}
function ue9PruneLibrary(removedFiles){
  const gone = new Set(removedFiles.map(ue9LibraryOps.canon));
  for(const cacheFile of [UE_CACHE,UE6_LIBRARY]){
    const data=ueReadJSON(cacheFile,null);
    if(!data)continue;
    const collection=data.entries||data.items;
    if(!collection)continue;
    const roots=cacheFile===UE_CACHE
      ? [ueResolve(data.relativeRoot,data.root),data.root]
      : [data.relativeRoot?path.resolve(PORTABLE_ROOT,data.relativeRoot):null,data.root];
    const root=roots.find(x=>x&&fs.existsSync(x));
    if(!root)continue;
    for(const key of Object.keys(collection)){
      collection[key]=(collection[key]||[]).filter(item=>{
        if(!item||typeof item.relative!=='string')return true;
        return !gone.has(ue9LibraryOps.canon(path.resolve(root,item.relative)));
      });
    }
    ueWriteJSON(cacheFile,data);
  }
  const prefs=ueReadJSON(ue2PreferencesFile,null);
  if(prefs){
    for(const field of ['favorites','recent'])if(Array.isArray(prefs[field]))
      prefs[field]=prefs[field].filter(p=>!gone.has(ue9LibraryOps.canon(p)));
    ueWriteJSON(ue2PreferencesFile,prefs);
  }
}
ipcMain.handle('ue9-show-game-in-folder',(_,gamePath)=>{
  const allowed=ue9LibraryOps.makeIndexedPaths(ue9LibraryCacheRecords());
  const file=ue9LibraryOps.safeFile(gamePath,allowed);
  shell.showItemInFolder(file);
  return {ok:true};
});
ipcMain.handle('ue9-trash-games',async(_,paths)=>{
  const allowed=ue9LibraryOps.makeIndexedPaths(ue9LibraryCacheRecords());
  const confirm=async p=>{
    const listed=p.files.slice(0,9).map(v=>'• '+path.basename(v)).join('\n');
    const more=p.files.length>9?`\n... e mais ${p.files.length-9} arquivo(s)`:'';
    const body=`Jogos selecionados: ${p.primary.length}\nArquivos que serao enviados a Lixeira: ${p.files.length}`+
      (p.extras.length?`\nInclui ${p.extras.length} faixa(s) referenciada(s) por arquivos CUE.`:'')+
      `\n\n${listed}${more}\n\nOs arquivos originais serao movidos para a Lixeira do sistema.`;
    const opts={type:'warning',title:'Excluir jogos da biblioteca',message:'Mover arquivos originais para a Lixeira?',detail:body,
      buttons:['Cancelar','Mover para a Lixeira'],defaultId:0,cancelId:0,noLink:true};
    const res=await dialog.showMessageBox(mainWindow,opts);
    return res.response===1;
  };
  const outcome=await ue9LibraryOps.moveToTrash(paths,allowed,p=>shell.trashItem(p),confirm);
  if(!outcome.cancelled && outcome.removed.length)ue9PruneLibrary(outcome.removed);
  return outcome;
});

const ueRegionDetector=require('./game-region.cjs');
ipcMain.handle('ue-game-region',async(_,rom)=>{if(typeof rom!=='string')return {region:null};const relative=path.relative(PATHS.scanRoms,path.resolve(rom));if(relative.startsWith('..')||path.isAbsolute(relative))return {region:null};return ueRegionDetector.detect(rom);});

function ue2DescriptionAllowedRom(rom){
 if(typeof rom!=='string'||!PATHS.scanRoms)return false;
 const relative=path.relative(PATHS.scanRoms,path.resolve(rom));
 return relative!==''&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative);
}
ipcMain.handle('ue2-description-get',(_,rom)=>{
 if(!ue2DescriptionAllowedRom(rom))return {status:'missing',text:'',cached:false};
 ue2DescriptionCache.delete(ue2Hash(rom));
 return ue2DescriptionReply(rom);
});
ipcMain.handle('ue2-description-edit',async(_,rom)=>{
 if(!ue2DescriptionAllowedRom(rom))return {ok:false,error:'ROM fora da biblioteca'};
 const current=ue2DescriptionRead(rom)||{};
 const saved=ue2DescriptionWrite(rom,{status:'manual',title:current.title||path.parse(rom).name,source:'Edição manual',url:'',text:current.text||''});
 const file=ue2DescriptionFile(rom);let error='';try{error=await shell.openPath(file)||'';}catch(errorObject){error=String(errorObject?.message||errorObject)}
 return {ok:!error,file,description:saved,error};
});
ipcMain.handle('ue2-description-save',(_,rom,text)=>{
 if(!ue2DescriptionAllowedRom(rom))return {status:'missing',text:'',cached:false};
 const current=ue2DescriptionRead(rom)||{};
 return ue2DescriptionWrite(rom,{status:'manual',title:current.title||path.parse(rom).name,source:'Edição manual',url:'',text:String(text||'').slice(0,20000)});
});
ipcMain.handle('ue2-description-auto',async(_,rom,systemId,title,force=false)=>{
 if(!ue2DescriptionAllowedRom(rom))return {status:'missing',text:'',cached:false};
 const cached=ue2DescriptionRead(rom);
 if(cached&&!force&&(cached.status==='ok'||cached.status==='not-found'))return cached;
 try{
  const result=await ue2DescriptionOnline(String(title||path.parse(rom).name),String(systemId||''));
  if(result.status==='ok'||result.status==='not-found')return ue2DescriptionWrite(rom,result);
  return result;
 }catch(error){log('DESCRIPTION_ERROR',String(error));return {status:'retry',text:'',cached:false,error:error.message};}
});

ipcMain.handle('ue-keyboard-defaults',(_,folder)=>({p1:require('./keyboard-defaults.cjs').keys(folder,1),p2:require('./keyboard-defaults.cjs').keys(folder,2)}));
ipcMain.handle('ue-mame-turbo-status',()=>ue18ActiveMameSet?require('./mame-session-turbo.cjs').status(PATHS.database,ue18ActiveMameSet):{running:false,bindings:[]});
ipcMain.handle('ue-mame-turbo-set',(_,request)=>{if(!ue18ActiveMameSet)return {ok:false,error:'Abra um jogo MAME antes de escolher o turbo.'};try{return {ok:true,...require('./mame-session-turbo.cjs').configure(PATHS.database,ue18ActiveMameSet,request||{},ue4Mame)}}catch(error){return {ok:false,error:error.message}}});

ipcMain.handle('ue-retro-turbo-read',(_,folder)=>require('./retroarch-session-turbo.cjs').read(folder));
ipcMain.handle('ue-retro-turbo-set',(_,folder,request)=>{try{return {ok:true,state:require('./retroarch-session-turbo.cjs').set(folder,request)}}catch(error){return {ok:false,error:error.message}}});

// Read-only game information from the installed catalog / exact MAME set.
ipcMain.handle('ue-game-info',async(_,payload)=>{
 const rom=payload?.rom,catalog=ue2Catalog[payload?.systemId];
 if(typeof rom!=='string'||!catalog)return {};
 const relative=path.relative(PATHS.scanRoms,path.resolve(rom));
 if(relative.startsWith('..')||path.isAbsolute(relative))return {};
 return require('./game-info.cjs').detect({rom,catalog,rdbRoot:path.join(PATHS.frontends,'RetroArch','database','rdb'),mameExe:path.join(PATHS.mame,'mame.exe')});
});

// Follow the Windows appearance, including changes while the launcher is open.
nativeTheme.themeSource='system';
ipcMain.handle('ue-windows-theme',()=>({dark:nativeTheme.shouldUseDarkColors}));
nativeTheme.on('updated',()=>{
 if(mainWindow&&!mainWindow.isDestroyed()){
  mainWindow.setBackgroundColor(nativeTheme.shouldUseDarkColors?'#171b23':'#f6f8fc');
  mainWindow.webContents.send('ue-windows-theme-updated',{dark:nativeTheme.shouldUseDarkColors});
 }
});

// In-game tools are bound to the current process and exact game identity.
var ueLiveMame=null;
var ueLiveTools=require('./live-game-panel.cjs')({
 BrowserWindow,ipcMain,globalShortcut,paths:PATHS,log,udp:ue13Udp,
 getSession:()=>{
  const proc=activeEmulator;if(!proc||proc.exitCode!==null||ue13PendingLoad)return null;
  if(/retroarch\.exe$/i.test(proc.spawnfile||'')&&ue13ActiveGame){
   return {kind:'retroarch',proc,system:ue13ActiveGame.systemFolder,title:path.parse(ue13ActiveGame.romPath).name,game:ue159Game};
  }
  if(/mame(?:64)?\.exe$/i.test(proc.spawnfile||'')&&ueLiveMame){
   return {kind:'mame',proc,set:ueLiveMame.set,title:ueLiveMame.set,game:ueLiveMame};
  }
  return null;
 },
 readOptions:ue6Options,shaderPath:ue6ShaderPath,
 shaderPresets:()=>UE9_PRESETS.filter(x=>ue6ShaderPath(x[2])).map(x=>({value:x[2],label:x[1]})),
 writeShader:(folder,shader)=>{
  const all=ue6Read(UE6_SETTINGS,{});all[folder]={...all[folder],shader};ue6Write(UE6_SETTINGS,all);
  ue153PersistentConfig(folder);
 },
 focusGame:()=>{
  const proc=activeEmulator;if(!proc||proc.exitCode!==null)return;
  const pid=Number(proc.pid);if(!Number.isInteger(pid)||pid<=0)return;
  const helper=spawn('powershell.exe',['-NoProfile','-NonInteractive','-WindowStyle','Hidden','-Command',
   '$s=New-Object -ComObject WScript.Shell; $s.AppActivate('+pid+') | Out-Null'],{windowsHide:true,stdio:'ignore'});
  helper.on('error',e=>log('LIVE_FOCUS_ERROR',String(e)));
 }
});
