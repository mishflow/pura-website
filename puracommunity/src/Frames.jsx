import { buildRows, to12h } from './sheet'
import { STUDIO, INFO } from './config'
import './frames.css'

// Shared 7-day timetable grid (styled by the parent frame class).
function WeekGrid({ items }) {
  const { rows, activeDays, days } = buildRows(items)
  return (
    <div className="grid">
      <div className="corner" />
      {days.map((d, i) => (
        <div key={d} className={'dh' + (activeDays[i] ? '' : ' rest')}>{d}</div>
      ))}
      {rows.map((row, ri) =>
        row.type === 'break' ? (
          <div key={`b${ri}`} className="brk"><span>Break</span></div>
        ) : (
          <TimeRow key={row.time} time={to12h(row.time)} cells={row.cells} />
        )
      )}
    </div>
  )
}

function TimeRow({ time, cells }) {
  return (
    <>
      <div className="th">{time}</div>
      {cells.map((it, i) => (
        <div className="cell" key={i}>
          {it && (
            <div className={`blk ${it.cat}`}>
              <div className="n">{it.cls}</div>
              <div className="tea">with {it.teacher}</div>
            </div>
          )}
        </div>
      ))}
    </>
  )
}

function Mast({ label }) {
  return (
    <div className="mast">
      <div className="eyebrow">{STUDIO.eyebrow}</div>
      <h1>Weekly Schedule</h1>
      <div className="sub">{label}</div>
    </div>
  )
}

function Foot() {
  return (
    <div className="foot">
      <div className="foot-handle">{STUDIO.handle}</div>
      <div className="foot-book">Book · link in bio</div>
    </div>
  )
}

// A single day column for the Story (3-day) format.
function DayColumn({ day }) {
  return (
    <div className="col">
      <div className="chead">
        <span className={'badge' + (day.badge ? '' : ' ghost')}>{day.badge || ' '}</span>
        <div className="dfull">{day.dayLong}</div>
        <div className="ddate">{day.dateLabel}</div>
      </div>
      <div className="cbody">
        {day.items.length === 0 ? (
          <div className="rest">Rest day</div>
        ) : (
          day.items.map((it, i) => (
            <div className={`rcard ${it.cat}`} key={i}>
              <div className="rtime">{to12h(it.time)}</div>
              <div className="rname">{it.cls}</div>
              <div className="rmeta">with {it.teacher}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// The exported frame. `frameRef` is attached to the true-pixel node so the
// PNG export captures it at full resolution.
// - post / square: full week grid of `weekData`
// - story: rolling 3-day view (`storyDays`) + "Good to know"
export default function Frame({ format, weekData, storyDays, frameRef }) {
  if (format === 'story') {
    return (
      <div className="frame story" ref={frameRef}>
        <div className="mast">
          <div className="eyebrow">{STUDIO.eyebrow}</div>
          <h1>What&rsquo;s On</h1>
          <div className="sub">the next few days</div>
        </div>
        <div className="cols">
          {storyDays.map((d) => <DayColumn key={d.iso} day={d} />)}
        </div>
        <div className="info">
          <div className="info-h">Good to know</div>
          {INFO.map(([k, v]) => (
            <div className="irow" key={k}>
              <div className="ik">{k}</div>
              <div className="iv">{v}</div>
            </div>
          ))}
        </div>
        <Foot />
      </div>
    )
  }

  const cls = format === 'square' ? 'sq' : 'post'
  return (
    <div className={`frame ${cls}`} ref={frameRef}>
      <Mast label={weekData.label} />
      <WeekGrid items={weekData.items} />
      <Foot />
    </div>
  )
}
