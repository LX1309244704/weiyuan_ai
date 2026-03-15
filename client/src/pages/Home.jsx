import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, TrendingUp, Zap, Users, Award, ArrowUpDown } from 'lucide-react'
import api from '../utils/api'

function Home() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('new')
  
  useEffect(() => {
    fetchSkills()
  }, [category, search, sort])
  
  const fetchSkills = async () => {
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (search) params.append('search', search)
      params.append('sort', sort)
      
      const response = await api.get(`/skills?${params}`)
      setSkills(response.data.skills || [])
    } catch (error) {
      console.error('Failed to fetch skills:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="loading-spinner"></div>
        <p className="text-secondary">加载中...</p>
      </div>
    )
  }
  
  const categories = [
    { value: '', label: '全部分类' },
    { value: 'productivity', label: '效率工具' },
    { value: 'ai', label: 'AI 助手' },
    { value: 'developer', label: '开发者' },
    { value: 'creative', label: '创意工具' }
  ]
  
  const sortOptions = [
    { value: 'new', label: '最新发布' },
    { value: 'hot', label: '热门推荐' },
    { value: 'price-low', label: '价格从低到高' },
    { value: 'price-high', label: '价格从高到低' },
    { value: 'name', label: '按名称排序' }
  ]
  
  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '3rem',
        padding: '2rem 0'
      }}>
        <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          发现优质 Skills
        </h1>
        <p style={{ 
          fontSize: '1.125rem', 
          color: '#64748b',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          浏览、购买、免费使用各类技能，提升你的 OpenClaw 体验
        </p>
        
        {/* Stats */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '2rem', 
          marginTop: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', fontWeight: 600 }}>
              <Zap size={20} />
              <span>{skills.length}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>可用技能</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontWeight: 600 }}>
              <TrendingUp size={20} />
              <span>{skills.reduce((sum, s) => sum + (s.usageCount || 0), 0).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>总调用次数</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', fontWeight: 600 }}>
              <Award size={20} />
              <span>{skills.filter(s => s.pricePerCall === 0).length}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>免费技能</div>
          </div>
        </div>
      </div>
      
      {/* Search and Filter */}
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
            placeholder="搜索 Skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '3rem' }}
          />
        </div>
        <div style={{ position: 'relative', minWidth: '160px' }}>
          <Filter size={20} style={{ 
            position: 'absolute', 
            left: '1rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            pointerEvents: 'none'
          }} />
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ paddingLeft: '3rem', appearance: 'none', cursor: 'pointer' }}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div style={{ position: 'relative', minWidth: '160px' }}>
          <ArrowUpDown size={20} style={{ 
            position: 'absolute', 
            left: '1rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            pointerEvents: 'none'
          }} />
          <select
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ paddingLeft: '3rem', appearance: 'none', cursor: 'pointer' }}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Skills Grid */}
      {skills.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#0f172a' }}>暂无 Skills</h3>
          <p className="text-secondary">请稍后再来查看</p>
        </div>
      ) : (
        <div className="grid grid-3 animate-stagger">
          {skills.map((skill) => (
            <Link
              to={`/skills/${skill.id}`}
              key={skill.id}
              className="card"
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'block',
                cursor: 'pointer'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                {skill.icon ? (
                  <img
                    src={skill.icon}
                    alt={skill.name}
                    style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '12px',
                      objectFit: 'cover',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>⚡</span>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontWeight: 600, 
                    marginBottom: '0.25rem',
                    color: '#0f172a',
                    fontSize: '1.125rem'
                  }}>
                    {skill.name}
                  </h3>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {skill.category || '未分类'}
                  </span>
                </div>
              </div>
              
              {/* Description */}
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
                {skill.description || '暂无描述'}
              </p>
              
              {/* Card Footer */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid #f1f5f9'
              }}>
                <div>
                  <span style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    ¥{(skill.pricePerCall / 100).toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.25rem' }}>积分</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
                  <Users size={14} />
                  <span style={{ fontSize: '0.75rem' }}>{skill.usageCount || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Home