interface CollapseHandlers {
  onShow: () => void;
}

export interface CollapseHandle {
  restore: () => void;
}

const COLOR = '#38434F';
const SHOW_FADE_MS = 200;

function btn(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.style.cssText =
    `border:1px solid ${COLOR};border-radius:5px;background:transparent;` +
    `color:${COLOR};padding:2px 8px;min-height:22px;line-height:1;` +
    `font:400 11px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;` +
    `cursor:pointer;opacity:0.65;transition:opacity 120ms ease;flex-shrink:0;`;
  b.addEventListener('mouseenter', () => { b.style.opacity = '1'; });
  b.addEventListener('mouseleave', () => { b.style.opacity = '0.65'; });
  b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onClick(); });
  return b;
}

export function collapsePost(
  postEl: HTMLElement,
  reasons: string[],
  handlers: CollapseHandlers
): CollapseHandle {
  if (postEl.dataset.slopblockCollapsed === '1') {
    return { restore: () => undefined };
  }

  // ── Save original inline styles for restore ──────────────────────────
  const savedDisplay = postEl.style.display;
  const savedOpacity = postEl.style.opacity;
  const savedTransition = postEl.style.transition;
  const savedPointerEvents = postEl.style.pointerEvents;

  // ── Hide instantly – zero animation so there is zero flicker on load ─
  postEl.dataset.slopblockCollapsed = '1';
  postEl.style.transition = 'none';
  postEl.style.opacity = '0';
  postEl.style.pointerEvents = 'none';
  postEl.style.display = 'none';

  // ── Build banner ─────────────────────────────────────────────────────
  const banner = document.createElement('div');
  banner.dataset.slopblockBanner = '1';
  banner.style.cssText =
    'background:transparent;padding:4px 2px;';

  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;gap:8px;';

  const lbl = document.createElement('span');
  lbl.textContent = 'Filtered post';
  lbl.style.cssText =
    `color:${COLOR};opacity:0.45;font:400 italic 11px/1 ` +
    `-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;white-space:nowrap;`;

  const controls = document.createElement('div');
  controls.style.cssText = 'display:inline-flex;align-items:center;gap:4px;flex-shrink:0;';

  const details = document.createElement('div');
  details.hidden = true;
  details.style.cssText =
    `color:${COLOR};opacity:0.5;font-size:10px;margin-top:3px;` +
    `padding-left:2px;font-style:italic;`;
  details.textContent = reasons.length > 0 ? reasons.join(', ') : 'threshold';

  const whyBtn = btn('Why?', () => {
    const isOpen = !details.hidden;
    details.hidden = isOpen;
    whyBtn.textContent = isOpen ? 'Why?' : 'Hide';
  });

  controls.appendChild(whyBtn);
  controls.appendChild(btn('Show', handlers.onShow));

  row.appendChild(lbl);
  row.appendChild(controls);
  banner.appendChild(row);
  banner.appendChild(details);

  postEl.parentElement?.insertBefore(banner, postEl);

  // ── Restore: fade the post back in smoothly ───────────────────────────
  return {
    restore: () => {
      banner.remove();
      delete postEl.dataset.slopblockCollapsed;

      // Reset to a known starting state for the fade-in
      postEl.style.transition = 'none';
      postEl.style.display = savedDisplay;
      postEl.style.opacity = '0';
      postEl.style.pointerEvents = savedPointerEvents;

      // Double-rAF ensures the display:block frame is committed before
      // we start the opacity transition – eliminates the Show flicker
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          postEl.style.transition = `opacity ${SHOW_FADE_MS}ms ease`;
          postEl.style.opacity = savedOpacity !== '' ? savedOpacity : '1';
          window.setTimeout(() => {
            postEl.style.transition = savedTransition;
            postEl.style.opacity = savedOpacity;
          }, SHOW_FADE_MS + 30);
        });
      });
    }
  };
}
