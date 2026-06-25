import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

// ── Date helpers ──────────────────────────────────────────────
// Use local time (not UTC) — avoids wrong-day bugs for UTC+8 users
export function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function todayKey() {
  return localDateStr(new Date())
}

export function getWeekDates(offset = 0) {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  const monday = new Date(today)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return localDateStr(d)
  })
}

// usageLog entries: 'YYYY-MM-DD' (old format) or 'YYYY-MM-DD-am' / 'YYYY-MM-DD-pm'
// Backward-compat: old plain-date entries count as AM only (not PM)
export function isUsedOnDate(log, date, section) {
  const entries = log || []
  if (section) {
    // New format check
    if (entries.includes(`${date}-${section}`)) return true
    // Old format: plain date → treated as AM only
    if (section === 'am' && entries.includes(date)) return true
    return false
  }
  // No section: any entry for this date (for streak / stats)
  return entries.includes(date) || entries.some(e => e.startsWith(date + '-'))
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
  const todayUsed = products.some(p => isUsedOnDate(p.usageLog, today, null))
  let streak = todayUsed ? 1 : 0
  const d = new Date()
  d.setDate(d.getDate() - 1)
  while (streak < 365) {
    const key = localDateStr(d)
    const anyUsed = products.some(p => isUsedOnDate(p.usageLog, key, null))
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
    ;(p.usageLog || []).forEach(e => { allDates.add(e.slice(0, 10)); totalUses++ })
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
    ;(p.usageLog || []).forEach(e => {
      const d = e.slice(0, 10)
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

// Spring Meadow-inspired palette for category tags
export const CATEGORY_COLORS = {
  '卸妝':    { bg: '#F8DDCD', text: '#8A4030' },
  '洗面乳':  { bg: '#AECBB8', text: '#2E6647' },
  '化妝水':  { bg: '#C1DBDF', text: '#2A6878' },
  '精華液':  { bg: '#F8C467', text: '#7A4E10' },
  '安瓶':    { bg: '#F79E70', text: '#7A3010' },
  '眼霜':    { bg: '#C8B3CA', text: '#5A2E6A' },
  '乳液':    { bg: '#D4E4CC', text: '#3A5E30' },
  '乳霜':    { bg: '#E8D4C0', text: '#7A4A28' },
  '凝膠':    { bg: '#B8D8E4', text: '#1E6080' },
  '面膜':    { bg: '#F2E8B4', text: '#6A5010' },
  '防曬':    { bg: '#E89B88', text: '#7A2818' },
  '唇部保養': { bg: '#D4AABE', text: '#7A2840' },
}

export const EFFECTS = [
  '保濕','補水','修護','舒緩','抗老','緊緻','美白','淡斑','提亮',
  '抗氧化','控油','抗痘','毛孔','去角質','黑眼圈','消腫','敏弱肌修護','術後修護',
]

export const EFFECT_COLORS = {
  '保濕':     { bg: '#C1DBDF', text: '#2A6878' },
  '補水':     { bg: '#B8D8E4', text: '#1E6080' },
  '修護':     { bg: '#AECBB8', text: '#2E6647' },
  '舒緩':     { bg: '#D4E4CC', text: '#3A5E30' },
  '抗老':     { bg: '#C8B3CA', text: '#5A2E6A' },
  '緊緻':     { bg: '#D4AABE', text: '#7A2840' },
  '美白':     { bg: '#F2E8B4', text: '#6A5010' },
  '淡斑':     { bg: '#F8C467', text: '#7A4E10' },
  '提亮':     { bg: '#F8DDCD', text: '#8A4030' },
  '抗氧化':   { bg: '#E8D4C0', text: '#7A4A28' },
  '控油':     { bg: '#D4E4CC', text: '#3A5E30' },
  '抗痘':     { bg: '#F79E70', text: '#7A3010' },
  '毛孔':     { bg: '#E89B88', text: '#7A2818' },
  '去角質':   { bg: '#F8C467', text: '#7A4E10' },
  '黑眼圈':   { bg: '#C8B3CA', text: '#5A2E6A' },
  '消腫':     { bg: '#C1DBDF', text: '#2A6878' },
  '敏弱肌修護': { bg: '#D4E4CC', text: '#3A5E30' },
  '術後修護': { bg: '#E8D4C0', text: '#7A4A28' },
}

// ── Data model ────────────────────────────────────────────────
// Product: { id, nickname, brand, name, category, effects, frequencyMode, targetDays, timesPerWeek, usageLog, imagePreview, addedAt }
// RoutineGroup: { id, name, dayItems: string[], nightItems: string[], sortOrder }

const INITIAL_STATE = {
  products: [],
  routineGroups: [],
  settings: { userName: '', trackerAmOrder: [], trackerPmOrder: [] },
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
    timeOfDay: row.time_of_day || '',   // 'am' | 'pm' | ''
    caution: row.caution || [],         // string[]
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
    time_of_day: p.timeOfDay || '',
    caution: p.caution || [],
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
    day_items: g.dayItems,
    night_items: g.nightItems,
    sort_order: g.sortOrder,
  }
}

// ── Hook ──────────────────────────────────────────────────────
export function useStore(userId) {
  const [state, _setStateRaw] = useState(INITIAL_STATE)
  // stateRef always mirrors state synchronously — lets us read current state
  // outside of setState updaters (avoids React 18 StrictMode double-invoke bug)
  const stateRef = useRef(INITIAL_STATE)
  const setState = useCallback((updater) => {
    _setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      stateRef.current = next
      return next
    })
  }, [])

  const [loading, setLoading] = useState(true)
  // Track in-flight mutations so visibilitychange doesn't overwrite optimistic state
  const mutating = useRef(0)

  // groupDays: { [groupId]: number[] } — stored in localStorage (bypasses schema cache issue)
  const [groupDays, setGroupDaysState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bg_groupDays') || '{}') } catch { return {} }
  })
  const setGroupTargetDays = useCallback((groupId, days) => {
    setGroupDaysState(prev => {
      const next = { ...prev, [groupId]: days }
      localStorage.setItem('bg_groupDays', JSON.stringify(next))
      return next
    })
  }, [])

  useEffect(() => {
    if (userId) loadData()
  }, [userId])

  // Re-fetch when tab becomes visible again (cross-device sync)
  // Skip if a mutation is in-flight to avoid overwriting optimistic state
  useEffect(() => {
    if (!userId) return
    function handleVisibility() {
      if (document.visibilityState === 'visible' && mutating.current === 0) {
        loadData({ silent: true })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [userId])

  async function loadData({ silent = false } = {}) {
    if (!silent) setLoading(true)
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

      // Guard: only update state if queries returned real data (not null)
      if (productRows === null || groupRows === null) {
        console.warn('loadData: null response, skipping setState')
        return
      }

      const products = productRows.map(rowToProduct)
      const routineGroups = groupRows.map(rowToGroup)
      const settings = settingsRows?.[0] ? {
        userName: settingsRows[0].user_name || '',
        trackerAmOrder: settingsRows[0].tracker_am_order || [],
        trackerPmOrder: settingsRows[0].tracker_pm_order || [],
      } : INITIAL_STATE.settings

      setState({ products, routineGroups, settings })
    } catch (e) {
      console.error('Load error:', e)
    }
    if (!silent) setLoading(false)
  }

  // ── Products ───────────────────────────────────────────────
  const toggleProductUseDate = useCallback(async (productId, section, date) => {
    const key = section ? `${date}-${section}` : date

    // Read current log from stateRef (not inside setState updater)
    // This avoids React 18 StrictMode double-invoke bug where newLog gets reversed
    const currentProduct = stateRef.current.products.find(p => p.id === productId)
    if (!currentProduct) return
    const prevLog = currentProduct.usageLog || []
    const newLog = prevLog.includes(key)
      ? prevLog.filter(d => d !== key)
      : [...prevLog, key]

    setState(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === productId ? { ...p, usageLog: newLog } : p
      ),
    }))

    mutating.current++
    try {
      const { error } = await supabase.from('products').update({ usage_log: newLog }).eq('id', productId)
      if (error) throw error
    } catch (e) {
      console.error('Toggle usage failed:', e)
      setState(prev => ({
        ...prev,
        products: prev.products.map(p =>
          p.id === productId ? { ...p, usageLog: prevLog } : p
        ),
      }))
    } finally {
      mutating.current--
    }
  }, [])

  const toggleProductUseToday = useCallback((productId, section) => {
    return toggleProductUseDate(productId, section, todayKey())
  }, [toggleProductUseDate])

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
      timeOfDay: '',
      caution: [],
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

  const updateProduct = useCallback(async (id, patch) => {
    let prevProducts = null
    setState(prev => {
      prevProducts = prev.products
      return { ...prev, products: prev.products.map(p => p.id === id ? { ...p, ...patch } : p) }
    })
    mutating.current++
    try {
      const base = prevProducts?.find(p => p.id === id)
      if (base) {
        const { error } = await supabase.from('products').update(productToRow({ ...base, ...patch }, userId)).eq('id', id)
        if (error) throw error
      }
    } catch (e) {
      console.error('Update product failed:', e)
      if (prevProducts) setState(prev => ({ ...prev, products: prevProducts }))
    } finally {
      mutating.current--
    }
  }, [userId])

  const deleteProduct = useCallback(async (id) => {
    let prevState = null
    setState(prev => {
      prevState = prev
      const routineGroups = prev.routineGroups.map(g => ({
        ...g,
        dayItems: g.dayItems.filter(pid => pid !== id),
        nightItems: g.nightItems.filter(pid => pid !== id),
      }))
      return { ...prev, products: prev.products.filter(p => p.id !== id), routineGroups }
    })
    mutating.current++
    try {
      // Groups that referenced this product need updating
      const affectedGroups = (prevState?.routineGroups || []).filter(g =>
        g.dayItems.includes(id) || g.nightItems.includes(id)
      )
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      await Promise.all(affectedGroups.map(g =>
        supabase.from('routine_groups').update({
          day_items: g.dayItems.filter(pid => pid !== id),
          night_items: g.nightItems.filter(pid => pid !== id),
        }).eq('id', g.id)
      ))
    } catch (e) {
      console.error('Delete product failed:', e)
      if (prevState) setState(prevState)
    } finally {
      mutating.current--
    }
  }, [])

  // ── Routine Groups ─────────────────────────────────────────
  const addGroup = useCallback(async (name, notes = '') => {
    const newGroup = {
      id: Date.now().toString(),
      name: name || '新組別',
      notes: notes || '',
      dayItems: [],
      nightItems: [],
      sortOrder: Math.floor(Date.now() / 1000),
    }
    setState(prev => ({ ...prev, routineGroups: [...prev.routineGroups, newGroup] }))
    const { error } = await supabase.from('routine_groups').insert(groupToRow(newGroup, userId))
    if (error) {
      console.error('Group insert failed:', error)
      setState(prev => ({ ...prev, routineGroups: prev.routineGroups.filter(g => g.id !== newGroup.id) }))
    }
    return newGroup.id
  }, [userId])

  const updateGroup = useCallback(async (id, patch) => {
    let prevGroup = null
    setState(prev => {
      const routineGroups = prev.routineGroups.map(g => {
        if (g.id !== id) return g
        prevGroup = g
        return { ...g, ...patch }
      })
      return { ...prev, routineGroups }
    })
    const row = {}
    if (patch.name !== undefined) row.name = patch.name
    if (patch.dayItems !== undefined) row.day_items = patch.dayItems
    if (patch.nightItems !== undefined) row.night_items = patch.nightItems
    if (Object.keys(row).length > 0) {
      const { error } = await supabase.from('routine_groups').update(row).eq('id', id)
      if (error) {
        console.error('Group update failed:', error)
        if (prevGroup) {
          setState(prev => ({
            ...prev,
            routineGroups: prev.routineGroups.map(g => g.id === id ? prevGroup : g),
          }))
        }
      }
    }
  }, [])

  const deleteGroup = useCallback(async (id) => {
    let prevGroups = null
    setState(prev => {
      prevGroups = prev.routineGroups
      return { ...prev, routineGroups: prev.routineGroups.filter(g => g.id !== id) }
    })
    mutating.current++
    try {
      const { error } = await supabase.from('routine_groups').delete().eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error('Delete group failed:', e)
      if (prevGroups) setState(prev => ({ ...prev, routineGroups: prevGroups }))
    } finally {
      mutating.current--
    }
  }, [])

  // ── Settings ───────────────────────────────────────────────
  const updateSettings = useCallback(async (patch) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...patch } }))
    await supabase.from('user_settings').upsert({
      user_id: userId,
      user_name: patch.userName,
    }, { onConflict: 'user_id' })
  }, [userId])

  const updateTrackerOrder = useCallback(async (section, order) => {
    const stateKey = section === 'am' ? 'trackerAmOrder' : 'trackerPmOrder'
    const dbKey   = section === 'am' ? 'tracker_am_order' : 'tracker_pm_order'
    setState(prev => ({ ...prev, settings: { ...prev.settings, [stateKey]: order } }))
    await supabase.from('user_settings').upsert(
      { user_id: userId, [dbKey]: order },
      { onConflict: 'user_id' }
    )
  }, [userId])

  return {
    state,
    loading,
    groupDays,
    setGroupTargetDays,
    toggleProductUseDate,
    toggleProductUseToday,
    addProduct,
    updateProduct,
    deleteProduct,
    addGroup,
    updateGroup,
    deleteGroup,
    updateSettings,
    updateTrackerOrder,
  }
}
