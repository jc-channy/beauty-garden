import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// ── Date helpers ──────────────────────────────────────────────
export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(today)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function dayOfWeekFor(dateStr) {
  return new Date(dateStr + 'T12:00:00').getDay()
}

// ── Frequency helpers ─────────────────────────────────────────
export function isProductDueToday(product) {
  const today = todayKey()
  const dow = dayOfWeekFor(today)
  const log = product.usageLog || []
  const mode = product.frequencyMode || 'daily'
  if (mode === 'days-of-week') return (product.targetDays || []).includes(dow)
  if (mode === 'times-per-week') {
    const weekDates = getWeekDates()
    const usedThisWeek = log.filter(d => weekDates.includes(d)).length
    return usedThisWeek < (product.timesPerWeek || 1)
  }
  return true
}

export function getWeeklyProgress(product) {
  const weekDates = getWeekDates()
  const today = todayKey()
  const log = product.usageLog || []
  const mode = product.frequencyMode || 'daily'
  const usedThisWeek = log.filter(d => weekDates.includes(d)).length
  if (mode === 'days-of-week') {
    const targetDays = product.targetDays || []
    const targetDatesThisWeek = weekDates.filter(d => targetDays.includes(dayOfWeekFor(d)))
    const completed =
      targetDatesThisWeek.length > 0 &&
      targetDatesThisWeek.every(d => d > today || log.includes(d))
    return { used: usedThisWeek, target: targetDatesThisWeek.length, completed, weekDates }
  }
  if (mode === 'times-per-week') {
    const target = product.timesPerWeek || 1
    return { used: usedThisWeek, target, completed: usedThisWeek >= target, weekDates }
  }
  return { used: usedThisWeek, target: 7, completed: usedThisWeek >= 7, weekDates }
}

export function getStreak(products) {
  const today = todayKey()
  const todayUsed = products.some(p => (p.usageLog || []).includes(today))
  let streak = todayUsed ? 1 : 0
  const d = new Date()
  d.setDate(d.getDate() - 1)
  while (streak < 365) {
    const key = d.toISOString().slice(0, 10)
    const anyUsed = products.some(p => (p.usageLog || []).includes(key))
    if (!anyUsed) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function getTotalStats(products) {
  const allDates = new Set()
  let totalUses = 0
  products.forEach(p => {
    ;(p.usageLog || []).forEach(d => { allDates.add(d); totalUses++ })
  })
  return { activeDays: allDates.size, totalUses }
}

// ── Monthly completion rate ───────────────────────────────────
export function getMonthlyRate(products) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const allDates = new Set()
  products.forEach(p => {
    ;(p.usageLog || []).forEach(d => {
      const [y, m] = d.split('-').map(Number)
      if (y === year && m === month + 1) allDates.add(d)
    })
  })
  return today > 0 ? Math.round((allDates.size / today) * 100) : 0
}

// ── Data model ────────────────────────────────────────────────
export const CATEGORIES = [
  '卸妝','洗面乳','化妝水','精華液','安瓶','眼霜','乳液','乳霜','凝膠',
  '面膜','防曬','唇部保養','妝前乳','粉底','遮瑕','蜜粉','修容','腮紅','唇彩',
]

export const EFFECTS = [
  '保濕','補水','修護','舒緩','抗老','緊緻','美白','淡斑','提亮',
  '抗氧化','控油','抗痘','毛孔','去角質','黑眼圈','消腫','敏弱肌修護','術後修護',
]

const INITIAL_STATE = {
  products: [],
  settings: { userName: '', apiKey: '', apiProvider: 'anthropic' },
}

// ── DB mapping ────────────────────────────────────────────────
function rowToProduct(row) {
  return {
    id: row.id,
    nickname: row.nickname || '',
    brand: row.brand || '',
    name: row.name || '',
    category: row.category || '',
    effects: row.effects || [],
    dayOk: row.day_ok !== false,
    nightOk: row.night_ok !== false,
    dayOrder: row.day_order ?? null,
    nightOrder: row.night_order ?? null,
    frequencyMode: row.frequency_mode || 'daily',
    targetDays: row.target_days || [],
    timesPerWeek: row.times_per_week || 3,
    usageLog: row.usage_log || [],
    imagePreview: row.image_preview || null,
    addedAt: row.added_at || '',
  }
}

function productToRow(p, userId) {
  return {
    id: p.id,
    user_id: userId,
    nickname: p.nickname || '',
    brand: p.brand || '',
    name: p.name || '',
    category: p.category || '',
    effects: p.effects || [],
    day_ok: p.dayOk !== false,
    night_ok: p.nightOk !== false,
    day_order: p.dayOrder ?? null,
    night_order: p.nightOrder ?? null,
    frequency_mode: p.frequencyMode || 'daily',
    target_days: p.targetDays || [],
    times_per_week: p.timesPerWeek || 3,
    usage_log: p.usageLog || [],
    image_preview: p.imagePreview || '',
    added_at: p.addedAt || '',
  }
}

// ── Hook ──────────────────────────────────────────────────────
export function useStore(userId) {
  const [state, setState] = useState(INITIAL_STATE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) loadData()
  }, [userId])

  async function loadData() {
    setLoading(true)
    try {
      const [
        { data: productRows },
        { data: settingsRows },
      ] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('user_settings').select('*').eq('user_id', userId),
      ])

      const products = (productRows || []).map(rowToProduct)
      const settings = settingsRows?.[0] ? {
        userName:    settingsRows[0].user_name    || '',
        apiKey:      settingsRows[0].api_key      || '',
        apiProvider: settingsRows[0].api_provider || 'anthropic',
      } : INITIAL_STATE.settings

      setState({ products, settings })
    } catch (e) {
      console.error('Load error:', e)
    }
    setLoading(false)
  }

  const toggleProductUseToday = useCallback((productId) => {
    const today = todayKey()
    let newLog
    setState(prev => {
      const products = prev.products.map(p => {
        if (p.id !== productId) return p
        const log = p.usageLog || []
        const has = log.includes(today)
        newLog = has ? log.filter(d => d !== today) : [...log, today]
        return { ...p, usageLog: newLog }
      })
      return { ...prev, products }
    })
    setTimeout(() => {
      if (newLog !== undefined) {
        supabase.from('products').update({ usage_log: newLog }).eq('id', productId)
      }
    }, 0)
  }, [])

  const addProduct = useCallback(async (product) => {
    const newProduct = {
      id: Date.now().toString(),
      addedAt: new Date().toISOString(),
      nickname: '',
      brand: '',
      name: '',
      category: '',
      effects: [],
      dayOk: true,
      nightOk: true,
      dayOrder: null,
      nightOrder: null,
      frequencyMode: 'daily',
      targetDays: [],
      timesPerWeek: 3,
      usageLog: [],
      imagePreview: null,
      ...product,
    }
    setState(prev => ({ ...prev, products: [...prev.products, newProduct] }))
    supabase.from('products').insert(productToRow(newProduct, userId))
  }, [userId])

  const updateProduct = useCallback((id, patch) => {
    setState(prev => {
      const products = prev.products.map(p => {
        if (p.id !== id) return p
        const updated = { ...p, ...patch }
        supabase.from('products').update(productToRow(updated, userId)).eq('id', id)
        return updated
      })
      return { ...prev, products }
    })
  }, [userId])

  const deleteProduct = useCallback((id) => {
    setState(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }))
    supabase.from('products').delete().eq('id', id)
  }, [])

  const updateSettings = useCallback((patch) => {
    setState(prev => {
      const newSettings = { ...prev.settings, ...patch }
      supabase.from('user_settings').upsert({
        user_id: userId,
        user_name:    newSettings.userName,
        api_key:      newSettings.apiKey,
        api_provider: newSettings.apiProvider,
      }, { onConflict: 'user_id' })
      return { ...prev, settings: newSettings }
    })
  }, [userId])

  return {
    state,
    loading,
    toggleProductUseToday,
    addProduct,
    updateProduct,
    deleteProduct,
    updateSettings,
  }
}
