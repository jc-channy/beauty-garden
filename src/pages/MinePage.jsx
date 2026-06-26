import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

function NavRow({ icon, label, desc, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '14px 0', borderBottom: '0.5px solid var(--border-soft)',
      textAlign: 'left',
    }}>
      <span style={{ fontSize: 22, width: 32, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>›</span>
    </button>
  )
}

export default function MinePage({ store, onNavigate }) {
  const { state, updateSettings, updateBodyGoals } = store
  const { settings, products, routineGroups } = state

  const [userName, setUserName] = useState(settings.userName)
  const [goalWeight, setGoalWeight] = useState(settings.bodyGoalWeight ?? '')
  const [goalFat, setGoalFat] = useState(settings.bodyGoalFat ?? '')
  const [goalWater, setGoalWater] = useState(settings.waterGoalMl ?? 2000)
  const [quickAmts, setQuickAmts] = useState((settings.waterQuickAmounts || [200, 350, 500]).join(', '))
  const [saved, setSaved] = useState(false)

  React.useEffect(() => {
    setUserName(settings.userName)
    setGoalWeight(settings.bodyGoalWeight ?? '')
    setGoalFat(settings.bodyGoalFat ?? '')
    setGoalWater(settings.waterGoalMl ?? 2000)
    setQuickAmts((settings.waterQuickAmounts || [200, 350, 500]).join(', '))
  }, [settings.userName, settings.bodyGoalWeight, settings.bodyGoalFat, settings.waterGoalMl, settings.waterQuickAmounts])

  function handleSave() {
    const parsedAmounts = quickAmts.split(/[,，\s]+/).map(s => parseInt(s.trim())).filter(n => n > 0)
    updateSettings({ userName, waterGoalMl: parseInt(goalWater) || 2000, waterQuickAmounts: parsedAmounts.length ? parsedAmounts : [200, 350, 500] })
    updateBodyGoals({ bodyGoalWeight: goalWeight !== '' ? parseFloat(goalWeight) : null, bodyGoalFat: goalFat !== '' ? parseFloat(goalFat) : null })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>我的</div>
      </div>

      {/* ── 個人設定 ── */}
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>個人設定</div>
      <div className="card" style={{ padding: '14px 16px', marginBottom: 22 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>你的名字</label>
          <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="輸入你的名字…" />
        </div>
      </div>

      {/* ── 目標設定 ── */}
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>目標設定</div>
      <div className="card" style={{ padding: '14px 16px', marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>每日飲水目標 (ml)</div>
          <input type="number" inputMode="numeric" value={goalWater} onChange={e => setGoalWater(e.target.value)} placeholder="2000" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>快速加水選項 (ml，逗號分隔)</div>
          <input type="text" inputMode="numeric" value={quickAmts} onChange={e => setQuickAmts(e.target.value)} placeholder="200, 350, 500" />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>目標體重 (kg)</div>
            <input type="number" inputMode="decimal" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} placeholder="—" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>目標體脂 (%)</div>
            <input type="number" inputMode="decimal" value={goalFat} onChange={e => setGoalFat(e.target.value)} placeholder="—" />
          </div>
        </div>
      </div>

      <button className="btn-primary" onClick={handleSave} style={{
        background: saved ? '#D7DFD2' : 'var(--color-milk)',
        color: saved ? '#5A7A52' : 'var(--text-primary)',
        transition: 'background 0.3s, color 0.3s',
        marginBottom: 28,
      }}>
        {saved ? '✓ 已儲存' : '儲存設定'}
      </button>

      {/* ── 功能管理 ── */}
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>功能管理</div>
      <div className="card" style={{ padding: '0 16px' }}>
        <NavRow
          icon="✿"
          label="保養品管理"
          desc={`${products.length} 個保養品`}
          onClick={() => onNavigate('products')}
        />
        <NavRow
          icon="◈"
          label="保養組別"
          desc={`${routineGroups.length} 個組別`}
          onClick={() => onNavigate('groups')}
        />
        <NavRow
          icon="✦"
          label="化妝參考"
          desc="完整版 · 快速版 · 簡約版"
          onClick={() => onNavigate('makeup')}
        />
      </div>

      {/* ── 帳號 ── */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid var(--border-soft)' }}>
        <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0', textAlign: 'left' }}>
          登出
        </button>
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}
