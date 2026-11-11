# luciopuccio.com
Lucio's playground — live at https://luciopuccio.com

## Structure
- `index.html` — landing page (interactive hero, filterable project cards, links)
- `pi/` — Pi Arcade

## Adding a project
1. Put the project in its own folder, e.g. `algebra/index.html` → served at `/algebra/`.
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
