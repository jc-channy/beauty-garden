import React, { useState, useRef } from 'react'
import { CATEGORY_COLORS } from '../store/useStore.js'

// ── Draggable list ────────────────────────────────────────────
function DraggableList({ items, renderItem, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const listRef = useRef(null)
  const itemHeightsRef = useRef([])

  function getIndexFromY(clientY) {
    const rects = Array.from(listRef.current?.children || []).map(el => el.getBoundingClientRect())
    for (let i = 0; i < rects.length; i++) {
      if (clientY < rects[i].bottom) return i
    }
    return rects.length - 1
  }

  function handleTouchStart(e, index) {
    e.stopPropagation()
    setDragIndex(index)
    setOverIndex(index)
  }

  function handleTouchMove(e) {
    if (dragIndex === null) return
    e.preventDefault()
    const touch = e.touches[0]
    const idx = getIndexFromY(touch.clientY)
    setOverIndex(idx)
  }

  function handleTouchEnd() {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const newItems = [...items]
      const [moved] = newItems.splice(dragIndex, 1)
      newItems.splice(overIndex, 0, moved)
      onReorder(newItems)
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div ref={listRef} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {items.map((item, index) => {
        const isDragging = dragIndex === index
        const isOver = overIndex === index && dragIndex !== null && dragIndex !== index
        return (
          <div key={item.id || index} style={{
            opacity: isDragging ? 0.4 : 1,
            borderTop: isOver && dragIndex > index ? '2px solid #A8C8A0' : 'none',
            borderBottom: isOver && dragIndex < index ? '2px solid #A8C8A0' : 'none',
            transition: 'opacity 0.15s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0' }}>
              {/* Drag handle */}
              <div
                onTouchStart={e => handleTouchStart(e, index)}
                style={{
                  fontSize: 16, color: 'var(--text-muted)', cursor: 'grab',
                  padding: '4px 6px', userSelect: 'none', touchAction: 'none',
                  flexShrink: 0,
                }}
              >⠿</div>
              {renderItem(item, index)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Product picker sheet ──────────────────────────────────────
function ProductPicker({ products, excludeIds, onAdd, onClose }) {
  const available = products.filter(p => !excludeIds.has(p.id))
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-handle" />
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 14 }}>選擇保養品</div>
        {available.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            所有產品已加入
          </div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {available.map(p => {
              const name = p.nickname || p.name || p.brand || '未命名'
              const sub = p.nickname ? [p.brand, p.name].filter(Boolean).join(' · ') : ''
              return (
                <div key={p.id} onClick={() => { onAdd(p.id); onClose() }} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 2px', borderBottom: '0.5px solid var(--border-soft)',
                  cursor: 'pointer',
                }}>
                  {p.imagePreview ? (
                    <img src={p.imagePreview} alt={name} style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🧴</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{name}</div>
                    {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
                    {p.category && (() => {
                      const c = CATEGORY_COLORS[p.category] || { bg: '#EEE', text: '#666' }
                      return <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: c.bg, color: c.text, fontWeight: 500, display: 'inline-block', marginTop: 2 }}>{p.category}</span>
                    })()}
                  </div>
                  <span style={{ fontSize: 18, color: '#7AAA6A' }}>＋</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六']

// ── Group card ────────────────────────────────────────────────
function GroupCard({ group, products, onUpdate, onDelete, groupDays, setGroupTargetDays }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(group.name)
  const [notesVal, setNotesVal] = useState(group.notes || '')
  const [picker, setPicker] = useState(null) // 'day' | 'night' | null
  const [confirmDelete, setConfirmDelete] = useState(false)

  function resolveItems(ids) {
    return (ids || []).map(id => products.find(p => p.id === id)).filter(Boolean)
  }

  const dayProducts = resolveItems(group.dayItems)
  const nightProducts = resolveItems(group.nightItems)

  function removeFromSection(section, productId) {
    const key = section === 'day' ? 'dayItems' : 'nightItems'
    const current = group[key] || []
    onUpdate(group.id, { [key]: current.filter(id => id !== productId) })
  }

  function addToSection(section, productId) {
    const key = section === 'day' ? 'dayItems' : 'nightItems'
    const current = group[key] || []
    if (!current.includes(productId)) {
      onUpdate(group.id, { [key]: [...current, productId] })
    }
  }

  function reorderSection(section, newItems) {
    const key = section === 'day' ? 'dayItems' : 'nightItems'
    onUpdate(group.id, { [key]: newItems.map(p => p.id) })
  }

  function saveEdit() {
    if (!nameVal.trim()) return
    onUpdate(group.id, { name: nameVal.trim(), notes: notesVal.trim() })
    setEditing(false)
  }

  const allInGroup = new Set([...(group.dayItems || []), ...(group.nightItems || [])])

  return (
    <div className="card" style={{ marginBottom: 10, padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 14px', cursor: 'pointer',
        }}
        onClick={() => setExpanded(s => !s)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                autoFocus
                type="text"
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                style={{ fontSize: 14, fontWeight: 500, padding: '5px 8px' }}
                placeholder="組別名稱"
              />
              <input
                type="text"
                value={notesVal}
                onChange={e => setNotesVal(e.target.value)}
                style={{ fontSize: 12, padding: '5px 8px' }}
                placeholder="備註（選填）"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <button onClick={saveEdit} style={{
                  flex: 1, padding: '7px 0', borderRadius: 10, border: 'none',
                  background: '#D7DFD2', color: '#5A7A52', fontSize: 13, cursor: 'pointer', fontWeight: 500,
                }}>儲存</button>
                <button onClick={() => { setEditing(false); setNameVal(group.name); setNotesVal(group.notes || '') }} style={{
                  flex: 1, padding: '7px 0', borderRadius: 10, border: '0.5px solid var(--border-soft)',
                  background: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
                }}>取消</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
                {group.name}
              </div>
              {group.notes && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{group.notes}</div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                早上 {dayProducts.length} 步 · 晚上 {nightProducts.length} 步
              </div>
            </>
          )}
        </div>
        {!editing && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
            ▾
          </div>
        )}
      </div>

      {/* Expanded content */}
      {expanded && !editing && (
        <div style={{ borderTop: '0.5px solid var(--border-soft)', padding: '12px 14px' }}>
          {/* AM section */}
          <SectionBlock
            title="🌤 早上"
            items={dayProducts}
            onRemove={id => removeFromSection('day', id)}
            onAdd={() => setPicker('day')}
            onReorder={items => reorderSection('day', items)}
          />

          {/* PM section */}
          <SectionBlock
            title="🌙 晚上"
            items={nightProducts}
            onRemove={id => removeFromSection('night', id)}
            onAdd={() => setPicker('night')}
            onReorder={items => reorderSection('night', items)}
          />

          {/* Day-of-week picker */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>套用星期（自動顯示）</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {DOW_LABELS.map((label, dow) => {
                const sel = (groupDays[group.id] || []).includes(dow)
                return (
                  <button key={dow} onClick={() => {
                    const cur = groupDays[group.id] || []
                    const next = sel ? cur.filter(d => d !== dow) : [...cur, dow]
                    setGroupTargetDays(group.id, next)
                  }} style={{
                    flex: 1, height: 34, borderRadius: 8, border: '0.5px solid',
                    borderColor: sel ? '#A8C8A0' : 'var(--border-soft)',
                    background: sel ? '#EEF4EC' : 'var(--bg-surface)',
                    color: sel ? '#5A7A52' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: sel ? 600 : 400, cursor: 'pointer',
                  }}>{label}</button>
                )
              })}
            </div>
          </div>

          {/* Group actions */}
          {!confirmDelete ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button onClick={() => { setEditing(true); setExpanded(true) }} style={{
                flex: 1, padding: '8px 0', borderRadius: 10,
                background: 'var(--bg-surface)', border: '0.5px solid var(--border-soft)',
                fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
              }}>✎ 編輯名稱</button>
              <button onClick={() => setConfirmDelete(true)} style={{
                flex: 1, padding: '8px 0', borderRadius: 10,
                background: 'var(--bg-surface)', border: '0.5px solid var(--border-soft)',
                fontSize: 13, color: '#C06060', cursor: 'pointer',
              }}>✕ 刪除組別</button>
            </div>
          ) : (
            <div style={{ marginTop: 6, padding: '10px 12px', background: '#FFF5F5', borderRadius: 10, border: '0.5px solid #E8C0C0' }}>
              <div style={{ fontSize: 13, color: '#7A3030', marginBottom: 8 }}>確定要刪除「{group.name}」？</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onDelete(group.id)} style={{
                  flex: 1, padding: '7px 0', borderRadius: 8,
                  background: '#C06060', border: 'none', color: '#fff',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>確認刪除</button>
                <button onClick={() => setConfirmDelete(false)} style={{
                  flex: 1, padding: '7px 0', borderRadius: 8,
                  background: 'var(--bg-surface)', border: '0.5px solid var(--border-soft)',
                  fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer',
                }}>取消</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product picker */}
      {picker && (
        <ProductPicker
          products={products}
          excludeIds={new Set(picker === 'day' ? (group.dayItems || []) : (group.nightItems || []))}
          onAdd={id => addToSection(picker, id)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}

function SectionBlock({ title, items, onRemove, onAdd, onReorder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{title}</div>
        <button onClick={onAdd} style={{
          fontSize: 12, color: '#7AAA6A', background: 'none', border: 'none',
          cursor: 'pointer', padding: '2px 6px',
        }}>＋ 加入</button>
      </div>

      {items.length === 0 ? (
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          border: '0.5px dashed var(--border-soft)',
          fontSize: 12, color: 'var(--text-muted)', textAlign: 'center',
        }}>尚未加入步驟</div>
      ) : (
        <DraggableList
          items={items}
          onReorder={onReorder}
          renderItem={(p) => {
            const name = p.nickname || p.name || p.brand || '未命名'
            return (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {p.imagePreview ? (
                  <img src={p.imagePreview} alt={name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🧴</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  {p.category && (() => {
                    const c = CATEGORY_COLORS[p.category] || { bg: '#EEE', text: '#666' }
                    return <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: c.bg, color: c.text, fontWeight: 500, display: 'inline-block', marginTop: 2 }}>{p.category}</span>
                  })()}
                </div>
                <button onClick={() => onRemove(p.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 18, padding: '2px 4px', flexShrink: 0,
                }}>×</button>
              </div>
            )
          }}
        />
      )}
    </div>
  )
}

// ── New group modal ───────────────────────────────────────────
function NewGroupModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  function handleAdd() {
    if (!name.trim()) return
    onAdd(name.trim(), notes.trim())
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>新增保養組別</div>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>組別名稱</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例：日常保養、美白日、休息日…"
          style={{ marginBottom: 12 }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>備註（選填）</label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="給自己的提醒…"
          style={{ marginBottom: 18 }}
        />
        <button className="btn-primary" onClick={handleAdd} disabled={!name.trim()} style={{ opacity: name.trim() ? 1 : 0.5 }}>
          建立組別
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function GroupsPage({ store, onBack }) {
  const { state, addGroup, updateGroup, deleteGroup, groupDays, setGroupTargetDays } = store
  const { products, routineGroups } = state
  const [showNew, setShowNew] = useState(false)

  async function handleAdd(name, notes) {
    await addGroup(name, notes)
  }

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 22, color: 'var(--text-secondary)', padding: '0 4px',
          lineHeight: 1,
        }}>‹</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>保養組別</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>管理你的早晚保養步驟</div>
        </div>
      </div>

      {routineGroups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🌸</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
            還沒有任何組別
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            建立不同的保養組合<br />
            例如「日常保養」「美白日」「肌膚休息日」
          </div>
        </div>
      )}

      {routineGroups.map(g => (
        <GroupCard
          key={g.id}
          group={g}
          products={products}
          onUpdate={updateGroup}
          onDelete={deleteGroup}
          groupDays={groupDays}
          setGroupTargetDays={setGroupTargetDays}
        />
      ))}

      <button
        className="btn-primary"
        onClick={() => setShowNew(true)}
        style={{ marginTop: 8 }}
      >
        ＋ 新增組別
      </button>

      {showNew && (
        <NewGroupModal
          onClose={() => setShowNew(false)}
          onAdd={handleAdd}
        />
      )}

      <div style={{ height: 24 }} />
    </div>
  )
}
