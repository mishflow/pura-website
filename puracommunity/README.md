# Pura Pilates Schedule

A responsive weekly schedule for Pura Pilates, styled in the Pura brand palette.
The schedule is read **live** from the "Pura Schedule V2" Google Sheet, so editing
the sheet updates the site with no redeploy.

## How it works

- On load, the app fetches the `Schedule_Master` tab as CSV and groups classes by
  week number.
- It shows only public, `Scheduled` classes (Privates, Studio Rentals, and anything
  not `Scheduled` are excluded).
- It auto-selects the week matching today's date (falling back to the next upcoming
  week), and a dropdown lets visitors browse any week.
- A **Break** divider is drawn automatically wherever there's a gap of
  `BREAK_GAP_MINUTES` (90) or more between class start times.

## Configuration

Everything you'd normally change lives in `src/config.js`:

- `SHEET_ID` / `SHEET_TAB` — the Google Sheet and tab to read.
- `BOOKING_URL` — the "Book a class" link (currently a placeholder — set the real
  Bookwhen URL).
- `BREAK_GAP_MINUTES` — how big a gap counts as a break.
- `STUDIO` — eyebrow text and Instagram handle.

### Important: the sheet must be viewable

For the site to read the sheet, it must be shared **"Anyone with the link → Viewer"**
(File → Share). No API key is needed — it's read as a published CSV.

## Editing the schedule

Edit the `Schedule_Master` tab in the Google Sheet. Columns used:
`Week Number, Date, Day, Start_Time, Class_Type, Teacher, Status`.
Set `Status` to `Scheduled` for a class to appear.

Class colours are derived from `Class_Type`: anything with "Mat" → sage,
Reformer → rust/peach, Yoga → blush, other specials → mauve.

## Develop / build

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Deploy

Push to GitHub and import in Vercel (auto-detects Vite), or `vercel` from the CLI.

---

**Brand**: Pura Pilates Ahangama · **Fonts**: Cormorant Garamond (headers), Jost (body)
