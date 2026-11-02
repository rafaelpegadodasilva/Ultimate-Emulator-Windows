/**
 * Ultimate Emulator — Renderer Process
 * Vanilla JS SPA, no build step, no external dependencies.
 * Runs inside Electron via index.html → <script src="app.js">
 */

'use strict';

// ─── System Definitions ───────────────────────────────────────────────────────

const SYSTEMS = [
  {
    id: 'atari2600',
    name: 'Atari 2600',
    folder: 'Atari 2600',
    colors: ['#eb2e1f', '#ff8519'],
    launcher: 'retroarch',
    core: 'stella_libretro.dll',
    extensions: ['.a26', '.bin', '.rom', '.zip', '.7z'],
  },
  {
    id: 'atari8bit',
    name: 'Atari 8-bit',
    folder: 'Atari 8-bit',
    colors: ['#e83a1f', '#ff9a30'],
    launcher: 'retroarch',
    core: 'atari800_libretro.dll',
    extensions: ['.atr', '.xfd', '.atx', '.cas', '.bin', '.zip'],
  },
  {
    id: 'atari5200',
    name: 'Atari 5200',
    folder: 'Atari 5200',
    colors: ['#e05010', '#ff7020'],
    launcher: 'retroarch',
    core: 'a5200_libretro.dll',
    extensions: ['.a52', '.bin', '.rom', '.zip'],
  },
  {
    id: 'atari7800',
    name: 'Atari 7800',
    folder: 'Atari 7800',
    colors: ['#c04020', '#ff6030'],
    launcher: 'retroarch',
    core: 'prosystem_libretro.dll',
    extensions: ['.a78', '.bin', '.zip'],
  },
  {
    id: 'atarist',
    name: 'Atari ST',
    folder: 'Atari ST',
    colors: ['#b03020', '#e85020'],
    launcher: 'retroarch',
    core: 'hatari_libretro.dll',
    extensions: ['.st', '.msa', '.stx', '.zip'],
  },
  {
    id: 'snes',
    name: 'Super Nintendo',
    folder: 'Super Nintendo',
    colors: ['#9452ff', '#e056ff'],
    launcher: 'retroarch',
    core: 'snes9x_libretro.dll',
    extensions: ['.smc', '.sfc', '.fig', '.zip', '.7z'],
  },
  {
    id: 'nes',
    name: 'Nintendo 8 Bits',
    folder: 'Nintendo 8 Bits',
    colors: ['#0f99ff', '#00d1fa'],
    launcher: 'retroarch',
    core: 'nestopia_libretro.dll',
    extensions: ['.nes', '.fds', '.unf', '.zip', '.7z'],
  },
  {
    id: 'n64',
    name: 'Nintendo 64',
    folder: 'Nintendo 64',
    colors: ['#0dc77a', '#2de6b3'],
    launcher: 'retroarch',
    core: 'mupen64plus_next_libretro.dll',
    extensions: ['.n64', '.z64', '.v64', '.zip', '.7z'],
  },
  {
    id: 'gamecube',
    name: 'Nintendo GameCube',
    folder: 'Nintendo GameCube',
    colors: ['#6138eb', '#b885ff'],
    launcher: 'dolphin',
    core: null,
    extensions: ['.iso', '.gcm', '.gcz', '.rvz', '.wbfs'],
  },
  {
    id: 'gameboy',
    name: 'Game Boy',
    folder: 'GameBoy',
    colors: ['#1fc7c7', '#38eaea'],
    launcher: 'retroarch',
    core: 'gambatte_libretro.dll',
    extensions: ['.gb', '.zip', '.7z'],
  },
  {
    id: 'gbc',
    name: 'Game Boy Color',
    folder: 'GameBoyColor',
    colors: ['#c7a31f', '#eac738'],
    launcher: 'retroarch',
    core: 'gambatte_libretro.dll',
    extensions: ['.gbc', '.gb', '.zip', '.7z'],
  },
  {
    id: 'gba',
    name: 'Game Boy Advance',
    folder: 'GameBoyAdvance',
    colors: ['#c71f6f', '#ea38a0'],
    launcher: 'retroarch',
    core: 'mgba_libretro.dll',
    extensions: ['.gba', '.zip', '.7z'],
  },
  {
    id: 'nds',
    name: 'Nintendo DS',
    folder: 'NintendoDS',
    colors: ['#6fc71f', '#96ea38'],
    launcher: 'retroarch',
    core: 'melondsds_libretro.dll',
    extensions: ['.nds', '.zip', '.7z'],
  },
  {
    id: 'mastersystem',
    name: 'Master System',
    folder: 'Master System',
    colors: ['#337aff', '#47adff'],
    launcher: 'retroarch',
    core: 'genesis_plus_gx_libretro.dll',
    extensions: ['.sms', '.bin', '.zip', '.7z'],
  },
  {
    id: 'megadrive',
    name: 'Mega Drive',
    folder: 'Mega Drive',
    colors: ['#00b8e8', '#03e6ff'],
    launcher: 'retroarch',
    core: 'genesis_plus_gx_libretro.dll',
    extensions: ['.md', '.gen', '.bin', '.smd', '.zip', '.7z'],
  },
  {
    id: 'segacd',
    name: 'Sega CD',
    folder: 'Sega CD',
    colors: ['#ff7a29', '#ff4233'],
    launcher: 'retroarch',
    core: 'genesis_plus_gx_libretro.dll',
    extensions: ['.iso', '.bin', '.cue', '.chd', '.zip'],
  },
  {
    id: 'megadrive32x',
    name: 'Mega Drive 32X',
    folder: 'Mega Drive 32X',
    colors: ['#0090c0', '#00c8e8'],
    launcher: 'retroarch',
    core: 'picodrive_libretro.dll',
    extensions: ['.32x', '.bin', '.zip', '.7z'],
  },
  {
    id: 'saturn',
    name: 'Sega Saturn',
    folder: 'Sega Saturn',
    colors: ['#0dade0', '#1ee0f5'],
    launcher: 'retroarch',
    core: 'mednafen_saturn_libretro.dll',
    extensions: ['.iso', '.bin', '.cue', '.chd', '.mdf'],
  },
  {
    id: 'dreamcast',
    name: 'Dreamcast',
    folder: 'Dreamcast',
    colors: ['#ff5740', '#ff9e2e'],
    launcher: 'retroarch',
    core: 'flycast_libretro.dll',
    extensions: ['.gdi', '.cdi', '.chd', '.iso'],
  },
  {
    id: '3do',
    name: '3DO',
    folder: '3DO',
    colors: ['#eb9e12', '#ffcc33'],
    launcher: 'retroarch',
    core: 'opera_libretro.dll',
    extensions: ['.iso', '.bin', '.cue', '.chd'],
  },
  {
    id: 'arcade',
    name: 'Arcade / MAME',
    folder: 'Arcade - MAME',
    colors: ['#1ec257', '#66eb38'],
    launcher: 'mame',
    core: null,
    extensions: ['.zip', '.7z', '.chd'],
  },
  {
    id: 'psx',
    name: 'PlayStation 1',
    folder: 'PlayStation 1',
    colors: ['#1f76ff', '#52b2ff'],
    launcher: 'retroarch',
    core: 'swanstation_libretro.dll',
    extensions: ['.iso', '.bin', '.cue', '.chd', '.pbp', '.mdf', '.m3u'],
  },
  {
    id: 'ps2',
    name: 'PlayStation 2',
    folder: 'PlayStation 2',
    colors: ['#3861eb', '#80a8ff'],
    launcher: 'pcsx2',
    core: null,
    extensions: ['.iso', '.bin', '.img', '.mdf', '.chd'],
  },
  {
    id: 'psp',
    name: 'PlayStation Portable',
    folder: 'PlayStation Portable',
    colors: ['#b829bd', '#ff5cd1'],
    launcher: 'ppsspp',
    core: 'ppsspp_libretro.dll',
    extensions: ['.iso', '.cso', '.pbp', '.elf'],
  },
  {
    id: 'vita',
    name: 'PlayStation Vita',
    folder: 'PlayStation Vita',
    colors: ['#1d5cf5', '#52a3ff'],
    launcher: 'vita3k',
    core: null,
    extensions: ['.vpk', '.pkg', '.zip'],
  },

];

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  selectedSystem: SYSTEMS[0],
  roms: [],
  libraries: {},
  selectedRom: null,
  scanning: false,
  launching: false,
  paths: null,
  statusMessage: '',
  statusType: 'info', // 'info' | 'success' | 'error'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLauncherLabel(system) {
  switch (system.launcher) {
    case 'retroarch': return `RetroArch  ·  ${system.core}`;
    case 'pcsx2':     return 'PCSX2 (standalone)';
    case 'ppsspp':    return 'PPSSPP · Direct3D 11';
    case 'dolphin':   return 'Dolphin (standalone)';

    case 'vita3k':    return 'Vita3K (standalone)';
    case 'mame':      return 'MAME (standalone)';
    default:          return system.launcher;
  }
}

function setStatus(msg, type = 'info') {
  state.statusMessage = msg;
  state.statusType = type;
  const bar = document.getElementById('status-bar');
  if (bar) {
    bar.textContent = msg;
    bar.className = 'status-bar status-' + type;
  }
}

function ueLoading(show, detail = 'Preparando...', progress = null) {
  const overlay = document.getElementById('ue-loading-overlay');
  if (!overlay) return;
  const text = document.getElementById('ue-loading-detail');
  const bar = document.getElementById('ue-loading-progress');
  overlay.classList.toggle('is-open', Boolean(show));
  overlay.setAttribute('aria-busy', show ? 'true' : 'false');
  if (text) text.textContent = detail;
  if (bar) {
    bar.classList.toggle('indeterminate', progress === null);
    if (progress !== null) bar.style.width = `${Math.max(0, Math.min(100, Number(progress) || 0))}%`;
  }
}

async function ueWithLoading(detail, task, progress = null) {
  ueLoading(true, detail, progress);
  try { return await task(); }
  finally { ueLoading(false); }
}

function basename(path) {
  return path.replace(/\\/g, '/').split('/').pop();
}

// ─── Electron API bridge (graceful fallback for browser testing) ──────────────

const api = {
  async getPaths() {
    if (window.electronAPI && window.electronAPI.getPaths) {
      return window.electronAPI.getPaths();
    }
    // Fallback for dev/testing outside Electron
    return { romsRoot: 'C:\\Roms', emulatorRoot: 'C:\\Emulators' };
  },
  async scanRoms(system, chooseFolder = false) {
    if (window.electronAPI && window.electronAPI.scanRoms) {
      return window.electronAPI.scanRoms({...system,systems:SYSTEMS,chooseFolder});
    }
    // Stub
    return [`${system.folder}\\demo_rom_1.zip`, `${system.folder}\\demo_rom_2.zip`];
  },
  async scanAllRoms(systemFolders) {
    if (window.electronAPI && window.electronAPI.scanAllRoms) return window.electronAPI.scanAllRoms(systemFolders);
    const result = {}; for (const folder of systemFolders) result[folder] = await this.scanRoms(folder); return result;
  },
  async chooseScanFiles() {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file'; input.multiple = true; input.webkitdirectory = true; input.directory = true;
      input.onchange = () => resolve(Array.from(input.files || []).map(file => file.path).filter(Boolean));
      input.click();
    });
  },
  async scanGlobalFiles(files, systems) {
    if (window.electronAPI && window.electronAPI.scanGlobalFiles) return window.electronAPI.scanGlobalFiles({ files, systems });
    return this.scanAllRoms(systems.map(s => s.folder));
  },
  launchRetroArch(romPath, corePath, systemFolder) {
    if (window.electronAPI && window.electronAPI.launchRetroArch) {
      return window.electronAPI.launchRetroArch({ romPath, corePath, systemFolder });
    }
    console.log('[stub] launchRetroArch', romPath, corePath);
  },
  launchPCSX2(romPath) {
    if (window.electronAPI && window.electronAPI.launchPCSX2) {
      return window.electronAPI.launchPCSX2({ romPath });
    }
    console.log('[stub] launchPCSX2', romPath);
  },
  launchDolphin(romPath) {
    if (window.electronAPI && window.electronAPI.launchDolphin) {
      return window.electronAPI.launchDolphin({ romPath });
    }
    console.log('[stub] launchDolphin', romPath);
  },

  launchVita3K(romPath) {
    if (window.electronAPI && window.electronAPI.launchVita3K) {
      return window.electronAPI.launchVita3K({ romPath });
    }
    console.log('[stub] launchVita3K', romPath);
  },
  launchPPSSPP(romPath) {
    return window.electronAPI.launchPPSSPP({romPath});
  },
  launchMAME(romPath) {
    if (window.electronAPI && window.electronAPI.launchMAME) {
      const setName = basename(romPath).replace(/\.[^.]+$/, '');
      return window.electronAPI.launchMAME({ setName, romPath });
    }
    console.log('[stub] launchMAME', romPath);
  },
};

// ─── Launch dispatcher ────────────────────────────────────────────────────────

async function launchRom(system, romPath, ue14Direct=false) {
  if (state.launching) return;
  if (system?.launcher==='pcsx2' && !ue14Direct) {
    ue17PS2Dialog(system,romPath);
    return;
  }
  if (!romPath) {
    setStatus('Selecione uma ROM para jogar.', 'error');
    return;
  }
  setStatus(`Iniciando ${system.name}…`, 'info');
  ueLoading(true, `Abrindo ${system.name}...`);
  state.launching = true;
  renderPlayButton();

  try {
    switch (system.launcher) {
      case 'retroarch': {
        if (system.id === 'psx') {
          const result = await api.ue1511DuckStation({
            mode:'play',
            romPath
          });

          if (!result || result.ok === false) {
            throw new Error(
              result?.error || 'Falha ao iniciar DuckStation.'
            );
          }
          break;
        }
        const corePath = state.paths?.cores
          ? `${state.paths.cores}\\${system.core}`
          : system.core;
        const result = await api.launchRetroArch(romPath, corePath, system.folder);
        if (result && result.ok === false) throw new Error(result.error || 'Falha ao abrir o RetroArch.');
        break;
      }
      case 'pcsx2':   { const r = await api.launchPCSX2(romPath);   if (r && r.ok === false) throw new Error(r.error); break; }
      case 'ppsspp':  { const r = await api.launchPPSSPP(romPath);  if (r && r.ok === false) throw new Error(r.error); break; }
      case 'dolphin': { const r = await api.launchDolphin(romPath); if (r && r.ok === false) throw new Error(r.error); break; }
      case 'vita3k':  { const r = await api.launchVita3K(romPath);  if (r && r.ok === false) throw new Error(r.error); break; }
      case 'mame':    { const r = await api.launchMAME(romPath);    if (r && r.ok === false) throw new Error(r.error); break; }
      default:
        setStatus(`Launcher desconhecido: ${system.launcher}`, 'error');
    }
    setStatus(`${system.name} iniciado!`, 'success');
    ue2Played(romPath);
  } catch (err) {
    setStatus(`Erro ao iniciar: ${err.message || err}`, 'error');
  } finally {
    ueLoading(false);
    state.launching = false;
    renderPlayButton();
  }
}

// ─── Scan ROMs ────────────────────────────────────────────────────────────────

async function scanRoms(system, chooseFolder = false) {
  if (state.scanning) return;
  state.scanning = true;
  renderScanButton();
  setStatus(`Escaneando ROMs de ${system.name}…`, 'info');
  ueLoading(true, `Escaneando ${system.name}...`);
  try {
    const files = await api.scanRoms(system, chooseFolder);
    if(files === null){setStatus('Busca cancelada.','info');return;}
    const libraries = {...state.libraries, [system.folder]: files || []};
    await window.electronAPI.ue6SaveLibrary({root:state.paths.scanRoms,libraries});
    state.libraries = libraries;
    state.roms = libraries[state.selectedSystem.folder] || [];
    state.selectedRom = null;
    UE2.selectedGames.clear();
    UE2.selectionAnchor = null;
    renderRomList();
    ue2RenderDetail();
    ue2RenderRecent();
    setStatus(`${system.name}: ${files.length} jogo(s). Lista substituída sem duplicatas.`, 'success');
  } catch (err) {
    setStatus(`Erro ao escanear: ${err.message || err}`, 'error');
  } finally {
    ueLoading(false);
    state.scanning = false;
    renderScanButton();
  }
}

async function globalScan() {
  if(state.scanning) return;
  const bridge = window.electronAPI;

  try {
    const folder = await bridge.chooseScanFolder();
    if(!folder) return;

    state.scanning = true;
    renderScanButton();
    setStatus('Procurando jogos nas subpastas...','info');
    ueLoading(true, 'GLOBAL SCAN em andamento...');

    const libraries = await bridge.scanGlobalFolder({
      folder,systems:SYSTEMS
    });
    await bridge.ue6SaveLibrary({root:folder,libraries});

    state.paths.scanRoms = folder;
    state.libraries = libraries;
    state.roms = libraries[state.selectedSystem.folder] || [];
    state.selectedRom = null;
    renderRomList();

    const total = Object.values(libraries)
      .reduce((n,files)=>n+files.length,0);
    setStatus(`${total} jogos encontrados. Biblioteca salva.`,'success');
  } catch(error) {
    setStatus('Erro no scan: '+error.message,'error');
  } finally {
    ueLoading(false);
    state.scanning = false;
    renderScanButton();
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function injectStyles() {
  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 100%; height: 100%;
      background: #0d0d0d;
      color: #f0f0f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      overflow: hidden;
      user-select: none;
    }

    #app {
      display: flex;
      flex-direction: column;
      width: 100vw;
      height: 100vh;
    }

    /* ── Titlebar ── */
    #titlebar {
      height: 38px;
      background: #111111;
      border-bottom: 1px solid #222;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-app-region: drag;
      flex-shrink: 0;
      position: relative;
    }

    #titlebar-title {
      font-size: 13px;
      font-weight: 600;
      color: #aaa;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    /* ── Body layout ── */
    #body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── Sidebar ── */
    #sidebar {
      width: 210px;
      min-width: 210px;
      background: #111111;
      border-right: 1px solid #1e1e1e;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      padding: 8px 0;
      flex-shrink: 0;
    }

    #sidebar::-webkit-scrollbar { width: 12px; }
    #sidebar::-webkit-scrollbar-track { background: #151b24; }
    #sidebar::-webkit-scrollbar-thumb { background: #5b6f89; border: 3px solid #151b24; border-radius: 999px; min-height: 34px; }

    .sidebar-section-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #555;
      padding: 12px 14px 4px;
    }

    .system-btn {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 7px 12px;
      margin: 1px 6px;
      border-radius: 7px;
      border: none;
      background: transparent;
      color: #ccc;
      cursor: pointer;
      text-align: left;
      width: calc(100% - 12px);
      transition: background 0.15s, color 0.15s;
      outline: none;
      -webkit-app-region: no-drag;
    }

    .system-btn:hover {
      background: #1c1c1c;
      color: #fff;
    }

    .system-btn.active {
      background: #1e1e1e;
      color: #fff;
    }

    .system-btn-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .system-btn-name {
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Main content ── */
    #main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #0d0d0d;
    }

    /* ── System header ── */
    #system-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid #1a1a1a;
      flex-shrink: 0;
    }

    #system-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    #system-core-info {
      font-size: 11px;
      color: #666;
      font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
    }

    /* ── Action bar ── */
    #action-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 24px;
      border-bottom: 1px solid #1a1a1a;
      flex-shrink: 0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border-radius: 7px;
      border: none;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      transition: opacity 0.15s, transform 0.1s;
      -webkit-app-region: no-drag;
      letter-spacing: 0.02em;
    }

    .btn:active { transform: scale(0.97); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-scan {
      background: #1e1e1e;
      color: #ddd;
      border: 1px solid #2e2e2e;
    }

    .btn-scan:hover:not(:disabled) { background: #252525; }

    .btn-play {
      color: #fff;
      background: linear-gradient(135deg, var(--sys-c1), var(--sys-c2));
      min-width: 90px;
      justify-content: center;
    }

    .btn-play:hover:not(:disabled) { opacity: 0.88; }

    /* ── ROM list ── */
    #rom-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 0;
    }

    #rom-list-header {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #555;
      padding: 10px 24px 6px;
      flex-shrink: 0;
    }

    #rom-list {
      flex: 1;
      overflow-y: auto;
      padding: 4px 14px 14px;
    }

    #rom-list::-webkit-scrollbar { width: 12px; }
    #rom-list::-webkit-scrollbar-track { background: #151b24; }
    #rom-list::-webkit-scrollbar-thumb { background: #5b6f89; border: 3px solid #151b24; border-radius: 999px; min-height: 34px; }

    .rom-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 2px;
      border: 1px solid transparent;
      transition: background 0.12s, border-color 0.12s;
      -webkit-app-region: no-drag;
    }

    .rom-item:hover { background: #161616; }

    .rom-item.selected {
      background: #1b1b1b;
      border-color: var(--sys-c1);
    }

    .rom-item-icon {
      font-size: 14px;
      flex-shrink: 0;
      opacity: 0.7;
    }

    .rom-item-name {
      font-size: 12px;
      color: #ddd;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rom-empty {
      color: #444;
      font-size: 12px;
      text-align: center;
      padding: 40px 20px;
      line-height: 1.8;
    }

    .rom-empty-icon {
      font-size: 36px;
      display: block;
      margin-bottom: 10px;
      opacity: 0.3;
    }

    /* ── Status bar ── */
    #status-bar {
      height: 26px;
      padding: 0 24px;
      font-size: 11px;
      display: flex;
      align-items: center;
      border-top: 1px solid #181818;
      flex-shrink: 0;
      color: #555;
      font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
    }

    .status-info    { color: #555; }
    .status-success { color: #2de6b3; }
    .status-error   { color: #ff5740; }

    /* ── Spinner ── */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255,255,255,0.15);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// ─── DOM Builders ─────────────────────────────────────────────────────────────

function el(tag, attrs = {}, ...children) {
  const elem = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') elem.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(elem.style, v);
    else if (k.startsWith('on') && typeof v === 'function') elem.addEventListener(k.slice(2).toLowerCase(), v);
    else elem.setAttribute(k, v);
  }
  for (const child of children) {
    if (child == null) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      elem.appendChild(document.createTextNode(child));
    } else {
      elem.appendChild(child);
    }
  }
  return elem;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function buildSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';

  const label = el('div', { className: 'sidebar-section-label' }, 'Sistemas');
  sidebar.appendChild(label);

  for (const system of SYSTEMS) {
    const btn = el('button', {
      className: 'system-btn' + (system === state.selectedSystem ? ' active' : ''),
      id: `sys-btn-${system.id}`,
      title: system.name,
      onClick: () => selectSystem(system),
    });

    const dot = el('span', {
      className: 'system-btn-dot',
      style: {
        background: `linear-gradient(135deg, ${system.colors[0]}, ${system.colors[1]})`,
      },
    });

    const name = el('span', { className: 'system-btn-name' }, system.name);
    btn.appendChild(dot);
    btn.appendChild(name);
    sidebar.appendChild(btn);
  }
}

function updateSidebarActive() {
  for (const system of SYSTEMS) {
    const btn = document.getElementById(`sys-btn-${system.id}`);
    if (btn) {
      btn.className = 'system-btn' + (system === state.selectedSystem ? ' active' : '');
    }
  }
}

// ─── System Header ────────────────────────────────────────────────────────────

function renderSystemHeader() {
  const s = state.selectedSystem;
  const title = document.getElementById('system-title');
  const coreInfo = document.getElementById('system-core-info');
  const main = document.getElementById('main');

  title.textContent = s.name;
  title.style.background = `linear-gradient(90deg, ${s.colors[0]}, ${s.colors[1]})`;
  title.style.webkitBackgroundClip = 'text';
  title.style.webkitTextFillColor = 'transparent';
  title.style.backgroundClip = 'text';

  coreInfo.textContent = s.id === 'psx'
    ? 'DuckStation Intel x64 (standalone)'
    : getLauncherLabel(s);

  // Update CSS variables on main for btn-play gradient
  main.style.setProperty('--sys-c1', s.colors[0]);
  main.style.setProperty('--sys-c2', s.colors[1]);
}

// ─── Scan Button ─────────────────────────────────────────────────────────────

function renderScanButton() {
  document.querySelectorAll('#ue22-manual-scan,#btn-refresh-library,.ue2-scan-btn').forEach(b => { b.disabled = state.scanning; });
  const btn = document.getElementById('btn-scan');
  if (!btn) return;
  btn.disabled = state.scanning;
  btn.innerHTML = '';

  if (state.scanning) {
    btn.appendChild(el('span', { className: 'spinner' }));
    btn.appendChild(document.createTextNode(' Escaneando…'));
  } else {
    btn.appendChild(document.createTextNode('🌐 Global Scan'));
  }
}

// ─── Play Button ─────────────────────────────────────────────────────────────

function renderPlayButton() {
  const btn = document.getElementById('btn-play');
  if (!btn) return;
  btn.disabled = state.launching || !state.selectedRom;

  btn.innerHTML = '';
  if (state.launching) {
    btn.appendChild(el('span', { className: 'spinner' }));
    btn.appendChild(document.createTextNode(' Iniciando…'));
  } else {
    btn.appendChild(document.createTextNode('▶ Play'));
  }
}

// ─── ROM List ────────────────────────────────────────────────────────────────

function renderRomList() {
  const list = document.getElementById('rom-list');
  const header = document.getElementById('rom-list-header');
  if (!list) return;

  list.innerHTML = '';

  if (state.roms.length === 0) {
    header.textContent = 'ROMs';
    const empty = el('div', { className: 'rom-empty' });
    const icon = el('span', { className: 'rom-empty-icon' }, '🎮');
    const txt = document.createTextNode(
      state.scanning ? 'Escaneando…' : 'Clique em "Scan ROMs" para buscar jogos.'
    );
    empty.appendChild(icon);
    empty.appendChild(txt);
    list.appendChild(empty);
    renderPlayButton();
    return;
  }

  header.textContent = `ROMs — ${state.roms.length} encontrada(s)`;

  for (const romPath of state.roms) {
    const filePath = typeof romPath === 'string' ? romPath : romPath.path;
    const name = typeof romPath === 'string' ? basename(romPath) : (romPath.name || basename(filePath));
    const item = el('div', {
      className: 'rom-item' + (filePath === state.selectedRom ? ' selected' : ''),
      id: `rom-${CSS.escape(filePath)}`,
      title: filePath,
      onClick: () => {
        state.selectedRom = filePath;
        list.querySelectorAll('.rom-item.selected').forEach(row => row.classList.remove('selected'));
        item.classList.add('selected');
        renderPlayButton();
        if (state.selectedSystem.id === 'psx')
          ue1511PS1Dialog(filePath,'select');
      },
      onDblclick: () => {
        state.selectedRom = filePath;
        if(state.selectedSystem.id === 'psx')
          ue1511PS1Dialog(filePath,'select');
        else
          launchRom(state.selectedSystem,filePath);
      },
    });

    const icon = el('span', { className: 'rom-item-icon' }, '💾');
    const label = el('span', { className: 'rom-item-name' },
      ue11Friendly(name,state.selectedSystem.id));
    item.appendChild(icon);
    item.appendChild(label);

    if (state.selectedSystem.id === 'psx') {
      item.addEventListener('contextmenu',event=>{
        event.preventDefault();
        state.selectedRom=filePath;
        ue1511PS1Dialog(filePath,'cheats');
      });
    }

    list.appendChild(item);
  }

  renderPlayButton();
}

// ─── Select System ────────────────────────────────────────────────────────────

function selectSystem(system) {
  state.selectedSystem = system;
  state.roms = state.libraries[system.folder] || [];
  state.selectedRom = null;
  state.scanning = false;
  state.launching = false;

  updateSidebarActive();
  renderSystemHeader();
  renderRomList();
  renderScanButton();
  renderPlayButton();
  setStatus(`Sistema: ${system.name}`, 'info');
}

// ─── Build Full Layout ────────────────────────────────────────────────────────

// UE_PATCH_143_UI
const UE_ACTIONS = [
  ['up','Cima'],['down','Baixo'],['left','Esquerda'],['right','Direita'],
  ['a','A'],['b','B'],['x','X'],['y','Y'],
  ['start','Start'],['select','Select'],
  ['l','L1'],['r','R1'],['l2','L2'],['r2','R2']
];
function ueField(label, control) {
  const row = el('label', {className:'ue-field'});
  row.appendChild(el('span',{},label));
  row.appendChild(control);
  return row;
}
function ueSelect(values, selected) {
  const box = el('select',{className:'ue-select'});
  for (const [value,label] of values) {
    const option = el('option',{value},label);
    option.selected = String(value) === String(selected || '');
    box.appendChild(option);
  }
  return box;
}
async function ueOpenSettings() {
  const s = state.selectedSystem;
  const isRetro = s.launcher === 'retroarch';
  const api = window.electronAPI;
  if (!api || !api.getSystemSettings) {
    setStatus('Configuracoes indisponiveis.', 'error'); return;
  }
  document.getElementById('ue-modal')?.remove();
  const saved = await api.getSystemSettings(s.folder);
  const presets = isRetro ? await api.listVideoPresets() : [];
  const overlay = el('div',{id:'ue-modal'});
  const panel = el('div',{className:'ue-panel'});
  const top = el('div',{className:'ue-top'});
  const close = el('button',{className:'ue-close',onClick:()=>overlay.remove()},'Fechar');
  top.appendChild(el('strong',{},'Configurações — '+s.name));
  top.appendChild(close);
  panel.appendChild(top);
  overlay.appendChild(panel);

  const gamepads = typeof navigator.getGamepads === 'function'
    ? Array.from(navigator.getGamepads() || []).filter(Boolean) : [];
  panel.appendChild(el('p',{className:'ue-help'},
    'Controles encontrados: ' + (gamepads.map(x=>x.id).join(', ') || 'nenhum conectado. Teclado disponível.')));

  if (!isRetro) {
    panel.appendChild(el('p',{className:'ue-help'},
      'Este sistema utiliza um emulador independente. Seus controles e filtros são gerenciados no próprio emulador.'));
    document.body.appendChild(overlay);
    return;
  }

  const driver = ueSelect([
    ['auto','Automático (SDL2)'],
    ['sdl2','SDL2 — DualSense / Xbox'],
    ['xinput','XInput — Xbox'],
    ['dinput','DirectInput']
  ],saved.driver || 'auto');
  panel.appendChild(ueField('Driver do controle',driver));
  panel.appendChild(el('p',{className:'ue-help'},
    'Automático mantém o mapeamento dos controles reconhecidos pelo RetroArch.'));

  const section = el('div',{className:'ue-mappings'});
  const keys = {}, buttons = {};
  const keyboardChoices = ['','up','down','left','right','z','x','a','s','q','w','d',
    'enter','rshift','lshift','space','tab','escape','c','v','f','g','1','2','3'];
  for (const [action,label] of UE_ACTIONS) {
    const row = el('div',{className:'ue-map-row'});
    row.appendChild(el('span',{},label));
    keys[action] = ueSelect(keyboardChoices.map(k=>[k,k || 'Padrão']),saved.keys?.[action] || '');
    const choices = [['','Automático']];
    for(let i=0;i<20;i++) choices.push([String(i),'Botão '+i]);
    buttons[action] = ueSelect(choices,saved.buttons?.[action] ?? '');
    row.appendChild(keys[action]);
    row.appendChild(buttons[action]);
    section.appendChild(row);
  }
  panel.appendChild(el('h3',{},'Personalização por sistema'));
  panel.appendChild(el('p',{className:'ue-help'},
    'Coluna 1: teclado. Coluna 2: botão físico. Índices podem variar conforme o driver e controle.'));
  panel.appendChild(section);

  const shaderValues = [['','Sem shader']];
  for (const sh of presets) shaderValues.push([sh.value,sh.label]);
  const shader = ueSelect(shaderValues,saved.shader || '');
  panel.appendChild(ueField('Filtro gráfico',shader));
  panel.appendChild(el('p',{className:'ue-help'},
    'Shaders Slang: CRT, scanlines, nitidez, LCD e outros presets instalados.'));

  const actions = el('div',{className:'ue-actions'});
  const save = el('button',{className:'ue-save'},'Salvar e aplicar');
  save.addEventListener('click',async()=>{
    const keyMap={}, buttonMap={};
    for(const [action] of UE_ACTIONS) {
      if(keys[action].value) keyMap[action]=keys[action].value;
      if(buttons[action].value!=='') buttonMap[action]=buttons[action].value;
    }
    try {
      await api.saveSystemSettings({
        folder:s.folder, driver:driver.value,keys:keyMap,buttons:buttonMap,shader:shader.value
      });
      if(shader.value && api.applyLiveShader) {
        const live=await api.applyLiveShader(shader.value);
        setStatus(live?.ok ? 'Filtro enviado ao RetroArch.' :
          'Preferências salvas. O filtro será aplicado ao abrir o próximo jogo.',
          'success');
      } else setStatus('Preferências salvas para '+s.name+'.','success');
      if(modeToLaunch==='play')ue2Played(romPath);
      overlay.remove();
    } catch(error) {
      setStatus('Erro nas preferências: '+error.message,'error');
    }
  });
  actions.appendChild(save);
  panel.appendChild(actions);
  document.body.appendChild(overlay);
}
function ueSettingsCSS() {
  const style=document.createElement('style');
  style.textContent=`
    #ue-modal{position:fixed;inset:0;background:#000b;z-index:9999;
      display:flex;align-items:center;justify-content:center;padding:20px}
    .ue-panel{width:min(680px,96vw);max-height:90vh;overflow-y:auto;
      background:#191919;border:1px solid #484848;border-radius:14px;
      padding:22px;color:#eee;box-shadow:0 20px 70px #000a}
    .ue-top{display:flex;justify-content:space-between;align-items:center;
      font-size:17px;margin-bottom:14px}
    .ue-close,.ue-save{border:0;border-radius:8px;padding:10px 17px;
      background:#333;color:white;cursor:pointer}
    .ue-save{background:#953ce0;font-weight:600}
    .ue-help{color:#999;font-size:12px;line-height:1.6;margin:10px 0}
    .ue-field{display:flex;justify-content:space-between;gap:15px;
      align-items:center;margin:12px 0}
    .ue-select{background:#252525;color:#eee;border:1px solid #454545;
      padding:8px;border-radius:6px;min-width:130px;max-width:100%}
    .ue-mappings{display:grid;gap:5px;max-height:290px;overflow:auto}
    .ue-map-row{display:grid;grid-template-columns:1fr 1.35fr 1.35fr;
      gap:8px;align-items:center}
    .ue-map-row .ue-select{min-width:0;width:100%}
    .ue-panel h3{font-size:14px;margin:15px 0 5px}
    .ue-actions{display:flex;justify-content:flex-end;margin-top:18px}
    .ue-settings-btn{white-space:nowrap}
    @media(max-width:650px){.ue-panel{padding:12px}
      .ue-map-row{grid-template-columns:75px 1fr 1fr}}
  `;
  document.head.appendChild(style);
}

function buildLayout() {
  const root = document.getElementById('root');
  root.innerHTML = '';

  // App container
  const app = el('div', { id: 'app' });

  // Titlebar
  const titlebar = el('div', { id: 'titlebar' });
  titlebar.appendChild(el('span', { id: 'titlebar-title' }, 'Ultimate Emulator'));
  app.appendChild(titlebar);

  // Body
  const body = el('div', { id: 'body' });

  // Sidebar
  const sidebar = el('div', { id: 'sidebar' });
  body.appendChild(sidebar);

  // Main
  const main = el('div', { id: 'main' });
  main.style.setProperty('--sys-c1', SYSTEMS[0].colors[0]);
  main.style.setProperty('--sys-c2', SYSTEMS[0].colors[1]);

  // System header
  const sysHeader = el('div', { id: 'system-header' });
  sysHeader.appendChild(el('div', { id: 'system-title' }));
  sysHeader.appendChild(el('div', { id: 'system-core-info' }));
  main.appendChild(sysHeader);

  // Action bar
  const actionBar = el('div', { id: 'action-bar' });

  const scanBtn = el('button', {
    id: 'btn-scan',
    className: 'btn btn-scan',
    onClick: globalScan,
  });
  scanBtn.textContent = '🌐 Global Scan';

  const playBtn = el('button', {
    id: 'btn-play',
    className: 'btn btn-play',
    disabled: true,
    onClick: () => launchRom(state.selectedSystem,state.selectedRom),
  });
  playBtn.textContent = '▶ Play';

  const settingsBtn = el('button',{
    id:'btn-settings',
    className:'btn btn-scan ue-settings-btn',
    onClick:ueOpenSettings
  },'🎮 Controles e imagem');
  actionBar.appendChild(scanBtn);
  actionBar.appendChild(playBtn);
  actionBar.appendChild(settingsBtn);
  main.appendChild(actionBar);

  // ROM area
  const romArea = el('div', { id: 'rom-area' });
  romArea.appendChild(el('div', { id: 'rom-list-header' }, 'ROMs'));
  romArea.appendChild(el('div', { id: 'rom-list' }));
  main.appendChild(romArea);

  // Status bar
  main.appendChild(el('div', { id: 'status-bar', className: 'status-bar status-info' }, 'Pronto.'));

  body.appendChild(main);
  app.appendChild(body);
  root.appendChild(app);
}

const UE2_STYLES = String.raw`/* ULTIMATE EMULATOR — V2 GLASS / DARK PURPLE, FULL RESPONSIVE LAYOUT */
:root {color-scheme:dark;--ue2-bg:#111111;--ue2-purple:#7a7a7a;--ue2-text:#f3f3f3;--ue2-muted:#919191;--ue2-line:rgba(210,210,210,.11)}
html,body,#root,#app,#body{width:100%;height:100%;min-width:0;background:#101010!important;color:var(--ue2-text)!important}
#root {overflow:hidden;background:radial-gradient(circle at 40% 3%,#292929 0,#101010 65%)}
#app.ue2-app{background:transparent!important;height:100%;min-height:0;overflow:hidden}
#body{display:grid!important;grid-template-columns:218px minmax(0,1fr) 286px!important;align-items:stretch;min-height:0;gap:0;background:linear-gradient(130deg,#161616,#111111 63%,#111111)!important}
#sidebar{width:auto!important;min-width:0!important;background:linear-gradient(180deg,#1a1a1a,#141414 84%)!important;padding:0!important;border-right:1px solid var(--ue2-line)!important;overflow:hidden!important;display:flex!important;flex-direction:column!important}
.ue2-logo{display:flex;align-items:center;gap:12px;padding:30px 18px 27px;min-height:96px;flex-shrink:0}
.ue2-logo-icon{height:37px;width:42px;display:flex;align-items:center;justify-content:center;position:relative;font-size:27px;color:#8a8a8a;filter:drop-shadow(0 0 10px #5d5d5d66)}
.ue2-logo-icon span:last-child{font-size:17px;color:#b7b7b7;margin-left:-9px;margin-top:15px}
.ue2-logo strong{font-size:14px;letter-spacing:.17em;display:block;line-height:1.2;font-weight:850}
.ue2-logo small{font-size:10px;letter-spacing:.28em;color:#888888;display:block;margin-top:4px;font-weight:750}
.ue2-side-heading{padding:20px 18px 9px!important;font-size:10px!important;font-weight:800;letter-spacing:.18em;color:#6d6d6d!important;display:flex;justify-content:space-between;align-items:center}
.ue2-side-heading span{letter-spacing:0;font-weight:500;font-size:9px}
#ue2-nav{display:grid;gap:3px;margin:3px 12px 8px}
.ue2-nav-btn{display:flex;gap:13px;align-items:center;color:#979797;background:transparent;border:0;text-align:left;padding:12px;border-radius:11px;position:relative;font-size:13px;cursor:pointer}
.ue2-nav-btn:hover{background:#ffffff09;color:#fff}
.ue2-nav-btn.active{background:linear-gradient(90deg,#76767628,#76767606);color:#dbdbdb;font-weight:700}
.ue2-nav-btn.active:before{content:"";position:absolute;left:-12px;top:7px;bottom:7px;width:3px;border-radius:6px;background:#828282;box-shadow:0 0 14px #7a7a7a}
.ue2-nav-btn .ue2-ico{color:#949494;display:flex}
.ue2-count{margin-left:auto;color:#aaaaaa;background:#64646426;padding:2px 7px;border-radius:7px;font-size:10px}
.ue2-systems-heading{border-top:1px solid var(--ue2-line);margin-top:15px;padding-top:23px!important}
#ue2-system-list{min-height:0;overflow-y:auto;overflow-x:hidden;padding:1px 10px 15px;flex:1;scrollbar-width:thin;scrollbar-color:#353535 transparent}
#ue2-system-list .system-btn{width:100%;margin:2px 0!important;background:transparent!important;padding:10px 12px!important;border-radius:10px;color:#aaaaaa;border:1px solid transparent;display:flex;gap:11px;min-width:0}
#ue2-system-list .system-btn:hover{background:#ffffff0c!important;color:#fff}
#ue2-system-list .system-btn.active{background:#73737322!important;color:#f2f2f2;border-color:#83838333}
#ue2-system-list .system-btn-dot{width:9px;height:9px;flex-shrink:0;box-shadow:0 0 8px #ffffff12}
#ue2-system-list .system-btn-name{font-weight:500;font-size:12px}
.ue2-sidebar-foot{border-top:1px solid var(--ue2-line);display:flex;gap:10px;align-items:center;padding:16px 18px;background:#161616}
.ue2-profile-icon{width:35px;height:35px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,#494949,#dd5bbd);color:#fff;font-weight:800;font-size:11px}
.ue2-sidebar-foot strong{display:block;font-size:11px}.ue2-sidebar-foot small{display:block;margin-top:3px;color:#7e7e7e;font-size:10px}
#main{background:linear-gradient(150deg,#1d1d1d 0,#151515 20%,#131313 70%,#141414 100%)!important;min-width:0!important;overflow:hidden;position:relative}
#main:before{content:"";position:absolute;inset:0 0 auto 0;height:250px;background:radial-gradient(ellipse at 62% 0,#58585820,transparent 70%);pointer-events:none}
#titlebar{height:auto!important;min-height:92px!important;padding:19px 27px!important;display:flex!important;gap:16px;justify-content:space-between!important;align-items:center!important;border:0!important;background:transparent!important;-webkit-app-region:no-drag!important;position:relative;z-index:1}
.ue2-search-wrap{display:flex;align-items:center;gap:12px;flex:1;max-width:460px;height:46px;padding:0 15px;background:#0d0d0da3;border:1px solid #ffffff10;border-radius:13px;color:#7b7b7b;box-shadow:0 8px 30px #00000015}
.ue2-search-wrap:focus-within{border-color:#90909070;box-shadow:0 0 0 3px #7f7f7f12}
#ue2-search{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#f4f4f4;font:13px 'Segoe UI',system-ui,sans-serif}
#ue2-search::placeholder{color:#717171}
#ue2-search::-webkit-search-cancel-button{cursor:pointer}
.ue2-top-actions{display:flex;align-items:center;gap:8px;flex-wrap:nowrap}
.ue2-top-btn{border:1px solid #46464677;color:#c6c6c6;border-radius:12px;background:#ffffff08;padding:12px 13px;display:flex;gap:8px;align-items:center;justify-content:center;white-space:nowrap;cursor:pointer;font-size:12px;font-weight:650}
.ue2-top-btn:hover{border-color:#7f7f7f;background:#7a7a7a1b;color:#fff}
#ue152-language{margin-left:0!important;border:1px solid #46464677!important;background:#ffffff07!important;color:#c1c1c1!important;height:41px;padding:0 11px!important;letter-spacing:0!important}
#system-header{padding:12px 27px 15px!important;background:transparent!important;border:0!important;flex-shrink:0;z-index:1;position:relative}
.ue2-breadcrumb{display:flex;gap:10px;align-items:center;color:#828282;font-size:10px;font-weight:750;letter-spacing:.11em;margin:0 0 18px}
.ue2-breadcrumb span:last-child{color:#909090;letter-spacing:0;font-size:11px}
.ue2-heading-row{display:flex;justify-content:space-between;align-items:end;gap:14px}
#system-title{font-size:clamp(25px,2.5vw,35px)!important;color:#fbfaff!important;font-weight:800!important;letter-spacing:-.045em;line-height:1.1;margin:0 0 8px!important;background:none!important;-webkit-text-fill-color:inherit!important}
#system-core-info{font:12px 'Segoe UI',system-ui,sans-serif!important;color:#919191!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#action-bar{padding:12px 27px!important;border:0!important;display:flex!important;align-items:center!important;gap:10px!important;background:transparent!important;flex-wrap:nowrap!important;min-height:59px;position:relative;z-index:1}
.ue2-count-label{font-size:11px!important;font-weight:700!important;letter-spacing:.09em!important;color:#a4a4a4!important;padding:0!important;text-transform:uppercase}
.ue2-toolbar-spacer{flex:1}
.ue2-toggle{display:flex;border:1px solid #67676740;background:#0a0a0a86;padding:4px;border-radius:11px;gap:3px}
.ue2-view-btn{display:grid;place-items:center;height:27px;width:29px;border:0;border-radius:7px;background:transparent;color:#828282;cursor:pointer}
.ue2-view-btn:hover{color:white}.ue2-view-btn.active{color:#b2b2b2;background:#87878728}
#btn-play{border:1px solid #94949444!important;background:linear-gradient(130deg,#595959,#777777)!important;color:#fff!important;border-radius:11px!important;font-size:12px!important;padding:10px 18px!important;min-width:88px!important;display:inline-flex!important;justify-content:center}
#btn-play:disabled{opacity:.45}
#btn-scan.ue2-hidden-but{display:none!important}
#action-bar>.btn:not(#btn-play){display:none!important}
#rom-area{min-width:0;min-height:0;flex:1;display:flex;overflow:hidden!important;background:transparent!important}
#rom-list{background:transparent!important;border:0!important;min-width:0!important;padding:14px 27px 38px!important;flex:1!important;overflow:auto!important;scrollbar-width:auto;scrollbar-color:#5b6f89 #151b24;align-content:start}
#rom-list.ue2-game-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:min-content;gap:19px!important}
#rom-list.ue2-game-list{display:grid!important;grid-template-columns:minmax(0,1fr);grid-auto-rows:min-content;gap:9px!important}
.ue2-card{min-width:0;background:#1e1e1e;border:1px solid #ffffff0b;border-radius:18px;cursor:pointer;overflow:hidden;transition:transform .17s ease,box-shadow .17s ease,border-color .17s ease;position:relative;outline:none;box-shadow:0 9px 22px #0002}
.ue2-card:hover{transform:translateY(-3px);border-color:#8d8d8d65;box-shadow:0 16px 35px #0006}
.ue2-card.selected{border-color:#9c9c9c;box-shadow:0 0 0 2px #81818145,0 16px 40px #0007}
.ue2-card:focus-visible{outline:2px solid #9b9b9b;outline-offset:2px}
.ue2-art{height:auto;aspect-ratio:1.62;position:relative;overflow:hidden;display:block;background:radial-gradient(ellipse at 20% 20%,color-mix(in srgb,var(--art-a) 56%,transparent),transparent 70%),linear-gradient(142deg,#353535 0,#151515 85%)}
.ue2-art:after{content:"";position:absolute;inset:40% 0 0;background:linear-gradient(transparent,#0b0b0b9e);pointer-events:none}
.ue2-art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:1}
.ue2-art-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;opacity:.9;color:#ffffffbd}
.ue2-art-logo{opacity:.65;filter:drop-shadow(0 5px 15px #0009)}.ue2-art-monogram{font-size:30px;font-weight:900;letter-spacing:.08em;opacity:.62}
.ue2-art-platform{position:absolute;bottom:11px;left:14px;letter-spacing:.15em;font-size:8px;font-weight:850;color:#ffffff9b}
.ue2-favorite{position:absolute;right:11px;top:11px;z-index:3;border:1px solid #ffffff2b;display:grid;place-items:center;width:31px;height:31px;border-radius:9px;color:#fff;background:#0f0f0fa5;cursor:pointer;transition:all .18s}
.ue2-favorite:hover,.ue2-favorite.is-favorite{color:#d6d6d6;background:#5f5f5fd5;border-color:#9898986e}
.ue2-favorite.is-favorite svg{fill:#b2b2b24d}
.ue2-card-footer{padding:12px 13px 13px;display:flex;align-items:center;justify-content:space-between;gap:7px;min-height:66px}
.ue2-card-footer h3{font-size:13px;font-weight:720;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ededed;max-width:100%}
.ue2-card-footer p{font-size:10px;color:#8a8a8a;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ue2-card-footer>div{min-width:0;flex:1}.ue2-card-footer>.ue2-ico{color:#808080}
.ue2-game-list .ue2-card{display:flex;align-items:center;border-radius:13px;min-height:76px;gap:12px}
.ue2-game-list .ue2-art{width:117px;flex:0 0 117px;aspect-ratio:1.7}.ue2-game-list .ue2-card-footer{flex:1}
.ue2-game-list .ue2-art-monogram{font-size:19px}.ue2-game-list .ue2-favorite{top:3px;right:3px;width:24px;height:24px}
.ue2-more{grid-column:1/-1;margin:14px auto;border:1px solid #6e6e6e5e;border-radius:11px;background:#6e6e6e22;color:#bebebe;padding:12px 25px;cursor:pointer}
.ue2-empty{grid-column:1/-1;align-self:center;justify-self:center;min-height:330px;padding:55px 25px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#797979}
.ue2-empty .ue2-ico{color:#6f6f6f}.ue2-empty h3{font-size:19px;color:#e3e3e3;margin-top:20px}.ue2-empty p{font-size:12px;margin:10px 0 25px}
#status-bar{height:35px!important;padding:0 26px!important;background:#11111155!important;color:#717171;border-top:1px solid var(--ue2-line)!important;font:10px 'Segoe UI',system-ui,sans-serif!important}
#status-bar.status-error{color:#ff8d99!important}#status-bar.status-success{color:#8ed9ae!important}
#ue2-right{background:linear-gradient(180deg,#171717,#111111);border-left:1px solid var(--ue2-line);padding:29px 20px 16px;display:flex;flex-direction:column;min-width:0;min-height:0;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#3d3d3d transparent}
.ue2-right-title{display:flex;justify-content:space-between;align-items:center;gap:9px;color:#969696;font-size:10px;letter-spacing:.18em;font-weight:800;margin-bottom:25px}
.ue2-right-title .ue2-ico{color:#6b6b6b}
#ue2-detail{min-width:0}.ue2-detail-eyebrow{font-size:10px;letter-spacing:.14em;color:#727272;font-weight:800;margin-bottom:15px}
.ue2-detail-placeholder{border:1px dashed #82828249;min-height:225px;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:22px 16px;color:#707070;background:#6767670b}
.ue2-detail-placeholder h3{font-size:15px;color:#d7d7d7;margin-top:18px;line-height:1.3}.ue2-detail-placeholder p{font-size:11px;color:#878787;line-height:1.55;margin-top:9px}
.ue2-detail-stats{display:flex;gap:12px;margin-top:19px}.ue2-detail-stats>div{background:#222222;border-radius:11px;flex:1;padding:13px}
.ue2-detail-stats strong{display:block;color:#dadada;font-size:22px}.ue2-detail-stats span{display:block;font-size:10px;color:#949494;margin-top:5px}
.ue2-art-large{aspect-ratio:1.3;border-radius:15px;border:1px solid #8585853b;box-shadow:0 18px 32px #0004;max-height:240px}
.ue2-detail-name{font-size:19px;line-height:1.2;margin:17px 0 7px!important;overflow-wrap:anywhere}.ue2-detail-system{font-size:11px;color:#949494}
.ue2-play-primary{width:100%;border:0;border-radius:11px;background:linear-gradient(130deg,#646464,#838383);color:white;padding:13px;display:flex;gap:11px;align-items:center;justify-content:center;margin:18px 0 10px;font-weight:800;cursor:pointer;box-shadow:0 8px 26px #5555554f}
.ue2-play-primary:hover{filter:brightness(1.1)}.ue2-detail-actions{display:flex;gap:7px;margin-bottom:18px}
.ue2-action{display:flex;justify-content:center;align-items:center;gap:6px;flex:1;min-width:0;padding:9px 6px;color:#c7c7c7;background:#252525;border:1px solid #8e8e8e2b;border-radius:9px;font-size:11px;cursor:pointer}
.ue2-action:hover{background:#8181812c}.ue2-detail-row{border-top:1px solid var(--ue2-line);padding:11px 0;display:flex;align-items:center;justify-content:space-between;gap:9px;font-size:11px}
.ue2-detail-row span{color:#8b8b8b}.ue2-detail-row strong{color:#e1e1e1;font-weight:600;max-width:60%;text-align:right;line-height:1.25}
.ue2-detail-footnote{font-size:10px;color:#7c7c7c;margin:17px 0;line-height:1.5}
.ue2-recent-panel{border-top:1px solid var(--ue2-line);margin-top:auto;padding-top:20px}
.ue2-recent-panel h3{color:#aeaeae;font-size:11px;margin-bottom:13px}
.ue2-recent-row{background:transparent;color:#959595;display:flex;gap:7px;align-items:center;width:100%;text-align:left;padding:8px 0;border:0;cursor:pointer;font-size:11px}
.ue2-recent-row:hover{color:#c4c4c4}.ue2-recent-row span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ue2-recent-empty{font-size:11px;color:#6b6b6b;line-height:1.5}
#ue2-context-menu{position:fixed;z-index:99999;min-width:224px;padding:6px;border:1px solid #696969;background:#202020;border-radius:12px;box-shadow:0 18px 45px #0009}
#ue2-context-menu button{display:block;width:100%;text-align:left;padding:11px 12px;border:0;background:transparent;color:#e8e8e8;cursor:pointer;border-radius:7px;font-size:12px}
#ue2-context-menu button:hover{background:#6d6d6d45}
@media(max-width:1200px){#body{grid-template-columns:190px minmax(0,1fr) 244px!important}.ue2-logo{padding:22px 13px 17px}.ue2-logo strong{font-size:12px}.ue2-logo small{font-size:9px}#titlebar{padding:14px 18px!important;min-height:76px!important}#system-header,#action-bar{padding-left:18px!important;padding-right:18px!important}#rom-list{padding:11px 18px 30px!important}#rom-list.ue2-game-grid{gap:12px!important}#ue2-right{padding:23px 14px 12px}}
@media(max-width:950px){#body{grid-template-columns:169px minmax(0,1fr) 204px!important}#rom-list.ue2-game-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#titlebar .ue2-top-btn span{display:none}#titlebar .ue2-top-btn{padding:11px}#ue2-right{padding:17px 12px}.ue2-art-large{max-height:200px}.ue2-detail-name{font-size:17px}}
@media(max-width:680px){#body{grid-template-columns:70px minmax(0,1fr)!important}#sidebar{align-items:center}.ue2-logo{padding:20px 0;min-height:65px}.ue2-logo>div:last-child,.ue2-side-heading,#ue2-nav .ue2-nav-btn>span:not(.ue2-ico),#ue2-system-list .system-btn-name,.ue2-sidebar-foot>div:not(.ue2-profile-icon){display:none!important}#ue2-nav{margin:0 4px;width:95%}.ue2-nav-btn{justify-content:center;padding:13px 4px}#ue2-system-list{width:100%;padding:0 9px}.system-btn{justify-content:center!important;padding:11px 4px!important}#ue2-right{display:none}#titlebar{padding:12px!important;gap:8px}.ue2-search-wrap{height:41px;padding:0 8px}#system-header,#action-bar{padding-left:13px!important;padding-right:13px!important}#rom-list{padding:11px 13px 25px!important}#rom-list.ue2-game-grid{gap:9px!important}}
@media(max-width:460px){#rom-list.ue2-game-grid{grid-template-columns:minmax(0,1fr)}#ue152-language{font-size:9px!important;padding:0 5px!important}.ue2-top-actions{gap:3px}.ue2-search-wrap{min-width:0}}

.ue2-logo strong{color:#eaeaea!important}.ue2-logo small{color:#979797!important}
`;
// ULTIMATE EMULATOR 2.0 — redesigned three-column launcher.
// Uses existing scan, controller, cheats, DuckStation and launch APIs.
function ue2ReadLocal(key,fallback){try{return localStorage.getItem(key)??fallback}catch{return fallback}}
function ue2WriteLocal(key,value){try{localStorage.setItem(key,value)}catch{}}
function ue2SavePrefs(){window.electronAPI?.ue2PreferencesSave?.({view:UE2.view,palette:document.documentElement.dataset.uePalette||'dark',favorites:[...UE2.favorites],recent:UE2.recent}).catch(()=>{});}
async function ue2LoadPrefs(){
 try{
  const prefs=await window.electronAPI?.ue2PreferencesLoad?.();
  if(prefs){UE2.view=['grid','list','carousel'].includes(prefs.view)?prefs.view:'grid';UE2.favorites=new Set(Array.isArray(prefs.favorites)?prefs.favorites:[]);UE2.recent=Array.isArray(prefs.recent)?prefs.recent:[];if(prefs.palette&&window.__ueApplyPalette&&!localStorage.getItem('ue-color-scheme'))window.__ueApplyPalette(prefs.palette);}
  renderRomList();ue2RenderRecent();ue2RenderDetail();
 }catch(e){console.warn('Preferências:',e)}
}
const UE2 = {
  section: 'all', query:'', view:['grid','list','carousel'].includes(ue2ReadLocal('ue2-view','grid'))?ue2ReadLocal('ue2-view','grid'):'grid',
  favorites:new Set(JSON.parse(ue2ReadLocal('ue2-favorites','[]')||'[]')),
  recent:JSON.parse(ue2ReadLocal('ue2-recent','[]')||'[]'),
  meta:new Map(), pending:new Set(), coverBatchIds:new Set(), queued:[], autoTried:new Set(), coverObserver:null, busy:0, pageSize:300, maxCards:300, selectedSystem:null,
  librarySizeBytes:null, librarySizePending:false, librarySizeKey:'', librarySizeSignature:'', libraryFileCount:null, librarySizeWatchTimer:null,
  selectedGames:new Set(), selectionAnchor:null,
  descriptions:new Map(), descriptionPending:new Set(), descriptionQueue:[], descriptionBusy:0,
  galleryOpen:false, galleryGames:[], galleryIndex:0, galleryKeyHandler:null, galleryFrame:null,
  gamepadTimer:null, gamepadPrevButtons:[], gamepadPrevAxisX:0, gamepadPrevAxisY:0,
  gamepadId:'', gamepadAutoSyncId:'', gamepadAwaitNeutral:false, gamepadZone:'content', gamepadSidebarIndex:0,
  gamepadAxisPair:null,
  gamepadRepeatDirection:'', gamepadRepeatAt:0, keyboardActivationHeld:'',
  stateSaveButton:10, stateLoadButton:11, stateShortcutHeld:false,
  emulatorRunning:false, stateCommandBusy:false, suppressGamepadLaunchUntil:0,
  detailTimer:null, focusFrame:null, selectedCardKey:'',
};
const ue2Icons = {
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.1"/>',
 home:'<path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
 carousel:'<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M2 6v12M22 6v12"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12"/><path d="M3 6h1M3 12h1M3 18h1"/>',
 star:'<path d="m12 2 3.1 6.3 7 .99-5.05 4.92 1.19 6.95L12 17.9l-6.24 3.26 1.19-6.95L1.9 9.29l7-.99Z"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 search:'<circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 5 5"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M4.9 7.6 3.5 5.7l2.2-2.2 1.9 1.4a8 8 0 0 1 2-.8L10 2h4l.4 2.1a8 8 0 0 1 2 .8l1.9-1.4 2.2 2.2-1.4 1.9a8 8 0 0 1 .8 2L22 10v4l-2.1.4a8 8 0 0 1-.8 2l1.4 1.9-2.2 2.2-1.9-1.4a8 8 0 0 1-2 .8L14 22h-4l-.4-2.1a8 8 0 0 1-2-.8l-1.9 1.4-2.2-2.2 1.4-1.9a8 8 0 0 1-.8-2L2 14v-4l2.1-.4a8 8 0 0 1 .8-2Z"/>',
 game:'<path d="M6 8h12a4 4 0 0 1 3.9 3.1l1 5.2a2.8 2.8 0 0 1-4.3 2.9L15 16H9l-3.6 3.2a2.8 2.8 0 0 1-4.3-2.9l1-5.2A4 4 0 0 1 6 8Z"/><path d="M6 11v5m-2.5-2.5h5M16.5 12h.1m2.5 2h.1"/>',
 play:'<path d="m8 5 12 7-12 7Z"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m4 18 5-5 4 4 3-3 4 5"/>',
 scan:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
 chev:'<path d="m9 18 6-6-6-6"/>',
 close:'<path d="M5 5l14 14M19 5 5 19"/>',
};
function ue2Icon(name, size=18) {
 const host=el('span',{className:'ue2-ico'});
 host.innerHTML=`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ue2Icons[name]||ue2Icons.game}</svg>`;
 return host;
}
function ue2GamePath(entry) { return typeof entry==='string'?entry:(entry?.path||''); }
function ue2GameName(entry,sys) {
 const original=typeof entry==='string'?basename(entry):(entry?.name||basename(entry?.path||''));
 return ue11Friendly(original,sys?.id||'').replace(/\.(m3u|cue|chd|iso|bin|img|zip|7z|sfc|smc|nes|gba|gbc|gb|nds|pbp|n64|z64|v64|cso|gdi|cdi|a26|a78|rom|md|gen|sms|pkg|elf|rvz|gcm|wbfs)$/i,'').replace(/\s+/g,' ').trim();
}
function ue2AllGames() {
 const games=[];
 for(const system of SYSTEMS) for(const entry of (state.libraries[system.folder]||[])) {
  const path=ue2GamePath(entry); if(path)games.push({path,entry,system,name:ue2GameName(entry,system)});
 }
 return games;
}
function ue2VisibleGames() {
 let games=ue2AllGames();
 if(UE2.section==='system') games=games.filter(x=>x.system===state.selectedSystem);
 if(UE2.section==='favorites')games=games.filter(x=>UE2.favorites.has(x.path));
 if(UE2.section==='recent') games=games.filter(x=>UE2.recent.includes(x.path)).sort((a,b)=>UE2.recent.indexOf(a.path)-UE2.recent.indexOf(b.path));
 const query=UE2.query.toLocaleLowerCase('pt-BR').trim();
 if(query)games=games.filter(x=>(x.name+' '+x.system.name).toLocaleLowerCase('pt-BR').includes(query));
 return games;
}
function ue2IsAllLanding(){return UE2.section==='all'&&!UE2.query.trim();}
function ue2FormatLibrarySize(bytes){
 const mb=Math.max(0,Number(bytes)||0)/1048576,gb=mb/1024;
 const format=(value,digits)=>value.toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
 return gb>=1?{primary:format(gb,2)+' GB',secondary:format(mb,1)+' MB'}:{primary:format(mb,1)+' MB',secondary:'Menos de 1 GB'};
}
function ue2LibraryRoots(){
 const paths=state.paths||{};
 const preferred=[paths.scanRoms,paths.romsRoot,paths.roms].find(value=>typeof value==='string'&&value.trim());
 return preferred?[preferred]:[];
}
function ue2LibraryExtensions(){return [...new Set(SYSTEMS.flatMap(system=>Array.isArray(system.extensions)?system.extensions:[]))];}
function ue2RequestLibrarySize(games,force=false){
 if(!ue2IsAllLanding())return;
 const paths=games.map(game=>game.path).filter(Boolean);
 const roots=ue2LibraryRoots(),extensions=ue2LibraryExtensions();
 const key=JSON.stringify({paths,roots,extensions});
 if(!force&&UE2.librarySizeKey===key&&(UE2.librarySizePending||UE2.librarySizeBytes!==null))return;
 const previousBytes=UE2.librarySizeBytes,previousSignature=UE2.librarySizeSignature;
 UE2.librarySizeKey=key;UE2.librarySizePending=true;
 const request=window.electronAPI?.ueModernLibrarySize;
 if(typeof request!=='function'){UE2.librarySizePending=false;UE2.librarySizeBytes=0;return;}
 Promise.resolve(request({paths,roots,extensions})).then(result=>{
  if(UE2.librarySizeKey!==key)return;
  UE2.librarySizePending=false;UE2.librarySizeBytes=Math.max(0,Number(result?.bytes)||0);UE2.librarySizeSignature=String(result?.files||0)+':'+UE2.librarySizeBytes;if(!games.length)UE2.libraryFileCount=Math.max(0,Number(result?.files)||0);
  if(ue2IsAllLanding()&&(previousBytes!==UE2.librarySizeBytes||previousSignature!==UE2.librarySizeSignature))renderRomList();
 }).catch(()=>{if(UE2.librarySizeKey===key){UE2.librarySizePending=false;if(UE2.librarySizeBytes===null)UE2.librarySizeBytes=0;if(ue2IsAllLanding()&&previousBytes===null)renderRomList()}});
 if(!UE2.librarySizeWatchTimer){
  UE2.librarySizeWatchTimer=setInterval(()=>{if(ue2IsAllLanding()&&!UE2.librarySizePending)ue2RequestLibrarySize(ue2AllGames(),true)},20000);
 }
}
function ue2LibrarySummary(games){
 const count=games.length||UE2.libraryFileCount||0;
 const size=UE2.librarySizePending?{primary:'Calculando…',secondary:'Lendo a pasta de ROMs'}:ue2FormatLibrarySize(UE2.librarySizeBytes);
 return el('section',{className:'ue2-library-summary','aria-label':'Resumo da biblioteca'},
  el('div',{className:'ue2-library-summary-icon'},ue2Icon('game',48)),
  el('h3',{},'Sua biblioteca'),
  el('div',{className:'ue2-library-summary-stats'},
   el('div',{className:'ue2-library-summary-stat'},el('span',{className:'ue2-library-summary-label'},'Jogos na biblioteca'),el('strong',{},count.toLocaleString('pt-BR')),el('small',{},count===1?'jogo':'jogos')),
   el('div',{className:'ue2-library-summary-stat'},el('span',{className:'ue2-library-summary-label'},'Tamanho total'),el('strong',{},size.primary),el('small',{},size.secondary))),
  el('p',{},'Escolha uma plataforma à esquerda para abrir os jogos.')
 );
}
function ue2SelectedGame() {const path=state.selectedRom;if(!path)return null;return ue2AllGames().find(x=>x.path===path)||null;}
function ue2SetSection(section) {
 UE2.section=section;UE2.gamepadZone='sidebar';
 if(section==='all'){state.selectedRom=null;UE2.selectedGames.clear();UE2.selectionAnchor=null;}
 if(section==='favorites'){UE2.query='';const search=document.getElementById('ue2-search');if(search)search.value='';}
 ue2SyncGamepadSidebarIndex();
 document.querySelectorAll('.ue2-nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.section===section));
 updateSidebarActive();renderRomList();renderSystemHeader();
}
function ue2SelectGame(game) {
 if(!game)return;
 const systemChanged=state.selectedSystem!==game.system;
 state.selectedRom=game.path;state.selectedSystem=game.system;state.roms=state.libraries[game.system.folder]||[];
 const visible=ue2VisibleGames();
 const index=visible.findIndex(item=>item.path===game.path);
 const cardExists=[...document.querySelectorAll('.ue2-card')].some(card=>card.dataset.game===ue2Key(game.path));
 if(!cardExists&&index>=UE2.maxCards){
  UE2.maxCards=Math.max(UE2.maxCards,Math.ceil((index+1)/UE2.pageSize)*UE2.pageSize);
  renderRomList();
 }else{
  ue2PaintSelection();
 }
 updateSidebarActive();
 if(systemChanged)renderSystemHeader();
 renderPlayButton();
 ue2ScheduleDetail();
 ue2ScheduleFocusSelectedCard();
}
function ue2PaintSelection(){
 const key=state.selectedRom?ue2Key(state.selectedRom):'';
 if(UE2.selectedCardKey&&UE2.selectedCardKey!==key){
  const previous=document.querySelector('.ue2-card[data-game="'+UE2.selectedCardKey+'"]');
  previous?.classList.remove('selected');previous?.setAttribute('aria-selected','false');
 }
 const card=document.querySelector('.ue2-card[data-game="'+key+'"]');
 card?.classList.add('selected');card?.setAttribute('aria-selected','true');
 UE2.selectedCardKey=key;
}
function ue2ScheduleDetail(){
 clearTimeout(UE2.detailTimer);
 UE2.detailTimer=setTimeout(()=>{UE2.detailTimer=null;ue2RenderDetail();},80);
}
function ue2ScheduleFocusSelectedCard(){
 if(UE2.focusFrame)return;
 UE2.focusFrame=requestAnimationFrame(()=>{UE2.focusFrame=null;ue2FocusSelectedCard();});
}
function ue2FocusSelectedCard(){
 const path=state.selectedRom;if(!path)return;
 const key=ue2Key(path);
 const card=document.querySelector('.ue2-card[data-game="'+key+'"]');
 if(!card)return;
 if(document.activeElement!==card)card.focus({preventScroll:true});
 const list=document.getElementById('rom-list');
 if(!list)return;
 const cardRect=card.getBoundingClientRect(),listRect=list.getBoundingClientRect();
 if(cardRect.top<listRect.top||cardRect.bottom>listRect.bottom||cardRect.left<listRect.left||cardRect.right>listRect.right)
  card.scrollIntoView({behavior:'auto',block:'nearest',inline:'nearest'});
}
function ue2CurrentNavigationGame(){
 if(ue2IsAllLanding())return null;
 const games=ue2VisibleGames();
 return games.find(game=>game.path===state.selectedRom)||games[0]||null;
}
function ue2SelectNavigationGame(game){
 if(!game)return;
 UE2.selectedGames.clear();UE2.selectedGames.add(game.path);UE2.selectionAnchor=game.path;
 ue9UpdateSelectedCount();ue2SelectGame(game);
}
function ue2MoveSelection(direction){
 if(ue2IsAllLanding())return;
 const games=ue2VisibleGames();if(!games.length)return;
 const current=games.findIndex(game=>game.path===state.selectedRom);
 if(current<0){ue2SelectNavigationGame(games[0]);return;}
 let delta=0;
 if(direction==='Home'){ue2SelectNavigationGame(games[0]);return;}
 if(direction==='End'){ue2SelectNavigationGame(games[games.length-1]);return;}
 if(UE2.view==='grid'){
  const list=document.getElementById('rom-list');
  const columns=Math.max(1,(getComputedStyle(list||document.body).gridTemplateColumns||'').split(/\s+/).filter(Boolean).length);
  delta=direction==='ArrowUp'?-columns:direction==='ArrowDown'?columns:direction==='ArrowLeft'?-1:1;
 }else if(UE2.view==='carousel'){
  delta=direction==='ArrowLeft'||direction==='ArrowUp'?-1:1;
 }else{
  delta=direction==='ArrowUp'||direction==='ArrowLeft'?-1:1;
 }
 const next=Math.max(0,Math.min(games.length-1,current+delta));
 ue2SelectNavigationGame(games[next]);
}
function ue2ActivateSelection(){
 const game=ue2CurrentNavigationGame();if(game&&!state.launching)ue2Play(game);
}
function ue2SidebarButtons(){
 return [...document.querySelectorAll('#ue2-nav .ue2-nav-btn,#ue2-system-list .system-btn')];
}
function ue2ClearGamepadSidebarFocus(){
 document.querySelectorAll('.ue2-gamepad-focus').forEach(node=>{
  node.classList.remove('ue2-gamepad-focus');node.removeAttribute('data-gamepad-focus');
 });
}
function ue2PaintGamepadSidebarFocus(){
 const buttons=ue2SidebarButtons();if(!buttons.length)return;
 ue2ClearGamepadSidebarFocus();
 UE2.gamepadSidebarIndex=Math.max(0,Math.min(buttons.length-1,Number(UE2.gamepadSidebarIndex)||0));
 const button=buttons[UE2.gamepadSidebarIndex];
 if(!button)return;
 button.classList.add('ue2-gamepad-focus');button.setAttribute('data-gamepad-focus','true');
 button.scrollIntoView({block:'nearest',inline:'nearest'});
}
function ue2SyncGamepadSidebarIndex(){
 const buttons=ue2SidebarButtons();if(!buttons.length)return;
 const active=buttons.findIndex(button=>button.classList.contains('active'));
 if(active>=0)UE2.gamepadSidebarIndex=active;
 UE2.gamepadSidebarIndex=Math.max(0,Math.min(buttons.length-1,Number(UE2.gamepadSidebarIndex)||0));
}
function ue2EnterGamepadSidebar(){
 UE2.gamepadZone='sidebar';ue2SyncGamepadSidebarIndex();ue2PaintGamepadSidebarFocus();
}
function ue2EnterGamepadContent(){
 UE2.gamepadZone='content';ue2ClearGamepadSidebarFocus();ue2ScheduleFocusSelectedCard();
}
function ue2MoveGamepadSidebar(delta){
 const buttons=ue2SidebarButtons();if(!buttons.length)return;
 const next=Math.max(0,Math.min(buttons.length-1,(Number(UE2.gamepadSidebarIndex)||0)+delta));
 if(next===UE2.gamepadSidebarIndex)return;
 UE2.gamepadSidebarIndex=next;ue2PaintGamepadSidebarFocus();
}
function ue2ActivateGamepadSelection(){
 if(UE2.galleryOpen){ue2ActivateSelection();return;}
 if(UE2.gamepadZone==='sidebar'){
  const button=ue2SidebarButtons()[UE2.gamepadSidebarIndex];
  if(button&&!button.disabled){button.click();requestAnimationFrame(()=>{ue2SyncGamepadSidebarIndex();ue2PaintGamepadSidebarFocus()});}
  return;
 }
 ue2ActivateSelection();
}
const UE10_STATE_GAMEPAD={id:'',prev:[],prevX:0,prevY:0,awaitNeutral:true,repeat:'',repeatAt:0};
function ue10StateChooserGamepadTick(pads){
 const known=pads.find(x=>/xbox|xinput|dual.?sense|dual.?shock|wireless controller|gamepad/i.test(String(x.id||'')));
 const pad=known||pads.find(x=>x.mapping==='standard')||pads[0];
 if(!pad)return;
 const id=String(pad.id||pad.index||'pad');
 if(id!==UE10_STATE_GAMEPAD.id){UE10_STATE_GAMEPAD.id=id;UE10_STATE_GAMEPAD.prev=[];UE10_STATE_GAMEPAD.prevX=0;UE10_STATE_GAMEPAD.prevY=0;UE10_STATE_GAMEPAD.awaitNeutral=true;}
 const buttons=Array.from(pad.buttons||[],b=>Boolean(b?.pressed||Number(b?.value||0)>.55));
 const pressed=index=>Boolean(buttons[index]&&!UE10_STATE_GAMEPAD.prev[index]);
 const axes=Array.from(pad.axes||[],v=>Number(v)||0),x=axes[0]||0,y=axes[1]||0;
 if(UE10_STATE_GAMEPAD.awaitNeutral){
  UE10_STATE_GAMEPAD.prev=buttons;UE10_STATE_GAMEPAD.prevX=x;UE10_STATE_GAMEPAD.prevY=y;
  if(!buttons.some(Boolean)&&Math.abs(x)<.35&&Math.abs(y)<.35)UE10_STATE_GAMEPAD.awaitNeutral=false;
  return;
 }
 const standard=pad.mapping==='standard'||buttons.length>=16;
 const dpad=standard?{up:12,down:13,left:14,right:15}:{up:11,down:12,left:13,right:14};
 const left=pressed(dpad.left)||(x<-.55&&UE10_STATE_GAMEPAD.prevX>=-.55);
 const right=pressed(dpad.right)||(x>.55&&UE10_STATE_GAMEPAD.prevX<=.55);
 const up=pressed(dpad.up)||(y<-.55&&UE10_STATE_GAMEPAD.prevY>=-.55);
 const down=pressed(dpad.down)||(y>.55&&UE10_STATE_GAMEPAD.prevY<=.55);
 const direction=left?-1:right?1:up?-1:down?1:0;
 const vertical=up||down;
 const held=(left&&x<-.55)||(right&&x>.55)||(up&&y<-.55)||(down&&y>.55)||buttons[[dpad.left,dpad.right,dpad.up,dpad.down].find(i=>buttons[i])];
 let pulse=direction;
 const now=performance.now();
 const heldKey=held?(vertical?(up?-1:1):(left?-1:1)):0;
 if(!pulse&&heldKey){
  if(UE10_STATE_GAMEPAD.repeat!==String(heldKey)){UE10_STATE_GAMEPAD.repeat=String(heldKey);UE10_STATE_GAMEPAD.repeatAt=now+280;pulse=heldKey;}
  else if(now>=UE10_STATE_GAMEPAD.repeatAt){UE10_STATE_GAMEPAD.repeatAt=now+110;pulse=heldKey;}
 }else if(!heldKey){UE10_STATE_GAMEPAD.repeat='';UE10_STATE_GAMEPAD.repeatAt=0;}
 if(pulse)ue10StateChooserMove(pulse);
 else if(pressed(0))ue10StateChooserChoose();
 else if(pressed(1))ue10StateChooserCancel();
 UE10_STATE_GAMEPAD.prev=buttons;UE10_STATE_GAMEPAD.prevX=x;UE10_STATE_GAMEPAD.prevY=y;
}
function ue10StateChooserMove(delta){
 const dialog=document.getElementById('ue10-state-dialog');if(!dialog)return;
 const cards=[...dialog.querySelectorAll('.ue10-state-card')];if(!cards.length)return;
 const current=Math.max(0,cards.findIndex(card=>card.classList.contains('is-selected')));
 const next=(current+delta+cards.length)%cards.length;cards[next].click();
}
function ue10StateChooserChoose(){document.querySelector('#ue10-state-dialog .ue10-state-card.is-selected')?.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}))}
function ue10StateChooserCancel(){document.querySelector('#ue10-state-dialog .ue10-state-close')?.click()}
function ue2StateShortcut(action){
 if(UE2.stateCommandBusy)return;
 UE2.stateCommandBusy=true;
 // O mesmo toque de L3/R3 não pode cair no botão A e reabrir a ROM quando
 // o RetroArch devolve o foco para a biblioteca. Aguarda também a soltura.
 UE2.suppressGamepadLaunchUntil=performance.now()+2200;
 UE2.gamepadAwaitNeutral=true;
 UE2.stateShortcutHeld=true;
 try{
  Promise.resolve(window.electronAPI?.ue10StateAction?.(action)).then(result=>{
    // O processo principal já abriu o overlay transparente sobre o RetroArch.
    // Não criar um segundo modal dentro da biblioteca, pois ele esconderia o jogo.
    if(result?.choose)return;
   else if(!result?.ok)setStatus(result?.error||'Save state indisponível.','error');
   else setStatus(action==='SAVE_STATE'?'Save state salvo.':'Save state carregado.','success');
  }).catch(error=>setStatus(error?.message||'Falha no save state.','error'))
    .finally(()=>{UE2.stateCommandBusy=false;UE2.gamepadPrevButtons=[];});
 }catch(error){
  UE2.stateCommandBusy=false;
  setStatus(error?.message||'Falha no save state.','error');
 }
}
function ue2GamepadAtFirstContentItem(){
 const games=ue2VisibleGames();if(!games.length)return true;
 const current=games.findIndex(game=>game.path===state.selectedRom);if(current<=0)return true;
 if(UE2.view!=='grid')return false;
 const list=document.getElementById('rom-list');
 const columns=Math.max(1,(getComputedStyle(list||document.body).gridTemplateColumns||'').split(/\s+/).filter(Boolean).length);
 return current%columns===0;
}
function ue2NavigateGamepad(direction){
 if(UE2.galleryOpen){
  if(direction==='ArrowLeft')ue2GalleryMove(-1);else if(direction==='ArrowRight')ue2GalleryMove(1);
  return;
 }
 if(UE2.gamepadZone==='sidebar'){
  if(direction==='ArrowUp')ue2MoveGamepadSidebar(-1);
  else if(direction==='ArrowDown')ue2MoveGamepadSidebar(1);
  else if(direction==='ArrowRight')ue2EnterGamepadContent();
  return;
 }
 if(direction==='ArrowLeft'&&ue2GamepadAtFirstContentItem()){
  ue2EnterGamepadSidebar();return;
 }
 ue2MoveSelection(direction);
}
function ue2InstallNavigation(){
 if(window.__ue2NavigationAttached)return;
 window.__ue2NavigationAttached=true;
 window.electronAPI?.ueOnGameSession?.(({running})=>{
  UE2.emulatorRunning=!!running;
  if(!running)void ue19RefreshHealth();
  UE2.gamepadAwaitNeutral=true;
  UE2.stateShortcutHeld=false;
  UE2.suppressGamepadLaunchUntil=performance.now()+1500;
 });
 window.addEventListener('focus',()=>{
  UE2.gamepadAwaitNeutral=true;
  UE2.suppressGamepadLaunchUntil=performance.now()+700;
 });
 document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||UE2.galleryOpen||document.getElementById('ue9-modal'))return;
  if(event.target?.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],button,a'))return;
  const key=event.key;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(key)){
   event.preventDefault();ue2MoveSelection(key);return;
  }
  if(key==='Enter'||key.toLowerCase()==='x'){
   if(event.repeat||UE2.keyboardActivationHeld===key)return;
   UE2.keyboardActivationHeld=key;
   event.preventDefault();ue2ActivateSelection();
  }
 });
 document.addEventListener('keyup',event=>{
  const key=event.key;
  if((key==='Enter'||key.toLowerCase()==='x')&&UE2.keyboardActivationHeld===key)
   UE2.keyboardActivationHeld='';
 });
 window.addEventListener('focus',()=>{UE2.keyboardActivationHeld='';},{passive:true});
 Promise.resolve(window.electronAPI?.ue10StateStatus?.()).then(status=>{
  if(Number.isInteger(Number(status?.l3)))UE2.stateSaveButton=Number(status.l3);
  if(Number.isInteger(Number(status?.r3)))UE2.stateLoadButton=Number(status.r3);
 }).catch(()=>{});
 if(UE2.gamepadTimer)return;
 const poll=()=>{
  try{
   // Native input owns game hotkeys. Never turn background gameplay into
   // library navigation or launch when the emulator releases focus.
   if(UE2.emulatorRunning || !document.hasFocus()){
    UE2.gamepadAwaitNeutral=true;
    return;
   }
   if(document.getElementById('ue9-modal')){UE2.gamepadAwaitNeutral=true;return;}
   const pads=Array.from(navigator.getGamepads?.()||[]).filter(x=>x&&x.connected);
   if(document.getElementById('ue10-state-dialog')){ue10StateChooserGamepadTick(pads);return;}
   const knownPad=pads.find(x=>/xbox|xinput|dual.?sense|dual.?shock|wireless controller|gamepad/i.test(String(x.id||'')));
   const pad=pads.find(x=>String(x.id||x.index||'connected')===UE2.gamepadId)||knownPad||pads.find(x=>x.mapping==='standard')||pads[0];
   if(pad){
    const buttons=pad.buttons||[];
    if(UE2.gamepadId!==String(pad.id||pad.index||'connected')){
     UE2.gamepadId=String(pad.id||pad.index||'connected');
     UE2.gamepadPrevButtons=[];UE2.gamepadPrevAxisX=0;UE2.gamepadPrevAxisY=0;
     UE2.gamepadAxisPair=null;
     UE2.gamepadAwaitNeutral=true;
     // Detecta e grava o perfil do controle automaticamente. Isso evita
     // depender da tela de configuracoes para habilitar L3/R3.
     const padId=String(pad.id||'');
     if(UE2.gamepadAutoSyncId!==UE2.gamepadId&&window.electronAPI?.ue9SyncDevice){
      UE2.gamepadAutoSyncId=UE2.gamepadId;
      const sony=/dual.?sense|dual.?shock|ps5|sony|wireless controller/i.test(padId);
      const drivers=/xbox|xinput/i.test(padId)
       ? ['xinput','sdl2']
       : sony ? ['sdl2','dinput'] : ['sdl2','dinput','xinput'];
      Promise.resolve().then(async()=>{
       for(const driver of drivers){
        try{
         const result=await window.electronAPI.ue9SyncDevice({id:padId,driver});
         if(result?.ok){
          UE2.stateSaveButton=Number(result.l3);
          UE2.stateLoadButton=Number(result.r3);
          break;
         }
        }catch(_){/* tenta o proximo driver */}
       }
      }).catch(()=>{});
     }
    }
    // A few Windows bridges expose only GamepadButton.value and leave
    // pressed=false. Treat both representations as a physical press.
    const currentButtons=buttons.map(button=>Boolean(button?.pressed||Number(button?.value||0)>.55));
    const pressed=index=>Boolean(currentButtons[index]&&!UE2.gamepadPrevButtons[index]);
    const held=indices=>indices.some(index=>Boolean(currentButtons[index]));
    const justPressed=indices=>indices.some(index=>pressed(index));
    const axes=Array.from(pad.axes||[],value=>Number(value)||0);
    // Some DirectInput/Sony drivers expose the D-pad as axes 6/7 or 2/3,
    // instead of the standard Gamepad axes 0/1. Choose the first active pair
    // and keep the same pair while the direction is held.
    // Do not use trigger-only pairs (usually 4/5): triggers can rest at -1
    // on DirectInput and would make the controller look permanently held.
    const axisPairs=[[0,1],[6,7],[2,3],[8,9],[9,10]];
    const activePair=axisPairs.find(([x,y])=>{
     const xValue=axes[x]||0,yValue=axes[y]||0;
     const triggerRest=Math.abs(xValue)>.85&&Math.abs(yValue)>.85&&xValue<-.85&&yValue<-.85;
     return !triggerRest&&(Math.abs(xValue)>.55||Math.abs(yValue)>.55);
    });
    if(activePair)UE2.gamepadAxisPair=activePair;
    const [axisXIndex,axisYIndex]=UE2.gamepadAxisPair||[0,1];
    const axisX=axes[axisXIndex]||0,axisY=axes[axisYIndex]||0;
    const activeInput=currentButtons.some(Boolean)||Math.abs(axisX)>.55||Math.abs(axisY)>.55;
    // After launching, require a real release before accepting another
    // activation. This prevents a held Cross/A button from reopening the ROM
    // every time the external emulator returns focus to the launcher.
    if(UE2.gamepadAwaitNeutral){
     UE2.gamepadPrevButtons=currentButtons;
     UE2.gamepadPrevAxisX=axisX;UE2.gamepadPrevAxisY=axisY;
     if(!activeInput)UE2.gamepadAwaitNeutral=false;
     return;
    }
    const padId=String(pad.id||'');
    const sonyPad=/dual.?sense|dual.?shock|ps5|sony|wireless controller/i.test(padId);
    const standardLayout=pad.mapping==='standard'||buttons.length>=16;
    const standardStateButtons=standardLayout
      ? [10,11]
      : (/xbox|xinput/i.test(padId) ? [8,9]
        : (sonyPad ? [7,8] : [UE2.stateSaveButton,UE2.stateLoadButton]));
    const stateSavePressed=pressed(standardStateButtons[0]);
    const stateLoadPressed=pressed(standardStateButtons[1]);
    if(stateSavePressed&&!UE2.stateShortcutHeld){
     UE2.stateShortcutHeld=true;ue2StateShortcut('SAVE_STATE');
    }else if(stateLoadPressed&&!UE2.stateShortcutHeld){
     UE2.stateShortcutHeld=true;ue2StateShortcut('LOAD_STATE');
    }
    if(!currentButtons[standardStateButtons[0]]&&!currentButtons[standardStateButtons[1]])UE2.stateShortcutHeld=false;
    // Não deixe o mesmo frame continuar até a navegação/ação A. Isso evita
    // que L3/R3 seja interpretado como selecionar e relance o jogo.
    if(stateSavePressed||stateLoadPressed){
     UE2.gamepadPrevButtons=currentButtons;
     UE2.gamepadPrevAxisX=axisX;UE2.gamepadPrevAxisY=axisY;
     return;
    }
    const standardDpad=pad.mapping==='standard'||buttons.length>=16;
    // Chromium normally exposes Xbox, DualShock and DualSense as the W3C
    // standard (12/13/14/15). Older DirectInput bridges place the D-pad at
    // 11/12/13/14, so retain that exact legacy layout without overlapping
    // Up and Down as the previous implementation did.
    const dpad=standardDpad?{up:[12],down:[13],left:[14],right:[15]}:{up:[11],down:[12],left:[13],right:[14]};
    const directionEdges={
     left:justPressed(dpad.left)||(axisX<-.55&&UE2.gamepadPrevAxisX>=-.55),
     right:justPressed(dpad.right)||(axisX>.55&&UE2.gamepadPrevAxisX<=.55),
     up:justPressed(dpad.up)||(axisY<-.55&&UE2.gamepadPrevAxisY>=-.55),
     down:justPressed(dpad.down)||(axisY>.55&&UE2.gamepadPrevAxisY<=.55)
    };
    const directionHeld={
     left:held(dpad.left)||axisX<-.55,
     right:held(dpad.right)||axisX>.55,
     up:held(dpad.up)||axisY<-.55,
     down:held(dpad.down)||axisY>.55
    };
    const direction=directionEdges.left?'ArrowLeft':directionEdges.right?'ArrowRight':directionEdges.up?'ArrowUp':directionEdges.down?'ArrowDown':'';
    const heldDirection=directionHeld.left?'ArrowLeft':directionHeld.right?'ArrowRight':directionHeld.up?'ArrowUp':directionHeld.down?'ArrowDown':'';
    let directionPulse=direction;
    const now=performance.now();
    if(!directionPulse&&heldDirection){
     if(UE2.gamepadRepeatDirection!==heldDirection){
      UE2.gamepadRepeatDirection=heldDirection;UE2.gamepadRepeatAt=now+260;directionPulse=heldDirection;
     }else if(now>=UE2.gamepadRepeatAt){
      UE2.gamepadRepeatAt=now+105;directionPulse=heldDirection;
     }
    }else if(!heldDirection){
     UE2.gamepadRepeatDirection='';UE2.gamepadRepeatAt=0;
    }else if(direction&&UE2.gamepadRepeatDirection!==direction){
     UE2.gamepadRepeatDirection=direction;UE2.gamepadRepeatAt=now+260;
    }
    if(directionPulse)ue2NavigateGamepad(directionPulse);
    else if(!UE2.stateCommandBusy &&
      performance.now()>=UE2.suppressGamepadLaunchUntil &&
      justPressed([0])){UE2.gamepadAwaitNeutral=true;ue2ActivateGamepadSelection();}
    UE2.gamepadPrevButtons=currentButtons;
    UE2.gamepadPrevAxisX=axisX;UE2.gamepadPrevAxisY=axisY;
   }else{
    UE2.gamepadId='';UE2.gamepadAutoSyncId='';UE2.gamepadPrevButtons=[];UE2.gamepadPrevAxisX=0;UE2.gamepadPrevAxisY=0;
    UE2.gamepadAwaitNeutral=false;UE2.gamepadRepeatDirection='';UE2.gamepadRepeatAt=0;UE2.gamepadAxisPair=null;
   }
  }catch(error){console.debug('Gamepad navigation:',error?.message||error)}
 };
 UE2.gamepadTimer=setInterval(poll,50);
}
function ue2Play(game) {
 if(!game||state.launching)return;
 if(UE2.galleryOpen)ue2CloseGallery();
 state.selectedSystem=game.system;state.selectedRom=game.path;renderSystemHeader();renderPlayButton();
 if(game.system.id==='psx')ue1511PS1Dialog(game.path,'select');
 else launchRom(game.system,game.path);
}
function ue2RefreshCount() {
 const total=ue2AllGames().length;
 const nav=document.getElementById('ue2-count-all');if(nav)nav.textContent=total.toLocaleString('pt-BR');
 const small=document.getElementById('ue2-sidebar-count');if(small)small.textContent=SYSTEMS.length+' plataformas';
}
function ueShowAbout(){
 if(document.getElementById('ue-about-dialog'))return;
 const previous=document.activeElement;
 const dialog=el('dialog',{id:'ue-about-dialog','aria-labelledby':'ue-about-title'});
 const close=()=>dialog.close();
 const heading=el('div',{className:'ue-about-heading'},el('div',{},el('p',{className:'ue-about-eyebrow'},'ULTIMATE EMULATOR'),el('h2',{id:'ue-about-title'},'Sobre')),el('button',{type:'button',className:'ue-about-close','aria-label':'Fechar',title:'Fechar',onClick:close},ue2Icon('close',21)));
 const details=el('dl',{className:'ue-about-details'});
 for(const [label,value] of [['Desenvolvedor','Rafael Pegado Da Silva'],['YouTube','Rafael_Info'],['E-mail','rafaelpds@me.com']]){
  details.appendChild(el('div',{},el('dt',{},label),el('dd',{'data-ue-no-translate':'true'},value)));
 }
 dialog.append(heading,details,el('div',{className:'ue-about-footer'},el('button',{type:'button',className:'ue2-top-btn',onClick:close},'Fechar')));
 dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)close()}});
 dialog.addEventListener('close',()=>{dialog.remove();if(previous?.isConnected)previous.focus()},{once:true});
 document.body.appendChild(dialog);dialog.showModal();
}
function ue2Btn(label,icon,handler,className='ue2-action') {
 return el('button',{type:'button',className,onClick:handler},ue2Icon(icon,16),el('span',{},label));
}
function ue2RefreshActionButtons() {renderPlayButton();}
function ue2UpdateFavoriteUI() {
 document.querySelectorAll('.ue2-favorite[data-key]').forEach(btn=>{
  const game=ue2AllGames().find(x=>ue2Key(x.path)===btn.dataset.key);
  if(game){btn.classList.toggle('is-favorite',UE2.favorites.has(game.path));btn.setAttribute('aria-label',UE2.favorites.has(game.path)?'Remover favorito':'Adicionar favorito');}
 });
}
function ue2Favorite(game) {
 if(UE2.favorites.has(game.path))UE2.favorites.delete(game.path);else UE2.favorites.add(game.path);
 ue2WriteLocal('ue2-favorites',JSON.stringify([...UE2.favorites]));ue2SavePrefs();
 if(UE2.section==='favorites')renderRomList();else ue2UpdateFavoriteUI();
 ue2RenderDetail();
}
function ue2Key(str) {let h=2166136261;for(const char of str)h=Math.imul(h^char.charCodeAt(0),16777619);return String(h>>>0);}
function ue2OpenMenu(event,game) {
 event.preventDefault();event.stopPropagation();
 document.querySelector('#ue2-context-menu')?.remove();
 const menu=el('div',{id:'ue2-context-menu'});
 const item=(title,fn)=>menu.appendChild(el('button',{onClick:()=>{menu.remove();fn();}},title));
 item('Jogar',()=>ue2Play(game));item(UE2.favorites.has(game.path)?'Remover dos favoritos':'Adicionar aos favoritos',()=>ue2Favorite(game));
 item('Mostrar no Explorador',()=>ue9ShowInExplorer(game));
 item('Excluir (mover para a Lixeira)…',()=>ue9TrashSelected());
 item('Escolher capa no computador…',()=>ue2PickCover(game));
 item('Buscar capa na internet',()=>ue2AutoCover(game,true));
 if(!['psx','ps2','gamecube'].includes(game.system.id))item('Cheats…',async()=>{try{const r=await window.electronAPI.ue20CheatsOpen({romPath:game.path,id:game.system.id,systemFolder:game.system.folder,core:game.system.core,launcher:game.system.launcher});if(!r?.ok)setStatus(r?.error||'Cheats indisponíveis.','info');}catch(err){setStatus('Não foi possível abrir os cheats: '+(err.message||err),'error');}});
 menu.style.left=Math.max(4,Math.min(event.clientX,window.innerWidth-250))+'px';menu.style.top=Math.max(4,Math.min(event.clientY,window.innerHeight-320))+'px';
 document.body.appendChild(menu);
 const close=e=>{if(!menu.contains(e.target)){menu.remove();document.removeEventListener('pointerdown',close)}};
 setTimeout(()=>document.addEventListener('pointerdown',close),0);
}
 function ue2GalleryMove(delta){
  if(!UE2.galleryOpen||!UE2.galleryGames.length)return;
  UE2.galleryIndex=(UE2.galleryIndex+delta+UE2.galleryGames.length)%UE2.galleryGames.length;
  if(UE2.galleryFrame)return;
  UE2.galleryFrame=requestAnimationFrame(()=>{UE2.galleryFrame=null;if(UE2.galleryOpen)ue2RenderGallery()});
}
function ue2GalleryBackdrop(game){
 const overlay=document.getElementById('ue-cover-gallery');
 const backdrop=overlay?.querySelector('.ue-gallery-backdrop');
 if(!backdrop)return;
 // O Cover Flow fica sobre a biblioteca atual; o próprio app permanece visível
 // atrás do véu escuro desfocado, sem criar um painel opaco marrom/cinza.
 backdrop.removeAttribute('data-cover');
 backdrop.style.removeProperty('--ue-gallery-cover');
}
function ue2CloseGallery(){
 const overlay=document.getElementById('ue-cover-gallery');
 if(!overlay&&!UE2.galleryOpen)return;
 UE2.galleryOpen=false;
 document.body.classList.remove('ue-gallery-active');
 overlay?.remove();
  if(UE2.galleryKeyHandler){document.removeEventListener('keydown',UE2.galleryKeyHandler,true);UE2.galleryKeyHandler=null;}
  if(UE2.galleryFrame){cancelAnimationFrame(UE2.galleryFrame);UE2.galleryFrame=null;}
 // Cover mode is a presentation layer, not a second library layout.
 UE2.view='grid';
 ue2WriteLocal('ue2-view','grid');
 ue2SavePrefs();
 renderRomList();
}
function ue2RenderGallery(){
 const overlay=document.getElementById('ue-cover-gallery');
 const game=UE2.galleryGames[UE2.galleryIndex];
 if(!overlay||!game)return;
 const stage=overlay.querySelector('.ue-gallery-stage');
 const track=overlay.querySelector('.ue-coverflow-track');
 const title=overlay.querySelector('.ue-gallery-title');
 const platform=overlay.querySelector('.ue-gallery-platform');
 const counter=overlay.querySelector('.ue-gallery-counter');
 const play=overlay.querySelector('.ue-gallery-play');
 const slider=overlay.querySelector('.ue-gallery-slider');
 if(title)title.textContent=game.name;
 if(platform)platform.textContent=game.system.name;
 if(counter)counter.textContent=`${UE2.galleryIndex+1} / ${UE2.galleryGames.length}`;
 ue2GalleryBackdrop(game);
 if(slider)slider.value=String(UE2.galleryIndex);
 if(play){play.onclick=()=>ue2Play(game);}
 if(track){
  track.replaceChildren();
  const total=UE2.galleryGames.length;
  // Three cards are enough for the Cover Flow effect and keep old PCs responsive.
  for(let offset=-1;offset<=1;offset++){
   const index=(UE2.galleryIndex+offset+total)%total;
   const itemGame=UE2.galleryGames[index];
   const art=ue2Art(itemGame,true);
   art.classList.add('ue-coverflow-item');
   if(offset===0)art.classList.add('is-current');
   art.dataset.art=ue2Key(itemGame.path);art.dataset.offset=String(offset);art.dataset.index=String(index);
   art.title=offset===0?'Clique para jogar':'Clique para selecionar';
   art.setAttribute('aria-label',itemGame.name);
   art.addEventListener('click',event=>{
    event.stopPropagation();
    if(offset===0)ue2Play(itemGame);
    else {UE2.galleryIndex=index;ue2RenderGallery();}
   });
   track.appendChild(art);ue2QueueCover(itemGame,offset===0);
  }
  track.onwheel=event=>{
   if(Math.abs(event.deltaY)>Math.abs(event.deltaX)){event.preventDefault();ue2GalleryMove(event.deltaY>0?1:-1);}
  };
 }
 state.selectedRom=game.path;
 state.selectedSystem=game.system;
 ue2QueueCover(game,true);
 overlay.querySelector('.ue-gallery-slider')?.focus({preventScroll:true});
}
function ue2OpenGallery(startGame=null){
 const games=ue2VisibleGames();
 if(!games.length){setStatus('Nenhuma capa disponível para abrir na galeria.','info');return;}
 ue2CloseGallery();
 UE2.view='carousel';
 UE2.galleryGames=games;
 const start=startGame?games.findIndex(game=>game.path===startGame.path):0;
 UE2.galleryIndex=start>=0?start:0;
 UE2.galleryOpen=true;
 document.body.classList.add('ue-gallery-active');
 const overlay=el('div',{id:'ue-cover-gallery',className:'ue-cover-gallery',role:'dialog','aria-modal':'true','aria-label':'Galeria de capas',tabindex:'-1'});
 const backdrop=el('div',{className:'ue-gallery-backdrop','aria-hidden':'true'});
 const shell=el('div',{className:'ue-gallery-shell'});
 const top=el('div',{className:'ue-gallery-top'},el('div',{className:'ue-gallery-kicker'},'GALERIA DE CAPAS'),el('button',{type:'button',className:'ue-gallery-close','aria-label':'Fechar galeria',title:'Fechar (Esc)',onClick:ue2CloseGallery},ue2Icon('close',20)));
 const track=el('div',{className:'ue-coverflow-track','aria-live':'polite'});
 const prev=el('button',{type:'button',className:'ue-gallery-arrow ue-gallery-prev','aria-label':'Capa anterior',title:'Capa anterior',onClick:event=>{event.stopPropagation();ue2GalleryMove(-1)}},ue2Icon('chev',28));
 const next=el('button',{type:'button',className:'ue-gallery-arrow ue-gallery-next','aria-label':'Próxima capa',title:'Próxima capa',onClick:event=>{event.stopPropagation();ue2GalleryMove(1)}},ue2Icon('chev',28));
 const stage=el('div',{className:'ue-gallery-stage'},track,prev,next);
 const info=el('div',{className:'ue-gallery-info'},el('span',{className:'ue-gallery-platform'}),el('h2',{className:'ue-gallery-title'}),el('span',{className:'ue-gallery-counter'}));
 const slider=el('input',{type:'range',className:'ue-gallery-slider',min:'0',max:String(Math.max(0,games.length-1)),value:String(UE2.galleryIndex),step:'1','aria-label':'Posição da capa',onInput:event=>{UE2.galleryIndex=Number(event.target.value);ue2RenderGallery()}});
 const actions=el('div',{className:'ue-gallery-actions'},el('button',{type:'button',className:'ue-gallery-play'},ue2Icon('play',17),el('span',{},'Jogar agora')));
 shell.append(top,stage,info,slider,actions);
 overlay.append(backdrop,shell);
 overlay.addEventListener('pointerdown',event=>{if(event.target===overlay||event.target===backdrop)ue2CloseGallery();});
 overlay.addEventListener('dblclick',event=>event.stopPropagation());
 document.body.appendChild(overlay);
 UE2.galleryKeyHandler=event=>{
  if(!UE2.galleryOpen)return;
  if(event.key==='Escape'){event.preventDefault();ue2CloseGallery();}
  else if(event.key==='ArrowLeft'){event.preventDefault();ue2GalleryMove(-1);}
  else if(event.key==='ArrowRight'){event.preventDefault();ue2GalleryMove(1);}
 };
 document.addEventListener('keydown',UE2.galleryKeyHandler,true);
 ue2RenderGallery();
 requestAnimationFrame(()=>overlay.focus());
}
function ue2Art(game,large=false) {
 const art=el('div',{className:large?'ue2-art ue2-art-large':'ue2-art',style:{'--art-a':game.system.colors[0],'--art-b':game.system.colors[1]}});
 const letter=el('div',{className:'ue2-art-empty'},
  el('div',{className:'ue2-art-logo'},ue2Icon('game',large?50:36)),
  el('div',{className:'ue2-art-monogram'},game.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()),
  el('div',{className:'ue2-art-platform'},game.system.name.toUpperCase()));
 art.appendChild(letter);
 const meta=UE2.meta.get(game.path);
 if(meta?.cover)ue2SetArt(art,meta.cover,game.name);
 return art;
}
function ue2SetArt(art,url,alt) {
 if(!art||!url)return;
 art.querySelector('img')?.remove();
 delete art.dataset.orientation;art.style.removeProperty('--art-ratio');
 // Capas que já estão no cache chegam como data URLs: comece a decodificar
 // todas imediatamente para a grade aparecer de uma vez, sem efeito de
 // carregamento progressivo ao rolar.
 const image=el('img',{src:url,alt:'Capa de '+alt,loading:url.startsWith('data:')?'eager':'lazy'});
 const applyImageShape=()=>{
  const width=image.naturalWidth,height=image.naturalHeight;
  if(!width||!height)return;
  const ratio=width/height;
  art.dataset.orientation=ratio>1.08?'landscape':ratio<.92?'portrait':'square';
  art.style.setProperty('--art-ratio',ratio.toFixed(4));
 };
 image.addEventListener('load',applyImageShape,{once:true});
 image.onerror=()=>{delete art.dataset.orientation;image.remove()};
 art.appendChild(image);
 if(image.complete)applyImageShape();
}
function ue2SyncCover(game){
 const selector='[data-art="'+ue2Key(game.path)+'"]';
 for(const art of document.querySelectorAll(selector))ue2SetArt(art,UE2.meta.get(game.path)?.cover,game.name);
}
function ue2QueueCover(game,autoCover=false) {
 const id=game.path;
 if(UE2.coverBatchIds.has(id))return;
 const known=UE2.meta.get(id);
 if((known?.cover||(!autoCover&&UE2.meta.has(id))||UE2.autoTried.has(id))||UE2.pending.has(id)||!window.electronAPI?.ueModernGet)return;
 if(autoCover)UE2.autoTried.add(id);
 UE2.pending.add(id);UE2.queued.push({game,autoCover});ue2Drain();
}
function ue2HydrateCachedCovers(games){
 const api=window.electronAPI?.ueModernGetMany;
 if(!api||!Array.isArray(games)||!games.length)return;
 const candidates=games.slice(0,UE2.maxCards).filter(game=>game?.path&&!UE2.meta.has(game.path)&&!UE2.coverBatchIds.has(game.path));
 if(!candidates.length)return;
 const byPath=new Map(candidates.map(game=>[game.path,game]));
 candidates.forEach(game=>UE2.coverBatchIds.add(game.path));
 api(candidates.map(game=>game.path)).then(records=>{
  for(const record of Array.isArray(records)?records:[]){
   const pathname=String(record?.path||'');
   const game=byPath.get(pathname);if(!game)continue;
   UE2.meta.set(pathname,record.data||{});ue2SyncCover(game);
   if(state.selectedRom===pathname)ue2ScheduleDetail();
  }
 }).catch(error=>console.warn('Capas em cache:',error?.message||error)).finally(()=>{
  candidates.forEach(game=>UE2.coverBatchIds.delete(game.path));
  for(const game of candidates){
   if(state.selectedRom===game.path&&!UE2.meta.get(game.path)?.cover)ue2QueueCover(game,true);
  }
 });
}
async function ue2Drain(){
 while(UE2.busy<2&&UE2.queued.length){
  const job=UE2.queued.shift(),game=job.game||job,autoCover=job.autoCover===true;UE2.busy++;
  (async()=>{
   try{
    let data=await window.electronAPI.ueModernGet(game.path);
    UE2.meta.set(game.path,data||{});ue2SyncCover(game);
    if(state.selectedRom===game.path)ue2ScheduleDetail();
    if(!data?.cover && autoCover && window.electronAPI?.ueModernAutoCover){
      data=await window.electronAPI.ueModernAutoCover(game.path,game.system.id,false,game.name);
      UE2.meta.set(game.path,data||{});ue2SyncCover(game);
      if(state.selectedRom===game.path)ue2ScheduleDetail();
    }
   }catch(e){console.warn('Capa:',e?.message||e)}finally{UE2.pending.delete(game.path);UE2.busy--;ue2Drain();}
  })();
 }
}
function ue2DescriptionFor(game){
 if(!game)return null;
 const known=UE2.descriptions.get(game.path);
 if(!known)ue2QueueDescription(game,true);
 return known||null;
}
function ue2QueueDescription(game,auto=true){
 if(!game?.path||!window.electronAPI?.ue2DescriptionGet)return;
 const known=UE2.descriptions.get(game.path);
 if(known&&(known.status==='ok'||known.status==='not-found'))return;
 if(known?.status==='retry'&&Date.now()-Number(known.retryAt||0)<60000)return;
 if(known?.status==='retry')UE2.descriptions.delete(game.path);
 if(UE2.descriptionPending.has(game.path))return;
 UE2.descriptionPending.add(game.path);UE2.descriptionQueue.push({game,auto});ue2DrainDescriptions();
}
async function ue2DrainDescriptions(){
 while(UE2.descriptionBusy<1&&UE2.descriptionQueue.length){
  const job=UE2.descriptionQueue.shift(),game=job.game;UE2.descriptionBusy++;
  (async()=>{
   try{
    // Mantém as consultas educadas com a API pública e evita picos quando
    // uma lista grande é aberta pela primeira vez.
    await new Promise(resolve=>setTimeout(resolve,900));
    let result=await window.electronAPI.ue2DescriptionGet(game.path);
    if((result?.status==='ok'||result?.status==='not-found')&&result.cached){
     UE2.descriptions.set(game.path,result);
    }else if(job.auto&&window.electronAPI.ue2DescriptionAuto){
     result=await window.electronAPI.ue2DescriptionAuto(game.path,game.system.id,game.name,false);
     if(result?.status==='ok'||result?.status==='not-found')UE2.descriptions.set(game.path,result);
     else if(result?.status==='retry'){
      const retry={...result,retryAt:Date.now()};UE2.descriptions.set(game.path,retry);
      setTimeout(()=>{if(UE2.descriptions.get(game.path)===retry){UE2.descriptions.delete(game.path);ue2QueueDescription(game,true)}},65000);
     }
    }
    if(result?.status==='ok'||result?.status==='not-found'||result?.status==='retry')window.dispatchEvent(new CustomEvent('ue2-description-updated',{detail:{path:game.path}}));
   }catch(error){console.warn('Sinopse:',error?.message||error)}
   finally{UE2.descriptionPending.delete(game.path);UE2.descriptionBusy--;ue2DrainDescriptions()}
  })();
 }
}
let ue2DescriptionEditorTimer=null;
async function ue2EditDescription(game){
 if(!game?.path||!window.electronAPI?.ue2DescriptionEdit)return;
 document.getElementById('ue-description-editor')?.remove();
 const previous=document.activeElement;
 const opened=await window.electronAPI.ue2DescriptionEdit(game.path).catch(error=>({ok:false,error:error?.message||String(error)}));
 if(!opened?.ok&&opened?.error)setStatus('Não foi possível abrir o TXT: '+opened.error,'error');
 const initial=opened?.description||UE2.descriptions.get(game.path)||{text:''};
 UE2.descriptions.set(game.path,initial);
 const overlay=el('div',{id:'ue-description-editor',className:'ue-description-editor',role:'dialog','aria-modal':'true','aria-label':'Editar sinopse'});
 const panel=el('div',{className:'ue-description-editor-panel'});
 const title=el('h3',{},'Editar sinopse — '+game.name);
 const help=el('p',{className:'ue-description-editor-help'},'O arquivo TXT foi aberto. Cole ou escreva o texto, salve no editor e ele será atualizado aqui automaticamente.');
 const area=el('textarea',{className:'ue-description-editor-text','aria-label':'Texto da sinopse',spellcheck:'true'});area.value=initial.text||'';
 const status=el('span',{className:'ue-description-editor-status'},opened?.file||'');
 const close=()=>{clearInterval(ue2DescriptionEditorTimer);ue2DescriptionEditorTimer=null;overlay.remove();if(previous?.isConnected)previous.focus()};
 const update=description=>{if(!description||description.status!=='ok')return;UE2.descriptions.set(game.path,description);if(document.activeElement!==area&&area.value!==description.text)area.value=description.text||'';status.textContent=description.manual?'TXT manual salvo':'Sinopse atualizada';window.dispatchEvent(new CustomEvent('ue2-description-updated',{detail:{path:game.path}}));};
 const save=async()=>{const result=await window.electronAPI.ue2DescriptionSave(game.path,area.value).catch(error=>({status:'retry',error:error?.message||String(error)}));if(result?.status==='ok'){update(result);status.textContent='Sinopse salva no TXT';}else status.textContent='Falha ao salvar a sinopse';};
 const reopen=()=>window.electronAPI.ue2DescriptionEdit(game.path).then(result=>{if(result?.file)status.textContent=result.file;}).catch(()=>{});
 const buttons=el('div',{className:'ue-description-editor-actions'},el('button',{type:'button',className:'ue2-action',onClick:reopen},'Abrir TXT novamente'),el('button',{type:'button',className:'ue2-action',onClick:close},'Fechar'),el('button',{type:'button',className:'ue2-play-primary',onClick:save},'Salvar sinopse'));
 panel.append(title,help,area,buttons,status);overlay.appendChild(panel);overlay.addEventListener('pointerdown',event=>{if(event.target===overlay)close()});overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close()}else if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();save()}});document.body.appendChild(overlay);area.focus();
 clearInterval(ue2DescriptionEditorTimer);ue2DescriptionEditorTimer=setInterval(async()=>{const latest=await window.electronAPI.ue2DescriptionGet(game.path).catch(()=>null);if(latest?.status==='ok'&&latest.manual&&latest.text!==area.value)update(latest);},900);
}
function ue2QueueDescriptionsForList(games=ue2VisibleGames()){
 const limit=UE2.section==='system'?games.length:Math.min(games.length,8);
 for(const game of games.slice(0,limit))ue2QueueDescription(game,true);
}
async function ue2PickCover(game){
 try{
  const meta=await window.electronAPI.ueModernPickCover(game.path);
   UE2.meta.set(game.path,meta);ue2SyncCover(game);ue2ScheduleDetail();
 }catch(e){setStatus('Falha ao alterar capa: '+e.message,'error')}
}
async function ue2AutoCover(game,force=false){
 try{
  if(!window.electronAPI?.ueModernAutoCover)throw Error('Busca indisponível');
  if(force)setStatus('Buscando capa para '+game.name+'…');
  const meta=await window.electronAPI.ueModernAutoCover(game.path,game.system.id,force,game.name);
   UE2.meta.set(game.path,meta);ue2SyncCover(game);ue2ScheduleDetail();
  if(force)setStatus(meta.cover?'Capa encontrada.':'Capa não encontrada no catálogo.','info');
 }catch(e){setStatus('Erro ao buscar capa: '+e.message,'error')}
}
const ueGameRegions=new Map();
function ueGameRegionLabel(game){
 const known=ueGameRegions.get(game.path);
 if(known)return known.label;
 ueGameRegions.set(game.path,{label:'Identificando…'});
 window.electronAPI?.ueGameRegion?.(game.path).then(result=>{
  ueGameRegions.set(game.path,{label:result?.region||'Não identificada'});
   if(state.selectedRom===game.path)ue2ScheduleDetail();
  }).catch(()=>{ueGameRegions.set(game.path,{label:'Não identificada'});if(state.selectedRom===game.path)ue2ScheduleDetail()});
 return 'Identificando…';
}
const ueGameInformation=new Map();
function ueGameInfoFor(game){
 const known=ueGameInformation.get(game.path);if(known)return known;
 const pending={company:'Identificando…',year:'Identificando…'};ueGameInformation.set(game.path,pending);
 Promise.resolve(window.electronAPI?.ueGameInfo?.({rom:game.path,systemId:game.system.id})).then(result=>{
   ueGameInformation.set(game.path,result||{});if(state.selectedRom===game.path)ue2ScheduleDetail();
  }).catch(()=>{ueGameInformation.set(game.path,{});if(state.selectedRom===game.path)ue2ScheduleDetail()});return pending;
}
function ue2RenderDetail(){
 const panel=document.getElementById('ue2-detail');if(!panel)return;
 const game=ue2SelectedGame();panel.replaceChildren();
 if(!game){
  panel.appendChild(el('div',{className:'ue2-detail-eyebrow'},'SUA BIBLIOTECA'));
  panel.appendChild(el('div',{className:'ue2-detail-placeholder'},ue2Icon('game',54),el('h3',{},'Seu próximo jogo está aqui'),el('p',{},'Selecione uma capa para ver os detalhes e jogar.')));
  panel.appendChild(el('div',{className:'ue2-detail-stats'},
   el('div',{},el('strong',{},ue2AllGames().length.toLocaleString('pt-BR')),el('span',{},'Jogos')),
   el('div',{},el('strong',{},String(SYSTEMS.length)),el('span',{},'Sistemas'))));
  return;
 }
 const meta=UE2.meta.get(game.path)||{};
 panel.appendChild(el('div',{className:'ue2-detail-eyebrow'},'JOGO SELECIONADO'));
 const art=ue2Art(game,true);art.dataset.art=ue2Key(game.path);panel.appendChild(art);
 panel.appendChild(el('h2',{className:'ue2-detail-name'},game.name));
 panel.appendChild(el('span',{className:'ue2-detail-system'},game.system.name));
 panel.appendChild(ue2Btn('Jogar agora','play',()=>ue2Play(game),'ue2-play-primary'));
 const actions=el('div',{className:'ue2-detail-actions'});
 actions.appendChild(ue2Btn(UE2.favorites.has(game.path)?'Favoritado':'Favoritar','star',()=>ue2Favorite(game)));
 actions.appendChild(ue2Btn('Trocar capa','image',()=>ue2PickCover(game)));
 panel.appendChild(actions);
 const info=ueGameInfoFor(game);
 const played=meta.lastPlayed?new Date(meta.lastPlayed).toLocaleString('pt-BR'):'Nunca';
 for(const [label,value] of [['Plataforma',game.system.name],['Execuções',String(meta.plays||0)],['Última vez',played],['Região',ueGameRegionLabel(game)],['Empresa',info.company||'Não identificada'],['Ano',info.year||'Não identificado'],['Saves','Não identificados']]){
  const row=el('div',{className:'ue2-detail-row'},el('span',{},label),el('strong',{},value));
  if(label==='Empresa'&&info.source)row.title=[info.developer?'Desenvolvedora: '+info.developer:'',info.publisher?'Publicadora: '+info.publisher:'',info.companyRole==='manufacturer'?'Fabricante: '+info.company:'',info.source].filter(Boolean).join(' · ');
  panel.appendChild(row);
 }
 panel.appendChild(el('p',{className:'ue2-detail-footnote'},'Clique com o botão direito na capa para trocar a imagem ou acessar os cheats.'));
 ue2QueueCover(game,true);
}
function ue2ObserveCoverCards(list){
 if(UE2.coverObserver){UE2.coverObserver.disconnect();UE2.coverObserver=null;}
 const cards=[...list.querySelectorAll('.ue2-card[data-game]')];
 if(!cards.length)return;
 const gamesByKey=new Map(ue2VisibleGames().map(game=>[ue2Key(game.path),game]));
 if(!('IntersectionObserver' in window)){
  cards.slice(0,18).forEach(card=>{const game=gamesByKey.get(card.dataset.game);if(game)ue2QueueCover(game,false)});
  return;
 }
 const root=list.scrollHeight>list.clientHeight?list:null;
 UE2.coverObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   const game=gamesByKey.get(entry.target.dataset.game);
   if(game)ue2QueueCover(game,false);
   UE2.coverObserver?.unobserve(entry.target);
  }
 },{root,rootMargin:'280px 0px'});
 cards.forEach(card=>UE2.coverObserver.observe(card));
}
function ue2RenderRecent(){
 const list=document.getElementById('ue2-recent-list');if(!list)return;
 list.replaceChildren();const games=ue2AllGames();
 for(const path of UE2.recent.slice(0,4)){
  const game=games.find(x=>x.path===path);if(!game)continue;
  list.appendChild(el('button',{className:'ue2-recent-row',title:game.name,onClick:()=>ue2SelectGame(game)},
   ue2Icon('clock',14),el('span',{},game.name)));
 }
 if(!list.children.length)list.appendChild(el('p',{className:'ue2-recent-empty'},'Seus jogos recentes aparecem aqui.'));
}
function ue2Played(rom){
 UE2.recent=[rom,...UE2.recent.filter(v=>v!==rom)].slice(0,35);
 ue2WriteLocal('ue2-recent',JSON.stringify(UE2.recent));ue2SavePrefs();
  window.electronAPI?.ueModernPlayed?.(rom).then(m=>{UE2.meta.set(rom,m);ue2ScheduleDetail();}).catch(()=>{});
 ue2RenderRecent();
}

// Replaces only the old UI builders. All game launchers and configuration panels stay in place.
buildLayout=function(){
 const root=document.getElementById('root');root.replaceChildren();
 const app=el('div',{id:'app',className:'ue2-app'});
 const body=el('div',{id:'body'});
 const sidebar=el('aside',{id:'sidebar'});
 sidebar.appendChild(el('div',{className:'ue2-logo'},
  el('span',{className:'ue2-logo-icon'},el('span',{},'◆'),el('span',{},'✦')),
  el('div',{},el('strong',{},'ULTIMATE'),el('small',{},'EMULATOR'))));
 sidebar.appendChild(el('div',{className:'ue2-side-heading'},'BIBLIOTECA'));
 const nav=el('div',{id:'ue2-nav'});
 const links=[['all','Todos os jogos','grid'],['recent','Recentes','clock'],['favorites','Favoritos','star']];
 for(const [id,label,ic]of links){
  const btn=el('button',{className:'ue2-nav-btn'+(id===UE2.section?' active':''),'data-section':id,onClick:()=>ue2SetSection(id)},ue2Icon(ic),el('span',{},label));
  if(id==='all')btn.appendChild(el('span',{id:'ue2-count-all',className:'ue2-count'},'0'));
  nav.appendChild(btn);
 }
 sidebar.appendChild(nav);
 sidebar.appendChild(el('div',{className:'ue2-side-heading ue2-systems-heading'},'PLATAFORMAS',el('span',{id:'ue2-sidebar-count'},'')));
 sidebar.appendChild(el('div',{id:'ue2-system-list'}));
 const foot=el('div',{className:'ue2-sidebar-foot'},el('div',{className:'ue2-profile-icon'},'UE'),el('div',{},el('strong',{},'Minha biblioteca'),el('small',{},'Pronta para jogar')));
 sidebar.appendChild(foot);body.appendChild(sidebar);
 const main=el('main',{id:'main'});
 const titlebar=el('header',{id:'titlebar'});
  titlebar.appendChild(el('div',{className:'ue2-search-wrap'},ue2Icon('search',20),el('input',{id:'ue2-search',type:'search',placeholder:'Buscar jogos, plataformas…',autocomplete:'off','aria-label':'Buscar jogos',onInput:e=>{UE2.query=e.target.value;UE2.maxCards=UE2.pageSize;renderRomList();}})));
 const topActions=el('div',{className:'ue2-top-actions'});
 topActions.append(
  ue2Btn('GLOBAL SCAN','scan',globalScan,'ue2-top-btn ue2-scan-btn'),
  ue2Btn('AJUSTES','settings',async()=>{
   if(UE2.section==='system'&&state.selectedSystem?.id==='ps2'){
    try{
     const r=await window.electronAPI.launchPCSX2(null);
     if(!r?.ok)setStatus(r?.error||'Não foi possível abrir o PCSX2.','error');
     else setStatus('PCSX2 aberto para configuração.','success');
    }catch(e){setStatus('Falha ao abrir PCSX2: '+(e?.message||e),'error');}
    return;
   }
   ue7Panel('controls');
  },'ue2-top-btn ue2-settings-btn'),
  el('button',{id:'ue-about-button',type:'button',className:'ue2-top-btn',title:'Sobre','aria-label':'Sobre',onClick:ueShowAbout},ue2Icon('info',17),el('span',{},'Sobre'))
 );
 titlebar.appendChild(topActions);
 main.appendChild(titlebar);
 const header=el('div',{id:'system-header'});
 header.appendChild(el('div',{className:'ue2-breadcrumb'},el('span',{},'BIBLIOTECA'),ue2Icon('chev',14),el('span',{id:'ue2-breadcrumb-name'},'Todos os jogos')));
 header.appendChild(el('div',{className:'ue2-heading-row'},el('div',{},el('div',{className:'ue22-title-line'},el('h1',{id:'system-title'},'Meus jogos'),el('button',{id:'ue22-manual-scan',className:'ue2-top-btn',hidden:true,onClick:()=>scanRoms(state.selectedSystem,true)},'BUSCAR ROMS MANUAL')),el('p',{id:'system-core-info'},'Sua coleção, em um só lugar'))));
 const config=el('details',{id:'ue2-config-details',className:'ue2-config-details'});
 config.appendChild(el('summary',{},'Configuração do emulador',el('span',{className:'ue2-config-hint'},'clique para mostrar')));
 config.appendChild(el('div',{id:'ue2-config-rows',className:'ue2-config-rows'}));
 header.appendChild(config);
 main.appendChild(header);
 const toolbar=el('div',{id:'action-bar'});
 toolbar.appendChild(el('div',{className:'ue2-count-label',id:'rom-list-header'},'Biblioteca'));
 toolbar.appendChild(el('div',{className:'ue2-toolbar-spacer'}));
 const toggles=el('div',{className:'ue2-toggle'});
 for(const mode of ['grid','list','carousel']){
  const labels={grid:'Capas',list:'Lista',carousel:'Galeria'};
  const descriptions={grid:'Visualização em grade de capas',list:'Visualização em lista',carousel:'Galeria de capas em tela cheia'};
  const btn=el('button',{id:'ue2-view-'+mode,className:'ue2-view-btn'+(UE2.view===mode?' active':''),title:descriptions[mode],'aria-label':descriptions[mode],'aria-pressed':String(UE2.view===mode),onClick:()=>{if(mode==='carousel'){ue2OpenGallery(ue2SelectedGame()||ue2VisibleGames()[0]);return;}UE2.view=mode;ue2WriteLocal('ue2-view',mode);ue2SavePrefs();renderRomList();}},ue2Icon(mode,17),el('span',{className:'ue2-view-label'},labels[mode]));toggles.appendChild(btn);
 }
 toolbar.appendChild(toggles);
 for(const [id,label,dir] of [['prev','Capas anteriores',-1],['next','Próximas capas',1]]){
  const button=ue2Btn(label,dir<0?'chev':'chev',()=>{const rail=document.getElementById('rom-list');rail?.scrollBy({left:dir*Math.max(280,rail.clientWidth*.8),behavior:'smooth'})},'ue2-top-btn ue-carousel-nav');
  button.id='ue-carousel-'+id;button.title=label;button.setAttribute('aria-label',label);toolbar.appendChild(button);
 }

 toolbar.appendChild(el('span',{id:'ue9-selection-count',className:'ue9-selection-count'},''));
 toolbar.appendChild(el('button',{id:'btn-refresh-library',className:'ue2-top-btn',hidden:true,type:'button',onClick:()=>scanRoms(state.selectedSystem)},'ATUALIZAR LISTA'));
 const play=el('button',{id:'btn-play',className:'btn btn-play',disabled:true,onClick:()=>ue2Play(ue2SelectedGame())},ue2Icon('play',15),'Jogar');
 toolbar.appendChild(play);
 const scan=el('button',{id:'btn-scan',className:'ue2-hidden-but',onClick:globalScan},'Buscar jogos');toolbar.appendChild(scan);
 main.appendChild(toolbar);
 const area=el('div',{id:'rom-area'});area.appendChild(el('div',{id:'rom-list',className:'ue2-game-grid'}));main.appendChild(area);
 main.appendChild(el('div',{id:'status-bar',className:'status-bar status-info'},'Biblioteca pronta.'));
 body.appendChild(main);
 const right=el('aside',{id:'ue2-right'});
 right.appendChild(el('div',{className:'ue2-right-title'},el('span',{},'DETALHES'),ue2Icon('game',18)));
 right.appendChild(el('div',{id:'ue2-detail'}));
 right.appendChild(el('div',{className:'ue2-recent-panel'},el('h3',{},'Jogados recentemente'),el('div',{id:'ue2-recent-list'})));
 body.appendChild(right);app.appendChild(body);root.appendChild(app);
 ue2RenderRecent();ue2RenderDetail();
};
const UE19_HEALTH={};
async function ue19RefreshHealth(){
 try {
  if(!window.electronAPI?.ue19SystemHealth)return;
  const response=await window.electronAPI.ue19SystemHealth(
   SYSTEMS.map(s=>({id:s.id,launcher:s.launcher,core:s.core})));
  Object.assign(UE19_HEALTH,response||{});
  for(const s of SYSTEMS){
   const dot=document.querySelector('#sys-btn-'+s.id+' .system-btn-dot');
   if(!dot)continue;
   const item=UE19_HEALTH[s.id];
   dot.dataset.health=item?.ok?'ready':'missing';
   dot.style.setProperty('background',item?.ok?'#36db86':'transparent','important');
   dot.style.setProperty('color','#ff828d','important');
   dot.style.width=item?.ok?'9px':'auto';dot.style.height=item?.ok?'9px':'auto';dot.style.minWidth=item?.ok?'9px':'auto';
   dot.style.fontSize='9px';dot.style.fontWeight='800';dot.style.padding=item?.ok?'0':'3px';
   dot.style.borderRadius=item?.ok?'50%':'5px';
   dot.textContent=item?.ok?'':'CORRIGIR';
   dot.classList.toggle('ue-core-repair',!item?.ok);
   dot.setAttribute('role','button');dot.tabIndex=0;dot.style.cursor='pointer';
   const repair=async event=>{event.preventDefault();event.stopPropagation();try{setStatus('Selecione a pasta do componente necessário para '+s.name+'.','info');const r=await window.electronAPI.ueRepairComponent({id:s.id,launcher:s.launcher,core:s.core,folder:s.folder});if(r?.ok){await ue19RefreshHealth();setStatus('Pasta atualizada para '+s.name+'.','success');}else if(!r?.cancelled)setStatus(r?.error||'Não foi possível corrigir o componente.','error');}catch(e){setStatus(e.message,'error');}};
   dot.onclick=repair;dot.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')repair(e);};
   dot.style.boxShadow=item?.ok?'0 0 8px #29cb78bb':'0 0 8px #eb4b5b88';
   dot.title=(item?.reason||'Verificacao indisponivel')+' · Clique para escolher a pasta do core/emulador';
   dot.setAttribute('aria-label',item?.ok?'Componentes presentes · escolher pasta do core':'CORRIGIR · '+(item?.reason||'Componente ausente'));
   dot.parentElement.title=s.name+' — '+(item?.reason||'Verificacao indisponivel');
  }
 }catch(err){console.warn('Falha ao verificar cores',err)}
}
buildSidebar=function(){
 const list=document.getElementById('ue2-system-list');if(!list)return;
 list.replaceChildren();
 for(const system of SYSTEMS){
  const btn=el('button',{id:'sys-btn-'+system.id,className:'system-btn'+(UE2.section==='system'&&state.selectedSystem===system?' active':''),title:system.name,onClick:()=>selectSystem(system)},
  el('span',{className:'system-btn-dot',style:{background:'#868686'}}),el('span',{className:'system-btn-name'},system.name));
  list.appendChild(btn);
 }
 ue2RefreshCount();
 void ue19RefreshHealth();
};
updateSidebarActive=function(){
 for(const system of SYSTEMS)document.getElementById('sys-btn-'+system.id)?.classList.toggle('active',UE2.section==='system'&&state.selectedSystem===system);
 document.querySelectorAll('.ue2-nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.section===UE2.section));
 if(UE2.gamepadZone==='sidebar')requestAnimationFrame(()=>{ue2SyncGamepadSidebarIndex();ue2PaintGamepadSidebarFocus()});
};
renderSystemHeader=function(){
 const heading=document.getElementById('system-title');if(!heading)return;


 const ps2SettingsButton=document.querySelector('.ue2-settings-btn');
 const ps2SettingsLabel=ps2SettingsButton?.querySelector(':scope > span:not(.ue2-ico)');
 const isPs2Settings=UE2.section==='system'&&state.selectedSystem?.id==='ps2';
 if(ps2SettingsButton){ps2SettingsButton.hidden=UE2.section!=='system';ps2SettingsButton.setAttribute('aria-hidden',String(UE2.section!=='system'));}
 if(ps2SettingsLabel)ps2SettingsLabel.textContent=isPs2Settings?'Configurar PS2':'Ajustes';
 if(ps2SettingsButton)ps2SettingsButton.title=isPs2Settings?'Abrir o PCSX2 para configurar o emulador':'Abrir ajustes de controles';
 const names={all:'Todos os jogos',recent:'Jogados recentemente',favorites:'Meus favoritos',system:state.selectedSystem.name};
 heading.textContent=names[UE2.section];
 const favoritesSection=UE2.section==='favorites';
 document.querySelector('.ue2-search-wrap')?.toggleAttribute('hidden',favoritesSection);
 document.querySelector('.ue2-console-search')?.toggleAttribute('hidden',favoritesSection);
 const manual=document.getElementById('ue22-manual-scan');
 if(manual){manual.hidden=UE2.section!=='system';manual.disabled=state.scanning;manual.title='Escolher uma pasta de jogos de '+state.selectedSystem.name;}
 const refresh=document.getElementById('btn-refresh-library');
 if(refresh){refresh.hidden=UE2.section!=='system';refresh.disabled=state.scanning;refresh.title='Atualizar jogos de '+state.selectedSystem.name;}
 document.getElementById('ue2-breadcrumb-name').textContent=names[UE2.section];
 document.getElementById('system-core-info').textContent=UE2.section==='system'?(state.selectedSystem.id==='psx'?'DuckStation · PlayStation 1':getLauncherLabel(state.selectedSystem)):'Explore a sua coleção de jogos em um só lugar';
 const rows=document.getElementById('ue2-config-rows');
 if(rows){
  const system=state.selectedSystem;
  const romFolder=state.paths?.roms?.[system?.folder]||state.paths?.roms||'Pasta padrão do sistema';
  const runtime=system?.launcher==='retroarch'?'RetroArch integrado':(system?.launcher==='pcsx2'?'PCSX2':system?.launcher==='dolphin'?'Dolphin':system?.launcher==='mame'?'MAME':(system?.launcher||'Integrado'));
  const values=[['Core',system?.core||'Integrado'],['Execução',runtime+' · pronto para abrir jogos'],['Pasta de ROMs',romFolder],['Preferência inicial','Bilinar leve ativado']];
  rows.replaceChildren(...values.map(([label,value])=>el('div',{className:'ue2-config-row'},el('span',{},label),el('strong',{},String(value)),el('span',{className:'ue2-config-ok','aria-label':'OK'},'✓'))));
 }
 const main=document.getElementById('main');if(main){main.style.setProperty('--sys-c1','#6d6d6d');main.style.setProperty('--sys-c2','#828282')}
 if(UE2.section==='system'){
  const item=UE19_HEALTH[state.selectedSystem.id];
  const lbl=document.getElementById('system-core-info');
  if(item&&lbl)lbl.title=item.reason;
 }
};
renderRomList=function(){
 const list=document.getElementById('rom-list');if(!list)return;
 const games=ue2VisibleGames();list.replaceChildren();
 const allLanding=ue2IsAllLanding();
 list.setAttribute('role','listbox');list.setAttribute('aria-label','Lista de jogos');list.tabIndex=0;
 list.className=allLanding?'ue2-library-summary-list':(({list:'ue2-game-list',grid:'ue2-game-grid',carousel:'ue2-game-carousel'})[UE2.view]||'ue2-game-grid');
 list.onwheel=UE2.view==='carousel'?(event)=>{if(event.ctrlKey||event.shiftKey||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;const before=list.scrollLeft;list.scrollLeft+=event.deltaY;if(before!==list.scrollLeft)event.preventDefault()}:null;
 list.onkeydown=UE2.view==='carousel'?(event)=>{if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.closest('button'))return;event.preventDefault();ue2MoveSelection(event.key)}:null;
 document.querySelectorAll('.ue-carousel-nav').forEach(button=>button.hidden=UE2.view!=='carousel');

 document.getElementById('rom-list-header').textContent=`${games.length.toLocaleString('pt-BR')} ${games.length===1?'jogo':'jogos'}`;
 ue9UpdateSelectedCount();
 ue2RefreshCount();
 if(!state.selectedRom)ue2RenderDetail();
 document.getElementById('ue2-view-grid')?.classList.toggle('active',UE2.view==='grid');
 for(const mode of ['grid','list','carousel']){const button=document.getElementById('ue2-view-'+mode);button?.classList.toggle('active',UE2.view===mode);button?.setAttribute('aria-pressed',String(UE2.view===mode));if(button){button.hidden=allLanding;button.style.display=allLanding?'none':'';}}
 document.querySelectorAll('.ue-carousel-nav').forEach(button=>{button.hidden=allLanding||UE2.view!=='carousel';button.style.display=button.hidden?'none':'';});
 const playButton=document.getElementById('btn-play');if(playButton)playButton.style.display=allLanding?'none':'';
 const selectedCount=document.getElementById('ue9-selection-count');if(selectedCount)selectedCount.style.display=allLanding?'none':'';

 if(allLanding&&(games.length||ue2LibraryRoots().length)){
  UE2.selectedGames.clear();
  ue2RequestLibrarySize(games);
  list.appendChild(ue2LibrarySummary(games));
  renderPlayButton();
  return;
 }

 if(!games.length){
  const empty=el('div',{className:'ue2-empty'},ue2Icon('game',52));
  if(UE2.section==='favorites'){
   empty.append(el('h3',{},'Nenhum favorito ainda'),el('p',{},'Use a estrela em uma capa para adicioná-la aos favoritos.'));
  }else{
   empty.append(el('h3',{},UE2.query?'Nada encontrado':'Sua biblioteca está vazia'),el('p',{},UE2.query?'Tente buscar por outro nome.':'Clique em Buscar ROMs para adicionar sua coleção.'),ue2Btn('Buscar jogos','scan',globalScan,'ue2-play-primary'));
  }
  list.appendChild(empty);
 }else {
  for(const game of games.slice(0,UE2.maxCards)){
   const isSelected=state.selectedRom===game.path;
   const card=el('article',{className:'ue2-card'+(UE2.selectedGames.size>1&&UE2.selectedGames.has(game.path)?' ue9-multi-selected':'')+(isSelected?' selected':''),title:game.name,tabindex:'0',role:'option','aria-selected':String(isSelected),'data-game':ue2Key(game.path),onClick:e=>ue9SelectCard(e,game),onDblclick:()=>ue2Play(game),onContextmenu:e=>ue9OpenContext(e,game),onKeydown:e=>{if(e.key==='Enter'){e.preventDefault();ue2Play(game)}else if(e.key===' '){e.preventDefault();ue9SelectCard(e,game)}}});
   const art=ue2Art(game);art.dataset.art=ue2Key(game.path);
   const fav=el('button',{type:'button',className:'ue2-favorite'+(UE2.favorites.has(game.path)?' is-favorite':''),'data-key':ue2Key(game.path),'aria-label':'Alternar favorito',title:'Favoritar',onClick:e=>{e.stopPropagation();ue2Favorite(game)}},ue2Icon('star',18));
   art.appendChild(fav);card.appendChild(art);
   const info=el('div',{className:'ue2-card-footer'},el('div',{},el('h3',{},game.name),el('p',{},game.system.name)),ue2Icon('chev',16));
   card.appendChild(info);list.appendChild(card);
  }
   if(games.length>UE2.maxCards)list.appendChild(el('button',{className:'ue2-more',onClick:()=>{UE2.maxCards+=UE2.pageSize;renderRomList()}},'Aparecer mais jogos · '+(games.length-UE2.maxCards)+' restantes'));
 }
 ue2HydrateCachedCovers(games);
 ue2ObserveCoverCards(list);
 renderPlayButton();
};
selectSystem=function(system){
 UE2.selectedGames.clear();UE2.selectionAnchor=null;
 UE2.gamepadZone='sidebar';
 state.selectedSystem=system;state.roms=state.libraries[system.folder]||[];state.selectedRom=null;
  UE2.section='system';UE2.maxCards=UE2.pageSize;
 updateSidebarActive();renderSystemHeader();renderRomList();renderScanButton();renderPlayButton();ue2RenderDetail();
 setStatus('Sistema: '+system.name);
};


// ULTIMATE EMULATOR V9: Ctrl/Shift multi-select; Delete always uses Windows Recycle Bin.
function ue9UpdateSelectedCount(){
 const tag=document.getElementById('ue9-selection-count');
 if(tag)tag.textContent=UE2.selectedGames.size>1 ? `${UE2.selectedGames.size} selecionados · Del: Lixeira` : '';
}
function ue9SelectCard(event,game){
 UE2.gamepadZone='content';ue2ClearGamepadSidebarFocus();
 const paths=ue2VisibleGames().map(x=>x.path);
 if(event?.shiftKey && UE2.selectionAnchor && paths.includes(UE2.selectionAnchor)){
  const a=paths.indexOf(UE2.selectionAnchor),b=paths.indexOf(game.path);
  if(!event.ctrlKey&&!event.metaKey)UE2.selectedGames.clear();
  for(const p of paths.slice(Math.min(a,b),Math.max(a,b)+1))UE2.selectedGames.add(p);
 }else if(event?.ctrlKey||event?.metaKey){
  if(UE2.selectedGames.has(game.path))UE2.selectedGames.delete(game.path);
  else UE2.selectedGames.add(game.path);
  UE2.selectionAnchor=game.path;
 }else{
  UE2.selectedGames.clear();UE2.selectedGames.add(game.path);UE2.selectionAnchor=game.path;
 }
 ue2SelectGame(game);
 ue9UpdateSelectedCount();
}
function ue9OpenContext(event,game){
 if(!UE2.selectedGames.has(game.path)){
  UE2.selectedGames.clear();UE2.selectedGames.add(game.path);UE2.selectionAnchor=game.path;
  ue2SelectGame(game);
 }
 ue9UpdateSelectedCount();
 ue2OpenMenu(event,game);
}
async function ue9ShowInExplorer(game){
 try{await window.electronAPI.ue9ShowGameInFolder(game.path)}
 catch(error){setStatus('Explorador: '+(error.message||error),'error')}
}
async function ue9TrashSelected(){
 const selected=[...UE2.selectedGames];
 if(!selected.length&&state.selectedRom)selected.push(state.selectedRom);
 if(!selected.length)return;
 const fn=window.electronAPI?.ue9TrashGames;
 if(!fn){setStatus('Exclusão indisponível nesta versão.','error');return}
 try{
  const result=await fn(selected);
  if(result?.cancelled)return;
  const gone=new Set(result?.removed||[]);
  if(gone.size){
   for(const system of SYSTEMS){
    state.libraries[system.folder]=(state.libraries[system.folder]||[]).filter(item=>!gone.has(ue2GamePath(item)));
   }
   state.roms=(state.libraries[state.selectedSystem.folder]||[]);
   if(gone.has(state.selectedRom))state.selectedRom=null;
   for(const p of gone){UE2.selectedGames.delete(p);UE2.favorites.delete(p);UE2.meta.delete(p);UE2.pending.delete(p)}
   UE2.recent=UE2.recent.filter(p=>!gone.has(p));
   UE2.queued=UE2.queued.filter(x=>!gone.has((x.game||x).path));
   ue2SavePrefs();ue2RenderRecent();renderRomList();ue2RenderDetail();
  }
  if(result?.failed?.length){
   const first=result.failed[0];
   setStatus(`${gone.size} arquivo(s) na Lixeira; ${result.failed.length} falha(s): ${first.error}`,'error');
  }else setStatus(`${gone.size} arquivo(s) enviados à Lixeira.`, 'success');
 }catch(err){setStatus('Não foi possível mover os arquivos: '+(err?.message||err),'error')}
}
function ue9InstallKeyboard(){
 if(window.__ue9KeyboardAttached)return;
 window.__ue9KeyboardAttached=true;
 document.addEventListener('keydown',event=>{
  if(event.key!=='Delete'||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.target?.closest('input,textarea,select,[contenteditable="true"],.ue5-overlay,[role="dialog"]'))return;
  if(document.querySelector('#ue9-context-menu,#ue9-modal'))return;
  if(!UE2.selectedGames.size&&!state.selectedRom)return;
  event.preventDefault();event.stopPropagation();ue9TrashSelected();
 });
}
ue9InstallKeyboard();

const UE9_STYLES=`
.ue2-card.ue9-multi-selected{outline:2px solid #9e9e9e!important;background:rgba(110,63,163,.28)!important}
.ue9-selection-count{font-size:11px;color:#c6c6c6;white-space:nowrap;max-width:260px}
#ue2-context-menu{max-height:calc(100vh - 18px);overflow-y:auto}
.ue2-gamepad-focus{outline:2px solid var(--win-accent,#bcbcbc)!important;outline-offset:2px!important;box-shadow:0 0 0 3px #65d9ff22,0 0 18px #65d9ff18!important}
.ue10-state-overlay{position:fixed;inset:0;z-index:1000000;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.82);backdrop-filter:blur(4px)}
.ue10-state-panel{box-sizing:border-box;width:min(920px,96vw);max-height:90vh;overflow:hidden;padding:22px;border:1px solid #777;border-radius:18px;background:#1a1a1a;color:#f2f2f2;box-shadow:0 28px 90px #000e}
.ue10-state-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:17px}
.ue10-state-head strong{display:block;font-size:17px;letter-spacing:.08em}.ue10-state-head small{display:block;margin-top:6px;color:#aaa;font-size:12px}
.ue10-state-close{width:34px;height:34px;border:1px solid #666;border-radius:9px;background:#252525;color:#eee;font-size:24px;line-height:1;cursor:pointer}
.ue10-state-grid{display:flex;align-items:stretch;justify-content:center;flex-wrap:wrap;gap:12px;max-height:62vh;overflow:auto;padding:3px 3px 12px;scrollbar-width:auto;scrollbar-color:#777 #242424}
.ue10-state-card{box-sizing:border-box;flex:0 1 248px;width:min(248px,calc(50% - 12px));min-width:190px;padding:7px;border:1px solid #444;border-radius:11px;background:#222;color:#eee;text-align:left;cursor:pointer;transition:border-color .12s,background .12s,transform .12s}
.ue10-state-card:hover,.ue10-state-card.is-selected{border-color:#d5d5d5;background:#303030;transform:translateY(-1px)}
.ue10-state-card.is-selected{box-shadow:0 0 0 2px #aaa}
.ue10-state-thumb{width:100%;aspect-ratio:16/9;height:auto;display:grid;place-items:center;overflow:hidden;border-radius:7px;background:#111;color:#888;font-size:10px;letter-spacing:.06em;text-align:center}
.ue10-state-thumb img{width:100%;height:100%;object-fit:contain;display:block}.ue10-state-card strong{display:block;margin-top:9px;font-size:12px}.ue10-state-card small{display:block;margin-top:5px;color:#aaa;font-size:10px}
.ue10-state-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:9px;color:#aaa;font-size:12px}.ue10-state-cancel{border:1px solid #666;border-radius:9px;background:#2a2a2a;color:#eee;padding:9px 15px;cursor:pointer}
@media(max-width:720px){.ue10-state-card{flex-basis:210px;min-width:150px}.ue10-state-panel{padding:15px}}
`;
function ue2InstallCSS(){
 if(document.getElementById('ue2-styles'))return;
 const style=document.createElement('style');style.id='ue2-styles';
 style.textContent=UE2_STYLES+UE9_STYLES;document.head.appendChild(style);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  ueLoading(true, 'Carregando biblioteca...', 8);
  injectStyles();
  buildLayout();
  buildSidebar();
  renderSystemHeader();
  renderRomList();
  renderScanButton();
  renderPlayButton();
  ue6InstallButton();
  ue7InstallButtons();
  ue152InstallUI();
  ue153GreyTheme();
  ue2InstallCSS();
  ue2InstallNavigation();
  window.electronAPI?.ue10OnStateChooser?.(payload => ue10OpenStateChooser(payload));
  ue2LoadPrefs();

  try {
    state.paths = await api.getPaths();
    const saved = await window.electronAPI.ue6LoadLibrary();

    if(saved && saved.available) {
      state.paths.scanRoms = saved.root;
      state.libraries = saved.libraries;
      setStatus('Biblioteca restaurada do último Global Scan.','success');
    } else if(saved && saved.rememberedRoot) {
      // The last scan may be on an unplugged SSD. Keep that location visible
      // and do not rescan/save the bundled folder over the user's choice.
      state.paths.scanRoms = saved.rememberedRoot;
      state.libraries = Object.fromEntries(SYSTEMS.map(system => [system.folder, []]));
      setStatus('Conecte a unidade do último Global Scan e atualize a biblioteca.','info');
    } else if(state.paths.scanRoms) {
      const root = state.paths.scanRoms;
      state.libraries = await window.electronAPI.scanGlobalFolder({
        folder:root,systems:SYSTEMS
      });
      await window.electronAPI.ue6SaveLibrary({
        root,libraries:state.libraries
      });
      setStatus('Biblioteca localizada e salva.','success');
    }

    state.roms = state.libraries[state.selectedSystem.folder] || [];
    // The Windows design layer wraps these renderers after app.js loads.
    // Refresh every derived view after the asynchronous library restore so
    // the persisted Global Scan is visible immediately after a restart.
    buildSidebar();
    renderSystemHeader();
    renderRomList();
    ue2RenderRecent();
    ue2RenderDetail();
  } catch(error) {
    setStatus('Erro ao carregar biblioteca: '+error.message,'error');
  } finally {
    ueLoading(false);
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function ue6Friendly(name) {
  return String(name || '')
    .replace(/\.(zip|7z|iso|cue|chd|sfc|smc|gb|gbc|gba|nds)$/i,'')
    .replace(/_/g,' ')
    .replace(/\s*\((USA|Europe|Japan|World|Brazil|Rev[^)]*)\)/gi,'')
    .replace(/\s*\[(?:!|a\d*|b\d*|h\d*)\]/gi,'')
    .replace(/\s+(BG|PT-BR)$/i,'')
    .replace(/\s+/g,' ')
    .trim();
}

function ue6InstallButton() {
  const bar = document.getElementById('action-bar');
  if(!bar) return;
  const button = document.createElement('button');
  button.className = 'btn btn-scan';
  button.textContent = 'Controles e gráficos';
  button.onclick = ue6SettingsPanel;
  bar.appendChild(button);
}

async function ue6SettingsPanel() {
  document.getElementById('ue6-modal')?.remove();

  const bridge = window.electronAPI;
  const system = state.selectedSystem;
  const config = await bridge.ue6ReadOptions(system.folder);
  const retro = system.launcher === 'retroarch';
  const shaders = retro ? await bridge.ue6ListShaders() : [];

  const overlay = document.createElement('div');
  overlay.id = 'ue6-modal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000c;display:flex;align-items:center;justify-content:center;padding:12px';

  const panel = document.createElement('div');
  panel.style.cssText = 'width:min(740px,96vw);max-height:92vh;overflow:auto;background:#191919;color:white;border:1px solid #444;border-radius:12px;padding:20px';

  const title = document.createElement('h2');
  title.textContent = 'Controles e gráficos — '+system.name;
  title.style.marginBottom = '15px';
  panel.appendChild(title);

  const field = (label,control)=>{
    const row = document.createElement('label');
    row.style.cssText = 'display:flex;justify-content:space-between;gap:12px;align-items:center;margin:10px 0';
    const text = document.createElement('span');
    text.textContent = label;
    row.append(text,control);
    panel.appendChild(row);
    return control;
  };

  const select = (options,value)=>{
    const item = document.createElement('select');
    item.style.cssText = 'background:#292929;color:white;border:1px solid #555;border-radius:6px;padding:8px;max-width:65%';
    for(const [key,label] of options) {
      const option = document.createElement('option');
      option.value = String(key);
      option.textContent = label;
      item.appendChild(option);
    }
    item.value = String(value ?? '');
    return item;
  };

  if(!retro) {
    const notice = document.createElement('p');
    notice.textContent = 'Este console usa um emulador independente. As opções específicas dele ainda não estão integradas.';
    panel.appendChild(notice);
  } else {
    const aspect = field('Proporção da tela',select([
      ['16:9','16:9 — preencher'],
      ['4:3','4:3 — clássico'],
      ['original','Original']
    ],config.aspect || '16:9'));

    const shader = field('Shaders e filtros',select([
      ['','Sem shader'],...shaders.map(x=>[x.value,x.label])
    ],config.shader || ''));

    const latency = field('Buffer de áudio',select([
      ['128','128 ms'],
      ['192','192 ms'],
      ['256','256 ms']
    ],config.latency || 192));

    const driver = field('Controle',select([
      ['auto','Automático'],
      ['sdl2','SDL2 — DualSense / Xbox'],
      ['xinput','XInput — Xbox'],
      ['dinput','DirectInput']
    ],config.driver || 'auto'));

    const heading = document.createElement('h3');
    heading.textContent = 'Personalização por console';
    heading.style.margin = '15px 0';
    panel.appendChild(heading);

    const mapping = document.createElement('div');
    mapping.style.cssText = 'max-height:260px;overflow-y:auto;display:grid;gap:5px';

    const actions = [
      ['up','Cima'],['down','Baixo'],['left','Esquerda'],['right','Direita'],
      ['a','A'],['b','B'],['x','X'],['y','Y'],
      ['start','Start'],['select','Select'],
      ['l','L1'],['r','R1'],['l2','L2'],['r2','R2']
    ];

    const keyInputs = {}, padInputs = {};

    for(const [action,label] of actions) {
      const row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:90px 1fr 1fr;gap:8px;align-items:center';
      const name = document.createElement('span');
      name.textContent = label;

      const key = document.createElement('input');
      key.readOnly = true;
      key.placeholder = 'Pressione uma tecla';
      key.value = config.keys?.[action] || '';
      key.style.cssText = 'min-width:0;background:#292929;color:white;border:1px solid #555;border-radius:6px;padding:8px';

      key.onkeydown = event=>{
        event.preventDefault();
        const special = {
          ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',
          ArrowRight:'right',Enter:'enter',Space:'space',
          Backspace:'',Escape:'escape',Shift:'lshift',Tab:'tab'
        };
        key.value = special[event.key] !== undefined
          ? special[event.key] : event.key.toLowerCase();
      };

      const choices = [['','Automático']];
      for(let i=0;i<24;i++) choices.push([String(i),'Botão '+i]);
      const pad = select(choices,config.buttons?.[action] ?? '');
      pad.style.maxWidth = '100%';

      keyInputs[action] = key;
      padInputs[action] = pad;
      row.append(name,key,pad);
      mapping.appendChild(row);
    }
    panel.appendChild(mapping);

    const padChoices = Array.from({length:24},(_,i)=>[String(i),'Botão '+i]);
    const saveButton = field('L3 — salvar estado',select(
      padChoices,config.saveButton ?? 10
    ));
    const loadButton = field('R3 — carregar estado',select(
      padChoices,config.loadButton ?? 11
    ));

    const hint = document.createElement('p');
    hint.textContent = 'Teclado: 1 para salvar e 4 para carregar. A numeração dos botões L3/R3 pode variar conforme o driver.';
    hint.style.cssText = 'font-size:12px;color:#aaa;margin:12px 0';
    panel.appendChild(hint);

    const save = document.createElement('button');
    save.className = 'btn btn-play';
    save.textContent = 'Salvar preferências';
    save.onclick = async()=>{
      const keys={},buttons={};
      for(const [action] of actions) {
        if(keyInputs[action].value) keys[action] = keyInputs[action].value;
        if(padInputs[action].value !== '') buttons[action] = padInputs[action].value;
      }
      try {
        await bridge.ue6SaveOptions({
          folder:system.folder,
          aspect:aspect.value,
          shader:shader.value,
          latency:Number(latency.value),
          driver:driver.value,
          keys,buttons,
          saveButton:Number(saveButton.value),
          loadButton:Number(loadButton.value)
        });

        if(shader.value) {
          const result = await bridge.ue6ApplyShader(shader.value);
          if(result.ok) setStatus('Comando do shader enviado ao RetroArch.','success');
        }
        overlay.remove();
        setStatus('Preferências salvas. Aplicação completa no próximo jogo.','success');
      } catch(error) {
        setStatus('Erro: '+error.message,'error');
      }
    };

    panel.appendChild(save);
  }

  const close = document.createElement('button');
  close.className = 'btn btn-scan';
  close.style.marginLeft = '12px';
  close.textContent = 'Fechar';
  close.onclick = ()=>overlay.remove();
  panel.appendChild(close);

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}
// UE_PATCH_147_UI
const UE7_DPAD = [
  ['↑','up'],['↓','down'],['←','left'],['→','right']
];
const UE7_CENTER = [['Start','start'],['Select','select']];
const UE7_SNES = [['Y','y'],['X','x'],['B','b'],['A','a']];
const UE7_PS = [
  ['□ Quadrado','y'],['△ Triângulo','x'],
  ['✕ Cruz','b'],['○ Círculo','a']
];
const UE7_GENESIS = [
  ['A','y'],['B','b'],['C','a'],
  ['X','l'],['Y','x'],['Z','r']
];

function ue7Groups(id) {
  const group = (name,buttons)=>({name,buttons});
  const pad = group('Cruz direcional',UE7_DPAD);
  const center = group('Centro',UE7_CENTER);

  switch(id) {
    case 'atari2600':
    case 'atari8bit':
    case 'atari5200':
    case 'atari7800':
    case 'atarist':
      return [group('Alavanca',UE7_DPAD),
        group('Disparo',[['Botão de disparo','b']]),
        group('Console',[['Start / Option','start'],['Select','select']])];

    case 'nes':
    case 'mastersystem':
      return [pad,center,group('Botões principais',[
        ['B','b'],['A','a']
      ])];

    case 'snes':
      return [group('Ombros',[['L','l'],['R','r']]),
        pad,center,group('Botões em losango',UE7_SNES)];

    case 'gameboy':
    case 'gbc':
      return [pad,center,
        group('Botões A e B',[['B','b'],['A','a']])];

    case 'gba':
      return [group('Botões superiores',[['L','l'],['R','r']]),
        pad,center,group('Botões A e B',[['B','b'],['A','a']])];

    case 'nds':
      return [group('Ombros',[['L','l'],['R','r']]),
        pad,center,group('Botões em losango',UE7_SNES),
        group('Tela inferior',[
          ['Toque / stylus — configuração do núcleo',null]
        ])];

    case 'n64':
      return [
        group('Gatilhos',[['L','l'],['R','r'],['Z','l2']]),
        pad,
        group('Alavanca central',[
          ['Analógico principal — configurar no núcleo',null]
        ]),
        group('Centro',[['Start','start']]),
        group('Botões A / B',[['B','b'],['A','a']]),
        group('Botões C',[
          ['C ↑ / ↓ / ← / → — analógico direito',null]
        ])
      ];

    case 'megadrive':
    case 'segacd':
    case 'megadrive32x':
      return [pad,
        group('Start / Mode',[['Start','start'],['Mode','select']]),
        group('Controle de 6 botões',UE7_GENESIS)];

    case 'saturn':
      return [
        group('Superiores',[['L','l2'],['R','r2']]),
        pad,group('Start',[['Start','start']]),
        group('Seis botões',UE7_GENESIS)
      ];

    case 'dreamcast':
      return [
        group('Gatilhos',[['L','l2'],['R','r2']]),
        pad,center,
        group('Botões principais',UE7_SNES),
        group('Alavanca',[['Analógico principal',null]])
      ];

    case '3do':
      return [pad,
        group('Botões',[['A','b'],['B','a'],['C','y']]),
        group('Centro',[['P / Play','start']])];

    case 'psx':
    case 'ps2':
    case 'psp':
    case 'vita':
      return [
        group('Superiores',[
          ['L1','l'],['R1','r'],['L2','l2'],['R2','r2']
        ]),
        pad,
        group('Centro',UE7_CENTER),
        group('Símbolos PlayStation',UE7_PS),
        group('Analógicos',[
          ['Analógicos e cliques L3/R3 — controles do núcleo',null]
        ])
      ];

    case 'gamecube':
      return [
        group('Superiores',[
          ['L','l'],['R','r'],['Z','r2']
        ]),pad,group('Start',[['Start','start']]),
        group('Botões A / B / X / Y',UE7_SNES),
        group('Alavancas',[
          ['Stick principal e C-Stick',null]
        ])
      ];

    case 'arcade':
      return [
        group('Alavanca',UE7_DPAD),
        group('Botões do gabinete',[
          ['1','b'],['2','a'],['3','y'],
          ['4','x'],['5','l'],['6','r']
        ]),
        group('Sistema',[['Start','start'],['Coin','select']])
      ];

    default:
      return [pad,center,group('Botões',UE7_SNES)];
  }
}

function ue7InstallButtons() {
  const bar = document.getElementById('action-bar');
  if (!bar) return;

  for(const button of Array.from(bar.querySelectorAll('button'))) {
    if (/controles e (imagem|gráficos)/i.test(button.textContent))
      button.remove();
  }

  const config = document.createElement('button');
  config.className = 'btn btn-scan';
  config.textContent = 'Controles e gráficos';
  config.onclick = ()=>ue7Panel('controls');

  const restart = document.createElement('button');
  restart.className = 'btn btn-scan';
  restart.textContent = 'Reiniciar jogo';
  restart.title = 'Reinicia o jogo atualmente aberto no RetroArch';
  restart.onclick = async()=>{
    if(!confirm('Reiniciar o jogo? O progresso não salvo será perdido.'))
      return;
    const result = await window.electronAPI.ue7Command('RESET');
    setStatus(result.ok
      ? 'Comando de reinício enviado.'
      : result.error, result.ok ? 'success':'error');
  };

  bar.append(config,restart);

  if(window.electronAPI.ue7OnOpenPanel) {
    window.electronAPI.ue7OnOpenPanel(tab=>ue7Panel(tab));
  }
}

async function ue7Panel(tab='controls') {
  await ue6SettingsPanel();

  const modal = document.getElementById('ue6-modal');
  if(!modal) return;
  const panel = modal.firstElementChild;
  const s = state.selectedSystem;
  const groups = ue7Groups(s.id);

  const heading = Array.from(panel.querySelectorAll('h3'))
    .find(x=>/Personalização por console/.test(x.textContent));

  const mapping = heading?.nextElementSibling;
  const fields = Array.from(panel.children)
    .filter(x=>x.tagName === 'LABEL');

  const graphics = document.createElement('section');
  const controls = document.createElement('section');

  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex;gap:10px;margin:12px 0 20px';

  const tabControls = document.createElement('button');
  tabControls.textContent = 'Controle original';
  tabControls.className = 'btn btn-scan';

  const tabVideo = document.createElement('button');
  tabVideo.textContent = 'Gráficos e shaders';
  tabVideo.className = 'btn btn-scan';

  const setTab = name=>{
    controls.style.display = name === 'controls' ? 'block':'none';
    graphics.style.display = name === 'video' ? 'block':'none';
    tabControls.style.borderColor = name === 'controls' ? '#747474':'#444';
    tabVideo.style.borderColor = name === 'video' ? '#747474':'#444';
  };

  tabControls.onclick = ()=>setTab('controls');
  tabVideo.onclick = ()=>setTab('video');
  tabs.append(tabControls,tabVideo);

  if(mapping && s.launcher === 'retroarch') {
    const originalRows = Array.from(mapping.children);
    const actions = [
      'up','down','left','right','a','b','x','y',
      'start','select','l','r','l2','r2'
    ];
    const byAction = Object.fromEntries(
      actions.map((name,index)=>[name,originalRows[index]])
    );
    mapping.replaceChildren();
    mapping.style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:12px;max-height:360px;overflow:auto';

    const used = new Set();

    for(const group of groups) {
      const card = document.createElement('div');
      card.style.cssText =
        'background:#222;border:1px solid #3d3d3d;border-radius:10px;padding:12px;min-width:0';

      const title = document.createElement('h4');
      title.textContent = group.name;
      title.style.cssText =
        'font-size:13px;color:#b4b4b4;margin:0 0 12px';
      card.appendChild(title);

      for(const [label,action] of group.buttons) {
        const row = action ? byAction[action] : null;

        if(row && !used.has(action)) {
          used.add(action);
          row.firstElementChild.textContent = label;
          row.style.cssText =
            'display:grid;grid-template-columns:1fr;gap:5px;margin-bottom:10px';
          card.appendChild(row);
        } else if(!action) {
          const note = document.createElement('p');
          note.textContent = label;
          note.style.cssText =
            'font-size:11px;color:#999;line-height:1.5;margin:6px 0';
          card.appendChild(note);
        }
      }
      mapping.appendChild(card);
    }

    const additional = document.createElement('details');
    additional.style.cssText =
      'padding:10px;border:1px solid #383838;border-radius:8px';

    const summary = document.createElement('summary');
    summary.textContent = 'Outras funções RetroPad';
    additional.appendChild(summary);

    for(const action of actions) {
      if(!used.has(action)) {
        const row = byAction[action];
        if(row) {
          row.style.cssText =
            'display:grid;grid-template-columns:1fr;gap:5px;margin:8px 0';
          additional.appendChild(row);
        }
      }
    }
    mapping.appendChild(additional);

    if(heading) {
      heading.textContent = 'Anatomia original — '+s.name;
      controls.append(heading,mapping);
    }

    if(fields.length >= 4) {
      graphics.append(...fields.slice(0,3));
      controls.prepend(fields[3]);

      // L3/R3 continuam configuráveis.
      for(const f of fields.slice(4)) controls.append(f);
    }
  } else {
    const anatomy = document.createElement('div');
    anatomy.style.cssText = 'display:grid;gap:10px';

    for(const group of groups) {
      const box = document.createElement('div');
      box.style.cssText =
        'background:#242424;border-radius:8px;padding:12px';

      const title = document.createElement('strong');
      title.textContent = group.name;

      const names = document.createElement('p');
      names.textContent = group.buttons.map(x=>x[0]).join('  ·  ');
      names.style.cssText =
        'color:#aaa;margin-top:8px;font-size:12px';

      box.append(title,names);
      anatomy.appendChild(box);
    }

    controls.appendChild(anatomy);

    const hint = document.createElement('p');
    hint.textContent =
      'Este sistema utiliza emulador independente. O desenho dos botões é informativo; a edição dos mapeamentos ainda depende das opções do próprio emulador.';
    hint.style.cssText = 'font-size:12px;color:#aaa;margin-top:12px';
    controls.appendChild(hint);
  }

  panel.insertBefore(tabs,panel.children[1]);
  tabs.after(controls,graphics);
  setTab(tab === 'video' ? 'video':'controls');
}
// UE148_SIMPLE_LAYOUT
function ue8DefaultKeys() {
  return {
    up:'up',down:'down',left:'left',right:'right',
    a:'x',b:'z',x:'s',y:'a',
    l:'q',r:'w',l2:'e',r2:'r',
    start:'enter',select:'rshift'
  };
}

function ue8Shape(id) {
  const pair = (a,b) => [a,b];
  const face4 = [['X','x'],['Y','y'],['A','a'],['B','b']];
  const direction = [['↑','up'],['↓','down'],['←','left'],['→','right']];
  const result = {
    shoulders: [['L','l'],['R','r']],
    direction,
    face: face4,
    columns:2,
    center:[['Select','select'],['Start','start']],
    note:''
  };

  if(['atari2600','atari8bit','atari5200','atari7800','atarist'].includes(id)) {
    result.shoulders = [];
    result.face = [['Disparo','b']];
    result.columns = 1;
  } else if(['nes','mastersystem','gameboy','gbc'].includes(id)) {
    result.shoulders = [];
    result.face = [['B','b'],['A','a']];
  } else if(id === 'gba') {
    result.face = [['B','b'],['A','a']];
  } else if(['megadrive','segacd','megadrive32x','saturn'].includes(id)) {
    result.shoulders = id === 'saturn' ? [['L','l2'],['R','r2']] : [];
    result.face = [
      ['X','l'],['Y','x'],['Z','r'],
      ['A','y'],['B','b'],['C','a']
    ];
    result.columns = 3;
    if(id==='saturn'){
      result.face=[['X','y'],['Y','x'],['Z','l'],['A','b'],['B','a'],['C','r']];
      result.center=[['Start','start']];
    }else result.center=[['Mode','select'],['Start','start']];
  } else if(id === 'arcade') {
    result.shoulders = [];
    result.face = [
      ['1','b'],['2','a'],['3','y'],
      ['4','x'],['5','l'],['6','r']
    ];
    result.columns = 3;
    result.center = [['Coin','select'],['Start','start']];
    result.note = 'Arcade utiliza MAME independente.';
  } else if(['psx','ps2','psp','vita'].includes(id)) {
    result.shoulders = [['L1','l'],['R1','r'],['L2','l2'],['R2','r2']];
    result.face = [
      ['□','y'],['△','x'],
      ['✕','b'],['○','a']
    ];
  } else if(id === 'n64') {
    result.shoulders = [['L','l'],['R','r'],['Z','l2']];
    result.face = [['A','b'],['B','y']];
    result.center = [['Start','start']];
    result.note = 'Stick principal e botoes C: configuracao especifica do nucleo.';
  } else if(id === 'gamecube') {
    result.shoulders = [['L','l'],['R','r'],['Z','r2']];
    result.face = [['B','b'],['Y','y'],['X','x'],['A','a']];
    result.note = 'Stick principal e C-Stick seguem as configuracoes do emulador.';
  } else if(id === 'dreamcast') {
    result.shoulders = [['L','l2'],['R','r2']];
    // Flycast receives DC X/Y/A/B through RetroPad Y/X/B/A.
    result.face = [['X','y'],['Y','x'],['A','b'],['B','a']];
    result.center = [['Start','start']];
  } else if(id === '3do') {
    result.shoulders = [['L','l'],['R','r']];
    result.face = [['A','y'],['B','b'],['C','a']];
    result.center = [['X / Stop','select'],['P / Play','start']];
    result.columns = 3;
  }

  if(id==='mastersystem'){result.face=[['1','b'],['2','a']];result.center=[['Pause','start']];}
  if(id==='atari7800'){result.face=[['Botão 1','b'],['Botão 2','a']];}
  if(id==='atari5200'){result.note='Teclado numérico e opções do Atari 5200: disponíveis no menu do núcleo.';}
  if(['atari8bit','atarist'].includes(id)){result.note='Este computador também usa teclado e mouse. O desenho abaixo representa o joystick; as demais teclas ficam no menu do núcleo.';}
  if(id==='nds')result.note='Tela inferior: clique e arraste com o mouse para usar a caneta.';
  return result;
}

async function ue8OpenPanel(initialTab='keyboard') {
  document.getElementById('ue8-modal')?.remove();

  const api = window.electronAPI;
  const system = state.selectedSystem;
  const retro = system.launcher === 'retroarch';
  if(system.launcher==='ppsspp'){
    const result=await ueWithLoading('Abrindo configurações do PPSSPP...',()=>api.ue14OpenConfigurator('ppsspp'));
    if(!result?.ok)setStatus(result?.error||'Não foi possível abrir o PPSSPP.','error');
    return;
  }
  const saved = await api.ue6ReadOptions(system.folder);
  const shape = ue8Shape(system.id);

  const settings = {
    aspect:saved.aspect || '16:9',
    shader:saved.shader || '',
    latency:saved.latency || 192,
    driver:saved.driver || 'auto',
    keys:{...ue8DefaultKeys(),...(saved.keys || {})},
    buttons:{...(saved.buttons || {})},
    saveButton:saved.saveButton ?? 10,
    loadButton:saved.loadButton ?? 11
  };

  for (const [action,key] of Object.entries(settings.keys)) {
    if (['dead','meta','control','alt','unidentified'].includes(String(key).toLowerCase()))
      settings.keys[action] = ue8DefaultKeys()[action];
  }

  const presets = retro ? await api.ue6ListShaders() : [];
  let tab = initialTab === 'video' ? 'video' : 'keyboard';
  let selected = 'a';

  const overlay = document.createElement('div');
  overlay.id = 'ue8-modal';
  const style = document.createElement('style');
  style.textContent = `
    #ue8-modal{position:fixed;inset:0;z-index:99999;background:#000c;
      display:flex;align-items:center;justify-content:center;padding:16px}
    #ue8-modal *{box-sizing:border-box}
    .ue8-panel{background:#191919;border:1px solid #444;color:#eee;
      border-radius:14px;width:min(610px,96vw);max-height:90vh;
      overflow:auto;padding:20px}
    .ue8-row{display:flex;gap:8px;justify-content:center;align-items:center;
      flex-wrap:wrap;margin:8px 0}
    .ue8-chip{background:#292929;color:#eee;border:1px solid #494949;
      border-radius:9px;min-width:56px;min-height:49px;padding:7px;
      cursor:pointer;text-align:center}
    .ue8-chip strong{display:block;font-size:13px}
    .ue8-chip small{display:block;font-size:10px;color:#aaa;margin-top:3px}
    .ue8-chip.selected{border-color:#777777;background:#2b2b2b}
    .ue8-tab{background:#292929;color:#eee;border:1px solid #444;
      padding:9px 13px;border-radius:8px;cursor:pointer}
    .ue8-tab.active{background:#474747;border-color:#848484}
    .ue8-input{background:#282828;color:#eee;border:1px solid #555;
      border-radius:7px;padding:10px;min-width:0}
    .ue8-editor{background:#232323;border-radius:10px;
      padding:14px;margin-top:14px}
    .ue8-footer{display:flex;justify-content:flex-end;flex-wrap:wrap;
      gap:8px;margin-top:16px}
    .ue8-muted{font-size:12px;color:#999;line-height:1.5}
  `;
  overlay.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'ue8-panel';
  overlay.appendChild(panel);

  const title = document.createElement('h2');
  title.textContent = system.name + ' — Controles';
  title.style.margin = '0 0 14px';
  title.style.fontSize = '19px';
  panel.appendChild(title);

  const tabs = document.createElement('div');
  tabs.className = 'ue8-row';
  panel.appendChild(tabs);

  const content = document.createElement('div');
  panel.appendChild(content);

  const editor = document.createElement('div');
  editor.className = 'ue8-editor';
  panel.appendChild(editor);

  const notice = document.createElement('p');
  notice.className = 'ue8-muted';
  panel.appendChild(notice);

  const footer = document.createElement('div');
  footer.className = 'ue8-footer';
  panel.appendChild(footer);

  function makeButton(text,onClick) {
    const b=document.createElement('button');
    b.className='ue8-tab';
    b.textContent=text;
    if(onClick) b.onclick=onClick;
    return b;
  }
  function makeSelect(options,value,onChange) {
    const select=document.createElement('select');
    select.className='ue8-input';
    for(const [v,text] of options) {
      const item=document.createElement('option');
      item.value=String(v);
      item.textContent=text;
      select.appendChild(item);
    }
    select.value=String(value ?? '');
    select.onchange=()=>onChange(select.value);
    return select;
  }
  function field(label,input) {
    const line=document.createElement('div');
    line.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:14px;margin:12px 0';
    const name=document.createElement('span');
    name.textContent=label;
    line.append(name,input);
    return line;
  }
  function chip(label,action) {
    const b=document.createElement('button');
    b.className='ue8-chip'+(selected===action?' selected':'');
    b.disabled=!retro;
    const name=document.createElement('strong');
    name.textContent=label;
    const value=document.createElement('small');
    value.textContent=tab==='keyboard'
      ? (settings.keys[action] || 'Padrão')
      : (settings.buttons[action] === undefined ? 'Auto'
          : 'Botão '+settings.buttons[action]);
    b.append(name,value);
    b.onclick=()=>{
      selected=action;
      draw();
    };
    return b;
  }
  function row(items) {
    const div=document.createElement('div');
    div.className='ue8-row';
    for(const [label,action] of items) div.appendChild(chip(label,action));
    return div;
  }
  function drawEditor() {
    editor.replaceChildren();

    const names=[...shape.shoulders,...shape.direction,
      ...shape.face,...shape.center];
    const current=names.find(x=>x[1]===selected);
    const label=current ? current[0] : selected;

    const heading=document.createElement('strong');
    heading.textContent='Configurar: '+label;
    editor.appendChild(heading);

    if(tab==='keyboard') {
      const input=document.createElement('input');
      input.className='ue8-input';
      input.style.cssText='width:100%;margin-top:10px';
      input.placeholder='Clique aqui e pressione uma tecla';
      input.value=settings.keys[selected] || '';
      input.readOnly=true;
      input.onkeydown=e=>{
        e.preventDefault();
        const special={
          ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',
          Enter:'enter',Space:'space',Tab:'tab',
          ShiftLeft:'lshift',ShiftRight:'rshift'
        };
        const key=special[e.code] || special[e.key] ||
          (/^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() :
          /^Digit[0-9]$/.test(e.code) ? e.code.slice(5) : '');
        if(!key) return;
        if(['1','4','p','space'].includes(key)) {
          notice.textContent='Essa tecla está reservada para os atalhos globais.';
          return;
        }
        settings.keys[selected]=key;
        draw();
      };
      editor.appendChild(input);

      const hint=document.createElement('p');
      hint.className='ue8-muted';
      hint.textContent='Clique no campo e pressione a tecla desejada.';
      editor.appendChild(hint);
    } else {
      const options=[['','Automático']];
      for(let i=0;i<24;i++) options.push([String(i),'Botão '+i]);

      const selector=makeSelect(options,
        settings.buttons[selected] ?? '',value=>{
          if(value==='') delete settings.buttons[selected];
          else settings.buttons[selected]=Number(value);
          draw();
        });
      selector.style.cssText='width:100%;margin-top:10px';
      editor.appendChild(selector);

      const hint=document.createElement('p');
      hint.className='ue8-muted';
      hint.textContent='Automático usa o perfil DualSense/Xbox do RetroArch. Selecione um número apenas para substituir o botão.';
      editor.appendChild(hint);
    }
  }
  function drawGraphics() {
    editor.style.display='none';

    content.appendChild(field('Formato',makeSelect([
      ['16:9','16:9 — preencher'],['4:3','4:3'],['original','Original']
    ],settings.aspect,v=>settings.aspect=v)));

    content.appendChild(field('Shader',makeSelect([
      ['','Sem shader'],...presets.map(x=>[x.value,x.label])
    ],settings.shader,v=>settings.shader=v)));

    content.appendChild(field('Áudio',makeSelect([
      ['128','128 ms'],['192','192 ms'],['256','256 ms']
    ],settings.latency,v=>settings.latency=Number(v))));
  }
  function draw() {
    tabs.replaceChildren();
    content.replaceChildren();
    editor.style.display=tab==='video'?'none':'block';

    for(const [id,label] of [
      ['keyboard','Teclado'],['joystick','Joystick'],['video','Gráficos']
    ]) {
      const button=makeButton(label,()=>{
        tab=id;
        draw();
      });
      if(tab===id) button.classList.add('active');
      tabs.appendChild(button);
    }

    if(tab==='video') {
      drawGraphics();
    } else {
      const shoulders=row(shape.shoulders);
      content.appendChild(shoulders);

      const center=document.createElement('div');
      center.style.cssText='display:flex;align-items:center;justify-content:space-around;gap:8px;flex-wrap:wrap;margin:14px 0';

      const dpad=document.createElement('div');
      dpad.style.cssText='display:grid;grid-template-columns:repeat(3,48px);gap:3px';
      const cross=[
        null,['↑','up'],null,
        ['←','left'],['↓','down'],['→','right']
      ];
      for(const item of cross) {
        if(item) dpad.appendChild(chip(item[0],item[1]));
        else dpad.appendChild(document.createElement('span'));
      }

      const face=document.createElement('div');
      face.style.cssText=`display:grid;grid-template-columns:repeat(${shape.columns},58px);gap:5px`;
      for(const item of shape.face) face.appendChild(chip(item[0],item[1]));

      center.append(dpad,face);
      content.appendChild(center);
      content.appendChild(row(shape.center));

      if(retro) drawEditor();
      else {
        editor.style.display='none';
        const msg=document.createElement('p');
        msg.className='ue8-muted';
        msg.textContent='Este console usa emulador independente. A disposição é informativa; o remapeamento deve ser feito no próprio emulador.';
        content.appendChild(msg);
      }
    }

    notice.textContent=shape.note || '';
    footer.replaceChildren();
    if(!retro)footer.appendChild(makeButton('Configurar no emulador (Player 1/2)',async()=>{const r=await api.ue14OpenConfigurator(system.launcher);if(!r.ok)notice.textContent=r.error;}));

    if(retro) {
      const reset=makeButton('Restaurar automático',()=>{
        settings.keys={...ue8DefaultKeys()};
        settings.buttons={};
        settings.saveButton=10;
        settings.loadButton=11;
        draw();
      });
      footer.appendChild(reset);

      const save=makeButton('Salvar',async()=>{
        try {
          await api.ue6SaveOptions({
            folder:system.folder,
            aspect:settings.aspect,
            shader:settings.shader,
            latency:Number(settings.latency),
            driver:settings.driver,
            keys:settings.keys,
            buttons:settings.buttons,
            saveButton:settings.saveButton,
            loadButton:settings.loadButton
          });
          overlay.remove();
          setStatus('Controles salvos para '+system.name+'.','success');
        } catch(error) {
          notice.textContent='Erro ao salvar: '+error.message;
        }
      });
      save.style.background='#525252';
      footer.appendChild(save);
    }

    footer.appendChild(makeButton('Fechar',()=>overlay.remove()));
  }

  draw();
  document.body.appendChild(overlay);
}

// Atualiza o painel usado pelos botoes e menus existentes.
ue7Panel = ue8OpenPanel;
// UE149_UI
async function ue9Panel(initial='keyboard') {
  document.getElementById('ue9-modal')?.remove();
  const api=window.electronAPI;
  const system=state.selectedSystem;
  if(system.id === 'psx') {
    const r=await ueWithLoading('Abrindo configurações do DuckStation...',()=>api.ue1511DuckStation({mode:'config'}));
    if(!r.ok)setStatus(r.error,'error');
    return;
  }
  if(system.launcher !== 'retroarch'){
    const result=await ueWithLoading(`Abrindo configurações do ${getLauncherLabel(system)}...`,()=>api.ue14OpenConfigurator(system.launcher));
    if(!result?.ok)setStatus(result?.error||'Não foi possível abrir as configurações deste emulador.','error');
    else setStatus('Configure os jogadores nas opções de controles do próprio emulador.','info');
    return;
  }
  const cfg=await api.ue6ReadOptions(system.folder);
  const presets=await api.ue9Presets();
  const smaa='shaders_slang/anti-aliasing/smaa.slangp';
  let tab=['video','joystick'].includes(initial)?initial:'keyboard';
  let player=1,selected='a',controller='sdl2',player2Enabled=cfg.player2Enabled===true;
  let aspect=cfg.aspect||'16:9',shader=cfg.shader || (presets.some(x=>x.value===smaa)?smaa:'off');
  let device1=Number.isInteger(cfg.joypadIndex)?cfg.joypadIndex:0,device2=Number.isInteger(cfg.joypadIndexP2)?cfg.joypadIndexP2:1;
  const validKeys=obj=>Object.fromEntries(Object.entries(obj||{}).filter(([k,v])=>typeof v==='string'&&/^[a-z0-9_]{1,12}$/.test(v)&&!['dead','meta','control','alt','unidentified'].includes(v.toLowerCase())));
  const keyboardPresets=await api.ueKeyboardDefaults(system.folder);
  const keyboardDefaults=keyboardPresets.p1;
  const p1={keys:{...keyboardDefaults,...validKeys(cfg.keys)},buttons:{...cfg.buttons},axes:{...cfg.axes}};
  const p2={keys:{...keyboardPresets.p2,...validKeys(cfg.keysP2)},buttons:{...cfg.buttonsP2},axes:{...cfg.axesP2}};
  const map=()=>player===1?p1:p2;
  const layout=ue8Shape(system.id);
  if(system.id==='snes')layout.face=[['Y','y'],['X','x'],['A','a'],['B','b']];
  if(system.id==='gamecube') {layout.shoulders=[['L','l'],['Z','r2'],['R','r']];layout.face=[['Y','y'],['B','b'],['A','a'],['X','x']];layout.center=[['Start','start']];layout.columns=3;}
  const overlay=document.createElement('div');overlay.id='ue9-modal';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
  const style=document.createElement('style');style.textContent=`
    #ue9-modal{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;background:#000c;padding:16px}
    #ue9-modal *{box-sizing:border-box}
    .ue10-panel{width:min(660px,96vw);max-height:92vh;overflow:auto;border-radius:19px;padding:23px;background:#1a1a1a;color:#f1f1f1;border:1px solid #4a4a4a;box-shadow:0 25px 85px #000a}
    .ue10-head{font-size:20px;font-weight:750;margin:0 0 17px}
    .ue10-tabs,.ue10-row,.ue10-actions{display:flex;gap:9px;align-items:center;justify-content:center;flex-wrap:wrap;margin:10px 0}
    .ue10-btn{border:1px solid #505050;border-radius:10px;background:#272727;color:white;padding:10px 14px;cursor:pointer}
    .ue10-btn.active,.ue10-key.active{background:#3f3f3f;border-color:#8f8f8f}
    .ue10-key{background:#292929;border:1px solid #585858;border-radius:12px;color:white;width:64px;height:61px;cursor:pointer;transition:.12s}
    .ue10-key strong,.ue10-key small{display:block}.ue10-key small{font-size:10px;color:#bcbcbc;margin-top:4px;word-wrap:break-word}
    .ue10-key.armed{border-color:#9cf2c9;background:#2b5148;box-shadow:0 0 0 2px #56cca960}
    .ue10-body{padding:8px 0}.ue10-help{font-size:12px;color:#acacac;line-height:1.6;min-height:34px;margin:12px 0}
    .ue10-select{background:#2f2f2f;color:white;border:1px solid #5a5a5a;padding:9px;border-radius:9px;max-width:95%}
    .ue10-field{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:15px 0}
    .ue10-actions{justify-content:flex-end;margin-top:16px}
    .ue10-key:focus-visible,.ue10-btn:focus-visible{outline:2px solid #9a9a9a}
  `;overlay.appendChild(style);
  const panel=document.createElement('div');panel.className='ue10-panel';overlay.appendChild(panel);
  const title=document.createElement('h2');title.className='ue10-head';title.textContent=system.name+' — Configurações';panel.appendChild(title);
  const tabs=document.createElement('div');tabs.className='ue10-tabs';panel.appendChild(tabs);
  const section=document.createElement('div');section.className='ue10-body';panel.appendChild(section);
  const help=document.createElement('p');help.className='ue10-help';help.setAttribute('role','status');panel.appendChild(help);
  const shortcuts=document.createElement('p');shortcuts.className='ue10-help';shortcuts.textContent='Durante o jogo · Teclado: 7 = salvar estado · 9 = carregar estado · Controle: L3 = salvar · R3 = carregar. Requer suporte do núcleo a estados.';panel.appendChild(shortcuts);
  const footer=document.createElement('div');footer.className='ue10-actions';panel.appendChild(footer);
  let captureTimer=null,captureKeyHandler=null,captureBase=null,capturing=false;
  function btn(text,click,active=false) {const b=document.createElement('button');b.className='ue10-btn'+(active?' active':'');b.textContent=text;b.onclick=click;return b;}
  function stopCapture(){if(captureTimer)clearInterval(captureTimer);captureTimer=null;if(captureKeyHandler)window.removeEventListener('keydown',captureKeyHandler,true);captureKeyHandler=null;capturing=false;}
  function pad(){if(typeof navigator.getGamepads!=='function')return null;try{return [...(navigator.getGamepads()||[])].find(x=>x&&x.connected&&x.index===(player===1?device1:device2))||null;}catch{return null;}}
  function label(action){return [...layout.shoulders,...layout.face,...layout.center,["↑","up"],["↓","down"],["←","left"],["→","right"]].find(x=>x[1]===action)?.[0]||action.toUpperCase();}
  function show(text){help.textContent=text;}
  function currentValue(action){const c=map();return (tab==='keyboard'&&c.keys[action]==='nul')||(tab==='joystick'&&c.buttons[action]==='nul'&&c.axes[action]==='nul')?'Sem mapeamento':tab==='keyboard'?(c.keys[action]||'Auto'):(c.axes[action]!==undefined?'Eixo '+c.axes[action]:(c.buttons[action]!==undefined?'Botão '+c.buttons[action]:'Auto'));}
  function redraw(){stopCapture();tabs.replaceChildren();section.replaceChildren();footer.replaceChildren();
    for(const [name,text] of [['keyboard','Teclado'],['joystick','Joystick'],['video','Gráficos']])tabs.appendChild(btn(text,()=>{tab=name;redraw()},tab===name));
    if(tab==='video'){
      addField('Proporção', [['16:9','16:9'],['4:3','4:3'],['original','Original']],aspect,v=>aspect=v);
      addField('Filtro gráfico',[['off','Sem filtro'],...presets.map(x=>[x.value,x.label])],shader,v=>shader=v);
      const note=document.createElement('p');note.className='ue10-help';note.textContent='Áudio automático: SDL2/48 kHz, sincronização dinâmica e buffer estável por núcleo. SMAA será usado somente se estiver instalado.';section.appendChild(note);
    }else{
      const players=document.createElement('div');players.className='ue10-row';players.append(btn('Player 1',()=>{player=1;redraw()},player===1),btn('Player 2',()=>{player=2;redraw()},player===2));section.appendChild(players);
      if(tab==='joystick'){
        const connected=Array.from(navigator.getGamepads?.()||[]).filter(p=>p&&p.connected);
        addField('Controle do jogador',Array.from({length:8},(_,i)=>{const found=connected.find(p=>p.index===i);return [String(i),'Controle '+(i+1)+(found?' · '+found.id:' · aguardando identificação')]}),String(player===1?device1:device2),v=>{if(player===1)device1=Number(v);else device2=Number(v);redraw()});
        const info=document.createElement('p');info.className='ue10-help';const chosen=pad();info.textContent=chosen?'Detectado no Windows: '+chosen.id:'Nenhum controle detectado para este jogador. Conecte-o e pressione um botão para identificá-lo.';section.appendChild(info);
        if(device1===device2){const warning=document.createElement('p');warning.className='ue10-help';warning.textContent='Os dois jogadores estão usando o mesmo controle. Selecione controles diferentes para jogar em dupla.';section.appendChild(warning);}
      }
      if(system.id==='3do'&&player===2){
        const enable=document.createElement('label');enable.className='ue10-field';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=player2Enabled;checkbox.onchange=()=>{player2Enabled=checkbox.checked};enable.append('Ativar segundo controle no 3DO',checkbox);section.appendChild(enable);
      }
      section.appendChild(row(layout.shoulders));
      const middle=document.createElement('div');middle.style.cssText='display:flex;justify-content:space-evenly;gap:16px;flex-wrap:wrap;align-items:center;margin:16px 0';
      const dpad=document.createElement('div');dpad.style.cssText='display:grid;grid-template-columns:repeat(3,64px);gap:5px';
      const movement=system.id==='n64'&&tab==='keyboard'?{up:'l_y_minus',down:'l_y_plus',left:'l_x_minus',right:'l_x_plus'}:{up:'up',down:'down',left:'left',right:'right'};
      if(system.id==='n64'&&tab==='keyboard'){const note=document.createElement('div');note.textContent='Analógico · movimento';note.style.cssText='grid-column:1 / -1;text-align:center;font-size:12px;margin-bottom:7px';dpad.appendChild(note);}
      for(const t of [null,['↑','up'],null,['←','left'],null,['→','right'],null,['↓','down'],null])dpad.appendChild(t?tile(t[0],movement[t[1]]):document.createElement('span'));
      const face=document.createElement('div');face.style.cssText=`display:grid;grid-template-columns:repeat(${layout.columns||2},64px);gap:5px`;
      for(const t of layout.face){const b=tile(t[0],t[1]);if(layout.face.length===4){face.style.gridTemplateColumns='repeat(3,64px)';const positions={x:[2,1],y:[1,2],a:[3,2],b:[2,3]};const symbolAction=system.id==='dreamcast'?({'X':'y','Y':'x','A':'b','B':'a'})[t[0]]:({'X':'x','Y':'y','A':'a','B':'b','△':'x','□':'y','○':'a','✕':'b'})[t[0]];const pos=positions[symbolAction];if(pos){b.style.gridColumn=pos[0];b.style.gridRow=pos[1];}}face.appendChild(b);}middle.append(dpad,face);section.appendChild(middle);
      section.appendChild(row(layout.center));
      if(['n64','dreamcast','psx'].includes(system.id)){
        section.appendChild(row(system.id==='n64'&&tab==='keyboard'?[['D-pad ←','left'],['D-pad →','right'],['D-pad ↑','up'],['D-pad ↓','down']]:[['Stick ←','l_x_minus'],['Stick →','l_x_plus'],['Stick ↑','l_y_minus'],['Stick ↓','l_y_plus']]));
        if(system.id==='n64')section.appendChild(row([['C ←','r_x_minus'],['C →','r_x_plus'],['C ↑','r_y_minus'],['C ↓','r_y_plus']]));
      }
      const note=document.createElement('p');note.className='ue10-help';note.textContent=tab==='joystick'?
        'Automático usa o perfil do RetroArch. Para personalizar, clique DIRETAMENTE no botão acima e pressione o botão físico do controle.':
        'Clique diretamente em um botão do desenho e pressione a tecla. Mudar o teclado não altera o joystick.';
      section.appendChild(note);
      if(layout.note){const detail=document.createElement('p');detail.className='ue10-help';detail.textContent=layout.note;section.appendChild(detail);}
      // Automatic driver selection: no XInput/DInput selection required.
    }
    footer.appendChild(btn(tab==='video'?'Restaurar padrão dos gráficos':'Restaurar padrão deste jogador',()=>{
      stopCapture();if(tab==='video'){shader=presets.some(x=>x.value===smaa)?smaa:'off';aspect='16:9';}
      else{const m=map();m.keys={...(player===1?keyboardDefaults:keyboardPresets.p2)};m.buttons={};m.axes={};}redraw();show('Padrão restaurado para este jogador. Clique em Salvar para aplicar.');
    }));
    if(tab!=='video')footer.appendChild(btn('Turbo para a próxima partida…',()=>{stopCapture();ueRetroTurboDialog(system,player)}));
    footer.appendChild(btn('Salvar',save));
    footer.appendChild(btn('Fechar',()=>{stopCapture();overlay.remove()}));
    if(tab!=='video')show('Player '+player+' · '+(tab==='keyboard'?'Clique e pressione uma tecla.':'Clique e pressione um botão físico.') );
  }
  function addField(text,options,value,onChange){
    const line=document.createElement('label');line.className='ue10-field';line.append(text);
    const select=document.createElement('select');select.className='ue10-select';
    for(const [v,lab] of options){const opt=document.createElement('option');opt.value=v;opt.textContent=lab;select.appendChild(opt)}select.value=value;select.onchange=()=>onChange(select.value);line.append(select);section.appendChild(line);
  }
  function row(items){const r=document.createElement('div');r.className='ue10-row';for(const [text,action] of items)r.appendChild(tile(text,action));return r;}
  function tile(text,action){
    const b=document.createElement('button');b.className='ue10-key'+(selected===action?' active':'');
    const t=document.createElement('strong');t.textContent=text;const sub=document.createElement('small');sub.textContent=currentValue(action);b.append(t,sub);
    b.onclick=()=>arm(action,b);
    b.title='Clique para mapear · botão direito para remover';
    b.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();stopCapture();if(tab==='keyboard')map().keys[action]='nul';else{map().buttons[action]='nul';map().axes[action]='nul';}redraw();show(label(action)+' sem mapeamento para Player '+player+'. Clique em Salvar para aplicar.');};
    return b;
  }
  function arm(action,elem){
    stopCapture();selected=action;capturing=true;
    document.querySelectorAll('#ue9-modal .ue10-key').forEach(x=>x.classList.remove('armed'));
    elem.classList.add('armed');
    if(tab==='keyboard'){
      show('Pressione agora a tecla para '+label(action)+' · Esc cancela · Backspace volta ao automático.');
      captureKeyHandler=e=>{
        e.stopImmediatePropagation();e.preventDefault();
        if(e.key==='Escape'){redraw();return}
        if(e.key==='Backspace'){delete map().keys[action];redraw();show('Tecla redefinida.');return}
        const special={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Enter:'enter',Space:'space',Tab:'tab',ShiftLeft:'lshift',ShiftRight:'rshift',Home:'home',End:'end',Delete:'delete',PageUp:'pageup',PageDown:'pagedown',Comma:'comma',Slash:'slash'};
        const key=special[e.code]||(/^Key[A-Z]$/.test(e.code)?e.code.slice(3).toLowerCase():/^Digit\d$/.test(e.code)?e.code.slice(5):'');
        if(!key){show('Tecla não suportada. Pressione outra tecla.');return}
        if(['7','9','p','space','f11'].includes(key)){show('Tecla reservada para save/load ou pausa. Escolha outra.');return}
        for(const other of Object.keys(map().keys))if(other!==action&&map().keys[other]===key)map().keys[other]='nul';
        map().keys[action]=key;redraw();show(label(action)+' → '+key+' (salve para aplicar).');
      };
      window.addEventListener('keydown',captureKeyHandler,true);
      return;
    }
    show('Pressione '+label(action)+' no controle conectado · Esc cancela.');
    const first=pad();if(!first){stopCapture();show('Controle não está visível ao Windows/Electron. Mapeamento automático preservado; reconecte o controle e tente novamente.');return}
    const isPressed=b=>Boolean(b?.pressed||Number(b?.value||0)>.55);
    const pressedStart=new Set(first.buttons.map((b,i)=>isPressed(b)?i:-1).filter(i=>i>=0));
    let last=pressedStart;
    const origin=first.axes.slice(),until=Date.now()+12000;
    const onKeyboard=e=>{if(e.key==='Escape'){e.preventDefault();redraw()}};
    captureKeyHandler=onKeyboard;window.addEventListener('keydown',onKeyboard,true);
    captureTimer=setInterval(async()=>{
      if(Date.now()>until){redraw();show('Tempo de captura encerrado. Mapeamento anterior preservado.');return;}
      const p=pad();if(!p){redraw();show('Controle desconectado. Reconecte e clique novamente no botão para mapear.');return;}
      let choice=null;
      for(let i=0;i<p.buttons.length;i++)if(isPressed(p.buttons[i])&&!last.has(i)){choice={button:i};break}
      last=new Set(p.buttons.map((b,i)=>isPressed(b)?i:-1).filter(i=>i>=0));
      if(!choice){for(let i=0;i<p.axes.length;i++)if(Math.abs(p.axes[i]-(origin[i]||0))>0.66){choice={axis:i,sign:p.axes[i]>0?1:-1};break}}
      if(choice){
        stopCapture();try{
          const result=await api.ue10ResolveControl({id:p.id,driver:controller,standard:p.mapping==='standard',...choice});
          if(result.ok){const m=map();delete m.buttons[action];delete m.axes[action];
            if(result.kind==='axis')m.axes[action]=result.value;else m.buttons[action]=result.value;
            redraw();show(label(action)+' → '+result.value+' · '+result.profile+' (salve para aplicar).');
          }else{redraw();show(result.error||'Botão não identificado. Autodetecção preservada.');}
        }catch(e){redraw();show('Falha de captura: '+e.message)}
      }else if(Date.now()>until){redraw();show('Tempo de captura encerrado. Automático preservado.')}
    },50);
  }
  async function save(){
    stopCapture();try{
      await api.ue6SaveOptions({folder:system.folder,driver:controller,aspect,shader,
        joypadIndex:device1,joypadIndexP2:device2,player2Enabled,latency:cfg.latency||192,audioMode:'auto',keys:p1.keys,buttons:p1.buttons,axes:p1.axes,
        keysP2:p2.keys,buttonsP2:p2.buttons,axesP2:p2.axes,
        fastForwardButton:cfg.fastForwardButton??10,
        saveButton:cfg.saveButton??10,loadButton:cfg.loadButton??11,
        internalScale:cfg.internalScale||2});
      overlay.remove();setStatus('Configurações gravadas para '+system.name+'. Controles e filtro aplicados ao abrir o próximo jogo.','success');
    }catch(e){show('Erro ao salvar: '+e.message)}
  }
  redraw();document.body.appendChild(overlay);
  const life=new AbortController();
  for(const event of ['gamepadconnected','gamepaddisconnected'])window.addEventListener(event,()=>{if(overlay.isConnected)redraw()},{signal:life.signal});
  const cleanup=new MutationObserver(()=>{if(!overlay.isConnected){stopCapture();life.abort();cleanup.disconnect()}});
  cleanup.observe(document.body,{childList:true});
}

// Interface de configurações ativa.
ue7Panel = ue9Panel;
// UE150_STATE_PANEL
let ue10StateChooserBusy = false;

function ue10StateDate(value) {
  try {
    return new Date(value).toLocaleString('pt-BR', {
      day:'2-digit', month:'2-digit', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    });
  } catch (_) { return 'Data não disponível'; }
}

function ue10StateChooserClose() {
  const dialog = document.getElementById('ue10-state-dialog');
  dialog?.remove();
  try {
    const release = window.electronAPI?.ue10StateModalClosed?.();
    release?.catch?.(() => {});
  } catch (_) {}
  ue10StateChooserBusy = false;
  UE10_STATE_GAMEPAD.awaitNeutral = true;
  UE10_STATE_GAMEPAD.repeat = '';
  UE2.gamepadAwaitNeutral = true;
  UE2.gamepadPrevButtons = [];
  UE2.stateShortcutHeld = true;
}

function ue10OpenStateChooser(payload) {
  const states = Array.isArray(payload?.states) ? payload.states : [];
  if (!states.length || document.getElementById('ue10-state-dialog')) return;
  UE10_STATE_GAMEPAD.awaitNeutral = true;
  UE10_STATE_GAMEPAD.prev = [];
  let selected = 0;
  let finished = false;
  let cleanup = () => {};

  const overlay = document.createElement('div');
  overlay.id = 'ue10-state-dialog';
  overlay.className = 'ue10-state-overlay';
  overlay.tabIndex = -1;
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Escolher save state');

  const panel = document.createElement('section');
  panel.className = 'ue10-state-panel';
  const head = document.createElement('div');
  head.className = 'ue10-state-head';
  const heading = document.createElement('div');
  heading.innerHTML = '<strong>ESCOLHER SAVE STATE</strong><small>Até 15 saves por jogo · setas ou controle · Enter / X confirma</small>';
  const close = document.createElement('button');
  close.className = 'ue10-state-close';
  close.type = 'button';
  close.textContent = '×';
  close.title = 'Cancelar (Esc)';
  head.append(heading, close);
  const grid = document.createElement('div');
  grid.className = 'ue10-state-grid';
  const footer = document.createElement('div');
  footer.className = 'ue10-state-footer';
  const status = document.createElement('span');
  const cancel = document.createElement('button');
  cancel.className = 'ue10-state-cancel';
  cancel.type = 'button';
  cancel.textContent = 'Cancelar';
  footer.append(status, cancel);
  panel.append(head, grid, footer);
  overlay.appendChild(panel);

  const paint = () => {
    [...grid.children].forEach((card,index) => {
      card.classList.toggle('is-selected', index === selected);
      card.setAttribute('aria-selected', String(index === selected));
    });
    status.textContent = `${selected + 1} / ${states.length}`;
    grid.children[selected]?.scrollIntoView({block:'nearest',inline:'nearest'});
  };
  const move = delta => {
    if (finished) return;
    selected = (selected + delta + states.length) % states.length;
    paint();
  };
  const cancelLoad = async () => {
    if (finished) return;
    finished = true;
    try { await window.electronAPI.ue10StateAction({action:'CANCEL_LOAD_STATE'}); } catch (_) {}
    cleanup();
  };
  const choose = async () => {
    if (finished || ue10StateChooserBusy) return;
    finished = true;
    ue10StateChooserBusy = true;
    status.textContent = 'Carregando…';
    try {
      const result = await window.electronAPI.ue10StateAction({
        action:'LOAD_STATE_SLOT', id:states[selected].id
      });
      if (!result?.ok) {
        finished = false;
        ue10StateChooserBusy = false;
        status.textContent = result?.error || 'Não foi possível carregar este save.';
        return;
      }
      cleanup();
    } catch (error) {
      finished = false;
      ue10StateChooserBusy = false;
      status.textContent = error?.message || 'Falha ao carregar o save.';
    }
  };

  for (const record of states) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'ue10-state-card';
    card.setAttribute('role','option');
    const art = document.createElement('div');
    art.className = 'ue10-state-thumb';
    if (record.thumbnailUrl) {
      const image = document.createElement('img');
      image.src = record.thumbnailUrl;
      image.alt = 'Miniatura do save';
      image.loading = 'lazy';
      image.onerror = () => { image.remove(); art.classList.add('is-empty'); art.textContent = 'SEM MINIATURA'; };
      art.appendChild(image);
    } else {
      art.classList.add('is-empty');
      art.textContent = record.legacy ? 'SAVE ANTIGO' : 'SEM MINIATURA';
    }
    const label = document.createElement('strong');
    label.textContent = Number.isInteger(record.slot) ? `Save ${record.slot + 1}` : 'Save antigo';
    const date = document.createElement('small');
    date.textContent = ue10StateDate(record.createdAt);
    card.append(art,label,date);
    // Um clique na miniatura já é o comando de carregar; teclado/controle
    // continuam podendo selecionar com setas e confirmar com Enter/X.
    card.onclick = () => {
      selected = states.indexOf(record);
      paint();
      choose();
    };
    card.ondblclick = choose;
    grid.appendChild(card);
  }
  const onKey = event => {
    if (event.key === 'Escape') { event.preventDefault(); cancelLoad(); return; }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); move(-1); return; }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); move(1); return; }
    if (event.key === 'Enter' || event.key.toLowerCase() === 'x') { event.preventDefault(); choose(); }
  };
  close.onclick = cancelLoad;
  cancel.onclick = cancelLoad;
  overlay.addEventListener('pointerdown', event => {
    if (event.target === overlay) cancelLoad();
  });
  document.addEventListener('keydown', onKey, true);
  cleanup = () => {
    document.removeEventListener('keydown', onKey, true);
    ue10StateChooserClose();
  };
  document.body.appendChild(overlay);
  paint();
  requestAnimationFrame(() => overlay.focus());
}

function ue10HandleStateResult(result, message) {
  // O seletor é uma janela transparente própria, exibida pelo processo principal
  // diretamente sobre o jogo pausado.
  if (result?.choose) return;
  message(result?.ok
    ? 'Comando enviado ao RetroArch. Confira o OSD do jogo.'
    : (result?.error || 'Não foi possível executar o comando.'));
}

function ue10RenderStateControls(ctx) {
  const {tab,content,message,api,driver,capture} = ctx;

  if (tab !== 'keyboard' && tab !== 'joystick') return;

  const section = document.createElement('div');
  section.style.cssText =
    'background:#232323;border:1px solid #444;border-radius:10px;' +
    'padding:13px;margin:15px 0';

  const title = document.createElement('strong');
  title.textContent = 'Save State / Load State';
  section.appendChild(title);

  const row = document.createElement('div');
  row.style.cssText =
    'display:grid;grid-template-columns:1fr 1fr;' +
    'gap:10px;margin-top:12px';

  function box(name,value,action) {
    const button = document.createElement('button');
    button.style.cssText =
      'background:#303030;border:1px solid #555;' +
      'border-radius:8px;color:white;padding:12px;' +
      'cursor:pointer;min-height:70px';

    const heading = document.createElement('strong');
    heading.textContent = name;
    heading.style.display = 'block';

    const subtitle = document.createElement('small');
    subtitle.textContent = value;
    subtitle.style.cssText =
      'color:#b2b2b2;display:block;margin-top:6px';

    button.append(heading,subtitle);

    button.onclick = async () => {
      const result = await api.ue10StateAction(action);
      ue10HandleStateResult(result, message);
    };

    return button;
  }

  if (tab === 'keyboard') {
    row.append(
      box('Salvar estado','Tecla 7','SAVE_STATE'),
      box('Carregar estado','Tecla 9','LOAD_STATE')
    );
  } else {
    const save = box(
      'Salvar estado','L3 — aguardando perfil','SAVE_STATE'
    );
    const load = box(
      'Carregar estado','R3 — aguardando perfil','LOAD_STATE'
    );

    row.append(load,save);

    const details = document.createElement('p');
    details.style.cssText =
      'color:#aaa;font-size:12px;margin:10px 0';

    section.appendChild(row);
    section.appendChild(details);

    const refresh = async () => {
      try {
        const status = await api.ue10StateStatus();
        if (!section.isConnected) return;

        save.querySelector('small').textContent =
          status.joystickReady
            ? 'L3 — botão físico ' + status.l3
            : 'L3 — ainda não configurado';

        load.querySelector('small').textContent =
          status.joystickReady
            ? 'R3 — botão físico ' + status.r3
            : 'R3 — ainda não configurado';

        details.textContent = status.joystickReady
          ? 'Perfil identificado: ' + status.profile
          : 'Detecte L3/R3 para habilitar os atalhos no próximo jogo.';
      } catch(e) {
        details.textContent = e.message;
      }
    };

    const detect = document.createElement('button');
    detect.textContent = 'Detectar L3 / R3';
    detect.style.cssText =
      'background:#343434;color:white;border:1px solid #636363;' +
      'border-radius:8px;padding:10px;margin-top:10px;cursor:pointer';

    detect.onclick = () => {
      message('Pressione L3 ou R3 do joystick.');

      capture(async (pad) => {
        try {
          const result = await api.ue9SyncDevice({
            id:pad.id,
            driver:driver === 'auto' ? 'xinput' : driver
          });

          if (result.ok) {
            message(
              'Perfil detectado. L3=' + result.l3 +
              ' | R3=' + result.r3 +
              '. Reinicie o jogo para ativar.'
            );
            refresh();
          } else {
            message(result.error);
          }
        } catch(e) {
          message('Falha na deteccao: ' + e.message);
        }
      });
    };

    section.appendChild(detect);
    content.appendChild(section);
    refresh();
    return;
  }

  section.appendChild(row);

  const tip = document.createElement('p');
  tip.style.cssText =
    'font-size:12px;color:#999;margin-top:10px;line-height:1.5';
  tip.textContent =
    'Os dois botões também permitem testar os comandos ' +
    'com um jogo RetroArch aberto.';

  section.appendChild(tip);
  content.appendChild(section);
}
function ue11Friendly(name) { return ue6Friendly(name); }

// UE152_DYNAMIC_UI
function ue152InstallUI() {
  if (document.getElementById('ue152-language')) return;

  const style=document.createElement('style');
  style.textContent=`
    /* Lista de jogos: marrom suave no modo escuro */
    #rom-list {
      background:#29211d !important;
    }
    .rom-item:hover {
      background:#43332b !important;
    }
    .rom-item.selected {
      background:#49332a !important;
    }

    /* Janelas pequenas e monitores antigos */
    #main,#rom-area,#rom-list {min-width:0}
    #action-bar {flex-wrap:wrap !important;gap:7px !important}
    #body {min-height:0}
    #system-title {font-size:clamp(16px,2.5vw,30px)}
    .ue9-panel {
      max-width:calc(100vw - 16px) !important;
      max-height:calc(100vh - 16px) !important;
      overflow:auto !important;
    }
    @media(max-width:800px) {
      #sidebar {width:145px !important;min-width:145px !important}
      #action-bar {padding:8px !important}
      #action-bar button {font-size:11px !important;padding:8px !important}
      #system-header {padding:12px !important}
      #rom-list {padding:5px !important}
      .ue9-panel {padding:12px !important}
      .ue9-key {width:47px !important;height:45px !important}
    }
    @media(max-width:660px) {
      #sidebar {width:116px !important;min-width:116px !important}
      .ue9-panel {font-size:12px !important}
      .ue9-key {width:40px !important;height:40px !important}
    }

    /* Acompanha automaticamente o tema do Windows */
    @media(prefers-color-scheme:light) {
      html,body,#app,#body,#main {
        background:#f6f3ef !important;
        color:#28231e !important;
      }
      #sidebar,#system-header,#action-bar,#status-bar {
        background:#eee5dd !important;
        color:#332a24 !important;
        border-color:#d9cbbd !important;
      }
      #rom-list {background:#ebd8c5 !important}
      .rom-item {color:#302720 !important}
      .rom-item:hover {background:#d9bda4 !important}
      .rom-item.selected {
        background:#c9a88d !important;
        color:#241912 !important;
      }
      .ue9-panel {
        background:#f4eee8 !important;
        color:#2b231d !important;
      }
      .ue9-editor,.ue9-key,.ue9-btn,.ue9-select {
        background:#e7ded5 !important;
        color:#2e2823 !important;
        border-color:#b7a697 !important;
      }
      .ue9-help {color:#5b5048 !important}
    }
    #ue152-language {
      margin-left:auto;
      padding:3px 9px;
      border:1px solid #777;
      background:#292929;
      color:white;
      border-radius:7px;
      cursor:pointer;
      -webkit-app-region:no-drag;
      font-size:12px;
    }
  `;
  document.head.appendChild(style);

  const selector=document.createElement('button');
  selector.id='ue152-language';

  const bar=document.querySelector('.ue2-top-actions')||document.getElementById('titlebar');
  if(bar) {
    bar.style.display='flex';
    bar.style.alignItems='center';
    bar.appendChild(selector);
    const about=bar.querySelector('#ue-about-button');
    if(about)bar.appendChild(about);
  }

  let manual=false;
  let lang = (() => {
    try {
      const savedLanguage = localStorage.getItem('ue152-language-preference');
      if (savedLanguage === 'pt' || savedLanguage === 'en') return savedLanguage;
    } catch (_) {}
    return /^pt(?:-|$)/i.test(navigator.language || '') ? 'pt':'en';
  })();
  let translating=false;

  /* UE_LANG_PERSIST_I18N_V22: guarda o idioma escolhido e traduz os rotulos dinamicos que faltavam. */
function ueTranslateSupplementalLabels(currentLang) {
  if (!document.body) return;
  const rows = [
    ['Sobre','About'], ['Desenvolvedor','Developer'],
    ['Empresa','Company'], ['Ano','Year'], ['Não identificado','Not identified'], ['Não identificada','Not identified'], ['Região','Region'], ['Identificando…','Detecting…'], ['Capas horizontais','Horizontal covers'], ['Capas anteriores','Previous covers'], ['Próximas capas','Next covers'],
    ['Explore a sua coleção de jogos em um só lugar','Explore your game collection in one place'],
    ['Sua coleção, em um só lugar','Your collection, all in one place'],
    ['Proporção da tela','Screen aspect ratio'],
    ['Proporção','Aspect ratio'],
    ['Filtro gráfico','Graphics filter'],
    ['Áudio automático: SDL2/48 kHz, sincronização dinâmica e buffer estável por núcleo. SMAA será usado somente se estiver instalado.','Automatic audio: SDL2/48 kHz, dynamic synchronization and a stable per-core buffer. SMAA is used only if installed.'],
    ['Teclado','Keyboard'], ['Joystick','Controller'], ['Gráficos','Graphics'],
    ['Redefinir para automático','Reset to automatic'],
    ['Redefinir padrão deste jogador','Reset this player to defaults'],
    ['Salvar e aplicar','Save and apply'], ['Salvar','Save'], ['Fechar','Close'], ['Cancelar','Cancel'],
    ['Configurações','Settings'], ['Controles','Controls'],
    ['Biblioteca','Library'], ['Todos os jogos','All games'], ['Recentes','Recent'], ['Favoritos','Favorites'],
    ['Plataformas','Platforms'], ['Buscar jogos, plataformas...','Search games, platforms...'],
    ['Buscar ROMs','Scan ROMs'], ['Atualizar lista','Refresh list'], ['Jogo selecionado','Selected game'],
    ['Jogar agora','Play now'], ['Favoritar','Add to favorites'], ['Trocar capa','Change cover'],
    ['Proporção, shaders e filtros','Aspect ratio, shaders and filters'],
    ['Antisserrilhamento SMAA','SMAA anti-aliasing'], ['Padrão','Default'], ['Automático','Automatic'],
    ['Não identificada','Unknown'], ['Nunca','Never'], ['Última vez','Last played'],
    ['Executado','Launches'], ['Saves','Save states'], ['Instalados','Installed'],
    ['Todos','All'], ['Idioma','Language'], ['Inglês','English'], ['Português','Portuguese'],
    ['Selecionar pasta','Select folder'], ['Abrir','Open'], ['Configurar','Configure'],
    ['Direcional','D-pad'], ['Cima','Up'], ['Baixo','Down'], ['Esquerda','Left'], ['Direita','Right'],
    ['Ficha','Coin'], ['Redefinir','Reset'], ['Restaurar padrão','Restore defaults'],
    ['16:9 — preencher','16:9 — Fill'], ['4:3 — clássico','4:3 — Classic'],
    ['Player 1 · Clique e pressione uma tecla.','Player 1 · Click and press a key.'],
    ['Player 1 · Clique e pressione o botão físico.','Player 1 · Click and press the physical button.'],
    ['Durante o jogo · Teclado: 7 = salvar estado · 9 = carregar estado · Controle: L3 = salvar · R3 = carregar. Requer suporte do núcleo a estados.','In game · Keyboard: 1 = save state · 4 = load state · Controller: L3 = save · R3 = load. Core must support save states.']
  ];
  const toTarget = (value) => {
    const trimmed = String(value == null ? '' : value).trim();
    for (const pair of rows) {
      if (currentLang === 'pt' && trimmed === pair[1]) return pair[0];
      if (currentLang !== 'pt' && trimmed === pair[0]) return pair[1];
    }
    const heading = trimmed.match(/^(.*?)(\s+[—–-]\s+)(Configurações|Controles|Settings|Controls)$/i);
    if (heading) {
      const tail = heading[3].toLowerCase();
      const portuguese = tail === 'configurações' || tail === 'controles';
      const label = currentLang === 'pt' ? (portuguese ? heading[3] : (tail === 'settings' ? 'Configurações' : 'Controles')) : (portuguese ? (tail === 'configurações' ? 'Settings' : 'Controls') : heading[3]);
      return heading[1] + heading[2] + label;
    }
    const count = trimmed.match(/^(\d+)\s+(JOGOS|GAMES)$/i);
    if (count) return count[1] + (currentLang === 'pt' ? (count[1] === '1' ? ' JOGO' : ' JOGOS') : (count[1] === '1' ? ' GAME' : ' GAMES'));
    return null;
  };
  try {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || parent.closest('script,style,textarea,input,[data-ue-no-translate]')) continue;
      const raw = node.nodeValue || '';
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const translated = toTarget(trimmed);
      if (translated && translated !== trimmed) node.nodeValue = raw.replace(trimmed, translated);
    }
    for (const element of document.querySelectorAll('[placeholder],[title],[aria-label]')) {
      for (const attribute of ['placeholder','title','aria-label']) {
        if (!element.hasAttribute(attribute)) continue;
        const oldValue = element.getAttribute(attribute);
        const translated = toTarget(oldValue);
        if (translated && translated !== oldValue) element.setAttribute(attribute, translated);
      }
    }
    document.documentElement.lang = currentLang === 'pt' ? 'pt-BR' : 'en-US';
  } catch (_) {}
}

function translate() {
    if(translating) return;
    translating=true;

    const pt=lang==='pt';
    const word=(a,b)=>pt?a:b;

    const text=pt?'🇧🇷 PT-BR':'🇺🇸 EN-US'; if(selector.textContent!==text)selector.textContent=text;

    const map=[
      ['Global Scan','Buscar jogos','Scan games'],
      ['Controles e gráficos','Controles e gráficos','Controls and graphics'],
      ['Reiniciar jogo','Reiniciar jogo','Restart game'],
      ['Controle','Controle','Controller'],
      ['Gráficos','Gráficos','Graphics'],
      ['Teclado','Teclado','Keyboard'],
      ['Joystick','Joystick','Controller'],
      ['Restaurar automático','Restaurar automático','Reset to automatic'],
      ['Salvar','Salvar','Save'],
      ['Fechar','Fechar','Close']
    ];

    const targets=[
      ...document.querySelectorAll('#action-bar button'),
      ...document.querySelectorAll('.ue9-tabs button'),
      ...document.querySelectorAll('.ue9-row button')
    ];

    for(const element of targets) {
      const source=element.textContent.trim();
      const pair=map.find(x=>x[0]===source ||
        x[1]===source || x[2]===source);
      if(!pair) continue;

      const translated=pt?pair[1]:pair[2];
      if(source!==translated) element.textContent=translated;
    }

    translating=false;
  
  ueTranslateSupplementalLabels(lang);
}

  function setLanguage(next,byUser) {
  lang = next === 'pt' ? 'pt' : 'en';
  try { localStorage.setItem('ue152-language-preference', lang); } catch (_) {}
  try { document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en-US'; } catch (_) {}
  try { if (window.electronAPI && typeof window.electronAPI.ue152Language === 'function') void window.electronAPI.ue152Language(lang); } catch (_) {}
    lang=next;
    if(byUser) manual=true;
    translate();
    window.electronAPI.ue152Language(lang).catch(()=>{});
  }

  selector.onclick=()=>setLanguage(lang==='pt'?'en':'pt',true);

  window.addEventListener('languagechange',()=>{
    if (!manual) setLanguage(lang, false);
  });

  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape') return;
    const modal=[
      '#ue9-modal','#ue11-dialog','#ue8-modal','#ue6-modal'
    ].map(id=>document.querySelector(id)).find(Boolean);
    if(!modal) return;

    event.preventDefault();
    event.stopPropagation();

    const close=[...modal.querySelectorAll('button')]
      .find(b=>/^(Fechar|Close|Cancelar|Cancel)$/i.test(
        b.textContent.trim()));

    if(close) close.click();
    else modal.remove();
  },true);

  const observer=new MutationObserver(()=>translate());
  observer.observe(document.getElementById('app')||document.body,{
    childList:true,subtree:true
  });

  setLanguage(lang,false);
}
// UE153_GREY_THEME
function ue153GreyTheme() {
  if(document.getElementById('ue153-style')) return;

  const style=document.createElement('style');
  style.id='ue153-style';
  style.textContent=`
    #rom-list {
      background:#26282c !important;
    }

    .rom-item:hover {
      background:#383838 !important;
    }

    .rom-item.selected {
      background:#494949 !important;
    }

    @media(prefers-color-scheme:light) {
      #rom-list {
        background:#e4e6e9 !important;
      }

      .rom-item:hover {
        background:#cfd3d8 !important;
      }

      .rom-item.selected {
        background:#c2c2c2 !important;
      }
    }
  `;

  document.head.appendChild(style);
}

// UE1511_PS1_DIALOG
function ue1511PS1Dialog(romPath,mode='select') {
  if(document.getElementById('ue1511-ps1-overlay'))return;

  const overlay=document.createElement('div');
  overlay.id='ue1511-ps1-overlay';
  overlay.style.cssText=
    'position:fixed;inset:0;z-index:999999;background:#000b;' +
    'display:flex;justify-content:center;align-items:center;padding:14px';

  const panel=document.createElement('section');
  panel.style.cssText=
    'width:min(430px,96vw);background:#22252a;color:#fff;' +
    'padding:23px;border-radius:14px;border:1px solid #575757;' +
    'display:grid;gap:12px;box-shadow:0 20px 50px #0009';

  const title=document.createElement('h2');
  title.style.cssText='font-size:20px;margin:0';
  title.textContent=mode==='cheats'
    ? 'Cheats — PlayStation 1'
    : 'PlayStation 1 — DuckStation';

  const game=document.createElement('p');
  game.style.cssText='color:#ddd;font-size:13px;overflow-wrap:anywhere';
  game.textContent=romPath.replace(/\\/g,'/').split('/').pop();

  const info=document.createElement('p');
  info.style.cssText='color:#bfbfbf;font-size:12px;line-height:1.6';

  info.textContent=mode==='cheats'
    ? 'Os cheats nativos ficam em Propriedades do Jogo → Cheats ' +
      'dentro do DuckStation. Eles são identificados pelo jogo e região.'
    : 'Escolha jogar agora ou abrir o configurador do DuckStation.';

  const status=document.createElement('p');
  status.style.cssText='font-size:12px;color:#b9b9b9';

  function button(text,action) {
    const b=document.createElement('button');
    b.textContent=text;
    b.style.cssText=
      'cursor:pointer;padding:12px;background:#3a3a3a;color:#fff;' +
      'border:1px solid #5b5b5b;border-radius:8px;text-align:left';
    b.onclick=action;
    return b;
  }

  async function open(modeToLaunch) {
    status.textContent='Abrindo DuckStation...';

    try {
      const result=await ueWithLoading('Abrindo DuckStation...',()=>window.electronAPI.ue1511DuckStation({
        mode:modeToLaunch,
        romPath
      }));

      if(!result || result.ok===false) {
        status.textContent=result?.error || 'Falha ao iniciar.';
        return;
      }

      if(modeToLaunch==='play')ue2Played(romPath);
      overlay.remove();
    } catch(error) {
      status.textContent=String(error);
    }
  }

  panel.append(
    title,
    game,
    info,
    button('Jogar',()=>open('play')),
    button(
      mode==='cheats'
        ? 'Abrir DuckStation para configurar cheats'
        : 'Configurar jogo / Abrir DuckStation',
      ()=>open('config')
    ),
    button('Cancelar',()=>overlay.remove()),
    status
  );

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  overlay.addEventListener('click',e=>{
    if(e.target===overlay)overlay.remove();
  });

  const escape=e=>{
    if(e.key==='Escape') {
      e.preventDefault();
      overlay.remove();
      document.removeEventListener('keydown',escape,true);
    }
  };

  document.addEventListener('keydown',escape,true);
}// ULTIMATE EMULATOR V5: MAME P1/P2 mapping, saved directly in the MAME controller profiles.
async function ueV5MamePanel(initial='keyboard') {
  document.querySelector('#ue-v5-mame')?.remove();
  const api=window.electronAPI;
  const veil=document.createElement('div');veil.id='ue-v5-mame';
  veil.style.cssText='position:fixed;z-index:100200;inset:0;display:grid;place-items:center;background:rgba(6,5,14,.83);padding:12px;';
  const style=document.createElement('style');style.textContent=`
   #ue-v5-mame *{box-sizing:border-box}
   #ue-v5-mame .v5-panel{background:#151515;color:#f2f2f2;border:1px solid #383838;box-shadow:0 25px 95px #0009;border-radius:18px;max-width:750px;width:96vw;max-height:calc(100vh - 36px);overflow:auto;padding:18px}
   #ue-v5-mame h2{font-size:23px;font-weight:700;margin:0 0 5px}
   #ue-v5-mame p{font-size:12px;color:#a2a2a2;margin:5px 0 14px;line-height:1.5}
   #ue-v5-mame .v5-line{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0}
   #ue-v5-mame button,#ue-v5-mame select,#ue-v5-mame input{font:inherit;color:#ededed;background:#252525;border:1px solid #494949;border-radius:10px;padding:10px 13px;cursor:pointer}
   #ue-v5-mame .v5-tab[aria-selected=true]{background:#3c3c3c;border-color:#8d8d8d}
   #ue-v5-mame .v5-tab{min-width:106px}
   #ue-v5-mame .v5-label{font-size:12px;color:#adadad}
   #ue-v5-mame .v5-space{flex:1}
   #ue-v5-mame .v5-grid{display:grid;grid-template-columns:repeat(3,minmax(0,64px)) 24px repeat(3,minmax(0,64px));grid-template-rows:repeat(3,64px);gap:12px;justify-content:center;margin:20px 0}
   #ue-v5-mame .v5-grid [data-action=up]{grid-column:2;grid-row:1}
   #ue-v5-mame .v5-grid [data-action=left]{grid-column:1;grid-row:2}
   #ue-v5-mame .v5-grid [data-action=down]{grid-column:2;grid-row:2}
   #ue-v5-mame .v5-grid [data-action=right]{grid-column:3;grid-row:2}
   #ue-v5-mame .v5-grid [data-action=b1]{grid-column:5;grid-row:1}
   #ue-v5-mame .v5-grid [data-action=b2]{grid-column:6;grid-row:1}
   #ue-v5-mame .v5-grid [data-action=b3]{grid-column:7;grid-row:1}
   #ue-v5-mame .v5-grid [data-action=b4]{grid-column:5;grid-row:2}
   #ue-v5-mame .v5-grid [data-action=b5]{grid-column:6;grid-row:2}
   #ue-v5-mame .v5-grid [data-action=b6]{grid-column:7;grid-row:2}
   #ue-v5-mame .v5-grid [data-action=coin]{grid-column:3;grid-row:3}
   #ue-v5-mame .v5-grid [data-action=start]{grid-column:5;grid-row:3}
   #ue-v5-mame .v5-key{min-width:0;height:64px;min-height:64px;padding:6px;display:flex;flex-direction:column;gap:5px;align-items:center;justify-content:center;white-space:normal;text-align:center}
   #ue-v5-mame .v5-key strong{font-size:14px}
   #ue-v5-mame .v5-key small{font-size:11px;color:#ababab;line-height:1.25}
   #ue-v5-mame .v5-key[aria-selected=true]{border-color:#919191;background:#363636}
   #ue-v5-mame .v5-editor{background:#1f1f1f;border:1px solid #3b3b3b;border-radius:14px;padding:15px;min-height:95px;margin:10px 0}
   #ue-v5-mame .v5-editor input{width:100%;margin-top:10px;cursor:text}
   #ue-v5-mame .v5-editor strong{font-size:13px}
   #ue-v5-mame .v5-secondary{color:#c1c1c1}
   #ue-v5-mame .v5-action{background:#484848;border-color:#717171}
   #ue-v5-mame #v5-status{min-height:22px;color:#a9a9a9;margin:4px 0 12px;display:block;font-size:12px}
   @media(max-width:600px){#ue-v5-mame .v5-panel{padding:12px}#ue-v5-mame .v5-grid{grid-template-columns:repeat(3,minmax(0,56px)) 16px repeat(3,minmax(0,56px));grid-template-rows:repeat(3,60px);gap:8px}#ue-v5-mame .v5-key{padding:4px;height:60px;min-height:60px}#ue-v5-mame .v5-tab{min-width:70px}}
  `;veil.appendChild(style);
  const panel=document.createElement('div');panel.className='v5-panel';veil.appendChild(panel);
  const title=document.createElement('h2');title.textContent='Arcade / MAME — Controles';panel.appendChild(title);
  const description=document.createElement('p');description.textContent='Teclado e joystick independentes para cada jogador. Clique no comando e pressione a tecla ou botão. O perfil é salvo e enviado ao MAME aberto.';panel.appendChild(description);
  const tabs=document.createElement('div');tabs.className='v5-line';panel.appendChild(tabs);
  const chooser=document.createElement('div');chooser.className='v5-line';panel.appendChild(chooser);
  const grid=document.createElement('div');grid.className='v5-grid';panel.appendChild(grid);
  const editor=document.createElement('div');editor.className='v5-editor';panel.appendChild(editor);
  const status=document.createElement('span');status.id='v5-status';panel.appendChild(status);
  const footer=document.createElement('div');footer.className='v5-line';panel.appendChild(footer);
  function button(label,fn,klass=''){const b=document.createElement('button');b.textContent=label;if(klass)b.className=klass;b.onclick=fn;return b;}
  function select(options,value,fn){const x=document.createElement('select');for(const [v,label] of options){const o=document.createElement('option');o.value=v;o.textContent=label;x.appendChild(o)}x.value=value;x.onchange=()=>fn(x.value);return x;}
  let config;
  try{config=await api.ueMame5Read();}catch(error){status.textContent='Erro ao carregar os perfis: '+error.message;document.body.appendChild(veil);return;}
  let mode=initial==='joystick'?'joystick':'keyboard',player='1',fam='generic',selected='b1',timer=null,writeQueue=Promise.resolve();
  const rom=state.selectedRom?String(state.selectedRom).split(/[\\/]/).pop().toLowerCase():'';
  if(/^(mk|umk3|mk2|mk3|mk4)/.test(rom))fam='mk';
  if(/^(sf|ssf|sfa|sfiii|sfz|hsf)/.test(rom))fam='sf';
  const actions=[['↑','up'],['↓','down'],['←','left'],['→','right'],['1','b1'],['2','b2'],['3','b3'],['4','b4'],['5','b5'],['6','b6'],['Ficha','coin'],['Start','start']];
  function labelFor(action){
   if(fam==='mk')return ({b1:'Soco alto',b2:'Defesa (L1)',b3:'Chute alto',b4:'Soco baixo',b5:'Chute baixo',b6:'Correr (R1)'})[action]||'';
   if(fam==='sf')return ({b1:'Soco fraco',b2:'Soco médio',b3:'Soco forte (L1)',b4:'Chute fraco',b5:'Chute médio',b6:'Chute forte (R1)'})[action]||'';
   return '';
  }
  function current(){return config.controls[fam][mode][player];}
  function show(text){status.textContent=text;}
  function persist(){
   const snapshot=JSON.parse(JSON.stringify(config));
   show('Salvando...');
   writeQueue=writeQueue.catch(()=>{}).then(()=>api.ueMame5Save(snapshot)).then(result=>{
    if(result?.ok){
      if(result.livePending && api.ue20MameLiveStatus){
        show('Salvo. Aguardando confirmação do MAME aberto...');
        let tries=0;
        const verify=async()=>{
          tries++;
          const ack=await api.ue20MameLiveStatus().catch(()=>null);
          if(ack?.applied){show('Controles aplicados ao jogo aberto.');return;}
          if(tries<12){setTimeout(verify,300);return;}
          show('Salvo. O MAME ainda não confirmou a atualização; reabra o jogo se necessário.');
        };
        setTimeout(verify,350);
      }else show('Salvo no perfil MAME para a próxima abertura.');
    } else show('Erro ao salvar o perfil do MAME.');
   }).catch(error=>show('Erro: '+error.message));
  }
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function convertKey(e){
   const code=e.code||'', special={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',ShiftLeft:'lshift',ShiftRight:'rshift',ControlLeft:'lctrl',ControlRight:'rctrl',AltLeft:'lalt',AltRight:'ralt',Enter:'enter',Space:'space',Escape:'esc',Tab:'tab',Insert:'insert',Delete:'delete',Backspace:'backspace',Home:'home',End:'end',PageUp:'pageup',PageDown:'pagedown',Comma:'comma',Period:'period',Semicolon:'semicolon',Minus:'minus',Equal:'equal',Slash:'slash',Backslash:'backslash'};
   return special[code]||(code.startsWith('Key')?code.slice(3).toLowerCase():code.startsWith('Digit')?code.slice(5):/^F(?:[1-9]|1[0-2])$/.test(code)?code.toLowerCase():'');
  }
  function capture(){
   stop();
   const pads=typeof navigator.getGamepads==='function'?Array.from(navigator.getGamepads()).filter(Boolean):[];
   const pad=pads[Number(player)-1];
   if(!pad){show('Controle do Player '+player+' não detectado no Windows/Parallels. Conecte o controle e tente novamente.');return;}
   const wantedPlayer=player,wantedAction=selected,wantedFamily=fam;
   const prev=new Set(pad.buttons.map((x,i)=>x.pressed?i:-1).filter(i=>i>=0));
   const start=Date.now();show('Pressione o botão físico no controle do Player '+player+'...');
   timer=setInterval(()=>{
    const p=typeof navigator.getGamepads==='function'?Array.from(navigator.getGamepads()).filter(Boolean)[Number(wantedPlayer)-1]:null;
    if(!p){stop();show('Controle desconectado.');return;}
    let index=-1;
    p.buttons.forEach((b,i)=>{if(index<0&&b.pressed&&!prev.has(i))index=i;});
    prev.clear();p.buttons.forEach((b,i)=>{if(b.pressed)prev.add(i);});
    if(index>=0){
     stop();
     const translated={6:'L2',7:'R2',8:'SELECT',9:'START',12:'HAT1UP',13:'HAT1DOWN',14:'HAT1LEFT',15:'HAT1RIGHT'};
     const code=translated[index]||'B'+(index+1);
     config.controls[wantedFamily].joystick[wantedPlayer][wantedAction]=code;
     persist();draw();show('Botão '+code+' associado ao Player '+wantedPlayer+'.');
    }else if(Date.now()-start>15000){stop();show('Tempo de captura esgotado.');}
   },65);
  }
  function draw(){
   stop();tabs.replaceChildren();chooser.replaceChildren();grid.replaceChildren();editor.replaceChildren();footer.replaceChildren();
   for(const [id,label] of [['keyboard','Teclado'],['joystick','Joystick']]){
    const b=button(label,()=>{mode=id;selected='b1';draw();},'v5-tab');b.setAttribute('aria-selected',String(mode===id));tabs.appendChild(b);
   }
   const playerBar=document.createElement('span');playerBar.className='v5-label';playerBar.textContent='Jogador:';chooser.appendChild(playerBar);
   for(const p of ['1','2']){const b=button('Player '+p,()=>{player=p;selected='b1';draw();},'v5-tab');b.setAttribute('aria-selected',String(player===p));chooser.appendChild(b);}
   const space=document.createElement('div');space.className='v5-space';chooser.appendChild(space);
   const familyLabel=document.createElement('span');familyLabel.textContent='Perfil do jogo:';familyLabel.className='v5-label';chooser.appendChild(familyLabel);
   chooser.appendChild(select([['generic','Padrão'],['sf','Street Fighter'],['mk','Mortal Kombat']],fam,v=>{fam=v;selected='b1';draw();}));
   for(const [name,act] of actions){
    const b=button(name,()=>{selected=act;draw();if(mode==='keyboard')editor.querySelector('input')?.focus();else capture();},'v5-key');
    b.dataset.action=act;
    b.title='Clique para mapear · botão direito para remover';
    b.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();stop();selected=act;current()[act]='NONE';persist();draw();show('Mapeamento removido apenas deste comando · Player '+player+' · '+(mode==='keyboard'?'teclado':'joystick')+'.');};
    b.setAttribute('aria-selected',String(selected===act));
    const h=document.createElement('strong');h.textContent=name;const detail=document.createElement('small');
    detail.textContent=(labelFor(act)?labelFor(act)+' · ':'')+(current()[act]==='NONE'?'SEM MAPEAMENTO':String(current()[act]||'—').toUpperCase());
    b.replaceChildren(h,detail);grid.appendChild(b);
   }
   const heading=document.createElement('strong');heading.textContent='Player '+player+' · '+(mode==='keyboard'?'Tecla':'Botão do joystick')+' · '+(labelFor(selected)||selected);editor.appendChild(heading);
   if(mode==='keyboard'){
    const input=document.createElement('input');input.readOnly=true;input.placeholder='Clique e pressione a tecla';input.value=current()[selected]||'';
    input.onkeydown=e=>{
     e.preventDefault();e.stopPropagation();const key=convertKey(e);
     if(!key)return;
     if(key==='p'){show('P é reservado para pausar o MAME.');return;}
     if(['f6','f7'].includes(key)){show('F6/F7 são reservados para salvar/carregar estados.');return;}
     current()[selected]=key;persist();draw();show('Tecla '+key.toUpperCase()+' aplicada ao Player '+player+'.');
    };
    editor.appendChild(input);
    const tip=document.createElement('p');tip.textContent='Clique num botão acima e digite a tecla. Isto altera somente o teclado do jogador selecionado.';editor.appendChild(tip);
   }else{
    const row=document.createElement('div');row.className='v5-line';editor.appendChild(row);
    row.appendChild(button('Capturar botão do controle '+player,()=>capture(),'v5-action'));
    const choices=[['B1','X / A'],['B2','Círculo / B'],['B3','Quadrado / X'],['B4','Triângulo / Y'],['B5','L1'],['B6','R1'],['L2','L2 (gatilho)'],['R2','R2 (gatilho)'],['B11','L3 (navegador)'],['B12','R3 (navegador)'],['START','Options'],['SELECT','Create'],['HAT1UP','D-pad ↑'],['HAT1DOWN','D-pad ↓'],['HAT1LEFT','D-pad ←'],['HAT1RIGHT','D-pad →']];
    const sel=select(choices,current()[selected],v=>{current()[selected]=v;persist();draw();});row.appendChild(sel);
    const tip=document.createElement('p');tip.textContent='Clique para capturar o DualSense ou escolha manualmente. Apenas o joystick do Player '+player+' é alterado; o teclado fica intacto.';editor.appendChild(tip);
   }
   footer.appendChild(button('Restaurar padrão deste jogador',()=>{
     Object.assign(current(),config.defaults.controls[fam][mode][player]);
     persist();draw();show('Padrão restaurado para Player '+player+' · '+(mode==='keyboard'?'teclado':'joystick')+'.');
   },'v5-secondary'));
   const help=document.createElement('p');help.textContent='MAME: P = pausa · L3 = carregar estado · R3 = salvar estado no slot rápido. DualSense/XInput: os botões de ação continuam livres. Não existe calibração durante o jogo. Insert = turbo enquanto pressionado. Alguns jogos não suportam estados.';footer.appendChild(help);
   
   footer.appendChild(button('Cheats do MAME',()=>show('Cheats habilitados: com o jogo aberto, pressione Tab no MAME e escolha Cheats. Exige banco de cheats MAME compatível.'),'v5-secondary'));
   footer.appendChild(button('Turbo desta partida…',()=>{stop();ueMameTurboDialog({player:Number(player),action:/^b[1-6]$/.test(selected)?selected:'b1'})},'v5-action'));
   const exit=button('Fechar',()=>{stop();veil.remove();},'v5-action');const end=document.createElement('div');end.className='v5-space';footer.append(end,exit);
  }
  draw();document.body.appendChild(veil);
  const devices=document.createElement('p');devices.style.cssText='color:#ccc;font-size:12px;margin:10px 0';description.after(devices);
  const detection=setInterval(async()=>{
   if(!veil.isConnected){stop();clearInterval(detection);return;}
   const pads=Array.from(navigator.getGamepads?.()||[]).filter(p=>p&&p.connected);
   const live=await api.ueMameTurboStatus().catch(()=>null);
   devices.textContent='Controles identificados no painel: '+pads.length+(live?.running?' · MAME aberto: '+live.controllers+' controle(s)':'')+' · '+pads.map((p,i)=>(i+1)+': '+p.id).join(' | ');
  },700);
  veil.addEventListener('click',e=>{if(e.target===veil){stop();veil.remove();}});
}
// Wrap the existing panel; standalone MAME receives its own functional editor.
const ueV5OriginalPanel=ue7Panel;
ue7Panel = function(tab='keyboard') {
  if(state.selectedSystem&&state.selectedSystem.launcher==='mame')return ueV5MamePanel(tab);
  return ueV5OriginalPanel(tab);
};




// UE_V17_PS2_DIALOG: choices before running PlayStation 2 content.
function ue17PS2Dialog(system, gamePath) {
  document.getElementById('ue17-ps2-dialog')?.remove();
  if (!gamePath) return;
  const overlay=document.createElement('div');
  overlay.id='ue17-ps2-dialog';
  overlay.style.cssText='position:fixed;inset:0;background:#060606df;z-index:100001;display:flex;align-items:center;justify-content:center;padding:16px';
  const panel=document.createElement('div');
  panel.style.cssText='width:min(480px,96vw);max-height:90vh;overflow:auto;padding:26px;border:1px solid #58585877;border-radius:18px;background:linear-gradient(155deg,#1e1e1e,#141414);color:#f3f3f3;display:flex;flex-direction:column;gap:13px;box-shadow:0 24px 85px #000a';
  const heading=document.createElement('h2');heading.textContent='PlayStation 2';heading.style.cssText='font-size:24px;margin:0';
  const game=document.createElement('div');game.textContent=basename(gamePath);game.style.cssText='font-size:13px;color:#aeaeae;overflow-wrap:anywhere';
  const message=document.createElement('div');message.style.cssText='font-size:12px;color:#c7c7c7;min-height:20px';
  function button(title,highlight,handler) {
    const btn=document.createElement('button');btn.type='button';btn.textContent=title;
    btn.style.cssText='width:100%;min-height:44px;border-radius:10px;cursor:pointer;font-weight:750;color:white;border:1px solid #5b5b5b88;background:'+(highlight?'#666666':'#2a2a2a');
    btn.onclick=handler;return btn;
  }
  const play=button('Jogar',true,()=>{overlay.remove();launchRom(system,gamePath,true)});
  const config=button('Configurações — abrir PCSX2',false,async()=>{
    config.disabled=true;
    message.textContent='Abrindo PCSX2 sem iniciar o jogo...';
    try {
      const result=await ueWithLoading('Abrindo configurações do PCSX2...',()=>window.electronAPI.launchPCSX2(/* UE_PS2_RENDERER_EMPTY_OPTIONS_FIX_20261019 */ {}));
      if(result?.ok){overlay.remove();setStatus('PCSX2 aberto para configuração.','success')}
      else {message.textContent=result?.error||'Não foi possível abrir o PCSX2.';config.disabled=false}
    } catch(error){message.textContent=String(error?.message||error);config.disabled=false}
  });
  panel.append(heading,game,play,config,button('Cancelar',false,()=>overlay.remove()),message);
  overlay.append(panel);overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
  document.body.append(overlay);
}
{ const style=document.createElement('style'); style.textContent=`
.ue22-title-line{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
#ue22-manual-scan{padding:9px 12px;white-space:nowrap;border:1px solid #4c4c4c;border-radius:8px;background:#272727;color:#dcdcdc;font:600 11px system-ui;cursor:pointer}
#ue22-manual-scan[hidden]{display:none}
#ue22-manual-scan:hover{background:#383838}
#ue22-manual-scan:disabled{opacity:.45;cursor:wait}
#btn-refresh-library{white-space:nowrap;padding:10px 13px;border-radius:10px;font-size:11px}
#btn-refresh-library[hidden]{display:none!important}
#btn-refresh-library:disabled{opacity:.45;cursor:wait}
`;document.head.appendChild(style); }



// Neutral gray theme: readable labels, distinct surfaces and visible focus.
(() => {
 const style=document.createElement('style');
 style.id='ue-neutral-gray-theme';
 style.textContent=`@layer ue-gray {
 :root{--ue2-bg:#181818!important;--ue2-purple:#dedede!important;--ue2-text:#f5f5f5!important;--ue2-muted:#bdbdbd!important;--ue2-line:#3e3e3e!important}
 html,body,#root,#body{background:#181818!important;color:#f5f5f5!important}
 #body{background:#181818!important}
 #sidebar,#ue2-right{background:#202020!important}
 #main{background:#181818!important}#main:before{background:none!important}
 .ue2-card{background:#292929!important;border-color:#454545!important}
 .ue2-card:hover{background:#333!important;border-color:#999!important}
 .ue2-card.selected{background:#393939!important;border-color:#dedede!important;box-shadow:0 0 0 1px #dedede!important}
 #ue2-system-list .system-btn.active,.ue2-nav-btn.active{background:#3b3b3b!important;border-color:#999!important;color:#fff!important}
 .ue2-nav-btn.active:before{background:#eee!important;box-shadow:none!important}
 .ue2-profile-icon{background:linear-gradient(135deg,#555,#777)!important}
 .ue2-logo-icon{color:#eee!important;filter:none!important}.ue2-logo-icon span:last-child,.ue2-logo small{color:#ccc!important}
 #btn-play,.ue2-play-primary{background:#dedede!important;border:1px solid #eee!important;color:#171717!important;box-shadow:none!important}
 #btn-play:hover:not(:disabled),.ue2-play-primary:hover{background:#fff!important;filter:none!important}
 #btn-play:disabled{background:#404040!important;border-color:#606060!important;color:#aaa!important;opacity:1!important}
 .ue2-top-btn,.ue2-action,#ue152-language{background:#303030!important;border-color:#666!important;color:#f1f1f1!important}
 .ue2-top-btn:hover,.ue2-action:hover,#ue152-language:hover{background:#444!important;border-color:#aaa!important}
 .ue2-side-heading,.ue2-sidebar-foot small,.ue2-nav-btn,#ue2-system-list .system-btn,
 #system-core-info,.ue2-card-footer p,.ue2-detail-footnote,.ue2-detail-row span,
 .ue2-detail-placeholder p,.ue2-recent-empty,.ue2-recent-row,.ue2-right-title,
 .ue2-detail-eyebrow,.ue2-breadcrumb,.ue2-breadcrumb span:last-child,.ue2-count-label,
 .ue2-detail-stats span,.ue2-detail-system{color:#bdbdbd!important}
 #ue2-search::placeholder{color:#b8b8b8!important}
 .ue2-search-wrap{background:#242424!important;border-color:#666!important;color:#ccc!important}
 .ue2-search-wrap:focus-within{border-color:#eee!important;box-shadow:0 0 0 2px #777!important}
 .ue2-detail-stats>div,.ue2-sidebar-foot{background:#292929!important}
 .ue2-count{color:#eee!important;background:#454545!important}
 #status-bar{background:#202020!important;color:#bdbdbd!important}
 #status-bar.status-error{color:#ff8d99!important}#status-bar.status-success{color:#8ed9ae!important}
 button:focus-visible,input:focus-visible,select:focus-visible,.ue2-card:focus-visible{outline:2px solid #f5f5f5!important;outline-offset:3px!important}
 }`;
 document.head.appendChild(style);
})();

(() => {
 const style=document.createElement('style');style.id='ue-carousel-styles';
 style.textContent=`
 #ue2-config-details{margin-top:10px;border:1px solid #3d3d3d;border-radius:10px;background:#202020;overflow:hidden}
 #ue2-config-details>summary{cursor:pointer;list-style:none;padding:9px 13px;color:#cfcfcf;font:600 12px system-ui;display:flex;align-items:center;gap:10px;user-select:none}
 #ue2-config-details>summary::-webkit-details-marker{display:none}
 #ue2-config-details>summary:before{content:'›';font-size:20px;line-height:10px;transition:transform .15s ease;color:#aaa}
 #ue2-config-details[open]>summary:before{transform:rotate(90deg)}
 .ue2-config-hint{margin-left:auto;color:#888;font-weight:500;font-size:11px}
 .ue2-config-rows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid #383838}
 .ue2-config-row{min-width:0;display:grid;grid-template-columns:92px minmax(0,1fr) 18px;gap:8px;align-items:center;padding:9px 13px;border-bottom:1px solid #303030;color:#aaa;font-size:11px}
 .ue2-config-row:nth-child(odd){border-right:1px solid #303030}
 .ue2-config-row strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e5e5e5;font-weight:500}
 .ue2-config-ok{color:#3ddc86;font-size:16px;text-align:center}
 .ue2-view-label{font-size:10px;margin-left:3px;letter-spacing:.02em}
 @media(max-width:760px){.ue2-config-rows{grid-template-columns:1fr}.ue2-config-row:nth-child(odd){border-right:0}.ue2-view-label{display:none}}
 #rom-list.ue2-game-carousel{display:flex!important;flex-direction:row;align-items:center;gap:24px!important;overflow-x:auto!important;overflow-y:hidden!important;padding:24px 30px 32px!important;scroll-snap-type:x proximity;scroll-padding-inline:30px;overscroll-behavior-x:contain}
 #rom-list.ue2-game-carousel .ue2-card{display:flex;flex-direction:column;flex:0 0 clamp(230px,25vw,330px);width:clamp(230px,25vw,330px);scroll-snap-align:center;border-radius:17px;max-height:100%;transition:background .15s,border-color .15s,box-shadow .15s}
 #rom-list.ue2-game-carousel .ue2-art{aspect-ratio:3/4;min-height:0;max-height:calc(100vh - 355px);height:clamp(200px,43vh,440px);width:100%;flex:1 1 auto;background:#262626}
 #rom-list.ue2-game-carousel .ue2-art img{object-fit:contain;object-position:center}
 #rom-list.ue2-game-carousel .ue2-art:after{display:none}
 #rom-list.ue2-game-carousel .ue2-card-footer{flex:0 0 auto;min-height:78px;padding:16px}
 #rom-list.ue2-game-carousel .ue2-card-footer h3{font-size:16px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
 #rom-list.ue2-game-carousel .ue2-card-footer p{font-size:12px}
 #rom-list.ue2-game-carousel .ue2-card:hover{transform:none}
 #rom-list.ue2-game-carousel .ue2-more{flex:0 0 190px;margin:auto 0}
 .ue-carousel-nav{padding:9px!important;min-width:32px}
 .ue-carousel-nav span:last-child{display:none}
 #ue-carousel-prev .ue2-ico{transform:rotate(180deg)}
 .ue-carousel-nav[hidden]{display:none!important}
 @media(max-height:650px){#rom-list.ue2-game-carousel .ue2-art{height:180px;max-height:calc(100vh - 320px)}}
 @media(prefers-reduced-motion:reduce){#rom-list.ue2-game-carousel{scroll-behavior:auto}}
 `;document.head.appendChild(style);
})();

(() => {
 const style=document.createElement('style');style.id='ue-about-styles';
 style.textContent=`
 #ue-about-dialog{position:fixed;inset:0;margin:auto;width:min(480px,calc(100vw - 32px));max-height:calc(100vh - 40px);overflow:auto;background:#242424;color:#f5f5f5;border:1px solid #727272;border-radius:18px;padding:28px;box-shadow:0 24px 80px #0009;font-family:'Segoe UI',system-ui,sans-serif}
 #ue-about-dialog::backdrop{background:#000b}
 .ue-about-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
 .ue-about-eyebrow{font-size:10px;letter-spacing:.17em;color:#bdbdbd;font-weight:700;margin-bottom:8px}
 #ue-about-title{font-size:27px;line-height:1.2;margin:0;color:#fff}
 .ue-about-close{display:grid;place-items:center;background:#333;color:#eee;border:1px solid #666;border-radius:9px;width:34px;height:34px;cursor:pointer}
 .ue-about-close:hover{background:#484848}
 .ue-about-details{margin:25px 0 22px}
 .ue-about-details>div{padding:16px 0;border-top:1px solid #484848}
 .ue-about-details dt{font-size:12px;color:#bdbdbd;margin-bottom:6px}
 .ue-about-details dd{font-size:16px;font-weight:600;color:#f5f5f5;margin:0;overflow-wrap:anywhere;user-select:text}
 .ue-about-footer{display:flex;justify-content:flex-end}
 .ue-about-footer button{min-width:90px}
 #ue-about-dialog button:focus-visible{outline:2px solid white;outline-offset:3px}
 `;document.head.appendChild(style);
})();

async function ueMameTurboDialog(initial={}){
 if(document.getElementById('ue-mame-turbo'))return;
 const api=window.electronAPI,dialog=el('dialog',{id:'ue-mame-turbo','aria-labelledby':'ue-mame-turbo-title'});
 dialog.style.cssText='position:fixed;inset:0;margin:auto;width:min(520px,calc(100vw - 28px));max-height:92vh;overflow:auto;background:#242424;color:#f5f5f5;border:1px solid #777;border-radius:16px;padding:25px;box-shadow:0 20px 80px #000b';
 const style=el('style',{},'#ue-mame-turbo::backdrop{background:#000b}#ue-mame-turbo p{font-size:13px;color:#ccc;line-height:1.6;margin:14px 0}#ue-mame-turbo select{background:#333;color:#fff;padding:10px;border:1px solid #777;border-radius:8px;width:100%}#ue-mame-turbo label{display:block;margin:15px 0}#ue-mame-turbo button{background:#3a3a3a;color:#fff;padding:11px 14px;border:1px solid #888;border-radius:9px;cursor:pointer}#ue-mame-turbo button:disabled{opacity:.45;cursor:default}#ue-mame-turbo button:focus-visible{outline:2px solid white;outline-offset:3px}');
 dialog.append(style,el('h2',{id:'ue-mame-turbo-title'},'Turbo desta partida · MAME'),el('p',{},'Escolha o botão do jogo e depois pressione a tecla ou o botão físico que será o turbo. Segure para repetir rapidamente; solte para parar. A escolha é descartada ao fechar ou trocar o jogo.'));
 const player=el('select',{'aria-label':'Jogador'}),action=el('select',{'aria-label':'Botão do jogo'});
 for(const p of [1,2])player.appendChild(el('option',{value:String(p)},'Player '+p));player.value=String(initial.player||1);
 for(let n=1;n<=6;n++)action.appendChild(el('option',{value:'b'+n},'Botão '+n));action.value=initial.action||'b1';
 dialog.append(el('label',{},'Jogador',player),el('label',{},'Ação que receberá turbo',action));
 const message=el('p',{'role':'status'},'Conferindo o MAME aberto…'),bindings=el('p',{}),row=el('div',{style:{display:'flex',gap:'9px',flexWrap:'wrap'}});
 let timer=null,keyHandler=null,disposed=false;
 const stop=()=>{if(timer)clearInterval(timer);timer=null;if(keyHandler)window.removeEventListener('keydown',keyHandler,true);keyHandler=null;};
 const keyboard=el('button',{type:'button',onClick:()=>captureKey()},'Escolher tecla'),joystick=el('button',{type:'button',onClick:()=>capturePad()},'Escolher botão do controle');
 row.append(keyboard,joystick);dialog.append(row,message,bindings,el('p',{},'Velocidade máxima: um quadro pressionado e um solto — cerca de 30 disparos por segundo em jogos de 60 Hz. A velocidade efetiva depende do jogo.'));
 const footer=el('div',{style:{display:'flex',gap:'9px',justifyContent:'flex-end',flexWrap:'wrap'}});
 footer.append(el('button',{type:'button',onClick:async()=>{stop();await send({clear:true})}},'Desativar turbo'),el('button',{type:'button',onClick:()=>dialog.close()},'Fechar'));dialog.append(footer);
 async function refresh(){
  const result=await api.ueMameTurboStatus();if(disposed)return result;
  keyboard.disabled=joystick.disabled=!result.running;
  bindings.textContent=(result.bindings||[]).map(b=>'Player '+b.player+' · Botão '+b.action.slice(1)+' · '+b.code).join(' | ');
  if(!result.running)message.textContent='Abra um jogo pelo Ultimate Emulator para ativar o turbo desta partida.';
  else message.textContent='MAME aberto · '+result.controllers+' controle(s) identificado(s). '+((result.bindings||[]).length?(result.applied?'Turbo confirmado pelo MAME.':'Aguardando aplicação…'):'Nenhum turbo ativo.');
  return result;
 }
 async function send(payload){
  const result=await api.ueMameTurboSet(payload);if(disposed)return;
  if(!result?.ok){message.textContent=result?.error||'Não foi possível configurar o turbo.';return;}
  message.textContent='Aplicando ao jogo aberto…';
  for(let i=0;i<16;i++){await new Promise(resolve=>setTimeout(resolve,200));if(disposed)return;const state=await refresh();if(state.applied)return;}
  message.textContent='O MAME ainda não confirmou o turbo. Verifique se o jogo está rodando e se a tecla escolhida está disponível.';
 }
 function captureKey(){
  stop();message.textContent='Pressione a tecla que será o turbo. Esc cancela.';
  keyHandler=event=>{
   event.preventDefault();event.stopImmediatePropagation();if(event.repeat)return;
   if(event.key==='Escape'){stop();void refresh();return;}
   const special={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Space:'space',Enter:'enter',ShiftLeft:'lshift',ShiftRight:'rshift',ControlLeft:'lctrl',ControlRight:'rctrl',Comma:'comma',Period:'period',Slash:'slash',Insert:'insert'};
   const code=special[event.code]||(/^Key[A-Z]$/.test(event.code)?event.code.slice(3).toLowerCase():/^Digit\d$/.test(event.code)?event.code.slice(5):'');
   if(!code){message.textContent='Escolha uma tecla de ação, sem usar os atalhos do emulador.';return;}
   stop();void send({player:Number(player.value),action:action.value,mode:'keyboard',code});
  };window.addEventListener('keydown',keyHandler,true);
 }
 function capturePad(){
  stop();const number=Number(player.value),pads=()=>Array.from(navigator.getGamepads?.()||[]).filter(p=>p&&p.connected),first=pads()[number-1];
  if(!first){message.textContent='Controle do Player '+number+' não identificado no painel. Pressione um botão para identificá-lo e tente novamente.';return;}
  let last=new Set(first.buttons.map((b,i)=>b.pressed?i:-1).filter(i=>i>=0));const until=Date.now()+12000;
  message.textContent='Pressione o botão físico que será o turbo do Player '+number+'.';
  timer=setInterval(()=>{
   const pad=pads()[number-1];if(!pad){stop();message.textContent='Controle desconectado.';return;}
   const pressed=pad.buttons.findIndex((b,i)=>b.pressed&&!last.has(i));last=new Set(pad.buttons.map((b,i)=>b.pressed?i:-1).filter(i=>i>=0));
   if(pressed>=0){
    if([10,11,16,17].includes(pressed)){message.textContent='L3, R3, PS/Guide e touchpad são reservados. Escolha um botão de ação.';return;}
    const code=({6:'L2',7:'R2',8:'SELECT',9:'START',12:'HAT1UP',13:'HAT1DOWN',14:'HAT1LEFT',15:'HAT1RIGHT'})[pressed]||'B'+(pressed+1);
    stop();void send({player:number,action:action.value,mode:'joystick',code});
   }else if(Date.now()>until){stop();message.textContent='Tempo encerrado. Clique para escolher novamente.';}
  },45);
 }
 dialog.addEventListener('cancel',()=>stop());dialog.addEventListener('close',()=>{disposed=true;stop();dialog.remove()},{once:true});
 document.body.appendChild(dialog);dialog.showModal();await refresh();
}

async function ueRetroTurboDialog(system,selectedPlayer=1){
 if(document.getElementById('ue-retro-turbo'))return;
 const api=window.electronAPI,state=await api.ueRetroTurboRead(system.folder),dialog=el('dialog',{id:'ue-retro-turbo','aria-label':'Turbo RetroArch'});
 dialog.style.cssText='margin:auto;width:min(520px,95vw);background:#242424;color:#fff;border:1px solid #888;border-radius:16px;padding:25px;max-height:90vh;overflow:auto';
 dialog.append(el('style',{},'#ue-retro-turbo::backdrop{background:#000c}#ue-retro-turbo select,#ue-retro-turbo button{background:#383838;color:#fff;border:1px solid #888;padding:10px;border-radius:8px}#ue-retro-turbo label{display:flex;justify-content:space-between;gap:15px;margin:18px 0}#ue-retro-turbo p{color:#ccc;font-size:13px;line-height:1.6}'),el('h2',{},'Turbo · '+system.name),el('p',{},'Escolha antes de iniciar o jogo. Cada jogador tem sua própria tecla e botão de controle; serão usados os mapeamentos salvos. Vale apenas para a próxima partida, e não muda o padrão dos jogos seguintes.'));
 const shape=ue8Shape(system.id),labels=[...shape.face,...shape.shoulders].filter(x=>['b','a','y','x','l','r','l2','r2'].includes(x[1]));
 const message=el('p',{'role':'status'},'Modo clássico do RetroArch: segure o botão escolhido para repetir. Outros botões de ação pressionados junto também podem repetir; direções ficam normais. Um quadro ligado e um desligado (~30 Hz a 60 fps).');
 const controls=[];
 for(const p of [selectedPlayer,3-selectedPlayer]){
  dialog.append(el('h3',{},'Player '+p));
  for(const [mode,label] of [['keyboard','Teclado'],['joystick','Joystick']]){
   const select=el('select',{'aria-label':label+' Player '+p});select.append(el('option',{value:''},'Desativado'));
   for(const [name,value] of labels)select.append(el('option',{value},name));select.value=state[String(p)][mode]||'';
   select.onchange=async()=>{const result=await api.ueRetroTurboSet(system.folder,{player:p,mode,action:select.value});message.textContent=result.ok?'Preparado para a próxima partida. Segure a tecla ou botão já mapeado para esta ação.':result.error};controls.push({select,p,mode});dialog.append(el('label',{},label,select));
  }
 }
 dialog.append(message,el('button',{type:'button',onClick:async()=>{for(const c of controls){await api.ueRetroTurboSet(system.folder,{player:c.p,mode:c.mode,action:''});c.select.value=''}message.textContent='Turbo desativado nos dois jogadores.'}},'Desativar todos'),el('button',{type:'button',onClick:()=>dialog.close()},'Fechar'));
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
}

// Controller charge comes from Windows game-controller reports, never the PC battery.
function ueControllerBatteryColor(percent){return percent<=20?'#ff666e':percent<30?'#ffc45e':'#48df91';}
function ueInstallControllerBattery(){
 if(!document.getElementById('ue-controller-battery-style')){
  const style=document.createElement('style');style.id='ue-controller-battery-style';
  style.textContent='.ue-controller-battery{display:inline-flex;gap:7px;align-items:center;white-space:nowrap;border:1px solid #444;border-radius:8px;padding:7px 9px;font:600 11px Segoe UI,system-ui;background:#242424;flex-shrink:0}.ue-battery-icon{display:inline-block;width:19px;height:10px;border:1px solid currentColor;border-radius:2px;position:relative;padding:1px}.ue-battery-icon:after{content:"";position:absolute;right:-3px;top:2px;height:4px;width:2px;background:currentColor}.ue-battery-fill{height:100%;background:currentColor;display:block}.ue-core-repair{display:inline-flex!important;align-items:center;cursor:pointer;order:3;flex-shrink:0}.ue-core-repair:focus-visible{outline:2px solid #ff9399;outline-offset:2px}';
  document.head.append(style);
 }
 let busy=false,pendingForce=false;
 const update=async(force=false)=>{
  const bar=document.querySelector('.ue2-top-actions');if(!bar)return;
  let chip=document.getElementById('ue-controller-battery');
  if(!chip){chip=document.createElement('span');chip.id='ue-controller-battery';chip.className='ue-controller-battery';chip.setAttribute('role','status');bar.prepend(chip);}
  ueInstallRumbleControl();
  if(busy){if(force===true)pendingForce=true;return;}busy=true;
  try{
   const pads=Array.from(navigator.getGamepads?.()||[]).filter(p=>p&&p.connected),pad=pads.find(p=>String(p.id)===UE2.gamepadId)||pads[0];
   const data=await window.electronAPI?.ueControllerBattery?.(force===true);
   const values=data?.controllers||[],connected=!!pad||data?.connected;
   const report=values.find(x=>pad&&x.index===pad.index)||values.find(x=>pad&&x.id&&pad.id.toLowerCase().includes(x.id.toLowerCase()))||(values.length===1&&pads.length<=1?values[0]:null);
   const percent=report?.percent,color=Number.isInteger(percent)?ueControllerBatteryColor(percent):'#aaa';
   chip.replaceChildren();const icon=document.createElement('span');icon.className='ue-battery-icon';const fill=document.createElement('span');fill.className='ue-battery-fill';fill.style.width=(Number.isInteger(percent)?percent:0)+'%';icon.append(fill);const label=document.createElement('span');label.textContent=Number.isInteger(percent)?percent+'%'+(report.charging?' · carregando':(report.full?' · carregado':'')):(connected?'Bateria —':'Controle —');
   for(const node of [chip,icon,fill,label])node.style.setProperty('color',color,'important');chip.append(icon,label);
   chip.title=Number.isInteger(percent)?'Bateria do controle · '+report.source:(connected?'O Windows não informa a porcentagem deste controle. No Parallels, a carga pode não ser repassada.':'Conecte um controle para consultar a bateria.');
  }catch{chip.textContent='Bateria —';chip.title='Porcentagem indisponível neste controle.';}finally{busy=false;if(pendingForce){pendingForce=false;setTimeout(()=>update(true),0);}}
 };
 void update(true);setInterval(()=>update(),5000);window.addEventListener('gamepadconnected',()=>update(true));window.addEventListener('gamepaddisconnected',()=>update(true));
 ueInstallRumbleControl();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ueInstallControllerBattery);else ueInstallControllerBattery();

function ueInstallRumbleControl(){
 const battery=document.getElementById('ue-controller-battery');if(!battery||document.getElementById('ue-controller-rumble'))return;
 const label=document.createElement('label');label.id='ue-controller-rumble';label.className='ue-controller-rumble';
 label.style.cssText='display:inline-flex;align-items:center;gap:6px;font:600 10px Segoe UI,system-ui;color:#ddd;cursor:pointer;max-width:150px;line-height:1.3;flex-shrink:0';
 const check=document.createElement('input');check.type='checkbox';check.checked=true;check.disabled=true;check.style.cssText='width:15px;height:15px;accent-color:#48df91;flex-shrink:0';
 const text=document.createElement('span');text.textContent='Ativar Vibração do controle (Compatíveis)';label.append(check,text);label.title='Permite vibração nos jogos e núcleos RetroArch que oferecem esse recurso. Aplicado ao abrir o jogo.';battery.after(label);
 window.electronAPI.ueControllerPreferences().then(value=>{check.checked=value.rumble;check.disabled=false;}).catch(()=>{check.disabled=false;});
 check.onchange=async()=>{const enabled=check.checked;check.disabled=true;try{const result=await window.electronAPI.ueControllerRumble(enabled);if(!result.ok)throw Error(result.error||'Não foi possível salvar a vibração.');setStatus('Vibração '+(enabled?'ativada':'desativada')+' para jogos RetroArch compatíveis.'+(result.applies==='next-launch'?' Aplicada na próxima abertura do jogo.':''),'success');}catch(e){check.checked=!enabled;setStatus(e.message,'error');}finally{check.disabled=false;}};
}
