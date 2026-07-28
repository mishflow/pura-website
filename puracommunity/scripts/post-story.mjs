// Daily Instagram Story auto-post.
//
// Pipeline: headless-render the `?render=story` frame -> PNG buffer
//        -> upload to Vercel Blob (public URL) -> Instagram Graph API publish.
//
// Env:
//   STORY_URL            page to capture (default http://localhost:4173/?render=story)
//   BLOB_READ_WRITE_TOKEN  Vercel Blob token (required unless DRY_RUN)
//   IG_USER_ID           Instagram Business account id (required unless DRY_RUN)
//   IG_ACCESS_TOKEN      long-lived Instagram-login token (required unless DRY_RUN)
//   GRAPH_BASE           API host (default https://graph.instagram.com — the
//                        Instagram-login path; use https://graph.facebook.com
//                        for the Facebook-Page path)
//   GRAPH_VERSION        Graph API version (default v21.0)
//   DRY_RUN=1            render + host only; skip the Instagram publish
//   OUT_PNG              also write the PNG to this local path (optional)
//
// Exits non-zero on any failure so the CI job is marked failed.

import { put } from '@vercel/blob'
import puppeteer from 'puppeteer'
import { writeFile } from 'node:fs/promises'

const STORY_URL = process.env.STORY_URL || 'http://localhost:4173/?render=story'
const GRAPH_VERSION = process.env.GRAPH_VERSION || 'v21.0'
const GRAPH_BASE = (process.env.GRAPH_BASE || 'https://graph.instagram.com').replace(/\/$/, '')
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
const WIDTH = 1080
const HEIGHT = 1920

function required(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

async function renderPng() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'],
  })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 })
    await page.goto(STORY_URL, { waitUntil: 'networkidle0', timeout: 60000 })

    // Wait for the app to signal fonts + live sheet are ready (or surface its error).
    await page.waitForFunction(
      () => window.__STORY_READY__ === true || typeof window.__STORY_ERROR__ === 'string',
      { timeout: 45000 },
    )
    const err = await page.evaluate(() => window.__STORY_ERROR__)
    if (err) throw new Error(`Render failed in-page: ${err}`)

    const frame = await page.$('.frame.story')
    if (!frame) throw new Error('Could not find .frame.story element to capture')
    const buf = await frame.screenshot({ type: 'png' })
    return Buffer.from(buf)
  } finally {
    await browser.close()
  }
}

async function uploadToBlob(buf) {
  const stamp = new Date().toISOString().slice(0, 10)
  // addRandomSuffix keeps each day's image at a unique, non-guessable URL.
  const { url } = await put(`stories/pura-story-${stamp}.png`, buf, {
    access: 'public',
    contentType: 'image/png',
    addRandomSuffix: true,
    token: required('BLOB_READ_WRITE_TOKEN'),
  })
  return url
}

async function postStory(imageUrl) {
  const igUser = required('IG_USER_ID')
  const token = required('IG_ACCESS_TOKEN')
  const base = `${GRAPH_BASE}/${GRAPH_VERSION}`

  // 1) Create the STORIES media container.
  const createRes = await fetch(`${base}/${igUser}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, media_type: 'STORIES', access_token: token }),
  })
  const create = await createRes.json()
  if (!createRes.ok || !create.id) {
    throw new Error(`media create failed: ${JSON.stringify(create)}`)
  }

  // 2) Publish it.
  const pubRes = await fetch(`${base}/${igUser}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: create.id, access_token: token }),
  })
  const pub = await pubRes.json()
  if (!pubRes.ok || !pub.id) {
    throw new Error(`media_publish failed: ${JSON.stringify(pub)}`)
  }
  return pub.id
}

async function main() {
  console.log(`[post-story] rendering ${STORY_URL} ...`)
  const png = await renderPng()
  console.log(`[post-story] rendered PNG (${png.length} bytes)`)

  if (process.env.OUT_PNG) {
    await writeFile(process.env.OUT_PNG, png)
    console.log(`[post-story] wrote ${process.env.OUT_PNG}`)
  }

  if (DRY_RUN && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.log('[post-story] DRY_RUN with no blob token: stopping after render.')
    return
  }

  const imageUrl = await uploadToBlob(png)
  console.log(`[post-story] hosted at ${imageUrl}`)

  if (DRY_RUN) {
    console.log('[post-story] DRY_RUN: skipping Instagram publish. Open the URL above to inspect.')
    return
  }

  const storyId = await postStory(imageUrl)
  console.log(`[post-story] published Story ${storyId} ✅`)
}

main().catch((e) => {
  console.error(`[post-story] ERROR: ${e.message}`)
  process.exit(1)
})
