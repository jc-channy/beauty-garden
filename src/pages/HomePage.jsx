import React from 'react'
import { todayKey, getStreak, getMonthlyRate } from '../store/useStore.js'

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
      {/* Check circle */}
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

      {/* Image */}
      {product.imagePreview && (
        <img src={product.imagePreview} alt={displayName} style={{
          width: 36, height: 36, borderRadius: 9, objectFit: 'cover',
          flexShrink: 0, border: '0.5px solid var(--border-soft)',
          opacity: usedToday ? 0.7 : 1,
        }} />
      )}

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500,
          color: usedToday ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: usedToday ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}>
          {displayName}
        </div>
        {(subName || product.category) && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            {[subName, product.category].filter(Boolean).join(' · ')}
          </div>
        )}
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
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{title}</div>
        {products.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {done} / {products.length}
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div style={{
          padding: '16px 14px', borderRadius: 14,
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

export default function HomePage({ store }) {
  const { state, toggleProductUseToday } = store
  const today = todayKey()
  const products = state.products
  const streak = getStreak(products)
  const monthlyRate = getMonthlyRate(products)

  const usedTodaySet = new Set(
    products.filter(p => (p.usageLog || []).includes(today)).map(p => p.id)
  )

  const amProducts = [...products]
    .filter(p => p.dayOrder !== null && p.dayOrder !== undefined)
    .sort((a, b) => a.dayOrder - b.dayOrder)

  const pmProducts = [...products]
    .filter(p => p.nightOrder !== null && p.nightOrder !== undefined)
    .sort((a, b) => a.nightOrder - b.nightOrder)

  const allRoutineProducts = new Set([...amProducts, ...pmProducts].map(p => p.id))
  const totalRoutine = allRoutineProducts.size
  const doneRoutine = [...allRoutineProducts].filter(id => usedTodaySet.has(id)).length

  const hasAnyRoutine = amProducts.length > 0 || pmProducts.length > 0

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 22 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: 4 }}>
          {formatHeader()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {getTimeGreeting(state.settings.userName)}
        </div>
        {streak > 1 && (
          <div style={{ fontSize: 12, color: '#9A7A5A', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>✦</span><span>已連續照顧自己 {streak} 天</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {hasAnyRoutine && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { num: `${doneRoutine}/${totalRoutine}`, label: '今日完成', unit: '' },
            { num: streak,        label: '連續天數', unit: '天' },
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

      {/* Empty state */}
      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '52px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🌿</div>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 6 }}>
            還沒有任何保養品
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            到下方「產品」頁面新增你的第一瓶<br />
            設定早晚順序後就會出現在這裡
          </div>
        </div>
      )}

      {/* No routine set state */}
      {products.length > 0 && !hasAnyRoutine && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🌸</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
            還沒設定保養順序
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            到「產品」頁面編輯保養品<br />
            設定早上／晚上的順序，就會顯示在這裡
          </div>
        </div>
      )}

      {/* AM routine */}
      {(amProducts.length > 0 || pmProducts.length > 0) && (
        <>
          <RoutineSection
            title="🌤 早上保養"
            products={amProducts}
            usedToday={usedTodaySet}
            onToggle={toggleProductUseToday}
            emptyMsg="沒有設定早上步驟"
          />

          <RoutineSection
            title="🌙 晚上保養"
            products={pmProducts}
            usedToday={usedTodaySet}
            onToggle={toggleProductUseToday}
            emptyMsg="沒有設定晚上步驟"
          />
        </>
      )}

      <div style={{ height: 8 }} />
    </div>
  )
}
