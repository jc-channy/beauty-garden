import React, { useState, useMemo } from 'react'
import { CATEGORY_COLORS, localDateStr, getWeekDates, isUsedOnDate, todayKey } from '../store/useStore.js'

// ── Water week chart ───────────────────────────────────────────
function WaterWeekChart({ waterLogs, goalMl }) {
  const goal = goalMl || 2000
  const today = localDateStr(new Date())
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); days.push(localDateStr(d))
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
              {ml > 0 && <span style={{ fontSize: 9, color: reached ? '#185FA5' : 'var(--text-muted)', fontWeight: reached ? 600 : 400 }}>{ml >= 1000 ? `${(ml/1000).toFixed(1)}L` : `${ml}`}</span>}
              <div style={{ width: '100%', height: barH, background: reached ? '#85B7EB' : '#B5D4F4', borderRadius: '4px 4px 2px 2px', opacity: isToday ? 1 : 0.75, border: isToday ? '1.5px solid #185FA5' : 'none', boxSizing: 'border-box' }} />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {days.map(d => {
          const dow = new Date(d + 'T12:00:00').getDay()
          const isToday = d === today
          return <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: isToday ? '#185FA5' : 'var(--text-muted)', fontWeight: isToday ? 600 : 400 }}>{isToday ? '今' : DOW[dow]}</div>
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

// ── Body trend chart ───────────────────────────────────────────
function BodyTrendChart({ bodyLogs, goalWeight, goalFat }) {
  const [period, setPeriod] = useState('1M')
  const [metric, setMetric] = useState('weight')

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
    return <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>資料不足，繼續記錄後這裡會出現趨勢圖</div>
  }

  const W = 320, H = 120, padL = 32, padR = 8, padT = 8, padB = 20
  const vals = data.map(d => d.val)
  const goal = metric === 'weight' ? goalWeight : goalFat
  const minV = Math.min(...vals, goal ?? Infinity)
  const maxV = Math.max(...vals, goal ?? -Infinity)
  const rangeV = maxV - minV || 1

  function xOf(i) { return padL + ((i / (data.length - 1)) * (W - padL - padR)) }
  function yOf(v) { return padT + ((maxV - v) / rangeV) * (H - padT - padB) }

  const polyline = data.map((d, i) => `${xOf(i)},${yOf(d.val)}`).join(' ')
  const yLabels = [maxV, (maxV + minV) / 2, minV].map(v => ({ v, y: yOf(v) }))
  const xLabels = [0, Math.floor(data.length / 2), data.length - 1].map(i => ({ x: xOf(i), label: data[i].date.slice(5).replace('-', '/') }))
  const unit = metric === 'weight' ? 'kg' : '%'
  const lastVal = data[data.length - 1]?.val
  const firstVal = data[0]?.val
  const diff = lastVal - firstVal
  const diffColor = diff <= 0 ? '#5A7A52' : '#C07070'
  const goalY = goal != null ? yOf(goal) : null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['1M', '3M', '6M', '1Y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', border: '0.5px solid', borderColor: period === p ? '#C8A87A' : 'var(--border-soft)', background: period === p ? '#F2E6D9' : 'var(--bg-surface)', color: period === p ? '#8A6A40' : 'var(--text-muted)', fontWeight: period === p ? 500 : 400 }}>{p}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[['weight', '體重'], ['bodyFat', '體脂']].map(([k, label]) => (
            <button key={k} onClick={() => setMetric(k)} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', border: '0.5px solid', borderColor: metric === k ? '#C8A87A' : 'var(--border-soft)', background: metric === k ? '#F2E6D9' : 'var(--bg-surface)', color: metric === k ? '#8A6A40' : 'var(--text-muted)', fontWeight: metric === k ? 500 : 400 }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 500, color: 'var(--text-primary)' }}>{lastVal?.toFixed(1)}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unit}</span>
        {diff !== 0 && <span style={{ fontSize: 12, color: diffColor, fontWeight: 500 }}>{diff > 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}{unit}</span>}
        {goal != null && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>目標 {goal}{unit}，距 {Math.abs(lastVal - goal).toFixed(1)}{unit}</span>}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {yLabels.map(({ v, y }) => <text key={v} x={padL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">{v.toFixed(1)}</text>)}
        {yLabels.map(({ y }) => <line key={y} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#EDE6DE" strokeWidth="0.5" />)}
        {goalY != null && <line x1={padL} y1={goalY} x2={W - padR} y2={goalY} stroke="#A8C8A0" strokeWidth="1" strokeDasharray="4 3" />}
        {goalY != null && <text x={W - padR + 2} y={goalY + 3} fontSize="8" fill="#5A7A52">目標</text>}
        <polyline points={polyline} fill="none" stroke="#C8A87A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => <circle key={i} cx={xOf(i)} cy={yOf(d.val)} r="2.5" fill="#C8A87A" />)}
        <circle cx={xOf(data.length - 1)} cy={yOf(lastVal)} r="5" fill="#C8A87A" stroke="#FDF8F2" strokeWidth="2" />
        {xLabels.map(({ x, label }) => <text key={label} x={x} y={H - 2} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{label}</text>)}
      </svg>
    </div>
  )
}

// ── Habit tracker ──────────────────────────────────────────────
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
          <button key={s} onClick={() => setSection(s)} style={{ padding: '6px 18px', borderRadius: 20, border: '0.5px solid', borderColor: section === s ? '#A8C8A0' : 'var(--border-soft)', background: section === s ? '#EEF4EC' : 'var(--bg-surface)', color: section === s ? '#5A7A52' : 'var(--text-muted)', fontSize: 13, fontWeight: section === s ? 500 : 400, cursor: 'pointer' }}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 8 }}>‹</button>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{fmt(weekDates[0])}～{fmt(weekDates[6])}</div>
        <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: weekOffset === 0 ? 'var(--border-soft)' : 'var(--text-secondary)', padding: '2px 8px', borderRadius: 8 }}>›</button>
      </div>
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>{section === 'am' ? '尚未加入白天使用的保養品' : '尚未加入晚上使用的保養品'}</div>
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
                        <div style={{ width: 28, height: 28, borderRadius: 7, margin: '0 auto', background: used ? (catColor?.bg || '#C8D8C0') : isFuture ? 'transparent' : 'var(--bg-surface)', border: isToday && !used ? '1.5px solid #C8A87A' : isFuture ? 'none' : used ? 'none' : '0.5px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

// ── Observations (rule-based) ──────────────────────────────────
function computeObservations({ waterLogs, bodyLogs, products, supplementCheckins, settings, exercises }) {
  const obs = []
  const today = todayKey()

  // Water: this week vs last week avg
  const thisWeek = getWeekDates(0)
  const lastWeek = getWeekDates(-1)
  const goal = settings.waterGoalMl || 2000
  const thisWaterAvg = thisWeek.filter(d => d <= today).reduce((s, d) => s + (waterLogs[d] || 0), 0) / Math.max(1, thisWeek.filter(d => d <= today).length)
  const lastWaterAvg = lastWeek.reduce((s, d) => s + (waterLogs[d] || 0), 0) / 7
  const thisWaterGoalDays = thisWeek.filter(d => d <= today && (waterLogs[d] || 0) >= goal).length
  if (thisWaterGoalDays >= 5) {
    obs.push({ icon: '💧', text: `這週你有 ${thisWaterGoalDays} 天達到飲水目標，水分補充得很好！` })
  } else if (lastWaterAvg > 0 && thisWaterAvg > lastWaterAvg * 1.1) {
    obs.push({ icon: '💧', text: `你這週的飲水量比上週多了 ${Math.round(thisWaterAvg - lastWaterAvg)}ml，持續進步中 ✦` })
  }

  // Body weight trend
  const recentWeights = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = localDateStr(d)
    if (bodyLogs[key]?.weight != null) recentWeights.push({ key, w: Number(bodyLogs[key].weight) })
  }
  if (recentWeights.length >= 5) {
    const firstHalf = recentWeights.slice(0, Math.floor(recentWeights.length / 2))
    const secondHalf = recentWeights.slice(Math.floor(recentWeights.length / 2))
    const firstAvg = firstHalf.reduce((s, x) => s + x.w, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((s, x) => s + x.w, 0) / secondHalf.length
    const diff = secondAvg - firstAvg
    if (diff < -0.3) {
      obs.push({ icon: '✨', text: `近兩週體重趨勢向下，平均少了 ${Math.abs(diff).toFixed(1)}kg，方向對了！` })
    } else if (Math.abs(diff) <= 0.3) {
      obs.push({ icon: '⚖️', text: `近兩週體重相當穩定，維持得很好 ✦` })
    }
  }

  // Skincare streak
  const allProducts = products || []
  let skincareStreak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = localDateStr(d)
    const usedAny = allProducts.some(p => isUsedOnDate(p.usageLog, key, null))
    if (usedAny) skincareStreak++; else break
  }
  if (skincareStreak >= 7) {
    obs.push({ icon: '🌸', text: `保養連續 ${skincareStreak} 天，皮膚一定感受得到你的用心！` })
  } else if (skincareStreak >= 3) {
    obs.push({ icon: '🌱', text: `保養已連續 ${skincareStreak} 天，再堅持一下就滿一週了！` })
  }

  // Exercise this week
  const thisWeekExercises = (exercises || []).filter(e => thisWeek.includes(e.date))
  if (thisWeekExercises.length >= 3) {
    obs.push({ icon: '💪', text: `這週已運動 ${thisWeekExercises.length} 次，身體在謝謝你 ✦` })
  }

  return obs.slice(0, 3)
}

// ── Achievements ───────────────────────────────────────────────
const ACHIEVEMENT_DEFS = [
  { id: 'first_complete',  icon: '🌱', label: '第一步',    desc: '完成第一次今日全部目標' },
  { id: 'streak_3',        icon: '✨', label: '三天習慣',  desc: '連續 3 天完成全部目標' },
  { id: 'streak_7',        icon: '🌟', label: '一週之約',  desc: '連續 7 天完成全部目標' },
  { id: 'streak_30',       icon: '💫', label: '月度堅持',  desc: '連續 30 天完成全部目標' },
  { id: 'skincare_7',      icon: '🌸', label: '保養初心',  desc: '累積保養打卡 7 天' },
  { id: 'skincare_30',     icon: '🌺', label: '保養達人',  desc: '累積保養打卡 30 天' },
  { id: 'water_7',         icon: '💧', label: '水分充足',  desc: '連續 7 天喝水達標' },
  { id: 'body_7',          icon: '📊', label: '體態觀察',  desc: '連續 7 天記錄體重' },
  { id: 'exercise_10',     icon: '💪', label: '運動達人',  desc: '累積記錄 10 次運動' },
  { id: 'weight_goal',     icon: '🎯', label: '目標達成',  desc: '體重達到目標值' },
]

function computeAchievements({ products, waterLogs, bodyLogs, exercises, settings, supplementCheckins }) {
  const today = todayKey()
  const unlocked = new Set()

  // skincare streak / total
  let skincareConsecutive = 0, skincareTotal = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = localDateStr(d)
    const usedAny = (products || []).some(p => isUsedOnDate(p.usageLog, key, null))
    if (usedAny) { skincareTotal++; if (skincareConsecutive === i) skincareConsecutive++ }
  }
  if (skincareTotal >= 1) unlocked.add('first_complete')
  if (skincareTotal >= 7) unlocked.add('skincare_7')
  if (skincareTotal >= 30) unlocked.add('skincare_30')

  // water goal streak
  const goalMl = settings.waterGoalMl || 2000
  let waterStreak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = localDateStr(d)
    if ((waterLogs[key] || 0) >= goalMl) waterStreak++; else break
  }
  if (waterStreak >= 7) unlocked.add('water_7')

  // body log streak
  let bodyStreak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = localDateStr(d)
    if (bodyLogs[key]?.weight != null) bodyStreak++; else break
  }
  if (bodyStreak >= 7) unlocked.add('body_7')

  // exercise total
  if ((exercises || []).length >= 10) unlocked.add('exercise_10')

  // weight goal
  const gw = settings.bodyGoalWeight
  if (gw != null) {
    const latest = Object.entries(bodyLogs).sort((a, b) => b[0].localeCompare(a[0]))[0]
    if (latest && Number(latest[1].weight) <= gw) unlocked.add('weight_goal')
  }

  // overall streaks (approximate via skincare as proxy)
  if (skincareConsecutive >= 3) unlocked.add('streak_3')
  if (skincareConsecutive >= 7) unlocked.add('streak_7')
  if (skincareConsecutive >= 30) unlocked.add('streak_30')

  return unlocked
}

function AchievementBadge({ def, unlocked }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '14px 8px', borderRadius: 16,
      background: unlocked ? '#FDF8F2' : 'var(--bg-surface)',
      border: `0.5px solid ${unlocked ? '#E8D4B8' : 'var(--border-soft)'}`,
      opacity: unlocked ? 1 : 0.45,
      flex: '1 1 calc(33% - 8px)', minWidth: 90, maxWidth: 120,
    }}>
      <span style={{ fontSize: 28, filter: unlocked ? 'none' : 'grayscale(1)' }}>{def.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center' }}>{def.label}</span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>{def.desc}</span>
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

// ── Main ───────────────────────────────────────────────────────
export default function AchievementsPage({ store }) {
  const { state } = store
  const { settings, products, waterLogs, bodyLogs, exercises, supplementCheckins } = state

  const observations = useMemo(() =>
    computeObservations({ waterLogs, bodyLogs, products, supplementCheckins, settings, exercises }),
    [waterLogs, bodyLogs, products, supplementCheckins, settings, exercises]
  )

  const unlockedIds = useMemo(() =>
    computeAchievements({ products, waterLogs, bodyLogs, exercises, settings, supplementCheckins }),
    [products, waterLogs, bodyLogs, exercises, settings, supplementCheckins]
  )

  const unlockedCount = unlockedIds.size

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>成就</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>已解鎖 {unlockedCount} / {ACHIEVEMENT_DEFS.length} 個里程碑</div>
      </div>

      {/* Observations */}
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

      {/* Achievement badges */}
      <Section title="里程碑">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ACHIEVEMENT_DEFS.map(def => (
            <AchievementBadge key={def.id} def={def} unlocked={unlockedIds.has(def.id)} />
          ))}
        </div>
      </Section>

      {/* Water chart */}
      <Section title="飲水紀錄">
        <div className="card" style={{ padding: '14px' }}>
          <WaterWeekChart waterLogs={waterLogs || {}} goalMl={settings.waterGoalMl || 2000} />
        </div>
      </Section>

      {/* Body trend */}
      <Section title="體態趨勢">
        <div className="card" style={{ padding: '14px' }}>
          <BodyTrendChart
            bodyLogs={bodyLogs || {}}
            goalWeight={settings.bodyGoalWeight}
            goalFat={settings.bodyGoalFat}
          />
        </div>
      </Section>

      {/* Skincare habit tracker */}
      <Section title="保養打卡紀錄">
        <div className="card" style={{ padding: '14px' }}>
          <HabitTracker
            products={products}
            amOrder={settings.trackerAmOrder}
            pmOrder={settings.trackerPmOrder}
          />
        </div>
      </Section>

      <div style={{ height: 24 }} />
    </div>
  )
}
