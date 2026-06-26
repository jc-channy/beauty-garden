import React, { useState } from 'react'
import { CATEGORY_COLORS, localDateStr, getWeekDates, isUsedOnDate } from '../store/useStore.js'
import { supabase } from '../lib/supabase.js'

// ── Water week chart ──────────────────────────────────────────
function WaterWeekChart({ waterLogs, goalMl }) {
  const goal = goalMl || 2000
  const today = localDateStr(new Date())
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(localDateStr(d))
  }
  const DOW = ['日', '一', '二', '三', '四', '五', '六']
  const maxMl = Math.max(goal, ...days.map(d => waterLogs[d] || 0))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 6 }}>
        {days.map(d => {
          const ml = waterLogs[d] || 0
          const isToday = d === today
          const pct = maxMl > 0 ? ml / maxMl : 0
          const reached = ml >= goal
          const barH = Math.max(4, Math.round(pct * 72))
          return (
            <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              {ml > 0 && (
                <span style={{ fontSize: 9, color: reached ? '#185FA5' : 'var(--text-muted)', fontWeight: reached ? 600 : 400 }}>
                  {ml >= 1000 ? `${(ml/1000).toFixed(1)}L` : `${ml}`}
                </span>
              )}
              <div style={{
                width: '100%', height: barH,
                background: reached ? '#85B7EB' : '#B5D4F4',
                borderRadius: '4px 4px 2px 2px',
                opacity: isToday ? 1 : 0.75,
                border: isToday ? '1.5px solid #185FA5' : 'none',
                boxSizing: 'border-box',
              }} />
            </div>
          )
        })}
      </div>
      {/* Goal line label */}
      <div style={{ display: 'flex', gap: 6 }}>
        {days.map(d => {
          const dow = new Date(d + 'T12:00:00').getDay()
          const isToday = d === today
          return (
            <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: isToday ? '#185FA5' : 'var(--text-muted)', fontWeight: isToday ? 600 : 400 }}>
              {isToday ? '今' : DOW[dow]}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, background: '#85B7EB', borderRadius: 2 }} />
        <span>達到目標 {goal}ml</span>
        <div style={{ width: 10, height: 10, background: '#B5D4F4', borderRadius: 2, marginLeft: 8 }} />
        <span>未達目標</span>
      </div>
    </div>
  )
}

// ── Body trend chart ──────────────────────────────────────────
function BodyTrendChart({ bodyLogs }) {
  const [period, setPeriod] = useState('1M')
  const [metric, setMetric] = useState('weight')

  const days = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[period]
  const data = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = localDateStr(d)
    const log = bodyLogs[key]
    if (log) {
      const val = metric === 'weight' ? log.weight : log.bodyFat
      if (val != null) data.push({ date: key, val: Number(val) })
    }
  }

  if (data.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
        資料不足，繼續記錄後這裡會出現趨勢圖
      </div>
    )
  }

  // SVG chart
  const W = 320, H = 120, padL = 32, padR = 8, padT = 8, padB = 20
  const vals = data.map(d => d.val)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const rangeV = maxV - minV || 1

  function xOf(i) { return padL + ((i / (data.length - 1)) * (W - padL - padR)) }
  function yOf(v) { return padT + ((maxV - v) / rangeV) * (H - padT - padB) }

  const polyline = data.map((d, i) => `${xOf(i)},${yOf(d.val)}`).join(' ')

  // Y axis labels
  const yLabels = [maxV, (maxV + minV) / 2, minV].map(v => ({ v, y: yOf(v) }))

  // X axis: show first, middle, last dates
  const xLabels = [0, Math.floor(data.length / 2), data.length - 1].map(i => ({
    x: xOf(i), label: data[i].date.slice(5).replace('-', '/')
  }))

  const unit = metric === 'weight' ? 'kg' : '%'
  const lastVal = data[data.length - 1]?.val
  const firstVal = data[0]?.val
  const diff = lastVal - firstVal
  const diffColor = metric === 'weight' ? (diff <= 0 ? '#5A7A52' : '#C07070') : (diff <= 0 ? '#5A7A52' : '#C07070')

  return (
    <div>
      {/* Period + metric switchers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['1M', '3M', '6M', '1Y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
              border: '0.5px solid',
              borderColor: period === p ? '#C8A87A' : 'var(--border-soft)',
              background: period === p ? '#F2E6D9' : 'var(--bg-surface)',
              color: period === p ? '#8A6A40' : 'var(--text-muted)',
              fontWeight: period === p ? 500 : 400,
            }}>{p}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[['weight', '體重'], ['bodyFat', '體脂']].map(([k, label]) => (
            <button key={k} onClick={() => setMetric(k)} style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
              border: '0.5px solid',
              borderColor: metric === k ? '#C8A87A' : 'var(--border-soft)',
              background: metric === k ? '#F2E6D9' : 'var(--bg-surface)',
              color: metric === k ? '#8A6A40' : 'var(--text-muted)',
              fontWeight: metric === k ? 500 : 400,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Latest value + diff */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 500, color: 'var(--text-primary)' }}>{lastVal?.toFixed(1)}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unit}</span>
        {diff !== 0 && (
          <span style={{ fontSize: 12, color: diffColor, fontWeight: 500 }}>
            {diff > 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}{unit}
          </span>
        )}
      </div>

      {/* SVG Line chart */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {/* Y axis labels */}
        {yLabels.map(({ v, y }) => (
          <text key={v} x={padL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">{v.toFixed(1)}</text>
        ))}
        {/* Grid lines */}
        {yLabels.map(({ y }) => (
          <line key={y} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#EDE6DE" strokeWidth="0.5" />
        ))}
        {/* Line */}
        <polyline points={polyline} fill="none" stroke="#C8A87A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {data.map((d, i) => (
          <circle key={i} cx={xOf(i)} cy={yOf(d.val)} r="3" fill="#C8A87A" />
        ))}
        {/* Last dot highlight */}
        <circle cx={xOf(data.length - 1)} cy={yOf(lastVal)} r="5" fill="#C8A87A" stroke="#FDF8F2" strokeWidth="2" />
        {/* X labels */}
        {xLabels.map(({ x, label }) => (
          <text key={label} x={x} y={H - 2} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{label}</text>
        ))}
      </svg>
    </div>
  )
}

// ── Habit tracker (read-only) ──────────────────────────────────
function HabitTracker({ products, amOrder, pmOrder }) {
  const hour = new Date().getHours()
  const [section, setSection] = useState(hour >= 12 ? 'pm' : 'am')
  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = getWeekDates(weekOffset)
  const todayStr = localDateStr(new Date())
  const DOW = ['一', '二', '三', '四', '五', '六', '日']
  const fmt = d => `${d.slice(5, 7)}/${d.slice(8, 10)}`

  const filtered = products.filter(p => !p.timeOfDay || p.timeOfDay === section)
  const order = section === 'am' ? amOrder : pmOrder
  const sorted = (() => {
    if (!order || order.length === 0) return filtered
    const indexed = new Map(order.map((id, i) => [id, i]))
    return [...filtered].sort((a, b) => {
      const ai = indexed.has(a.id) ? indexed.get(a.id) : Infinity
      const bi = indexed.has(b.id) ? indexed.get(b.id) : Infinity
      return ai - bi
    })
  })()

  function isPerfect(dateStr) {
    if (!sorted.length) return false
    return sorted.every(p => isUsedOnDate(p.usageLog, dateStr, section))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['am', '☀️ 白天'], ['pm', '🌙 晚上']].map(([s, label]) => (
          <button key={s} onClick={() => setSection(s)} style={{
            padding: '6px 18px', borderRadius: 20, border: '0.5px solid',
            borderColor: section === s ? '#A8C8A0' : 'var(--border-soft)',
            background: section === s ? '#EEF4EC' : 'var(--bg-surface)',
            color: section === s ? '#5A7A52' : 'var(--text-muted)',
            fontSize: 13, fontWeight: section === s ? 500 : 400, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 8 }}>‹</button>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{fmt(weekDates[0])}～{fmt(weekDates[6])}</div>
        <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: weekOffset === 0 ? 'var(--border-soft)' : 'var(--text-secondary)', padding: '2px 8px', borderRadius: 8 }}>›</button>
      </div>
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          {section === 'am' ? '尚未加入白天使用的保養品' : '尚未加入晚上使用的保養品'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6, paddingLeft: 4 }}>
            <div style={{ width: 110, minWidth: 110 }} />
            {weekDates.map((d, i) => {
              const isToday = d === todayStr
              return (
                <div key={d} style={{ width: 34, minWidth: 34, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: isToday ? '#5A7A52' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400 }}>{DOW[i]}</div>
                  <div style={{ fontSize: 10, color: isToday ? '#5A7A52' : 'var(--text-muted)', fontWeight: isToday ? 600 : 400 }}>{d.slice(8, 10)}</div>
                </div>
              )
            })}
          </div>
          <div>
            {sorted.map(p => {
              const name = p.nickname || p.name || p.brand || '未命名'
              const catColor = p.category ? CATEGORY_COLORS[p.category] : null
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', paddingBottom: 5, paddingLeft: 4 }}>
                  <div style={{ width: 110, minWidth: 110, paddingRight: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{name}</span>
                  </div>
                  {weekDates.map(d => {
                    const used = isUsedOnDate(p.usageLog, d, section)
                    const isFuture = d > todayStr
                    const isToday = d === todayStr
                    return (
                      <div key={d} style={{ width: 34, minWidth: 34, textAlign: 'center' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7, margin: '0 auto',
                          background: used ? (catColor?.bg || '#C8D8C0') : isFuture ? 'transparent' : 'var(--bg-surface)',
                          border: isToday && !used ? '1.5px solid #C8A87A' : isFuture ? 'none' : used ? 'none' : '0.5px solid var(--border-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {used && <span style={{ fontSize: 12, color: catColor?.text || '#5A7A52' }}>✓</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: 4, paddingLeft: 4 }}>
            <div style={{ width: 110, minWidth: 110, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, paddingRight: 6 }}>全部完成</div>
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

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

export default function ProfilePage({ store }) {
  const { state, updateSettings, updateBodyGoals } = store
  const { settings, products, waterLogs, bodyLogs } = state

  const [userName, setUserName] = useState(settings.userName)
  const [saved, setSaved] = useState(false)

  // Goals state
  const [goalWeight, setGoalWeight] = useState(settings.bodyGoalWeight ?? '')
  const [goalFat, setGoalFat] = useState(settings.bodyGoalFat ?? '')
  const [goalWater, setGoalWater] = useState(settings.waterGoalMl ?? 2000)
  const [quickAmts, setQuickAmts] = useState((settings.waterQuickAmounts || [200, 350, 500]).join(', '))

  React.useEffect(() => {
    setUserName(settings.userName)
    setGoalWeight(settings.bodyGoalWeight ?? '')
    setGoalFat(settings.bodyGoalFat ?? '')
    setGoalWater(settings.waterGoalMl ?? 2000)
    setQuickAmts((settings.waterQuickAmounts || [200, 350, 500]).join(', '))
  }, [settings.userName, settings.bodyGoalWeight, settings.bodyGoalFat, settings.waterGoalMl, settings.waterQuickAmounts])

  function handleSave() {
    // Parse water quick amounts
    const parsedAmounts = quickAmts.split(/[,，\s]+/).map(s => parseInt(s.trim())).filter(n => n > 0)
    updateSettings({ userName, waterGoalMl: parseInt(goalWater) || 2000, waterQuickAmounts: parsedAmounts.length ? parsedAmounts : [200, 350, 500] })
    updateBodyGoals({ bodyGoalWeight: goalWeight !== '' ? parseFloat(goalWeight) : null, bodyGoalFat: goalFat !== '' ? parseFloat(goalFat) : null })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>紀錄</div>
      </div>

      {/* 1. Water week chart */}
      <Section title="飲水紀錄">
        <div className="card" style={{ padding: '14px' }}>
          <WaterWeekChart waterLogs={waterLogs || {}} goalMl={settings.waterGoalMl || 2000} />
        </div>
      </Section>

      {/* 2. Skincare habit tracker */}
      <Section title="保養打卡紀錄">
        <div className="card" style={{ padding: '14px' }}>
          <HabitTracker
            products={products}
            amOrder={settings.trackerAmOrder}
            pmOrder={settings.trackerPmOrder}
          />
        </div>
      </Section>

      {/* 3. Body trend */}
      <Section title="體態趨勢">
        <div className="card" style={{ padding: '14px' }}>
          <BodyTrendChart bodyLogs={bodyLogs || {}} />
        </div>
      </Section>

      {/* Goals settings */}
      <Section title="目標設定">
        <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Water goal */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>每日飲水目標 (ml)</div>
            <input type="number" inputMode="numeric" value={goalWater} onChange={e => setGoalWater(e.target.value)} placeholder="2000" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>快速加水選項 (ml，逗號分隔)</div>
            <input type="text" inputMode="numeric" value={quickAmts} onChange={e => setQuickAmts(e.target.value)} placeholder="200, 350, 500" />
          </div>
          {/* Body goals */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>目標體重 (kg)</div>
              <input type="number" inputMode="decimal" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} placeholder="—" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>目標體脂 (%)</div>
              <input type="number" inputMode="decimal" value={goalFat} onChange={e => setGoalFat(e.target.value)} placeholder="—" />
            </div>
          </div>
        </div>
      </Section>

      {/* Settings */}
      <Section title="個人設定">
        <div className="card" style={{ padding: '14px' }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            你的名字（顯示在首頁問候語）
          </label>
          <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="輸入你的名字…" />
        </div>
      </Section>

      <button className="btn-primary" onClick={handleSave} style={{
        background: saved ? '#D7DFD2' : 'var(--color-milk)',
        color: saved ? '#5A7A52' : 'var(--text-primary)',
        transition: 'background 0.3s, color 0.3s',
      }}>
        {saved ? '✓ 已儲存' : '儲存設定'}
      </button>

      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid var(--border-soft)' }}>
        <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0', textAlign: 'left' }}>
          登出
        </button>
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}
