import React, { useState } from 'react'

const ROUTINE_TYPES = [
  { key: 'morningRoutine', label: '早上保養', emoji: '🌤' },
  { key: 'eveningRoutine', label: '晚上保養', emoji: '🌙' },
  { key: 'makeupRoutine',  label: '上妝順序', emoji: '✨' },
]

const DOT_COLORS = ['#E7DDD1', '#EFD7D7', '#D8D3DF', '#D7DFD2', '#F2E6D9', '#E7DDD1', '#EFD7D7']

function StepRow({ step, index, total, onMoveUp, onMoveDown, onDelete, onEditProduct, products }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(step.productName)

  function saveProduct() {
    onEditProduct(step.id, val)
    setEditing(false)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 0',
      borderBottom: index < total - 1 ? '0.5px solid var(--border-soft)' : 'none',
    }}>
      {/* Step number */}
      <span style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: DOT_COLORS[index % DOT_COLORS.length],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        flexShrink: 0,
      }}>
        {index + 1}
      </span>

      {/* Step info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{step.name}</div>
        {editing ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input
              type="text"
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveProduct() }}
              placeholder="輸入產品名稱…"
              autoFocus
              style={{ fontSize: 12, padding: '4px 8px', flex: 1 }}
            />
            <button onClick={saveProduct} style={{
              background: 'var(--color-sage)', border: 'none', borderRadius: 6,
              padding: '4px 10px', fontSize: 12, color: 'var(--text-on-sage)', cursor: 'pointer',
            }}>確認</button>
          </div>
        ) : (
          <div
            onClick={() => { setVal(step.productName); setEditing(true) }}
            style={{
              fontSize: 12, color: step.productName ? 'var(--text-muted)' : 'var(--text-muted)',
              marginTop: 2, cursor: 'pointer',
              borderBottom: '1px dashed var(--border-soft)',
              display: 'inline-block',
              minWidth: 60,
            }}
          >
            {step.productName || '點擊綁定產品…'}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          style={{
            width: 28, height: 28, borderRadius: 8, border: '0.5px solid var(--border-soft)',
            background: 'none', cursor: index === 0 ? 'default' : 'pointer',
            color: index === 0 ? '#DDD' : 'var(--text-muted)', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >↑</button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          style={{
            width: 28, height: 28, borderRadius: 8, border: '0.5px solid var(--border-soft)',
            background: 'none', cursor: index === total - 1 ? 'default' : 'pointer',
            color: index === total - 1 ? '#DDD' : 'var(--text-muted)', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >↓</button>
        <button
          onClick={() => onDelete(step.id)}
          style={{
            width: 28, height: 28, borderRadius: 8, border: '0.5px solid var(--border-soft)',
            background: 'none', cursor: 'pointer', color: '#C8A0A0', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >×</button>
      </div>
    </div>
  )
}

function AddStepModal({ onClose, onAdd }) {
  const [name, setName] = useState('')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3 style={{ fontSize: 17, fontWeight: 500, marginBottom: 16 }}>新增步驟</h3>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>步驟名稱</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onAdd(name.trim()); onClose() } }}
          placeholder="例如：精華液、防曬、眼影…"
          autoFocus
          style={{ marginBottom: 20 }}
        />
        <button
          className="btn-primary"
          disabled={!name.trim()}
          onClick={() => { if (name.trim()) { onAdd(name.trim()); onClose() } }}
        >
          新增步驟
        </button>
      </div>
    </div>
  )
}

export default function RoutinePage({ store, onBack }) {
  const { state, addRoutineStep, deleteRoutineStep, moveRoutineStep, updateStepProduct } = store
  const [activeTab, setActiveTab] = useState('morningRoutine')
  const [showAdd, setShowAdd] = useState(false)

  const currentRoutine = state[activeTab]
  const current = ROUTINE_TYPES.find(r => r.key === activeTab)

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 24 }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 14, color: 'var(--text-secondary)', padding: '0 0 16px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ← 返回
        </button>
      )}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)' }}>
          保養順序設定
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          調整步驟順序、綁定對應產品
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {ROUTINE_TYPES.map(rt => (
          <button
            key={rt.key}
            onClick={() => setActiveTab(rt.key)}
            style={{
              flex: 1,
              padding: '9px 4px',
              borderRadius: 'var(--radius-md)',
              border: '0.5px solid',
              borderColor: activeTab === rt.key ? '#C8A87A' : 'var(--border-soft)',
              background: activeTab === rt.key ? '#F2E6D9' : 'var(--bg-card)',
              color: activeTab === rt.key ? '#8A6A40' : 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: activeTab === rt.key ? 500 : 400,
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            <div style={{ marginBottom: 2 }}>{rt.emoji}</div>
            {rt.label}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="card">
        {currentRoutine.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 13 }}>尚未設定步驟</div>
          </div>
        ) : (
          currentRoutine.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              index={i}
              total={currentRoutine.length}
              onMoveUp={() => moveRoutineStep(activeTab, i, -1)}
              onMoveDown={() => moveRoutineStep(activeTab, i, 1)}
              onDelete={(id) => deleteRoutineStep(activeTab, id)}
              onEditProduct={(id, name) => updateStepProduct(activeTab, id, name)}
              products={state.products}
            />
          ))
        )}
      </div>

      {/* Add step button */}
      <button
        className="btn-ghost"
        onClick={() => setShowAdd(true)}
        style={{ width: '100%', marginTop: 4, padding: '12px', fontSize: 14 }}
      >
        ＋ 新增步驟
      </button>

      <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          ✦ 點擊步驟名稱下方的虛線可綁定對應產品<br />
          ✦ 使用 ↑↓ 調整步驟順序<br />
          ✦ 修改會即時反映在首頁的保養順序
        </div>
      </div>

      {showAdd && (
        <AddStepModal
          onClose={() => setShowAdd(false)}
          onAdd={(name) => addRoutineStep(activeTab, name)}
        />
      )}
    </div>
  )
}
