import React, { useState, useEffect, useRef, useCallback } from 'react'

const A = '#C8A87A'
const AD = '#9A7A5A'
const AL = '#FDF5EC'
const PINK = '#EFD7D7'
const PINK_D = '#C08090'

// ── Web Audio beep ─────────────────────────────────────────────
function createBeep(ctx, freq = 880, dur = 0.06, vol = 0.4) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = freq
  osc.type = 'sine'
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + dur)
}

// ── Phase constants ────────────────────────────────────────────
const PHASE_WORKING = 'working'
const PHASE_REST    = 'rest'
const PHASE_DONE    = 'done'

export default function WorkoutPlayerModal({ plan, onClose, onLogExercise }) {
  // plan: { id, name, exercises: [{ id, name, sets, reps, restSeconds, bpm }] }
  const exList = plan.exercises

  const [exIdx,    setExIdx]    = useState(0)   // current exercise index
  const [setIdx,   setSetIdx]   = useState(0)   // current set index (0-based)
  const [repCount, setRepCount] = useState(0)   // reps done this set
  const [phase,    setPhase]    = useState(PHASE_WORKING)
  const [restLeft, setRestLeft] = useState(0)
  const [bpm,      setBpm]      = useState(exList[0]?.bpm || 60)
  const [metroOn,  setMetroOn]  = useState(true)

  const audioCtxRef  = useRef(null)
  const metroRef     = useRef(null)
  const restTimerRef = useRef(null)

  const curEx = exList[exIdx] || null

  // ── Sync BPM when exercise changes ──────────────────────────
  useEffect(() => {
    if (curEx) setBpm(curEx.bpm)
  }, [exIdx])

  // ── Metronome ─────────────────────────────────────────────
  const startMetro = useCallback((bpmVal) => {
    stopMetro()
    if (!metroOn) return
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = audioCtxRef.current
      const interval = (60 / bpmVal) * 1000
      createBeep(ctx)
      metroRef.current = setInterval(() => createBeep(ctx), interval)
    } catch (e) { console.warn('AudioContext error:', e) }
  }, [metroOn])

  const stopMetro = useCallback(() => {
    if (metroRef.current) { clearInterval(metroRef.current); metroRef.current = null }
  }, [])

  useEffect(() => {
    if (phase === PHASE_WORKING && metroOn) startMetro(bpm)
    else stopMetro()
    return stopMetro
  }, [phase, metroOn, bpm])

  // ── Rest countdown ─────────────────────────────────────────
  function startRest(seconds) {
    stopMetro()
    setPhase(PHASE_REST)
    setRestLeft(seconds)
  }

  useEffect(() => {
    if (phase !== PHASE_REST) { clearInterval(restTimerRef.current); return }
    restTimerRef.current = setInterval(() => {
      setRestLeft(prev => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current)
          advanceAfterRest()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(restTimerRef.current)
  }, [phase])

  function advanceAfterRest() {
    if (!curEx) return
    const nextSet = setIdx + 1
    if (nextSet < curEx.sets) {
      setSetIdx(nextSet)
      setRepCount(0)
      setPhase(PHASE_WORKING)
    } else {
      const nextEx = exIdx + 1
      if (nextEx < exList.length) {
        setExIdx(nextEx)
        setSetIdx(0)
        setRepCount(0)
        setPhase(PHASE_WORKING)
      } else {
        setPhase(PHASE_DONE)
      }
    }
  }

  function skipRest() {
    clearInterval(restTimerRef.current)
    advanceAfterRest()
  }

  function addRestTime(sec) {
    setRestLeft(prev => prev + sec)
  }

  // ── Rep counter ───────────────────────────────────────────
  function addRep() {
    if (phase !== PHASE_WORKING || !curEx) return
    const next = repCount + 1
    setRepCount(next)
    if (next >= curEx.reps) {
      // set complete
      setTimeout(() => {
        setRepCount(0)
        if (setIdx + 1 < curEx.sets) {
          startRest(curEx.restSeconds)
        } else {
          const nextEx = exIdx + 1
          if (nextEx < exList.length) {
            startRest(exList[nextEx]?.restSeconds || curEx.restSeconds)
          } else {
            stopMetro()
            setPhase(PHASE_DONE)
          }
        }
      }, 280)
    }
  }

  function removeRep() {
    if (phase !== PHASE_WORKING) return
    setRepCount(prev => Math.max(0, prev - 1))
  }

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => () => {
    stopMetro()
    clearInterval(restTimerRef.current)
  }, [])

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── Next exercise preview ─────────────────────────────────
  const nextEx = phase === PHASE_REST
    ? (setIdx + 1 < (curEx?.sets || 0) ? null : exList[exIdx + 1] || null)
    : null
  const nextLabel = phase === PHASE_REST
    ? (setIdx + 1 < (curEx?.sets || 0)
        ? `第 ${setIdx + 2} 組`
        : nextEx ? nextEx.name : null)
    : null

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-end', padding: 0 }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: '22px 22px 0 0',
        width: '100%', maxWidth: 430, maxHeight: '94vh', overflowY: 'auto',
        padding: '20px 20px 40px',
      }}>
        {/* Handle + header */}
        <div className="modal-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{plan.name}</div>
          <button onClick={() => { stopMetro(); clearInterval(restTimerRef.current); onClose() }} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {phase === PHASE_DONE ? (
          /* ── 完成畫面 ── */
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: AD, marginBottom: 8 }}>訓練完成！</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>{plan.name} · {exList.length} 個動作</div>
            <button onClick={() => { onLogExercise?.(); onClose() }} style={{
              width: '100%', padding: 14, borderRadius: 14, border: 'none',
              background: A, color: '#fff', fontSize: 15, fontWeight: 500, cursor: 'pointer',
            }}>記錄到今日運動</button>
            <button onClick={onClose} style={{
              width: '100%', padding: 12, marginTop: 8, borderRadius: 14,
              border: '0.5px solid var(--border-soft)', background: 'var(--bg-surface)',
              fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer',
            }}>關閉</button>
          </div>
        ) : (
          <>
            {/* Exercise progress dots */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
              {exList.map((ex, i) => (
                <div key={ex.id} style={{
                  flex: 1, height: 5, borderRadius: 3,
                  background: i < exIdx ? A : i === exIdx ? A : '#EDE6DE',
                  opacity: i < exIdx ? 0.5 : 1,
                }} />
              ))}
            </div>

            {/* Current exercise name */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{curEx?.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                動作 {exIdx + 1} / {exList.length}
              </div>
            </div>

            {/* Set dots */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, marginBottom: 18 }}>
              {Array.from({ length: curEx?.sets || 0 }, (_, i) => (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: i < setIdx ? A : i === setIdx ? (phase === PHASE_REST ? PINK_D : A) : '#EDE6DE',
                }} />
              ))}
            </div>

            {phase === PHASE_WORKING && (
              <>
                {/* Rep counter */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <button
                    onClick={removeRep}
                    style={{ width: 52, height: 52, borderRadius: '50%', border: '0.5px solid var(--border-soft)', background: 'var(--bg-surface)', fontSize: 26, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 64, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1 }}>{repCount}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>/ {curEx?.reps} 下 · 第 {setIdx + 1} 組</div>
                  </div>
                  <button
                    onClick={addRep}
                    style={{ width: 52, height: 52, borderRadius: '50%', border: `1.5px solid ${A}`, background: AL, fontSize: 26, color: AD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>

                {/* Metronome */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => setMetroOn(v => !v)}
                        style={{ padding: '4px 12px', borderRadius: 10, border: `0.5px solid ${metroOn ? A : 'var(--border-soft)'}`, background: metroOn ? AL : 'transparent', fontSize: 12, color: metroOn ? AD : 'var(--text-muted)', cursor: 'pointer' }}>
                        {metroOn ? '♩ 節拍開' : '♩ 節拍關'}
                      </button>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{bpm} BPM</span>
                  </div>
                  <input
                    type="range" min={30} max={120} step={5} value={bpm}
                    onChange={e => { const v = Number(e.target.value); setBpm(v); if (metroOn && phase === PHASE_WORKING) startMetro(v) }}
                    style={{ width: '100%', accentColor: A }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    <span>慢 30</span><span>快 120</span>
                  </div>
                </div>
              </>
            )}

            {phase === PHASE_REST && (
              <>
                {/* Rest countdown */}
                <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', color: PINK_D, textTransform: 'uppercase', marginBottom: 8 }}>休息中</div>
                  <div style={{ fontSize: 68, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 16 }}>{fmtTime(restLeft)}</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => addRestTime(30)} style={{ padding: '8px 20px', borderRadius: 12, border: '0.5px solid var(--border-soft)', background: 'var(--bg-surface)', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>＋30秒</button>
                    <button onClick={skipRest} style={{ padding: '8px 20px', borderRadius: 12, border: `0.5px solid ${A}`, background: AL, fontSize: 13, color: AD, cursor: 'pointer' }}>跳過休息</button>
                  </div>
                </div>

                {/* Next preview */}
                {nextLabel && (
                  <div style={{ background: PINK, borderRadius: 12, padding: '10px 14px', border: `0.5px solid ${PINK_D}33` }}>
                    <div style={{ fontSize: 11, color: PINK_D, marginBottom: 3 }}>休息後</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {nextLabel}
                      {nextEx && <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>{nextEx.sets}×{nextEx.reps} · {nextEx.bpm} BPM</span>}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
