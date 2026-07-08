import React, { useState } from 'react'

// Mon-Sun display order (JS: 0=Sun 1=Mon … 6=Sat)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DAY_LABEL = { 0: '週日', 1: '週一', 2: '週二', 3: '週三', 4: '週四', 5: '週五', 6: '週六' }
const DAY_SHORT = { 0: '日', 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六' }

// ── ExercisePlanModal ─────────────────────────────────────────────────────────
export default function ExercisePlanModal({ exercisePlanItems, exerciseTypes, onSave, onClose }) {
  // dayPlans: map { [dayOfWeek]: [{ exerciseType, targetMinutes, frequency }] }
  const [dayPlans, setDayPlans] = useState(() => {
    const map = {}
    for (let d = 0; d <= 6; d++) map[d] = []
    ;(exercisePlanItems || []).forEach(item => {
      const d = item.dayOfWeek
      if (!map[d]) map[d] = []
      map[d].push({
        exerciseType: item.exerciseType,
        targetMinutes: item.targetMinutes || 30,
        frequency: item.frequency || 'weekly',
      })
    })
    return map
  })

  const [expandedDay, setExpandedDay] = useState(null)
  const [saving, setSaving] = useState(false)

  function toggleDayExpand(dow) {
    setExpandedDay(prev => prev === dow ? null : dow)
  }

  function toggleType(dow, type) {
    setDayPlans(prev => {
      const items = prev[dow] || []
      const exists = items.some(i => i.exerciseType === type)
      return {
        ...prev,
        [dow]: exists
          ? items.filter(i => i.exerciseType !== type)
          : [...items, { exerciseType: type, targetMinutes: 30, frequency: 'weekly' }]
      }
    })
  }

  function updateItem(dow, type, patch) {
    setDayPlans(prev => ({
      ...prev,
      [dow]: (prev[dow] || []).map(i => i.exerciseType === type ? { ...i, ...patch } : i)
    }))
  }

  async function handleSave() {
    setSaving(true)
    // Flatten dayPlans to a sorted allItems array
    const allItems = []
    let sortOrder = 0
    for (const dow of DAY_ORDER) {
      for (const item of (dayPlans[dow] || [])) {
        allItems.push({
          dayOfWeek: dow,
          exerciseType: item.exerciseType,
          targetMinutes: item.targetMinutes,
          frequency: item.frequency,
          sortOrder: sortOrder++,
        })
      }
    }
    await onSave(allItems)
    setSaving(false)
    onClose()
  }

  const totalDays = DAY_ORDER.filter(d => (dayPlans[d] || []).length > 0).length

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.38)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 430,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: '0.5px solid var(--border-soft)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>週運動計劃</div>
            {totalDays > 0 && (
              <div style={{ fontSize: 12, color: '#7AAA6A', marginTop: 2 }}>
                已設定 {totalDays} 天
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: 'var(--text-muted)', padding: '0 4px', lineHeight: 1,
          }}>×</button>
        </div>

        {/* Day rows */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {DAY_ORDER.map(dow => {
            const items = dayPlans[dow] || []
            const isExpanded = expandedDay === dow
            const hasItems = items.length > 0

            return (
              <div key={dow} style={{ borderBottom: '0.5px solid var(--border-soft)' }}>
                {/* Day row header */}
                <div
                  onClick={() => toggleDayExpand(dow)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 20px',
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--bg-surface)' : 'transparent',
                  }}
                >
                  {/* Day circle */}
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: hasItems ? '#EAF3DE' : 'var(--bg-surface)',
                    border: `1.5px solid ${hasItems ? '#7AAA6A' : 'var(--border-soft)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600,
                    color: hasItems ? '#5A7A52' : 'var(--text-muted)',
                  }}>{DAY_SHORT[dow]}</div>

                  {/* Day label + chips */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {DAY_LABEL[dow]}
                    </div>
                    {hasItems ? (
                      <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                        {items.map(item => (
                          <span key={item.exerciseType} style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 10,
                            background: item.frequency === 'biweekly' ? 'transparent' : '#EAF3DE',
                            border: item.frequency === 'biweekly' ? '1.5px dashed #C8A87A' : 'none',
                            color: item.frequency === 'biweekly' ? '#9A7A5A' : '#5A7A52',
                            fontWeight: 500,
                          }}>{item.exerciseType}</span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>休息日</div>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {isExpanded ? '▲' : '▼'}
                  </div>
                </div>

                {/* Inline day editor */}
                {isExpanded && (
                  <div style={{
                    padding: '4px 20px 16px',
                    background: 'var(--bg-surface)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                      {(exerciseTypes || []).map(type => {
                        const checked = items.some(i => i.exerciseType === type)
                        const item = items.find(i => i.exerciseType === type)

                        return (
                          <div key={type} style={{
                            background: 'var(--bg-card)',
                            borderRadius: 12,
                            padding: '10px 14px',
                            border: `1px solid ${checked ? '#D0E8C8' : 'var(--border-soft)'}`,
                            transition: 'border-color 0.2s',
                          }}>
                            {/* Type toggle row */}
                            <div
                              onClick={() => toggleType(dow, type)}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                            >
                              <div style={{
                                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                background: checked ? '#7AAA6A' : 'transparent',
                                border: `1.5px solid ${checked ? '#7AAA6A' : '#C4B0A0'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, color: 'white', transition: 'all 0.2s',
                              }}>
                                {checked ? '✓' : ''}
                              </div>
                              <span style={{
                                fontSize: 14, fontWeight: 500,
                                color: checked ? 'var(--text-primary)' : 'var(--text-muted)',
                              }}>{type}</span>
                            </div>

                            {/* Settings when checked */}
                            {checked && item && (
                              <div style={{
                                marginTop: 10, paddingTop: 10,
                                borderTop: '0.5px solid var(--border-soft)',
                                display: 'flex', flexDirection: 'column', gap: 8,
                              }}>
                                {/* Target minutes stepper */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{
                                    fontSize: 12, color: 'var(--text-muted)',
                                    width: 52, flexShrink: 0,
                                  }}>目標時間</span>
                                  <button
                                    onClick={() => updateItem(dow, type, { targetMinutes: Math.max(5, item.targetMinutes - 5) })}
                                    style={{
                                      width: 28, height: 28, borderRadius: 8,
                                      border: '1px solid var(--border-soft)',
                                      background: 'var(--bg-surface)',
                                      fontSize: 16, cursor: 'pointer',
                                      color: 'var(--text-secondary)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      flexShrink: 0,
                                    }}>−</button>
                                  <span style={{
                                    fontSize: 14, fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    minWidth: 56, textAlign: 'center',
                                  }}>{item.targetMinutes} 分鐘</span>
                                  <button
                                    onClick={() => updateItem(dow, type, { targetMinutes: item.targetMinutes + 5 })}
                                    style={{
                                      width: 28, height: 28, borderRadius: 8,
                                      border: '1px solid var(--border-soft)',
                                      background: 'var(--bg-surface)',
                                      fontSize: 16, cursor: 'pointer',
                                      color: 'var(--text-secondary)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      flexShrink: 0,
                                    }}>＋</button>
                                </div>

                                {/* Frequency toggle */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{
                                    fontSize: 12, color: 'var(--text-muted)',
                                    width: 52, flexShrink: 0,
                                  }}>頻率</span>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    {[
                                      { key: 'weekly', label: '每週' },
                                      { key: 'biweekly', label: '隔週才做' },
                                    ].map(opt => {
                                      const selected = item.frequency === opt.key
                                      const isBi = opt.key === 'biweekly'
                                      return (
                                        <button
                                          key={opt.key}
                                          onClick={() => updateItem(dow, type, { frequency: opt.key })}
                                          style={{
                                            padding: '4px 12px', borderRadius: 12, fontSize: 12,
                                            cursor: 'pointer', fontWeight: selected ? 600 : 400,
                                            border: selected
                                              ? `1.5px solid ${isBi ? '#C8A87A' : '#7AAA6A'}`
                                              : '1.5px solid var(--border-soft)',
                                            background: selected
                                              ? (isBi ? '#FDF5EC' : '#EAF3DE')
                                              : 'var(--bg-surface)',
                                            color: selected
                                              ? (isBi ? '#9A7A5A' : '#5A7A52')
                                              : 'var(--text-muted)',
                                            transition: 'all 0.15s',
                                          }}
                                        >{opt.label}</button>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Save button */}
        <div style={{
          padding: '12px 20px 28px',
          borderTop: '0.5px solid var(--border-soft)',
          flexShrink: 0,
          background: 'var(--bg-card)',
        }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? '儲存中…' : '儲存計劃'}
          </button>
        </div>
      </div>
    </div>
  )
}
