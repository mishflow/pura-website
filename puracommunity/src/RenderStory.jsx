import { useEffect, useRef, useState } from 'react'
import { fetchSchedule, upcomingDays } from './sheet'
import { FORMATS } from './config'
import Frame from './Frames'

// Headless render target for the automated daily Story.
// Loaded via `?render=story`: draws ONLY the Story frame at true pixel size
// (no controls, no scaling) and sets window.__STORY_READY__ = true once the
// live sheet has loaded and web fonts are ready, so a screenshotter knows when
// to capture. Sets window.__STORY_ERROR__ on failure.
export default function RenderStory() {
  const [data, setData] = useState(null)
  const frameRef = useRef(null)
  const { w, h } = FORMATS.story

  useEffect(() => {
    let alive = true
    fetchSchedule()
      .then((d) => alive && setData(d))
      .catch((e) => { window.__STORY_ERROR__ = e.message })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!data || !frameRef.current) return
    let cancelled = false
    ;(async () => {
      await document.fonts?.ready
      // One more frame so layout/fonts settle before we flag ready.
      requestAnimationFrame(() => { if (!cancelled) window.__STORY_READY__ = true })
    })()
    return () => { cancelled = true }
  }, [data])

  if (!data) return null
  const storyDays = upcomingDays(data, 3)

  return (
    <div style={{ width: w, height: h, background: '#fdfaf7' }}>
      <Frame format="story" storyDays={storyDays} frameRef={frameRef} />
    </div>
  )
}
