import React from 'react'
import { todayKey, getStreak, getMonthlyRate, CATEGORY_COLORS } from '../store/useStore.js'

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

function CheckItem({ product, usedToday, onToggle }) {
  const displayName = product.nickname || product.name || product.brand || '未命名'
  const subName = product.nickname
    ? [product.brand, product.name].filter(Boolean).join(' ')
    : ''

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: usedToday ? '#F6FAF5' : 'var(--bg-card)',
        borderRadius: 14,
        border: `0.5px solid ${usedToday ? '#D0DFCA' : 'var(--border-soft)'}`,
        marginBottom: 6,
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onClick={() => onToggle(product.id)}
    >
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        border: `1.5px solid ${usedToday ? '#7AAA6A' : '#D8CCBF'}`,
        background: usedToday ? '#7AAA6A' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, color: '#fff',
        transition: 'all 0.2s',
      }}>
        {usedToday ? '✓' : ''}
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
        </div>
      </div>
    </div>
  )
}

function RoutineSection({ title, products, usedToday, onToggle, emptyMsg }) {
  const done = products.filter(p => usedToday.has(p.id)).length

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</div>
        {products.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {done} / {products.length}
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div style={{
          padding: '14px 14px', borderRadius: 14,
          border: '0.5px dashed var(--border-soft)',
          fontSize: 13, color: 'var(--text-muted)', textAlign: 'center',
        }}>
          {emptyMsg}
        </div>
      ) : (
        products.map(p => (
          <CheckItem
            key={p.id}
            product={p}
            usedToday={usedToday.has(p.id)}
            onToggle={onToggle}
          />
        ))
      )}
    </div>
  )
}

export default function HomePage({ store, onManageGroups }) {
  const { state, toggleProductUseToday, groupDays } = store
  const today = todayKey()
  const { products, routineGroups, settings } = state
  const streak = getStreak(products)
  const monthlyRate = getMonthlyRate(products)

  const [selectedGroupId, setSelectedGroupId] = React.useState(null)

  const groups = routineGroups || []
  const todayDow = new Date().getDay() // 0=Sun…6=Sat

  // Auto-select: find group assigned to today, else groups[0]
  const autoGroupId = React.useMemo(() => {
    const match = groups.find(g => (groupDays[g.id] || []).includes(todayDow))
    return match?.id ?? groups[0]?.id ?? null
  }, [groups, groupDays, todayDow])

  const effectiveGroupId = selectedGroupId ?? autoGroupId
  const selectedGroup = groups.find(g => g.id === effectiveGroupId) || null

  const usedTodaySet = new Set(
    products.filter(p => (p.usageLog || []).includes(today)).map(p => p.id)
  )

  // Resolve products in order for the selected group
  function resolveItems(ids) {
    return (ids || []).map(id => products.find(p => p.id === id)).filter(Boolean)
  }

  const amProducts = selectedGroup ? resolveItems(selectedGroup.dayItems) : []
  const pmProducts = selectedGroup ? resolveItems(selectedGroup.nightItems) : []

  const allGroupProductIds = new Set([...amProducts, ...pmProducts].map(p => p.id))
  const doneRoutine = [...allGroupProductIds].filter(id => usedTodaySet.has(id)).length
  const totalRoutine = allGroupProductIds.size

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 22 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
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
        {/* Manage button */}
        <button
          onClick={onManageGroups}
          style={{
            flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
            background: 'var(--bg-surface)', border: '0.5px solid var(--border-soft)',
            cursor: 'pointer', fontSize: 15, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="管理組別"
        >⚙</button>
      </div>

      {/* Stats */}
      {groups.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { num: `${doneRoutine}/${totalRoutine}`, label: '今日完成', unit: '' },
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

      {/* No products at all */}
      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '52px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🌿</div>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 6 }}>
            還沒有任何保養品
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            到下方「產品」頁面新增你的第一瓶<br />
            再來這裡建立組別安排順序
          </div>
        </div>
      )}

      {/* No group selected / no groups */}
      {products.length > 0 && groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🌸</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
            還沒有保養組別
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            點上方「建立第一個組別」<br />
            設定早晚保養順序
          </div>
        </div>
      )}

      {/* Routine sections */}
      {selectedGroup && (
        <>
          <RoutineSection
            title="🌤 早上保養"
            products={amProducts}
            usedToday={usedTodaySet}
            onToggle={toggleProductUseToday}
            emptyMsg="這個組別還沒有設定早上步驟"
          />
          <RoutineSection
            title="🌙 晚上保養"
            products={pmProducts}
            usedToday={usedTodaySet}
            onToggle={toggleProductUseToday}
            emptyMsg="這個組別還沒有設定晚上步驟"
          />
        </>
      )}

      <div style={{ height: 8 }} />
    </div>
  )
}
