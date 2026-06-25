import React, { useState, useRef, useEffect } from 'react'
import { getStreak, getTotalStats, getMonthlyRate, CATEGORY_COLORS, localDateStr, getWeekDates, isUsedOnDate } from '../store/useStore.js'
import { supabase } from '../lib/supabase.js'

// ── Habit tracker ─────────────────────────────────────────────
function HabitTracker({ products, onToggle, amOrder, pmOrder, onReorder }) {
  const hour = new Date().getHours()
  const [section, setSection] = useState(hour >= 12 ? 'pm' : 'am')
  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = getWeekDates(weekOffset)
  const todayStr = localDateStr(new Date())
  const DOW = ['一', '二', '三', '四', '五', '六', '日']
  const fmt = d => `${d.slice(5, 7)}/${d.slice(8, 10)}`

  // Drag state
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const listRef = useRef(null)
  const dragStateRef = useRef({ dragIndex: null, overIndex: null })

  // Filter products for current tab
  const filtered = products.filter(p => !p.timeOfDay || p.timeOfDay === section)

  // Apply custom order
  const order = section === 'am' ? amOrder : pmOrder
  const sorted = React.useMemo(() => {
    if (!order || order.length === 0) return filtered
    const indexed = new Map(order.map((id, i) => [id, i]))
    return [...filtered].sort((a, b) => {
      const ai = indexed.has(a.id) ? indexed.get(a.id) : Infinity
      const bi = indexed.has(b.id) ? indexed.get(b.id) : Infinity
      return ai - bi
    })
  }, [filtered.map(p => p.id).join(','), order?.join(',')])  // eslint-disable-line

  const sortedRef = useRef(sorted)
  useEffect(() => { sortedRef.current = sorted }, [sorted])

  function getIndexFromY(clientY) {
    const children = Array.from(listRef.current?.children || [])
    for (let i = 0; i < children.length; i++) {
      if (clientY < children[i].getBoundingClientRect().bottom) return i
    }
    return Math.max(0, children.length - 1)
  }

  // Keep section in ref so event handlers always see latest value without re-registering
  const sectionRef = useRef(section)
  useEffect(() => { sectionRef.current = section }, [section])
  const onReorderRef = useRef(onReorder)
  useEffect(() => { onReorderRef.current = onReorder }, [onReorder])

  useEffect(() => {
    function onTouchMove(e) {
      if (dragStateRef.current.dragIndex === null) return
      e.preventDefault()
      const touch = e.touches[0]
      const idx = getIndexFromY(touch.clientY)
      dragStateRef.current.overIndex = idx
      setOverIndex(idx)
    }
    function onTouchEnd() {
      const { dragIndex: di, overIndex: oi } = dragStateRef.current
      if (di !== null && oi !== null && di !== oi) {
        const next = [...sortedRef.current]
        const [moved] = next.splice(di, 1)
        next.splice(oi, 0, moved)
        onReorderRef.current(sectionRef.current, next.map(p => p.id))
      }
      dragStateRef.current = { dragIndex: null, overIndex: null }
      setDragIndex(null)
      setOverIndex(null)
    }
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    return () => {
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  function isPerfect(dateStr) {
    if (!sorted.length) return false
    return sorted.every(p => isUsedOnDate(p.usageLog, dateStr, section))
  }

  return (
    <div>
      {/* AM/PM tabs */}
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

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
          color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 8,
        }}>‹</button>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
          {fmt(weekDates[0])}～{fmt(weekDates[6])}
        </div>
        <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
          color: weekOffset === 0 ? 'var(--border-soft)' : 'var(--text-secondary)',
          padding: '2px 8px', borderRadius: 8,
        }}>›</button>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          {section === 'am' ? '尚未加入白天使用的保養品' : '尚未加入晚上使用的保養品'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6, paddingLeft: 4 }}>
            <div style={{ width: 20, flexShrink: 0 }} />
            <div style={{ width: 76, minWidth: 76 }} />
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

          {/* Product rows (draggable) */}
          <div ref={listRef}>
            {sorted.map((p, index) => {
              const name = p.nickname || p.name || p.brand || '未命名'
              const catColor = p.category ? CATEGORY_COLORS[p.category] : null
              const isDragging = dragIndex === index
              const isOver = overIndex === index && dragIndex !== null && dragIndex !== index
              return (
                <div key={p.id} style={{
                  opacity: isDragging ? 0.4 : 1,
                  borderTop: isOver && dragIndex > index ? '2px solid #A8C8A0' : 'none',
                  borderBottom: isOver && dragIndex < index ? '2px solid #A8C8A0' : 'none',
                  transition: 'opacity 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 5, paddingLeft: 4 }}>
                    {/* Drag handle */}
                    <div
                      onTouchStart={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        dragStateRef.current = { dragIndex: index, overIndex: index }
                        setDragIndex(index)
                        setOverIndex(index)
                      }}
                      style={{ width: 20, fontSize: 14, color: 'var(--text-muted)', cursor: 'grab', userSelect: 'none', touchAction: 'none', flexShrink: 0 }}
                    >⠿</div>
                    {/* Product info */}
                    <div style={{ width: 76, minWidth: 76, display: 'flex', alignItems: 'center', gap: 5, paddingRight: 6 }}>
                      {p.imagePreview
                        ? <img src={p.imagePreview} style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 20, height: 20, borderRadius: 5, background: catColor?.bg || 'var(--bg-surface)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🧴</div>
                      }
                      <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    </div>
                    {/* Day cells */}
                    {weekDates.map(d => {
                      const used = isUsedOnDate(p.usageLog, d, section)
                      const isFuture = d > todayStr
                      const isToday = d === todayStr
                      return (
                        <div key={d} style={{ width: 34, minWidth: 34, textAlign: 'center' }}>
                          <div
                            onClick={() => !isFuture && onToggle(p.id, section)}
                            style={{
                              width: 28, height: 28, borderRadius: 7, margin: '0 auto',
                              background: used ? (catColor?.bg || '#C8D8C0') : isFuture ? 'transparent' : 'var(--bg-surface)',
                              border: isToday && !used ? '1.5px solid #C8A87A' : isFuture ? 'none' : used ? 'none' : '0.5px solid var(--border-soft)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: isFuture ? 'default' : 'pointer',
                            }}
                          >
                            {used && <span style={{ fontSize: 12, color: catColor?.text || '#5A7A52' }}>✓</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Perfect row */}
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: 4, paddingLeft: 4 }}>
            <div style={{ width: 20, flexShrink: 0 }} />
            <div style={{ width: 76, minWidth: 76, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, paddingRight: 6 }}>全部完成</div>
            {weekDates.map(d => {
              const perfect = isPerfect(d)
              return (
                <div key={d} style={{ width: 34, minWidth: 34, textAlign: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, margin: '0 auto',
                    background: perfect ? '#F8C467' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
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
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function ProfilePage({ store }) {
  const { state, updateSettings, toggleProductUseToday, updateTrackerOrder } = store
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
          <HabitTracker
            products={products}
            onToggle={toggleProductUseToday}
            amOrder={settings.trackerAmOrder}
            pmOrder={settings.trackerPmOrder}
            onReorder={updateTrackerOrder}
          />
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
