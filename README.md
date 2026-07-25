# Pura — repository overview

This repo holds **two separate things**. Keep them clearly apart.

---

## 1. Legacy website (live now)

The existing static marketing site for **purapilatessrilanka.com**, served by
**GitHub Pages** from the root of this repo.

**What it is:** hand-written HTML/CSS pages.

**Key files & folders (repo root):**
- `index.html` — homepage
- `pages/` — source pages (`ahangama.html`, `retreat.html`, `green-season.html`, `cancellations.html`, `index.html`)
- `ahangama/`, `retreat/`, `green-season/`, `cancellations/` — published copies of those pages
- `assets/`, `Photos/`, `First Try/` — images and older drafts
- `CNAME` — custom domain (`purapilatessrilanka.com`)
- `deploy.sh` — copies `pages/*` to their published locations, commits, and pushes (Pages redeploys)

**Deploy:** `./deploy.sh "message"` → live in ~1 min.

> This is the old site. New work does **not** go here unless we're editing the
> existing marketing pages.

---

## 2. Pura Community (new — where new work goes)

`puracommunity/` — a **React + Vite** app, hosted **separately on Vercel**
(its own URL, not the Pages domain). This is the new home for tools and
features going forward.

**We're starting with scheduling**, then expanding to more over time.

**First feature — Instagram Schedule Poster:**
- Reads the live **Pura Schedule V2** Google Sheet (`Schedule_Master` tab) as CSV.
- Pick a week + format and download a ready-to-post image:
  - **Post** 1080×1350 (weekly grid)
  - **Square** 1080×1080 (weekly grid)
  - **Story** 1080×1920 (rolling 3-day view from today + "Good to know")
- Breaks are auto-computed from gaps in the class times.
- Also ships `puracommunity/instagram-poster.html` — a zero-install standalone
  version of the same tool.

**Config:** everything editable lives in `puracommunity/src/config.js`
(sheet id, prices/info, formats). See `puracommunity/README.md` for details.

**Run locally:**
```bash
cd puracommunity && npm install && npm run dev
```

**Deploy:** Vercel project with **Root Directory = `puracommunity`**; auto-builds
on every push to `main`.

---

## Quick rule of thumb

| If you're working on… | Go to… | Hosted by |
| --- | --- | --- |
| the marketing website | repo root (`index.html`, `pages/`) | GitHub Pages → purapilatessrilanka.com |
| schedule tools / new app features | `puracommunity/` | Vercel |
