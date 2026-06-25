import React from 'react'

const TABS = [
  { id: 'home',     label: '打卡',  icon: '✦' },
  { id: 'products', label: '我的',  icon: '◈' },
  { id: 'makeup',   label: '化妝',  icon: '✿' },
  { id: 'profile',  label: '紀錄',  icon: '◉' },
]

export default function TabBar({ current, onChange }) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      background: 'rgba(248,246,242,0.96)',
      backdropFilter: 'blur(14px)',
      borderTop: '0.5px solid var(--border-soft)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: 'calc(var(--tab-height) + var(--safe-bottom))',
      paddingBottom: 'var(--safe-bottom)',
      zIndex: 50,
    }}>
      {TABS.map(tab => {
        const active = current === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0',
              minHeight: 52,
              justifyContent: 'center',
            }}
          >
            {/* Fixed-size box so all icons occupy identical space */}
            <span style={{
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
              color: active ? '#9A7A5A' : '#C4B0A0',
              transition: 'color 0.2s, transform 0.2s',
              transform: active ? 'scale(1.1)' : 'scale(1)',
              flexShrink: 0,
            }}>
              {tab.icon}
            </span>
            <span style={{
              fontSize: 12,
              color: active ? '#9A7A5A' : '#C4B0A0',
              fontWeight: active ? 500 : 400,
              transition: 'color 0.2s',
              lineHeight: 1,
              marginTop: 1,
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
