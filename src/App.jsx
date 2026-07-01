import React, { useState, useEffect } from 'react'
import TabBar from './components/TabBar.jsx'
import Toast from './components/Toast.jsx'
import HomePage from './pages/HomePage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import AchievementsPage from './pages/AchievementsPage.jsx'
import MinePage from './pages/MinePage.jsx'
import GroupsPage from './pages/GroupsPage.jsx'
import MakeupPage from './pages/MakeupPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import { useStore } from './store/useStore.js'
import { supabase, isConfigured } from './lib/supabase.js'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)', gap: 16,
    }}>
      <div style={{ fontSize: 36 }}>🌿</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>載入中…</div>
    </div>
  )
}

function SetupScreen() {
  return (
    <div style={{
      minHeight: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)', padding: '32px 24px',
    }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>⚙️</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
        需要設定 Supabase
      </div>
      <div style={{
        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8,
        background: 'var(--bg-card)', borderRadius: 16, padding: '16px 20px',
        border: '0.5px solid var(--border-soft)', maxWidth: 320,
      }}>
        請在 <code style={{ background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>beauty-garden/.env.local</code> 填入你的 Supabase URL 和 Anon Key，再重新啟動 <code style={{ background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>npm run dev</code>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (!isConfigured) return <SetupScreen />
  if (session === undefined) return <LoadingScreen />
  if (!session) return <AuthPage />

  return <MainApp userId={session.user.id} />
}

function MainApp({ userId }) {
  const [tab, setTab] = useState('today')
  const [subPage, setSubPage] = useState(null) // 'products' | 'groups' | 'makeup'
  const store = useStore(userId)

  if (store.loading) return <LoadingScreen />

  // Sub-pages (full-screen overlays from MinePage)
  if (subPage === 'groups') {
    return <GroupsPage store={store} onBack={() => setSubPage(null)} />
  }
  if (subPage === 'products') {
    return <ProductsPage store={store} onBack={() => setSubPage(null)} />
  }
  const pages = {
    today:        <HomePage store={store} onManageGroups={() => setSubPage('groups')} />,
    achievements: <AchievementsPage store={store} />,
    mine:         <MinePage store={store} onNavigate={setSubPage} />,
    makeup:       <MakeupPage onBack={null} />,
  }

  return (
    <>
      {pages[tab]}
      <TabBar current={tab} onChange={setTab} />
      <Toast />
    </>
  )
}
