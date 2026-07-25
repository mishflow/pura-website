import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { fetchSchedule, pickCurrentWeek } from './sheet'
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

  return (
    <div className="poster">
      <header className="poster-head">
        <h2>Pura · Instagram Schedule Poster</h2>
        <p>Reads the live schedule sheet. Pick a week and format, then download a ready-to-post image.</p>
      </header>

      <div className="poster-controls">
        <div className="grp">
          <label htmlFor="wk">Week</label>
          <select id="wk" value={week ?? ''} disabled={!data}
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
          : `Week ${week} · ${weekData?.label} — ${format.toUpperCase()} (${w}×${h})`}
      </div>

      <div className="poster-stage" ref={stageRef}>
        {weekData && (
          <div className="poster-scaler" style={{ width: w * scale, height: h * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: w, height: h }}>
              <Frame format={format} weekData={weekData} frameRef={frameRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
