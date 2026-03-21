import { useState, useEffect, useRef, useCallback } from 'react'
import { Download, Maximize2, Video, Image as ImageIcon, Clock, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import api from '../../utils/api'

export default function PreviewArea({ 
  generating, 
  progress = 0, 
  estimatedTime,
  modelType,
  onRegenerate,
  isLoggedIn,
  onLogin,
  token,
  userApiKey
}) {
  const [tasks, setTasks] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const scrollRef = useRef(null)
  const eventSourceRef = useRef(null)

  const fetchTasks = useCallback(async (pageNum = 1, append = false) => {
    if (!userApiKey || loading) return
    
    setLoading(true)
    try {
      const res = await api.get('/ai-generate/tasks', {
        params: { page: pageNum, pageSize: 10 },
        headers: { 'X-API-Key': userApiKey }
      })
      
      if (res.data.success) {
        const newTasks = res.data.tasks || []
        if (append) {
          setTasks(prev => [...prev, ...newTasks])
        } else {
          setTasks(newTasks)
        }
        setHasMore(newTasks.length >= 10)
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [userApiKey, loading])

  useEffect(() => {
    if (isLoggedIn && userApiKey) {
      fetchTasks(1, false)
    }
  }, [isLoggedIn, userApiKey])

  useEffect(() => {
    if (!token || !isLoggedIn) return

    const eventSource = new EventSource(`/api/ai-generate/stream?token=${token}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[SSE] Received:', data)
        
        setTasks(prev => {
          const index = prev.findIndex(t => t.taskId === data.taskId)
          if (index > -1) {
            const updated = [...prev]
            updated[index] = { ...updated[index], ...data }
            return updated
          }
          return prev
        })
      } catch (err) {
        console.error('[SSE] Parse error:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('[SSE] Error:', err)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [token, isLoggedIn])

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loading) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchTasks(nextPage, true)
    }
  }, [hasMore, loading, page, fetchTasks])

  const handleDownload = (url) => {
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = `weiyuan-${Date.now()}.${url.includes('.mp4') ? 'mp4' : 'png'}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusDisplay = (status, progress) => {
    switch (status) {
      case 'completed':
        return { icon: <CheckCircle size={14} />, text: '已完成', color: '#22c55e' }
      case 'failed':
        return { icon: <XCircle size={14} />, text: '失败', color: '#ef4444' }
      case 'processing':
        return { icon: <Loader2 size={14} className="ai-spin" />, text: `生成中 ${progress || 0}%`, color: '#f59e0b' }
      default:
        return { icon: <Clock size={14} />, text: '排队中', color: '#6b7280' }
    }
  }

  const isVideo = (model) => {
    const modelLower = (model || '').toLowerCase()
    return modelLower.includes('video') || modelLower.includes('veo') || modelLower.includes('grok')
  }

  // 生成中状态
  if (generating) {
    const circumference = 2 * Math.PI * 36
    const strokeDashoffset = circumference - (progress / 100) * circumference
    
    return (
      <div className="ai-preview-area">
        <div className="ai-generating-overlay">
          <svg className="ai-progress-ring" width="80" height="80">
            <circle className="ai-progress-ring-bg" cx="40" cy="40" r="36" />
            <circle
              className="ai-progress-ring-progress"
              cx="40"
              cy="40"
              r="36"
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
          <div className="ai-generating-text">正在生成中...</div>
          {estimatedTime && <div className="ai-generating-time">预计剩余 {estimatedTime} 秒</div>}
        </div>
      </div>
    )
  }

  // 未登录状态
  if (!isLoggedIn) {
    return (
      <div className="ai-preview-area">
        <div className="ai-preview-empty">
          <div className="ai-preview-icon">
            <ImageIcon size={40} />
          </div>
          <div className="ai-preview-text">登录查看历史创作</div>
          <button className="ai-preview-login-btn" onClick={onLogin}>一键登录</button>
        </div>
      </div>
    )
  }

  // 历史记录列表
  return (
    <div className="ai-preview-area" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflow: 'auto', padding: '1rem' }}
      >
        {tasks.length === 0 && !loading && (
          <div className="ai-preview-empty">
            <div className="ai-preview-icon">
              {modelType === 'video' ? <Video size={40} /> : <ImageIcon size={40} />}
            </div>
            <div className="ai-preview-text">输入提示词开始创作</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tasks.map((task, index) => {
            const statusDisplay = getStatusDisplay(task.status, task.progress)
            const taskIsVideo = isVideo(task.model)

            return (
              <div 
                key={task.id || index}
                className="ai-task-card"
                style={{
                  background: 'var(--ai-bg-panel)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  border: '1px solid var(--ai-border-color)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: statusDisplay.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {statusDisplay.icon}
                    <span style={{ fontSize: '0.75rem' }}>{statusDisplay.text}</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ai-text-secondary)' }}>
                    {task.model}
                  </span>
                </div>

                {task.resultUrl && task.status === 'completed' && (
                  <div 
                    style={{ 
                      position: 'relative',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'var(--ai-bg-secondary)'
                    }}
                    onClick={() => setSelectedImage(task.resultUrl)}
                  >
                    {taskIsVideo ? (
                      <video 
                        src={task.resultUrl} 
                        style={{ width: '100%', display: 'block' }}
                        controls
                      />
                    ) : (
                      <img 
                        src={task.resultUrl} 
                        alt="生成结果"
                        style={{ width: '100%', display: 'block' }}
                      />
                    )}
                    
                    {!taskIsVideo && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          display: 'flex',
                          gap: '0.25rem'
                        }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedImage(task.resultUrl); }}
                          style={{
                            background: 'rgba(0,0,0,0.6)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.375rem',
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <Maximize2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(task.resultUrl); }}
                          style={{
                            background: 'rgba(0,0,0,0.6)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.375rem',
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {task.status === 'failed' && task.errorMessage && (
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>
                    {task.errorMessage}
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{task.prompt?.substring(0, 50)}{task.prompt?.length > 50 ? '...' : ''}</span>
                  <span>{new Date(task.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )
          })}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--ai-text-secondary)' }}>
            <RefreshCw size={16} className="ai-spin" style={{ marginRight: '0.5rem' }} />
            加载更多...
          </div>
        )}
      </div>

      {/* 图片放大模态框 */}
      {selectedImage && (
        <div 
          className="ai-image-modal"
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
        >
          <img 
            src={selectedImage} 
            alt="预览"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => handleDownload(selectedImage)}
            style={{
              position: 'absolute',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--ai-accent-green)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Download size={16} />
            下载图片
          </button>
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '2.5rem',
              height: '2.5rem',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.5rem'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}