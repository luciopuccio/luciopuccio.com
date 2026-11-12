# luciopuccio.com
Lucio's playground — live at https://luciopuccio.com

## Structure
- `index.html` — landing page (interactive hero, filterable project cards, links)
- `pi/` — Pi Arcade
- `nav.js` — shared top bar linking back to the home page

## Adding a project
1. Put the project in its own folder, e.g. `algebra/index.html` → served at `/algebra/`.
   Add the site bar as the first line inside `<body>`:
   `<script src="/nav.js"></script>` (add `data-theme="dark"` on dark pages).
   For a full-screen app, make `body` a flex column and let the main container `flex: 1` so the 48px bar fits.
2. In `index.html`, add an entry to the `PROJECTS` list near the bottom:

```js
{
  title: "Algebra Path",
  url: "/algebra/",
  blurb: "One-line description.",
  topics: ["Maths"],          // filter chips are built automatically from these
  status: "live",             // or "soon" for a coming-soon card
  cta: "Open",
  cover: { glyph: "x²", c1: "#ff9b3d", c2: "#ffc53d" }
}
```

## Private section (/private)

- `/private/*` is locked with **Cloudflare Access** (Zero Trust → Access controls → Applications → "My space"; policy "Only me").
- `worker.js` serves the site's static files and answers `/private/api/*`. It re-checks the Access login token before doing anything.
- `/private/cycling/` reads and writes the **Cycling** Google Sheet through an Apps Script web app (`tools/cycling-apps-script.gs`).
- The Apps Script URL is stored only as the Worker secret **`SHEET_API_URL`** (Workers & Pages → luciopuccio-com → Settings → Variables and Secrets). Nothing private lives in this repo.
- `.assetsignore` keeps `worker.js`, `wrangler.jsonc` and `tools/` from being served as pages.
