import { useState } from 'react'
import { Settings2 } from 'lucide-react'

// 默认参数配置（当没有 paramConfig 时使用）
const IMAGE_RESOLUTIONS = [
  { value: '2k', label: '2K 高清' },
  { value: '1k', label: '1K 标准' },
  { value: '4k', label: '4K 超清' }
]

const IMAGE_ASPECT_RATIOS = [
  { value: '1:1', label: '1:1', desc: '正方形' },
  { value: '3:4', label: '3:4', desc: '竖版' },
  { value: '4:3', label: '4:3', desc: '横版' },
  { value: '9:16', label: '9:16', desc: '手机竖版' },
  { value: '16:9', label: '16:9', desc: '横屏' }
]

/**
 * 渲染不同类型的参数输入控件
 */
function ParamInput({ config, value, onChange }) {
  const { type, name, label, options, placeholder, min, max, step, description } = config
  
  switch (type) {
    case 'select':
      return (
        <div className="ai-param-item">
          <label className="ai-param-label">{label}</label>
          {description && <div className="ai-param-desc">{description}</div>}
          <div className="ai-param-options">
            {(options || []).map((opt) => {
              const optValue = typeof opt === 'object' ? opt.value : opt
              const optLabel = typeof opt === 'object' ? opt.label : String(opt)
              return (
                <div
                  key={optValue}
                  className={`ai-param-option ${String(value) === String(optValue) ? 'selected' : ''}`}
                  onClick={() => onChange(name, optValue)}
                >
                  {optLabel}
                </div>
              )
            })}
          </div>
        </div>
      )
      
    case 'number':
      return (
        <div className="ai-param-item">
          <label className="ai-param-label">{label}</label>
          {description && <div className="ai-param-desc">{description}</div>}
          <input
            type="number"
            className="ai-param-input"
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder={placeholder}
            min={min}
            max={max}
          />
        </div>
      )
      
    case 'slider':
      return (
        <div className="ai-param-item">
          <label className="ai-param-label">
            {label}: {value ?? config.default ?? min ?? 0}
          </label>
          {description && <div className="ai-param-desc">{description}</div>}
          <input
            type="range"
            className="ai-param-slider"
            value={value ?? config.default ?? min ?? 0}
            onChange={(e) => onChange(name, parseFloat(e.target.value))}
            min={min ?? 0}
            max={max ?? 1}
            step={step ?? 0.1}
          />
        </div>
      )
      
    case 'text':
      return (
        <div className="ai-param-item">
          <label className="ai-param-label">{label}</label>
          {description && <div className="ai-param-desc">{description}</div>}
          <input
            type="text"
            className="ai-param-input"
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
          />
        </div>
      )
      
    default:
      return null
  }
}

export default function ParamPanel({ modelType, params, onChange, paramConfig = [] }) {
  const isVideo = modelType === 'video'
  
  const updateParam = (key, value) => {
    onChange?.({ ...params, [key]: value })
  }
  
  // 如果有 paramConfig，使用它渲染参数
  const hasParamConfig = paramConfig && paramConfig.length > 0
  
  return (
    <div className="ai-param-section">
      <div className="ai-section-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings2 size={14} />
          参数设置
        </span>
      </div>
      
      <div className="ai-param-grid">
        {hasParamConfig ? (
          // 使用 paramConfig 渲染参数
          paramConfig.map((config) => (
            <ParamInput
              key={config.name}
              config={config}
              value={params[config.name] ?? config.default}
              onChange={updateParam}
            />
          ))
        ) : (
          // 默认参数配置
          <>
            {!isVideo && (
              <>
                <div className="ai-param-item">
                  <label className="ai-param-label">分辨率</label>
                  <div className="ai-param-options">
                    {IMAGE_RESOLUTIONS.map((res) => (
                      <div
                        key={res.value}
                        className={`ai-param-option ${params.resolution === res.value ? 'selected' : ''}`}
                        onClick={() => updateParam('resolution', res.value)}
                      >
                        {res.label}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="ai-param-item">
                  <label className="ai-param-label">画面比例</label>
                  <div className="ai-param-options" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    {IMAGE_ASPECT_RATIOS.map((ratio) => (
                      <div
                        key={ratio.value}
                        className={`ai-param-option ${params.aspectRatio === ratio.value ? 'selected' : ''}`}
                        onClick={() => updateParam('aspectRatio', ratio.value)}
                        title={ratio.desc}
                      >
                        {ratio.label}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {isVideo && (
              <>
                <div className="ai-param-item">
                  <label className="ai-param-label">分辨率</label>
                  <div className="ai-param-options">
                    {['1080P', '720P'].map((res) => (
                      <div
                        key={res}
                        className={`ai-param-option ${params.resolution === res ? 'selected' : ''}`}
                        onClick={() => updateParam('resolution', res)}
                      >
                        {res}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="ai-param-item">
                  <label className="ai-param-label">视频时长</label>
                  <div className="ai-param-options">
                    {[5, 10, 15].map((dur) => (
                      <div
                        key={dur}
                        className={`ai-param-option ${params.duration === dur ? 'selected' : ''}`}
                        onClick={() => updateParam('duration', dur)}
                      >
                        {dur} 秒
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
