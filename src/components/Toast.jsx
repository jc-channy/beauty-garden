import React, { useState, useEffect } from 'react'

export function showToast(msg) {
  window.dispatchEvent(new CustomEvent('beautyToast', { detail: { msg } }))
}

let _idCounter = 0

export default function Toast() {
  const [items, setItems] = useState([])

  useEffect(() => {
    function handler(e) {
      const id = ++_idCounter
      setItems(prev => [...prev, { id, msg: e.detail.msg, leaving: false }])
      setTimeout(() => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, leaving: true } : i))
      }, 2000)
      setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== id))
      }, 2300)
    }
    window.addEventListener('beautyToast', handler)
    return () => window.removeEventListener('beautyToast', handler)
  }, [])

  if (items.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(var(--tab-height) + var(--safe-bottom) + 12px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 6,
      alignItems: 'center',
      pointerEvents: 'none',
      width: '100%',
      maxWidth: 400,
      padding: '0 20px',
    }}>
      {items.map(item => (
        <div
          key={item.id}
          style={{
            background: 'rgba(44, 36, 30, 0.88)',
            color: '#F5EFE6',
            borderRadius: 20,
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            animation: item.leaving
              ? 'toastFadeOut 0.28s ease forwards'
              : 'toastSlideUp 0.28s cubic-bezier(.34,1.4,.64,1) both',
          }}
        >
          {item.msg}
        </div>
      ))}
    </div>
  )
}
