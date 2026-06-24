import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false) // 註冊後確認信提示

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setDone(true)
      }
    } catch (e) {
      setError(translateError(e.message))
    }
    setLoading(false)
  }

  function translateError(msg) {
    if (msg.includes('Invalid login credentials')) return '電子信箱或密碼錯誤'
    if (msg.includes('User already registered')) return '此信箱已註冊，請直接登入'
    if (msg.includes('Password should be')) return '密碼至少需要 6 個字元'
    if (msg.includes('Unable to validate')) return '無效的電子信箱'
    return msg
  }

  if (done) {
    return (
      <div style={{
        minHeight: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-main)', padding: '32px 24px',
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>✉️</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8, textAlign: 'center' }}>
          確認信已送出
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.7, maxWidth: 280 }}>
          請到 <strong>{email}</strong> 信箱點擊確認連結，再回來登入
        </div>
        <button
          onClick={() => { setMode('login'); setDone(false) }}
          style={{ marginTop: 28, fontSize: 14, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          回到登入頁面
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)', padding: '32px 24px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🌿</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>Beauty Garden</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>女孩的美麗管理</div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
        border: '0.5px solid var(--border-soft)', padding: '28px 24px',
      }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[{ key: 'login', label: '登入' }, { key: 'register', label: '建立帳號' }].map(t => (
            <button
              key={t.key}
              onClick={() => { setMode(t.key); setError('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: 'var(--radius-md)',
                border: '0.5px solid',
                borderColor: mode === t.key ? '#C8A87A' : 'var(--border-soft)',
                background: mode === t.key ? '#F2E6D9' : 'var(--bg-surface)',
                color: mode === t.key ? '#8A6A40' : 'var(--text-muted)',
                fontSize: 14, fontWeight: mode === t.key ? 500 : 400, cursor: 'pointer',
              }}
            >{t.label}</button>
          ))}
        </div>

        {error && (
          <div style={{
            fontSize: 13, color: '#C06060', background: '#FBF0F0',
            borderRadius: 10, padding: '10px 13px', marginBottom: 16, lineHeight: 1.5,
          }}>{error}</div>
        )}

        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>電子信箱</label>
        <input
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{ marginBottom: 14 }}
          autoCapitalize="none"
          autoCorrect="off"
        />

        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>密碼</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={mode === 'register' ? '至少 6 個字元' : '輸入密碼'}
          style={{ marginBottom: 20 }}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
        />

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading || !email.trim() || !password.trim()}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '處理中…' : mode === 'login' ? '登入' : '建立帳號'}
        </button>
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
        資料加密存放於 Supabase<br />跨裝置同步，你的保養品隨時都在
      </div>
    </div>
  )
}
