import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/AuthContext'
import { 
  Image, Video, Trash2, Download, ChevronRight, Clock
} from 'lucide-react'
import dayjs from 'dayjs'
import TopNavigationBar from '../components/TopNavigationBar'
import '../styles/generate.css'

function Assets() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssets()
    }
  }, [isAuthenticated])
  
  const fetchAssets = async () => {
    try {
      setLoading(true)
      // 暂时使用空数组，实际使用时从后端 API 获取生成记录
      // const response = await api.get('/generate/history')
      // setAssets(response.data.assets || [])
      setAssets([])
    } catch (err) {
      console.error('Failed to fetch assets:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const filteredAssets = assets.filter(item => {
    if (filter === 'all') return true
    return item.type === filter
  })
  
  const handleDelete = async (id) => {
    if (window.confirm('确定要删除吗？')) {
      // 实现删除逻辑
    }
  }
  
  const handleDownload = async (url) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `weiyuan-asset-${Date.now()}.${url.includes('.mp4') ? 'mp4' : 'png'}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: 'var(--ai-bg-primary)',
      color: 'var(--ai-text-primary)',
      overflow: 'hidden'
    }}>
      {/* Top Navigation Bar */}
      <TopNavigationBar title="Weiyuan AI" />
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header Section */}
        <div style={{
          padding: '2rem',
          borderBottom: '1px solid var(--ai-border-color)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem' 
          }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--ai-text-primary)',
              background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              资产管理
            </h1>
            <span style={{ 
              fontSize: '0.875rem', 
              color: 'var(--ai-text-secondary)',
              paddingLeft: '1rem'
            }}>
              {assets.length} 个资产
            </span>
          </div>
          
          <p style={{
            color: 'var(--ai-text-secondary)',
            fontSize: '0.875rem',
            marginTop: '0.5rem'
          }}>
            您生成的所有图片和视频都在这里
          </p>
        </div>
        
        {/* Controls */}
        <div style={{ 
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--ai-border-color)',
          backgroundColor: 'var(--ai-bg-secondary)'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '1rem'
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
          </div>
        </div>
        
        {/* Content Area */}
        <div style={{
          flex: 1,
          padding: '2rem',
          overflow: 'auto'
        }}>
          
          {/* Asset List */}
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
                <Image size={40} />
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
              <Image size={40} style={{ marginBottom: '1rem', color: 'var(--ai-text-muted)' }} />
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--ai-text-primary)' }}>请先登录</h3>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>登录后可查看生成的资产</p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'var(--ai-accent-green)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                一键登录
              </button>
            </div>
          ) : assets.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem',
              color: 'var(--ai-text-secondary)'
            }}>
              <Image size={40} style={{ marginBottom: '1rem', color: 'var(--ai-text-muted)' }} />
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--ai-text-primary)' }}>暂无资产</h3>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>开始生成图片或视频，它们会出现在这里</p>
              <button
                onClick={() => navigate('/generate')}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, var(--ai-accent-green), var(--ai-accent-green-hover))',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(74, 222, 128, 0.3)'
                }}
              >
                去生成
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredAssets.map((asset, idx) => (
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
                    position: 'relative'
                  }}>
                    {asset.type === 'video' ? (
                      <Video size={32} style={{ color: 'var(--ai-text-muted)' }} />
                    ) : (
                      <Image size={32} style={{ color: 'var(--ai-text-muted)' }} />
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: asset.type === 'image' ? 'var(--ai-accent-blue)' : 'var(--ai-accent-purple)',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      {asset.type === 'video' ? '视频' : '图片'}
                    </div>
                  </div>
                  
                  <div style={{ padding: '1rem' }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--ai-text-primary)',
                      marginBottom: '0.5rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {asset.prompt || '无描述'}
                    </p>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--ai-text-secondary)',
                      marginTop: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Clock size={10} />
                        {dayjs(asset.createdAt).format('MM-DD HH:mm')}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(asset.url)
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--ai-accent-green)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.parentElement.style.backgroundColor = 'rgba(74, 222, 128, 0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.parentElement.style.backgroundColor = 'transparent'
                          }}
                        >
                          <Download size={12} />
                          下载
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(asset.id)
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.parentElement.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.parentElement.style.backgroundColor = 'transparent'
                          }}
                        >
                          <Trash2 size={12} />
                          删除
                        </button>
                      </div>
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

export default Assets