import React, { useState } from 'react'
import { getStreak, getTotalStats, getMonthlyRate } from '../store/useStore.js'
import { supabase } from '../lib/supabase.js'

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
  const { state, updateSettings } = store
  const { settings, products } = state

  const [userName, setUserName] = useState(settings.userName)
  const [saved, setSaved]       = useState(false)

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
        <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)' }}>我的</div>
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

      {/* Overview */}
      <Section title="目前設定">
        <div className="card" style={{ padding: '12px 14px' }}>
          {[
            { label: '保養品總數', count: products.length, emoji: '🧴' },
            { label: '設定早上步驟', count: products.filter(p => p.dayOrder !== null && p.dayOrder !== undefined).length, emoji: '🌤' },
            { label: '設定晚上步驟', count: products.filter(p => p.nightOrder !== null && p.nightOrder !== undefined).length, emoji: '🌙' },
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

      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0', textAlign: 'left' }}
        >
          登出
        </button>
        <button onClick={() => {
          if (confirm('確定要清除所有資料嗎？此操作無法復原。')) {
            localStorage.removeItem('beautyGarden_v1')
            localStorage.removeItem('beautyGarden_v2')
            location.reload()
          }
        }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: '4px 0', textAlign: 'left' }}>
          清除本機快取
        </button>
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}
