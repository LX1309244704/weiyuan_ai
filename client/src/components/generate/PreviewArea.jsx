import { useState, useEffect, useRef, useCallback } from 'react'
import { Download, Maximize2, Video, Image as ImageIcon, Clock, Loader2, CheckCircle, XCircle, RefreshCw, Trash2 } from 'lucide-react'
import api from '../../utils/api'

export default function PreviewArea({ 
  generating, 
  progress = 0, 
  estimatedTime,
  modelType,
  onRegenerate,
  isLoggedIn,
  onLogin,
  userApiKey,
  token,
  externalTasks = [],
  onAddReference = null,
  onAddReferenceUrl = null,
  onUsePrompt = null  // 新增：使用提示词
}) {
  const [tasks, setTasks] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const scrollRef = useRef(null)
  const sseRef = useRef(null)
  const lastFetchRef = useRef(0)
  const tasksRef = useRef([])
  const sseTimerRef = useRef(null)

  const fetchTasks = useCallback(async (pageNum = 1, append = false) => {
    if (!userApiKey || loadingRef.current) return
    
    const now = Date.now()
    if (!append && now - lastFetchRef.current < 2000) return
    lastFetchRef.current = now
    
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await api.get('/ai-generate/tasks', {
        params: { page: pageNum, pageSize: 20 },
        headers: { 'X-API-Key': userApiKey }
      })
      
      if (res.data.success) {
        const newTasks = res.data.tasks || []
        
        if (append) {
          setTasks(prev => [...prev, ...newTasks])
        } else {
          setTasks(prev => {
            // 排除已经在显示的任务
            const existingIds = new Set(prev.map(t => t.taskId))
            // 也排除最近1分钟内创建的相同 prompt 的任务（避免重复添加刚提交的）
            const now = Date.now()
            const existingPrompts = new Set(
              prev.filter(t => now - new Date(t.createdAt).getTime() < 60000)
                  .map(t => t.prompt?.substring(0, 50))
            )
            const toAdd = newTasks.filter(t => 
              !existingIds.has(t.taskId) && 
              !existingPrompts.has(t.prompt?.substring(0, 50))
            )
            return [...prev, ...toAdd]
          })
        }
        setHasMore(newTasks.length >= 20)
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [userApiKey])

  useEffect(() => {
    if (isLoggedIn && userApiKey) {
      // 延迟获取历史任务，等待外部任务合并完成
      const timer = setTimeout(() => {
        fetchTasks(1, false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isLoggedIn, userApiKey])

  // SSE 连接接收实时任务更新
  useEffect(() => {
    if (!isLoggedIn || !token) return

    let mounted = true

    const connectSSE = () => {
      if (!mounted) return
      if (sseRef.current && sseRef.current.readyState !== EventSource.CLOSED) return

      console.log('Connecting SSE...')
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
      
      const eventSource = new EventSource(`/api/ai-generate/stream?token=${encodeURIComponent(token)}`)
      sseRef.current = eventSource

      eventSource.onmessage = (event) => {
        if (!mounted) return
        try {
          const data = JSON.parse(event.data)
          handleSSEUpdate(data)
        } catch (err) {
          console.error('SSE parse error:', err)
        }
      }

      eventSource.onerror = () => {
        if (!mounted) return
        console.log('SSE disconnected')
        eventSource.close()
        sseRef.current = null
        // 断线重连，延迟3秒
        if (sseTimerRef.current) clearTimeout(sseTimerRef.current)
        sseTimerRef.current = setTimeout(() => {
          sseTimerRef.current = null
          if (mounted) connectSSE()
        }, 3000)
      }

      eventSource.onopen = () => {
        console.log('SSE connected')
      }
    }

    // 监听强制重连事件
    const handleForceReconnect = () => {
      if (!mounted) return
      console.log('Force reconnecting SSE...')
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
      if (sseTimerRef.current) {
        clearTimeout(sseTimerRef.current)
        sseTimerRef.current = null
      }
      connectSSE()
    }
    
    window.addEventListener('sse-force-reconnect', handleForceReconnect)

    connectSSE()

    return () => {
      mounted = false
      window.removeEventListener('sse-force-reconnect', handleForceReconnect)
      if (sseTimerRef.current) {
        clearTimeout(sseTimerRef.current)
        sseTimerRef.current = null
      }
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
    }
  }, [isLoggedIn, token])

  // 页面可见性变化时尝试重连 SSE
  useEffect(() => {
    if (!isLoggedIn || !token) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page visible, checking SSE...')
        if (!sseRef.current || sseRef.current.readyState === EventSource.CLOSED) {
          console.log('SSE not connected, reconnecting...')
          if (sseTimerRef.current) clearTimeout(sseTimerRef.current)
          sseTimerRef.current = setTimeout(() => {
            sseTimerRef.current = null
            // 关闭现有连接并触发重连
            if (sseRef.current) {
              sseRef.current.close()
              sseRef.current = null
            }
            // 强制重新挂载组件（通过 key 变化）
            window.dispatchEvent(new CustomEvent('sse-force-reconnect'))
          }, 1000)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isLoggedIn, token])

  // 处理 SSE 事件
  const handleSSEUpdate = useCallback((data) => {
    if (!data.taskId) return

    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.taskId === data.taskId || t.realTaskId === data.taskId)
      if (taskIndex === -1) return prev

      return prev.map((t, idx) => {
        if (idx !== taskIndex) return t
        return {
          ...t,
          status: data.status,
          progress: data.progress ?? t.progress,
          resultUrl: data.resultUrl || t.resultUrl,
          errorMessage: data.errorMessage || t.errorMessage
        }
      })
    })
  }, [])

  // 合并外部任务（GenerateNew 传入的占位任务）
  // 只处理已经在列表中但需要更新的任务
  useEffect(() => {
    if (!externalTasks || externalTasks.length === 0) return
    
    setTasks(prev => {
      const newTasks = [...prev]
      externalTasks.forEach(extTask => {
        const index = newTasks.findIndex(t => t.taskId === extTask.taskId || t.realTaskId === extTask.taskId)
        if (index !== -1) {
          // 更新已存在的任务
          newTasks[index] = { ...newTasks[index], ...extTask }
        } else {
          // 只添加真实任务，不添加占位任务
          if (!extTask.taskId.startsWith('pending_')) {
            newTasks.unshift(extTask)
          }
        }
      })
      return newTasks
    })
  }, [externalTasks])

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loadingRef.current) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchTasks(nextPage, true)
    }
  }, [hasMore, page])

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

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个任务吗？')) return
    
    try {
      await api.delete(`/ai-generate/task/${taskId}`, {
        headers: userApiKey ? { 'X-API-Key': userApiKey } : {}
      })
      setTasks(prev => prev.filter(t => t.taskId !== taskId))
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const getStatusDisplay = (status, progress) => {
    switch (status) {
      case 'completed':
        return { icon: <CheckCircle size={12} />, text: '已完成', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' }
      case 'failed':
        return { icon: <XCircle size={12} />, text: '失败', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
      case 'processing':
        return { icon: <Loader2 size={12} className="ai-spin" />, text: `${progress || 0}%`, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
      default:
        return { icon: <Clock size={12} />, text: '排队中', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' }
    }
  }

  const isVideo = (model) => {
    const modelLower = (model || '').toLowerCase()
    return modelLower.includes('video') || modelLower.includes('veo') || modelLower.includes('grok')
  }

  const getModelDisplayName = (modelId) => {
    const modelNames = {
      'runninghub/nanobanana': '香蕉Pro',
      'runninghub/veo31': 'VEO3.1视频生成',
      'huoshan/image': '火山图片'
    }
    return modelNames[modelId] || modelId?.split('/')?.pop() || modelId || '未知模型'
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
    <div 
      className="ai-preview-area" 
      style={{ 
        padding: 0, 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column'
      }}
    >
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflow: 'auto', padding: '1rem' }}
      >
        {tasks.length === 0 && !loading && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            minHeight: '200px',
            color: 'var(--ai-text-muted)'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '16px', 
              background: 'var(--ai-bg-panel)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              {modelType === 'video' ? <Video size={32} /> : <ImageIcon size={32} />}
            </div>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>开始创作你的第一幅作品</p>
          </div>
        )}

        {/* 网格布局显示结果 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(6, 1fr)', 
          gap: '1rem',
          paddingBottom: '1rem'
        }}>
          {tasks.map((task, index) => {
            const statusDisplay = getStatusDisplay(task.status, task.progress)
            const taskIsVideo = isVideo(task.modelName) || (task.resultUrl && task.resultUrl.includes('.mp4'))
            const hasResult = task.resultUrl && task.status === 'completed'
            // 视频用 16:9，图片用 9/16
            const aspectRatio = '9/16'

            return (
              <div 
                key={task.id || task.taskId || index}
                style={{
                  background: 'var(--ai-bg-panel)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--ai-border-color)',
                  transition: 'all 0.2s'
                }}
              >
                {/* 图片区域 */}
                <div style={{ 
                  position: 'relative',
                  aspectRatio: aspectRatio,
                  background: 'var(--ai-bg-secondary)',
                  cursor: hasResult ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
                onClick={() => hasResult && setSelectedTask(task)}
                >
                  {hasResult ? (
                    <>
                      {taskIsVideo ? (
                        <video 
                          src={task.resultUrl} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          controls
                        />
                      ) : (
                        <img 
                          src={task.resultUrl} 
                          alt="生成结果"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </>
                  ) : task.status === 'processing' || task.status === 'queued' ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--ai-text-muted)'
                    }}>
                      <Loader2 size={24} className="ai-spin" />
                      <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        {task.status === 'queued' ? '排队中...' : `${task.progress || 0}%`}
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#ef4444'
                    }}>
                      <XCircle size={24} />
                      <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>生成失败</span>
                    </div>
                  )}
                </div>

                {/* 信息区域 */}
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: statusDisplay.bg,
                      color: statusDisplay.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {statusDisplay.icon}
                      {statusDisplay.text}
                    </span>
                    {task.cost && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--ai-text-muted)' }}>
                        -{task.cost}积分
                      </span>
                    )}
                    <span style={{ fontSize: '0.65rem', color: 'var(--ai-text-muted)', marginLeft: '0.25rem' }}>
                      {getModelDisplayName(task.modelName)}
                    </span>
                    <button
                      onClick={(e) => handleDeleteTask(task.taskId, e)}
                      style={{
                        padding: '0.25rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'var(--ai-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="删除"
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.1)'
                        e.target.style.color = '#ef4444'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent'
                        e.target.style.color = 'var(--ai-text-muted)'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {task.prompt && (
                    <div style={{ 
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'var(--ai-bg-secondary)',
                      borderRadius: '6px',
                      border: '1px solid var(--ai-border-color)'
                    }}>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--ai-text-secondary)',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>提示词</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            onClick={async (e) => {
                              await navigator.clipboard.writeText(task.prompt)
                              const btn = e.target
                              const originalText = btn.textContent
                              btn.textContent = '已复制'
                              btn.style.background = '#22c55e'
                              btn.style.color = '#fff'
                              btn.style.borderColor = '#22c55e'
                              setTimeout(() => {
                                btn.textContent = originalText
                                btn.style.background = 'transparent'
                                btn.style.color = 'var(--ai-text-muted)'
                                btn.style.borderColor = 'var(--ai-border-color)'
                              }, 1500)
                            }}
                            style={{
                              padding: '0.2rem 0.4rem',
                              background: 'transparent',
                              border: '1px solid var(--ai-border-color)',
                              borderRadius: '4px',
                              color: 'var(--ai-text-muted)',
                              fontSize: '0.65rem',
                              cursor: 'pointer'
                            }}
                          >
                            复制
                          </button>
                          {onUsePrompt && (
                            <button
                              onClick={() => onUsePrompt(task.prompt)}
                              style={{
                                padding: '0.2rem 0.4rem',
                                background: 'var(--ai-accent-green)',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#000',
                                fontSize: '0.65rem',
                                cursor: 'pointer'
                              }}
                            >
                              使用
                            </button>
                          )}
                        </div>
                      </div>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--ai-text-primary)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {task.prompt}
                      </p>
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  {hasResult && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button
                        onClick={() => {
                          if (onAddReferenceUrl) {
                            onAddReferenceUrl(task.resultUrl)
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'var(--ai-accent-green)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#000',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <ImageIcon size={14} />
                        加入参考
                      </button>
                      <button
                        onClick={() => handleDownload(task.resultUrl)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: 'var(--ai-bg-secondary)',
                          border: '1px solid var(--ai-border-color)',
                          borderRadius: '6px',
                          color: 'var(--ai-text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  )}
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

      {/* 图片/视频放大模态框 */}
      {selectedTask && (
        <div 
          className="ai-image-modal"
          onClick={() => setSelectedTask(null)}
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
          {(selectedTask.resultUrl?.includes('.mp4') || selectedTask.resultUrl?.includes('.webm') || (selectedTask.modelName || '').toLowerCase().includes('veo')) ? (
            <video 
              src={selectedTask.resultUrl} 
              controls
              autoPlay
              style={{ maxWidth: '100%', maxHeight: '100%' }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img 
              src={selectedTask.resultUrl} 
              alt="预览"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <button
            onClick={() => handleDownload(selectedTask.resultUrl)}
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
            下载
          </button>
          <button
            onClick={() => setSelectedTask(null)}
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