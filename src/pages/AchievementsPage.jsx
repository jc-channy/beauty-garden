import React, { useState, useMemo } from 'react'
import { localDateStr, getWeekDates, isUsedOnDate } from '../store/useStore.js'

// ── Constants ─────────────────────────────────────────────────────────────────
const DOW = ['一','二','三','四','五','六','日']
const ACCENT = '#C8A87A'
const ACCENT_LIGHT = '#F2E6D9'
const ACCENT_DARK = '#8A6A40'
const H_COLORS = { skincare:'#F8B4C8', water:'#80BFFF', exercise:'#86C96E', supp:'#FFBE6A' }
const BOWEL_CLR = ['#E8E4DF','#E8D0C0','#C0907A','#A07060']
const TYPE_ICON = { '有氧':'🏃','重訓':'💪','瑜珈／伸展':'🧘','游泳':'🏊','球類':'⚽','格鬥':'🥊','戶外':'🚴' }
const getTypeIcon = t => TYPE_ICON[t] || '🏋️'

// ── Helpers ───────────────────────────────────────────────────────────────────
function waterMl(waterLogs, date) {
  const v = waterLogs?.[date]
  if (!v) return 0
  if (typeof v === 'number') return v
  return v.total ?? 0
}

function getMonthDates(year, month) {
  const days = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: days }, (_, i) => localDateStr(new Date(year, month, i + 1)))
}

function fmtMins(mins) {
  if (!mins) return '0 分'
  if (mins < 60) return `${mins} 分`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h} 時 ${m} 分` : `${h} 時`
}

// ── SVG Body Line Chart ───────────────────────────────────────────────────────
function BodyLineChart({ pts, unit }) {
  const valid = pts.filter(p => p.val != null)
  if (valid.length === 0) {
    return (
      <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:13 }}>
        尚無記錄
      </div>
    )
  }
  let minV = Math.min(...valid.map(p => p.val))
  let maxV = Math.max(...valid.map(p => p.val))
  if (maxV - minV < 2) {
    const mid = (maxV + minV) / 2
    minV = mid - 1; maxV = mid + 1
  }
  const range = maxV - minV
  const W = 280, H = 85
  const pad = { t:8, b:20, l:36, r:12 }
  const cW = W - pad.l - pad.r
  const cH = H - pad.t - pad.b
  const xOf = i => pad.l + (pts.length > 1 ? (i / (pts.length - 1)) * cW : cW / 2)
  const yOf = v => pad.t + (1 - (v - minV) / range) * cH

  // path from consecutive valid points only
  let d = ''
  valid.forEach((p, i) => {
    const xi = pts.indexOf(p)
    const cmd = i === 0 ? 'M' : 'L'
    d += `${cmd}${xOf(xi).toFixed(1)},${yOf(p.val).toFixed(1)} `
  })

  const yLabels = [minV, (minV + maxV) / 2, maxV]
  const last = valid[valid.length - 1]
  const lastXi = pts.indexOf(last)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
      {yLabels.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={yOf(v)} y2={yOf(v)}
            stroke="var(--border-soft)" strokeWidth="0.5" strokeDasharray="3,3" />
          <text x={pad.l - 4} y={yOf(v) + 3} textAnchor="end" fontSize="8" fill="var(--text-muted)">
            {typeof v === 'number' ? v.toFixed(1) : v}
          </text>
        </g>
      ))}
      {pts.map((_, i) => (
        <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="var(--text-muted)">
          {DOW[i]}
        </text>
      ))}
      {d && <path d={d} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
      {valid.map((p, i) => (
        <circle key={i} cx={xOf(pts.indexOf(p))} cy={yOf(p.val)} r="3"
          fill="white" stroke={ACCENT} strokeWidth="1.5" />
      ))}
      <text x={xOf(lastXi)} y={yOf(last.val) - 6} textAnchor="middle" fontSize="9" fill={ACCENT_DARK} fontWeight="600">
        {last.val}{unit}
      </text>
    </svg>
  )
}

// ── Hero Card ─────────────────────────────────────────────────────────────────
function HeroCard({ name, pct, tags }) {
  const r = 42, circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const title = pct >= 90 ? '狀態滿分 🌟' : pct >= 70 ? '持續進步中 ✨' : pct >= 50 ? '保持下去 💪' : '今天加油吧 🌸'
  const msg = pct >= 90 ? '這週全力以赴，繼續保持！' : pct >= 70 ? '大部分習慣都做到了，很棒！' : pct >= 50 ? '穩定養成中，不放棄就是勝利' : '從一個小習慣開始，今天也會很精彩'
  return (
    <div style={{ background:'linear-gradient(135deg,#FDF8F4 0%,#F7EDE0 100%)', borderRadius:16, padding:'18px 16px', display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
      <div style={{ flexShrink:0 }}>
        <svg width="96" height="96" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#EFE0CC" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={ACCENT} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 50 50)" style={{ transition:'stroke-dashoffset 0.6s ease' }} />
          <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill={ACCENT_DARK}>{pct}%</text>
          <text x="50" y="60" textAnchor="middle" fontSize="9" fill="var(--text-muted)">完成率</text>
        </svg>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        {name && <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:2 }}>嗨，{name} 👋</div>}
        <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{title}</div>
        <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5, marginBottom:8 }}>{msg}</div>
        {tags.length > 0 && (
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {tags.map((t, i) => (
              <span key={i} style={{ background:ACCENT_LIGHT, color:ACCENT_DARK, fontSize:11, padding:'3px 8px', borderRadius:10, fontWeight:500 }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Week Strip ────────────────────────────────────────────────────────────────
function WeekStrip({ weekDates, todayStr, dayScores }) {
  return (
    <div style={{ display:'flex', gap:4, marginBottom:14 }}>
      {weekDates.map((d, i) => {
        const isToday = d === todayStr
        const isFuture = d > todayStr
        const s = dayScores[i]
        const day = d.slice(8).replace(/^0/, '')
        const dots = [
          { color:H_COLORS.skincare, done:s.skincare },
          { color:H_COLORS.water, done:s.water },
          { color:H_COLORS.exercise, done:s.exercise },
          { color:H_COLORS.supp, done:s.supp },
        ]
        return (
          <div key={d} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            background: isToday ? ACCENT_LIGHT : 'var(--bg-surface)',
            borderRadius:10, padding:'7px 2px',
            border:`${isToday ? 1.5 : 1}px solid ${isToday ? ACCENT : 'var(--border-soft)'}`,
            opacity: isFuture ? 0.4 : 1
          }}>
            <div style={{ fontSize:9, color: isToday ? ACCENT_DARK : 'var(--text-muted)', fontWeight: isToday ? 600 : 400 }}>{DOW[i]}</div>
            <div style={{ fontSize:13, fontWeight:600, color: isToday ? ACCENT_DARK : 'var(--text-primary)' }}>{day}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
              {dots.map((dot, j) => (
                <div key={j} style={{
                  width:7, height:7, borderRadius:4,
                  background: (!isFuture && dot.done) ? dot.color : 'var(--border-soft)'
                }} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Achievement Highlights ────────────────────────────────────────────────────
function AchievementHighlights({ skincareStreak, waterStreak, weekPct, monthExerciseCount, suppStreak, monthBodyLogs }) {
  const defs = [
    { id:'sk30', icon:'🌸', label:'保養習慣', desc:'連續保養 30 天', met: skincareStreak >= 30 },
    { id:'sk7',  icon:'✨', label:'保養達人', desc:'連續保養 7 天',  met: skincareStreak >= 7 },
    { id:'w7',   icon:'💧', label:'水分充足', desc:'連續飲水達標 7 天', met: waterStreak >= 7 },
    { id:'ex10', icon:'💪', label:'運動狂人', desc:'本月運動 10 次', met: monthExerciseCount >= 10 },
    { id:'ex5',  icon:'🏃', label:'運動積極', desc:'本月運動 5 次',  met: monthExerciseCount >= 5 },
    { id:'perf', icon:'🎯', label:'完美週',   desc:'本週完成率 ≥ 90%', met: weekPct >= 90 },
    { id:'sp7',  icon:'💊', label:'補給習慣', desc:'連續保健品 7 天', met: suppStreak >= 7 },
    { id:'bl5',  icon:'📊', label:'身材追蹤', desc:'本月記錄 5 次',  met: monthBodyLogs >= 5 },
  ]
  const unlocked = defs.filter(d => d.met)
  const locked   = defs.filter(d => !d.met)
  const show = [...unlocked.slice(0, 3), ...locked.slice(0, Math.max(0, 3 - unlocked.length))]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {show.map(a => (
        <div key={a.id} style={{
          display:'flex', alignItems:'center', gap:10,
          background: a.met ? ACCENT_LIGHT : 'var(--bg-surface)',
          border:`1px solid ${a.met ? ACCENT + '60' : 'var(--border-soft)'}`,
          borderRadius:10, padding:'10px 12px', opacity: a.met ? 1 : 0.55
        }}>
          <div style={{ fontSize:20 }}>{a.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color: a.met ? ACCENT_DARK : 'var(--text-primary)' }}>{a.label}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{a.desc}</div>
          </div>
          {a.met && <div style={{ fontSize:11, color:ACCENT_DARK, fontWeight:600 }}>達成 ✓</div>}
        </div>
      ))}
    </div>
  )
}

// ── Habit Bars ────────────────────────────────────────────────────────────────
function HabitBars({ bars }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {bars.map(b => (
        <div key={b.label}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{b.icon} {b.label}</div>
            <div style={{ fontSize:12, fontWeight:600, color: b.pct >= 80 ? ACCENT_DARK : 'var(--text-secondary)' }}>{b.pct}%</div>
          </div>
          <div style={{ height:6, background:'var(--border-soft)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${b.pct}%`, background:b.color, borderRadius:3, transition:'width 0.5s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Exercise Detail (week) ────────────────────────────────────────────────────
function ExerciseDetail({ weekExercises, weekDates, todayStr }) {
  const byType = {}
  weekExercises.forEach(e => {
    if (!byType[e.type]) byType[e.type] = { sessions:0, mins:0 }
    byType[e.type].sessions++
    byType[e.type].mins += e.durationMin || 30
  })
  const types = Object.entries(byType)
  const dayExs = weekDates.map(d => weekExercises.filter(e => e.date === d))

  return (
    <div>
      {types.length === 0 ? (
        <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'10px 0' }}>本週尚未記錄運動</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
          {types.map(([type, d]) => (
            <div key={type} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ fontSize:16 }}>{getTypeIcon(type)}</div>
              <div style={{ flex:1, fontSize:13, color:'var(--text-primary)' }}>{type}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{d.sessions} 次・{fmtMins(d.mins)}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:4 }}>
        {weekDates.map((date, i) => {
          const exs = dayExs[i]
          const isFuture = date > todayStr
          const isToday = date === todayStr
          return (
            <div key={date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <div style={{ fontSize:9, color:'var(--text-muted)' }}>{DOW[i]}</div>
              <div style={{
                width:32, height:32, borderRadius:8,
                background: isFuture ? 'transparent' : exs.length > 0 ? '#E8F4E8' : 'var(--bg-surface)',
                border:`${isToday ? 1.5 : 1}px solid ${isToday ? ACCENT : 'var(--border-soft)'}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:15,
                opacity: isFuture ? 0.3 : 1
              }}>
                {!isFuture && exs.length > 0 ? getTypeIcon(exs[0].type) : ''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Water Bar Chart ───────────────────────────────────────────────────────────
function WaterBarChart({ weekDates, waterLogs, goalMl, todayStr }) {
  const vals = weekDates.map(d => waterMl(waterLogs, d))
  const maxVal = Math.max(...vals, goalMl * 1.1, 1)
  const W = 280, H = 90
  const pad = { t:10, b:18, l:6, r:6 }
  const cW = W - pad.l - pad.r
  const cH = H - pad.t - pad.b
  const barW = (cW / 7) * 0.55
  const xOf = i => pad.l + (i / 7 + 0.5 / 7) * cW
  const yOf = v => pad.t + (1 - v / maxVal) * cH
  const goalY = yOf(goalMl)
  const pastDays = weekDates.filter(d => d <= todayStr)
  const metGoal = pastDays.filter(d => waterMl(waterLogs, d) >= goalMl).length
  const avgMl = pastDays.length > 0 ? Math.round(pastDays.reduce((s, d) => s + waterMl(waterLogs, d), 0) / pastDays.length) : 0

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        {[
          { bg:'#EEF5FF', val:`${metGoal}/${pastDays.length}`, sub:'達標天數', c:'#4A90D9', sc:'#6A9EC8' },
          { bg:'#F6F2FF', val:avgMl, sub:'日均 ml', c:'#7A6ABA', sc:'#9A8ACA' },
          { bg:'#F5FFF0', val:goalMl, sub:'目標 ml', c:'#5AA05A', sc:'#7AC07A' },
        ].map((s, i) => (
          <div key={i} style={{ flex:1, background:s.bg, borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:700, color:s.c }}>{s.val}</div>
            <div style={{ fontSize:10, color:s.sc }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
        <line x1={pad.l} x2={W - pad.r} y1={goalY} y2={goalY}
          stroke="#80BFFF" strokeWidth="1" strokeDasharray="4,3" />
        <text x={W - pad.r + 2} y={goalY + 3} fontSize="8" fill="#80BFFF">目標</text>
        {weekDates.map((d, i) => {
          const v = vals[i]
          const isFuture = d > todayStr
          const isToday = d === todayStr
          const met = v >= goalMl
          const bH = isFuture ? 0 : Math.max(2, (v / maxVal) * cH)
          const x = xOf(i)
          return (
            <g key={d}>
              <rect x={x - barW / 2} y={pad.t + cH - bH} width={barW} height={bH} rx="3"
                fill={isFuture ? 'var(--border-soft)' : met ? '#80BFFF' : '#C8E0F8'} />
              {isToday && <rect x={x - barW / 2} y={pad.t + cH - bH} width={barW} height={bH} rx="3"
                fill="none" stroke="#4A90D9" strokeWidth="1.5" />}
              <text x={x} y={H - 3} textAnchor="middle" fontSize="8" fill="var(--text-muted)">{DOW[i]}</text>
              {!isFuture && v > 0 && (
                <text x={x} y={pad.t + cH - bH - 3} textAnchor="middle" fontSize="7.5"
                  fill={met ? '#4A90D9' : 'var(--text-muted)'}>
                  {v >= 1000 ? `${(v / 1000).toFixed(1)}L` : v}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Supplement Grid ───────────────────────────────────────────────────────────
function SuppGrid({ suppItems, supplementCheckins, weekDates, todayStr }) {
  if (!suppItems || suppItems.length === 0) {
    return <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'12px 0' }}>尚未設定保健品</div>
  }
  const pastDays = weekDates.filter(d => d <= todayStr)
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 4px' }}>
        <thead>
          <tr>
            <th style={{ fontSize:9, textAlign:'left', fontWeight:400, color:'var(--text-muted)', paddingBottom:4, width:80 }} />
            {weekDates.map((d, i) => (
              <th key={d} style={{ fontSize:9, textAlign:'center', fontWeight: d === todayStr ? 600 : 400,
                color: d === todayStr ? ACCENT_DARK : 'var(--text-muted)', paddingBottom:4, width:28 }}>
                {DOW[i]}
              </th>
            ))}
            <th style={{ fontSize:9, textAlign:'right', fontWeight:400, color:'var(--text-muted)', paddingBottom:4, width:28 }}>率</th>
          </tr>
        </thead>
        <tbody>
          {suppItems.map(s => {
            const rate = pastDays.length > 0
              ? Math.round(pastDays.filter(d => (supplementCheckins[d]||[]).includes(s.name)).length / pastDays.length * 100)
              : 0
            return (
              <tr key={s.name}>
                <td style={{ fontSize:11, color:'var(--text-primary)', paddingRight:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:80 }}>{s.name}</td>
                {weekDates.map((d, i) => {
                  const isFuture = d > todayStr
                  const taken = !isFuture && (supplementCheckins[d]||[]).includes(s.name)
                  return (
                    <td key={d} style={{ textAlign:'center', padding:'1px 2px' }}>
                      <div style={{
                        width:22, height:22, borderRadius:6, margin:'0 auto',
                        background: isFuture ? 'transparent' : taken ? '#FFBE6A' : 'var(--border-soft)',
                        border: isFuture ? '1px dashed var(--border-soft)' : 'none',
                        opacity: isFuture ? 0.3 : 1,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:10, color:'white'
                      }}>
                        {!isFuture && taken ? '✓' : ''}
                      </div>
                    </td>
                  )
                })}
                <td style={{ textAlign:'right', fontSize:10, fontWeight:600, paddingLeft:4,
                  color: rate >= 80 ? '#D4A000' : 'var(--text-muted)' }}>{rate}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Body Calendar ─────────────────────────────────────────────────────────────
function BodyCalendar({ bodyLogs, goalWeight, goalFat, todayStr }) {
  const todayDate = new Date()
  const [calYear,  setCalYear]  = useState(todayDate.getFullYear())
  const [calMonth, setCalMonth] = useState(todayDate.getMonth())

  const isCurrentMonth = calYear === todayDate.getFullYear() && calMonth === todayDate.getMonth()
  const canGoNext = !isCurrentMonth

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (!canGoNext) return
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDow    = new Date(calYear, calMonth, 1).getDay() // 0=Sun
  const DOW_SUN = ['日','一','二','三','四','五','六']

  // latest recorded weight/fat for stat display
  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(calYear, calMonth, i + 1)
    return localDateStr(d)
  })
  const recordedDays = allDays.filter(d => d <= todayStr && bodyLogs[d]?.weight != null)
  const latestDay = recordedDays[recordedDays.length - 1]
  const firstDay  = recordedDays[0]
  const latestW   = latestDay ? bodyLogs[latestDay].weight : null
  const firstW    = firstDay  ? bodyLogs[firstDay].weight  : null
  const monthDelta = (latestW != null && firstW != null && latestDay !== firstDay)
    ? (latestW - firstW).toFixed(1) : null

  return (
    <div>
      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <button onClick={prevMonth} style={{
          background:'none', border:`1px solid var(--border-soft)`, borderRadius:10,
          padding:'4px 12px', fontSize:12, color:'var(--text-secondary)', cursor:'pointer',
          display:'flex', alignItems:'center', gap:3
        }}>‹ {calMonth === 0 ? 12 : calMonth}月</button>
        <span style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>
          {calYear}年{calMonth + 1}月
        </span>
        <button onClick={nextMonth} style={{
          background:'none', border:`1px solid var(--border-soft)`, borderRadius:10,
          padding:'4px 12px', fontSize:12, cursor: canGoNext ? 'pointer' : 'default',
          color: canGoNext ? 'var(--text-secondary)' : 'var(--text-muted)',
          opacity: canGoNext ? 1 : 0.35, display:'flex', alignItems:'center', gap:3
        }}>{calMonth === 11 ? 1 : calMonth + 2}月 ›</button>
      </div>

      {/* Monthly stats strip */}
      {(latestW != null || goalWeight) && (
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          {latestW != null && (
            <div style={{ flex:1, background:ACCENT_LIGHT, borderRadius:8, padding:'7px 8px', textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:700, color:ACCENT_DARK }}>{latestW}<span style={{ fontSize:10, fontWeight:400 }}>kg</span></div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>最新</div>
            </div>
          )}
          {monthDelta != null && (
            <div style={{ flex:1, background:'var(--bg-surface)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'7px 8px', textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:700, color: parseFloat(monthDelta) < 0 ? '#5AA05A' : parseFloat(monthDelta) > 0 ? '#D46A6A' : 'var(--text-primary)' }}>
                {parseFloat(monthDelta) > 0 ? '+' : ''}{monthDelta}<span style={{ fontSize:10, fontWeight:400 }}>kg</span>
              </div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>月變化</div>
            </div>
          )}
          {goalWeight != null && latestW != null && (
            <div style={{ flex:1, background:'var(--bg-surface)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'7px 8px', textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:700, color: Math.abs(latestW - goalWeight) < 0.5 ? '#5AA05A' : 'var(--text-primary)' }}>
                {latestW > goalWeight ? '' : '+'}{(latestW - goalWeight).toFixed(1)}<span style={{ fontSize:10, fontWeight:400 }}>kg</span>
              </div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>距目標</div>
            </div>
          )}
        </div>
      )}

      {/* DOW header */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, marginBottom:3 }}>
        {DOW_SUN.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', padding:'2px 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = localDateStr(new Date(calYear, calMonth, day))
          const isToday  = dateStr === todayStr
          const isFuture = dateStr > todayStr
          const rec = bodyLogs[dateStr]

          let bg, border
          if (isToday)       { bg = '#FDF5EC'; border = `1.5px solid ${ACCENT}` }
          else if (isFuture) { bg = 'transparent'; border = '0.5px dashed rgba(150,140,130,.2)' }
          else               { bg = 'var(--bg-surface)'; border = '0.5px solid var(--border-soft)' }

          return (
            <div key={day} style={{
              borderRadius:6, background:bg, border,
              display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'flex-start', padding:'4px 1px 3px',
              overflow:'hidden', opacity: isFuture ? 0.35 : 1, minHeight:50
            }}>
              {/* Date */}
              <div style={{ fontSize:9, fontWeight: isToday ? 600 : 400, color: isToday ? ACCENT_DARK : 'var(--text-muted)', lineHeight:1, marginBottom:2 }}>
                {day}
              </div>
              {/* Weight */}
              <div style={{ fontSize:10, fontWeight:500, color: isToday ? ACCENT_DARK : 'var(--text-primary)', lineHeight:1.25 }}>
                {rec?.weight != null && !isFuture ? rec.weight.toFixed(1) : ''}
              </div>
              {/* Body fat */}
              <div style={{ fontSize:10, fontWeight:500, color:'#C08090', lineHeight:1.25 }}>
                {rec?.bodyFat != null && !isFuture ? rec.bodyFat.toFixed(1) : ''}
              </div>
              {/* Bowel dot */}
              <div style={{ height:8, display:'flex', alignItems:'center', justifyContent:'center', marginTop:2 }}>
                {rec?.bowelCount != null && rec.bowelCount > 0 && !isFuture && (
                  <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#C0907A' }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:10 }}>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-muted)' }}>
          <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#C0907A' }} />
          便便記錄
        </span>
        <span style={{ fontSize:11, color:'#C08090', fontWeight:500 }}>體脂</span>
        {goalWeight && <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto' }}>目標 {goalWeight} kg</span>}
      </div>
    </div>
  )
}

// ── Month Heatmap ─────────────────────────────────────────────────────────────
function MonthHeatmap({ monthDates, todayStr, dayScoresMap }) {
  const HCLR = ['#F2EDEA','#F0DFC8','#C8A878','#7A5A20']
  const DOW_SUN = ['日','一','二','三','四','五','六']
  const firstDow = new Date(monthDates[0] + 'T00:00:00').getDay()
  const cells = [...Array(firstDow).fill(null), ...monthDates]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
        {DOW_SUN.map(d => <div key={d} style={{ textAlign:'center', fontSize:9, color:'var(--text-muted)' }}>{d}</div>)}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:3 }}>
          {week.map((d, di) => {
            if (!d) return <div key={di} />
            const isFuture = d > todayStr
            const score = !isFuture ? (dayScoresMap[d] ?? 0) : -1
            return (
              <div key={d} style={{
                background: isFuture ? '#F8F6F2' : HCLR[Math.min(score, 3)],
                borderRadius:4, aspectRatio:'1',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:9, color: score >= 3 ? 'white' : 'var(--text-muted)',
                fontWeight: d === todayStr ? 700 : 400,
                border: d === todayStr ? `1.5px solid ${ACCENT}` : 'none',
                opacity: isFuture ? 0.4 : 1
              }}>
                {d.slice(8).replace(/^0/, '')}
              </div>
            )
          })}
        </div>
      ))}
      <div style={{ display:'flex', gap:6, justifyContent:'flex-end', marginTop:6, alignItems:'center' }}>
        <span style={{ fontSize:10, color:'var(--text-muted)' }}>完成度：</span>
        {HCLR.map((c, i) => (
          <span key={i} style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'var(--text-muted)' }}>
            <span style={{ display:'inline-block', width:11, height:11, borderRadius:3, background:c, border:'1px solid rgba(0,0,0,0.08)' }} />
            {['0','1','2','3-4'][i]}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Month sub-sections ────────────────────────────────────────────────────────
function ExerciseMonthDetail({ monthExercises }) {
  const byType = {}
  monthExercises.forEach(e => {
    if (!byType[e.type]) byType[e.type] = { sessions:0, mins:0 }
    byType[e.type].sessions++
    byType[e.type].mins += e.durationMin || 30
  })
  const types = Object.entries(byType)
  const totalSessions = monthExercises.length
  const totalMins = monthExercises.reduce((s, e) => s + (e.durationMin || 30), 0)

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <div style={{ flex:1, background:'#E8F4E8', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#5AA05A' }}>{totalSessions}</div>
          <div style={{ fontSize:10, color:'#7AC07A' }}>次運動</div>
        </div>
        <div style={{ flex:1, background:'#F0F8FF', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#4A90D9' }}>{fmtMins(totalMins)}</div>
          <div style={{ fontSize:10, color:'#6AAAD9' }}>總時長</div>
        </div>
      </div>
      {types.length === 0
        ? <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>本月尚無運動記錄</div>
        : types.map(([type, d]) => (
          <div key={type} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border-soft)' }}>
            <div style={{ fontSize:16 }}>{getTypeIcon(type)}</div>
            <div style={{ flex:1, fontSize:13, color:'var(--text-primary)' }}>{type}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{d.sessions} 次・{fmtMins(d.mins)}</div>
          </div>
        ))
      }
    </div>
  )
}

function WaterMonthSummary({ monthDates, waterLogs, goalMl, todayStr }) {
  const past = monthDates.filter(d => d <= todayStr)
  const met = past.filter(d => waterMl(waterLogs, d) >= goalMl).length
  const avg = past.length > 0 ? Math.round(past.reduce((s, d) => s + waterMl(waterLogs, d), 0) / past.length) : 0
  const rate = past.length > 0 ? Math.round(met / past.length * 100) : 0
  return (
    <div style={{ display:'flex', gap:8 }}>
      {[
        { bg:'#EEF5FF', val:`${met}天`, sub:'達標天數', c:'#4A90D9', sc:'#6A9EC8' },
        { bg:'#F6F2FF', val:avg,        sub:'日均 ml',  c:'#7A6ABA', sc:'#9A8ACA' },
        { bg:'#F5FFF0', val:`${rate}%`, sub:'達標率',   c:'#5AA05A', sc:'#7AC07A' },
      ].map((s, i) => (
        <div key={i} style={{ flex:1, background:s.bg, borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
          <div style={{ fontSize:16, fontWeight:700, color:s.c }}>{s.val}</div>
          <div style={{ fontSize:10, color:s.sc }}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

function SuppMonthBars({ suppItems, supplementCheckins, monthDates, todayStr }) {
  const past = monthDates.filter(d => d <= todayStr)
  if (!suppItems || suppItems.length === 0) {
    return <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>尚未設定保健品</div>
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {suppItems.map(s => {
        const taken = past.filter(d => (supplementCheckins[d]||[]).includes(s.name)).length
        const pct = past.length > 0 ? Math.round(taken / past.length * 100) : 0
        return (
          <div key={s.name}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{s.name}</div>
              <div style={{ fontSize:12, fontWeight:600, color: pct >= 80 ? '#D4A000' : 'var(--text-muted)' }}>{pct}%</div>
            </div>
            <div style={{ height:6, background:'var(--border-soft)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:'#FFBE6A', borderRadius:3 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BodyMonthSection({ monthDates, bodyLogs, goalWeight, goalFat, todayStr }) {
  const past = monthDates.filter(d => d <= todayStr)
  const firstW = past.find(d => bodyLogs[d]?.weight != null)
  const lastW  = [...past].reverse().find(d => bodyLogs[d]?.weight != null)
  const firstF = past.find(d => bodyLogs[d]?.bodyFat != null)
  const lastF  = [...past].reverse().find(d => bodyLogs[d]?.bodyFat != null)

  const wStart = firstW ? bodyLogs[firstW].weight : null
  const wEnd   = lastW && lastW !== firstW ? bodyLogs[lastW].weight : null
  const fStart = firstF ? bodyLogs[firstF].bodyFat : null
  const fEnd   = lastF && lastF !== firstF ? bodyLogs[lastF].bodyFat : null

  const bowelDays = past.filter(d => (bodyLogs[d]?.bowelCount ?? 0) > 0)
  const totalBowel = bowelDays.reduce((s, d) => s + (bodyLogs[d]?.bowelCount || 0), 0)

  const Delta = ({ start, end }) => {
    if (end == null) return null
    const diff = (end - start).toFixed(1)
    const up = end > start
    return (
      <span style={{ fontSize:11, color: up ? '#D46A6A' : '#5AA05A', marginLeft:4 }}>
        ({up ? '+' : ''}{diff})
      </span>
    )
  }

  return (
    <div>
      {(wStart != null || fStart != null) ? (
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          {wStart != null && (
            <div style={{ flex:1, background:ACCENT_LIGHT, borderRadius:8, padding:'10px 10px' }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>體重</div>
              <div style={{ display:'flex', alignItems:'baseline', flexWrap:'wrap', gap:2 }}>
                <span style={{ fontSize:15, fontWeight:700, color:ACCENT_DARK }}>{wStart}kg</span>
                {wEnd && <><span style={{ fontSize:11, color:'var(--text-muted)' }}>→</span>
                  <span style={{ fontSize:15, fontWeight:700, color: wEnd < wStart ? '#5AA05A' : '#D46A6A' }}>{wEnd}kg</span>
                  <Delta start={wStart} end={wEnd} /></>}
              </div>
              {goalWeight && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>目標 {goalWeight}kg</div>}
            </div>
          )}
          {fStart != null && (
            <div style={{ flex:1, background:'#F5F0FF', borderRadius:8, padding:'10px 10px' }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>體脂</div>
              <div style={{ display:'flex', alignItems:'baseline', flexWrap:'wrap', gap:2 }}>
                <span style={{ fontSize:15, fontWeight:700, color:'#7A6ABA' }}>{fStart}%</span>
                {fEnd && <><span style={{ fontSize:11, color:'var(--text-muted)' }}>→</span>
                  <span style={{ fontSize:15, fontWeight:700, color: fEnd < fStart ? '#5AA05A' : '#D46A6A' }}>{fEnd}%</span>
                  <Delta start={fStart} end={fEnd} /></>}
              </div>
              {goalFat && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>目標 {goalFat}%</div>}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'8px 0' }}>本月尚無體態記錄</div>
      )}
      <div style={{ paddingTop:12, borderTop:'1px solid var(--border-soft)' }}>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>便便（月統計）</div>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { bg:'#FFF8F0', val:bowelDays.length, sub:'有記錄天', c:'#C08050', sc:'#D0A070' },
            { bg:'#F8F5F2', val:totalBowel,        sub:'本月總次', c:'#A07060', sc:'#C09080' },
            { bg:'#F5F5F5', val:bowelDays.length > 0 ? (totalBowel/bowelDays.length).toFixed(1) : '—', sub:'平均次/天', c:'#888', sc:'#AAA' },
          ].map((s, i) => (
            <div key={i} style={{ flex:1, background:s.bg, borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:700, color:s.c }}>{s.val}</div>
              <div style={{ fontSize:10, color:s.sc }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section label + card wrappers ─────────────────────────────────────────────
function SL({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.07em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:10 }}>
      {children}
    </div>
  )
}
function CW({ children, style = {} }) {
  return (
    <div style={{ background:'var(--bg-surface)', borderRadius:14, padding:'14px 16px', marginBottom:12, ...style }}>
      {children}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AchievementsPage({ store }) {
  const { state } = store
  const {
    settings = {}, products = [], waterLogs = {},
    bodyLogs = {}, exercises = [], supplementCheckins = {}
  } = state
  const {
    userName, waterGoalMl = 2000, bodyGoalWeight, bodyGoalFat,
    supplementItems = []
  } = settings

  const [period, setPeriod] = useState('week')
  const todayStr = useMemo(() => localDateStr(new Date()), [])
  const weekDates = useMemo(() => getWeekDates(0), [])
  const now = new Date()
  const monthDates = useMemo(() => getMonthDates(now.getFullYear(), now.getMonth()), [now.getFullYear(), now.getMonth()])

  // Per-day scores (week)
  const dayScores = useMemo(() => weekDates.map(d => {
    if (d > todayStr) return { skincare:false, water:false, exercise:false, supp:false, total:0 }
    const skincare = products.some(p => isUsedOnDate(p.usageLog, d, null))
    const water    = waterMl(waterLogs, d) >= waterGoalMl
    const exercise = exercises.some(e => e.date === d)
    const supp     = (supplementCheckins[d]||[]).length > 0
    const total    = [skincare,water,exercise,supp].filter(Boolean).length
    return { skincare, water, exercise, supp, total }
  }), [weekDates, todayStr, products, waterLogs, waterGoalMl, exercises, supplementCheckins])

  // Week completion %
  const weekPct = useMemo(() => {
    const past = weekDates.filter(d => d <= todayStr)
    if (!past.length) return 0
    const sum = past.reduce((s, d) => s + dayScores[weekDates.indexOf(d)].total, 0)
    return Math.round(sum / (past.length * 4) * 100)
  }, [dayScores, weekDates, todayStr])

  // Month completion %
  const monthPct = useMemo(() => {
    const past = monthDates.filter(d => d <= todayStr)
    if (!past.length) return 0
    const sum = past.reduce((s, d) => {
      const sk = products.some(p => isUsedOnDate(p.usageLog, d, null))
      const wa = waterMl(waterLogs, d) >= waterGoalMl
      const ex = exercises.some(e => e.date === d)
      const su = (supplementCheckins[d]||[]).length > 0
      return s + [sk,wa,ex,su].filter(Boolean).length
    }, 0)
    return Math.round(sum / (past.length * 4) * 100)
  }, [monthDates, todayStr, products, waterLogs, waterGoalMl, exercises, supplementCheckins])

  // Streaks
  const { skincareStreak, waterStreak, suppStreak } = useMemo(() => {
    let sk = 0, wa = 0, su = 0
    let skDone = false, waDone = false, suDone = false
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = localDateStr(d)
      if (key > todayStr) continue
      if (!skDone) { if (products.some(p => isUsedOnDate(p.usageLog, key, null))) sk++; else skDone = true }
      if (!waDone) { if (waterMl(waterLogs, key) >= waterGoalMl) wa++; else waDone = true }
      if (!suDone) { if ((supplementCheckins[key]||[]).length > 0) su++; else suDone = true }
      if (skDone && waDone && suDone) break
    }
    return { skincareStreak:sk, waterStreak:wa, suppStreak:su }
  }, [products, waterLogs, waterGoalMl, supplementCheckins, todayStr])

  // Hero tags
  const heroTags = useMemo(() => {
    const tags = []
    if (skincareStreak >= 3) tags.push(`保養 ${skincareStreak} 連`)
    if (waterStreak >= 3)    tags.push(`飲水達標 ${waterStreak} 天`)
    if (suppStreak >= 3)     tags.push(`保健品 ${suppStreak} 天`)
    return tags.slice(0, 3)
  }, [skincareStreak, waterStreak, suppStreak])

  // Month exercise + body stats
  const monthExercises = useMemo(
    () => exercises.filter(e => monthDates.includes(e.date) && e.date <= todayStr),
    [exercises, monthDates, todayStr]
  )
  const monthBodyLogs = useMemo(
    () => monthDates.filter(d => d <= todayStr && bodyLogs[d]?.weight != null).length,
    [monthDates, bodyLogs, todayStr]
  )

  // Heatmap scores
  const dayScoresMap = useMemo(() => {
    const map = {}
    monthDates.forEach(d => {
      if (d > todayStr) return
      const sk = products.some(p => isUsedOnDate(p.usageLog, d, null))
      const wa = waterMl(waterLogs, d) >= waterGoalMl
      const ex = exercises.some(e => e.date === d)
      const su = (supplementCheckins[d]||[]).length > 0
      map[d] = [sk,wa,ex,su].filter(Boolean).length
    })
    return map
  }, [monthDates, todayStr, products, waterLogs, waterGoalMl, exercises, supplementCheckins])

  // Habit bars factory
  const makeHabitBars = (days) => [
    { icon:'🧴', label:'保養品',   color:H_COLORS.skincare,  pct: days.length > 0 ? Math.round(days.filter(d => products.some(p => isUsedOnDate(p.usageLog, d, null))).length / days.length * 100) : 0 },
    { icon:'💧', label:'飲水達標', color:H_COLORS.water,     pct: days.length > 0 ? Math.round(days.filter(d => waterMl(waterLogs, d) >= waterGoalMl).length / days.length * 100) : 0 },
    { icon:'🏃', label:'運動打卡', color:H_COLORS.exercise,  pct: days.length > 0 ? Math.round(days.filter(d => exercises.some(e => e.date === d)).length / days.length * 100) : 0 },
    { icon:'💊', label:'保健品',   color:H_COLORS.supp,      pct: days.length > 0 ? Math.round(days.filter(d => (supplementCheckins[d]||[]).length > 0).length / days.length * 100) : 0 },
  ]

  const pastWeekDays  = weekDates.filter(d => d <= todayStr)
  const pastMonthDays = monthDates.filter(d => d <= todayStr)
  const weekBars  = useMemo(() => makeHabitBars(pastWeekDays),  [pastWeekDays,  products, waterLogs, waterGoalMl, exercises, supplementCheckins])
  const monthBars = useMemo(() => makeHabitBars(pastMonthDays), [pastMonthDays, products, waterLogs, waterGoalMl, exercises, supplementCheckins])

  const weekExercises = exercises.filter(e => weekDates.includes(e.date))
  const weekLabel  = `${weekDates[0].slice(5).replace('-','/')} – ${weekDates[6].slice(5).replace('-','/')}`
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`

  return (
    <div style={{ padding:'16px 16px 100px', maxWidth:430, margin:'0 auto' }}>
      {/* Period toggle */}
      <div style={{ display:'flex', background:'var(--bg-surface)', borderRadius:10, padding:3, border:'1px solid var(--border-soft)', marginBottom:14 }}>
        {[['week','本週'],['month','本月']].map(([id, lb]) => (
          <button key={id} onClick={() => setPeriod(id)} style={{
            flex:1, padding:'7px 0', fontSize:13, cursor:'pointer', border:'none',
            background: period === id ? ACCENT : 'transparent',
            color:   period === id ? 'white' : 'var(--text-muted)',
            borderRadius:8, fontWeight: period === id ? 600 : 400, transition:'all 0.2s'
          }}>{lb}</button>
        ))}
      </div>

      <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', marginBottom:12 }}>
        {period === 'week' ? weekLabel : monthLabel}
      </div>

      {/* Hero */}
      <HeroCard name={userName} pct={period === 'week' ? weekPct : monthPct} tags={heroTags} />

      {period === 'week' ? (
        <>
          <WeekStrip weekDates={weekDates} todayStr={todayStr} dayScores={dayScores} />

          <div style={{ marginBottom:12 }}>
            <SL>近期成就</SL>
            <AchievementHighlights
              skincareStreak={skincareStreak} waterStreak={waterStreak} weekPct={weekPct}
              monthExerciseCount={monthExercises.length} suppStreak={suppStreak} monthBodyLogs={monthBodyLogs}
            />
          </div>

          <CW><SL>本週習慣完成率</SL><HabitBars bars={weekBars} /></CW>
          <CW><SL>本週運動</SL><ExerciseDetail weekExercises={weekExercises} weekDates={weekDates} todayStr={todayStr} /></CW>
          <CW><SL>飲水記錄</SL><WaterBarChart weekDates={weekDates} waterLogs={waterLogs} goalMl={waterGoalMl} todayStr={todayStr} /></CW>
          <CW><SL>保健品打卡</SL><SuppGrid suppItems={supplementItems} supplementCheckins={supplementCheckins} weekDates={weekDates} todayStr={todayStr} /></CW>
          <CW><SL>體態 ＆ 便便</SL><BodyCalendar bodyLogs={bodyLogs} goalWeight={bodyGoalWeight} goalFat={bodyGoalFat} todayStr={todayStr} /></CW>
        </>
      ) : (
        <>
          <CW><SL>本月習慣完成率</SL><HabitBars bars={monthBars} /></CW>
          <CW><SL>本月運動</SL><ExerciseMonthDetail monthExercises={monthExercises} /></CW>
          <CW><SL>本月飲水</SL><WaterMonthSummary monthDates={monthDates} waterLogs={waterLogs} goalMl={waterGoalMl} todayStr={todayStr} /></CW>
          <CW><SL>本月保健品</SL><SuppMonthBars suppItems={supplementItems} supplementCheckins={supplementCheckins} monthDates={monthDates} todayStr={todayStr} /></CW>
          <CW><SL>體態 ＆ 便便</SL><BodyMonthSection monthDates={monthDates} bodyLogs={bodyLogs} goalWeight={bodyGoalWeight} goalFat={bodyGoalFat} todayStr={todayStr} /></CW>
          <CW><SL>習慣熱力圖</SL><MonthHeatmap monthDates={monthDates} todayStr={todayStr} dayScoresMap={dayScoresMap} /></CW>
        </>
      )}
    </div>
  )
}
