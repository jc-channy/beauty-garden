import React, { useState, useMemo } from 'react'
import { CATEGORY_COLORS, localDateStr, getWeekDates, isUsedOnDate, todayKey } from '../store/useStore.js'

// ── Helpers ────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function TabPill({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
      {tabs.map(({ id, label }) => (
        <button key={id} onClick={() => onChange(id)} style={{
          padding: '6px 14px', borderRadius: 20, border: '0.5px solid', fontSize: 12, cursor: 'pointer', fontWeight: active === id ? 500 : 400,
          borderColor: active === id ? '#C8A87A' : 'var(--border-soft)',
          background: active === id ? '#F2E6D9' : 'var(--bg-surface)',
          color: active === id ? '#8A6A40' : 'var(--text-muted)',
        }}>{label}</button>
      ))}
    </div>
  )
}

// ── Water ml helper ────────────────────────────────────────────
function waterMl(waterLogs, date) {
  const d = waterLogs[date]
  if (!d) return 0
  return typeof d === 'number' ? d : (d.total || 0)
}

// ── Body calendar view ─────────────────────────────────────────
function BodyCalendar({ bodyLogs, metric }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed

  const todayStr = localDateStr(today)
  const DOW = ['一', '二', '三', '四', '五', '六', '日']

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    const now = new Date()
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth())) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  // Build calendar grid (Mon-first)
  const firstDow = new Date(year, month, 1).getDay() // 0=Sun
  const leadingBlanks = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const unit = metric === 'weight' ? 'kg' : '%'
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)', padding: '2px 10px' }}>‹</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{year} 年 {month + 1} 月</div>
          {!isCurrentMonth && (
            <button onClick={goToday} style={{ fontSize: 11, color: '#8A6A40', background: '#F2E6D9', border: 'none', borderRadius: 8, padding: '2px 8px', cursor: 'pointer' }}>回本月</button>
          )}
        </div>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: isCurrentMonth ? 'var(--border-soft)' : 'var(--text-secondary)', padding: '2px 10px' }}>›</button>
      </div>
      {/* Day-of-week header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {DOW.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', paddingBottom: 4 }}>{d}</div>
        ))}
      </div>
      {/* Calendar cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const mm = String(month + 1).padStart(2, '0')
          const dd = String(day).padStart(2, '0')
          const dateStr = `${year}-${mm}-${dd}`
          const log = bodyLogs[dateStr]
          const val = log ? (metric === 'weight' ? log.weight : log.bodyFat) : null
          const isToday = dateStr === todayStr
          const isFuture = dateStr > todayStr
          return (
            <div key={i} style={{
              borderRadius: 8, padding: '4px 2px', textAlign: 'center', minHeight: 44,
              background: isToday ? '#FADADD' : val != null ? 'var(--bg-surface)' : 'transparent',
              border: isToday ? '1px solid #E8A0A8' : 'none',
              opacity: isFuture ? 0.3 : 1,
            }}>
              <div style={{ fontSize: 10, color: isToday ? '#C06070' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400, marginBottom: 2 }}>{day}</div>
              {val != null && (
                <div style={{ fontSize: 9, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.2 }}>
                  {Number(val).toFixed(Number(val) % 1 === 0 ? 0 : 2)}{unit}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Body trend chart (line) ────────────────────────────────────
function BodyLineChart({ bodyLogs, period, metric, goalWeight, goalFat }) {
  const days = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[period]
  const data = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = localDateStr(d)
    const log = bodyLogs[key]
    if (log) {
      const val = metric === 'weight' ? log.weight : log.bodyFat
      if (val != null) data.push({ date: key, val: Number(val) })
    }
  }
  if (data.length < 2) {
    return <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>這個期間資料不足，繼續記錄後趨勢圖會出現</div>
  }
  const W = 320, H = 120, padL = 32, padR = 8, padT = 8, padB = 20
  const vals = data.map(d => d.val)
  const goal = metric === 'weight' ? goalWeight : goalFat
  const minV = Math.min(...vals, goal ?? Infinity)
  const maxV = Math.max(...vals, goal ?? -Infinity)
  const rangeV = maxV - minV || 1
  const xOf = i => padL + ((i / (data.length - 1)) * (W - padL - padR))
  const yOf = v => padT + ((maxV - v) / rangeV) * (H - padT - padB)
  const polyline = data.map((d, i) => `${xOf(i)},${yOf(d.val)}`).join(' ')
  const yLabels = [maxV, (maxV + minV) / 2, minV].map(v => ({ v, y: yOf(v) }))
  const xLabels = [0, Math.floor(data.length / 2), data.length - 1].map(i => ({ x: xOf(i), label: data[i].date.slice(5).replace('-', '/') }))
  const unit = metric === 'weight' ? 'kg' : '%'
  const lastVal = data[data.length - 1]?.val
  const diff = lastVal - data[0]?.val
  const goalY = goal != null ? yOf(Math.max(minV, Math.min(maxV, goal))) : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 500, color: 'var(--text-primary)' }}>{lastVal?.toFixed(2)}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unit}</span>
        {diff !== 0 && <span style={{ fontSize: 12, color: diff <= 0 ? '#5A7A52' : '#C07070', fontWeight: 500 }}>{diff > 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}{unit}</span>}
        {goal != null && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>距目標 {Math.abs(lastVal - goal).toFixed(1)}{unit}</span>}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {yLabels.map(({ v, y }) => <text key={v} x={padL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">{v.toFixed(1)}</text>)}
        {yLabels.map(({ y }) => <line key={y} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#EDE6DE" strokeWidth="0.5" />)}
        {goalY != null && <><line x1={padL} y1={goalY} x2={W - padR} y2={goalY} stroke="#A8C8A0" strokeWidth="1" strokeDasharray="4 3" /><text x={W - padR + 2} y={goalY + 3} fontSize="8" fill="#5A7A52">目標</text></>}
        <polyline points={polyline} fill="none" stroke="#C8A87A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => <circle key={i} cx={xOf(i)} cy={yOf(d.val)} r="2.5" fill="#C8A87A" />)}
        <circle cx={xOf(data.length - 1)} cy={yOf(lastVal)} r="5" fill="#C8A87A" stroke="#FDF8F2" strokeWidth="2" />
        {xLabels.map(({ x, label }) => <text key={label} x={x} y={H - 2} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{label}</text>)}
      </svg>
    </div>
  )
}

function BodyTrendSection({ bodyLogs, goalWeight, goalFat }) {
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' | 'chart'
  const [period, setPeriod] = useState('1M')
  const [metric, setMetric] = useState('weight')

  const btnStyle = (active) => ({
    padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '0.5px solid',
    borderColor: active ? '#C8A87A' : 'var(--border-soft)',
    background: active ? '#F2E6D9' : 'var(--bg-surface)',
    color: active ? '#8A6A40' : 'var(--text-muted)',
    fontWeight: active ? 500 : 400,
  })

  return (
    <div>
      {/* 體重 / 體脂 selector */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {[['weight', '體重'], ['bodyFat', '體脂']].map(([k, label]) => (
          <button key={k} onClick={() => setMetric(k)} style={btnStyle(metric === k)}>{label}</button>
        ))}
      </div>

      {/* Chart / calendar content */}
      {viewMode === 'calendar' ? (
        <BodyCalendar bodyLogs={bodyLogs || {}} metric={metric} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
            {['1M', '3M', '6M', '1Y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: '0.5px solid', borderColor: period === p ? '#C8A87A' : 'var(--border-soft)', background: period === p ? '#F2E6D9' : 'var(--bg-surface)', color: period === p ? '#8A6A40' : 'var(--text-muted)', fontWeight: period === p ? 500 : 400 }}>{p}</button>
            ))}
          </div>
          <BodyLineChart bodyLogs={bodyLogs} period={period} metric={metric} goalWeight={goalWeight} goalFat={goalFat} />
        </>
      )}

      {/* 月曆 / 折線 toggle — 移到圖表下方 */}
      <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
        {[['calendar', '月曆'], ['chart', '折線']].map(([v, label]) => (
          <button key={v} onClick={() => setViewMode(v)} style={btnStyle(viewMode === v)}>{label}</button>
        ))}
      </div>
    </div>
  )
}

// ── Skincare habit tracker ─────────────────────────────────────
function SkincareTracker({ products, amOrder, pmOrder, forcedSection }) {
  const hour = new Date().getHours()
  const [section, setSection] = useState(forcedSection || (hour >= 12 ? 'pm' : 'am'))
  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = getWeekDates(weekOffset)
  const todayStr = localDateStr(new Date())
  const DOW = ['一', '二', '三', '四', '五', '六', '日']
  const fmt = d => `${d.slice(5, 7)}/${d.slice(8, 10)}`
  const filtered = products.filter(p => !p.timeOfDay || p.timeOfDay === section)
  const order = (section === 'am' ? amOrder : pmOrder) || []
  const sorted = (() => {
    if (!order || order.length === 0) return filtered
    const indexed = new Map(order.map((id, i) => [id, i]))
    return [...filtered].sort((a, b) => {
      const ai = indexed.has(a.id) ? indexed.get(a.id) : Infinity
      const bi = indexed.has(b.id) ? indexed.get(b.id) : Infinity
      return ai - bi
    })
  })()
  function isPerfect(d) { return sorted.length > 0 && sorted.every(p => isUsedOnDate(p.usageLog, d, section)) }

  return (
    <div>
      {!forcedSection && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[['am', '☀️ 白天'], ['pm', '🌙 晚上']].map(([s, label]) => (
            <button key={s} onClick={() => setSection(s)} style={{ padding: '5px 14px', borderRadius: 20, border: '0.5px solid', borderColor: section === s ? '#A8C8A0' : 'var(--border-soft)', background: section === s ? '#EEF4EC' : 'var(--bg-surface)', color: section === s ? '#5A7A52' : 'var(--text-muted)', fontSize: 12, fontWeight: section === s ? 500 : 400, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 8px' }}>‹</button>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{fmt(weekDates[0])}～{fmt(weekDates[6])}</div>
        <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: weekOffset === 0 ? 'var(--border-soft)' : 'var(--text-secondary)', padding: '2px 8px' }}>›</button>
      </div>
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>{section === 'am' ? '尚未加入白天保養品' : '尚未加入晚上保養品'}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6, paddingLeft: 4 }}>
            <div style={{ width: 100, minWidth: 100 }} />
            {weekDates.map((d, i) => {
              const isToday = d === todayStr
              return (
                <div key={d} style={{ width: 34, minWidth: 34, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: isToday ? '#5A7A52' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400 }}>{DOW[i]}</div>
                  <div style={{ fontSize: 10, color: isToday ? '#5A7A52' : 'var(--text-muted)' }}>{d.slice(8, 10)}</div>
                </div>
              )
            })}
          </div>
          {sorted.map(p => {
            const name = p.nickname || p.name || p.brand || '未命名'
            const catColor = p.category ? CATEGORY_COLORS[p.category] : null
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', paddingBottom: 4, paddingLeft: 4 }}>
                <div style={{ width: 100, minWidth: 100, paddingRight: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{name}</span>
                </div>
                {weekDates.map(d => {
                  const used = isUsedOnDate(p.usageLog, d, section)
                  const isFuture = d > todayStr
                  const isToday = d === todayStr
                  return (
                    <div key={d} style={{ width: 34, minWidth: 34, textAlign: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, margin: '0 auto', background: used ? (catColor?.bg || '#C8D8C0') : isFuture ? 'transparent' : 'var(--bg-surface)', border: isToday && !used ? '1.5px solid #C8A87A' : isFuture ? 'none' : used ? 'none' : '0.5px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {used && <span style={{ fontSize: 12, color: catColor?.text || '#5A7A52' }}>✓</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: 4, paddingLeft: 4 }}>
            <div style={{ width: 100, minWidth: 100, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, paddingRight: 6 }}>全部完成</div>
            {weekDates.map(d => {
              const perfect = isPerfect(d)
              return (
                <div key={d} style={{ width: 34, minWidth: 34, textAlign: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, margin: '0 auto', background: perfect ? '#F8C467' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {perfect && <span style={{ fontSize: 13 }}>★</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Supplement color palette (cycles per item) ────────────────
const SUPP_COLOR_CYCLE = [
  { bg: '#EFD7D7', text: '#9A6060' },
  { bg: '#D8D3DF', text: '#6A5A7A' },
  { bg: '#D7DFD2', text: '#5A7A52' },
  { bg: '#F2E6D9', text: '#8A6A40' },
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#EEEDFE', text: '#534AB7' },
  { bg: '#FEF3C0', text: '#6B4A00' },
  { bg: '#D7EDD4', text: '#245020' },
]

// ── Supplement weekly tracker ──────────────────────────────────
function SupplementTracker({ supplementItems, supplementCheckins }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = getWeekDates(weekOffset)
  const todayStr = localDateStr(new Date())
  const DOW = ['一', '二', '三', '四', '五', '六', '日']
  const fmt = d => `${d.slice(5, 7)}/${d.slice(8, 10)}`
  const items = supplementItems || []

  if (items.length === 0) {
    return <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>尚未設定保健品，在今日頁面新增</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 8px' }}>‹</button>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{fmt(weekDates[0])}～{fmt(weekDates[6])}</div>
        <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: weekOffset === 0 ? 'var(--border-soft)' : 'var(--text-secondary)', padding: '2px 8px' }}>›</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6, paddingLeft: 4 }}>
          <div style={{ width: 100, minWidth: 100 }} />
          {weekDates.map((d, i) => {
            const isToday = d === todayStr
            return (
              <div key={d} style={{ width: 34, minWidth: 34, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: isToday ? '#534AB7' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400 }}>{DOW[i]}</div>
                <div style={{ fontSize: 10, color: isToday ? '#534AB7' : 'var(--text-muted)' }}>{d.slice(8, 10)}</div>
              </div>
            )
          })}
        </div>
        {items.map((item, idx) => {
          const c = SUPP_COLOR_CYCLE[idx % SUPP_COLOR_CYCLE.length]
          return (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', paddingBottom: 4, paddingLeft: 4 }}>
              <div style={{ width: 100, minWidth: 100, paddingRight: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{item.name}</span>
              </div>
              {weekDates.map(d => {
                const taken = (supplementCheckins[d] || []).includes(item.name)
                const isFuture = d > todayStr
                return (
                  <div key={d} style={{ width: 34, minWidth: 34, textAlign: 'center' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, margin: '0 auto',
                      background: taken ? c.bg : isFuture ? 'transparent' : 'var(--bg-surface)',
                      border: taken ? `0.5px solid ${c.text}30` : isFuture ? 'none' : '0.5px solid var(--border-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {taken && <span style={{ fontSize: 12, color: c.text }}>✓</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Water week grid ────────────────────────────────────────────
function WaterWeekGrid({ waterLogs, goalMl }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = getWeekDates(weekOffset)
  const todayStr = localDateStr(new Date())
  const goal = goalMl || 2000
  const DOW = ['一', '二', '三', '四', '五', '六', '日']
  const fmt = d => `${d.slice(5, 7)}/${d.slice(8, 10)}`

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 8px' }}>‹</button>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{fmt(weekDates[0])}～{fmt(weekDates[6])}</div>
        <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: weekOffset === 0 ? 'var(--border-soft)' : 'var(--text-secondary)', padding: '2px 8px' }}>›</button>
      </div>
      {/* header */}
      <div style={{ display: 'flex', paddingLeft: 4, marginBottom: 4 }}>
        <div style={{ width: 80, minWidth: 80 }} />
        {weekDates.map((d, i) => {
          const isToday = d === todayStr
          return (
            <div key={d} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: isToday ? '#185FA5' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400 }}>{DOW[i]}</div>
              <div style={{ fontSize: 10, color: isToday ? '#185FA5' : 'var(--text-muted)' }}>{d.slice(8, 10)}</div>
            </div>
          )
        })}
      </div>
      {/* data row */}
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
        <div style={{ width: 80, minWidth: 80, fontSize: 11, color: 'var(--text-muted)' }}>目標 {goal}ml</div>
        {weekDates.map(d => {
          const ml = waterMl(waterLogs, d)
          const reached = ml >= goal
          const isFuture = d > todayStr
          const isToday = d === todayStr
          return (
            <div key={d} style={{ flex: 1, textAlign: 'center', padding: '2px' }}>
              <div style={{
                width: 32, height: 36, borderRadius: 8, margin: '0 auto',
                background: isFuture ? 'transparent' : ml === 0 ? 'var(--bg-surface)' : reached ? '#85B7EB' : '#D4E8F4',
                border: isToday ? '1.5px solid #185FA5' : isFuture ? 'none' : '0.5px solid var(--border-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {ml > 0 && !isFuture && (
                  <span style={{ fontSize: 9, color: reached ? '#0C447C' : '#185FA5', fontWeight: reached ? 600 : 400, lineHeight: 1.2, textAlign: 'center' }}>
                    {ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}`}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, background: '#85B7EB', borderRadius: 2 }} />
        <span>達到 {goal}ml</span>
        <div style={{ width: 10, height: 10, background: '#D4E8F4', borderRadius: 2, marginLeft: 8 }} />
        <span>未達目標</span>
      </div>
    </div>
  )
}

// ── Exercise grid tracker ──────────────────────────────────────
function ExerciseGrid({ exercises, exerciseTypes, onUpdateTypes }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [showEdit, setShowEdit] = useState(false)
  const [editTypes, setEditTypes] = React.useState(exerciseTypes || [])
  const weekDates = getWeekDates(weekOffset)
  const todayStr = localDateStr(new Date())
  const DOW = ['一', '二', '三', '四', '五', '六', '日']
  const fmt = d => `${d.slice(5, 7)}/${d.slice(8, 10)}`
  const types = exerciseTypes || []

  React.useEffect(() => { setEditTypes(exerciseTypes || []) }, [exerciseTypes])

  function saveEdit() {
    onUpdateTypes(editTypes.map(t => t.trim()).filter(Boolean))
    setShowEdit(false)
  }

  function hasType(type, date) {
    return (exercises || []).some(e => e.date === date && e.type === type)
  }

  if (showEdit) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>編輯運動類型</div>
          <button onClick={saveEdit} style={{ fontSize: 12, color: '#5A7A52', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>完成</button>
        </div>
        {editTypes.map((type, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button onClick={() => { if (i > 0) { const a = [...editTypes]; [a[i-1], a[i]] = [a[i], a[i-1]]; setEditTypes(a) } }} style={{ background: 'none', border: 'none', cursor: i > 0 ? 'pointer' : 'default', fontSize: 13, color: i > 0 ? 'var(--text-muted)' : 'var(--border-soft)', lineHeight: 1, padding: '1px 3px' }}>↑</button>
              <button onClick={() => { if (i < editTypes.length - 1) { const a = [...editTypes]; [a[i], a[i+1]] = [a[i+1], a[i]]; setEditTypes(a) } }} style={{ background: 'none', border: 'none', cursor: i < editTypes.length - 1 ? 'pointer' : 'default', fontSize: 13, color: i < editTypes.length - 1 ? 'var(--text-muted)' : 'var(--border-soft)', lineHeight: 1, padding: '1px 3px' }}>↓</button>
            </div>
            <input type="text" value={type} onChange={e => { const a = [...editTypes]; a[i] = e.target.value; setEditTypes(a) }} style={{ flex: 1, fontSize: 13 }} />
            <button onClick={() => setEditTypes(editTypes.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#C07070', padding: '0 4px' }}>×</button>
          </div>
        ))}
        <button onClick={() => setEditTypes([...editTypes, ''])} style={{ marginTop: 4, fontSize: 12, color: '#9A7A5A', background: 'none', border: '0.5px dashed var(--border-soft)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', width: '100%' }}>+ 新增類型</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 8px' }}>‹</button>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{fmt(weekDates[0])}～{fmt(weekDates[6])}</div>
        <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: weekOffset === 0 ? 'var(--border-soft)' : 'var(--text-secondary)', padding: '2px 8px' }}>›</button>
      </div>
      {types.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          尚未設定運動類型，<button onClick={() => setShowEdit(true)} style={{ color: '#9A7A5A', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', padding: 0 }}>新增</button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6, paddingLeft: 4 }}>
            <div style={{ width: 80, minWidth: 80 }} />
            {weekDates.map((d, i) => {
              const isToday = d === todayStr
              return (
                <div key={d} style={{ width: 34, minWidth: 34, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: isToday ? '#5A7A52' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400 }}>{DOW[i]}</div>
                  <div style={{ fontSize: 10, color: isToday ? '#5A7A52' : 'var(--text-muted)' }}>{d.slice(8, 10)}</div>
                </div>
              )
            })}
          </div>
          {types.map(type => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', paddingBottom: 4, paddingLeft: 4 }}>
              <div style={{ width: 80, minWidth: 80, paddingRight: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{type}</span>
              </div>
              {weekDates.map(d => {
                const logged = hasType(type, d)
                const isFuture = d > todayStr
                const isToday = d === todayStr
                return (
                  <div key={d} style={{ width: 34, minWidth: 34, textAlign: 'center' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, margin: '0 auto',
                      background: logged ? '#EEF4EC' : isFuture ? 'transparent' : 'var(--bg-surface)',
                      border: isToday && !logged ? '1.5px solid #C8A87A' : isFuture ? 'none' : logged ? 'none' : '0.5px solid var(--border-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {logged && <span style={{ fontSize: 12, color: '#5A7A52' }}>✓</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setShowEdit(true)} style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: '0.5px solid var(--border-soft)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>編輯類型</button>
    </div>
  )
}

// ── Observations ───────────────────────────────────────────────
function computeObservations({ waterLogs, bodyLogs, products, supplementCheckins, settings, exercises }) {
  const obs = []
  const today = todayKey()
  const thisWeek = getWeekDates(0)
  const goal = settings.waterGoalMl || 2000
  const thisWaterGoalDays = thisWeek.filter(d => d <= today && waterMl(waterLogs, d) >= goal).length
  if (thisWaterGoalDays >= 5) {
    obs.push({ icon: '💧', text: `這週你有 ${thisWaterGoalDays} 天達到飲水目標，水分補充得很好！` })
  } else {
    const lastWeek = getWeekDates(-1)
    const thisAvg = thisWeek.filter(d => d <= today).reduce((s, d) => s + waterMl(waterLogs, d), 0) / Math.max(1, thisWeek.filter(d => d <= today).length)
    const lastAvg = lastWeek.reduce((s, d) => s + waterMl(waterLogs, d), 0) / 7
    if (lastAvg > 0 && thisAvg > lastAvg * 1.1) {
      obs.push({ icon: '💧', text: `飲水量比上週多了 ${Math.round(thisAvg - lastAvg)}ml，繼續保持 ✦` })
    }
  }
  const recentWeights = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = localDateStr(d)
    if (bodyLogs[key]?.weight != null) recentWeights.push(Number(bodyLogs[key].weight))
  }
  if (recentWeights.length >= 5) {
    const h = Math.floor(recentWeights.length / 2)
    const first = recentWeights.slice(0, h).reduce((s, v) => s + v, 0) / h
    const second = recentWeights.slice(h).reduce((s, v) => s + v, 0) / (recentWeights.length - h)
    const diff = second - first
    if (diff < -0.3) obs.push({ icon: '✨', text: `近兩週體重趨勢向下，平均少了 ${Math.abs(diff).toFixed(1)}kg，方向對了！` })
    else if (Math.abs(diff) <= 0.3) obs.push({ icon: '⚖️', text: `近兩週體重相當穩定，維持得很好 ✦` })
  }
  let skincareStreak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = localDateStr(d)
    if ((products || []).some(p => isUsedOnDate(p.usageLog, key, null))) skincareStreak++; else break
  }
  if (skincareStreak >= 7) obs.push({ icon: '🌸', text: `保養連續 ${skincareStreak} 天，皮膚一定感受得到你的用心！` })
  else if (skincareStreak >= 3) obs.push({ icon: '🌱', text: `保養已連續 ${skincareStreak} 天，再一點就滿一週了！` })
  const weekEx = (exercises || []).filter(e => thisWeek.includes(e.date)).length
  if (weekEx >= 3) obs.push({ icon: '💪', text: `這週已運動 ${weekEx} 次，身體在謝謝你 ✦` })
  return obs.slice(0, 3)
}

// ── Achievements ───────────────────────────────────────────────
const ACHIEVEMENT_DEFS = [
  { id: 'first_complete',  icon: '🌱', label: '第一步',    desc: '完成第一次今日全部目標' },
  { id: 'streak_3',        icon: '✨', label: '三天習慣',  desc: '連續 3 天保養打卡' },
  { id: 'streak_7',        icon: '🌟', label: '一週之約',  desc: '連續 7 天保養打卡' },
  { id: 'streak_30',       icon: '💫', label: '月度堅持',  desc: '連續 30 天保養打卡' },
  { id: 'skincare_30',     icon: '🌺', label: '保養達人',  desc: '累積保養打卡 30 天' },
  { id: 'water_7',         icon: '💧', label: '水分充足',  desc: '連續 7 天喝水達標' },
  { id: 'body_7',          icon: '📊', label: '體態觀察',  desc: '連續 7 天記錄體重' },
  { id: 'exercise_10',     icon: '💪', label: '運動達人',  desc: '累積記錄 10 次運動' },
  { id: 'weight_goal',     icon: '🎯', label: '目標達成',  desc: '體重達到目標值' },
]

function computeAchievements({ products, waterLogs, bodyLogs, exercises, settings }) {
  const unlocked = new Set()
  let streak = 0, total = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = localDateStr(d)
    const used = (products || []).some(p => isUsedOnDate(p.usageLog, key, null))
    if (used) { total++; if (streak === i) streak++ }
  }
  if (total >= 1) unlocked.add('first_complete')
  if (streak >= 3) unlocked.add('streak_3')
  if (streak >= 7) unlocked.add('streak_7')
  if (streak >= 30) unlocked.add('streak_30')
  if (total >= 30) unlocked.add('skincare_30')
  const goalMl = settings.waterGoalMl || 2000
  let waterStreak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = localDateStr(d)
    if (waterMl(waterLogs, key) >= goalMl) waterStreak++; else break
  }
  if (waterStreak >= 7) unlocked.add('water_7')
  let bodyStreak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    if (bodyLogs[localDateStr(d)]?.weight != null) bodyStreak++; else break
  }
  if (bodyStreak >= 7) unlocked.add('body_7')
  if ((exercises || []).length >= 10) unlocked.add('exercise_10')
  const gw = settings.bodyGoalWeight
  if (gw != null) {
    const latest = Object.entries(bodyLogs).sort((a, b) => b[0].localeCompare(a[0]))[0]
    if (latest && Number(latest[1].weight) <= gw) unlocked.add('weight_goal')
  }
  return unlocked
}

// ── Main ───────────────────────────────────────────────────────
export default function AchievementsPage({ store }) {
  const { state, updateExerciseTypes } = store
  const { settings, products, waterLogs, bodyLogs, exercises, supplementCheckins } = state
  const [trackingTab, setTrackingTab] = useState('supplement')

  const observations = useMemo(() =>
    computeObservations({ waterLogs, bodyLogs, products, supplementCheckins, settings, exercises }),
    [waterLogs, bodyLogs, products, supplementCheckins, settings, exercises]
  )
  const TRACKING_TABS = [
    { id: 'supplement', label: '保健品' },
    { id: 'am_skincare', label: '早上保養' },
    { id: 'pm_skincare', label: '晚上保養' },
    { id: 'hydration_exercise', label: '飲水 & 運動' },
  ]

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>成就</div>
      </div>

      {/* 1. 本週觀察 */}
      {observations.length > 0 && (
        <Section title="本週觀察">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {observations.map((obs, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#FDF8F2', borderRadius: 14, padding: '12px 14px', border: '0.5px solid #EDE0CC' }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{obs.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{obs.text}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 2. 日常紀錄 (tabbed) — 移到體態趨勢前 */}
      <Section title="日常紀錄">
        <div className="card" style={{ padding: '14px' }}>
          <TabPill tabs={TRACKING_TABS} active={trackingTab} onChange={setTrackingTab} />
          {trackingTab === 'supplement' && (
            <SupplementTracker supplementItems={settings.supplementItems || []} supplementCheckins={supplementCheckins || {}} />
          )}
          {trackingTab === 'am_skincare' && (
            <SkincareTracker products={products} amOrder={settings.trackerAmOrder} pmOrder={settings.trackerPmOrder} forcedSection="am" />
          )}
          {trackingTab === 'pm_skincare' && (
            <SkincareTracker products={products} amOrder={settings.trackerAmOrder} pmOrder={settings.trackerPmOrder} forcedSection="pm" />
          )}
          {trackingTab === 'hydration_exercise' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#185FA5', marginBottom: 10 }}>飲水</div>
              <WaterWeekGrid waterLogs={waterLogs || {}} goalMl={settings.waterGoalMl || 2000} />
              <div style={{ height: '0.5px', background: 'var(--border-soft)', margin: '16px 0' }} />
              <div style={{ fontSize: 11, fontWeight: 500, color: '#5A7A52', marginBottom: 10 }}>運動</div>
              <ExerciseGrid exercises={exercises || []} exerciseTypes={settings.exerciseTypes || []} onUpdateTypes={updateExerciseTypes} />
            </div>
          )}
        </div>
      </Section>

      {/* 3. 體態趨勢 — 移到日常紀錄後 */}
      <Section title="體態趨勢">
        <div className="card" style={{ padding: '14px' }}>
          <BodyTrendSection bodyLogs={bodyLogs || {}} goalWeight={settings.bodyGoalWeight} goalFat={settings.bodyGoalFat} />
        </div>
      </Section>

      <div style={{ height: 24 }} />
    </div>
  )
}
