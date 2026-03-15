import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { Code, Search, ChevronRight, Zap, DollarSign } from 'lucide-react'

export default function ApiList() {
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
      <div className="loading-wrapper">
        <div className="loading-spinner"></div>
        <p className="text-secondary">加载中...</p>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        padding: '2rem 0'
      }}>
        <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          API 市场
        </h1>
        <p style={{ 
          fontSize: '1.125rem', 
          color: '#64748b',
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
            color: '#94a3b8'
          }} />
          <input
            type="text"
            className="input"
            placeholder="搜索 API..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '3rem' }}
          />
        </div>
        {categories.length > 0 && (
          <select
            className="input"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ minWidth: '150px', cursor: 'pointer' }}
          >
            <option value="">全部分类</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </div>

      {filteredEndpoints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔌</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#0f172a' }}>暂无可用 API</h3>
          <p className="text-secondary">请稍后再来查看</p>
        </div>
      ) : (
        <div className="grid grid-3 animate-stagger">
          {filteredEndpoints.map(endpoint => (
            <Link
              key={endpoint.id}
              to={`/api-market/${endpoint.id}`}
              className="card"
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'block',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}>
                  <Code size={24} style={{ color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontWeight: 600, 
                    marginBottom: '0.25rem',
                    color: '#0f172a',
                    fontSize: '1.125rem'
                  }}>
                    {endpoint.name}
                  </h3>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {endpoint.category || '通用'}
                  </span>
                </div>
              </div>

              <p style={{ 
                fontSize: '0.875rem',
                color: '#64748b',
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
                color: '#64748b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <DollarSign size={14} style={{ color: '#22c55e' }} />
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
                borderTop: '1px solid #f1f5f9'
              }}>
                <code style={{ 
                  fontSize: '0.75rem', 
                  background: '#f8fafc', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  color: '#64748b'
                }}>
                  {endpoint.method} {endpoint.path}
                </code>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}