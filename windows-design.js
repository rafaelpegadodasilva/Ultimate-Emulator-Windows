document.getElementById('ue-neutral-gray-theme')?.remove();
const ueWindowsPresentationStyle=document.createElement('style');ueWindowsPresentationStyle.id='ue-windows-presentation';ueWindowsPresentationStyle.textContent=String.raw`:root{color-scheme:dark;--win-bg:#090d12;--win-panel:#101820;--win-sidebar:#0b1117;--win-soft:#15232c;--win-text:#f3f8fa;--win-muted:#91a5ae;--win-line:#2b414c;--win-accent:#65d9ff;--win-selected:#163541;--win-shadow:0 10px 28px #0008;--ue2-line:var(--win-line);--ue2-text:var(--win-text);--ue2-muted:var(--win-muted)}
:root[data-ue-theme=dark]{color-scheme:dark;--win-bg:#171b23;--win-panel:#202632;--win-sidebar:#1c212c;--win-soft:#292f3d;--win-text:#f0f3fa;--win-muted:#a9b4c8;--win-line:#374154;--win-accent:#438fff;--win-selected:#233e63;--win-shadow:0 8px 24px #0002}
:root body,:root #root,:root #app,:root #body{background:var(--win-bg)!important;color:var(--win-text)!important;font-family:'Segoe UI Variable','Segoe UI',system-ui,sans-serif}
:root #body{grid-template-columns:var(--ue-sidebar-width,minmax(286px,max-content)) minmax(0,1fr)!important}
:root #main{background:var(--win-bg)!important;--sys-c1:var(--win-accent)!important;--sys-c2:var(--win-accent)!important}
:root #main:before{display:none!important}
:root #sidebar{background:linear-gradient(165deg,var(--win-sidebar),var(--win-panel))!important;border-color:var(--win-line)!important}
:root #ue2-right{background:var(--win-bg)!important;border-color:var(--win-line)!important;padding:23px 17px!important}
:root .ue2-logo{padding:24px 18px 17px;min-height:83px;gap:12px}
:root .ue2-logo strong{font-size:16px;letter-spacing:-.02em;color:var(--win-text)}
:root .ue2-logo small{font-size:10px;font-weight:400;letter-spacing:0;color:var(--win-muted)!important;line-height:1.4}
:root .ue2-logo-icon{width:44px;height:44px;background:var(--win-panel);border-radius:15px;color:var(--win-accent)!important;filter:none!important;box-shadow:var(--win-shadow)}
:root .ue2-side-heading{font-size:9px!important;letter-spacing:.12em;color:var(--win-muted)!important;padding-top:14px!important}
:root .ue2-systems-heading{margin-top:8px;padding-top:16px!important}
:root .ue2-console-search{display:flex;align-items:center;gap:8px;margin:0 15px 12px;padding:9px 11px;background:var(--win-panel);border:1px solid var(--win-line);border-radius:10px;color:var(--win-muted)}
:root .ue2-console-search input{min-width:0;width:100%;border:0;outline:0;background:transparent;color:var(--win-text);font:12px 'Segoe UI',sans-serif}
:root .ue2-console-search input::placeholder{color:var(--win-muted)}
:root #ue2-nav{margin:0 13px 5px;gap:3px}
:root .ue2-nav-btn{padding:10px 11px;min-height:38px;font-size:12px;color:var(--win-text)!important;border-radius:10px}
:root .ue2-nav-btn:hover{background:var(--win-soft)!important;color:var(--win-text)!important}
:root .ue2-nav-btn.active,:root #ue2-system-list .system-btn.active{background:var(--win-accent)!important;color:#fff!important;box-shadow:0 5px 14px #0878f92b;border-color:transparent!important}
:root .ue2-nav-btn.active:before{display:none!important}
:root .ue2-nav-btn.active .ue2-ico{color:white!important}
:root .ue2-nav-btn .ue2-ico{color:var(--win-accent)}
:root #ue2-system-list{padding:0 12px 12px;scrollbar-color:var(--win-line) transparent}
:root #ue2-system-list .system-btn{padding:8px 10px!important;margin:1px 0!important;border-radius:10px;color:var(--win-text)!important;gap:9px;min-height:37px}
:root #ue2-system-list .system-btn:hover{background:var(--win-soft)!important}
:root #ue2-system-list .system-btn.active:hover{background:var(--win-accent)!important}
:root .system-btn-name{font-size:12px!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
:root .ue-win-system-icon{display:flex;align-items:center;flex:0 0 20px;color:var(--platform-color,var(--win-accent))}
:root .system-btn.active .ue-win-system-icon{color:white}
:root #ue2-system-list .system-btn-dot{height:5px;width:5px;min-width:5px;box-shadow:none!important;order:3;margin-left:0}
:root .ue-win-system-count,:root .ue2-count{font-size:12px;font-weight:800;color:#fff!important;background:#1675c9!important;border-radius:999px;padding:3px 7px;margin-left:auto;min-width:23px;text-align:center}
:root .system-btn.active .ue-win-system-count,:root .ue2-nav-btn.active .ue2-count{background:#1675c9!important;color:#fff!important}
:root .ue2-sidebar-foot{padding:15px;border-color:var(--win-line);background:transparent!important}
:root .ue2-profile-icon{width:30px;height:30px;border-radius:9px;background:var(--win-accent)!important;color:#fff!important}
:root .ue2-sidebar-foot strong{color:var(--win-text);font-size:11px}
:root .ue2-sidebar-foot small{color:var(--win-muted)!important}
:root #titlebar{min-height:64px!important;padding:12px 22px!important;gap:10px;background:var(--win-panel)!important;border-bottom:1px solid var(--win-line)!important}
:root .ue2-search-wrap{height:36px;max-width:430px;padding:0 11px;background:var(--win-bg)!important;border:1px solid var(--win-line)!important;box-shadow:none!important;border-radius:9px;color:var(--win-muted)!important}
:root #ue2-search{font-size:12px;color:var(--win-text)!important}
:root #ue2-search::placeholder{color:var(--win-muted)!important}
:root .ue2-top-actions{gap:6px}
:root .ue2-top-btn,:root #ue152-language{border:1px solid var(--win-line)!important;background:var(--win-panel)!important;color:var(--win-accent)!important;padding:9px 11px!important;border-radius:9px;font-weight:600;font-size:11px;box-shadow:none}
:root #ue152-language{height:34px!important}
:root .ue2-top-btn:hover,:root #ue152-language:hover{background:var(--win-selected)!important;border-color:var(--win-accent)!important}
:root .ue-win-theme{display:flex;align-items:center;gap:6px;border-radius:20px;color:var(--win-muted);font-size:10px;white-space:nowrap}
:root .ue-win-controller{margin-right:auto;color:var(--win-muted);font-size:11px;display:flex;align-items:center;gap:8px}
:root #system-header{padding:18px 22px 10px!important}
:root .ue2-breadcrumb{display:none}
:root #system-title{color:var(--win-text)!important;-webkit-text-fill-color:var(--win-text)!important;font-size:clamp(25px,2.4vw,34px)!important;letter-spacing:-.045em}
:root #system-core-info{color:var(--win-muted)!important;font-size:11px!important}
:root #ue2-config-details{margin-top:9px;background:var(--win-panel)!important;border-color:var(--win-line)!important}
:root #ue2-config-details>summary{color:var(--win-muted);font-size:10px;padding:6px 10px}
:root .ue2-config-hint{color:var(--win-muted)}
:root .ue2-config-rows,:root .ue2-config-row{border-color:var(--win-line)!important}
:root .ue2-config-row,:root .ue2-config-row strong{color:var(--win-text)!important}
:root #action-bar{padding:13px 22px!important;gap:9px!important;min-height:54px;flex-wrap:wrap!important}
:root .ue2-count-label{color:var(--win-text)!important;font-size:15px!important;text-transform:none;letter-spacing:-.02em!important}
:root .ue2-toggle{border:1px solid var(--win-line);background:var(--win-panel);border-radius:10px;padding:3px}
:root .ue2-view-btn{display:flex;justify-content:center;align-items:center;width:auto;min-width:36px;gap:5px;padding:5px 8px;height:29px;border-radius:7px;color:var(--win-muted)}
:root .ue2-view-btn.active{background:var(--win-accent)!important;color:#fff!important}
:root .ue2-view-label{display:inline;font-size:10px}
:root #btn-play,:root .ue2-play-primary{background:var(--win-accent)!important;border:1px solid var(--win-accent)!important;color:#fff!important;border-radius:9px!important;box-shadow:0 4px 12px #0878f91c!important}
:root #btn-play:hover:not(:disabled),:root .ue2-play-primary:hover{background:#086be3!important;color:#fff!important}
:root .ue2-play-primary .ue2-ico,:root .ue2-play-primary svg{color:#000!important;fill:#000!important;stroke:#000!important;stroke-width:1.8!important;width:22px!important;height:22px!important;flex:0 0 22px}
:root .ue2-play-primary{gap:10px!important;font-weight:850!important}
:root #btn-play:disabled{background:var(--win-soft)!important;border-color:var(--win-line)!important;color:var(--win-muted)!important}
:root #rom-list{background:transparent!important;padding:2px 22px 25px!important;scrollbar-color:var(--win-line) transparent}
:root #rom-list.ue2-game-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))!important;gap:17px!important;align-content:start}
:root .ue2-card{background:transparent!important;border:2px solid transparent!important;border-radius:10px;box-shadow:none!important;transition:background .15s,border-color .15s,transform .15s}
:root .ue2-card:hover{background:var(--win-panel)!important;border-color:var(--win-line)!important;transform:translateY(-2px)}
:root .ue2-card.selected,:root .ue2-card.ue9-multi-selected{background:var(--win-selected)!important;border-color:var(--win-accent)!important;box-shadow:0 0 0 2px #0878f92a!important;outline:none!important}
:root .ue2-art{background:var(--win-panel)!important;border-radius:8px;overflow:hidden}
:root .ue2-game-grid .ue2-art{aspect-ratio:3/4}
:root .ue2-art img{object-fit:contain;background:var(--win-panel)}
:root .ue2-art:after{display:none}
:root .ue2-art-empty{background:linear-gradient(150deg,var(--win-soft),var(--win-panel));color:var(--win-accent)!important}
:root .ue2-art-logo,:root .ue2-art-monogram{color:var(--win-accent)!important}
:root .ue2-art-platform{color:var(--win-muted)!important}
:root .ue2-card-footer{padding:9px 5px 10px;min-height:52px;align-items:start}
:root .ue2-card-footer h3{color:var(--win-text)!important;font-size:12px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.25}
:root .ue2-card-footer p{color:var(--win-muted)!important;font-size:10px;margin-top:4px}
:root .ue2-card-footer>.ue2-ico{display:none}
:root .ue2-favorite{background:#14213bd6;color:white;border:1px solid #ffffff66;right:6px;top:6px;width:26px;height:26px}
:root .ue2-favorite.is-favorite{color:#ffd34e;background:#14213be6}
:root .ue2-favorite.is-favorite svg{fill:#ffd34e}
:root .ue2-game-list .ue2-card{background:var(--win-panel)!important;border-color:var(--win-line)!important;min-height:80px;padding:5px}
:root .ue2-game-list .ue2-art{aspect-ratio:1;width:74px;flex:0 0 74px;height:74px}
:root .ue2-art-large{aspect-ratio:3/4!important;max-height:310px;border-color:var(--win-line);border-radius:10px;box-shadow:var(--win-shadow)}
:root .ue2-right-title{font-size:10px;letter-spacing:.08em;margin-bottom:14px;color:var(--win-muted)!important}
:root .ue2-detail-eyebrow{display:none}
:root .ue2-detail-name{color:var(--win-text)!important;font-size:18px;margin-top:14px!important}
:root .ue2-detail-system,:root .ue2-detail-footnote,:root .ue2-recent-empty,:root .ue2-recent-row,:root .ue2-recent-panel h3{color:var(--win-muted)!important}
:root .ue2-action{background:var(--win-panel)!important;color:var(--win-text)!important;border-color:var(--win-line)!important}
:root .ue2-action:hover{background:var(--win-selected)!important}
:root .ue2-detail-row{border:0;padding:5px 0;font-size:11px;align-items:baseline}
:root .ue2-detail-row span{color:var(--win-muted)!important}
:root .ue2-detail-row strong{color:var(--win-text)!important;font-weight:500;overflow-wrap:anywhere}
:root .ue2-detail-stats>div{background:var(--win-panel)!important;border:1px solid var(--win-line)}
:root .ue2-detail-stats strong,:root .ue2-detail-placeholder h3{color:var(--win-text)!important}
:root .ue2-detail-stats span,:root .ue2-detail-placeholder p{color:var(--win-muted)!important}
:root .ue2-detail-placeholder{background:var(--win-panel);border-color:var(--win-line);color:var(--win-accent)}
:root .ue2-recent-panel{border-color:var(--win-line);padding-top:15px;margin-top:20px}
:root #status-bar{background:var(--win-bg)!important;border-color:var(--win-line)!important;color:var(--win-muted)!important;height:27px!important;font-size:10px!important}
:root #status-bar.status-success{color:#217347!important}:root[data-ue-theme=dark] #status-bar.status-success{color:#78dca6!important}
:root #status-bar.status-error{color:#be2940!important}:root[data-ue-theme=dark] #status-bar.status-error{color:#ff9ba7!important}
:root .ue-win-hero{position:relative;isolation:isolate;flex-shrink:0;height:clamp(180px,24vh,270px);margin:5px 22px 0;border-radius:15px;overflow:hidden;display:flex;align-items:center;background:#172f50;color:white;box-shadow:var(--win-shadow)}
:root .ue-win-hero-backdrop{position:absolute;inset:-35%;z-index:-2;opacity:.42;filter:blur(20px);transform:scale(1.1)}
:root .ue-win-hero-backdrop img{width:100%;height:100%;object-fit:cover}
:root .ue-win-hero:after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,#081426ee 0%,#101e34a6 53%,#0d203466 100%)}
:root .ue-win-hero-copy{padding:24px 28px;min-width:0;flex:1}
:root .ue-win-hero-platform{display:inline-block;border:1px solid #ffffff35;background:#ffffff20;border-radius:6px;padding:4px 9px;font-size:10px;color:#fff}
:root .ue-win-hero h2{color:#fff;font-size:clamp(24px,2.5vw,39px);letter-spacing:-.04em;line-height:1.1;margin:10px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
:root .ue-win-hero-meta{display:flex;flex-wrap:wrap;gap:7px 16px;color:#e4ebf7;font-size:11px;line-height:1.5;min-height:17px}
:root .ue-win-hero-meta span{display:flex;align-items:center;gap:6px}
:root .ue-win-hero-actions{display:flex;gap:9px;align-items:center;margin-top:18px}
:root .ue-win-hero-actions button{width:auto;margin:0;padding:10px 16px;font-size:12px}
:root .ue-win-hero-actions .ue2-action{background:#ffffff24!important;border-color:#ffffff45!important;color:white!important;flex:none}
:root .ue-win-hero-cover{height:86%;width:25%;max-width:210px;margin-right:30px;flex-shrink:0;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 12px 15px #0006)}
:root .ue-win-hero-cover img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px}
:root .ue-win-hero-cover .ue2-art-empty{background:transparent!important;box-shadow:none}
:root .ue-win-hero-cover .ue2-art-platform,:root .ue-win-hero-cover .ue2-art-monogram{display:none}
:root .ue-win-hero-cover .ue2-art-logo{color:#ffffff99!important}
:root .ue-win-hero [hidden]{display:none!important}
:root button:focus-visible,:root input:focus-visible,:root select:focus-visible,:root .ue2-card:focus-visible{outline:2px solid var(--win-accent)!important;outline-offset:3px!important}
:root .ue2-more{background:var(--win-panel);color:var(--win-accent);border-color:var(--win-line)}
:root .ue2-empty h3{color:var(--win-text)}:root .ue2-empty p{color:var(--win-muted)}
:root #ue2-context-menu,:root #ue9-context-menu{background:var(--win-panel)!important;color:var(--win-text)!important;border-color:var(--win-line)!important;box-shadow:var(--win-shadow)}
:root #ue2-context-menu button,:root #ue9-context-menu button{color:var(--win-text)!important}
:root #ue2-context-menu button:hover,:root #ue9-context-menu button:hover{background:var(--win-soft)!important}
:root .ue10-panel,:root .ue8-panel,:root .ue6-panel,:root .v5-panel,:root #ue-about-dialog,:root #ue-mame-turbo,:root #ue-retro-turbo{background:var(--win-panel)!important;color:var(--win-text)!important;border-color:var(--win-line)!important}
:root .ue10-panel p,:root .ue10-help,:root #ue-about-dialog dt,:root #ue-about-dialog dd,:root #ue-about-title,:root #ue-mame-turbo p,:root #ue-retro-turbo p{color:var(--win-text)!important}
:root .ue10-btn,:root .ue10-key,:root .ue10-select,:root .ue8-tab,:root .ue8-chip,:root .ue8-input,:root .v5-action,:root .v5-secondary,:root #ue-about-dialog button,:root #ue-mame-turbo button,:root #ue-mame-turbo select,:root #ue-retro-turbo button,:root #ue-retro-turbo select{background:var(--win-soft)!important;color:var(--win-text)!important;border-color:var(--win-line)!important}
:root .ue10-btn.active,:root .ue10-key.active,:root .ue10-key.armed{background:var(--win-selected)!important;border-color:var(--win-accent)!important}
:root .ue10-key small{color:var(--win-muted)!important}
@media(min-width:1650px){:root #body{grid-template-columns:250px minmax(0,1fr) 300px!important}:root #rom-list.ue2-game-grid{grid-template-columns:repeat(auto-fill,minmax(165px,1fr))!important}}
@media(max-width:1190px){:root #body{grid-template-columns:198px minmax(0,1fr) 240px!important}:root #titlebar{padding:11px 17px!important}:root #titlebar .ue2-top-btn>span:not(.ue2-ico){display:none}:root #system-header{padding:16px 17px 9px!important}:root #action-bar{padding:10px 17px!important}:root .ue-win-hero{margin-left:17px;margin-right:17px}:root .ue-win-hero-copy{padding:19px}:root .ue-win-hero-cover{margin-right:18px;width:26%}:root #rom-list{padding-left:17px!important;padding-right:17px!important}:root #rom-list.ue2-game-grid{grid-template-columns:repeat(auto-fill,minmax(125px,1fr))!important}:root .ue-win-theme span{display:none}}
@media(max-width:950px){:root #body{grid-template-columns:175px minmax(0,1fr)!important}:root #ue2-right{display:none!important}:root .ue2-logo{padding:20px 12px 15px;gap:8px}:root .ue2-logo strong{font-size:13px}:root .ue2-logo small{font-size:9px}:root .ue-win-hero{height:190px}:root .ue-win-controller{display:none}}
@media(max-height:700px){:root .ue-win-hero{height:155px}:root .ue-win-hero h2{font-size:26px;margin:7px 0}:root .ue-win-hero-copy{padding:15px 22px}:root .ue-win-hero-actions{margin-top:11px}:root #system-header{padding-top:12px!important}:root .ue-win-hero-platform{display:none}}
@media(max-width:680px){:root #body{grid-template-columns:65px minmax(0,1fr)!important}:root .ue2-console-search,:root .ue2-side-heading,:root .ue-win-system-count,:root .system-btn-dot,:root .ue2-sidebar-foot,:root .ue2-logo>div:last-child{display:none!important}:root .ue2-logo{padding:18px 0;justify-content:center}:root #ue2-system-list{padding:0 6px}:root .system-btn .ue-win-system-icon{margin:auto}:root #titlebar{padding:10px!important;gap:6px}:root .ue-win-theme{display:none!important}:root #system-header{padding:12px 12px 8px!important}:root #ue22-manual-scan{display:none}:root .ue-win-hero{margin:4px 12px 0;height:165px}:root .ue-win-hero-copy{padding:16px}:root .ue-win-hero h2{font-size:24px}:root .ue-win-hero-cover{margin-right:12px;width:23%}:root .ue-win-hero-meta span:nth-child(n+2){display:none}:root #action-bar{padding:9px 12px!important}:root #btn-refresh-library{display:none}:root #rom-list{padding:4px 12px 20px!important}:root #rom-list.ue2-game-grid{grid-template-columns:repeat(auto-fill,minmax(125px,1fr))!important}}
@media(prefers-reduced-motion:reduce){:root *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
@media(forced-colors:active){:root .ue2-card.selected,:root .system-btn.active{outline:2px solid Highlight!important}:root .ue-win-hero{border:1px solid CanvasText}}

:root #ue2-config-details{display:none!important}
:root .system-btn[hidden]{display:none!important}
:root .ue-win-hero[hidden]{display:none!important}

:root .ue-win-hero-cover:has(img)>svg,:root .ue-win-hero-cover:has(img)>.ue2-ico{display:none}
:root .ue-win-hero-cover img{background:transparent}
:root .ue-win-hero-backdrop img{background:transparent}
:root #ue-v5-mame .v5-panel{background:var(--win-panel)!important;color:var(--win-text)!important;border-color:var(--win-line)!important}
:root #ue-v5-mame p,:root #ue-v5-mame h2{color:var(--win-text)!important}
:root #ue-v5-mame button,:root #ue-v5-mame select,:root #ue-v5-mame input{background:var(--win-soft)!important;color:var(--win-text)!important;border-color:var(--win-line)!important}
:root #ue-v5-mame .v5-tab[aria-selected=true]{background:var(--win-selected)!important;border-color:var(--win-accent)!important}

/* Keep titles, actions and icons usable in snapped Windows layouts. */
:root .ue2-logo strong{color:var(--win-text)!important;overflow-wrap:normal;word-break:normal}
:root .ue2-logo>div:last-child{min-width:0}
:root .ue2-logo-icon{display:grid!important;place-items:center!important;flex:0 0 44px;width:44px;height:44px;padding:0;line-height:1}
:root .ue2-logo-icon .ue2-ico,:root .ue2-logo-icon span:last-child{display:flex!important;align-items:center;justify-content:center;width:29px;height:29px;margin:0!important;padding:0!important;position:static!important;color:var(--win-accent)!important;font-size:inherit}
:root .ue2-logo-icon svg{display:block;width:29px;height:29px;flex:none;margin:0;transform:none}
:root #titlebar .ue2-top-btn>.ue2-ico{display:inline-flex!important;align-items:center;justify-content:center;flex:0 0 18px;width:18px;height:18px;margin:0;line-height:1}
:root #titlebar .ue2-top-btn>.ue2-ico svg{display:block;width:18px;height:18px;flex:none}
:root #titlebar .ue2-top-btn{min-width:36px;min-height:36px;flex-shrink:0}
:root .ue2-search-wrap{min-width:140px}
:root .ue2-systems-heading{gap:8px;align-items:baseline;flex-wrap:wrap;line-height:1.5}
:root .ue2-systems-heading span{flex-shrink:0;white-space:nowrap}
:root .ue-win-hero{height:auto;min-height:210px;display:grid;grid-template-columns:minmax(0,1fr) minmax(90px,24%);align-items:stretch;container-type:inline-size}
:root .ue-win-hero-copy{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:9px;padding:22px 25px;min-width:0;overflow:hidden}
:root .ue-win-hero-platform{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0}
:root .ue-win-hero h2{width:100%;min-width:0;font-size:clamp(23px,2.4vw,34px);line-height:1.15;margin:0;overflow-wrap:anywhere;word-break:normal;-webkit-line-clamp:2;flex-shrink:0}
:root .ue-win-hero-meta{width:100%;min-height:0;gap:5px 13px;line-height:1.45;flex-shrink:0}
:root .ue-win-hero-meta span{min-width:0;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block}
:root .ue-win-hero-meta .ue2-ico{display:inline-flex;vertical-align:middle;margin-right:4px}
:root .ue-win-hero-actions{margin-top:4px;flex-wrap:wrap;flex-shrink:0;gap:8px;max-width:100%}
:root .ue-win-hero-actions button{min-height:36px;white-space:nowrap;font-size:12px;padding:9px 13px;flex:none}
:root .ue-win-hero-cover{height:auto;width:auto;min-width:0;align-self:stretch;margin:18px 22px 18px 0;max-width:none;overflow:hidden}
:root .ue-win-hero-cover img{width:100%;height:100%;max-height:190px;object-fit:contain;align-self:center}
:root .ue2-card-footer h3,:root .ue2-detail-name{overflow-wrap:anywhere}
:root .ue22-title-line{min-width:0;gap:12px}
:root .ue2-heading-row>div{min-width:0;width:100%}
:root #system-title{min-width:0;overflow-wrap:anywhere}
@container(max-width:520px){.ue-win-hero-cover{display:none!important}.ue-win-hero-copy{grid-column:1/-1;padding:20px!important}.ue-win-hero h2{font-size:27px!important}}
@media(max-width:1190px){:root #titlebar .ue2-top-btn{padding:8px!important;border-radius:9px!important}:root .ue-win-hero-copy{padding:20px}:root .ue-win-hero-cover{margin:16px 18px 16px 0}}
@media(max-width:950px){:root #titlebar{flex-wrap:wrap!important;gap:9px!important}:root #titlebar .ue2-search-wrap{flex:1 1 100%;width:100%;max-width:none}:root .ue2-top-actions{width:100%;justify-content:flex-end;flex-wrap:wrap}:root #titlebar .ue2-top-btn>span:not(.ue2-ico){display:inline!important}:root #titlebar .ue2-top-btn{gap:6px;padding:8px 10px!important}:root .ue-win-theme{display:none!important}:root .ue-win-hero{min-height:205px}:root #ue-about-button{display:flex!important}}
@media(max-width:680px){:root .ue2-logo{padding:16px 0!important}:root .ue2-logo-icon{flex-basis:38px;width:38px;height:38px;border-radius:12px}:root .ue-win-hero{min-height:190px}:root .ue-win-hero h2{font-size:25px}:root .ue-win-hero-platform{display:inline-block}:root .ue-win-hero-cover{display:none}:root .ue-win-hero-copy{grid-column:1/-1;padding:17px}:root .ue-win-hero-meta span:nth-child(n+2){display:inline-block}:root #ue22-manual-scan{display:none}:root #titlebar .ue2-top-btn{font-size:10px}:root .ue2-logo small{display:none}}
@media(max-height:600px){:root .ue-win-hero{min-height:165px}:root .ue-win-hero-copy{padding:15px 20px;gap:7px}:root .ue-win-hero h2{font-size:25px!important}:root .ue-win-hero-platform{display:none}:root .ue-win-hero-cover img{max-height:140px}}
@media(max-height:500px){:root .ue-win-hero{display:none!important}}
:root .ue2-detail-name{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}

@media(min-width:681px) and (max-width:950px){:root #body{grid-template-columns:210px minmax(0,1fr)!important}:root .system-btn-name{white-space:normal!important;overflow-wrap:normal;line-height:1.3}:root .ue2-logo strong{font-size:13px}}
@media(max-width:950px){:root #action-bar #btn-play{display:none!important}:root .ue2-top-actions #ue152-language{flex-shrink:0}:root .ue2-top-actions{align-items:center;justify-content:flex-end}}
/* Compact library spacing complements the 85% window scale. */
:root #titlebar{min-height:54px!important;padding-top:8px!important;padding-bottom:8px!important}
:root #system-header{padding-top:12px!important;padding-bottom:7px!important}
:root #system-title{font-size:clamp(23px,2.1vw,29px)!important}
:root #action-bar{padding-top:8px!important;padding-bottom:8px!important;min-height:44px}
:root #rom-list.ue2-game-list{gap:7px!important}
:root .ue2-game-list .ue2-card{min-height:64px!important;padding:4px!important}
:root .ue2-game-list .ue2-art{width:56px!important;flex:0 0 56px!important;height:56px!important}
:root .ue2-game-list .ue2-card-footer{padding-top:5px!important;padding-bottom:5px!important;min-height:0!important}
:root .ue2-logo{padding-top:17px!important;padding-bottom:12px!important;min-height:70px}
:root #ue2-system-list .system-btn{padding-top:6px!important;padding-bottom:6px!important;min-height:32px}
:root .ue2-sidebar-foot{padding-top:10px!important;padding-bottom:10px!important}
:root .ue-win-hero{min-height:175px!important}
:root .ue-win-hero-copy{padding-top:16px!important;padding-bottom:16px!important;gap:7px}
:root .ue-win-hero-cover img{max-height:155px}
:root .ue2-art-large{max-height:250px!important}
`;document.head.append(ueWindowsPresentationStyle);
const ueLargeScrollStyle=document.createElement('style');ueLargeScrollStyle.id='ue-large-scrollbars';ueLargeScrollStyle.textContent=String.raw`#ue2-system-list,#rom-list{scrollbar-width:auto;scrollbar-color:#5b6f89 #151b24}#ue2-system-list::-webkit-scrollbar,#rom-list::-webkit-scrollbar{width:12px;height:12px}#ue2-system-list::-webkit-scrollbar-track,#rom-list::-webkit-scrollbar-track{background:#151b24;border-radius:999px}#ue2-system-list::-webkit-scrollbar-thumb,#rom-list::-webkit-scrollbar-thumb{background:#5b6f89;border:3px solid #151b24;border-radius:999px}#ue2-system-list::-webkit-scrollbar-thumb:hover,#rom-list::-webkit-scrollbar-thumb:hover{background:#7d9bc2}`;document.head.append(ueLargeScrollStyle);
const ueReadableGalleryStyle=document.createElement('style');ueReadableGalleryStyle.id='ue-readable-gallery-style';ueReadableGalleryStyle.textContent=String.raw`
:root body,:root button,:root input,:root select{font-family:'Segoe UI Variable','Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
:root .system-btn-name{font-size:13px!important;font-weight:400!important;letter-spacing:normal;line-height:1.25;white-space:normal!important;overflow-wrap:normal!important;text-overflow:clip!important;color:var(--win-text)!important}
:root #ue2-system-list .system-btn{min-height:39px!important;padding:8px 10px!important}
:root .ue2-nav-btn{font-size:13px!important;font-weight:650}
:root #ue2-search,:root .ue2-top-btn,:root #ue152-language{font-size:12px!important}
:root #system-core-info{font-size:12px!important;line-height:1.45}
:root .ue2-card-footer h3{font-size:13px!important;line-height:1.3}
:root .ue2-card-footer p{font-size:11px!important;line-height:1.35}
:root .ue2-detail-name{font-size:19px!important;line-height:1.25}
:root .ue2-detail-row{font-size:12px!important;line-height:1.35}
:root .ue2-settings-btn[hidden]{display:none!important}
:root #titlebar{flex-wrap:wrap!important;align-content:center}
:root .ue2-search-wrap{flex:1 1 360px;max-width:none}
:root .ue2-top-actions{flex:1 1 auto;justify-content:flex-end;flex-wrap:wrap}
:root .ue2-top-actions>.ue-win-theme{order:1}
:root .ue2-top-actions>.ue2-scan-btn{order:10}
:root .ue2-top-actions>.ue2-settings-btn{order:20}
:root .ue2-top-actions>#ue152-language{order:30}
:root .ue2-top-actions>#ue-about-button{order:1000}

/* Cover opens as a focused presentation layer instead of another in-page list. */
:root body.ue-gallery-active{overflow:hidden!important}
:root #ue-cover-gallery{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:28px;background:rgba(5,9,16,.78);backdrop-filter:blur(18px) saturate(.78);animation:ue-gallery-in .18s ease-out}
:root .ue-gallery-backdrop{position:absolute;inset:0;background:radial-gradient(circle at 50% 35%,rgba(37,76,125,.27),transparent 48%),linear-gradient(135deg,rgba(4,7,12,.86),rgba(13,18,29,.97));cursor:pointer}
:root .ue-gallery-shell{position:relative;z-index:1;width:min(820px,92vw);height:min(720px,90vh);min-height:470px;display:grid;grid-template-columns:74px minmax(0,1fr) 74px;grid-template-rows:50px minmax(0,1fr) auto auto;align-items:center;gap:0 14px;padding:18px 22px 24px;border:1px solid rgba(164,195,235,.28);border-radius:26px;background:linear-gradient(145deg,rgba(30,42,62,.98),rgba(13,20,32,.98));box-shadow:0 30px 110px rgba(0,0,0,.62),0 0 0 1px rgba(255,255,255,.04) inset}
:root .ue-gallery-top{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:16px}
:root .ue-gallery-kicker{font-size:12px;font-weight:800;letter-spacing:.16em;color:#d8e7fb}
:root .ue-gallery-close{display:grid;place-items:center;width:36px;height:36px;border:1px solid rgba(191,211,240,.25);border-radius:11px;background:rgba(255,255,255,.06);color:#e9f2ff;cursor:pointer}
:root .ue-gallery-close:hover{background:rgba(93,153,245,.28);border-color:#70aaff}
:root .ue-gallery-stage{position:relative;grid-column:2;grid-row:2;min-width:0;min-height:0;height:100%;display:flex;align-items:center;justify-content:center;padding:12px 18px}
:root .ue-gallery-stage:before{content:'';position:absolute;inset:10% 15%;border-radius:50%;background:radial-gradient(ellipse,rgba(86,147,232,.25),transparent 68%);filter:blur(26px);pointer-events:none}
:root .ue-gallery-art{position:relative;z-index:1;width:min(360px,70%);height:min(510px,100%);aspect-ratio:3/4!important;border:1px solid rgba(205,226,255,.38);border-radius:18px!important;background:rgba(7,12,21,.86)!important;box-shadow:0 25px 45px rgba(0,0,0,.48),0 0 0 8px rgba(255,255,255,.035);cursor:pointer;overflow:hidden}
:root .ue-gallery-art img{width:100%;height:100%;object-fit:contain!important;background:transparent!important}
:root .ue-gallery-art .ue2-art-empty{background:linear-gradient(145deg,#263c5a,#101827)!important;color:#cde3ff!important}
:root .ue-gallery-art .ue2-art-monogram{font-size:38px;color:#d7e8ff!important}
:root .ue-gallery-arrow{display:grid;place-items:center;grid-row:2;width:52px;height:52px;border:1px solid rgba(190,215,247,.28);border-radius:50%;background:rgba(255,255,255,.07);color:#dcecff;cursor:pointer;transition:transform .15s,background .15s}
:root .ue-gallery-arrow:hover{background:#438fff;transform:scale(1.08)}
:root .ue-gallery-prev{grid-column:1}.ue-gallery-prev .ue2-ico{transform:rotate(180deg)}:root .ue-gallery-next{grid-column:3}
:root .ue-gallery-info{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:6px;text-align:center}
:root .ue-gallery-platform{font-size:11px;font-weight:800;letter-spacing:.13em;color:#78b1ff;text-transform:uppercase}
:root .ue-gallery-title{max-width:90%;font-size:clamp(21px,3vw,31px);line-height:1.18;font-weight:850;color:#f5f8ff;overflow-wrap:anywhere}
:root .ue-gallery-counter{font-size:12px;color:#9eacc2}
:root .ue-gallery-actions{grid-column:1/-1;display:flex;justify-content:center;margin-top:15px}
:root .ue-gallery-play{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-width:164px;padding:12px 20px;border:1px solid #5ea1ff;border-radius:12px;background:#438fff;color:#fff;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 8px 24px rgba(33,111,220,.28)}
:root .ue-gallery-play:hover{background:#6aaeff;transform:translateY(-1px)}
:root #ue-cover-gallery button:focus-visible{outline:2px solid #b9dcff;outline-offset:3px}
@keyframes ue-gallery-in{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:scale(1)}}
@media(max-width:620px){:root #ue-cover-gallery{padding:10px}:root .ue-gallery-shell{width:96vw;height:92vh;min-height:420px;padding:14px 10px 20px;grid-template-columns:48px minmax(0,1fr) 48px;gap:0 5px}:root .ue-gallery-art{width:min(290px,88%);height:min(430px,100%)}:root .ue-gallery-arrow{width:42px;height:42px}:root .ue-gallery-title{font-size:22px}:root .ue-gallery-kicker{font-size:10px}}
`;document.head.append(ueReadableGalleryStyle);
const ueMonochromeCoverflowStyle=document.createElement('style');ueMonochromeCoverflowStyle.id='ue-monochrome-coverflow-style';ueMonochromeCoverflowStyle.textContent=String.raw`
/* Monochrome Windows presentation: keep the covers colorful, make the chrome quiet. */
:root,:root[data-ue-theme=dark],:root[data-ue-theme=light]{
 color-scheme:dark!important;
 --win-bg:#101010!important;--win-panel:#191919!important;--win-sidebar:#151515!important;--win-soft:#242424!important;
 --win-text:#f1f1f1!important;--win-muted:#a4a4a4!important;--win-line:#3d3d3d!important;--win-accent:#949494!important;
 --win-selected:#303030!important;--win-shadow:0 12px 38px #000b!important;--ue2-line:#3d3d3d!important;--ue2-text:#f1f1f1!important;--ue2-muted:#a4a4a4!important
}
:root body,:root #root,:root #app,:root .ue2-app,:root #main,:root #sidebar,:root #ue2-right{background:#101010!important;color:#f1f1f1!important}
:root #sidebar{background:#151515!important;border-color:#303030!important}
:root #titlebar,:root #system-header,:root #action-bar{background:#181818!important;border-color:#383838!important}
:root .ue2-nav-btn,:root .system-btn,:root .ue2-top-btn,:root .ue2-view-btn,:root .ue-win-theme{background:#202020!important;border-color:#3d3d3d!important;color:#d6d6d6!important}
:root .ue2-nav-btn.active,:root .system-btn.active,:root .ue2-view-btn.active,:root .ue2-top-btn:hover{background:#707070!important;border-color:#a5a5a5!important;color:#fff!important}
:root .ue2-nav-btn .ue2-ico,:root .ue-win-system-icon,:root .ue2-logo-icon,:root .ue2-ico{color:#bdbdbd!important}
:root .system-btn-dot:not([data-health]){background:#a6a6a6!important;box-shadow:none!important}
:root .ue2-card{background:#1d1d1d!important;border-color:#363636!important;color:#eee!important}
:root .ue2-card:hover{background:#272727!important;border-color:#858585!important}
:root .ue2-card.selected,:root .ue2-card.ue9-multi-selected{background:#303030!important;border-color:#b8b8b8!important;box-shadow:inset 4px 0 #b8b8b8,0 0 0 1px #b8b8b866!important}
:root .ue2-card:focus-visible{outline:3px solid #d0d0d0!important;outline-offset:3px}
:root .ue2-card.selected .ue2-card-footer h3,:root .ue2-card:focus-visible .ue2-card-footer h3{color:#fff!important}
:root .ue2-card-footer p,:root .ue2-detail-eyebrow,:root .ue2-detail-system,:root .ue2-detail-footnote,:root .ue2-count-label{color:#a9a9a9!important}
:root .ue2-favorite.is-favorite{color:#ededed!important;background:#4c4c4c!important}
:root .ue-win-hero{background:#222!important;border-color:#464646!important}
:root .ue-win-hero:after{background:linear-gradient(135deg,#111e,#222c)!important}
:root .ue-win-hero-platform{color:#c5c5c5!important}
:root .ue2-art-empty{background:linear-gradient(145deg,#393939,#171717)!important;color:#d0d0d0!important}
:root #ue2-search,:root #ue152-language,:root input,:root select{background:#202020!important;border-color:#4b4b4b!important;color:#f1f1f1!important}
:root #rom-list,:root #ue2-system-list{scrollbar-color:#777 #171717!important}
:root #rom-list::-webkit-scrollbar,:root #ue2-system-list::-webkit-scrollbar{width:14px;height:14px}
:root #rom-list::-webkit-scrollbar-track,:root #ue2-system-list::-webkit-scrollbar-track{background:#171717}
:root #rom-list::-webkit-scrollbar-thumb,:root #ue2-system-list::-webkit-scrollbar-thumb{background:#777;border:3px solid #171717;border-radius:999px}
:root #rom-list::-webkit-scrollbar-thumb:hover,:root #ue2-system-list::-webkit-scrollbar-thumb:hover{background:#aaa}

/* Super Cover / iTunes Cover Flow */
:root #ue-cover-gallery{background:#050505e8!important;backdrop-filter:blur(20px) saturate(.55)!important}
:root .ue-gallery-backdrop{background:radial-gradient(ellipse at 50% 36%,#34343455,transparent 52%),linear-gradient(135deg,#050505f2,#111111fa)!important}
:root .ue-gallery-shell{width:min(1120px,96vw)!important;height:min(780px,92vh)!important;min-height:520px!important;padding:18px 24px 24px!important;grid-template-columns:1fr!important;grid-template-rows:48px minmax(0,1fr) auto auto auto!important;gap:0!important;border:1px solid #555!important;border-radius:18px!important;background:linear-gradient(180deg,#242424f7,#111111fa)!important;box-shadow:0 35px 120px #000d,0 0 0 1px #fff1 inset!important}
:root .ue-gallery-top{grid-column:1!important;grid-row:1!important}
:root .ue-gallery-kicker{font-size:12px!important;letter-spacing:.2em!important;color:#dedede!important}
:root .ue-gallery-close{border-color:#666!important;background:#2a2a2a!important;color:#f4f4f4!important}
:root .ue-gallery-close:hover{background:#5d5d5d!important;border-color:#aaa!important}
:root .ue-gallery-stage{grid-column:1!important;grid-row:2!important;height:100%!important;min-height:330px!important;padding:0!important;overflow:hidden!important}
:root .ue-gallery-stage:before{inset:25% 20% 12%!important;background:radial-gradient(ellipse,#bebebe23,transparent 68%)!important;filter:blur(32px)!important}
:root .ue-coverflow-track{position:absolute!important;inset:0!important;display:block!important;overflow:hidden!important;perspective:1200px!important;isolation:isolate!important}
:root .ue-coverflow-item{position:absolute!important;left:50%!important;top:50%!important;width:clamp(150px,19vw,270px)!important;height:clamp(210px,42vh,390px)!important;transform:translate(-50%,-50%) scale(.68)!important;aspect-ratio:3/4!important;border:1px solid #8b8b8b!important;border-radius:4px!important;background:#202020!important;box-shadow:0 22px 38px #000b,0 0 0 1px #fff1!important;opacity:.28!important;overflow:hidden!important;cursor:pointer!important;transition:transform .24s ease,opacity .24s ease,filter .24s ease!important;-webkit-box-reflect:below 14px linear-gradient(transparent 58%,#fff2 100%)!important}
:root .ue-coverflow-item img{width:100%!important;height:100%!important;object-fit:contain!important;background:#111!important}
:root .ue-coverflow-item[data-offset="-2"]{transform:translate(-50%,-50%) translateX(clamp(-520px,-39vw,-300px)) rotateY(42deg) scale(.62)!important;z-index:1!important;filter:brightness(.6)!important}
:root .ue-coverflow-item[data-offset="-1"]{transform:translate(-50%,-50%) translateX(clamp(-280px,-22vw,-175px)) rotateY(30deg) scale(.82)!important;z-index:2!important;opacity:.68!important;filter:brightness(.78)!important}
:root .ue-coverflow-item[data-offset="0"]{transform:translate(-50%,-50%) scale(1)!important;z-index:5!important;opacity:1!important;filter:none!important;border-color:#e1e1e1!important;box-shadow:0 28px 54px #000d,0 0 0 2px #fff5!important}
:root .ue-coverflow-item[data-offset="1"]{transform:translate(-50%,-50%) translateX(clamp(175px,22vw,280px)) rotateY(-30deg) scale(.82)!important;z-index:2!important;opacity:.68!important;filter:brightness(.78)!important}
:root .ue-coverflow-item[data-offset="2"]{transform:translate(-50%,-50%) translateX(clamp(300px,39vw,520px)) rotateY(-42deg) scale(.62)!important;z-index:1!important;filter:brightness(.6)!important}
:root .ue-coverflow-item:hover{filter:brightness(1)!important}
:root .ue-gallery-arrow{position:absolute!important;top:50%!important;z-index:8!important;width:48px!important;height:48px!important;border:1px solid #777!important;background:#252525e8!important;color:#eee!important;box-shadow:0 8px 25px #0008!important}
:root .ue-gallery-arrow:hover{background:#777!important;border-color:#ddd!important;transform:scale(1.08)!important}
:root .ue-gallery-prev{left:16px!important}.ue-gallery-next{right:16px!important}
:root .ue-gallery-info{grid-column:1!important;grid-row:3!important;margin-top:16px!important;gap:5px!important}
:root .ue-gallery-platform{color:#bcbcbc!important}
:root .ue-gallery-title{color:#fff!important;font-size:clamp(20px,2.6vw,30px)!important}
:root .ue-gallery-counter{color:#999!important}
:root .ue-gallery-slider{grid-column:1!important;grid-row:4!important;width:min(720px,84%)!important;margin:16px auto 0!important;accent-color:#bdbdbd!important;cursor:pointer!important}
:root .ue-gallery-actions{grid-column:1!important;grid-row:5!important;margin-top:16px!important}
:root .ue-gallery-play{min-width:170px!important;border-color:#aaa!important;background:#6f6f6f!important;color:#fff!important;box-shadow:0 8px 25px #0008!important}
:root .ue-gallery-play:hover{background:#999!important}
:root #ue-cover-gallery button:focus-visible,:root #ue-cover-gallery input:focus-visible{outline:3px solid #f1f1f1!important;outline-offset:3px}
@media(max-width:720px){:root .ue-gallery-shell{width:96vw!important;height:92vh!important;min-height:460px!important;padding:14px 10px 20px!important}:root .ue-coverflow-item{width:clamp(128px,35vw,205px)!important;height:clamp(180px,37vh,300px)!important}:root .ue-coverflow-item[data-offset="-2"],:root .ue-coverflow-item[data-offset="2"]{opacity:.12!important}:root .ue-coverflow-item[data-offset="-1"]{transform:translate(-50%,-50%) translateX(-31vw) rotateY(28deg) scale(.72)!important}:root .ue-coverflow-item[data-offset="1"]{transform:translate(-50%,-50%) translateX(31vw) rotateY(-28deg) scale(.72)!important}:root .ue-gallery-arrow{width:40px!important;height:40px!important}.ue-gallery-prev{left:4px!important}.ue-gallery-next{right:4px!important}}
`;
document.head.append(ueMonochromeCoverflowStyle);
const ueLowPowerStyle=document.createElement('style');ueLowPowerStyle.id='ue-low-power-style';ueLowPowerStyle.textContent=String.raw`
/* Low-power mode: preserve the visual hierarchy without expensive per-frame effects. */
:root .ue2-card{transition:none!important;contain:layout paint;content-visibility:auto;contain-intrinsic-size:180px 180px}
:root .ue-win-hero-backdrop{filter:none!important;transform:none!important;opacity:.2!important}
:root #ue-cover-gallery{backdrop-filter:none!important;animation:none!important}
:root .ue-gallery-backdrop{background:#070707f5!important}
:root .ue-gallery-shell{box-shadow:0 18px 55px #000c,0 0 0 1px #fff1 inset!important}
:root .ue-coverflow-item{transition:none!important;filter:none!important;box-shadow:0 12px 24px #000a,0 0 0 1px #fff1!important;-webkit-box-reflect:none!important}
:root .ue-coverflow-item[data-offset="-1"],:root .ue-coverflow-item[data-offset="1"]{opacity:.62!important}
:root .ue-coverflow-item[data-offset="0"]{-webkit-box-reflect:below 10px linear-gradient(transparent 58%,#fff2 100%)!important}
:root .ue-coverflow-item{height:auto!important;max-height:78%!important;aspect-ratio:3/4!important}
:root .ue-coverflow-item[data-orientation="landscape"]{width:clamp(210px,28vw,360px)!important;height:auto!important;aspect-ratio:var(--art-ratio,1.333)!important}
:root .ue-coverflow-item[data-orientation="square"]{width:clamp(175px,22vw,300px)!important;height:auto!important;aspect-ratio:var(--art-ratio,1)!important}
:root .ue-coverflow-item[data-orientation="portrait"]{width:clamp(150px,19vw,270px)!important;height:auto!important;aspect-ratio:var(--art-ratio,.75)!important}
:root .ue-coverflow-item[data-offset="-1"][data-orientation="landscape"]{transform:translate(-50%,-50%) translateX(clamp(-320px,-25vw,-210px)) rotateY(30deg) scale(.82)!important}
:root .ue-coverflow-item[data-offset="1"][data-orientation="landscape"]{transform:translate(-50%,-50%) translateX(clamp(210px,25vw,320px)) rotateY(-30deg) scale(.82)!important}
:root .ue-coverflow-item[data-offset="-1"][data-orientation="square"]{transform:translate(-50%,-50%) translateX(clamp(-250px,-22vw,-175px)) rotateY(30deg) scale(.82)!important}
:root .ue-coverflow-item[data-offset="1"][data-orientation="square"]{transform:translate(-50%,-50%) translateX(clamp(175px,22vw,250px)) rotateY(-30deg) scale(.82)!important}
:root .ue-coverflow-item[data-offset="0"]{transform:translate(-50%,-50%) scale(1)!important}
:root .ue-coverflow-item img{object-fit:contain!important;background:#111!important}
`;
document.head.append(ueLowPowerStyle);
const ueFutureVisualStyle=document.createElement('style');ueFutureVisualStyle.id='ue-future-visual-style';ueFutureVisualStyle.textContent=String.raw`
/* Futuristic graphite presentation: restrained cyan accent, no heavy effects. */
:root[data-ue-theme=dark]{--win-bg:#090d12;--win-panel:#101820;--win-sidebar:#0b1117;--win-soft:#15232c;--win-text:#f3f8fa;--win-muted:#91a5ae;--win-line:#2b414c;--win-accent:#65d9ff;--win-selected:#163541;--win-shadow:0 10px 28px #0008}
:root[data-ue-theme=dark] #sidebar{background:linear-gradient(180deg,#0d151c 0%,#0a1016 55%,#0c151c 100%)!important;border-right:1px solid #2b414c!important}
:root[data-ue-theme=dark] .ue2-logo{background:linear-gradient(180deg,#111e27,#0d151c);border-bottom:1px solid #263b46;padding-top:21px!important;padding-bottom:18px!important}
:root[data-ue-theme=dark] .ue2-logo strong{font-size:15px!important;letter-spacing:.01em!important;color:#f4fbff!important;white-space:nowrap}
:root[data-ue-theme=dark] .ue2-logo small{font-size:10px!important;color:#8fa5af!important;letter-spacing:.02em!important}
:root[data-ue-theme=dark] .ue2-logo-icon{background:linear-gradient(145deg,#172d39,#0e1a22)!important;border:1px solid #355564;box-shadow:0 0 22px #4bd7ff1c!important;color:#8de4ff!important}
:root[data-ue-theme=dark] .ue2-nav-btn,:root[data-ue-theme=dark] #ue2-system-list .system-btn{background:linear-gradient(100deg,#111a21,#0f171e)!important;border:1px solid transparent!important;color:#dbe8ec!important}
:root[data-ue-theme=dark] .ue2-nav-btn:hover,:root[data-ue-theme=dark] #ue2-system-list .system-btn:hover{background:#17262f!important;border-color:#36505b!important}
:root[data-ue-theme=dark] .ue2-nav-btn.active,:root[data-ue-theme=dark] #ue2-system-list .system-btn.active{background:linear-gradient(100deg,#16404f,#1c5665)!important;border-color:#69ddff!important;color:#f4fcff!important;box-shadow:0 0 0 1px #65d9ff42,0 0 22px #42caff20!important}
:root[data-ue-theme=dark] .ue2-nav-btn .ue2-ico,:root[data-ue-theme=dark] .ue-win-system-icon{color:#90dff7!important}
:root[data-ue-theme=dark] #titlebar{background:linear-gradient(180deg,#111c25,#0e161d)!important;border-bottom-color:#2b414c!important;box-shadow:0 7px 24px #0004}
:root[data-ue-theme=dark] .ue2-search-wrap{background:#0a1117!important;border-color:#36515d!important;box-shadow:0 0 0 1px #65d9ff0d inset!important}
:root[data-ue-theme=dark] .ue2-search-wrap:focus-within{border-color:#65d9ff!important;box-shadow:0 0 0 3px #65d9ff1b!important}
:root[data-ue-theme=dark] .ue2-top-btn,:root[data-ue-theme=dark] #ue152-language{background:linear-gradient(145deg,#17242d,#101920)!important;border-color:#36515d!important;color:#d9f5fc!important}
:root[data-ue-theme=dark] .ue2-top-btn:hover,:root[data-ue-theme=dark] #ue152-language:hover{background:#1b333e!important;border-color:#65d9ff!important;color:#fff!important}
:root[data-ue-theme=dark] .ue-win-hero{background:#0e1a21!important;border-color:#3b5c68!important;box-shadow:0 14px 40px #0009,0 0 0 1px #65d9ff12 inset!important}
:root[data-ue-theme=dark] .ue-win-hero:after{background:linear-gradient(90deg,#071117f5 0%,#0b1b24c9 55%,#0d26309e 100%)!important}
:root[data-ue-theme=dark] .ue-win-hero-platform{border-color:#70e3ff70!important;background:#65d9ff18!important;color:#dff9ff!important}
:root[data-ue-theme=dark] .ue-win-hero-actions .ue2-play-primary,:root[data-ue-theme=dark] #btn-play{background:linear-gradient(135deg,#42c9f2,#75e4ff)!important;border-color:#8aeaff!important;color:#061016!important;box-shadow:0 7px 22px #29c4ed38!important}
:root[data-ue-theme=dark] .ue-win-hero-actions .ue2-play-primary:hover,:root[data-ue-theme=dark] #btn-play:hover:not(:disabled){background:#9aeeff!important;color:#061016!important}
:root[data-ue-theme=dark] #rom-list.ue2-game-grid{gap:14px!important}
:root[data-ue-theme=dark] .ue2-card{background:linear-gradient(155deg,#141f27,#10171d)!important;border:1px solid #263b45!important;border-radius:13px!important;box-shadow:0 8px 18px #0005!important}
:root[data-ue-theme=dark] .ue2-card:hover{background:linear-gradient(155deg,#1a2a34,#14212a)!important;border-color:#4d7481!important;transform:translateY(-2px)}
:root[data-ue-theme=dark] .ue2-card.selected,:root[data-ue-theme=dark] .ue2-card.ue9-multi-selected{background:linear-gradient(155deg,#173844,#132a34)!important;border:2px solid #65d9ff!important;box-shadow:0 0 0 2px #65d9ff22,0 0 24px #36c8ee20!important}
:root[data-ue-theme=dark] .ue2-art{background:#0b1218!important;border-color:#314a55!important}
:root[data-ue-theme=dark] .ue2-card-footer h3{color:#f0f8fb!important;font-size:12px!important}
:root[data-ue-theme=dark] .ue2-card-footer p{color:#8faab4!important}
:root[data-ue-theme=dark] #ue2-right{background:linear-gradient(180deg,#0b1218,#090e13)!important;border-left-color:#2b414c!important}
:root[data-ue-theme=dark] .ue2-detail-stats>div,:root[data-ue-theme=dark] .ue2-detail-placeholder{background:linear-gradient(145deg,#14232c,#101a21)!important;border-color:#304a55!important}
:root[data-ue-theme=dark] .ue2-detail-placeholder{color:#76dfff!important}
:root[data-ue-theme=dark] .ue2-favorite{background:#0a151cd9!important;border-color:#66818a!important}
:root[data-ue-theme=dark] #rom-list,:root[data-ue-theme=dark] #ue2-system-list{scrollbar-color:#557681 #0b1218!important}
`;
document.head.append(ueFutureVisualStyle);
const ueDarkFormStyle=document.createElement('style');ueDarkFormStyle.id='ue-dark-form-style';ueDarkFormStyle.textContent=String.raw`:root[data-ue-theme=dark] input:not([type=checkbox]):not([type=radio]),:root[data-ue-theme=dark] select,:root[data-ue-theme=dark] textarea{background:#202a31!important;color:#f1f7fa!important;border:1px solid #3a525d!important;box-shadow:none!important}:root[data-ue-theme=dark] input::placeholder,:root[data-ue-theme=dark] textarea::placeholder{color:#8999a1!important;opacity:1!important}:root[data-ue-theme=dark] option{background:#202a31!important;color:#f1f7fa!important}`;document.head.append(ueDarkFormStyle);
const ueSynopsisStyle=document.createElement('style');ueSynopsisStyle.id='ue-synopsis-style';ueSynopsisStyle.textContent=String.raw`:root .ue-win-hero-description{box-sizing:border-box;width:min(820px,100%);max-height:92px;overflow-y:auto;overflow-x:hidden;padding:0 10px 0 0;margin:0;color:#e8f0f8;font:400 14px/1.45 Arial,sans-serif;white-space:normal;overflow-wrap:anywhere;scrollbar-width:thin;scrollbar-color:#ffffff99 transparent;scrollbar-gutter:stable}:root .ue-win-hero-description::-webkit-scrollbar{width:7px}:root .ue-win-hero-description::-webkit-scrollbar-track{background:#0003;border-radius:8px}:root .ue-win-hero-description::-webkit-scrollbar-thumb{background:#ffffff99;border-radius:8px}:root[data-ue-palette] .ue-win-hero-description{color:var(--win-text)!important}`;document.head.append(ueSynopsisStyle);
const ueDescriptionEditorStyle=document.createElement('style');ueDescriptionEditorStyle.id='ue-description-editor-style';ueDescriptionEditorStyle.textContent=String.raw`:root .ue-description-editor{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:#0009}:root .ue-description-editor-panel{width:min(760px,94vw);display:grid;gap:12px;padding:22px;border:1px solid var(--win-line);border-radius:16px;background:var(--win-panel);color:var(--win-text);box-shadow:0 22px 70px #000b}:root .ue-description-editor-panel h3{margin:0;font:700 20px Arial,sans-serif}:root .ue-description-editor-help{margin:0;color:var(--win-muted);font:400 13px/1.4 Arial,sans-serif}:root .ue-description-editor-text{width:100%;min-height:240px;resize:vertical;box-sizing:border-box;border:1px solid var(--win-line);border-radius:10px;padding:12px;background:var(--win-bg)!important;color:var(--win-text)!important;font:400 14px/1.5 Arial,sans-serif;outline:none}:root .ue-description-editor-text:focus{border-color:var(--win-accent)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--win-accent) 25%,transparent)}:root .ue-description-editor-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}:root .ue-description-editor-actions button{min-height:36px;padding:8px 13px;font:700 12px Arial,sans-serif}:root .ue-description-editor-status{min-height:16px;color:var(--win-muted);font:400 11px Arial,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`;document.head.append(ueDescriptionEditorStyle);
/* Windows library presentation. Emulator launch and controller profiles remain in app.js. */
(() => {
 const media=window.matchMedia('(prefers-color-scheme: dark)');
 function theme(){const dark=true;document.documentElement.dataset.ueTheme='dark';const chip=document.getElementById('ue-win-theme');if(chip){chip.replaceChildren(ue2Icon('clock',14),el('span',{},'Escuro'));chip.title='O Ultimate Emulator usa sempre o tema escuro.'}}
 theme();
 window.electronAPI?.ueWindowsTheme?.().catch(()=>{});
 window.electronAPI?.ueOnWindowsTheme?.(x=>theme(x.dark));
 function platformColor(id){if(id.startsWith('atari'))return '#e45c48';if(['snes','nds','nes','n64','gameboy','gbc','gba'].includes(id))return '#8c55df';if(['megadrive','mastersystem','saturn','dreamcast','segacd','megadrive32x'].includes(id))return '#1386ba';return '#0878f9'}
 function decorateSidebar(){
  for(const system of SYSTEMS){const row=document.getElementById('sys-btn-'+system.id);if(!row)continue;
   if(!row.querySelector('.ue-win-system-icon')){const icon=el('span',{className:'ue-win-system-icon',style:{'--platform-color':platformColor(system.id)},'aria-hidden':'true'},ue2Icon('game',19));icon.style.setProperty('--platform-color',platformColor(system.id));row.prepend(icon)}
   let count=row.querySelector('.ue-win-system-count');if(!count){count=el('span',{className:'ue-win-system-count'});row.append(count)}count.textContent=String((state.libraries[system.folder]||[]).length);
  }
  fitSidebar();
 }
 function fitSidebar(){
  const root=document.documentElement;if(window.innerWidth<=680){root.style.removeProperty('--ue-sidebar-width');return;}
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;ctx.font='700 16px Arial';
  const widest=Math.max(...SYSTEMS.map(system=>ctx.measureText(String(system.name||'')).width),0);
  const width=Math.min(390,Math.max(286,Math.ceil(widest+104)));
  root.style.setProperty('--ue-sidebar-width',width+'px');
 }
 function subtitle(){const text=document.getElementById('system-core-info');if(!text)return;const count=ue2VisibleGames().length;text.textContent=count.toLocaleString('pt-BR')+(count===1?' jogo na biblioteca':' jogos na biblioteca');text.removeAttribute('title')}
 function displayTitle(name){
  const clean=String(name).replace(/\s*\((?:19|20)\d{2}\)(?:\([^)]*\))*(?:\[[^\]]*\])*\s*$/,'').trim();
  return clean||String(name);
 }
 const summaryStyle=document.createElement('style');summaryStyle.id='ue-library-summary-style';summaryStyle.textContent=String.raw`
 .ue2-library-summary-list{display:flex!important;align-items:center;justify-content:center;min-height:0!important;padding:30px 28px 48px!important;overflow:auto!important}
 .ue2-library-summary{width:min(760px,100%);min-height:clamp(360px,52vh,540px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:44px 30px;border:1px solid var(--ue2-line);border-radius:20px;background:linear-gradient(145deg,#171717,#111);text-align:center;color:var(--ue2-text)}
 .ue2-library-summary-icon{width:100px;height:100px;display:grid;place-items:center;border-radius:28px;color:var(--sys-c1,#7d7d7d);background:color-mix(in srgb,var(--sys-c1,#7d7d7d) 16%,#171717);border:1px solid color-mix(in srgb,var(--sys-c1,#7d7d7d) 50%,transparent)}
 .ue2-library-summary h3{margin:0;font-size:30px;line-height:1.15;font-weight:700;letter-spacing:.01em}
 .ue2-library-summary-stats{display:flex;align-items:stretch;justify-content:center;gap:18px;flex-wrap:wrap}
 .ue2-library-summary-stat{min-width:220px;padding:18px 25px;border:1px solid var(--ue2-line);border-radius:14px;background:#1d1d1d;display:flex;flex-direction:column;align-items:center;gap:7px}
 .ue2-library-summary-stat strong{font-size:32px;line-height:1.1;color:var(--ue2-text);font-weight:700;letter-spacing:.01em}
 .ue2-library-summary-label{color:var(--ue2-text);font-size:16px;font-weight:700}
 .ue2-library-summary-stat small{color:var(--ue2-muted);font-size:15px}
 .ue2-library-summary p{color:var(--ue2-muted);font-size:15px;margin:2px 0 0}
 `;document.head.append(summaryStyle);
 let heroRefreshTimer=null;
 function hero(){
  clearTimeout(heroRefreshTimer);
  const node=document.getElementById('ue-win-hero');if(!node)return;
  if(typeof ue2IsAllLanding==='function'&&ue2IsAllLanding()){node.replaceChildren();node.hidden=true;delete node.dataset.featuredGame;return;}
  const visible=ue2VisibleGames();const selected=ue2SelectedGame();const game=visible.find(g=>g.path===selected?.path)||visible[0];node.replaceChildren();node.hidden=!game;if(!game)return;node.dataset.featuredGame=game.path;
  const info=ueGameInfoFor(game),meta=UE2.meta.get(game.path)||{},backdrop=el('div',{className:'ue-win-hero-backdrop','aria-hidden':'true','data-art':ue2Key(game.path)});
  if(meta.cover)ue2SetArt(backdrop,meta.cover,game.name);
  const copy=el('div',{className:'ue-win-hero-copy'});copy.append(el('span',{className:'ue-win-hero-platform'},game.system.name),el('h2',{title:game.name},displayTitle(game.name)));
  const facts=el('div',{className:'ue-win-hero-meta'});
  if(info.company&&info.company!=='Identificando…')facts.append(el('span',{},ue2Icon('game',13),el('b',{},'Empresa:'),info.company));
  if(info.year&&info.year!=='Identificando…')facts.append(el('span',{},ue2Icon('clock',13),el('b',{},'Ano:'),info.year));
  const region=ueGameRegionLabel(game);if(!['Identificando…','Não identificada'].includes(region))facts.append(el('span',{},ue2Icon('globe',13),el('b',{},'Região:'),region));
  const description=ue2DescriptionFor(game),synopsis=el('div',{className:'ue-win-hero-description','aria-label':'Sinopse do jogo'});
  synopsis.textContent=description?.status==='ok'&&description.text?description.text:(description?.status==='not-found'?'Sinopse não encontrada.':description?.status==='retry'?'Sinopse indisponível no momento.':'Buscando sinopse…');
  copy.append(facts,synopsis);
  const actions=el('div',{className:'ue-win-hero-actions'});actions.append(ue2Btn('Jogar','play',()=>ue2Play(game),'ue2-play-primary'),ue2Btn('Editar sinopse','settings',()=>ue2EditDescription(game),'ue2-action'));copy.append(actions);
  const cover=el('div',{className:'ue-win-hero-cover','data-art':ue2Key(game.path),'aria-hidden':'true'});if(meta.cover)ue2SetArt(cover,meta.cover,game.name);else cover.append(ue2Icon('game',65));node.append(backdrop,copy,cover);ue2QueueCover(game);
  if(info.company==='Identificando…'||region==='Identificando…')heroRefreshTimer=setTimeout(()=>{if(node.isConnected&&node.dataset.featuredGame===game.path)hero()},400);
 }
 function normalizeSearchSurfaces(){
  const fields=[document.querySelector('.ue2-console-search input'),document.getElementById('ue2-search')].filter(Boolean);
  for(const field of fields){field.style.setProperty('background','transparent','important');field.style.setProperty('border','0','important');field.style.setProperty('box-shadow','none','important');field.style.setProperty('outline','0','important');field.style.setProperty('appearance','none','important')}
  for(const shell of document.querySelectorAll('.ue2-console-search,.ue2-search-wrap')){shell.style.setProperty('box-shadow','none','important')}
 }
 const oldBuild=buildLayout;buildLayout=function(){oldBuild();normalizeSearchSurfaces();
  const logo=document.querySelector('.ue2-logo');if(logo){logo.replaceChildren(el('span',{className:'ue2-logo-icon'},ue2Icon('game',29)),el('div',{},el('strong',{},'ULTIMATE EMULATOR'),el('small',{},'Biblioteca de jogos clássicos')))}
  const side=document.getElementById('sidebar'),nav=document.getElementById('ue2-nav');
  const search=el('input',{type:'search',placeholder:'Pesquisar console…','aria-label':'Pesquisar console',onInput:e=>{const q=e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();for(const system of SYSTEMS){const row=document.getElementById('sys-btn-'+system.id);if(row)row.hidden=!system.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q)}}});
  const consoleSearch=el('label',{className:'ue2-console-search'},ue2Icon('search',15),search);consoleSearch.hidden=UE2.section==='favorites';
  side.insertBefore(consoleSearch,nav);normalizeSearchSurfaces();
  const foot=document.querySelector('.ue2-sidebar-foot');if(foot){foot.querySelector('strong').textContent='Ultimate Emulator';foot.querySelector('small').textContent='Biblioteca local'}
  const header=document.getElementById('system-header');header.after(el('section',{id:'ue-win-hero',className:'ue-win-hero','aria-label':'Jogo em destaque',hidden:true}));
  const themeChip=el('span',{id:'ue-win-theme',className:'ue-win-theme',role:'status'});document.querySelector('.ue2-top-actions')?.prepend(themeChip);theme(document.documentElement.dataset.ueTheme==='dark');
  decorateSidebar();subtitle();hero();
 };
 const oldSidebar=buildSidebar;buildSidebar=function(){oldSidebar();decorateSidebar()};
 const oldCount=ue2RefreshCount;ue2RefreshCount=function(){oldCount();decorateSidebar()};
 window.addEventListener('resize',fitSidebar,{passive:true});
 const oldHeader=renderSystemHeader;renderSystemHeader=function(){oldHeader();subtitle()};
 const oldList=renderRomList;renderRomList=function(){oldList();for(const title of document.querySelectorAll('.ue2-card-footer h3')){const full=title.textContent;title.title=full;title.textContent=displayTitle(full)}if(!(typeof ue2IsAllLanding==='function'&&ue2IsAllLanding()))ue2QueueDescriptionsForList?.();subtitle();hero()};
 const oldDetail=ue2RenderDetail;ue2RenderDetail=function(){oldDetail();const title=document.querySelector('.ue2-detail-name');if(title){const full=title.textContent;title.title=full;title.textContent=displayTitle(full)}hero()};
 const oldHealth=ue19RefreshHealth;ue19RefreshHealth=async function(){await oldHealth();document.getElementById('system-core-info')?.removeAttribute('title')};
 window.addEventListener('ue2-description-updated',event=>{const current=ue2SelectedGame();if(current?.path===event.detail?.path)hero()});
})();

// Keep window moves responsive even while the library contains many covers.
// The native frame normally handles dragging outside the renderer; this class
// also covers frameless/virtualized hosts and temporarily removes expensive
// paint effects while the pointer is held on the title area.
(()=>{
 const style=document.createElement('style');style.id='ue-window-drag-performance';style.textContent=String.raw`
:root.ue-window-dragging *{transition:none!important;animation:none!important}
:root.ue-window-dragging .ue-win-hero-backdrop{filter:none!important;transform:none!important;opacity:.16!important}
:root.ue-window-dragging .ue-win-hero,:root.ue-window-dragging .ue2-card,:root.ue-window-dragging .ue2-card.selected,:root.ue-window-dragging .ue2-logo-icon{box-shadow:none!important}
:root.ue-window-dragging .ue2-card:hover{transform:none!important}
:root.ue-window-resizing *{transition:none!important;animation:none!important}
:root.ue-window-resizing .ue-win-hero-backdrop{display:none!important;filter:none!important;transform:none!important}
:root.ue-window-resizing .ue-win-hero,:root.ue-window-resizing .ue2-card,:root.ue-window-resizing .ue2-card.selected,:root.ue-window-resizing .ue2-logo-icon{box-shadow:none!important}
:root.ue-window-resizing .ue2-card:hover{transform:none!important}
:root.ue-window-resizing #rom-list{scroll-behavior:auto!important}
:root.ue-window-resizing #ue-cover-gallery{backdrop-filter:none!important}
:root.ue-window-resizing #ue-cover-gallery::after{background:rgba(0,0,0,.44)!important}
:root.ue-window-resizing .ue-gallery-backdrop,:root.ue-window-resizing .ue-gallery-stage:before{display:none!important}
`;
 document.head.append(style);
 let timer=0,resizeTimer=0;
 const stop=()=>{clearTimeout(timer);timer=0;document.documentElement.classList.remove('ue-window-dragging')};
 const start=()=>{clearTimeout(timer);document.documentElement.classList.add('ue-window-dragging');timer=setTimeout(stop,1600)};
 const markResize=()=>{document.documentElement.classList.add('ue-window-resizing');clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>document.documentElement.classList.remove('ue-window-resizing'),260)};
 document.addEventListener('pointerdown',event=>{const target=event.target?.closest?.('#titlebar,.titlebar');if(target&&!event.target.closest('input,button,select,textarea,.ue2-top-actions'))start()},{passive:true});
 document.addEventListener('pointerup',stop,{passive:true});document.addEventListener('pointercancel',stop,{passive:true});window.addEventListener('blur',stop);
 window.addEventListener('resize',markResize,{passive:true});
})();

// UE-THEMES: one clean light and one clean dark presentation.  Older
// multi-colour palette values are deliberately migrated to dark.
(()=>{
 const palettes={
  dark:{label:'Escuro',accent:'#2395f3',bg:'#0d1117',panel:'#151b23',sidebar:'#111820',soft:'#202a35',muted:'#aeb9c8',line:'#303d4c',selected:'#173d62',text:'#f5f7fa'},
  light:{label:'Claro',accent:'#1479d6',bg:'#f7f8fa',panel:'#ffffff',sidebar:'#eef1f4',soft:'#e4e9ef',muted:'#637083',line:'#d1d8e1',selected:'#cfe7ff',text:'#17202b'}
 };
 const names=Object.keys(palettes);
 const css=document.createElement('style');css.id='ue-color-schemes';css.textContent=String.raw`
:root #ue2-right{display:none!important}
:root #body{grid-template-columns:var(--ue-sidebar-width,minmax(286px,max-content)) minmax(0,1fr)!important}
:root .ue-win-hero{margin-left:22px;margin-right:22px}
:root[data-ue-palette=dark]{color-scheme:dark}:root[data-ue-palette=light]{color-scheme:light}
:root[data-ue-palette] body,:root[data-ue-palette] button,:root[data-ue-palette] input,:root[data-ue-palette] select,:root[data-ue-palette] textarea{font-family:'Segoe UI Variable','Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
:root[data-ue-palette] #main,:root[data-ue-palette] #titlebar,:root[data-ue-palette] #status-bar{background:var(--win-bg)!important}
:root[data-ue-palette] body,:root[data-ue-palette] #root,:root[data-ue-palette] #app{background:var(--win-bg)!important;color:var(--win-text)!important}
:root[data-ue-palette] #titlebar{background:var(--win-panel)!important;border-color:var(--win-line)!important}
:root[data-ue-palette] #sidebar{background:var(--win-sidebar)!important;border-color:var(--win-line)!important}
:root[data-ue-palette] .ue2-logo,:root[data-ue-palette] .ue2-sidebar-foot{background:var(--win-panel)!important;border-color:var(--win-line)!important}
:root[data-ue-palette] .ue-win-hero{background:var(--win-panel)!important;border-color:var(--win-line)!important}
:root[data-ue-palette] .ue-win-hero:after{background:linear-gradient(90deg,color-mix(in srgb,var(--win-bg) 94%,transparent),color-mix(in srgb,var(--win-panel) 72%,transparent),color-mix(in srgb,var(--win-accent) 22%,transparent))!important}
:root[data-ue-palette] .ue2-card{background:linear-gradient(155deg,var(--win-panel),var(--win-bg))!important;border-color:var(--win-line)!important;color:var(--win-text)!important}
:root[data-ue-palette] .ue2-card:hover{background:var(--win-panel)!important;border-color:var(--win-line)!important}
:root[data-ue-palette] .ue2-card.selected{background:var(--win-selected)!important;border-color:var(--win-accent)!important}
:root[data-ue-palette] .ue2-card-footer h3,:root[data-ue-palette] .ue2-card-footer strong{color:var(--win-text)!important}
:root[data-ue-palette] .ue2-card-footer p,:root[data-ue-palette] .ue2-count-label,:root[data-ue-palette] .ue2-detail-eyebrow{color:var(--win-muted)!important}
:root[data-ue-palette] .ue2-search-wrap,:root[data-ue-palette] #ue2-search,:root[data-ue-palette] input,:root[data-ue-palette] select,:root[data-ue-palette] textarea{background:var(--win-bg)!important;border-color:var(--win-line)!important;color:var(--win-text)!important}
:root[data-ue-palette] .ue2-search-wrap #ue2-search,:root[data-ue-palette] .ue2-console-search input{background:transparent!important;border:0!important;border-color:transparent!important;box-shadow:none!important;outline:0!important}
:root[data-ue-palette] .ue2-search-wrap,:root[data-ue-palette] .ue2-console-search{box-shadow:none!important}
:root[data-ue-palette] .ue2-search-wrap:focus-within,:root[data-ue-palette] .ue2-console-search:focus-within{border-color:var(--win-accent)!important;box-shadow:none!important}
:root[data-ue-palette] .ue2-search-wrap input:focus,:root[data-ue-palette] .ue2-search-wrap input:focus-visible,:root[data-ue-palette] .ue2-console-search input:focus,:root[data-ue-palette] .ue2-console-search input:focus-visible{outline:0!important;outline-offset:0!important;box-shadow:none!important}
:root[data-ue-palette] .ue2-nav-btn,:root[data-ue-palette] #ue2-system-list .system-btn{background:transparent!important;border:1px solid transparent!important;color:var(--win-text)!important;font-family:inherit;font-weight:650;letter-spacing:.01em}
:root[data-ue-palette] .ue2-nav-btn:hover,:root[data-ue-palette] #ue2-system-list .system-btn:hover{background:var(--win-selected)!important;border-color:var(--win-accent)!important;color:var(--win-text)!important}
:root[data-ue-palette] .ue2-nav-btn.active,:root[data-ue-palette] #ue2-system-list .system-btn.active{background:var(--win-accent)!important;border-color:var(--win-accent)!important;color:#fff!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--win-accent) 40%,transparent)!important}
:root[data-ue-palette] .ue2-nav-btn.active,:root[data-ue-palette] #ue2-system-list .system-btn.active,:root[data-ue-palette] .ue2-nav-btn.active .ue2-ico,:root[data-ue-palette] #ue2-system-list .system-btn.active .ue-win-system-icon{color:#fff!important}
:root[data-ue-palette] .ue2-nav-btn .ue2-ico,:root[data-ue-palette] #ue2-system-list .system-btn .ue-win-system-icon{color:var(--win-accent)!important}
:root[data-ue-palette] #ue2-system-list .system-btn .ue-win-system-icon .ue2-ico,:root[data-ue-palette] #ue2-system-list .system-btn .ue-win-system-icon svg{color:inherit!important;stroke:currentColor!important}
:root[data-ue-palette] #ue2-system-list .system-btn.active .system-btn-name,:root[data-ue-palette] #ue2-system-list .system-btn.active .ue-win-system-icon,:root[data-ue-palette] #ue2-system-list .system-btn.active .ue-win-system-icon .ue2-ico,:root[data-ue-palette] #ue2-system-list .system-btn.active .ue-win-system-icon svg{color:#fff!important;stroke:#fff!important}
:root[data-ue-palette] .ue2-top-btn,:root[data-ue-palette] .ue2-view-btn,:root[data-ue-palette] .system-btn-dot{border-color:var(--win-line)!important}
:root[data-ue-palette] .ue2-top-btn,:root[data-ue-palette] #ue152-language{border-color:var(--win-line)!important;background:var(--win-panel)!important;color:var(--win-accent)!important}
:root[data-ue-palette] .ue2-top-btn:hover,:root[data-ue-palette] #ue152-language:hover{background:var(--win-selected)!important;border-color:var(--win-accent)!important}
:root[data-ue-palette] .ue2-play-primary,:root[data-ue-palette] #btn-play{background:var(--win-accent)!important;border-color:var(--win-accent)!important;color:#061016!important}
:root[data-ue-palette] .ue2-play-primary .ue2-ico,:root[data-ue-palette] .ue2-play-primary svg,:root[data-ue-palette] #btn-play .ue2-ico,:root[data-ue-palette] #btn-play svg{color:#061016!important;fill:#061016!important;stroke:#061016!important}
:root[data-ue-palette] .ue-win-hero-platform{border-color:color-mix(in srgb,var(--win-accent) 55%,transparent)!important;background:color-mix(in srgb,var(--win-accent) 14%,transparent)!important}
:root[data-ue-palette] .ue-win-hero-meta{color:var(--win-text)!important}.ue-win-hero-meta b{font-weight:750;color:var(--win-accent)}
:root[data-ue-palette] .ue2-toggle{background:var(--win-soft)!important;border-color:var(--win-line)!important}
:root[data-ue-palette] .ue2-view-btn{background:color-mix(in srgb,var(--win-accent) 13%,var(--win-panel))!important;border:1px solid color-mix(in srgb,var(--win-accent) 48%,var(--win-line))!important;color:var(--win-text)!important;font-weight:700}
:root[data-ue-palette] .ue2-view-btn:hover{background:var(--win-selected)!important;border-color:var(--win-accent)!important;color:var(--win-text)!important}
:root[data-ue-palette] .ue2-view-btn.active{background:var(--win-accent)!important;border-color:var(--win-accent)!important;color:#071016!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--win-accent) 35%,transparent)!important}
:root[data-ue-palette] .ue2-view-btn .ue2-ico,:root[data-ue-palette] .ue2-view-btn .ue2-view-label,:root[data-ue-palette] .ue2-view-btn svg{color:inherit!important;opacity:1!important}
:root[data-ue-palette] .ue2-view-btn .ue2-ico{display:inline-flex!important;align-items:center;justify-content:center;flex:0 0 19px;width:19px;height:19px}
:root[data-ue-palette] .ue2-view-btn .ue2-ico svg{display:block;width:19px!important;height:19px!important;stroke:currentColor!important;stroke-width:2.25!important;fill:none!important}
:root[data-ue-palette] .ue2-view-btn.active .ue2-ico,:root[data-ue-palette] .ue2-view-btn.active .ue2-view-label,:root[data-ue-palette] .ue2-view-btn.active svg{color:#071016!important;stroke:#071016!important}
:root[data-ue-palette] #titlebar .ue2-scan-btn,:root[data-ue-palette] #titlebar .ue2-settings-btn,:root[data-ue-palette] #titlebar #ue152-language,:root[data-ue-palette] #titlebar #ue-about-button{background:linear-gradient(135deg,#651d3b,#96385d)!important;border-color:#c55c83!important;color:#fff!important;box-shadow:0 4px 13px #651d3b52!important}
:root[data-ue-palette] #titlebar .ue2-scan-btn :is(span,svg),:root[data-ue-palette] #titlebar .ue2-settings-btn :is(span,svg),:root[data-ue-palette] #titlebar #ue152-language :is(span,svg),:root[data-ue-palette] #titlebar #ue-about-button :is(span,svg){color:#fff!important;stroke:#fff!important}
:root[data-ue-palette] #titlebar .ue2-scan-btn:hover,:root[data-ue-palette] #titlebar .ue2-settings-btn:hover,:root[data-ue-palette] #titlebar #ue152-language:hover,:root[data-ue-palette] #titlebar #ue-about-button:hover{background:linear-gradient(135deg,#4d142d,#7e294c)!important;border-color:#e47da2!important}
:root #app{height:calc(100% - 40px)!important;transform:translateY(40px)!important}
:root #root{position:relative!important}
:root #root::before{content:'Ultimate Emulator';position:absolute;top:0;left:18px;height:40px;display:flex;align-items:center;color:#fff!important;font:600 14px/1 'Segoe UI',Arial,sans-serif;letter-spacing:.01em;pointer-events:none;z-index:2147483000}
:root[data-ue-palette] #root :where(button,input,select,textarea,label,h1,h2,h3,h4,h5,h6,p,span,small,strong,summary,dt,dd),:root[data-ue-palette] #body :where(button,input,select,textarea,label,h1,h2,h3,h4,h5,h6,p,span,small,strong,summary,dt,dd){font-family:'Segoe UI Variable Text','Segoe UI Variable','Segoe UI',system-ui,sans-serif!important;font-synthesis:none!important}
:root[data-ue-palette] #root :where(h1,h2,h3,h4,h5,h6,.ue2-logo strong,.ue2-nav-btn,.system-btn-name,.ue2-count-label,.ue2-view-label,.ue-win-hero-meta),:root[data-ue-palette] #body :where(h1,h2,h3,h4,h5,h6,.ue2-logo strong,.ue2-nav-btn,.system-btn-name,.ue2-count-label,.ue2-view-label,.ue-win-hero-meta){font-family:'Segoe UI Variable Display','Segoe UI Variable','Segoe UI',system-ui,sans-serif!important;font-weight:650!important;letter-spacing:normal}
:root[data-ue-palette] #root :where(button,input,select,textarea,label,p,small,strong,summary,dt,dd,.ue2-card-footer h3,.ue2-card-footer p,.ue2-view-label,.ue2-count-label,.ue-win-hero-meta,.ue2-top-btn,#ue152-language),:root[data-ue-palette] #body :where(button,input,select,textarea,label,p,small,strong,summary,dt,dd,.ue2-card-footer h3,.ue2-card-footer p,.ue2-view-label,.ue2-count-label,.ue-win-hero-meta,.ue2-top-btn,#ue152-language){font-family:Arial,sans-serif!important;font-size:12px!important;text-transform:none!important}
:root[data-ue-palette] #ue2-nav .ue2-nav-btn,:root[data-ue-palette] #ue2-system-list .system-btn,:root[data-ue-palette] #ue2-system-list .system-btn .system-btn-name{font-family:Arial,sans-serif!important;font-size:16px!important;font-weight:400!important;text-transform:none!important;letter-spacing:normal}
:root[data-ue-palette] #sidebar .ue2-side-heading,:root[data-ue-palette] #sidebar .ue2-systems-heading{font-family:Arial,sans-serif!important;font-size:12px!important;font-weight:700!important;text-transform:uppercase!important}
:root[data-ue-palette] #titlebar .ue2-top-btn,:root[data-ue-palette] #titlebar #ue152-language{font-family:Arial,sans-serif!important;font-size:12px!important;font-weight:700!important}
:root[data-ue-palette] .ue-win-theme{display:none!important}
.ue-color-picker{position:relative;display:inline-flex;flex:none;order:25}.ue-color-picker>button{min-width:88px}.ue-color-menu{position:fixed;z-index:2147483647;top:0;left:0;display:none;grid-template-columns:1fr;gap:5px;min-width:164px;padding:8px;border:1px solid var(--win-line);border-radius:12px;background:var(--win-panel);box-shadow:0 16px 38px #0005;overflow:visible}.ue-color-menu.is-open{display:grid}.ue-color-option{display:flex;align-items:center;gap:8px;width:100%;padding:8px 9px;border:1px solid var(--win-line);border-radius:8px;background:var(--win-soft)!important;color:var(--win-text)!important;font:750 11px Arial,sans-serif;cursor:pointer;text-align:left;box-shadow:none}.ue-color-option:hover,.ue-color-option[aria-checked=true]{background:var(--win-accent)!important;border-color:var(--win-accent)!important;color:#fff!important;filter:none;transform:none}.ue-color-swatch{width:14px;height:14px;border-radius:50%;border:1px solid #07101666;flex:none}.ue-color-option small{margin-left:auto;color:inherit;font-size:9px}
@media(max-width:1190px){:root #body{grid-template-columns:200px minmax(0,1fr)!important}:root .ue-win-hero{margin-left:17px;margin-right:17px}}
@media(max-width:680px){:root #body{grid-template-columns:65px minmax(0,1fr)!important}:root .ue-win-hero{margin-left:12px;margin-right:12px}}
@media(min-width:681px){:root #body{grid-template-columns:var(--ue-sidebar-width,minmax(286px,max-content)) minmax(0,1fr)!important}:root #sidebar{min-width:286px!important}}
`;
 document.head.appendChild(css);
 // The old dark-only presentation contains a few literal white text rules.
 // Apply the light scheme last so every ordinary surface stays readable;
 // white is reserved only for the deliberately dark game highlight.
 const ueLightContrastStyle=document.createElement('style');
 ueLightContrastStyle.id='ue-light-contrast-style';
 ueLightContrastStyle.textContent=String.raw`
:root[data-ue-palette=light] #main,:root[data-ue-palette=light] #system-header,:root[data-ue-palette=light] #action-bar,:root[data-ue-palette=light] #rom-area,:root[data-ue-palette=light] #status-bar{background:var(--win-bg)!important;color:var(--win-text)!important}
:root[data-ue-palette=light] #system-header,:root[data-ue-palette=light] #action-bar{background:var(--win-panel)!important;border-color:var(--win-line)!important}
:root[data-ue-palette=light] #sidebar,:root[data-ue-palette=light] .ue2-logo,:root[data-ue-palette=light] .ue2-sidebar-foot{color:var(--win-text)!important}
:root[data-ue-palette=light] #sidebar :is(strong,small,span,button,label,p),:root[data-ue-palette=light] #main :is(h1,h2,h3,h4,p,span,small,strong,button,label){color:var(--win-text)!important}
:root[data-ue-palette=light] #sidebar :is(.ue2-side-heading,.ue2-systems-heading,.ue2-logo small,.ue2-sidebar-foot small),:root[data-ue-palette=light] #main :is(#system-core-info,.ue2-count-label,.ue2-card-footer p,.ue2-detail-system,.ue2-detail-footnote,.ue2-detail-eyebrow){color:var(--win-muted)!important}
:root[data-ue-palette=light] .ue2-nav-btn .ue2-ico,:root[data-ue-palette=light] #ue2-system-list .system-btn .ue-win-system-icon{color:var(--win-accent)!important}
:root[data-ue-palette=light] #sidebar .ue2-nav-btn.active,:root[data-ue-palette=light] #sidebar #ue2-system-list .system-btn.active,:root[data-ue-palette=light] #sidebar .ue2-nav-btn.active :is(span,svg),:root[data-ue-palette=light] #sidebar #ue2-system-list .system-btn.active :is(span,svg){color:#fff!important}
:root[data-ue-palette=light] .ue2-card,:root[data-ue-palette=light] .ue2-game-list .ue2-card{background:var(--win-panel)!important;color:var(--win-text)!important;border-color:var(--win-line)!important}
:root[data-ue-palette=light] .ue2-card-footer h3,:root[data-ue-palette=light] .ue2-card-footer p,:root[data-ue-palette=light] .ue2-card-footer .ue2-ico{color:var(--win-text)!important}
:root[data-ue-palette=light] #main .ue-win-hero{background:#142334!important;border-color:#203e5d!important;color:#fff!important}
:root[data-ue-palette=light] #main .ue-win-hero:after{background:linear-gradient(90deg,#0b1728f2 0%,#142b42d6 58%,#1738589e 100%)!important}
:root[data-ue-palette=light] #main .ue-win-hero :is(h2,p,span,small,strong,.ue2-ico){color:#fff!important}
:root[data-ue-palette=light] #main .ue-win-hero-description{color:#eef5ff!important}
:root[data-ue-palette=light] #main .ue-win-hero-platform{background:#ffffff20!important;border-color:#ffffff72!important;color:#fff!important}
:root[data-ue-palette=light] #main .ue-win-hero-actions .ue2-action{background:#ffffff20!important;border-color:#ffffff66!important;color:#fff!important}
:root[data-ue-palette=light] #main .ue2-view-btn.active,:root[data-ue-palette=light] #main .ue2-view-btn.active :is(span,svg){color:#fff!important}
:root[data-ue-palette=light] #status-bar{color:var(--win-muted)!important}
`;
 document.head.appendChild(ueLightContrastStyle);
 // Last-resort cascade guard for the former dark-only styles.  It is kept
 // separate so a legacy literal `color: #fff !important` cannot win in the
 // light theme.  Dark panels are explicitly opted back into white text.
 const ueLightHardOverride=document.createElement('style');
 ueLightHardOverride.id='ue-light-hard-override';
 ueLightHardOverride.textContent=String.raw`
html[data-ue-palette=light] #root *{color:#17202b!important;text-shadow:none!important}
html[data-ue-palette=light] #root svg{stroke:currentColor!important}
html[data-ue-palette=light] #root :is(input,textarea,select){color:#17202b!important;background:#fff!important}
html[data-ue-palette=light] #root :is(input,textarea)::placeholder{color:#637083!important;opacity:1!important}
html[data-ue-palette=light] #root .ue-win-hero,html[data-ue-palette=light] #root .ue-win-hero *{color:#fff!important}
html[data-ue-palette=light] #root .ue-win-hero{background:#142334!important}
html[data-ue-palette=light] #root .ue2-library-summary{background:#171b22!important;border-color:#303d4c!important}
html[data-ue-palette=light] #root .ue2-library-summary *{color:#f7f9fc!important}
html[data-ue-palette=light] #root .ue2-library-summary :is(p,small){color:#c2cad5!important}
html[data-ue-palette=light] #root #sidebar :is(.ue2-nav-btn.active,#ue2-system-list .system-btn.active),html[data-ue-palette=light] #root #sidebar :is(.ue2-nav-btn.active,#ue2-system-list .system-btn.active) *{color:#fff!important}
html[data-ue-palette=light] #root #main .ue2-view-btn.active,html[data-ue-palette=light] #root #main .ue2-view-btn.active *{color:#fff!important}
html[data-ue-palette=light] #root #main .ue2-play-primary,html[data-ue-palette=light] #root #main .ue2-play-primary *{color:#fff!important}
`;
 document.head.appendChild(ueLightHardOverride);
 const ueGalleryFullscreenStyle=document.createElement('style');
 ueGalleryFullscreenStyle.id='ue-gallery-fullscreen-style';
 ueGalleryFullscreenStyle.textContent=String.raw`
/* Cover Flow uses the entire renderer viewport, with the library visible behind it. */
:root #ue-cover-gallery{padding:0!important;background:rgba(3,7,12,.56)!important;backdrop-filter:blur(15px) saturate(.58)!important;isolation:isolate!important}
:root #ue-cover-gallery::after{content:'';position:absolute;inset:0;z-index:0;background:rgba(0,0,0,.28);pointer-events:none}
:root .ue-gallery-backdrop{inset:-24px!important;background:rgba(3,7,12,.34)!important;filter:none!important;transform:none!important;opacity:1!important;pointer-events:none!important}
:root .ue-gallery-shell{position:relative!important;z-index:1!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;padding:24px clamp(18px,4vw,64px) 28px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;grid-template-columns:1fr!important;grid-template-rows:52px minmax(0,1fr) auto auto auto!important;gap:0!important}
:root .ue-gallery-top{grid-column:1!important;grid-row:1!important}
:root .ue-gallery-stage{grid-column:1!important;grid-row:2!important;min-height:0!important;height:100%!important;padding:0!important;overflow:hidden!important}
:root .ue-gallery-stage:before{inset:20% 20% 10%!important;background:radial-gradient(ellipse,rgba(166,203,255,.16),transparent 68%)!important;filter:blur(28px)!important}
:root .ue-coverflow-track{position:absolute!important;inset:0!important;display:block!important;overflow:hidden!important;perspective:1400px!important;isolation:isolate!important}
:root .ue-coverflow-item{width:clamp(220px,23vw,440px)!important;height:min(66vh,640px)!important;max-height:none!important;aspect-ratio:3/4!important;border-radius:8px!important;background:rgba(9,14,22,.9)!important;box-shadow:0 18px 42px rgba(0,0,0,.62),0 0 0 1px rgba(255,255,255,.12)!important;transition:transform .16s ease,opacity .16s ease,filter .16s ease!important;-webkit-box-reflect:none!important}
:root .ue-coverflow-item[data-orientation="portrait"]{width:clamp(240px,26vw,460px)!important;height:auto!important;aspect-ratio:var(--art-ratio,.75)!important}
:root .ue-coverflow-item[data-orientation="landscape"]{width:clamp(300px,31vw,560px)!important;height:auto!important;aspect-ratio:var(--art-ratio,1.333)!important}
:root .ue-coverflow-item[data-orientation="square"]{width:clamp(270px,28vw,500px)!important;height:auto!important;aspect-ratio:var(--art-ratio,1)!important}
:root .ue-coverflow-item img{background:rgba(9,14,22,.86)!important}
:root .ue-coverflow-item[data-offset="-1"]{transform:translate(-50%,-50%) translateX(clamp(-470px,-32vw,-250px)) rotateY(30deg) scale(.78)!important;opacity:.64!important;filter:brightness(.72)!important}
:root .ue-coverflow-item[data-offset="0"]{transform:translate(-50%,-50%) scale(1)!important;opacity:1!important;filter:none!important;border-color:rgba(239,247,255,.8)!important;box-shadow:0 24px 55px rgba(0,0,0,.72),0 0 0 2px rgba(255,255,255,.35)!important}
:root .ue-coverflow-item[data-offset="1"]{transform:translate(-50%,-50%) translateX(clamp(250px,32vw,470px)) rotateY(-30deg) scale(.78)!important;opacity:.64!important;filter:brightness(.72)!important}
:root .ue-gallery-arrow{position:absolute!important;top:50%!important;width:52px!important;height:52px!important;background:rgba(10,15,24,.72)!important;border-color:rgba(215,231,255,.55)!important;box-shadow:0 8px 24px rgba(0,0,0,.42)!important}
:root .ue-gallery-prev{left:clamp(4px,1.5vw,28px)!important}.ue-gallery-next{right:clamp(4px,1.5vw,28px)!important}
:root .ue-gallery-info{grid-column:1!important;grid-row:3!important;margin-top:14px!important;gap:5px!important}
:root .ue-gallery-title{max-width:min(92vw,1100px)!important;font-size:clamp(22px,2.6vw,34px)!important;text-shadow:0 2px 18px #000!important}
:root .ue-gallery-slider{grid-column:1!important;grid-row:4!important;width:min(780px,82%)!important;margin:15px auto 0!important}
:root .ue-gallery-actions{grid-column:1!important;grid-row:5!important;margin-top:15px!important}
:root .ue-gallery-close{width:40px!important;height:40px!important;background:rgba(8,13,20,.72)!important;transform:translateY(38px)!important}
:root[data-ue-theme=dark] .ue-gallery-play,:root[data-ue-theme=dark] .ue-win-hero-actions .ue2-play-primary{min-width:210px!important;min-height:54px!important;padding:14px 28px!important;border:1px solid #ffc17c!important;border-radius:13px!important;background:linear-gradient(135deg,#df681d,#f59b3d)!important;color:#fff!important;font-size:17px!important;font-weight:800!important;box-shadow:0 9px 25px #df681d57!important}
:root[data-ue-theme=dark] .ue-gallery-play :is(span,svg),:root[data-ue-theme=dark] .ue-win-hero-actions .ue2-play-primary :is(span,svg){color:#fff!important;stroke:#fff!important;fill:#fff!important}
:root[data-ue-theme=dark] .ue-gallery-play:hover,:root[data-ue-theme=dark] .ue-win-hero-actions .ue2-play-primary:hover{background:linear-gradient(135deg,#bd5012,#e98228)!important;border-color:#ffe0b4!important;transform:translateY(-1px)!important}
:root #ue-native-window-drag{position:fixed;top:0;left:0;right:210px;height:40px;z-index:2147483001;-webkit-app-region:drag;user-select:none;background:transparent}
/* The native drag strip sits above ordinary content. In Cover Flow it used to
   overlap the left half of the close button, leaving only its corner clickable. */
:root body.ue-gallery-active #ue-native-window-drag{display:none!important}
@media(max-width:720px){:root .ue-gallery-shell{padding:16px 10px 20px!important}:root .ue-coverflow-item{width:clamp(150px,36vw,260px)!important;height:min(58vh,420px)!important}:root .ue-coverflow-item[data-offset="-1"]{transform:translate(-50%,-50%) translateX(-30vw) rotateY(25deg) scale(.72)!important}:root .ue-coverflow-item[data-offset="1"]{transform:translate(-50%,-50%) translateX(30vw) rotateY(-25deg) scale(.72)!important}:root .ue-gallery-arrow{width:42px!important;height:42px!important}}
`;
 document.head.appendChild(ueGalleryFullscreenStyle);
 if(!document.getElementById('ue-native-window-drag')){const drag=document.createElement('div');drag.id='ue-native-window-drag';drag.setAttribute('aria-hidden','true');document.body.appendChild(drag);}
 function apply(id){const key=palettes[id]?id:'dark';const root=document.documentElement,p=palettes[key];root.dataset.uePalette=key;root.dataset.ueTheme=key;for(const [name,value] of Object.entries({bg:p.bg,panel:p.panel,sidebar:p.sidebar,soft:p.soft,muted:p.muted,line:p.line,selected:p.selected,accent:p.accent})){root.style.setProperty('--win-'+name,value,'important')}root.style.setProperty('--win-text',p.text,'important');root.style.setProperty('color',p.text,'important');root.style.setProperty('--ue2-line',p.line,'important');root.style.setProperty('--ue2-text',p.text,'important');root.style.setProperty('--ue2-muted',p.muted,'important');try{localStorage.setItem('ue-color-scheme',key)}catch{};document.querySelectorAll('.ue-color-option').forEach(item=>item.setAttribute('aria-checked',String(item.dataset.palette===key)));const label=document.querySelector('#ue-palette-button span:last-child');if(label)label.textContent=p.label;const chip=document.getElementById('ue-win-theme');if(chip){chip.replaceChildren(ue2Icon('clock',14),el('span',{},p.label));chip.title='Tema '+p.label.toLowerCase();}if(typeof ue2SavePrefs==='function')ue2SavePrefs();}
 window.__ueApplyPalette=apply;
 function install(){try{localStorage.setItem('ue-color-scheme','dark')}catch{}apply('dark');}
 const applyOptionAccents=()=>document.querySelectorAll('.ue-color-option').forEach(option=>{const p=palettes[option.dataset.palette];if(p)option.style.setProperty('--option-accent',p.accent)});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();applyOptionAccents()});else{install();applyOptionAccents();}
})();
