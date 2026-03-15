import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/AuthContext'
import { 
  Image, Video, Clock, Download, 
  Calendar, Zap, ArrowLeft, Trash2
} from 'lucide-react'
import dayjs from 'dayjs'
import SidebarNav from '../components/generate/SidebarNav'
import '../styles/generate.css'

export default function GenerateHistory() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory()
    }
  }, [isAuthenticated])
  
  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/api_invocations?limit=100')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.invocations || [])
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true
    return item.type === filter
  })
  
  return (
    <div className="ai-create-layout">
      <SidebarNav />
      
      <div style={{
        flex: 1,
        background: 'var(--ai-bg-primary)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 顶部栏 */}
        <div style={{
          height: '64px',
          borderBottom: '1px solid var(--ai-border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                fontSize: '0.875rem'
              }}
            >
              <ArrowLeft size={16} />
              返回创作
            </button>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--ai-text-primary)'
            }}>
              生成历史
            </h1>
          </div>
          
          <Link 
            to="/generate" 
            style={{
              padding: '0.625rem 1.25rem',
              background: 'linear-gradient(135deg, var(--ai-accent-green), var(--ai-accent-green-hover))',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Zap size={16} fill="currentColor" />
            新的生成
          </Link>
        </div>
        
        {/* 内容区 */}
        <div style={{
          flex: 1,
          padding: '2rem',
          overflow: 'auto'
        }}>
          {/* 筛选器 */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '2rem',
            background: 'var(--ai-bg-secondary)',
            padding: '0.25rem',
            borderRadius: '0.75rem',
            width: 'fit-content'
          }}>
            {[
              { value: 'all', label: '全部' },
              { value: 'image', label: '图片' },
              { value: 'video', label: '视频' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                style={{
                  padding: '0.5rem 1rem',
                  background: filter === opt.value ? 'var(--ai-bg-elevated)' : 'transparent',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: filter === opt.value ? 'var(--ai-text-primary)' : 'var(--ai-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          {/* 历史记录列表 */}
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
          ) : !isAuthenticated ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem',
              color: 'var(--ai-text-secondary)'
            }}>
              <Zap size={40} style={{ marginBottom: '1rem', color: 'var(--ai-text-muted)' }} />
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--ai-text-primary)' }}>请先登录</h3>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>登录后可查看生成历史</p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'var(--ai-bg-elevated)',
                  border: '1px solid var(--ai-border-color)',
                  borderRadius: '8px',
                  color: 'var(--ai-text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                一键登录
              </button>
            </div>
          ) : history.length === 0 ? (
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredHistory.map((item, idx) => (
                <div 
                  key={idx}
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
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ai-border-color)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    aspectRatio: '16/9',
                    background: 'var(--ai-bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {item.type === 'video' ? (
                      <Video size={32} style={{ color: 'var(--ai-text-muted)' }} />
                    ) : (
                      <Image size={32} style={{ color: 'var(--ai-text-muted)' }} />
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: item.type === 'image' ? 'var(--ai-accent-blue)' : 'var(--ai-accent-purple)',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      {item.type || 'image'}
                    </div>
                  </div>
                  
                  <div style={{ padding: '1rem' }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--ai-text-primary)',
                      marginBottom: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
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
                        <Calendar size={12} />
                        {dayjs(item.createdAt).format('MM-DD HH:mm')}
                      </div>
                      <span>¥{(item.cost / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}