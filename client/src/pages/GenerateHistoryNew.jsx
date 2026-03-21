import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/AuthContext'
import api from '../utils/api'
import { 
  Image, Video, Clock, Download, 
  Calendar, Zap, ArrowLeft, Trash2, Sparkles, 
  CheckCircle, XCircle, Loader2
} from 'lucide-react'
import dayjs from 'dayjs'
import TopNavigationBar from '../components/TopNavigationBar'
import '../styles/generate.css'

function GenerateHistory() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [userApiKey, setUserApiKey] = useState('')
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchUserApiKey()
  }, [isAuthenticated])
  
  useEffect(() => {
    if (userApiKey) {
      fetchHistory()
    }
  }, [userApiKey, filter, typeFilter, page])
  
  const fetchUserApiKey = async () => {
    try {
      const res = await api.get('/users/me')
      if (res.data.user?.apiKey) {
        setUserApiKey(res.data.user.apiKey)
      }
    } catch (err) {
      console.error('Failed to fetch user API key:', err)
    }
  }
  
  const fetchHistory = async () => {
    if (!userApiKey) return
    setLoading(true)
    try {
      const res = await api.get('/ai-generate/tasks', {
        params: {
          status: filter === 'all' ? undefined : filter,
          type: typeFilter,
          page,
          pageSize: 10
        },
        headers: { 'X-API-Key': userApiKey }
      })
      if (res.data.success) {
        setHistory(res.data.tasks || [])
        setTotal(res.data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setLoading(false)
    }
  }
  
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
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle size={14} />,
          text: '已完成',
          color: '#22c55e',
          bgColor: 'rgba(34, 197, 94, 0.1)'
        }
      case 'failed':
        return {
          icon: <XCircle size={14} />,
          text: '失败',
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.1)'
        }
      case 'processing':
        return {
          icon: <Loader2 size={14} className="ai-spin" />,
          text: '生成中',
          color: '#f59e0b',
          bgColor: 'rgba(245, 158, 11, 0.1)'
        }
      default:
        return {
          icon: <Clock size={14} />,
          text: '排队中',
          color: '#6b7280',
          bgColor: 'rgba(107, 114, 128, 0.1)'
        }
    }
  }
  
  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true
    return item.type === filter || (item.model?.toLowerCase().includes('video') ? 'video' : 'image') === filter
  })
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: 'var(--ai-bg-primary)',
      color: 'var(--ai-text-primary)',
      overflow: 'hidden'
    }}>
      <TopNavigationBar title="Weiyuan AI" />
      
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '2rem',
          borderBottom: '1px solid var(--ai-border-color)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem' 
          }}>
            <button
              onClick={() => navigate('/generate')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ai-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                padding: '0.5rem',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'var(--ai-text-primary)'
                e.target.style.backgroundColor = 'var(--ai-bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--ai-text-secondary)'
                e.target.style.backgroundColor = 'transparent'
              }}
            >
              <ArrowLeft size={16} />
              返回创作
            </button>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--ai-text-primary)',
              background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              生成历史
            </h1>
          </div>
        </div>
        
        <div style={{ 
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--ai-border-color)',
          backgroundColor: 'var(--ai-bg-secondary)'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            alignItems: 'center'
          }}>
            {[
              { value: 'all', label: '全部' },
              { value: 'video', label: '视频' },
              { value: 'image', label: '图片' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                style={{
                  padding: '0.5rem 1rem',
                  background: filter === opt.value ? 'var(--ai-accent-green)' : 'var(--ai-bg-elevated)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: filter === opt.value ? 600 : 500,
                  color: filter === opt.value ? '#000' : 'var(--ai-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {opt.label}
              </button>
            ))}
            
            <div style={{ flex: 1 }} />
            
            <Link 
              to="/generate" 
              style={{
                padding: '0.5rem 1.25rem',
                background: 'linear-gradient(135deg, var(--ai-accent-green), var(--ai-accent-green-hover))',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                boxShadow: '0 2px 8px rgba(74, 222, 128, 0.3)'
              }}
            >
              <Sparkles size={16} />
              新的生成
            </Link>
          </div>
        </div>
        
        <div style={{
          flex: 1,
          padding: '2rem',
          overflow: 'auto'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem',
              color: 'var(--ai-text-secondary)'
            }}>
              <div className="ai-pulse" style={{ marginBottom: '1rem' }}>
                <Clock size={40} />
              </div>
              <p>加载中...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem',
              color: 'var(--ai-text-secondary)'
            }}>
              <Clock size={40} style={{ marginBottom: '1rem', color: 'var(--ai-text-muted)' }} />
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--ai-text-primary)' }}>暂无生成记录</h3>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>开始你的第一次 AI 创作吧</p>
              <Link
                to="/generate"
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, var(--ai-accent-green), var(--ai-accent-green-hover))',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}
              >
                开始生成
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredHistory.map((item) => {
                const statusBadge = getStatusBadge(item.status)
                const isVideo = item.model?.toLowerCase().includes('video') || item.model?.toLowerCase().includes('veo') || item.model?.toLowerCase().includes('grok')
                
                return (
                  <div 
                    key={item.id}
                    style={{
                      background: 'var(--ai-bg-panel)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid var(--ai-border-color)',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ai-border-highlight)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ai-border-color)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      aspectRatio: '16/9',
                      background: 'var(--ai-bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {item.status === 'completed' && item.resultUrl ? (
                        isVideo ? (
                          <video 
                            src={item.resultUrl} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            controls
                          />
                        ) : (
                          <img 
                            src={item.resultUrl} 
                            alt="Generated"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )
                      ) : item.status === 'failed' ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#ef4444'
                        }}>
                          <XCircle size={48} />
                          <span style={{ fontSize: '0.875rem' }}>生成失败</span>
                        </div>
                      ) : item.status === 'processing' ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#f59e0b'
                        }}>
                          <Loader2 size={48} className="ai-spin" />
                          <span style={{ fontSize: '0.875rem' }}>生成中... {item.progress || 0}%</span>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: 'var(--ai-text-muted)'
                        }}>
                          <Clock size={48} />
                          <span style={{ fontSize: '0.875rem' }}>排队中</span>
                        </div>
                      )}
                      
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        left: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        background: isVideo ? 'var(--ai-accent-purple)' : 'var(--ai-accent-blue)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {isVideo ? '视频' : '图片'}
                      </div>
                      
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        background: statusBadge.bgColor,
                        color: statusBadge.color,
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {statusBadge.icon}
                        {statusBadge.text}
                      </div>
                      
                      {item.status === 'completed' && item.resultUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(item.resultUrl)
                          }}
                          style={{
                            position: 'absolute',
                            bottom: '0.5rem',
                            right: '0.5rem',
                            padding: '0.375rem 0.75rem',
                            background: 'rgba(0, 0, 0, 0.6)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.8)'}
                          onMouseLeave={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.6)'}
                        >
                          <Download size={12} />
                          下载
                        </button>
                      )}
                    </div>
                    
                    <div style={{ padding: '1rem' }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--ai-text-primary)',
                        marginBottom: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4',
                        minHeight: '2.8em'
                      }}>
                        {item.prompt || '无提示词'}
                      </p>
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        color: 'var(--ai-text-secondary)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Calendar size={10} />
                          {dayjs(item.createdAt).format('MM-DD HH:mm')}
                        </div>
                        <span style={{ fontWeight: 500 }}>{item.model}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GenerateHistory