import { useState } from 'react'
import { Download, RotateCcw, Share2, Maximize2, Video, Image as ImageIcon } from 'lucide-react'

export default function PreviewArea({ 
  generating, 
  progress = 0, 
  estimatedTime, 
  results = [], 
  modelType,
  onRegenerate,
  onDownload,
  isLoggedIn,
  onLogin 
}) {
  const [selectedResult, setSelectedResult] = useState(null)
  
  // 生成中状态
  if (generating) {
    const circumference = 2 * Math.PI * 36
    const strokeDashoffset = circumference - (progress / 100) * circumference
    
    return (
      <div className="ai-preview-area">
        <div className="ai-generating-overlay">
          <svg className="ai-progress-ring" width="80" height="80">
            <circle
              className="ai-progress-ring-bg"
              cx="40"
              cy="40"
              r="36"
            />
            <circle
              className="ai-progress-ring-progress"
              cx="40"
              cy="40"
              r="36"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset
              }}
            />
          </svg>
          <div className="ai-generating-text">正在生成中...</div>
          {estimatedTime && (
            <div className="ai-generating-time">预计剩余 {estimatedTime} 秒</div>
          )}
        </div>
      </div>
    )
  }
  
  // 有结果状态
  if (results && results.length > 0) {
    return (
      <div className="ai-preview-area">
        <div className="ai-preview-result">
          <div className="ai-preview-grid">
            {results.map((result, index) => (
              <div 
                key={index} 
                className="ai-preview-item ai-animate-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {modelType === 'video' ? (
                  <video
                    src={result.url}
                    controls
                    loop
                    onMouseEnter={(e) => e.target.play()}
                    onMouseLeave={(e) => {
                      e.target.pause()
                      e.target.currentTime = 0
                    }}
                  />
                ) : (
                  <img 
                    src={result.url} 
                    alt={`生成结果 ${index + 1}`} 
                  />
                )}
                
                <div className="ai-preview-actions">
                  <button
                    className="ai-preview-action-btn"
                    onClick={() => onDownload?.(result.url)}
                    title="下载"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="ai-preview-action-btn"
                    onClick={() => window.open(result.url, '_blank')}
                    title="全屏查看"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <button
                    className="ai-preview-action-btn"
                    title="分享"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 底部操作栏 */}
        <div 
          className="ai-footer-toolbar"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            borderTop: 'none'
          }}
        >
          <div className="ai-footer-left">
            <span style={{ fontSize: '0.75rem', color: 'var(--ai-text-secondary)' }}>
              {results.length} {modelType === 'video' ? '个视频' : '张图片'} 生成成功
            </span>
          </div>
          
          <button
            className="ai-tool-btn"
            onClick={onRegenerate}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--ai-bg-elevated)',
              border: '1px solid var(--ai-border-color)'
            }}
          >
            <RotateCcw size={14} />
            重新生成
          </button>
        </div>
      </div>
    )
  }
  
  // 空状态
  return (
    <div className="ai-preview-area">
      <div className="ai-preview-empty">
        <div className="ai-preview-icon">
          {modelType === 'video' ? (
            <Video size={40} />
          ) : (
            <ImageIcon size={40} />
          )}
        </div>
        
        {!isLoggedIn ? (
          <>
            <div className="ai-preview-text">登录查看历史创作</div>
            <button 
              className="ai-preview-login-btn"
              onClick={onLogin}
            >
              一键登录
            </button>
          </>
        ) : (
          <>
            <div className="ai-preview-text">输入提示词开始创作</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)' }}>
              AI 将根据你的描述生成{modelType === 'video' ? '视频' : '图片'}
            </div>
          </>
        )}
      </div>
    </div>
  )
}