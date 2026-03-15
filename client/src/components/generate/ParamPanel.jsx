import { useState } from 'react'
import { Settings2 } from 'lucide-react'

const IMAGE_RESOLUTIONS = [
  { value: '2K', label: '2K 高清' },
  { value: '1080P', label: '1080P' },
  { value: '720P', label: '720P' }
]

const IMAGE_ASPECT_RATIOS = [
  { value: '3:4', label: '3:4', desc: '竖版' },
  { value: '16:9', label: '16:9', desc: '横向' },
  { value: '1:1', label: '1:1', desc: '正方形' },
  { value: '9:16', label: '9:16', desc: '纵向' },
  { value: '4:3', label: '4:3', desc: '标准' }
]

const IMAGE_COUNTS = [1, 2, 4]

const VIDEO_RESOLUTIONS = [
  { value: '1080P', label: '1080P' },
  { value: '720P', label: '720P' }
]

const VIDEO_DURATIONS = [
  { value: 5, label: '5 秒' },
  { value: 10, label: '10 秒' },
  { value: 15, label: '15 秒' }
]

const VIDEO_FPS = [24, 30, 60]

export default function ParamPanel({ modelType, params, onChange }) {
  const isVideo = modelType === 'video'
  
  const currentResolutions = isVideo ? VIDEO_RESOLUTIONS : IMAGE_RESOLUTIONS
  const currentParams = isVideo ? {
    resolution: params.resolution || '1080P',
    duration: params.duration || 5,
    fps: params.fps || 24
  } : {
    resolution: params.resolution || '2K',
    aspectRatio: params.aspectRatio || '3:4',
    numImages: params.numImages || 2
  }
  
  const updateParam = (key, value) => {
    onChange?.({ ...params, [key]: value })
  }
  
  return (
    <div className="ai-param-section">
      <div className="ai-section-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings2 size={14} />
          参数设置
        </span>
      </div>
      
      <div className="ai-param-grid">
        {/* 分辨率 */}
        <div className="ai-param-item">
          <label className="ai-param-label">分辨率</label>
          <div className="ai-param-options">
            {currentResolutions.map((res) => (
              <div
                key={res.value}
                className={`ai-param-option ${currentParams.resolution === res.value ? 'selected' : ''}`}
                onClick={() => updateParam('resolution', res.value)}
              >
                {res.label}
              </div>
            ))}
          </div>
        </div>
        
        {/* 图片专属参数 */}
        {!isVideo && (
          <>
            {/* 比例 */}
            <div className="ai-param-item">
              <label className="ai-param-label">画面比例</label>
              <div className="ai-param-options" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {IMAGE_ASPECT_RATIOS.map((ratio) => (
                  <div
                    key={ratio.value}
                    className={`ai-param-option ${currentParams.aspectRatio === ratio.value ? 'selected' : ''}`}
                    onClick={() => updateParam('aspectRatio', ratio.value)}
                    title={ratio.desc}
                  >
                    {ratio.label}
                  </div>
                ))}
              </div>
            </div>
            
            {/* 数量 */}
            <div className="ai-param-item">
              <label className="ai-param-label">生成数量</label>
              <div className="ai-param-options">
                {IMAGE_COUNTS.map((count) => (
                  <div
                    key={count}
                    className={`ai-param-option ${currentParams.numImages === count ? 'selected' : ''}`}
                    onClick={() => updateParam('numImages', count)}
                  >
                    {count}张
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        {/* 视频专属参数 */}
        {isVideo && (
          <>
            {/* 时长 */}
            <div className="ai-param-item">
              <label className="ai-param-label">视频时长</label>
              <div className="ai-param-options">
                {VIDEO_DURATIONS.map((dur) => (
                  <div
                    key={dur.value}
                    className={`ai-param-option ${currentParams.duration === dur.value ? 'selected' : ''}`}
                    onClick={() => updateParam('duration', dur.value)}
                  >
                    {dur.label}
                  </div>
                ))}
              </div>
            </div>
            
            {/* FPS */}
            <div className="ai-param-item">
              <label className="ai-param-label">帧率 (FPS)</label>
              <div className="ai-param-options">
                {VIDEO_FPS.map((fps) => (
                  <div
                    key={fps}
                    className={`ai-param-option ${currentParams.fps === fps ? 'selected' : ''}`}
                    onClick={() => updateParam('fps', fps)}
                  >
                    {fps}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}