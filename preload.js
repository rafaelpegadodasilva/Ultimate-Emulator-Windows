const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  ueGameInfo:payload=>ipcRenderer.invoke('ue-game-info',payload),
  ueWindowsTheme:()=>ipcRenderer.invoke('ue-windows-theme'),
  ueOnWindowsTheme:callback=>{const handler=(_,value)=>callback(value);ipcRenderer.on('ue-windows-theme-updated',handler);return ()=>ipcRenderer.removeListener('ue-windows-theme-updated',handler)},
  getLibraryCache: () => ipcRenderer.invoke('get-library-cache'),
  getSystemSettings: folder => ipcRenderer.invoke('get-system-settings', folder),
  saveSystemSettings: payload => ipcRenderer.invoke('save-system-settings', payload),
  listVideoPresets: () => ipcRenderer.invoke('list-video-presets'),
  applyLiveShader: preset => ipcRenderer.invoke('apply-live-shader', preset),
  ue6LoadLibrary:()=>ipcRenderer.invoke('ue6-load-library'),
  ue6SaveLibrary:x=>ipcRenderer.invoke('ue6-save-library',x),
  ueRetroTurboRead:folder=>ipcRenderer.invoke('ue-retro-turbo-read',folder),
  ueRetroTurboSet:(folder,request)=>ipcRenderer.invoke('ue-retro-turbo-set',folder,request),
  ueKeyboardDefaults:folder=>ipcRenderer.invoke('ue-keyboard-defaults',folder),
  ueMameTurboStatus:()=>ipcRenderer.invoke('ue-mame-turbo-status'),
  ueMameTurboSet:request=>ipcRenderer.invoke('ue-mame-turbo-set',request),
  ue6ReadOptions:x=>ipcRenderer.invoke('ue6-read-options',x),
  ue6SaveOptions:x=>ipcRenderer.invoke('ue6-save-options',x),
  ue6ListShaders:()=>ipcRenderer.invoke('ue6-list-shaders'),
  ue6ApplyShader:x=>ipcRenderer.invoke('ue6-apply-shader',x),
  ue7Command: command => ipcRenderer.invoke('ue7-command',command),
  ue7OnOpenPanel: handler => ipcRenderer.on('ue7-open-panel',(_,tab)=>handler(tab)),
  ue9SyncDevice:x=>ipcRenderer.invoke('ue9-sync-device',x),
  ue9ResolveButton:x=>ipcRenderer.invoke('ue9-resolve-button',x),
  ue10ResolveControl:x=>ipcRenderer.invoke('ue10-resolve-control',x),
  ue9Presets:()=>ipcRenderer.invoke('ue9-presets'),
  ue9Preview:x=>ipcRenderer.invoke('ue9-preview',x),
  ueOnGameSession: callback => {
    const handler = (_, value) => callback(value);
    ipcRenderer.on('ue-game-session', handler);
    return () => ipcRenderer.removeListener('ue-game-session', handler);
  },
  ueLiveInfo:()=>ipcRenderer.invoke('ue-live-info'),
  ueLiveFilter:value=>ipcRenderer.invoke('ue-live-filter',value),
  ueLiveCheat:(index,request)=>ipcRenderer.invoke('ue-live-cheat',index,request),
  ueLiveConfirm:()=>ipcRenderer.invoke('ue-live-confirm'),
  ue10StateStatus: () => ipcRenderer.invoke('ue10-state-status'),
  ue10StateAction: action => ipcRenderer.invoke('ue10-state-action',action),
  ue10OnStateChooser: callback => {
    const handler = (_, value) => callback(value);
    ipcRenderer.on('ue10-state-chooser', handler);
    return () => ipcRenderer.removeListener('ue10-state-chooser', handler);
  },
  ue10StateModalClosed: () => ipcRenderer.invoke('ue10-state-modal-closed'),
  ue10StateToastClosed: () => ipcRenderer.invoke('ue10-state-toast-closed'),
  ue10OnStateToast: callback => {
    const handler = (_, value) => callback(value);
    ipcRenderer.on('ue10-state-toast', handler);
    return () => ipcRenderer.removeListener('ue10-state-toast', handler);
  },
  ue14OpenConfigurator: launcher =>
    ipcRenderer.invoke('ue14-open-configurator',launcher),
  ue152Language:lang=>ipcRenderer.invoke('ue152-language',lang),
  ue55Info:()=>ipcRenderer.invoke('ue55-info'),
  ue55Toggle:(index,enabled)=>
    ipcRenderer.invoke('ue55-toggle',{index,enabled}),
  ue55Close:()=>ipcRenderer.invoke('ue55-close'),
  ue20CheatsPlay:()=>ipcRenderer.invoke('ue20-cheats-play'),
  ue20CheatsOpen: request=>ipcRenderer.invoke('ue20-cheats-open',request),
  ue159Info:()=>ipcRenderer.invoke('ue159-info'),
  ue159Toggle:(index,enabled)=>
    ipcRenderer.invoke('ue159-toggle',index,enabled),
  ue159DisableAll:()=>ipcRenderer.invoke('ue159-disable-all'),
  ue159Close:()=>ipcRenderer.invoke('ue159-close'),
  ue1511DuckStation:request =>
    ipcRenderer.invoke('ue1511-duckstation',request),
  ue2PreferencesLoad:()=>ipcRenderer.invoke('ue2-preferences-load'),
  ue2PreferencesSave:p=>ipcRenderer.invoke('ue2-preferences-save',p),
  ueGameRegion:rom=>ipcRenderer.invoke('ue-game-region',rom),
  ue2DescriptionGet:rom=>ipcRenderer.invoke('ue2-description-get',rom),
  ue2DescriptionEdit:rom=>ipcRenderer.invoke('ue2-description-edit',rom),
  ue2DescriptionSave:(rom,text)=>ipcRenderer.invoke('ue2-description-save',rom,text),
  ue2DescriptionAuto:(rom,system,title,force)=>ipcRenderer.invoke('ue2-description-auto',rom,system,title,Boolean(force)),
  ueModernGet:rom=>ipcRenderer.invoke('ue-modern-get',rom),
  ueModernGetMany:roms=>ipcRenderer.invoke('ue-modern-get-many',Array.isArray(roms)?roms:[]),
  // Calcula o tamanho da biblioteca fora do renderer, sem precisar carregar
  // capas ou montar cartões de jogos para a tela inicial.
  ueModernLibrarySize:request=>ipcRenderer.invoke('ue-modern-library-size',request),
  ueModernPlayed:rom=>ipcRenderer.invoke('ue-modern-played',rom),
  ueModernPickCover:rom=>ipcRenderer.invoke('ue-modern-pick-cover',rom),
  ueModernAutoCover:(rom,system,force,title)=>ipcRenderer.invoke('ue-modern-auto-cover',rom,system,Boolean(force),typeof title==='string'?title.slice(0,240):''),
  ue9TrashGames: paths => ipcRenderer.invoke('ue9-trash-games',paths),
  ue9ShowGameInFolder: p => ipcRenderer.invoke('ue9-show-game-in-folder',p),
  getPaths: () => ipcRenderer.invoke('get-paths'),
  scanRoms: (system) => ipcRenderer.invoke('scan-roms', system),
  scanAllRoms: (systemFolders) => ipcRenderer.invoke('scan-all-roms', systemFolders),
  chooseScanFolder: () => ipcRenderer.invoke('choose-scan-folder'),
  scanGlobalFolder: (payload) => ipcRenderer.invoke('scan-global-folder', payload),
  scanGlobalFiles: (payload) => ipcRenderer.invoke('scan-global-files', payload),
  ueControllerBattery:force=>ipcRenderer.invoke('ue-controller-battery',force===true),
  ueControllerPreferences:()=>ipcRenderer.invoke('ue-controller-preferences'),
  ueControllerRumble:enabled=>ipcRenderer.invoke('ue-controller-rumble',enabled),
  ueRepairComponent:request=>ipcRenderer.invoke('ue-repair-component',request),
  ue19SystemHealth: systems => ipcRenderer.invoke('ue19-system-health', systems),
  listCores: () => ipcRenderer.invoke('list-cores'),
  launchRetroArch: (opts) => ipcRenderer.invoke('launch-retroarch', opts),
  launchPCSX2: (opts) => ipcRenderer.invoke('launch-pcsx2', opts),
  launchDolphin: (opts) => ipcRenderer.invoke('launch-dolphin', opts),
  launchVita3K: (opts) => ipcRenderer.invoke('launch-vita3k', opts),
  launchPPSSPP: (opts) => ipcRenderer.invoke('launch-ppsspp', opts),
  launchMAME: (opts) => ipcRenderer.invoke('launch-mame', opts),
  ueMame5Read: () => ipcRenderer.invoke('ue-mame5-read'),
  ueMame6ResetHotkeys: () => ipcRenderer.invoke('ue-mame6-reset-hotkeys'),
  ueMame5Save: config => ipcRenderer.invoke('ue-mame5-save',config),
  ue20MameLiveStatus: () => ipcRenderer.invoke('ue20-mame-live-status'),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  downloadCore: (coreName) => ipcRenderer.invoke('download-core', coreName),
  checkExe: (exePath) => ipcRenderer.invoke('check-exe', exePath),
});
