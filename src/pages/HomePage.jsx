import React from 'react'
import { todayKey, localDateStr, CATEGORY_COLORS, isUsedOnDate } from '../store/useStore.js'

const DOW = ['日', '一', '二', '三', '四', '五', '六']

const EXERCISE_TYPES = ['瑜伽伸展', '重訓', '有氧', '核心', '跑步', '其他']
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
    <div style={{ background: 'var(--bg-card)', borderRadius: 18, border: '0.5px solid var(--border-soft)', marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 8px' }}>
        <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 10px', borderRadius: 20, background: tagBg, color: tagText }}>{tag}</span>
        {headerRight}
      </div>
      <div style={{ padding: '0 14px 12px' }}>{children}</div>
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
function WaterSection({ totalMl, goalMl, quickAmounts, onAdd, onReset }) {
  const [customMode, setCustomMode] = React.useState(false)
  const [customVal, setCustomVal] = React.useState('')
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
      <div style={{ height: 6, background: '#EDE6DE', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: done ? '#85B7EB' : '#B5D4F4', borderRadius: 3, transition: 'width 0.3s ease' }} />
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
        {totalMl > 0 && (
          <button onClick={() => onAdd(-Math.min(200, totalMl))} style={{
            padding: '6px 10px', borderRadius: 10,
            border: '0.5px solid var(--border-soft)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
          }}>−200</button>
        )}
        {totalMl > 0 && onReset && (
          <button onClick={onReset} style={{
            padding: '6px 10px', borderRadius: 10,
            border: '0.5px solid #F4C3C3', background: 'transparent',
            color: '#C0706A', fontSize: 12, cursor: 'pointer',
          }}>重置</button>
        )}
      </div>
    </SectionCard>
  )
}

// ── Supplement section ────────────────────────────────────────
const SUPP_TIMINGS = ['早上空腹', '早餐後', '午餐後', '晚餐後', '睡前']

function SupplementItemEditor({ item, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 12px 10px', marginBottom: 8 }}>
      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <input
          type="text" value={item.name}
          onChange={e => onChange({ ...item, name: e.target.value })}
          placeholder="品名…"
          style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '0.5px solid var(--border-soft)', background: 'var(--bg-card)', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)' }}
        />
        <button onClick={() => !isFirst && onMoveUp()} disabled={isFirst} style={{ background: 'none', border: 'none', cursor: isFirst ? 'default' : 'pointer', fontSize: 14, color: isFirst ? 'var(--border-soft)' : 'var(--text-muted)', padding: '2px 4px', lineHeight: 1 }}>↑</button>
        <button onClick={() => !isLast && onMoveDown()} disabled={isLast} style={{ background: 'none', border: 'none', cursor: isLast ? 'default' : 'pointer', fontSize: 14, color: isLast ? 'var(--border-soft)' : 'var(--text-muted)', padding: '2px 4px', lineHeight: 1 }}>↓</button>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#C0706A', padding: '2px 4px', lineHeight: 1 }}>×</button>
      </div>
      {/* Amount */}
      <input
        type="text" value={item.amount}
        onChange={e => onChange({ ...item, amount: e.target.value })}
        placeholder="份量備忘（選填，例：2顆）"
        style={{ width: '100%', padding: '5px 10px', borderRadius: 8, border: '0.5px solid var(--border-soft)', background: 'var(--bg-card)', fontSize: 12, outline: 'none', fontFamily: 'inherit', color: 'var(--text-secondary)', marginBottom: 8, boxSizing: 'border-box' }}
      />
      {/* Timings */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {SUPP_TIMINGS.map(t => {
          const active = (item.timings || []).includes(t)
          return (
            <button key={t} onClick={() => {
              const timings = active ? (item.timings || []).filter(x => x !== t) : [...(item.timings || []), t]
              onChange({ ...item, timings })
            }} style={{
              padding: '4px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
              border: `0.5px solid ${active ? '#AFA9EC' : 'var(--border-soft)'}`,
              background: active ? '#EEEDFE' : 'transparent',
              color: active ? '#534AB7' : 'var(--text-muted)',
              fontWeight: active ? 500 : 400,
            }}>{t}</button>
          )
        })}
      </div>
    </div>
  )
}

function SupplementEditModal({ items, onSave, onClose }) {
  const [list, setList] = React.useState(items.map(i => ({ ...i })))
  const [newName, setNewName] = React.useState('')

  function addItem() {
    const n = newName.trim()
    if (n) { setList(l => [...l, { name: n, amount: '', timings: [] }]); setNewName('') }
  }

  function updateItem(i, val) { setList(l => l.map((x, j) => j === i ? val : x)) }
  function deleteItem(i) { setList(l => l.filter((_, j) => j !== i)) }
  function moveUp(i) { if (i === 0) return; setList(l => { const a = [...l]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a }) }
  function moveDown(i) { setList(l => { if (i >= l.length - 1) return l; const a = [...l]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a }) }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 14 }}>管理營養品</div>
        {list.map((item, i) => (
          <SupplementItemEditor key={i}
            item={item}
            onChange={val => updateItem(i, val)}
            onDelete={() => deleteItem(i)}
            onMoveUp={() => moveUp(i)}
            onMoveDown={() => moveDown(i)}
            isFirst={i === 0}
            isLast={i === list.length - 1}
          />
        ))}
        <div style={{ display: 'flex', gap: 8, margin: '12px 0 18px' }}>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="新增品項…"
            style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '0.5px solid var(--border-soft)', background: 'var(--bg-surface)', fontSize: 14, outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)' }}
          />
          <button onClick={addItem} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#EEEDFE', color: '#534AB7', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>新增</button>
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
              const timingLabel = (item.timings || []).join('・')
              return (
                <button key={item.name} onClick={() => onToggle(item.name, selectedDate)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                  padding: '7px 14px', borderRadius: 16,
                  background: done ? '#EEEDFE' : 'var(--bg-surface)',
                  border: `0.5px solid ${done ? '#AFA9EC' : 'var(--border-soft)'}`,
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                }}>
                  {timingLabel ? (
                    <span style={{ fontSize: 10, color: done ? '#7A72C8' : 'var(--text-muted)', lineHeight: 1.2 }}>{timingLabel}</span>
                  ) : null}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {done && <span style={{ width: 13, height: 13, borderRadius: '50%', background: '#AFA9EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', flexShrink: 0 }}>✓</span>}
                    <span style={{ fontSize: 13, color: done ? '#534AB7' : 'var(--text-secondary)', fontWeight: done ? 500 : 400 }}>{item.name}</span>
                    {item.amount ? <span style={{ fontSize: 11, color: done ? '#9A93D8' : 'var(--text-muted)' }}>· {item.amount}</span> : null}
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
function ExerciseModal({ onSave, onClose }) {
  const [type, setType] = React.useState('瑜伽伸展')
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
          {EXERCISE_TYPES.map(t => (
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

function ExerciseSection({ exercises, selectedDate, onAdd, onDelete }) {
  const [showModal, setShowModal] = React.useState(false)
  const [deleteConfirm, setDeleteConfirm] = React.useState(null)
  const todayExercises = exercises.filter(e => e.date === selectedDate)

  const intensityLabel = k => INTENSITY_OPTS.find(o => o.key === k)?.label || k

  return (
    <>
      <SectionCard tag="運動" tagBg="#D7DFD2" tagText="#5A7A52"
        headerRight={
          <button onClick={() => setShowModal(true)} style={{
            background: '#EEF4EC', border: '0.5px solid #C0D8B8', borderRadius: 8,
            color: '#5A7A52', fontSize: 12, padding: '4px 10px', cursor: 'pointer',
          }}>＋ 新增</button>
        }>
        {todayExercises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            今天還沒有運動紀錄
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {todayExercises.map(ex => (
              <div key={ex.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg-surface)', borderRadius: 10, padding: '8px 12px',
              }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{ex.type}</span>
                  {ex.subType && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>{ex.subType}</span>}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {ex.durationMin} 分鐘 · {intensityLabel(ex.intensity)}
                  </div>
                </div>
                {deleteConfirm === ex.id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { onDelete(ex.id); setDeleteConfirm(null) }} style={{ fontSize: 11, color: '#C07070', background: 'none', border: 'none', cursor: 'pointer' }}>確認刪除</button>
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
          onSave={(type, subType, durationMin, intensity) => {
            onAdd(selectedDate, type, subType, durationMin, intensity)
            setShowModal(false)
          }}
          onClose={() => setShowModal(false)}
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
    if (dx > 44) { if (!usedToday) onToggle() }
    else if (dx < -44) { if (usedToday) onToggle() }
  }
  function handleClick() { if (touchRef.current?.handled) touchRef.current = null }

  const clampedX = Math.max(-60, Math.min(60, swipeX))
  const swipingRight = clampedX > 10
  const swipingLeft  = clampedX < -10

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 10, marginBottom: 3 }}>
      {swipingRight && (
        <div style={{ position: 'absolute', inset: 0, background: '#EEF4EC', borderRadius: 10, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
          <span style={{ fontSize: 14, color: '#5A7A52' }}>✓</span>
        </div>
      )}
      {swipingLeft && (
        <div style={{ position: 'absolute', inset: 0, background: '#FFF0F0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12 }}>
          <span style={{ fontSize: 13, color: '#C07070' }}>✕</span>
        </div>
      )}
      <div
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd} onClick={handleClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
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
          <span style={{ fontSize: 13, fontWeight: 500, color: usedToday ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: usedToday ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.2s', maxWidth: '55%' }}>
            {displayName}
          </span>
          {product.category && (() => {
            const c = CATEGORY_COLORS[product.category] || { bg: '#EEE', text: '#666' }
            return <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: c.bg, color: c.text, fontWeight: 500, whiteSpace: 'nowrap' }}>{product.category}</span>
          })()}
          {mismatch && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#FEF0D0', color: '#9A6010', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {product.timeOfDay === 'pm' ? '🌙晚' : '☀️早'}
            </span>
          )}
          {(product.caution || []).length > 0 && !usedToday && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#FEF0D0', color: '#9A6010', whiteSpace: 'nowrap' }}>⚠ {product.caution[0].slice(0, 6)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function SkincareCombinedSection({ amProducts, pmProducts, selectedDate, onToggle, noGroupMsg }) {
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
    <div style={{ background: 'var(--bg-card)', borderRadius: 18, border: '0.5px solid var(--border-soft)', marginBottom: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 10px', borderRadius: 20, background: '#EFD7D7', color: '#9A6060' }}>保養</span>
          {allDone && <span style={{ fontSize: 11, color: '#5A8A50', background: '#EEF4EC', borderRadius: 6, padding: '1px 6px' }}>全完成 ✓</span>}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{totalDone}/{total}</span>
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
  const { state, toggleProductUseDate, groupDays, upsertBodyLog, addWater, resetWater, addExercise, deleteExercise, toggleSupplement, updateSupplementItems } = store
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
  const waterToday = waterLogs[selectedDate] || 0
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

      {/* Group switcher (compact) */}
      {groups.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none', marginBottom: 8 }}>
          {groups.map(g => {
            const sel = g.id === effectiveGroupId
            const isAuto = g.id === autoGroupId
            return (
              <button key={g.id} onClick={() => setSelectedGroupId(g.id)} style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 16, border: '0.5px solid',
                borderColor: sel ? '#A8C8A0' : 'var(--border-soft)',
                background: sel ? '#EEF4EC' : 'var(--bg-card)',
                color: sel ? '#5A7A52' : 'var(--text-muted)',
                fontSize: 12, cursor: 'pointer', fontWeight: sel ? 500 : 400,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {isAuto && !isPastDate && <span style={{ fontSize: 9, background: '#C8A87A', color: '#fff', borderRadius: 3, padding: '1px 4px' }}>今</span>}
                {g.name}
              </button>
            )
          })}
          <button onClick={onManageGroups} style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 16, background: 'var(--bg-surface)', border: '0.5px solid var(--border-soft)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>管理</button>
        </div>
      )}

      {/* 2. 保養（AM + PM 合一） */}
      {products.length > 0 ? (
        <SkincareCombinedSection
          amProducts={amProducts} pmProducts={pmProducts}
          selectedDate={selectedDate} onToggle={handleToggle}
          noGroupMsg={groups.length === 0 ? '請先建立保養組別' : '這個組別還沒有設定步驟'}
        />
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 18, border: '0.5px dashed var(--border-soft)', padding: '16px 18px', marginBottom: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>前往「我的」頁面新增保養品</div>
        </div>
      )}

      {/* 3. 飲水 */}
      <WaterSection totalMl={waterToday} goalMl={waterGoal} quickAmounts={settings.waterQuickAmounts} onAdd={(ml) => addWater(ml, selectedDate)} onReset={() => resetWater(selectedDate)} />

      {/* 4. 營養品 */}
      <SupplementSection items={supplementItems} checked={supplementChecked} selectedDate={selectedDate} onToggle={toggleSupplement} onEditItems={updateSupplementItems} />

      {/* 5. 運動 */}
      <ExerciseSection exercises={exercises} selectedDate={selectedDate} onAdd={addExercise} onDelete={deleteExercise} />


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
