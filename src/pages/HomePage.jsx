import React from 'react'
import { todayKey, localDateStr, CATEGORY_COLORS, isUsedOnDate } from '../store/useStore.js'

const DOW = ['日', '一', '二', '三', '四', '五', '六']

const INTENSITY_OPTS = [
  { key: 'light',    label: '只是動動' },
  { key: 'moderate', label: '蠻認真的' },
  { key: 'intense',  label: '高強度' },
]

const COMPLETION_MSGS = [
  '今天把自己照顧得很好',
  '每一個小動作，都算數',
  '好好愛自己，是一種練習',
  '今天也完成了，辛苦了',
  '你值得被好好對待',
  '這份自律，皮膚都記得',
  '堅持的樣子，很美',
  '今天的你，做得很棒',
  '一天一點點，就是在變好',
  '把自己放在第一位，做得好',
]

function getTimeGreeting(userName, skincareStreak) {
  const h = new Date().getHours()
  const dow = new Date().getDay()
  const name = userName ? `${userName}🌷，` : ''
  const streakPart = skincareStreak >= 7 ? `連續 ${skincareStreak} 天，`
    : skincareStreak >= 3 ? `連續 ${skincareStreak} 天，` : ''
  if (h >= 5 && h < 12) {
    if (dow === 1) return `${name}${streakPart}週一早安，新的一週從這裡開始 ✿`
    if (dow === 5) return `${name}${streakPart}週五早安，撐過今天就可以放鬆 ✿`
    if (dow === 0) return `${name}${streakPart}週日早安，今天好好休息也好 ✿`
    return `${name}${streakPart}早安，從哪裡開始 ✿`
  }
  if (h >= 12 && h < 18) {
    if (dow === 5) return `${name}${streakPart}週五下午，快到了 ✿`
    return `${name}${streakPart}下午也記得照顧自己 ✿`
  }
  if (h >= 18 && h < 22) return `${name}${streakPart}保養時間到了 ✿`
  return `${name}${streakPart}終於到你的時間了 ✿`
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
function BodySection({ bodyLog, selectedDate, onSave, goalWeight, goalFat }) {
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

  const fields = [
    { label: '體重', unit: 'kg', val: weight, set: setWeight, goal: goalWeight, current: parseFloat(weight) },
    { label: '體脂率', unit: '%', val: bodyFat, set: setBodyFat, goal: goalFat, current: parseFloat(bodyFat) },
  ]

  return (
    <SectionCard tag="體態" tagBg="#F2E6D9" tagText="#8A6040"
      headerRight={saved ? <span style={{ fontSize: 11, color: '#8A6A40', background: '#F2E6D9', padding: '2px 8px', borderRadius: 8 }}>已記錄 ✓</span> : null}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {fields.map(({ label, unit, val, set, goal, current }) => {
          const reached = goal != null && !isNaN(current) && current <= goal
          const diff = goal != null && !isNaN(current) ? (current - goal) : null
          return (
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
              {goal != null && !isNaN(current) && (
                <div style={{ fontSize: 11, marginTop: 4, color: reached ? '#5A7A52' : 'var(--text-muted)' }}>
                  {reached
                    ? `✓ 達標（目標 ${goal}${unit}）`
                    : `距目標 +${diff.toFixed(1)}${unit}`}
                </div>
              )}
              {goal != null && isNaN(current) && (
                <div style={{ fontSize: 11, marginTop: 4, color: 'var(--border-soft)' }}>目標 {goal}{unit}</div>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ── Water Modal ───────────────────────────────────────────────
function WaterModal({ quickAmounts, onAdd, onUpdateQuickAmounts, onClose }) {
  const [editMode, setEditMode] = React.useState(false)
  const [chips, setChips] = React.useState([...(quickAmounts || [200, 350, 500])])
  const [customVal, setCustomVal] = React.useState('')
  const [newChipVal, setNewChipVal] = React.useState('')

  function handleQuickAdd(ml) {
    onAdd(ml)
    onClose()
  }

  function handleCustomAdd() {
    const ml = parseInt(customVal)
    if (ml > 0) { onAdd(ml); onClose() }
  }

  function updateChip(i, val) {
    setChips(c => c.map((x, j) => j === i ? val : x))
  }

  function removeChip(i) {
    setChips(c => c.filter((_, j) => j !== i))
  }

  function addChip() {
    const v = parseInt(newChipVal)
    if (v > 0 && chips.length < 6) {
      setChips(c => [...c, v])
      setNewChipVal('')
    }
  }

  function saveEditMode() {
    const valid = chips.map(v => parseInt(v)).filter(v => v > 0)
    const final = valid.length ? valid : [200, 350, 500]
    onUpdateQuickAmounts(final)
    setChips(final)
    setEditMode(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 18 }}>喝了多少？</div>

        {/* Quick chips */}
        {!editMode ? (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {chips.map((ml, i) => (
                <button key={i} onClick={() => handleQuickAdd(ml)} style={{
                  padding: '10px 18px', borderRadius: 20, border: '0.5px solid #B5D4F4',
                  background: '#E6F1FB', color: '#185FA5', fontSize: 14, cursor: 'pointer', fontWeight: 500,
                }}>+{ml} ml</button>
              ))}
            </div>
            <button onClick={() => setEditMode(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'var(--text-muted)', padding: '0 0 16px', textDecoration: 'underline',
            }}>編輯選項</button>
          </>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>編輯快速選項</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {chips.map((ml, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number" inputMode="numeric" value={ml}
                    onChange={e => updateChip(i, e.target.value)}
                    style={{ flex: 1, padding: '7px 12px', borderRadius: 10, border: '0.5px solid #B5D4F4', background: '#E6F1FB', color: '#185FA5', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>ml</span>
                  <button onClick={() => removeChip(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#C07070', padding: '0 4px', flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
            {chips.length < 6 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  type="number" inputMode="numeric" value={newChipVal}
                  onChange={e => setNewChipVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChip()}
                  placeholder="新增 ml…"
                  style={{ flex: 1, padding: '7px 12px', borderRadius: 10, border: '0.5px dashed #B5D4F4', background: 'transparent', color: '#185FA5', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={addChip} style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: '#B5D4F4', color: '#185FA5', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>＋</button>
              </div>
            )}
            <button onClick={saveEditMode} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#EEF4EC', color: '#5A7A52', fontSize: 14, cursor: 'pointer', fontWeight: 500, marginBottom: 8 }}>完成</button>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '0.5px', background: 'var(--border-soft)', margin: '2px 0 14px' }} />

        {/* Custom input */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>自訂</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number" inputMode="numeric" value={customVal}
            onChange={e => setCustomVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
            placeholder="輸入 ml…"
            style={{ flex: 1 }}
          />
          <button onClick={handleCustomAdd} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#85B7EB', color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>確認加水</button>
        </div>
      </div>
    </div>
  )
}

// ── Water section ─────────────────────────────────────────────
function WaterSection({ totalMl, goalMl, quickAmounts, entries, onAdd, onDeleteEntry, onUpdateQuickAmounts }) {
  const [showModal, setShowModal] = React.useState(false)
  const [showEntries, setShowEntries] = React.useState(false)
  const pct = Math.min(100, goalMl > 0 ? Math.round((totalMl / goalMl) * 100) : 0)
  const done = totalMl >= goalMl
  const remaining = goalMl - totalMl

  const WATER_DONE_MSGS = [
    '今天水喝夠了，身體謝謝你 🎉',
    '水分達標！皮膚今天很開心 ✦',
    '喝夠水了，繼續保持 ✦',
    '達標了！水是最好的保養品 💧',
    '今天的水完成了，做得很好 ✦',
  ]
  function motivationText() {
    if (totalMl === 0) return '今天還沒喝水，先來一杯暖暖的吧 💧'
    const pct = goalMl > 0 ? totalMl / goalMl : 0
    if (pct < 0.34) return `開始了，繼續補充水分 ✦`
    if (pct < 0.67) return `過半了！再努力一下 ✦`
    if (pct < 1) return `快到了，再 ${remaining} ml 就達標 ✦`
    return WATER_DONE_MSGS[new Date().getDate() % WATER_DONE_MSGS.length]
  }

  return (
    <>
      <SectionCard tag="飲水" tagBg="#E6F1FB" tagText="#185FA5"
        headerRight={<span style={{ fontSize: 12, color: done ? '#185FA5' : 'var(--text-muted)' }}>
          {totalMl} / {goalMl} ml {done ? '✓' : ''}
        </span>}>

        {/* Progress bar */}
        <div style={{ height: 16, background: '#EDE6DE', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: done ? '#85B7EB' : '#B5D4F4', borderRadius: 8, transition: 'width 0.4s ease' }} />
        </div>

        {/* Motivation text */}
        <div style={{ fontSize: 12, color: done ? '#185FA5' : 'var(--text-muted)', marginBottom: 12 }}>
          {motivationText()}
        </div>

        {/* ＋ 喝水 button */}
        <button onClick={() => setShowModal(true)} style={{
          width: '100%', padding: '11px', borderRadius: 12, border: 'none',
          background: '#E6F1FB', color: '#185FA5', fontSize: 15, fontWeight: 500,
          cursor: 'pointer', transition: 'opacity 0.15s',
        }}>＋ 喝水</button>

        {/* Entries list */}
        {entries.length > 0 && (
          <div style={{ marginTop: 12 }}>
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

      {showModal && (
        <WaterModal
          quickAmounts={quickAmounts}
          onAdd={onAdd}
          onUpdateQuickAmounts={onUpdateQuickAmounts}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
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
const DURATION_PRESETS = [10, 15, 20, 30]

function ExerciseModal({ typeName, onSave, onClose }) {
  const [duration, setDuration] = React.useState(15)
  const [customMode, setCustomMode] = React.useState(false)
  const [customVal, setCustomVal] = React.useState('')
  const [intensity, setIntensity] = React.useState('moderate')
  const [customName, setCustomName] = React.useState('')

  const isOther = typeName === '其他'

  function handleSave() {
    const d = customMode ? (parseInt(customVal) || 15) : duration
    onSave(d, intensity, isOther ? customName.trim() : '')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 18 }}>{typeName}</div>

        {/* 其他：自填運動名稱 */}
        {isOther && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>運動內容</div>
            <input
              type="text" value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="例：跳繩、爬山、騎車…"
              autoFocus
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* Duration chips */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>時長</div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
          {DURATION_PRESETS.map(d => (
            <button key={d} onClick={() => { setDuration(d); setCustomMode(false) }} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: '0.5px solid',
              borderColor: !customMode && duration === d ? '#A8C8A0' : 'var(--border-soft)',
              background: !customMode && duration === d ? '#EEF4EC' : 'var(--bg-surface)',
              color: !customMode && duration === d ? '#5A7A52' : 'var(--text-secondary)',
              fontWeight: !customMode && duration === d ? 500 : 400,
            }}>{d} 分</button>
          ))}
          {customMode ? (
            <input
              type="number" inputMode="numeric" value={customVal}
              onChange={e => setCustomVal(e.target.value)}
              autoFocus placeholder="分鐘"
              style={{
                width: 72, padding: '6px 10px', borderRadius: 20,
                border: '0.5px solid #A8C8A0', background: '#EEF4EC',
                color: '#5A7A52', fontSize: 13, outline: 'none',
                fontFamily: 'inherit', textAlign: 'center',
              }}
            />
          ) : (
            <button onClick={() => setCustomMode(true)} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: '0.5px dashed var(--border-soft)', background: 'transparent', color: 'var(--text-muted)',
            }}>自填</button>
          )}
        </div>

        {/* Intensity */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>強度</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 22 }}>
          {INTENSITY_OPTS.map(opt => (
            <button key={opt.key} onClick={() => setIntensity(opt.key)} style={{
              padding: '11px', borderRadius: 10, fontSize: 14, cursor: 'pointer',
              border: '0.5px solid', textAlign: 'center', fontWeight: intensity === opt.key ? 500 : 400,
              borderColor: intensity === opt.key ? '#A8C8A0' : 'var(--border-soft)',
              background: intensity === opt.key ? '#EEF4EC' : 'var(--bg-surface)',
              color: intensity === opt.key ? '#5A7A52' : 'var(--text-secondary)',
            }}>{opt.label}</button>
          ))}
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

function ExerciseSection({ exercises, selectedDate, exerciseTypes, onAdd, onDelete, onUpdateTypes }) {
  const [activeModal, setActiveModal] = React.useState(null) // typeName string
  const [showTypeModal, setShowTypeModal] = React.useState(false)
  const [expandedType, setExpandedType] = React.useState(null)

  const todayExercises = exercises.filter(e => e.date === selectedDate)
  const intensityLabel = k => INTENSITY_OPTS.find(o => o.key === k)?.label || k

  function subtitle(entries) {
    if (entries.length === 0) return null
    if (entries.length === 1) {
      const e = entries[0]
      const prefix = e.subType ? `${e.subType} · ` : ''
      return `${prefix}${e.durationMin} 分鐘 · ${intensityLabel(e.intensity)}`
    }
    const total = entries.reduce((sum, e) => sum + (e.durationMin || 0), 0)
    return `${entries.length} 筆 · 共 ${total} 分鐘`
  }

  return (
    <>
      <SectionCard tag="運動" tagBg="#D7DFD2" tagText="#5A7A52"
        headerRight={
          <button onClick={() => setShowTypeModal(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--text-muted)', padding: 0,
          }}>管理項目</button>
        }>

        {exerciseTypes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            點右上角「管理項目」加入運動類型
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {exerciseTypes.map(type => {
              const entries = todayExercises.filter(e => e.type === type)
              const hasDone = entries.length > 0
              const isExpanded = expandedType === type
              const sub = subtitle(entries)

              return (
                <div key={type}>
                  {/* Main row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px' }}>
                    {/* Circle */}
                    <button
                      onClick={() => hasDone && setExpandedType(isExpanded ? null : type)}
                      style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        border: `1.5px solid ${hasDone ? '#7AAA6A' : '#D8CCBF'}`,
                        background: hasDone ? '#7AAA6A' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 17, color: hasDone ? '#fff' : 'transparent',
                        cursor: hasDone ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                      }}>✓</button>

                    {/* Name + subtitle */}
                    <div
                      style={{ flex: 1, cursor: hasDone ? 'pointer' : 'default' }}
                      onClick={() => hasDone && setExpandedType(isExpanded ? null : type)}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{type}</div>
                      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
                    </div>

                    {/* ＋ button */}
                    <button
                      onClick={() => setActiveModal(type)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        border: '0.5px solid var(--border-soft)', background: 'var(--bg-surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, color: '#5A7A52', cursor: 'pointer', lineHeight: 1,
                        paddingBottom: 1,
                      }}>＋</button>
                  </div>

                  {/* Expanded entries */}
                  {isExpanded && entries.length > 0 && (
                    <div style={{ marginLeft: 48, marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {entries.map(ex => (
                        <div key={ex.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'var(--bg-surface)', borderRadius: 8, padding: '6px 10px',
                        }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {ex.subType ? `${ex.subType} · ` : ''}{ex.durationMin} 分鐘 · {intensityLabel(ex.intensity)}
                          </span>
                          <button onClick={() => onDelete(ex.id)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 17, color: '#C4B0A0', padding: '0 2px', lineHeight: 1,
                          }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {activeModal && (
        <ExerciseModal
          typeName={activeModal}
          onSave={(durationMin, intensity, subType) => {
            onAdd(selectedDate, activeModal, subType || '', durationMin, intensity)
            setActiveModal(null)
          }}
          onClose={() => setActiveModal(null)}
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

// ── Functional caution map ────────────────────────────────────
const CAUTION_BY_CATEGORY = {
  '維他命 C':    '白天使用請搭配防曬',
  '美白精華':    '白天請加強防曬',
  '美白':        '白天請加強防曬',
  'A 醛':        '建議晚上使用，初期每週 2～3 次慢慢建立耐受',
  'A 醇':        '建議晚上使用，初期每週 2～3 次慢慢建立耐受',
  'A 醛／A 醇':  '建議晚上使用，初期每週 2～3 次慢慢建立耐受',
  '酸類':        '建議晚上使用，避免與 A 醛同晚疊擦',
  '果酸':        '建議晚上使用，避免與 A 醛同晚疊擦',
  '水楊酸':      '建議晚上使用，避免與 A 醛同晚疊擦',
  '去角質':      '每週約 1～2 次即可，避免過度去角質',
  '面膜':        '敷完後仍需擦乳液或乳霜鎖水',
}

function getCautionText(product) {
  if (product.caution && product.caution.length > 0) return product.caution[0]
  if (product.category && CAUTION_BY_CATEGORY[product.category]) return CAUTION_BY_CATEGORY[product.category]
  return null
}

// ── Skincare check item (swipe gesture) ───────────────────────
function CheckItem({ product, usedToday, onToggle, section, index }) {
  const displayName = product.nickname || product.name || product.brand || '未命名'
  const subName = product.nickname ? [product.brand, product.name].filter(Boolean).join(' ') : ''
  const mismatch = section && product.timeOfDay &&
    ((section === 'am' && product.timeOfDay === 'pm') || (section === 'pm' && product.timeOfDay === 'am'))
  const cautionText = getCautionText(product)

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
          background: usedToday ? '#F6FAF5' : 'var(--bg-card)',
          borderRadius: 10,
          border: `0.5px solid ${mismatch ? '#E8C080' : usedToday ? '#D0DFCA' : 'var(--border-soft)'}`,
          transition: clampedX !== 0 ? 'none' : 'all 0.2s',
          cursor: 'pointer', touchAction: 'pan-y',
          transform: `translateX(${clampedX}px)`,
          position: 'relative', zIndex: 1, userSelect: 'none',
          overflow: 'hidden',
        }}
      >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 12px' }}>
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
        </div>
      </div>
      {cautionText && (
        <div style={{ paddingLeft: 62, paddingRight: 12, paddingBottom: 10, fontSize: 12, color: '#B07020', lineHeight: 1.4 }}>
          ⚠️ {cautionText}
        </div>
      )}
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
  const { state, toggleProductUseDate, groupDays, upsertBodyLog, addWater, deleteWaterEntry, addExercise, deleteExercise, toggleSupplement, updateSupplementItems, updateExerciseTypes, updateBodyGoals } = store
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
      const rawW = waterLogs[key]; const hasWater = (typeof rawW === 'number' ? rawW : (rawW?.total || 0)) >= waterGoal
      if (!hasBody && !hasWater) break
      s++
      d.setDate(d.getDate() - 1)
    }
    return s
  })()

  // Skincare streak for greeting
  const skincareStreak = React.useMemo(() => {
    let s = 0
    for (let i = 0; i < 60; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = localDateStr(d)
      if ((products || []).some(p => isUsedOnDate(p.usageLog, key, null))) s++; else break
    }
    return s
  }, [products])

  // Contextual summary line (today only)
  const skincareDoneToday = amProducts.length + pmProducts.length > 0 &&
    amDone + pmDone === amProducts.length + pmProducts.length
  const waterDoneToday = waterToday >= waterGoal
  const exercisedToday = todayExercises.length > 0
  const summaryMsg = selectedDate === today ? (() => {
    if (skincareDoneToday && waterDoneToday && exercisedToday) return '今天把自己照顧得很完整 🌟'
    if (skincareDoneToday && waterDoneToday) return '保養和飲水都完成了，今天很用心 ✦'
    if (skincareDoneToday && exercisedToday) return '保養完成、運動也做了，很棒 ✦'
    if (waterDoneToday && exercisedToday) return '水喝夠了，運動也做了，繼續保持 ✦'
    if (skincareDoneToday) return '保養完成了！記得繼續補水 💧'
    return null
  })() : null

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: 3 }}>{formatHeader()}</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>{getTimeGreeting(settings.userName, skincareStreak)}</div>
          {summaryMsg && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{summaryMsg}</div>
          )}
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
      <BodySection bodyLog={bodyLog} selectedDate={selectedDate} onSave={upsertBodyLog} goalWeight={settings.bodyGoalWeight} goalFat={settings.bodyGoalFat} />

      {/* 2. 飲水 */}
      <WaterSection totalMl={waterToday} goalMl={waterGoal} quickAmounts={settings.waterQuickAmounts} entries={waterEntries} onAdd={(ml) => addWater(ml, selectedDate)} onDeleteEntry={(id) => deleteWaterEntry(id, selectedDate)} onUpdateQuickAmounts={(amounts) => updateBodyGoals({ waterQuickAmounts: amounts })} />

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
