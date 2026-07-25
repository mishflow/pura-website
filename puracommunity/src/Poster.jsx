import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { fetchSchedule, pickCurrentWeek, upcomingDays } from './sheet'
import { FORMATS } from './config'
import Frame from './Frames'
import './Poster.css'

export default function Poster() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [week, setWeek] = useState(null)
  const [format, setFormat] = useState('post')
  const [scale, setScale] = useState(0.3)
  const [busy, setBusy] = useState(false)

  const stageRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    let alive = true
    fetchSchedule()
      .then((d) => { if (!alive) return; setData(d); setWeek(pickCurrentWeek(d)) })
      .catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [])

  // Fit the fixed-size frame into the available stage width/height.
  useLayoutEffect(() => {
    function fit() {
      if (!stageRef.current) return
      const { w, h } = FORMATS[format]
      const availW = stageRef.current.clientWidth - 48
      const availH = Math.max(window.innerHeight - 240, 420)
      setScale(Math.min(availW / w, availH / h, 1))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [format, data, week])

  // Shrink class/teacher text just enough that no block clips at whatever
  // row height a given week produces. Writes plain px so the PNG stays clean.
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame || format === 'story') return
    const isSq = format === 'square'
    const baseN = isSq ? 22 : 25
    const baseT = isSq ? 15 : 17
    const names = [...frame.querySelectorAll('.blk .n')]
    const teas = [...frame.querySelectorAll('.blk .tea')]
    const blks = [...frame.querySelectorAll('.blk')]
    const apply = (fs) => {
      names.forEach((e) => { e.style.fontSize = (baseN * fs).toFixed(2) + 'px' })
      teas.forEach((e) => { e.style.fontSize = (baseT * fs).toFixed(2) + 'px' })
    }
    const clips = () => blks.some((b) => b.scrollHeight > b.clientHeight + 1)
    let fs = 1
    apply(fs)
    while (fs > 0.55 && clips()) { fs -= 0.04; apply(fs) }
  }, [format, data, week])

  async function download() {
    if (!frameRef.current) return
    setBusy(true)
    try {
      const { w, h } = FORMATS[format]
      await document.fonts?.ready
      const url = await toPng(frameRef.current, {
        width: w, height: h, pixelRatio: 1, cacheBust: true, backgroundColor: '#fdfaf7',
      })
      const a = document.createElement('a')
      a.download = `pura-week${week}-${format}.png`
      a.href = url
      a.click()
    } catch (e) {
      setError('Download failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  const { w, h } = FORMATS[format]
  const weekData = data && week ? data.weeks[week] : null
  const storyDays = data ? upcomingDays(data, 3) : []

  return (
    <div className="poster">
      <header className="poster-head">
        <h2>Pura · Instagram Schedule Poster</h2>
        <p>Reads the live schedule sheet. Pick a week and format, then download a ready-to-post image.</p>
      </header>

      <div className="poster-controls">
        <div className="grp">
          <label htmlFor="wk">Week</label>
          <select id="wk" value={week ?? ''} disabled={!data || format === 'story'}
            onChange={(e) => setWeek(e.target.value)}>
            {data?.order.map((wn) => (
              <option key={wn} value={wn}>{`Week ${wn} · ${data.weeks[wn].label}`}</option>
            ))}
          </select>
        </div>
        <div className="grp">
          <label>Format</label>
          <div className="seg">
            {Object.entries(FORMATS).map(([key, f]) => (
              <button key={key} className={format === key ? 'on' : ''}
                onClick={() => setFormat(key)}>{f.label}</button>
            ))}
          </div>
        </div>
        <button className="dl" onClick={download} disabled={!weekData || busy}>
          {busy ? 'Rendering…' : 'Download PNG'}
        </button>
      </div>

      <div className="poster-status">
        {error ? error
          : !data ? 'Loading live schedule…'
          : format === 'story'
            ? `Next 3 days from today (${storyDays[0]?.dateLabel} – ${storyDays[2]?.dateLabel}) — STORY (${w}×${h})`
            : `Week ${week} · ${weekData?.label} — ${format.toUpperCase()} (${w}×${h})`}
      </div>

      <div className="poster-stage" ref={stageRef}>
        {weekData && (
          <div className="poster-scaler" style={{ width: w * scale, height: h * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: w, height: h }}>
              <Frame format={format} weekData={weekData} storyDays={storyDays} frameRef={frameRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
