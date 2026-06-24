import React, { useState, useRef } from 'react'
import { todayKey, CATEGORIES, EFFECTS, CATEGORY_COLORS, EFFECT_COLORS } from '../store/useStore.js'

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

// ── Image resize ──────────────────────────────────────────────
function resizeImage(file, maxPx = 600, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(blobUrl)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = blobUrl
  })
}

// ── Frequency Picker ──────────────────────────────────────────
function FrequencyPicker({ form, setForm }) {
  const mode = form.frequencyMode || 'daily'

  function toggleDay(dow) {
    const current = form.targetDays || []
    const next = current.includes(dow) ? current.filter(d => d !== dow) : [...current, dow]
    setForm(f => ({ ...f, targetDays: next }))
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>使用頻率</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[
          { key: 'daily', label: '每天' },
          { key: 'days-of-week', label: '指定星期' },
          { key: 'times-per-week', label: '每週幾次' },
        ].map(opt => (
          <button key={opt.key} onClick={() => setForm(f => ({ ...f, frequencyMode: opt.key }))} style={{
            flex: 1, padding: '7px 4px', borderRadius: 10, fontSize: 12, border: '0.5px solid',
            borderColor: mode === opt.key ? '#C8A87A' : 'var(--border-soft)',
            background: mode === opt.key ? '#F2E6D9' : 'var(--bg-surface)',
            color: mode === opt.key ? '#8A6A40' : 'var(--text-muted)',
            cursor: 'pointer', fontWeight: mode === opt.key ? 500 : 400,
          }}>{opt.label}</button>
        ))}
      </div>

      {mode === 'days-of-week' && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>選擇要使用的日子</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {DAY_LABELS.map((label, dow) => {
              const sel = (form.targetDays || []).includes(dow)
              return (
                <button key={dow} onClick={() => toggleDay(dow)} style={{
                  width: 36, height: 36, borderRadius: '50%', border: '1px solid',
                  borderColor: sel ? '#D7DFD2' : 'var(--border-soft)',
                  background: sel ? '#EEF4EC' : 'var(--bg-surface)',
                  color: sel ? '#5A7A52' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: sel ? 600 : 400, cursor: 'pointer', flexShrink: 0,
                }}>{label}</button>
              )
            })}
          </div>
        </div>
      )}

      {mode === 'times-per-week' && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>每週目標次數</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setForm(f => ({ ...f, timesPerWeek: Math.max(1, (f.timesPerWeek || 3) - 1) }))} style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-surface)',
              border: '0.5px solid var(--border-soft)', fontSize: 20, cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>−</button>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 500, color: 'var(--text-primary)' }}>{form.timesPerWeek || 3}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>次 / 週</span>
            </div>
            <button onClick={() => setForm(f => ({ ...f, timesPerWeek: Math.min(7, (f.timesPerWeek || 3) + 1) }))} style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-surface)',
              border: '0.5px solid var(--border-soft)', fontSize: 20, cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>＋</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Add / Edit Product Modal ──────────────────────────────────
function ProductFormModal({ product, products, onClose, onSave, onDelete }) {
  const isEdit = Boolean(product)
  const fileRef = useRef()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [form, setForm] = useState({
    nickname:     product?.nickname     || '',
    brand:        product?.brand        || '',
    name:         product?.name         || '',
    category:     product?.category     || '',
    effects:      product?.effects      || [],
    imagePreview: product?.imagePreview || null,
  })

  async function handleFile(file) {
    if (!file) return
    const dataUrl = await resizeImage(file)
    setForm(f => ({ ...f, imagePreview: dataUrl }))
  }

  function toggleEffect(e) {
    setForm(f => ({
      ...f,
      effects: f.effects.includes(e) ? f.effects.filter(x => x !== e) : [...f.effects, e],
    }))
  }

  function handleSave() {
    const displayName = form.nickname || form.name || form.brand
    if (!displayName.trim()) return

    onSave({
      nickname:     form.nickname,
      brand:        form.brand,
      name:         form.name,
      category:     form.category,
      effects:      form.effects,
      imagePreview: form.imagePreview,
    })
    onClose()
  }

  const canSave = (form.nickname || form.name || form.brand).trim().length > 0

  const sectionLabel = {
    fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6,
  }
  const chipBtn = (selected) => ({
    padding: '5px 11px', borderRadius: 20, border: '0.5px solid', fontSize: 12, cursor: 'pointer',
    borderColor: selected ? '#C8A87A' : 'var(--border-soft)',
    background: selected ? '#F2E6D9' : 'var(--bg-surface)',
    color: selected ? '#8A6A40' : 'var(--text-muted)',
    fontWeight: selected ? 500 : 400,
    marginBottom: 5,
  })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <h3 style={{ fontSize: 17, fontWeight: 500, marginBottom: 18 }}>
          {isEdit ? '編輯保養品' : '新增保養品'}
        </h3>

        {/* Image */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 70, height: 70, borderRadius: 14, flexShrink: 0, cursor: 'pointer',
              background: form.imagePreview ? 'transparent' : 'var(--bg-surface)',
              border: '0.5px dashed var(--border-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
            }}
          >
            {form.imagePreview
              ? <img src={form.imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22 }}>📷</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>上傳</div>
                </div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <div style={{ flex: 1 }}>
            <label style={sectionLabel}>暱稱（首頁顯示）</label>
            <input type="text" value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} placeholder="例：早安維 C" style={{ marginBottom: 8 }} />
            <label style={sectionLabel}>品牌</label>
            <input type="text" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="品牌名稱" />
          </div>
        </div>

        <label style={sectionLabel}>產品名稱</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="完整產品名" style={{ marginBottom: 14 }} />

        {/* Category */}
        <label style={sectionLabel}>類別</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setForm(f => ({ ...f, category: f.category === cat ? '' : cat }))} style={chipBtn(form.category === cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Effects */}
        <label style={sectionLabel}>功效（可多選）</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 20 }}>
          {EFFECTS.map(e => (
            <button key={e} onClick={() => toggleEffect(e)} style={chipBtn(form.effects.includes(e))}>
              {e}
            </button>
          ))}
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={!canSave}
          style={{ opacity: canSave ? 1 : 0.5 }}>
          {isEdit ? '儲存' : '加入產品'}
        </button>

        {isEdit && onDelete && !showDeleteConfirm && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              marginTop: 10, width: '100%', padding: '11px 0', borderRadius: 14,
              background: 'none', border: '0.5px solid #E8C0C0',
              color: '#C06060', fontSize: 14, cursor: 'pointer',
            }}
          >
            刪除產品
          </button>
        )}
        {showDeleteConfirm && (
          <div style={{ marginTop: 10, padding: '12px 14px', background: '#FFF5F5', borderRadius: 14, border: '0.5px solid #E8C0C0' }}>
            <div style={{ fontSize: 13, color: '#7A3030', marginBottom: 10, textAlign: 'center' }}>
              確定要刪除「{product.nickname || product.name || '此產品'}」？
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { onDelete(product.id); onClose() }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  background: '#C06060', border: 'none', color: '#fff',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}
              >確認刪除</button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  background: 'var(--bg-surface)', border: '0.5px solid var(--border-soft)',
                  fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >取消</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product, products, onDelete, onUpdate }) {
  const [showEdit, setShowEdit] = useState(false)

  const today = todayKey()

  const displayName = product.nickname || product.name || product.brand || '未命名'
  const subLine = product.nickname
    ? [product.brand, product.name].filter(Boolean).join(' · ')
    : [product.brand].filter(Boolean).join('')

  return (
    <div className="card fade-in" style={{ padding: '13px 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        {/* Thumbnail */}
        {product.imagePreview ? (
          <img src={product.imagePreview} alt={displayName} style={{
            width: 52, height: 52, objectFit: 'cover', borderRadius: 12,
            flexShrink: 0, border: '0.5px solid var(--border-soft)',
          }} />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: 12, background: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0, border: '0.5px solid var(--border-soft)',
          }}>🧴</div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Category chip + Nickname on same line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                {product.category && (() => {
                  const c = CATEGORY_COLORS[product.category] || { bg: '#EEE', text: '#666' }
                  return <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: c.bg, color: c.text, fontWeight: 500, flexShrink: 0 }}>{product.category}</span>
                })()}
                <span style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {displayName}
                </span>
              </div>
              {/* Brand · name (secondary) */}
              {subLine && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>{subLine}</div>
              )}
              {/* Effect tags with individual colors */}
              {(product.effects || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                  {(product.effects || []).slice(0, 3).map(e => {
                    const ec = EFFECT_COLORS[e] || { bg: '#EEF4EC', text: '#5A7A52' }
                    return (
                      <span key={e} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: ec.bg, color: ec.text }}>{e}</span>
                    )
                  })}
                  {(product.effects || []).length > 3 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{product.effects.length - 3}</span>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setShowEdit(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, lineHeight: 1,
              padding: '6px 8px', flexShrink: 0, marginLeft: 4,
              borderRadius: 8,
            }}>✎</button>
          </div>

        </div>
      </div>

      {showEdit && (
        <ProductFormModal
          product={product}
          products={products}
          onClose={() => setShowEdit(false)}
          onSave={(patch) => onUpdate(product.id, patch)}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProductsPage({ store }) {
  const { state, addProduct, deleteProduct, updateProduct } = store
  const [showAdd, setShowAdd] = useState(false)
  const [activeCategory, setActiveCategory] = useState('全部')
  const [search, setSearch] = useState('')

  const categoryFilters = ['全部', ...CATEGORIES]

  const filtered = state.products.filter(p => {
    const matchCat = activeCategory === '全部' || p.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch = !q || [p.nickname, p.brand, p.name, p.category, ...(p.effects || [])]
      .some(s => (s || '').toLowerCase().includes(q))
    return matchCat && matchSearch
  })

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>我的產品</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{state.products.length} 個保養品</div>
      </div>

      <input
        type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="搜尋名稱、品牌、功效…" style={{ marginBottom: 12 }}
      />

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
        {categoryFilters.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: '0.5px solid',
            borderColor: activeCategory === cat ? '#C8A87A' : 'var(--border-soft)',
            background: activeCategory === cat ? '#F2E6D9' : 'var(--bg-card)',
            color: activeCategory === cat ? '#8A6A40' : 'var(--text-muted)',
            fontSize: 13, cursor: 'pointer', fontWeight: activeCategory === cat ? 500 : 400,
          }}>{cat}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🌿</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            {search ? '找不到符合的產品' : '還沒有任何產品'}
          </div>
          <div style={{ fontSize: 12 }}>點下方「＋」新增你的第一個保養品</div>
        </div>
      ) : (
        filtered.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            products={state.products}
            onDelete={deleteProduct}
            onUpdate={updateProduct}
          />
        ))
      )}

      <button
        onClick={() => setShowAdd(true)}
        style={{
          position: 'fixed',
          bottom: `calc(var(--tab-height) + var(--safe-bottom) + 16px)`,
          right: 20,
          width: 54, height: 54, borderRadius: '50%',
          background: '#D7DFD2', border: 'none', cursor: 'pointer',
          fontSize: 26, color: '#5A7A52',
          boxShadow: '0 4px 16px rgba(120,160,100,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 40, transition: 'transform 0.15s',
        }}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.92)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >＋</button>

      {showAdd && (
        <ProductFormModal
          products={state.products}
          onClose={() => setShowAdd(false)}
          onSave={addProduct}
        />
      )}
    </div>
  )
}
