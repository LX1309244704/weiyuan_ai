import { useState } from 'react'
import { Palette, Camera } from 'lucide-react'

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

// 镜头类别 (FRAMING)
const FRAMING_OPTIONS = [
  { label: '大远景', value: 'ultra wide shot, 14mm lens, vast landscape', desc: '14mm 宏大开阔' },
  { label: '远景', value: 'wide shot, 24mm lens, establishing shot', desc: '24mm 环境全貌' },
  { label: '全景', value: 'full shot, 35mm lens, complete figure', desc: '35mm 完整身形' },
  { label: '中远景', value: 'medium wide shot, 50mm lens, knees up', desc: '50mm 膝盖以上' },
  { label: '中景', value: 'medium shot, 50mm lens, waist up', desc: '50mm 腰部以上' },
  { label: '特写', value: 'close up, 85mm lens, facial expression', desc: '85mm 面部神态' },
  { label: '大特写', value: 'extreme close up, 135mm lens, detail', desc: '135mm 五官细节' },
  { label: '微距', value: 'macro shot, 200mm lens, extreme detail', desc: '200mm 极致细节' },
]

// 物理角度 (PHYSICS)
const ANGLE_OPTIONS = [
  { label: '平视', value: 'eye level shot', desc: '客观平等视角' },
  { label: '俯视', value: 'high angle shot, looking down', desc: '展现渺小孤独' },
  { label: '仰视', value: 'low angle shot, looking up', desc: '突显高大威严' },
  { label: '上帝视角', value: 'bird\'s eye view, overhead shot', desc: '完全垂直俯瞰' },
]

// 运镜方式 (MOVEMENT)
const MOVEMENT_OPTIONS = [
  { label: '推镜头', value: 'dolly in, moving closer', desc: '靠近主体' },
  { label: '拉镜头', value: 'dolly out, moving away', desc: '远离主体' },
  { label: '左摇', value: 'pan left', desc: '向左旋转' },
  { label: '右摇', value: 'pan right', desc: '向右旋转' },
  { label: '左移', value: 'truck left', desc: '横向左移' },
  { label: '右移', value: 'truck right', desc: '横向右移' },
  { label: '升镜头', value: 'crane up', desc: '垂直上升' },
  { label: '降镜头', value: 'crane down', desc: '垂直下降' },
  { label: '跟随', value: 'tracking shot, following subject', desc: '跟随移动' },
]

export default function PromptInput({ value, onChange, onInsertStyle }) {
  const [showPresets, setShowPresets] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraTab, setCameraTab] = useState('framing')
  
  const handleInsertPreset = (presetValue) => {
    const newValue = value ? `${value}, ${presetValue}` : presetValue
    onChange?.(newValue)
    setShowPresets(false)
    onInsertStyle?.(presetValue)
  }

  const handleInsertCamera = (cameraValue) => {
    const newValue = value ? `${value}, ${cameraValue}` : cameraValue
    onChange?.(newValue)
    // 不关闭面板，方便多选
  }
  
  const renderCameraOptions = () => {
    let options = []
    let title = ''
    let color = ''
    
    switch (cameraTab) {
      case 'framing':
        options = FRAMING_OPTIONS
        title = '镜头类别 (FRAMING)'
        color = '#3b82f6'
        break
      case 'angle':
        options = ANGLE_OPTIONS
        title = '物理角度 (PHYSICS)'
        color = '#22c55e'
        break
      case 'movement':
        options = MOVEMENT_OPTIONS
        title = '运镜方式 (MOVEMENT)'
        color = '#f59e0b'
        break
    }
    
    return (
      <div style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        background: 'var(--ai-bg-elevated)',
        border: '1px solid var(--ai-border-color)',
        borderRadius: '12px',
        padding: '1rem',
        zIndex: 100,
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        minWidth: '400px',
        maxWidth: '500px'
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--ai-border-color)', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setCameraTab('framing')}
            style={{
              padding: '0.5rem 1rem',
              background: cameraTab === 'framing' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: cameraTab === 'framing' ? '#3b82f6' : 'var(--ai-text-secondary)',
              fontSize: '0.8rem',
              fontWeight: cameraTab === 'framing' ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }}></span>
            镜头类别
          </button>
          <button
            onClick={() => setCameraTab('angle')}
            style={{
              padding: '0.5rem 1rem',
              background: cameraTab === 'angle' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: cameraTab === 'angle' ? '#22c55e' : 'var(--ai-text-secondary)',
              fontSize: '0.8rem',
              fontWeight: cameraTab === 'angle' ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
            物理角度
          </button>
          <button
            onClick={() => setCameraTab('movement')}
            style={{
              padding: '0.5rem 1rem',
              background: cameraTab === 'movement' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: cameraTab === 'movement' ? '#f59e0b' : 'var(--ai-text-secondary)',
              fontSize: '0.8rem',
              fontWeight: cameraTab === 'movement' ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span>
            运镜方式
          </button>
        </div>
        
        {/* Section Title */}
        <div style={{ 
          fontSize: '0.7rem', 
          fontWeight: 600, 
          color: color, 
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          ● {title}
        </div>
        
        {/* Options Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem'
        }}>
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleInsertCamera(option.value)}
              style={{
                padding: '0.75rem',
                background: 'var(--ai-bg-secondary)',
                border: '1px solid var(--ai-border-color)',
                borderRadius: '10px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = color
                e.target.style.background = `${color}15`
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--ai-border-color)'
                e.target.style.background = 'var(--ai-bg-secondary)'
              }}
            >
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--ai-text-primary)',
                marginBottom: '0.25rem'
              }}>
                {option.label}
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: 'var(--ai-text-muted)'
              }}>
                {option.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
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
        
        <div style={{ position: 'relative' }}>
          <button
            className="ai-tool-btn"
            onClick={() => setShowCamera(!showCamera)}
            style={showCamera ? { background: 'var(--ai-accent-green)', color: '#000' } : {}}
          >
            <Camera size={14} />
            镜头语言
          </button>
          
          {showCamera && renderCameraOptions()}
        </div>
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