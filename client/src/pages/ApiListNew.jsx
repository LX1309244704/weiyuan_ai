import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { Code, Search, Zap, DollarSign, ChevronRight } from 'lucide-react'
import TopNavigationBar from '../components/TopNavigationBar'
import '../styles/generate.css'

export default function ApiListNew() {
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    fetchEndpoints()
  }, [])

  const fetchEndpoints = async () => {
    try {
      const response = await api.get('/proxy/endpoints')
      setEndpoints(response.data.endpoints || [])
    } catch (error) {
      console.error('Failed to fetch endpoints:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(endpoints.map(e => e.category).filter(Boolean))]

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchSearch = !search || 
      endpoint.name?.toLowerCase().includes(search.toLowerCase()) ||
      endpoint.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !selectedCategory || endpoint.category === selectedCategory
    return matchSearch && matchCategory
  })

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        background: 'var(--ai-bg-primary)',
        color: 'var(--ai-text-primary)'
      }}>
        <TopNavigationBar title="Weiyuan AI" />
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div className="loading-spinner" style={{ borderTopColor: 'var(--ai-accent-green)' }}></div>
          <p style={{ marginLeft: '1rem', color: 'var(--ai-text-secondary)' }}>加载中...</p>
        </div>
      </div>
    )
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
      <TopNavigationBar title="Weiyuan AI" />
      
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
            padding: '2rem 0'
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 700,
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              API 市场
            </h1>
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--ai-text-secondary)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              通过统一的 API 接口调用各类 AI 服务，无需单独对接多个平台
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search size={20} style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--ai-text-muted)'
              }} />
              <input
                type="text"
                placeholder="搜索 API..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ 
                  paddingLeft: '3rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--ai-bg-secondary)',
                  border: '1px solid var(--ai-border-color)',
                  borderRadius: '8px',
                  color: 'var(--ai-text-primary)',
                  width: '100%',
                  outline: 'none',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ 
                  padding: '0.75rem 1rem',
                  background: 'var(--ai-bg-secondary)',
                  border: '1px solid var(--ai-border-color)',
                  borderRadius: '8px',
                  color: 'var(--ai-text-primary)',
                  minWidth: '150px',
                  cursor: 'pointer',
                  outline: 'none',
                  fontSize: '0.875rem',
                  appearance: 'none'
                }}
              >
                <option value="">全部分类</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          {filteredEndpoints.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem',
              background: 'var(--ai-bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--ai-border-color)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔌</div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--ai-text-primary)' }}>暂无可用 API</h3>
              <p style={{ color: 'var(--ai-text-secondary)' }}>请稍后再来查看</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredEndpoints.map(endpoint => (
                <Link
                  key={endpoint.id}
                  to={`/api-market/${endpoint.id}`}
                  style={{ 
                    textDecoration: 'none', 
                    color: 'inherit',
                    display: 'block',
                    cursor: 'pointer',
                    background: 'var(--ai-bg-secondary)',
                    border: '1px solid var(--ai-border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    transition: 'all 0.2s'
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
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, var(--ai-accent-blue) 0%, var(--ai-accent-purple) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Code size={24} style={{ color: 'white' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontWeight: 600, 
                        marginBottom: '0.25rem',
                        color: 'var(--ai-text-primary)',
                        fontSize: '1.125rem'
                      }}>
                        {endpoint.name}
                      </h3>
                      <span style={{ 
                        fontSize: '0.7rem',
                        background: 'var(--ai-bg-elevated)',
                        color: 'var(--ai-accent-blue)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        {endpoint.category || '通用'}
                      </span>
                    </div>
                  </div>

                  <p style={{ 
                    fontSize: '0.875rem',
                    color: 'var(--ai-text-secondary)',
                    marginBottom: '1rem',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: '2.625rem'
                  }}>
                    {endpoint.description || '暂无描述'}
                  </p>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    color: 'var(--ai-text-secondary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <DollarSign size={14} style={{ color: 'var(--ai-accent-green)' }} />
                      <span>¥{(endpoint.pricePerCall / 100).toFixed(2)}/次</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Zap size={14} style={{ color: '#f59e0b' }} />
                      <span>{endpoint.rateLimit}次/分钟</span>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--ai-border-color)'
                  }}>
                    <code style={{ 
                      fontSize: '0.75rem', 
                      background: 'var(--ai-bg-elevated)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      color: 'var(--ai-text-muted)'
                    }}>
                      {endpoint.method} {endpoint.path}
                    </code>
                    <ChevronRight size={18} style={{ color: 'var(--ai-text-muted)' }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}