// Pura Pilates schedule — configuration.
// Everything you'd normally need to change lives here.

// The Google Sheet ("Pura Schedule V2"), Schedule_Master tab, read live as CSV.
// The sheet must be shared "Anyone with the link → Viewer" for the site to read it.
export const SHEET_ID = '1KMnwah9GyzJisURDDVrosugYndyWHKghFqejJcVv3tM'
export const SHEET_TAB = 'Schedule_Master'
export const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`

// Booking link (Bookwhen).
export const BOOKING_URL = 'https://bookwhen.com/pura'

export const STUDIO = {
  eyebrow: 'Pura Pilates · Ahangama',
  handle: '@purapilatessrilanka',
}

// A gap of this many minutes (or more) between consecutive class start times
// is shown as a "Break" divider row.
export const BREAK_GAP_MINUTES = 90

// "Good to know" panel shown on the Story format.
export const INFO = [
  ['Pricing', 'Reformer 6,000 · Mat & Yoga 3,000'],
  ['Booking', 'bookwhen.com/pura · walk-ins welcome'],
  ['Policy', 'Cancel 72h before · transfer up to 12h'],
  ['Arrive', '10 minutes early to settle in'],
  ['Sunday', 'Rest day, studio closed'],
]

// Instagram export formats (pixel dimensions).
export const FORMATS = {
  post: { label: 'Post 4:5', w: 1080, h: 1350 },
  square: { label: 'Square 1:1', w: 1080, h: 1080 },
  story: { label: 'Story 9:16', w: 1080, h: 1920 },
}
