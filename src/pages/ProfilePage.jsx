import React, { useState } from 'react'
import { getStreak, getTotalStats, getMonthlyRate } from '../store/useStore.js'
import { supabase } from '../lib/supabase.js'

// ── Weekly habit tracker ──────────────────────────────────────
function HabitTracker({ products }) {
  // Build a set of all dates any product was used
  const usageByDate = {}
  products.forEach(p => {
    ;(p.usageLog || []).forEach(d => {
      usageByDate[d] = (usageByDate[d] || 0) + 1
    })
  })

  // Build last 28 days grouped by week (Mon–Sun)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find most recent Sunday as end anchor
  const days = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }

  // Pad front so first day is Monday
  const firstDow = new Date(days[0] + 'T12:00:00').getDay() // 0=Sun
  const leadingEmpty = firstDow === 0 ? 6 : firstDow - 1
  const paddedDays = [...Array(leadingEmpty).fill(null), ...days]

  // Split into weeks
  const weeks = []
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7))
  }

  const DOW = ['一', '二', '三', '四', '五', '六', '日']
  const todayStr = today.toISOString().slice(0, 10)

  function cellColor(dateStr) {
    if (!dateStr) return 'transparent'
    if (dateStr > todayStr) return 'var(--bg-surface)'
    const count = usageByDate[dateStr] || 0
    if (count === 0) return 'var(--bg-surface)'
    if (count <= 1) return '#D4E4CC'
    if (count <= 3) return '#AECBB8'
    if (count <= 5) return '#7AAA8A'
    return '#4E8A60'
  }

  function cellBorder(dateStr) {
    if (!dateStr || dateStr > todayStr) return '0.5px solid transparent'
    const count = usageByDate[dateStr] || 0
    if (count === 0) return '0.5px solid var(--border-soft)'
    return '0.5px solid transparent'
  }

  return (
    <div>
      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {DOW.map(d => (
          <div key={d} style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      {/* Grid */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {week.map((dateStr, di) => {
            const isToday = dateStr === todayStr
            return (
              <div key={di} style={{
                aspectRatio: '1',
                borderRadius: 6,
                background: cellColor(dateStr),
                border: isToday ? '1.5px solid #7AAA6A' : cellBorder(dateStr),
                position: 'relative',
              }} />
            )
          })}
        </div>
      ))}
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>少</span>
        {['var(--bg-surface)', '#D4E4CC', '#AECBB8', '#7AAA8A', '#4E8A60'].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: '0.5px solid var(--border-soft)' }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>多</span>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function ProfilePage({ store }) {
  const { state, updateSettings } = store
  const { settings, products } = state

  const [userName, setUserName] = useState(settings.userName)
  const [saved, setSaved]       = useState(false)

  const streak = getStreak(products)
  const { activeDays, totalUses } = getTotalStats(products)
  const monthlyRate = getMonthlyRate(products)

  function handleSave() {
    updateSettings({ userName })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)' }}>我的</div>
      </div>

      {/* Stats */}
      <Section title="使用紀錄">
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: '連續天數', value: streak, unit: '天' },
            { label: '活躍天數', value: activeDays, unit: '天' },
            { label: '本月完成率', value: `${monthlyRate}%`, unit: '' },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
              padding: '14px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>
                {item.value}{item.unit && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>{item.unit}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Habit tracker */}
      <Section title="保養勤勞度（近 28 天）">
        <div className="card" style={{ padding: '14px' }}>
          <HabitTracker products={products} />
        </div>
      </Section>

      {/* Overview */}
      <Section title="目前設定">
        <div className="card" style={{ padding: '12px 14px' }}>
          {[
            { label: '保養品總數', count: products.length, emoji: '🧴' },
            { label: '保養組別數', count: (state.routineGroups || []).length, emoji: '🌸' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: i < arr.length - 1 ? '0.5px solid var(--border-soft)' : 'none',
            }}>
              <span style={{ fontSize: 16 }}>{item.emoji}</span>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{item.count}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* User name */}
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

      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0', textAlign: 'left' }}
        >
          登出
        </button>
        <button onClick={() => {
          if (confirm('確定要清除所有資料嗎？此操作無法復原。')) {
            localStorage.removeItem('beautyGarden_v1')
            localStorage.removeItem('beautyGarden_v2')
            location.reload()
          }
        }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: '4px 0', textAlign: 'left' }}>
          清除本機快取
        </button>
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}
