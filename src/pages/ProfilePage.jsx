import React, { useState } from 'react'
import { getStreak, getTotalStats, getMonthlyRate, CATEGORY_COLORS } from '../store/useStore.js'
import { supabase } from '../lib/supabase.js'

// ── Weekly habit tracker ──────────────────────────────────────
function getWeekDates(offset = 0) {
  // Returns Mon–Sun for the week at offset (0=current, -1=last week…)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dow = today.getDay() // 0=Sun
  const diffToMon = dow === 0 ? -6 : 1 - dow
  const mon = new Date(today)
  mon.setDate(today.getDate() + diffToMon + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function HabitTracker({ products }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = getWeekDates(weekOffset)
  const todayStr = new Date().toISOString().slice(0, 10)
  const DOW = ['一', '二', '三', '四', '五', '六', '日']

  const mon = weekDates[0]
  const sun = weekDates[6]
  const fmt = d => `${d.slice(5, 7)}/${d.slice(8, 10)}`

  // Perfect day: all products used on that date
  function isPerfect(dateStr) {
    if (!products.length) return false
    return products.every(p => (p.usageLog || []).includes(dateStr))
  }

  if (products.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>尚未加入任何產品</div>
  }

  return (
    <div>
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
          color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 8,
        }}>‹</button>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
          {fmt(mon)}～{fmt(sun)}
        </div>
        <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
          color: weekOffset === 0 ? 'var(--border-soft)' : 'var(--text-secondary)',
          padding: '2px 8px', borderRadius: 8,
        }}>›</button>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 90, minWidth: 80 }} />
              {weekDates.map((d, i) => {
                const isToday = d === todayStr
                return (
                  <th key={d} style={{ textAlign: 'center', padding: '0 2px 8px', minWidth: 36 }}>
                    <div style={{
                      fontSize: 11, color: isToday ? '#5A7A52' : 'var(--text-muted)',
                      fontWeight: isToday ? 700 : 400,
                    }}>{DOW[i]}</div>
                    <div style={{
                      fontSize: 10, color: isToday ? '#5A7A52' : 'var(--text-muted)',
                      fontWeight: isToday ? 600 : 400,
                    }}>{d.slice(8, 10)}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const name = p.nickname || p.name || p.brand || '未命名'
              const catColor = p.category ? CATEGORY_COLORS[p.category] : null
              return (
                <tr key={p.id}>
                  <td style={{ paddingRight: 8, paddingBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {p.imagePreview
                        ? <img src={p.imagePreview} style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 22, height: 22, borderRadius: 5, background: catColor?.bg || 'var(--bg-surface)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🧴</div>
                      }
                      <span style={{
                        fontSize: 12, color: 'var(--text-primary)', fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: 64,
                      }}>{name}</span>
                    </div>
                  </td>
                  {weekDates.map(d => {
                    const used = (p.usageLog || []).includes(d)
                    const isFuture = d > todayStr
                    const isToday = d === todayStr
                    const bg = used
                      ? (catColor?.bg || '#C8D8C0')
                      : isFuture ? 'transparent' : 'var(--bg-surface)'
                    return (
                      <td key={d} style={{ textAlign: 'center', paddingBottom: 5 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7, margin: '0 auto',
                          background: bg,
                          border: isToday && !used ? '1.5px solid #C8A87A'
                            : isFuture ? 'none'
                            : used ? 'none'
                            : '0.5px solid var(--border-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {used && <span style={{ fontSize: 12, color: catColor?.text || '#5A7A52' }}>✓</span>}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {/* Perfect row */}
            <tr>
              <td style={{ paddingTop: 6, paddingRight: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>全部完成</span>
              </td>
              {weekDates.map(d => {
                const perfect = isPerfect(d)
                const isFuture = d > todayStr
                return (
                  <td key={d} style={{ textAlign: 'center', paddingTop: 6 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, margin: '0 auto',
                      background: perfect ? '#F8C467' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {perfect && <span style={{ fontSize: 13 }}>★</span>}
                    </div>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
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

export default function ProfilePage({ store, onOpenMakeup }) {
  const { state, updateSettings } = store
  const { settings, products } = state

  const [userName, setUserName] = useState(settings.userName)
  const [saved, setSaved]       = useState(false)

  // Sync when Supabase data loads (async after mount)
  React.useEffect(() => {
    setUserName(settings.userName)
  }, [settings.userName])

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
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>我的</div>
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
      <Section title="保養打卡紀錄">
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

      {/* [Fix 8] Makeup reference entry */}
      {onOpenMakeup && (
        <Section title="工具">
          <button
            onClick={onOpenMakeup}
            className="card"
            style={{
              width: '100%', padding: '14px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
              border: '0.5px solid var(--border-soft)',
            }}
          >
            <span style={{ fontSize: 22 }}>✿</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>化妝順序參考</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>完整版 · 精簡版 · 約會版</div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</span>
          </button>
        </Section>
      )}

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

      {/* [Fix 10] Removed 清除本機快取 — developer tool not for end users */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid var(--border-soft)' }}>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0', textAlign: 'left' }}
        >
          登出
        </button>
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}
