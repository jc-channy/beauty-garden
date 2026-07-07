import React, { useState, useEffect } from 'react'
import WorkoutPlanEditor from './WorkoutPlanEditor'
import WorkoutPlayerModal from './WorkoutPlayerModal'

const A = '#C8A87A'
const AD = '#9A7A5A'
const AL = '#FDF5EC'

export default function WorkoutSection({
  workoutPlans,
  loadWorkoutPlans,
  addWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  addWorkoutExercise,
  updateWorkoutExercise,
  deleteWorkoutExercise,
  selectedDate,
  onLogExercise,  // (date, type, subType, durationMin, intensity) — records to exercise_logs
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [editingPlan,    setEditingPlan]    = useState(null)   // plan obj or 'new'
  const [playing,        setPlaying]        = useState(false)
  const [confirmDelId,   setConfirmDelId]   = useState(null)

  useEffect(() => { loadWorkoutPlans() }, [])

  // Auto-select first plan
  useEffect(() => {
    if (!selectedPlanId && workoutPlans.length > 0) setSelectedPlanId(workoutPlans[0].id)
  }, [workoutPlans])

  const selPlan = workoutPlans.find(p => p.id === selectedPlanId) || null

  async function handleNewPlan() {
    setEditingPlan({ id: null, name: '', exercises: [] })
  }

  async function handleSavePlanName(name) {
    if (editingPlan?.id) {
      await updateWorkoutPlan(editingPlan.id, name)
      setEditingPlan(prev => ({ ...prev, name }))
    } else {
      const newId = await addWorkoutPlan(name)
      if (newId) {
        await loadWorkoutPlans()
        setSelectedPlanId(newId)
        setEditingPlan({ id: newId, name, exercises: [] })
      }
    }
  }

  function handleEditPlan(plan) {
    setEditingPlan(plan)
  }

  async function handleAddExercise(ex) {
    if (!editingPlan?.id) return
    await addWorkoutExercise(editingPlan.id, { ...ex, sortOrder: (editingPlan.exercises?.length || 0) })
    await loadWorkoutPlans()
    // refresh editing plan from updated list
    setEditingPlan(prev => prev)
  }

  async function handleUpdateExercise(exId, patch) {
    if (!editingPlan?.id) return
    await updateWorkoutExercise(editingPlan.id, exId, patch)
    await loadWorkoutPlans()
  }

  async function handleDeleteExercise(exId) {
    if (!editingPlan?.id) return
    await deleteWorkoutExercise(editingPlan.id, exId)
    await loadWorkoutPlans()
  }

  async function handleDeletePlan(id) {
    await deleteWorkoutPlan(id)
    setConfirmDelId(null)
    if (selectedPlanId === id) setSelectedPlanId(workoutPlans.find(p => p.id !== id)?.id || null)
  }

  function handleCloseEditor() {
    loadWorkoutPlans()
    setEditingPlan(null)
  }

  // Get latest plan from store (editor keeps stale copy)
  const editorPlan = editingPlan?.id
    ? (workoutPlans.find(p => p.id === editingPlan.id) || editingPlan)
    : editingPlan

  return (
    <>
      {/* Plan tabs */}
      {workoutPlans.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {workoutPlans.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlanId(p.id)}
              style={{
                padding: '5px 14px', borderRadius: 14, fontSize: 13, cursor: 'pointer',
                border: '0.5px solid',
                background: selectedPlanId === p.id ? AL : 'var(--bg-surface)',
                borderColor: selectedPlanId === p.id ? A : 'var(--border-soft)',
                color: selectedPlanId === p.id ? AD : 'var(--text-muted)',
                fontWeight: selectedPlanId === p.id ? 600 : 400,
              }}
            >{p.name}</button>
          ))}
        </div>
      )}

      {/* Selected plan detail */}
      {selPlan ? (
        <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{selPlan.name}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => handleEditPlan(selPlan)} style={{ background: 'none', border: '0.5px solid var(--border-soft)', borderRadius: 8, padding: '3px 10px', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>編輯</button>
              {confirmDelId === selPlan.id ? (
                <>
                  <button onClick={() => setConfirmDelId(null)} style={{ background: 'none', border: '0.5px solid var(--border-soft)', borderRadius: 8, padding: '3px 10px', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>取消</button>
                  <button onClick={() => handleDeletePlan(selPlan.id)} style={{ background: 'none', border: '0.5px solid #E07070', borderRadius: 8, padding: '3px 10px', fontSize: 11, color: '#E07070', cursor: 'pointer' }}>確認刪除</button>
                </>
              ) : (
                <button onClick={() => setConfirmDelId(selPlan.id)} style={{ background: 'none', border: '0.5px solid var(--border-soft)', borderRadius: 8, padding: '3px 10px', fontSize: 11, color: '#C4B0A0', cursor: 'pointer' }}>刪除</button>
              )}
            </div>
          </div>

          {selPlan.exercises.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>還沒有動作，點「編輯」加入</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {selPlan.exercises.map((ex, i) => (
                <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: i === 0 ? A : '#EDE6DE', color: i === 0 ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{ex.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{ex.sets}組×{ex.reps}下 · {ex.restSeconds}s · {ex.bpm}bpm</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : workoutPlans.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0 6px' }}>
          點下方「新增計劃」開始設定訓練
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {selPlan?.exercises.length > 0 && (
          <button
            onClick={() => setPlaying(true)}
            style={{
              flex: 2, padding: '11px 0', borderRadius: 12, border: 'none',
              background: A, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>▶ 開始訓練</button>
        )}
        <button
          onClick={handleNewPlan}
          style={{
            flex: 1, padding: '11px 0', borderRadius: 12,
            border: `1px dashed ${A}`, background: 'transparent',
            fontSize: 13, color: AD, cursor: 'pointer',
          }}>＋ 新計劃</button>
      </div>

      {/* Plan Editor modal */}
      {editingPlan !== null && (
        <WorkoutPlanEditor
          plan={editorPlan}
          onSave={handleSavePlanName}
          onAddExercise={handleAddExercise}
          onUpdateExercise={handleUpdateExercise}
          onDeleteExercise={handleDeleteExercise}
          onClose={handleCloseEditor}
        />
      )}

      {/* Player modal */}
      {playing && selPlan && (
        <WorkoutPlayerModal
          plan={selPlan}
          onClose={() => setPlaying(false)}
          onLogExercise={() => onLogExercise?.(selectedDate, '重訓', selPlan.name, 0, 'moderate')}
        />
      )}
    </>
  )
}
