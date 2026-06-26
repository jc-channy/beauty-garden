import React from 'react'
import { todayKey, localDateStr, CATEGORY_COLORS, isUsedOnDate, getWeekDates } from '../store/useStore.js'

const DOW = ['日', '一', '二', '三', '四', '五', '六']

const INTENSITY_OPTS = [
  { key: 'light',    label: '輕度' },
  { key: 'moderate', label: '中度' },
  { key: 'intense',  label: '高強度' },
]

const COMPLETION_MSGS = [
  '今天把自己照顧得很好',
  '每一個小動作，都算數',
  '好好愛自己，是一種練習',
  '今天也完成了，辛苦了',
  '你值得被好好對待',
]

function getTimeGreeting(userName) {
  const h = new Date().getHours()
  const name = userName ? `${userName}，` : ''
  if (h >= 5  && h < 12) return `早安，${name}從哪裡開始 ✿`
  if (h >= 12 && h < 18) return `${name}下午也記得照顧自己 ✿`
  if (h >= 18 && h < 22) return `${name}保養時間到了 ✿`
  return `${name}終於到你的時間了 ✿`
}

function formatHeader() {
  const d = new Date()
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dy = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${mo}.${dy} 星期${days[d.getDay()]}`
}

// ── Date strip ────────────────────────────────────────────────
function DateStrip({ selectedDate, onSelect }) {
  const stripRef = React.useRef(null)
  const todayStr = todayKey()

  const dates = React.useMemo(() => {
    const today = new Date()
    const list = []
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      list.push(localDateStr(d))
    }
    return list
  }, [])

  React.useEffect(() => {
    if (!stripRef.current) return
    const idx = dates.indexOf(selectedDate)
    if (idx < 0) return
    const chip = stripRef.current.children[idx]
    if (chip) chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedDate, dates])

  return (
    <div ref={stripRef} style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', marginBottom: 14 }}>
      {dates.map(d => {
        const isToday = d === todayStr
        const isSelected = d === selectedDate
        const dow = new Date(d + 'T12:00:00').getDay()
        return (
          <button key={d} onClick={() => onSelect(d)} style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '5px 7px', borderRadius: 10, cursor: 'pointer',
            background: isSelected ? '#EEF4EC' : 'transparent',
            border: `0.5px solid ${isSelected ? '#A8C8A0' : 'transparent'}`,
            minWidth: 40, gap: 2,
          }}>
            <span style={{ fontSize: 10, color: isSelected ? '#5A7A52' : isToday ? '#9A7A5A' : 'var(--text-muted)', fontWeight: isSelected || isToday ? 600 : 400 }}>
              {isToday ? '今' : DOW[dow]}
            </span>
            <span style={{ fontSize: 15, fontWeight: isSelected ? 600 : 400, color: isSelected ? '#5A7A52' : isToday ? '#9A7A5A' : 'var(--text-primary)' }}>
              {d.slice(8, 10)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Progress ring ─────────────────────────────────────────────
function ProgressRing({ done, total }) {
  const r = 18, circ = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  const offset = circ * (1 - pct)
  return (
    <svg width="46" height="46" viewBox="0 0 46 46">
      <circle cx="23" cy="23" r={r} fill="none" stroke="#EDE6DE" strokeWidth="4" />
      <circle cx="23" cy="23" r={r} fill="none" stroke="#C8A87A" strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 23 23)"
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
      <text x="23" y="27" textAnchor="middle" fontSize="11" fill="#8A6A40" fontWeight="500">
        {done}/{total}
      </text>
    </svg>
  )
}

// ── Section card wrapper ──────────────────────────────────────
function SectionCard({ tag, tagBg, tagText, children, headerRight }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 18, border: '0.5px solid var(--border-soft)', marginBottom: 18, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 10px' }}>
        <span style={{ fontSize: 13, fontWeight: 500, padding: '2px 10px', borderRadius: 20, background: tagBg, color: tagText }}>{tag}</span>
        {headerRight}
      </div>
      <div style={{ padding: '0 14px 14px' }}>{children}</div>
    </div>
  )
}

// ── Body section ──────────────────────────────────────────────
function BodySection({ bodyLog, selectedDate, onSave }) {
  const [weight, setWeight] = React.useState('')
  const [bodyFat, setBodyFat] = React.useState('')
  const saved = bodyLog?.weight != null || bodyLog?.bodyFat != null

  React.useEffect(() => {
    setWeight(bodyLog?.weight != null ? String(bodyLog.weight) : '')
    setBodyFat(bodyLog?.bodyFat != null ? String(bodyLog.bodyFat) : '')
  }, [selectedDate, bodyLog])

  function handleBlur() {
    const w = parseFloat(weight) || null
    const bf = parseFloat(bodyFat) || null
    if (w !== null || bf !== null) {
      onSave(selectedDate, w, bf)
    }
  }

  return (
    <SectionCard tag="體態" tagBg="#F2E6D9" tagText="#8A6040"
      headerRight={saved ? <span style={{ fontSize: 11, color: '#8A6A40', background: '#F2E6D9', padding: '2px 8px', borderRadius: 8 }}>已記錄 ✓</span> : null}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: '體重', unit: 'kg', val: weight, set: setWeight },
          { label: '體脂率', unit: '%', val: bodyFat, set: setBodyFat },
        ].map(({ label, unit, val, set }) => (
          <div key={label} style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <input
                type="number" inputMode="decimal" value={val}
                onChange={e => set(e.target.value)}
                onBlur={handleBlur}
                placeholder="—"
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  fontSize: 22, fontWeight: 500, color: 'var(--text-primary)',
                  padding: 0, fontFamily: 'inherit',
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ── Water section ─────────────────────────────────────────────
function WaterSection({ totalMl, goalMl, quickAmounts, entries, onAdd, onDeleteEntry }) {
  const [customMode, setCustomMode] = React.useState(false)
  const [customVal, setCustomVal] = React.useState('')
  const [showEntries, setShowEntries] = React.useState(false)
  const pct = Math.min(100, goalMl > 0 ? Math.round((totalMl / goalMl) * 100) : 0)
  const done = totalMl >= goalMl

  function handleCustomAdd() {
    const ml = parseInt(customVal)
    if (ml > 0) { onAdd(ml); setCustomVal(''); setCustomMode(false) }
  }

  return (
    <SectionCard tag="飲水" tagBg="#E6F1FB" tagText="#185FA5"
      headerRight={<span style={{ fontSize: 12, color: done ? '#185FA5' : 'var(--text-muted)' }}>
        {totalMl}ml / {goalMl}ml {done ? '✓' : ''}
      </span>}>
      {/* Progress bar */}
      <div style={{ height: 10, background: '#EDE6DE', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: done ? '#85B7EB' : '#B5D4F4', borderRadius: 6, transition: 'width 0.3s ease' }} />
      </div>
      {/* Quick buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(quickAmounts || [200, 350, 500]).map(ml => (
          <button key={ml} onClick={() => onAdd(ml)} style={{
            padding: '6px 14px', borderRadius: 10, border: '0.5px solid #B5D4F4',
            background: '#E6F1FB', color: '#185FA5', fontSize: 13, cursor: 'pointer', fontWeight: 500,
          }}>+{ml}</button>
        ))}
        {customMode ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="number" inputMode="numeric" value={customVal}
              onChange={e => setCustomVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
              autoFocus
              placeholder="ml"
              style={{
                width: 72, padding: '5px 10px', borderRadius: 10,
                border: '0.5px solid #B5D4F4', background: '#E6F1FB',
                color: '#185FA5', fontSize: 13, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button onClick={handleCustomAdd} style={{ padding: '5px 10px', borderRadius: 10, border: 'none', background: '#85B7EB', color: '#fff', fontSize: 12, cursor: 'pointer' }}>+</button>
          </div>
        ) : (
          <button onClick={() => setCustomMode(true)} style={{
            padding: '6px 14px', borderRadius: 10,
            border: '0.5px dashed #B5D4F4', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
          }}>自訂</button>
        )}
      </div>
      {/* Entries list */}
      {entries.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button onClick={() => setShowEntries(v => !v)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'var(--text-muted)', padding: 0,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span>{showEntries ? '▾' : '▸'}</span>
            <span>紀錄（{entries.length} 筆）</span>
          </button>
          {showEntries && (
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {entries.map(entry => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-surface)', borderRadius: 8, padding: '6px 10px',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{entry.time}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#185FA5', flex: 1 }}>{entry.ml} ml</span>
                  <button onClick={() => onDeleteEntry(entry.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 17, color: '#C4B0A0', padding: '0 2px', lineHeight: 1,
                  }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}

// ── Supplement section ────────────────────────────────────────
const SUPP_TIMINGS = ['早上空腹', '早餐後', '午餐後', '晚餐後', '睡前']

const TIMING_COLORS = {
  '早上空腹': { bg: '#FEF3C0', text: '#6B4A00' },
  '早餐後':   { bg: '#FEE2C0', text: '#6B3200' },
  '午餐後':   { bg: '#D7EDD4', text: '#245020' },
  '晚餐後':   { bg: '#E0D8F4', text: '#332870' },
  '睡前':     { bg: '#D0E4F4', text: '#0A3060' },
}

function SupplementEditModal({ items, onSave, onClose }) {
  const [list, setList] = React.useState(items.map(i => ({ ...i })))
  const [expandedIdx, setExpandedIdx] = React.useState(null)
  const [newName, setNewName] = React.useState('')

  // ── drag-to-reorder ──────────────────────────────────────────
  const [dragIdx, setDragIdx] = React.useState(null)
  const [overIdx, setOverIdx] = React.useState(null)
  const listRef = React.useRef(null)
  const dragStateRef = React.useRef({ dragIdx: null, overIdx: null })
  const listRef2 = React.useRef(list)
  React.useEffect(() => { listRef2.current = list }, [list])

  function getIdxFromY(clientY) {
    const children = Array.from(listRef.current?.children || [])
    for (let i = 0; i < children.length; i++) {
      if (clientY < children[i].getBoundingClientRect().bottom) return i
    }
    return Math.max(0, children.length - 1)
  }

  function handleDragStart(e, index) {
    e.preventDefault(); e.stopPropagation()
    dragStateRef.current = { dragIdx: index, overIdx: index }
    setDragIdx(index); setOverIdx(index); setExpandedIdx(null)
  }

  React.useEffect(() => {
    function onMove(e) {
      if (dragStateRef.current.dragIdx === null) return
      e.preventDefault()
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const idx = getIdxFromY(clientY)
      dragStateRef.current.overIdx = idx; setOverIdx(idx)
    }
    function onEnd() {
      const { dragIdx: di, overIdx: oi } = dragStateRef.current
      if (di !== null && oi !== null && di !== oi) {
        const next = [...listRef2.current]
        const [moved] = next.splice(di, 1); next.splice(oi, 0, moved)
        setList(next)
      }
      dragStateRef.current = { dragIdx: null, overIdx: null }
      setDragIdx(null); setOverIdx(null)
    }
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
    return () => {
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
    }
  }, [])

  // ── item helpers ─────────────────────────────────────────────
  function updateItem(i, val) { setList(l => l.map((x, j) => j === i ? val : x)) }
  function deleteItem(i) { setList(l => l.filter((_, j) => j !== i)); if (expandedIdx === i) setExpandedIdx(null) }
  function toggleTiming(i, t) {
    setList(l => l.map((x, j) => {
      if (j !== i) return x
      const timings = (x.timings || []).includes(t) ? x.timings.filter(k => k !== t) : [...(x.timings || []), t]
      return { ...x, timings }
    }))
  }
  function addItem() {
    const n = newName.trim()
    if (!n) return
    setList(l => { const next = [...l, { name: n, amount: '', timings: [] }]; setExpandedIdx(next.length - 1); return next })
    setNewName('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>管理營養品</div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⠿ 拖曳排序</span>
        </div>

        <div ref={listRef}>
          {list.map((item, i) => {
            const isExp = expandedIdx === i
            const isDrag = dragIdx === i
            const isOver = overIdx === i && dragIdx !== null && dragIdx !== i
            return (
              <div key={i} style={{
                opacity: isDrag ? 0.4 : 1, transition: 'opacity 0.15s',
                borderTop: isOver && dragIdx > i ? '2px solid #AFA9EC' : 'none',
                borderBottom: isOver && dragIdx < i ? '2px solid #AFA9EC' : 'none',
                marginBottom: 5,
              }}>
                {/* Row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px',
                  background: isExp ? '#F5F3FE' : 'var(--bg-surface)',
                  border: `0.5px solid ${isExp ? '#AFA9EC' : 'var(--border-soft)'}`,
                  borderRadius: isExp ? '10px 10px 0 0' : 10,
                }}>
                  <div onTouchStart={e => handleDragStart(e, i)} onMouseDown={e => handleDragStart(e, i)} style={{ fontSize: 16, color: 'var(--text-muted)', padding: '2px 4px', userSelect: 'none', touchAction: 'none', flexShrink: 0, cursor: 'grab' }}>⠿</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setExpandedIdx(isExp ? null : i)}>
                    {/* 時機 badges 在前 */}
                    {(item.timings || []).map(t => {
                      const c = TIMING_COLORS[t] || { bg: '#EEE', text: '#666' }
                      return <span key={t} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 5, background: c.bg, color: c.text, fontWeight: 500, whiteSpace: 'nowrap' }}>{t}</span>
                    })}
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</span>
                    {item.amount ? <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {item.amount}</span> : null}
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteItem(i) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#C07070', padding: '0 2px', flexShrink: 0 }}>×</button>
                </div>

                {/* Expanded panel */}
                {isExp && (
                  <div style={{ padding: '10px 12px 12px', background: '#F5F3FE', border: '0.5px solid #AFA9EC', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>份量備忘</div>
                    <input type="text" value={item.amount} onChange={e => updateItem(i, { ...item, amount: e.target.value })} placeholder="例：2顆、1匙" style={{ width: '100%', marginBottom: 10, fontSize: 12 }} />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>食用時機</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {SUPP_TIMINGS.map(t => {
                        const active = (item.timings || []).includes(t)
                        const c = TIMING_COLORS[t] || { bg: '#EEE', text: '#666' }
                        return (
                          <button key={t} onClick={() => toggleTiming(i, t)} style={{
                            padding: '4px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                            border: `0.5px solid ${active ? c.text + '60' : 'var(--border-soft)'}`,
                            background: active ? c.bg : 'transparent',
                            color: active ? c.text : 'var(--text-muted)',
                            fontWeight: active ? 500 : 400,
                          }}>{t}</button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, margin: '10px 0 16px' }}>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="新增品項…"
            style={{ flex: 1 }}
          />
          <button onClick={addItem} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#EEEDFE', color: '#534AB7', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>新增</button>
        </div>
        <button onClick={() => onSave(list)} className="btn-primary">儲存</button>
      </div>
    </div>
  )
}

function SupplementSection({ items, checked, selectedDate, onToggle, onEditItems }) {
  const [showEdit, setShowEdit] = React.useState(false)
  const names = items.map(i => i.name)
  const allDone = items.length > 0 && checked.length >= items.length

  return (
    <>
      <SectionCard tag="營養品" tagBg="#EEEDFE" tagText="#3C3489"
        headerRight={
          <button onClick={() => setShowEdit(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', padding: 0 }}>
            {items.length === 0 ? '+ 設定品項' : '編輯'}
          </button>
        }>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            點右上角「設定品項」加入你的日常營養品
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {items.map(item => {
              const done = checked.includes(item.name)
              const timings = item.timings || []
              return (
                {(() => {
                  const firstTiming = timings[0]
                  const tc = (firstTiming && TIMING_COLORS[firstTiming]) || { bg: '#EEEDFE', text: '#534AB7' }
                  return (
                    <button key={item.name} onClick={() => onToggle(item.name, selectedDate)} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                      padding: '7px 12px', borderRadius: 16,
                      background: done ? tc.bg : 'var(--bg-surface)',
                      border: `0.5px solid ${done ? tc.text + '50' : 'var(--border-soft)'}`,
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                    }}>
                      {timings.length > 0 && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {timings.map(t => {
                            const c = TIMING_COLORS[t] || { bg: '#EEE', text: '#666' }
                            return (
                              <span key={t} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 6, background: c.bg, color: c.text, fontWeight: 500, lineHeight: 1.5 }}>{t}</span>
                            )
                          })}
                        </div>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {done && <span style={{ width: 13, height: 13, borderRadius: '50%', background: tc.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', flexShrink: 0 }}>✓</span>}
                        <span style={{ fontSize: 14, color: done ? tc.text : 'var(--text-secondary)', fontWeight: done ? 500 : 400 }}>{item.name}</span>
                        {item.amount ? <span style={{ fontSize: 11, color: done ? tc.text + 'AA' : 'var(--text-muted)' }}>· {item.amount}</span> : null}
                      </span>
                    </button>
                  )
                })()}
              )
            })}
            {allDone && <span style={{ fontSize: 11, color: '#534AB7', alignSelf: 'center', marginLeft: 2 }}>全打了 ✦</span>}
          </div>
        )}
      </SectionCard>
      {showEdit && (
        <SupplementEditModal
          items={items}
          onSave={newItems => { onEditItems(newItems); setShowEdit(false) }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}

// ── Exercise section ──────────────────────────────────────────
function ExerciseModal({ exerciseTypes, initialType, onSave, onClose }) {
  const [type, setType] = React.useState(initialType || (exerciseTypes[0] || ''))
  const [subType, setSubType] = React.useState('')
  const [duration, setDuration] = React.useState('30')
  const [intensity, setIntensity] = React.useState('moderate')

  function handleSave() {
    onSave(type, subType.trim(), parseInt(duration) || 30, intensity)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 18 }}>新增運動</div>

        {/* Type */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>運動類型</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          {exerciseTypes.map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: '0.5px solid', fontWeight: type === t ? 500 : 400,
              borderColor: type === t ? '#A8C8A0' : 'var(--border-soft)',
              background: type === t ? '#EEF4EC' : 'var(--bg-surface)',
              color: type === t ? '#5A7A52' : 'var(--text-secondary)',
            }}>{t}</button>
          ))}
        </div>

        {/* Sub-type */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>細項（選填）</div>
        <input type="text" value={subType} onChange={e => setSubType(e.target.value)} placeholder="例：上半身、核心、跑步…" style={{ marginBottom: 16 }} />

        {/* Duration + Intensity in one row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>時長（分鐘）</div>
            <input type="number" inputMode="numeric" value={duration} onChange={e => setDuration(e.target.value)} style={{ textAlign: 'center' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>強度</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {INTENSITY_OPTS.map(opt => (
                <button key={opt.key} onClick={() => setIntensity(opt.key)} style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  border: '0.5px solid', textAlign: 'center',
                  borderColor: intensity === opt.key ? '#A8C8A0' : 'var(--border-soft)',
                  background: intensity === opt.key ? '#EEF4EC' : 'var(--bg-surface)',
                  color: intensity === opt.key ? '#5A7A52' : 'var(--text-secondary)',
                  fontWeight: intensity === opt.key ? 500 : 400,
                }}>{opt.label}</button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary">儲存</button>
      </div>
    </div>
  )
}

function ExerciseTypeModal({ types, onSave, onClose }) {
  const [list, setList] = React.useState([...types])
  const [newType, setNewType] = React.useState('')

  function addType() {
    const n = newType.trim()
    if (!n || list.includes(n)) return
    setList(l => [...l, n])
    setNewType('')
  }
  function removeType(i) { setList(l => l.filter((_, j) => j !== i)) }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 14 }}>管理運動類型</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {list.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', borderRadius: 8, padding: '8px 12px' }}>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{t}</span>
              <button onClick={() => removeType(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#C07070', padding: '0 2px' }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="text" value={newType} onChange={e => setNewType(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addType()}
            placeholder="新增類型…" style={{ flex: 1 }} />
          <button onClick={addType} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#EEF4EC', color: '#5A7A52', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>新增</button>
        </div>
        <button onClick={() => onSave(list)} className="btn-primary">儲存</button>
      </div>
    </div>
  )
}

const WEEK_DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function ExerciseSection({ exercises, selectedDate, exerciseTypes, onAdd, onDelete, onUpdateTypes }) {
  const [showModal, setShowModal] = React.useState(false)
  const [showTypeModal, setShowTypeModal] = React.useState(false)
  const [modalInitialType, setModalInitialType] = React.useState(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState(null)
  const todayExercises = exercises.filter(e => e.date === selectedDate)
  const weekDates = React.useMemo(() => getWeekDates(), [])
  const today = todayKey()

  // Long-press detection
  const longPressTimer = React.useRef(null)
  const didLongPress = React.useRef(false)

  function startPress(type) {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setModalInitialType(type)
      setShowModal(true)
    }, 500)
  }
  function cancelPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }
  function endPress(type) {
    cancelPress()
    if (!didLongPress.current) {
      onAdd(selectedDate, type, '', 30, 'moderate')
    }
  }

  const intensityLabel = k => INTENSITY_OPTS.find(o => o.key === k)?.label || k

  return (
    <>
      <SectionCard tag="運動" tagBg="#D7DFD2" tagText="#5A7A52"
        headerRight={
          <button onClick={() => setShowTypeModal(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--text-muted)', padding: 0,
          }}>管理類型</button>
        }>

        {/* Quick-tap type buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
          {exerciseTypes.map(type => {
            const countToday = todayExercises.filter(e => e.type === type).length
            return (
              <button
                key={type}
                onMouseDown={() => startPress(type)}
                onMouseUp={() => endPress(type)}
                onMouseLeave={cancelPress}
                onTouchStart={e => { e.preventDefault(); startPress(type) }}
                onTouchEnd={e => { e.preventDefault(); endPress(type) }}
                onTouchCancel={cancelPress}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  border: '0.5px solid',
                  borderColor: countToday > 0 ? '#A8C8A0' : 'var(--border-soft)',
                  background: countToday > 0 ? '#EEF4EC' : 'var(--bg-surface)',
                  color: countToday > 0 ? '#5A7A52' : 'var(--text-secondary)',
                  fontWeight: countToday > 0 ? 500 : 400,
                  userSelect: 'none', WebkitUserSelect: 'none',
                }}>
                {countToday > 0 && <span style={{ fontSize: 10 }}>✓</span>}
                {type}
              </button>
            )
          })}
          <button
            onClick={() => { setModalInitialType(null); setShowModal(true) }}
            style={{
              padding: '7px 12px', borderRadius: 20,
              border: '0.5px dashed var(--border-soft)', background: 'transparent',
              color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            }}>＋</button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>點選快速記錄・長按填詳情</div>

        {/* Week grid */}
        <div style={{ marginBottom: 2 }}>
          {/* Day header */}
          <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', marginBottom: 3 }}>
            <div />
            {weekDates.map((d, i) => {
              const isToday = d === today
              const isSel = d === selectedDate
              return (
                <div key={d} style={{ textAlign: 'center', lineHeight: 1.3 }}>
                  <div style={{ fontSize: 10, color: isToday ? '#5A7A52' : 'var(--text-muted)', fontWeight: isToday ? 600 : 400 }}>
                    {WEEK_DAY_LABELS[i]}
                  </div>
                  <div style={{ fontSize: 9, color: isSel ? '#5A7A52' : 'var(--text-muted)', fontWeight: isSel ? 600 : 400 }}>
                    {d.slice(8, 10)}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Type rows */}
          {exerciseTypes.map(type => (
            <div key={type} style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 4 }}>
                {type}
              </div>
              {weekDates.map(d => {
                const hasLog = exercises.some(e => e.date === d && e.type === type)
                const isSel = d === selectedDate
                return (
                  <div key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 22 }}>
                    <div style={{
                      width: 13, height: 13, borderRadius: '50%',
                      background: hasLog ? (isSel ? '#5A7A52' : '#A8C8A0') : 'transparent',
                      border: `0.5px solid ${hasLog ? '#5A7A52' : '#D8CCBF'}`,
                      transition: 'background 0.2s',
                    }} />
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Logged exercises for selected date */}
        {todayExercises.length > 0 && (
          <div style={{ borderTop: '0.5px solid var(--border-soft)', marginTop: 8, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {todayExercises.map(ex => (
              <div key={ex.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg-surface)', borderRadius: 8, padding: '7px 10px',
              }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{ex.type}</span>
                  {ex.subType && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 5 }}>{ex.subType}</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 5 }}>{ex.durationMin}min · {intensityLabel(ex.intensity)}</span>
                </div>
                {deleteConfirm === ex.id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { onDelete(ex.id); setDeleteConfirm(null) }} style={{ fontSize: 11, color: '#C07070', background: 'none', border: 'none', cursor: 'pointer' }}>確認</button>
                    <button onClick={() => setDeleteConfirm(null)} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>取消</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(ex.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)', padding: '0 4px' }}>×</button>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {showModal && (
        <ExerciseModal
          exerciseTypes={exerciseTypes}
          initialType={modalInitialType}
          onSave={(type, subType, durationMin, intensity) => {
            onAdd(selectedDate, type, subType, durationMin, intensity)
            setShowModal(false)
          }}
          onClose={() => setShowModal(false)}
        />
      )}
      {showTypeModal && (
        <ExerciseTypeModal
          types={exerciseTypes}
          onSave={types => { onUpdateTypes(types); setShowTypeModal(false) }}
          onClose={() => setShowTypeModal(false)}
        />
      )}
    </>
  )
}

// ── Skincare check item (swipe gesture) ───────────────────────
function CheckItem({ product, usedToday, onToggle, section, index }) {
  const displayName = product.nickname || product.name || product.brand || '未命名'
  const subName = product.nickname ? [product.brand, product.name].filter(Boolean).join(' ') : ''
  const mismatch = section && product.timeOfDay &&
    ((section === 'am' && product.timeOfDay === 'pm') || (section === 'pm' && product.timeOfDay === 'am'))

  const touchRef = React.useRef(null)
  const [swipeX, setSwipeX] = React.useState(0)

  function handleTouchStart(e) { touchRef.current = { startX: e.touches[0].clientX, handled: false }; setSwipeX(0) }
  function handleTouchMove(e) { if (!touchRef.current) return; const dx = e.touches[0].clientX - touchRef.current.startX; if (Math.abs(dx) > 10) setSwipeX(dx) }
  function handleTouchEnd(e) {
    if (!touchRef.current) return
    const dx = e.changedTouches[0].clientX - touchRef.current.startX
    touchRef.current.handled = true; setSwipeX(0)
    if (dx > 80) { onToggle() }
  }
  function handleClick() { if (touchRef.current?.handled) touchRef.current = null }

  const clampedX = Math.max(0, Math.min(90, swipeX))
  const swipingRight = clampedX > 10

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 10, marginBottom: 3 }}>
      {swipingRight && (
        <div style={{ position: 'absolute', inset: 0, background: usedToday ? '#FFF0F0' : '#EEF4EC', borderRadius: 10, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
          <span style={{ fontSize: 14, color: usedToday ? '#C07070' : '#5A7A52' }}>{usedToday ? '✕' : '✓'}</span>
        </div>
      )}
      <div
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd} onClick={handleClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '12px 12px',
          background: usedToday ? '#F6FAF5' : 'var(--bg-card)',
          borderRadius: 10,
          border: `0.5px solid ${mismatch ? '#E8C080' : usedToday ? '#D0DFCA' : 'var(--border-soft)'}`,
          transition: clampedX !== 0 ? 'none' : 'all 0.2s',
          cursor: 'pointer', touchAction: 'pan-y',
          transform: `translateX(${clampedX}px)`,
          position: 'relative', zIndex: 1, userSelect: 'none',
        }}
      >
        {/* 序號 / 打勾 */}
        <div style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          border: `1.5px solid ${usedToday ? '#7AAA6A' : '#D8CCBF'}`,
          background: usedToday ? '#7AAA6A' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: usedToday ? 11 : 10, color: usedToday ? '#fff' : 'var(--text-muted)', fontWeight: 500,
          transition: 'all 0.2s',
        }}>{usedToday ? '✓' : (index ?? '')}</div>

        {/* 縮圖 */}
        {product.imagePreview ? (
          <img src={product.imagePreview} alt={displayName} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '0.5px solid var(--border-soft)', opacity: usedToday ? 0.6 : 1 }} />
        ) : (
          product.category && (() => {
            const c = CATEGORY_COLORS[product.category] || { bg: '#EEE8E0', text: '#888' }
            return <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: c.bg }} />
          })()
        )}

        {/* 名稱 + badges */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: usedToday ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: usedToday ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.2s', maxWidth: '55%' }}>
            {displayName}
          </span>
          {product.category && (() => {
            const c = CATEGORY_COLORS[product.category] || { bg: '#EEE', text: '#666' }
            return <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 6, background: c.bg, color: c.text, fontWeight: 500, whiteSpace: 'nowrap' }}>{product.category}</span>
          })()}
          {mismatch && (
            <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 6, background: '#FEF0D0', color: '#9A6010', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {product.timeOfDay === 'pm' ? '🌙晚' : '☀️早'}
            </span>
          )}
          {(product.caution || []).length > 0 && !usedToday && (
            <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 6, background: '#FEF0D0', color: '#9A6010', whiteSpace: 'nowrap' }}>⚠ {product.caution[0].slice(0, 6)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function SkincareCombinedSection({ amProducts, pmProducts, selectedDate, onToggle, noGroupMsg, groupName, onManageGroups }) {
  const hour = new Date().getHours()
  const [tab, setTab] = React.useState(hour >= 12 ? 'pm' : 'am')
  const amDone = amProducts.filter(p => isUsedOnDate(p.usageLog, selectedDate, 'am')).length
  const pmDone = pmProducts.filter(p => isUsedOnDate(p.usageLog, selectedDate, 'pm')).length
  const total = amProducts.length + pmProducts.length
  const totalDone = amDone + pmDone
  const allDone = total > 0 && totalDone === total

  const tabProducts = tab === 'am' ? amProducts : pmProducts
  const tabDone    = tab === 'am' ? amDone : pmDone

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 18, border: '0.5px solid var(--border-soft)', marginBottom: 18, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, padding: '2px 10px', borderRadius: 20, background: '#EFD7D7', color: '#9A6060' }}>保養</span>
          {groupName && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{groupName}</span>}
          {allDone && <span style={{ fontSize: 11, color: '#5A8A50', background: '#EEF4EC', borderRadius: 6, padding: '1px 6px' }}>全完成 ✓</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{totalDone}/{total}</span>
          {onManageGroups && <button onClick={onManageGroups} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', padding: 0 }}>管理</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 14px 0' }}>
        {[
          { key: 'am', label: '☀️ 早上', done: amDone, total: amProducts.length },
          { key: 'pm', label: '🌙 晚上', done: pmDone, total: pmProducts.length },
        ].map(({ key, label, done, total: t }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 20, border: '0.5px solid', fontSize: 12, cursor: 'pointer', fontWeight: tab === key ? 500 : 400,
            borderColor: tab === key ? '#C8A87A' : 'var(--border-soft)',
            background: tab === key ? '#F2E6D9' : 'var(--bg-surface)',
            color: tab === key ? '#8A6A40' : 'var(--text-muted)',
          }}>
            {label}
            {t > 0 && (
              <span style={{ fontSize: 10, color: done === t ? '#5A8A50' : tab === key ? '#8A6A40' : 'var(--text-muted)' }}>
                {done === t ? '✓' : `${done}/${t}`}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '8px 14px 12px' }}>
        {total === 0 ? (
          <div style={{ padding: '12px 0', textAlign: 'center', borderRadius: 12, border: '0.5px dashed var(--border-soft)', fontSize: 13, color: 'var(--text-muted)' }}>{noGroupMsg}</div>
        ) : tabProducts.length === 0 ? (
          <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>這個時段沒有保養品</div>
        ) : (
          tabProducts.map((p, idx) => (
            <CheckItem key={p.id} product={p} usedToday={isUsedOnDate(p.usageLog, selectedDate, tab)} onToggle={() => onToggle(p.id, tab)} section={tab} index={idx + 1} />
          ))
        )}
      </div>
    </div>
  )
}

// ── Completion card ───────────────────────────────────────────
function CompletionCard({ done, total, streak }) {
  const [dismissed, setDismissed] = React.useState(false)
  const msg = COMPLETION_MSGS[new Date().getDate() % COMPLETION_MSGS.length]

  if (dismissed) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FDF8F2, #F2EDE4)',
      border: '0.5px solid #E8D8C8',
      borderRadius: 20, padding: '20px 18px 16px',
      textAlign: 'center', marginBottom: 12,
      animation: 'fadeIn 0.4s ease',
    }}>
      <svg width="56" height="56" viewBox="0 0 56 56" style={{ marginBottom: 10 }}>
        <circle cx="28" cy="28" r="24" fill="none" stroke="#F2E6D9" strokeWidth="4" />
        <circle cx="28" cy="28" r="24" fill="none" stroke="#C8A87A" strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 24}`} strokeDashoffset="0"
          strokeLinecap="round" transform="rotate(-90 28 28)" />
        <text x="28" y="32" textAnchor="middle" fontSize="13" fill="#8A6A40" fontWeight="500">
          {done}/{total}
        </text>
      </svg>
      <div style={{ fontSize: 17, fontWeight: 500, color: '#8A6A40', marginBottom: 6 }}>{msg}</div>
      {streak > 1 && (
        <div style={{ fontSize: 12, color: '#B09070', marginBottom: 12 }}>連續 {streak} 天，繼續保持 ✦</div>
      )}
      <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#C4A880', padding: '4px 8px', textDecoration: 'underline' }}>
        繼續查看紀錄
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function HomePage({ store, onManageGroups }) {
  const { state, toggleProductUseDate, groupDays, upsertBodyLog, addWater, deleteWaterEntry, addExercise, deleteExercise, toggleSupplement, updateSupplementItems, updateExerciseTypes } = store
  const today = todayKey()
  const { products, routineGroups, settings, bodyLogs, waterLogs, exercises, supplementCheckins } = state

  const [selectedDate, setSelectedDate] = React.useState(today)
  const [selectedGroupId, setSelectedGroupId] = React.useState(null)

  const groups = routineGroups || []
  const todayDow = new Date().getDay()

  const autoGroupId = React.useMemo(() => {
    const match = groups.find(g => (groupDays[g.id] || []).includes(todayDow))
    if (match) return match.id
    const anyConfigured = groups.some(g => (groupDays[g.id] || []).length > 0)
    return anyConfigured ? null : (groups[0]?.id ?? null)
  }, [groups, groupDays, todayDow])

  const effectiveGroupId = selectedGroupId ?? autoGroupId
  const selectedGroup = groups.find(g => g.id === effectiveGroupId) || null

  function resolveItems(ids) { return (ids || []).map(id => products.find(p => p.id === id)).filter(Boolean) }
  const amProducts = selectedGroup ? resolveItems(selectedGroup.dayItems) : []
  const pmProducts = selectedGroup ? resolveItems(selectedGroup.nightItems) : []

  const amDone = amProducts.filter(p => isUsedOnDate(p.usageLog, selectedDate, 'am')).length
  const pmDone = pmProducts.filter(p => isUsedOnDate(p.usageLog, selectedDate, 'pm')).length

  const bodyLog = bodyLogs[selectedDate] || null
  const waterData = waterLogs[selectedDate]
  const waterToday = typeof waterData === 'number' ? waterData : (waterData?.total || 0)
  const waterEntries = (typeof waterData === 'object' && waterData !== null) ? (waterData.entries || []) : []
  const waterGoal = settings.waterGoalMl || 2000
  const supplementItems = settings.supplementItems || []
  const supplementNames = supplementItems.map(i => i.name)
  const supplementChecked = supplementCheckins[selectedDate] || []
  const todayExercises = exercises.filter(e => e.date === selectedDate)

  const handleToggle = React.useCallback((id, section) => {
    toggleProductUseDate(id, section, selectedDate)
  }, [toggleProductUseDate, selectedDate])

  const hour = new Date().getHours()
  const isEvening = hour >= 12
  const isPastDate = selectedDate < today

  // ── Progress calculation ──────────────────────────────────
  const progressItems = []
  progressItems.push({ id: 'body', done: bodyLog?.weight != null })
  if (groups.length > 0 && (amProducts.length > 0 || pmProducts.length > 0)) {
    const totalSkincare = amProducts.length + pmProducts.length
    const doneSkincare = amDone + pmDone
    progressItems.push({ id: 'skincare', done: totalSkincare > 0 && doneSkincare === totalSkincare })
  }
  progressItems.push({ id: 'water', done: waterToday >= waterGoal })
  if (supplementNames.length > 0) {
    progressItems.push({ id: 'supp', done: supplementChecked.length >= supplementNames.length })
  }

  const doneCount = progressItems.filter(i => i.done).length
  const totalCount = progressItems.length
  const allDone = totalCount > 0 && doneCount === totalCount && selectedDate === today

  // Streak for completion card
  const streak = (() => {
    let s = 0
    const d = new Date()
    for (let i = 0; i < 365; i++) {
      const key = localDateStr(d)
      const hasBody = bodyLogs[key]?.weight != null
      const hasWater = (waterLogs[key] || 0) >= waterGoal
      if (!hasBody && !hasWater) break
      s++
      d.setDate(d.getDate() - 1)
    }
    return s
  })()

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: 3 }}>{formatHeader()}</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>{getTimeGreeting(settings.userName)}</div>
        </div>
        <ProgressRing done={doneCount} total={totalCount} />
      </div>

      {/* Date strip */}
      <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

      {/* Backfill indicator */}
      {isPastDate && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9A6010', background: '#FDF6EC', borderRadius: 8, padding: '4px 10px', border: '0.5px solid #E8D4A8', marginBottom: 12 }}>
          <span>↩</span>
          <span>補打 {selectedDate.slice(5).replace('-', '/')} 的記錄</span>
          <button onClick={() => setSelectedDate(today)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9A7A5A', padding: '0 0 0 4px', textDecoration: 'underline' }}>回今天</button>
        </div>
      )}

      {/* Completion card */}
      {allDone && <CompletionCard done={doneCount} total={totalCount} streak={streak} />}

      {/* 1. 體態 */}
      <BodySection bodyLog={bodyLog} selectedDate={selectedDate} onSave={upsertBodyLog} />

      {/* 2. 飲水 */}
      <WaterSection totalMl={waterToday} goalMl={waterGoal} quickAmounts={settings.waterQuickAmounts} entries={waterEntries} onAdd={(ml) => addWater(ml, selectedDate)} onDeleteEntry={(id) => deleteWaterEntry(id, selectedDate)} />

      {/* 2. 保養（AM + PM 合一） */}
      {products.length > 0 ? (
        <SkincareCombinedSection
          amProducts={amProducts} pmProducts={pmProducts}
          selectedDate={selectedDate} onToggle={handleToggle}
          noGroupMsg={groups.length === 0 ? '請先建立保養組別' : '這個組別還沒有設定步驟'}
          groupName={selectedGroup?.name || null}
          onManageGroups={onManageGroups}
        />
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 18, border: '0.5px dashed var(--border-soft)', padding: '16px 18px', marginBottom: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>前往「我的」頁面新增保養品</div>
        </div>
      )}

      {/* 4. 營養品 */}
      <SupplementSection items={supplementItems} checked={supplementChecked} selectedDate={selectedDate} onToggle={toggleSupplement} onEditItems={updateSupplementItems} />

      {/* 5. 運動 */}
      <ExerciseSection exercises={exercises} selectedDate={selectedDate} exerciseTypes={settings.exerciseTypes || ['有氧', '重訓', '瑜珈／伸展']} onAdd={addExercise} onDelete={deleteExercise} onUpdateTypes={updateExerciseTypes} />


      {/* No groups nudge */}
      {products.length > 0 && groups.length === 0 && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 18, border: '0.5px solid var(--border-soft)', padding: '18px', marginBottom: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🌸</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>你有 {products.length} 個保養品了！</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 14 }}>建立一個保養組別，設定早晚順序</div>
          <button onClick={onManageGroups} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#D7DFD2', color: '#3A6A30', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>立即建立保養流程 →</button>
        </div>
      )}

      <div style={{ height: 8 }} />
    </div>
  )
}
