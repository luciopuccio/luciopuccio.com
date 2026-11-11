/*
  Shared top bar for every page under luciopuccio.com.
  Add to any page (as the first thing inside <body>):
      <script src="/nav.js"></script>
  Optional: data-theme="dark" or "light" (default follows the device).
  The bar sits in normal page flow, 48px tall.
*/
(() => {
  const me = document.currentScript;
  const theme = (me && me.dataset.theme) || 'auto';
  const css = `
.lp-bar{--lpb-bg:rgba(255,244,232,.86);--lpb-ink:#2b1a10;--lpb-dim:#7a5f4e;--lpb-line:rgba(43,26,16,.10);--lpb-hover:rgba(255,106,26,.12);
  position:relative;z-index:60;flex:none;height:48px;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:0 max(12px,env(safe-area-inset-left)) 0 max(12px,env(safe-area-inset-left));
  background:var(--lpb-bg);border-bottom:1px solid var(--lpb-line);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  font:600 15px/1 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--lpb-ink);letter-spacing:normal;text-transform:none}
.lp-bar[data-theme=dark]{--lpb-bg:rgba(14,9,6,.72);--lpb-ink:#fbeee2;--lpb-dim:#c2a28c;--lpb-line:rgba(255,255,255,.10);--lpb-hover:rgba(255,155,61,.16)}
@media (prefers-color-scheme:dark){.lp-bar[data-theme=auto]{--lpb-bg:rgba(27,18,12,.86);--lpb-ink:#fbeee2;--lpb-dim:#c2a28c;--lpb-line:rgba(255,255,255,.08);--lpb-hover:rgba(255,155,61,.16)}}
.lp-bar a{color:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:10px;padding:6px 10px 6px 6px;border-radius:12px;transition:background .2s}
.lp-bar a:hover{background:var(--lpb-hover)}
.lp-bar a:focus-visible{outline:3px solid #ff6a1a;outline-offset:2px}
.lp-bar .lpb-mark{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#ff6a1a;color:#fff4e8;font:800 12px/1 system-ui,sans-serif;transition:transform .3s cubic-bezier(.3,1.6,.5,1)}
.lp-bar a:hover .lpb-mark{transform:rotate(-10deg) scale(1.08)}
.lp-bar .lpb-dom b{color:#ff6a1a;font-weight:700}
.lp-bar .lpb-all{color:var(--lpb-dim);padding:6px 10px;font-weight:600}
.lp-bar .lpb-all:hover{color:var(--lpb-ink)}
@media (max-width:340px){.lp-bar .lpb-dom{display:none}}
@media (prefers-reduced-motion:reduce){.lp-bar *{transition:none!important}}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const bar = document.createElement('nav');
  bar.className = 'lp-bar';
  bar.dataset.theme = theme;
  bar.setAttribute('aria-label', 'Site');
  bar.innerHTML =
    '<a href="/" aria-label="luciopuccio.com home"><span class="lpb-mark" aria-hidden="true">LP</span>' +
    '<span class="lpb-dom">lucio<b>puccio</b>.com</span></a>' +
    '<a class="lpb-all" href="/#projects">All projects →</a>';

  const place = () => document.body.insertBefore(bar, document.body.firstChild);
  if (document.body) place(); else document.addEventListener('DOMContentLoaded', place);
})();
