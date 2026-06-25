import React, { useState } from 'react'

// Warm palette — cream → apricot → honey → mushroom → terracotta → rose
const SECTION_COLORS = [
  { bg: '#F2E6D9', text: '#8A6040' },
  { bg: '#F0D4B8', text: '#8A5030' },
  { bg: '#F0D898', text: '#7A5018' },
  { bg: '#E8C8A8', text: '#7A4828' },
  { bg: '#E8B898', text: '#7A3820' },
  { bg: '#F0C0A0', text: '#8A3820' },
]

const ROUTINES = {
  full: {
    label: '完整版',
    desc: '23 步驟',
    sections: [
      {
        title: '妝前準備',
        steps: [
          { step: 1,  name: '防曬乳',       note: 'SPF50+，全臉均勻塗抹，等待吸收 3 分鐘' },
          { step: 2,  name: '妝前乳',        note: '選擇控油或保濕款，T 字區重點按壓' },
          { step: 3,  name: '底妝定妝噴霧',  note: '輕噴全臉，幫助後續底妝服貼' },
        ],
      },
      {
        title: '底妝',
        steps: [
          { step: 4,  name: '遮瑕（黑眼圈）', note: '淡橘色系打底，三角形取量，輕拍暈開' },
          { step: 5,  name: '遮瑕（瑕疵）',   note: '偏白偏黃色系，點在痘疤、斑點後拍開' },
          { step: 6,  name: '粉底液',          note: '氣墊海綿由內往外拍，眉骨下方、眼周少量' },
          { step: 7,  name: '蜜粉定妝',        note: 'T 字重點壓，鼻側細刷帶一下，避免厚粉感' },
        ],
      },
      {
        title: '眉毛',
        steps: [
          { step: 8,  name: '修眉',     note: '順毛流刮去雜毛，確認眉形對稱' },
          { step: 9,  name: '描眉',     note: '眉筆輕描眉尾，眉粉填補眉心，製造漸層感' },
          { step: 10, name: '眉膠定型', note: '順毛流向上刷，固定眉毛位置' },
        ],
      },
      {
        title: '眼妝',
        steps: [
          { step: 11, name: '眼影底色',      note: '米膚色或香檳色，整個眼窩打底提亮' },
          { step: 12, name: '眼影（主色）',   note: '深咖或大地色，眼窩 1/2 暈染，後眼角加深' },
          { step: 13, name: '眼影（細節）',   note: '閃亮色點在眼頭 + 眉骨下方打亮' },
          { step: 14, name: '眼線（上）',     note: '貼著睫毛根部，眼尾拉出 2–3mm 小尾巴' },
          { step: 15, name: '眼線（下）',     note: '後 1/3 用咖啡色眼線，柔化整體' },
          { step: 16, name: '夾睫毛',         note: '分三段：根部、中段、尾端，各夾 10 秒' },
          { step: 17, name: '睫毛膏（上）',   note: '左右搖晃刷頭，Z 字刷上，根部重疊一次' },
          { step: 18, name: '睫毛膏（下）',   note: '刷頭直立輕刷，從根部往尾端帶' },
        ],
      },
      {
        title: '腮紅 & 輪廓',
        steps: [
          { step: 19, name: '修容',  note: '大刷由顴骨往下掃，強調輪廓即可，不過量' },
          { step: 20, name: '打亮',  note: '顴骨最高點、鼻樑、額頭中央、人中' },
          { step: 21, name: '腮紅',  note: '微笑肌往太陽穴方向輕掃，自然透感' },
        ],
      },
      {
        title: '唇妝 & 收尾',
        steps: [
          { step: 22, name: '唇妝',    note: '唇線筆描輪廓，再上唇膏或唇釉，唇中央可點亮色' },
          { step: 23, name: '定妝噴霧', note: '距臉 20cm 輕噴，提升持妝力，降低粉感' },
        ],
      },
    ],
  },

  simple: {
    label: '精簡版',
    desc: '9 步驟',
    sections: [
      {
        title: '底妝',
        steps: [
          { step: 1, name: '防曬',              note: 'SPF50+ 打底，可省去妝前乳' },
          { step: 2, name: 'BB霜／氣墊粉底',   note: '薄薄一層，輕鬆修飾膚色' },
          { step: 3, name: '局部遮瑕',          note: '只遮黑眼圈及明顯瑕疵' },
          { step: 4, name: '蜜粉定妝',          note: 'T 字輕壓，防油脫妝' },
        ],
      },
      {
        title: '眉眼',
        steps: [
          { step: 5, name: '描眉',   note: '填補空缺，稍加修飾即可' },
          { step: 6, name: '眼線',   note: '貼根部快速帶過，加深眼神' },
          { step: 7, name: '睫毛膏', note: '只刷上睫毛，快速定型' },
        ],
      },
      {
        title: '氣色 & 唇',
        steps: [
          { step: 8, name: '腮紅',  note: '蘋果肌輕掃，立刻提氣色' },
          { step: 9, name: '唇膏',  note: '直接塗抹，可省略唇線筆' },
        ],
      },
    ],
  },

  date: {
    label: '約會版',
    desc: '16 步驟',
    sections: [
      {
        title: '底妝',
        steps: [
          { step: 1,  name: '防曬乳',   note: 'SPF50+，確保持妝一整天' },
          { step: 2,  name: '妝前乳',   note: '選擇保濕款，讓底妝更水潤' },
          { step: 3,  name: '粉底液',   note: '中等覆蓋，展現無瑕底妝' },
          { step: 4,  name: '遮瑕',     note: '黑眼圈及重點瑕疵精準遮蓋' },
          { step: 5,  name: '蜜粉定妝', note: 'T 字局部壓粉，臉頰保留水潤感' },
        ],
      },
      {
        title: '眉毛',
        steps: [
          { step: 6,  name: '描眉',     note: '眉形自然流暢，製造漸層感' },
          { step: 7,  name: '眉膠定型', note: '確保全天不脫色' },
        ],
      },
      {
        title: '眼妝',
        steps: [
          { step: 8,  name: '眼影底色',    note: '香檳色或玫瑰金，整體打亮' },
          { step: 9,  name: '眼影（主色）', note: '暖棕或玫瑰色，製造電眼感' },
          { step: 10, name: '眼影（打亮）', note: '眼頭＋眉骨，增加立體度' },
          { step: 11, name: '眼線',         note: '上眼線加粗加深，眼尾稍微拉長' },
          { step: 12, name: '夾睫毛',       note: '三段夾，讓睫毛持久捲翹' },
          { step: 13, name: '睫毛膏',       note: '上下睫毛都刷，加強眼神' },
        ],
      },
      {
        title: '腮紅 & 輪廓',
        steps: [
          { step: 14, name: '腮紅',  note: '珊瑚粉或玫瑰色，自然紅潤甜美感' },
          { step: 15, name: '打亮',  note: '顴骨＋鼻樑，增加晶瑩剔透感' },
        ],
      },
      {
        title: '唇妝',
        steps: [
          { step: 16, name: '唇妝', note: '唇線描輪廓，填上玫瑰色或珊瑚色唇彩，唇中央可加一點亮唇釉' },
        ],
      },
    ],
  },
}

function StepItem({ step, color }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '0.5px solid var(--border-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: color.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 500, color: color.text,
          marginTop: 1,
        }}>{step.step}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: step.note ? 4 : 0 }}>{step.name}</div>
          {step.note && (
            <div style={{
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
              background: 'var(--bg-surface)', borderRadius: 8, padding: '6px 10px',
            }}>
              {step.note}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MakeupPage({ onBack }) {
  const [activeKey, setActiveKey] = useState('full')
  const routine = ROUTINES[activeKey]

  return (
    <div className="page-scroll fade-in" style={{ paddingTop: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: 'var(--text-secondary)', padding: '0 4px', lineHeight: 1,
          }}>‹</button>
        )}
        <div>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>化妝順序</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>每步驟附帶小技巧</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {Object.entries(ROUTINES).map(([key, r]) => {
          const sel = key === activeKey
          return (
            <button key={key} onClick={() => setActiveKey(key)} style={{
              flex: 1, padding: '9px 6px', borderRadius: 12, border: '0.5px solid',
              borderColor: sel ? '#C8A87A' : 'var(--border-soft)',
              background: sel ? '#F2E6D9' : 'var(--bg-card)',
              color: sel ? '#8A6A40' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: sel ? 500 : 400,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{ fontSize: 13 }}>{r.label}</span>
              <span style={{ fontSize: 11, opacity: 0.8 }}>{r.desc}</span>
            </button>
          )
        })}
      </div>

      {/* Sections */}
      {routine.sections.map((section, si) => {
        const color = SECTION_COLORS[si % SECTION_COLORS.length]
        return (
          <div key={si} style={{ marginBottom: 20 }}>
            {/* Colored section tag */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 12px', borderRadius: 20,
              background: color.bg, color: color.text,
              fontSize: 11, fontWeight: 500,
              marginBottom: 8,
            }}>
              {section.title}
            </div>
            <div className="card" style={{ padding: '0 14px' }}>
              {section.steps.map((step, i) => (
                <StepItem key={i} step={step} color={color} />
              ))}
            </div>
          </div>
        )
      })}

      <div style={{ height: 8 }} />
    </div>
  )
}
