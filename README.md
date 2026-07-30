# Pura — marketing website

The static marketing site for **purapilatessrilanka.com**, served by
**GitHub Pages** from the root of this repo.

**What it is:** hand-written HTML/CSS pages.

**Key files & folders:**
- `index.html` — homepage
- `pages/` — source pages (`ahangama.html`, `retreat.html`, `green-season.html`, `cancellations.html`, `index.html`)
- `ahangama/`, `retreat/`, `green-season/`, `cancellations/` — published copies of those pages
- `assets/`, `Photos/`, `First Try/` — images and older drafts
- `CNAME` — custom domain (`purapilatessrilanka.com`)
- `deploy.sh` — copies `pages/*` to their published locations, commits, and pushes (Pages redeploys)

**Deploy:** `./deploy.sh "message"` → live in ~1 min.

---

## Pura Community moved out

The Pura Community app (schedule tools + the future booking app) now lives in
its **own private repo** and is no longer part of this repo:

**https://github.com/mishflow/puracommunity** — deployed on Vercel
(`puracommunity.vercel.app`).

This repo is now **only** the marketing website.
