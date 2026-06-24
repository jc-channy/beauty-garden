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

// ── Constants ─────────────────────────────────────────────────
export const CATEGORIES = [
  '卸妝','洗面乳','化妝水','精華液','安瓶','眼霜','乳液','乳霜','凝膠',
  '面膜','防曬','唇部保養',
]

export const EFFECTS = [
  '保濕','補水','修護','舒緩','抗老','緊緻','美白','淡斑','提亮',
  '抗氧化','控油','抗痘','毛孔','去角質','黑眼圈','消腫','敏弱肌修護','術後修護',
]

// ── Data model ────────────────────────────────────────────────
// Product: { id, nickname, brand, name, category, effects, frequencyMode, targetDays, timesPerWeek, usageLog, imagePreview, addedAt }
// RoutineGroup: { id, name, dayItems: string[], nightItems: string[], sortOrder }

const INITIAL_STATE = {
  products: [],
  routineGroups: [],
  settings: { userName: '' },
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
    frequency_mode: p.frequencyMode || 'daily',
    target_days: p.targetDays || [],
    times_per_week: p.timesPerWeek || 3,
    usage_log: p.usageLog || [],
    image_preview: p.imagePreview || '',
    added_at: p.addedAt || '',
  }
}

function rowToGroup(row) {
  return {
    id: row.id,
    name: row.name || '未命名',
    notes: row.notes || '',
    dayItems: row.day_items || [],
    nightItems: row.night_items || [],
    sortOrder: row.sort_order || 0,
  }
}

function groupToRow(g, userId) {
  return {
    id: g.id,
    user_id: userId,
    name: g.name,
    notes: g.notes || '',
    day_items: g.dayItems,
    night_items: g.nightItems,
    sort_order: g.sortOrder,
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
        { data: groupRows },
        { data: settingsRows },
      ] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('routine_groups').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
        supabase.from('user_settings').select('*').eq('user_id', userId),
      ])

      const products = (productRows || []).map(rowToProduct)
      const routineGroups = (groupRows || []).map(rowToGroup)
      const settings = settingsRows?.[0] ? {
        userName: settingsRows[0].user_name || '',
      } : INITIAL_STATE.settings

      setState({ products, routineGroups, settings })
    } catch (e) {
      console.error('Load error:', e)
    }
    setLoading(false)
  }

  // ── Products ───────────────────────────────────────────────
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
      frequencyMode: 'daily',
      targetDays: [],
      timesPerWeek: 3,
      usageLog: [],
      imagePreview: null,
      ...product,
    }
    setState(prev => ({ ...prev, products: [...prev.products, newProduct] }))
    const { error } = await supabase.from('products').insert(productToRow(newProduct, userId))
    if (error) {
      console.error('Insert failed:', error)
      alert(`儲存失敗：${error.message}`)
      setState(prev => ({ ...prev, products: prev.products.filter(p => p.id !== newProduct.id) }))
    }
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
    // Also remove from all groups
    setState(prev => {
      const groups = prev.routineGroups.map(g => {
        const updated = {
          ...g,
          dayItems: g.dayItems.filter(pid => pid !== id),
          nightItems: g.nightItems.filter(pid => pid !== id),
        }
        supabase.from('routine_groups').update({ day_items: updated.dayItems, night_items: updated.nightItems }).eq('id', g.id)
        return updated
      })
      return { ...prev, products: prev.products.filter(p => p.id !== id), routineGroups: groups }
    })
    supabase.from('products').delete().eq('id', id)
  }, [])

  // ── Routine Groups ─────────────────────────────────────────
  const addGroup = useCallback(async (name, notes = '') => {
    const newGroup = {
      id: Date.now().toString(),
      name: name || '新組別',
      notes: notes || '',
      dayItems: [],
      nightItems: [],
      sortOrder: Date.now(),
    }
    setState(prev => ({ ...prev, routineGroups: [...prev.routineGroups, newGroup] }))
    const { error } = await supabase.from('routine_groups').insert(groupToRow(newGroup, userId))
    if (error) {
      console.error('Group insert failed:', error)
      setState(prev => ({ ...prev, routineGroups: prev.routineGroups.filter(g => g.id !== newGroup.id) }))
    }
    return newGroup.id
  }, [userId])

  const updateGroup = useCallback((id, patch) => {
    setState(prev => {
      const routineGroups = prev.routineGroups.map(g => {
        if (g.id !== id) return g
        const updated = { ...g, ...patch }
        const row = {}
        if (patch.name !== undefined) row.name = patch.name
        if (patch.notes !== undefined) row.notes = patch.notes
        if (patch.dayItems !== undefined) row.day_items = patch.dayItems
        if (patch.nightItems !== undefined) row.night_items = patch.nightItems
        supabase.from('routine_groups').update(row).eq('id', id)
        return updated
      })
      return { ...prev, routineGroups }
    })
  }, [])

  const deleteGroup = useCallback((id) => {
    setState(prev => ({ ...prev, routineGroups: prev.routineGroups.filter(g => g.id !== id) }))
    supabase.from('routine_groups').delete().eq('id', id)
  }, [])

  // ── Settings ───────────────────────────────────────────────
  const updateSettings = useCallback((patch) => {
    setState(prev => {
      const newSettings = { ...prev.settings, ...patch }
      supabase.from('user_settings').upsert({
        user_id: userId,
        user_name: newSettings.userName,
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
    addGroup,
    updateGroup,
    deleteGroup,
    updateSettings,
  }
}
