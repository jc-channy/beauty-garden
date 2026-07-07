import React, { useState, useEffect } from 'react'

const A = '#C8A87A'
const AD = '#9A7A5A'
const AL = '#FDF5EC'
const PINK = '#C08090'

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}

function NumStepper({ value, min = 1, max = 999, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '0.5px solid var(--border-soft)', background: 'var(--bg-surface)', fontSize: 18, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
      <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', minWidth: 28, textAlign: 'center' }}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: 32, height: 32, borderRadius: '50%', border: `0.5px solid ${A}`, background: AL, fontSize: 18, color: AD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
    </div>
  )
}

// ── Exercise form (add / edit one exercise) ──────────────────────
function ExerciseForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [sets, setSets] = useState(initial?.sets || 3)
  const [reps, setReps] = useState(initial?.reps || 10)
  const [rest, setRest] = useState(initial?.restSeconds || 60)
  const [bpm, setBpm] = useState(initial?.bpm || 60)

  const REST_PRESETS = [30, 45, 60, 90, 120]

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), sets, reps, restSeconds: rest, bpm })
  }

  return (
    <div style={{ padding: '4px 0' }}>
      <FieldRow label="動作名稱">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例：平板臥推"
          style={{ width: '100%', background: 'var(--bg-surface)', border: '0.5px solid var(--border-soft)', borderRadius: 10, padding: '9px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }}
          autoFocus
        />
      </FieldRow>

      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <FieldRow label="組數">
          <NumStepper value={sets} min={1} max={20} onChange={setSets} />
        </FieldRow>
        <FieldRow label="下數">
          <NumStepper value={reps} min={1} max={100} onChange={setReps} />
        </FieldRow>
      </div>

      <FieldRow label="休息秒數">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {REST_PRESETS.map(s => (
            <button key={s} onClick={() => setRest(s)} style={{
              padding: '5px 12px', borderRadius: 12, fontSize: 12, cursor: 'pointer', border: '0.5px solid',
              background: rest === s ? AL : 'var(--bg-surface)',
              borderColor: rest === s ? A : 'var(--border-soft)',
              color: rest === s ? AD : 'var(--text-muted)',
              fontWeight: rest === s ? 600 : 400,
            }}>{s}s</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range" min={10} max={300} step={5} value={rest}
            onChange={e => setRest(Number(e.target.value))}
            style={{ flex: 1, accentColor: A }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 40 }}>{rest}秒</span>
        </div>
      </FieldRow>

      <FieldRow label={`節奏 BPM — ${bpm}`}>
        <input
          type="range" min={30} max={120} step={5} value={bpm}
          onChange={e => setBpm(Number(e.target.value))}
          style={{ width: '100%', accentColor: A }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          <span>慢 30</span><span>快 120</span>
        </div>
      </FieldRow>

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '11px 0', borderRadius: 12, border: '0.5px solid var(--border-soft)',
          background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer',
        }}>取消</button>
        <button onClick={handleSave} style={{
          flex: 2, padding: '11px 0', borderRadius: 12, border: 'none',
          background: name.trim() ? A : '#EDE6DE', fontSize: 14, fontWeight: 500,
          color: name.trim() ? '#fff' : 'var(--text-muted)', cursor: name.trim() ? 'pointer' : 'default',
        }}>儲存動作</button>
      </div>
    </div>
  )
}

// ── Main WorkoutPlanEditor ────────────────────────────────────────
export default function WorkoutPlanEditor({
  plan,             // { id, name, exercises: [...] } or null for new
  onSave,           // (planName) => void — called after name confirmed
  onAddExercise,    // (ex) => void
  onUpdateExercise, // (exId, patch) => void
  onDeleteExercise, // (exId) => void
  onClose,
}) {
  const [planName, setPlanName] = useState(plan?.name || '')
  const [addingEx, setAddingEx] = useState(false)
  const [editingExId, setEditingExId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const exercises = plan?.exercises || []

  function handleSavePlan() {
    if (!planName.trim()) return
    onSave(planName.trim())
  }

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ maxHeight: '85vh' }}>
        <div className="modal-handle" />

        {/* Plan name */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>計劃名稱</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              placeholder="例：練胸、練腿、全身"
              style={{ flex: 1, background: 'var(--bg-surface)', border: '0.5px solid var(--border-soft)', borderRadius: 10, padding: '9px 12px', fontSize: 15, color: 'var(--text-primary)', outline: 'none' }}
            />
            <button onClick={handleSavePlan} style={{
              padding: '9px 16px', borderRadius: 10, border: 'none',
              background: planName.trim() ? A : '#EDE6DE',
              color: planName.trim() ? '#fff' : 'var(--text-muted)',
              fontSize: 14, fontWeight: 500, cursor: planName.trim() ? 'pointer' : 'default',
            }}>儲存</button>
          </div>
        </div>

        {/* Exercise list — only show after plan exists */}
        {plan?.id && (
          <>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>動作清單</div>

            {exercises.length === 0 && !addingEx && (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                還沒有動作，點下方新增
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {exercises.map((ex, idx) => (
                <div key={ex.id}>
                  {editingExId === ex.id ? (
                    <div style={{ background: AL, borderRadius: 12, padding: '12px', border: `0.5px solid ${A}` }}>
                      <ExerciseForm
                        initial={ex}
                        onSave={patch => { onUpdateExercise(ex.id, patch); setEditingExId(null) }}
                        onCancel={() => setEditingExId(null)}
                      />
                    </div>
                  ) : confirmDeleteId === ex.id ? (
                    <div style={{ background: '#FDF0F0', borderRadius: 12, padding: '12px 14px', border: '0.5px solid #EFD7D7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>確定刪除「{ex.name}」？</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ padding: '5px 12px', borderRadius: 8, border: '0.5px solid var(--border-soft)', background: 'var(--bg-surface)', fontSize: 12, cursor: 'pointer' }}>取消</button>
                        <button onClick={() => { onDeleteExercise(ex.id); setConfirmDeleteId(null) }} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#E07070', color: '#fff', fontSize: 12, cursor: 'pointer' }}>刪除</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-surface)', borderRadius: 12, padding: '10px 12px', border: '0.5px solid var(--border-soft)' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: idx === 0 ? A : '#EDE6DE', color: idx === 0 ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{idx + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{ex.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {ex.sets}組×{ex.reps}下 · 休息{ex.restSeconds}s · {ex.bpm} BPM
                        </div>
                      </div>
                      <button onClick={() => setEditingExId(ex.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--text-muted)', padding: '2px 4px' }}>✎</button>
                      <button onClick={() => setConfirmDeleteId(ex.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#C4B0A0', padding: '2px 4px', lineHeight: 1 }}>×</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {addingEx ? (
              <div style={{ background: AL, borderRadius: 12, padding: '12px', border: `0.5px solid ${A}`, marginBottom: 10 }}>
                <ExerciseForm
                  onSave={ex => { onAddExercise(ex); setAddingEx(false) }}
                  onCancel={() => setAddingEx(false)}
                />
              </div>
            ) : (
              <button onClick={() => { setAddingEx(true); setEditingExId(null) }} style={{
                width: '100%', padding: '11px', borderRadius: 12,
                border: `1px dashed ${A}`, background: 'transparent',
                fontSize: 14, color: AD, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span> 新增動作
              </button>
            )}
          </>
        )}

        <button onClick={onClose} style={{
          width: '100%', padding: '12px', marginTop: 12, borderRadius: 12,
          border: '0.5px solid var(--border-soft)', background: 'var(--bg-surface)',
          fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer',
        }}>完成</button>
      </div>
    </div>
  )
}
