import { useState } from 'react'
import { Palette, Wand2 } from 'lucide-react'

const STYLE_PRESETS = [
  { label: '写实', value: 'photorealistic, highly detailed, 8k' },
  { label: '动漫', value: 'anime style, vibrant colors, clean lines' },
  { label: '油画', value: 'oil painting, textured brushstrokes, classical art' },
  { label: '水彩', value: 'watercolor painting, soft edges, translucent' },
  { label: '素描', value: 'pencil sketch, black and white, detailed shading' },
  { label: '赛博朋克', value: 'cyberpunk, neon lights, futuristic, high tech' },
  { label: '奇幻', value: 'fantasy art, magical, ethereal, mystical' },
  { label: '科幻', value: 'sci-fi, futuristic, space, technology' },
]

export default function PromptInput({ value, onChange, onInsertStyle }) {
  const [showPresets, setShowPresets] = useState(false)
  
  const handleInsertPreset = (presetValue) => {
    const newValue = value ? `${value}, ${presetValue}` : presetValue
    onChange?.(newValue)
    setShowPresets(false)
    onInsertStyle?.(presetValue)
  }
  
  return (
    <div className="ai-prompt-section">
      <div className="ai-section-title">
        <span>💬 提示词</span>
      </div>
      
      <textarea
        className="ai-prompt-textarea"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="描述你想要生成的画面内容，越详细越好...

例如：一只可爱的橘猫坐在窗台上，阳光透过窗帘洒在它身上，背景是温馨的房间，细节丰富，光线柔和"
        rows={5}
      />
      
      <div className="ai-prompt-tools">
        <div style={{ position: 'relative' }}>
          <button
            className="ai-tool-btn"
            onClick={() => setShowPresets(!showPresets)}
          >
            <Palette size={14} />
            风格词库
          </button>
          
          {showPresets && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              background: 'var(--ai-bg-elevated)',
              border: '1px solid var(--ai-border-color)',
              borderRadius: '8px',
              padding: '0.5rem',
              zIndex: 100,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.25rem',
              minWidth: '200px'
            }}>
              {STYLE_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleInsertPreset(preset.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: 'var(--ai-bg-secondary)',
                    border: '1px solid var(--ai-border-color)',
                    borderRadius: '6px',
                    color: 'var(--ai-text-secondary)',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--ai-bg-hover)'
                    e.target.style.color = 'var(--ai-text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--ai-bg-secondary)'
                    e.target.style.color = 'var(--ai-text-secondary)'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          className="ai-tool-btn"
          title="AI 反推描述 (根据图片生成提示词)"
        >
          <Wand2 size={14} />
          AI 反推
        </button>
      </div>
      
      {value && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.625rem',
          color: 'var(--ai-text-muted)',
          textAlign: 'right'
        }}>
          {value.length} 字符
        </div>
      )}
    </div>
  )
}