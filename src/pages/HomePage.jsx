import React from 'react'
import { todayKey, localDateStr, getStreak, getMonthlyRate, CATEGORY_COLORS, isUsedOnDate } from '../store/useStore.js'

const DOW = ['日', '一', '二', '三', '四', '五', '六']

function getTimeGreeting(userName) {
  const h = new Date().getHours()
  const name = userName ? `${userName}，` : ''
  if (h >= 5  && h < 12) return `早安，${name}從哪裡開始 ✿`
  if (h >= 12 && h < 18) return `${name}下午也記得照顧自己 ✿`
  if (h >= 18 && h < 22) return `${name}保養時間到了 ✿`
  return `${name}終於到你的時間了 ✿`
}

function formatHeader() {
  const d = new Date()
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dy = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${mo}.${dy} 星期${days[d.getDay()]}`
}

// ── Date strip ────────────────────────────────────────────────
function DateStrip({ selectedDate, onSelect }) {
  const stripRef = React.useRef(null)
  const todayStr = todayKey()

  // Past 60 days ending at today
  const dates = React.useMemo(() => {
    const today = new Date()
    const list = []
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      list.push(localDateStr(d))
    }
    return list
  }, [])

  // Scroll selected date into view
  React.useEffect(() => {
    if (!stripRef.current) return
    const idx = dates.indexOf(selectedDate)
    if (idx < 0) return
    const chip = stripRef.current.children[idx]
    if (chip) chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedDate, dates])

  return (
    <div
      ref={stripRef}
      style={{
        display: 'flex', gap: 5, overflowX: 'auto',
        paddingBottom: 4, scrollbarWidth: 'none',
        marginBottom: 16,
      }}
    >
      {dates.map(d => {
        const isToday = d === todayStr
        const isSelected = d === selectedDate
        const dow = new Date(d + 'T12:00:00').getDay()
        return (
          <button
            key={d}
            onClick={() => onSelect(d)}
            style={{
              flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '5px 7px', borderRadius: 10, cursor: 'pointer',
              background: isSelected ? '#EEF4EC' : 'transparent',
              border: `0.5px solid ${isSelected ? '#A8C8A0' : 'transparent'}`,
              minWidth: 40, gap: 2,
            }}
          >
            <span style={{
              fontSize: 10,
              color: isSelected ? '#5A7A52' : isToday ? '#9A7A5A' : 'var(--text-muted)',
              fontWeight: isSelected || isToday ? 600 : 400,
            }}>
              {isToday ? '今' : DOW[dow]}
            </span>
            <span style={{
              fontSize: 15,
              fontWeight: isSelected ? 600 : 400,
              color: isSelected ? '#5A7A52' : isToday ? '#9A7A5A' : 'var(--text-primary)',
            }}>
              {d.slice(8, 10)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Check item with swipe gesture ────────────────────────────
function CheckItem({ product, usedToday, onToggle, section, index }) {
  const displayName = product.nickname || product.name || product.brand || '未命名'
  const subName = product.nickname
    ? [product.brand, product.name].filter(Boolean).join(' ')
    : ''

  const mismatch = section && product.timeOfDay &&
    ((section === 'am' && product.timeOfDay === 'pm') ||
     (section === 'pm' && product.timeOfDay === 'am'))

  // Swipe state
  const touchRef = React.useRef(null)
  const [swipeX, setSwipeX] = React.useState(0)

  function handleTouchStart(e) {
    touchRef.current = { startX: e.touches[0].clientX, handled: false }
    setSwipeX(0)
  }

  function handleTouchMove(e) {
    if (!touchRef.current) return
    const dx = e.touches[0].clientX - touchRef.current.startX
    // Only show visual feedback for horizontal swipe
    if (Math.abs(dx) > 10) setSwipeX(dx)
  }

  function handleTouchEnd(e) {
    if (!touchRef.current) return
    const dx = e.changedTouches[0].clientX - touchRef.current.startX
    touchRef.current.handled = true
    setSwipeX(0)
    if (dx > 44) {
      // Swipe right → mark done (if not already)
      if (!usedToday) onToggle()
    } else if (dx < -44) {
      // Swipe left → unmark (if currently done)
      if (usedToday) onToggle()
    }
    // Short tap → no action (swipe only)
  }

  function handleClick(e) {
    // Swipe gesture already handled by touch — suppress click
    if (touchRef.current?.handled) {
      touchRef.current = null
    }
  }

  // Visual swipe offset clamped to ±60px
  const clampedX = Math.max(-60, Math.min(60, swipeX))
  const swipingRight = clampedX > 10
  const swipingLeft  = clampedX < -10

  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 14, marginBottom: 6,
      }}
    >
      {/* Swipe hint background */}
      {swipingRight && (
        <div style={{
          position: 'absolute', inset: 0, background: '#EEF4EC',
          borderRadius: 14, display: 'flex', alignItems: 'center', paddingLeft: 14,
        }}>
          <span style={{ fontSize: 16, color: '#5A7A52' }}>✓</span>
        </div>
      )}
      {swipingLeft && (
        <div style={{
          position: 'absolute', inset: 0, background: '#FFF0F0',
          borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 14,
        }}>
          <span style={{ fontSize: 14, color: '#C07070' }}>✕</span>
        </div>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px',
          background: usedToday ? '#F6FAF5' : 'var(--bg-card)',
          borderRadius: 14,
          border: `0.5px solid ${mismatch ? '#E8C080' : usedToday ? '#D0DFCA' : 'var(--border-soft)'}`,
          transition: clampedX !== 0 ? 'none' : 'all 0.2s',
          cursor: 'pointer',
          touchAction: 'pan-y',
          transform: `translateX(${clampedX}px)`,
          position: 'relative', zIndex: 1,
          userSelect: 'none',
        }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          border: `1.5px solid ${usedToday ? '#7AAA6A' : '#D8CCBF'}`,
          background: usedToday ? '#7AAA6A' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: usedToday ? 13 : 11, color: usedToday ? '#fff' : 'var(--text-muted)',
          fontWeight: 500,
          transition: 'all 0.2s',
        }}>
          {usedToday ? '✓' : (index ?? '')}
        </div>

        {product.imagePreview && (
          <img src={product.imagePreview} alt={displayName} style={{
            width: 36, height: 36, borderRadius: 9, objectFit: 'cover',
            flexShrink: 0, border: '0.5px solid var(--border-soft)',
            opacity: usedToday ? 0.7 : 1,
          }} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16, fontWeight: 500,
            color: usedToday ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: usedToday ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}>
            {displayName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' }}>
            {product.category && (() => {
              const c = CATEGORY_COLORS[product.category] || { bg: '#EEE', text: '#666' }
              return (
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 6,
                  background: c.bg, color: c.text, fontWeight: 500,
                }}>{product.category}</span>
              )
            })()}
            {subName && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subName}</span>}
            {mismatch && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#FEF0D0', color: '#9A6010', fontWeight: 500 }}>
                {product.timeOfDay === 'pm' ? '🌙 建議晚上用' : '☀️ 建議白天用'}
              </span>
            )}
          </div>
          {(product.caution || []).length > 0 && !usedToday && (
            <div style={{ fontSize: 11, color: '#9A6010', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
              <span>⚠️</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.caution[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RoutineSection({ title, products, selectedDate, onToggle, emptyMsg, defaultCollapsed, section }) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed ?? false)
  const done = products.filter(p => isUsedOnDate(p.usageLog, selectedDate, section)).length
  const allDone = products.length > 0 && done === products.length

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: collapsed ? 0 : 10,
          cursor: 'pointer', userSelect: 'none',
          padding: '4px 0',
        }}
        onClick={() => setCollapsed(s => !s)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</div>
          {allDone && <span style={{ fontSize: 11, color: '#5A8A50', background: '#EEF4EC', borderRadius: 6, padding: '1px 6px' }}>完成 ✓</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {products.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {done} / {products.length}
            </div>
          )}
          <span style={{
            fontSize: 12, color: 'var(--text-muted)',
            transition: 'transform 0.2s',
            transform: collapsed ? 'rotate(-90deg)' : 'none',
            display: 'inline-block',
          }}>▾</span>
        </div>
      </div>

      {!collapsed && (
        products.length === 0 ? (
          <div style={{
            padding: '14px 14px', borderRadius: 14,
            border: '0.5px dashed var(--border-soft)',
            fontSize: 13, color: 'var(--text-muted)', textAlign: 'center',
          }}>
            {emptyMsg}
          </div>
        ) : (
          products.map((p, idx) => (
            <CheckItem
              key={p.id}
              product={p}
              usedToday={isUsedOnDate(p.usageLog, selectedDate, section)}
              onToggle={() => onToggle(p.id, section)}
              section={section}
              index={idx + 1}
            />
          ))
        )
      )}
    </div>
  )
}

export default function HomePage({ store, onManageGroups }) {
  const { state, toggleProductUseDate, groupDays } = store
  const today = todayKey()
  const { products, routineGroups, settings } = state
  const streak = getStreak(products)
  const monthlyRate = getMonthlyRate(products)

  const [selectedDate, setSelectedDate] = React.useState(today)
  const [selectedGroupId, setSelectedGroupId] = React.useState(null)

  const groups = routineGroups || []
  const todayDow = new Date().getDay()

  const autoGroupId = React.useMemo(() => {
    const match = groups.find(g => (groupDays[g.id] || []).includes(todayDow))
    if (match) return match.id
    const anyConfigured = groups.some(g => (groupDays[g.id] || []).length > 0)
    return anyConfigured ? null : (groups[0]?.id ?? null)
  }, [groups, groupDays, todayDow])

  const effectiveGroupId = selectedGroupId ?? autoGroupId
  const selectedGroup = groups.find(g => g.id === effectiveGroupId) || null

  function resolveItems(ids) {
    return (ids || []).map(id => products.find(p => p.id === id)).filter(Boolean)
  }

  const amProducts = selectedGroup ? resolveItems(selectedGroup.dayItems) : []
  const pmProducts = selectedGroup ? resolveItems(selectedGroup.nightItems) : []

  const amDone = amProducts.filter(p => isUsedOnDate(p.usageLog, selectedDate, 'am')).length
  const pmDone = pmProducts.filter(p => isUsedOnDate(p.usageLog, selectedDate, 'pm')).length
  const doneRoutine = amDone + pmDone
  const totalRoutine = amProducts.length + pmProducts.length
  const allDone = totalRoutine > 0 && doneRoutine === totalRoutine

  // Toggle handler for selected date
  const handleToggle = React.useCallback((id, section) => {
    toggleProductUseDate(id, section, selectedDate)
  }, [toggleProductUseDate, selectedDate])

  // Before noon → collapse PM; noon onwards → collapse AM
  const hour = new Date().getHours()
  const isEvening = hour >= 12

  const isPastDate = selectedDate < today

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 22 }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: 4 }}>
          {formatHeader()}
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {getTimeGreeting(settings.userName)}
        </div>
        {streak > 1 && (
          <div style={{ fontSize: 12, color: '#9A7A5A', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>✦</span><span>已連續照顧自己 {streak} 天</span>
          </div>
        )}
      </div>

      {/* Date strip */}
      <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

      {/* Backfill indicator */}
      {isPastDate && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: '#9A6010',
          background: '#FDF6EC',
          borderRadius: 8, padding: '4px 10px',
          border: '0.5px solid #E8D4A8',
          marginBottom: 14,
        }}>
          <span>↩</span>
          <span>補打 {selectedDate.slice(5).replace('-', '/')} 的記錄</span>
          <button
            onClick={() => setSelectedDate(today)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: '#9A7A5A', padding: '0 0 0 4px',
              textDecoration: 'underline',
            }}
          >回今天</button>
        </div>
      )}

      {/* Group switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{
          flex: 1, display: 'flex', gap: 6, overflowX: 'auto',
          paddingBottom: 2, scrollbarWidth: 'none',
        }}>
          {groups.length === 0 ? (
            <button
              onClick={onManageGroups}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                border: '0.5px dashed var(--border-soft)',
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
                fontSize: 13, cursor: 'pointer',
              }}
            >＋ 建立第一個組別</button>
          ) : (
            groups.map(g => {
              const sel = g.id === effectiveGroupId
              const isAuto = g.id === autoGroupId
              return (
                <button key={g.id} onClick={() => setSelectedGroupId(g.id)} style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                  border: '0.5px solid',
                  borderColor: sel ? '#A8C8A0' : 'var(--border-soft)',
                  background: sel ? '#EEF4EC' : 'var(--bg-card)',
                  color: sel ? '#5A7A52' : 'var(--text-muted)',
                  fontSize: 13, cursor: 'pointer',
                  fontWeight: sel ? 500 : 400,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {isAuto && <span style={{ fontSize: 10, background: '#C8A87A', color: '#fff', borderRadius: 4, padding: '1px 4px' }}>今</span>}
                  {g.name}
                </button>
              )
            })
          )}
        </div>
        <button
          onClick={onManageGroups}
          style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 20,
            background: 'var(--bg-surface)', border: '0.5px solid var(--border-soft)',
            cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
          }}
        >管理</button>
      </div>

      {/* Group notes */}
      {selectedGroup?.notes && (
        <div style={{
          fontSize: 12, color: 'var(--text-muted)',
          background: 'var(--bg-surface)', borderRadius: 10,
          padding: '8px 12px', marginBottom: 14,
          border: '0.5px solid var(--border-soft)',
        }}>
          {selectedGroup.notes}
        </div>
      )}

      {/* No products */}
      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '52px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🌿</div>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 6 }}>
            還沒有任何保養品
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            到下方「我的」頁面新增你的第一瓶
          </div>
        </div>
      )}

      {/* Has products but no groups */}
      {products.length > 0 && groups.length === 0 && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 18,
          border: '0.5px solid var(--border-soft)',
          padding: '20px 18px',
          marginBottom: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🌸</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>
            你有 {products.length} 個保養品了！
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
            建立一個保養組別，設定早晚順序<br />
            就能在這裡一鍵打卡 ✓
          </div>
          <button
            onClick={onManageGroups}
            style={{
              padding: '11px 28px', borderRadius: 14, border: 'none',
              background: '#D7DFD2', color: '#3A6A30',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
          >
            立即建立保養流程 →
          </button>
        </div>
      )}

      {/* Routine sections */}
      {selectedGroup && (
        <>
          <RoutineSection
            title="🌤 早上保養"
            products={amProducts}
            selectedDate={selectedDate}
            onToggle={handleToggle}
            emptyMsg="這個組別還沒有設定早上步驟"
            defaultCollapsed={isEvening}
            section="am"
          />
          <RoutineSection
            title="🌙 晚上保養"
            products={pmProducts}
            selectedDate={selectedDate}
            onToggle={handleToggle}
            emptyMsg="這個組別還沒有設定晚上步驟"
            defaultCollapsed={!isEvening}
            section="pm"
          />
        </>
      )}

      {/* All-done banner (only for today) */}
      {allDone && selectedDate === today && (
        <div style={{
          background: '#EEF4EC',
          border: '0.5px solid #C0D8B8',
          borderRadius: 16,
          padding: '14px 18px',
          textAlign: 'center',
          marginBottom: 16,
          animation: 'fadeIn 0.4s ease',
        }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>🌿</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#3A6A30' }}>
            今天的保養完成了
          </div>
          {streak > 1 && (
            <div style={{ fontSize: 12, color: '#5A8A50', marginTop: 4 }}>
              連續 {streak} 天，繼續保持 ✦
            </div>
          )}
        </div>
      )}

      {/* Stats — always shows today's data */}
      {groups.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { num: `${doneRoutine}/${totalRoutine}`, label: selectedDate === today ? '今日完成' : '當日完成', unit: '' },
            { num: streak, label: '連續天數', unit: '天' },
            { num: `${monthlyRate}%`, label: '本月完成率', unit: '' },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1,
              background: 'var(--bg-card)',
              borderRadius: 14,
              border: '0.5px solid var(--border-soft)',
              padding: '11px 8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)' }}>
                {item.num}
                {item.unit && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 1 }}>{item.unit}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 8 }} />
    </div>
  )
}
