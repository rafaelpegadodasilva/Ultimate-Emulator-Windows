// Keep the featured game optional so the library can use the available height.
(() => {
  let collapsed = false;
  const style = document.createElement('style');
  style.textContent = `
    #ue-hero-toggle-row { display:flex; justify-content:flex-end; flex-shrink:0; margin:0 25px; }
    #ue-hero-toggle { display:inline-flex; align-items:center; gap:7px; border:1px solid var(--win-line,#374154);
      border-radius:7px; background:var(--win-panel,#202632); color:var(--win-muted,#a9b4c8);
      padding:5px 9px; font:12px 'Segoe UI',sans-serif; cursor:pointer; min-height:28px; }
    #ue-hero-toggle:hover { color:var(--win-text,#f0f3fa); border-color:var(--win-accent,#438fff); }
    #ue-hero-toggle:focus-visible { outline:2px solid var(--win-accent,#438fff); outline-offset:2px; }
    #ue-hero-toggle svg { width:14px; height:14px; flex:none; }
    :root #main.ue-hero-collapsed #ue-win-hero { display:none!important; }
    @media(max-width:1190px) { #ue-hero-toggle-row { margin-left:17px; margin-right:17px; } }
    @media(max-width:680px) { #ue-hero-toggle-row { margin-left:12px; margin-right:12px; } }
  `;
  document.head.append(style);
  function install() {
    const hero = document.getElementById('ue-win-hero');
    if (!hero || document.getElementById('ue-hero-toggle')) return;
    const main = document.getElementById('main');
    const row = document.createElement('div');
    row.id = 'ue-hero-toggle-row';
    const button = document.createElement('button');
    button.id = 'ue-hero-toggle';
    button.type = 'button';
    button.setAttribute('aria-controls', 'ue-win-hero');
    function update() {
      const landing = typeof window.ue2IsAllLanding === 'function' && window.ue2IsAllLanding();
      row.hidden = landing;
      main.classList.toggle('ue-hero-collapsed', collapsed);
      button.setAttribute('aria-expanded', String(!collapsed));
      button.setAttribute('aria-label', collapsed ? 'Expandir destaque do jogo' : 'Recolher destaque do jogo');
      button.title = collapsed ? 'Mostrar o painel de destaque' : 'Recolher para dar mais espaço à lista de jogos';
      button.innerHTML = `<span>${collapsed ? 'Mostrar destaque' : 'Recolher destaque'}</span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="${collapsed ? 'M4 6l4 4 4-4' : 'M4 10l4-4 4 4'}"/></svg>`;
    }
    button.addEventListener('click', () => { collapsed = !collapsed; update(); });
    row.append(button);
    hero.before(row);
    update();
  }
  const original = buildLayout;
  buildLayout = function(...args) { const result = original.apply(this,args); install(); return result; };
  install();
})();
