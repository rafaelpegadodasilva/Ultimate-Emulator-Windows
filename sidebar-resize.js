// Resizable library sidebar; keep the user's preferred width across sessions.
(() => {
  const key = 'ue-sidebar-width';
  const style = document.createElement('style');
  style.textContent = `
    :root #sidebar { position:relative; width:auto!important; min-width:0!important }
    :root #ue2-system-list .system-btn-name { white-space:normal!important; overflow-wrap:break-word; text-overflow:clip!important; line-height:1.3; min-width:0 }
    #ue-sidebar-resizer { position:absolute; top:0; right:0; bottom:0; width:8px;
      z-index:30; cursor:col-resize; touch-action:none; outline:none; }
    #ue-sidebar-resizer:hover, #ue-sidebar-resizer:focus-visible,
    html.ue-sidebar-resizing #ue-sidebar-resizer { background:var(--win-accent,#438fff); opacity:.65 }
    html.ue-sidebar-resizing, html.ue-sidebar-resizing * { cursor:col-resize!important; user-select:none!important }
    @media(max-width:680px) { #ue-sidebar-resizer { display:none } }
  `;
  document.head.append(style);
  let preferred = 300;
  try { const saved = Number(localStorage.getItem(key)); if (saved >= 175) preferred = saved; } catch (_) {}
  function install() {
    const body = document.getElementById('body');
    const side = document.getElementById('sidebar');
    if (!body || !side || document.getElementById('ue-sidebar-resizer')) return;
    const handle = document.createElement('div');
    handle.id = 'ue-sidebar-resizer';
    handle.tabIndex = 0;
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', 'vertical');
    handle.setAttribute('aria-label', 'Largura da barra lateral');
    handle.title = 'Arraste para ajustar a largura. Use as setas ou dê dois cliques para restaurar.';
    side.append(handle);
    const maxWidth = () => {
      const right = document.getElementById('ue2-right');
      const rightWidth = right && getComputedStyle(right).display !== 'none' ? right.getBoundingClientRect().width : 0;
      return Math.max(175, Math.min(520, body.clientWidth - rightWidth - 360));
    };
    function apply() {
      if (innerWidth <= 680 || preferred === null) body.style.removeProperty('grid-template-columns');
      else {
        const right = document.getElementById('ue2-right');
        const width = Math.round(Math.max(175, Math.min(maxWidth(), preferred)));
        const rightWidth = right && getComputedStyle(right).display !== 'none' ? right.getBoundingClientRect().width : 0;
        body.style.setProperty('grid-template-columns', `${width}px minmax(0,1fr)${rightWidth ? ` ${rightWidth}px` : ''}`, 'important');
      }
      handle.setAttribute('aria-valuemin', '175');
      handle.setAttribute('aria-valuemax', String(Math.round(maxWidth())));
      handle.setAttribute('aria-valuenow', String(Math.round(side.getBoundingClientRect().width)));
    }
    function save() { try { localStorage.setItem(key, String(preferred)); } catch (_) {} }
    let drag = null;
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      drag = { id:event.pointerId, x:event.clientX, width:side.getBoundingClientRect().width };
      handle.setPointerCapture(event.pointerId);
      document.documentElement.classList.add('ue-sidebar-resizing');
    });
    handle.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      preferred = Math.max(175, Math.min(maxWidth(), drag.width + event.clientX - drag.x));
      apply();
    });
    function finish() {
      if (!drag) return;
      drag = null;
      document.documentElement.classList.remove('ue-sidebar-resizing');
      if (preferred !== null) save();
    }
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
    handle.addEventListener('lostpointercapture', finish);
    handle.addEventListener('dblclick', () => {
      preferred = null;
      try { localStorage.removeItem(key); } catch (_) {}
      apply();
    });
    handle.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const width = side.getBoundingClientRect().width;
      preferred = event.key === 'Home' ? 175 : event.key === 'End' ? maxWidth() :
        Math.max(175, Math.min(maxWidth(), width + (event.key === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 30 : 10)));
      apply(); save();
    });
    window.addEventListener('resize', apply);
    apply();
  }
  const original = buildLayout;
  buildLayout = function(...args) { const result = original.apply(this, args); install(); return result; };
  install();
})();
