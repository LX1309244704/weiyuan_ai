import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Zap, TrendingUp, Award, Users } from 'lucide-react'
import api from '../utils/api'
import TopNavigationBar from '../components/TopNavigationBar'
import '../styles/generate.css'

function HomeNew() {
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
            marginBottom: '3rem',
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
              发现优质 Skills
            </h1>
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--ai-text-secondary)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              浏览、购买、免费使用各类技能，提升你的 AI 体验
            </p>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '3rem', 
              marginTop: '2rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ai-accent-green)', fontWeight: 600 }}>
                  <Zap size={20} />
                  <span>{skills.length}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ai-text-secondary)', marginTop: '0.25rem' }}>可用技能</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ai-accent-blue)', fontWeight: 600 }}>
                  <TrendingUp size={20} />
                  <span>{skills.reduce((sum, s) => sum + (s.usageCount || 0), 0).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ai-text-secondary)', marginTop: '0.25rem' }}>总调用次数</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ai-accent-purple)', fontWeight: 600 }}>
                  <Award size={20} />
                  <span>{skills.filter(s => s.pricePerCall === 0).length}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ai-text-secondary)', marginTop: '0.25rem' }}>免费技能</div>
              </div>
            </div>
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
                placeholder="搜索 Skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            <div style={{ position: 'relative', minWidth: '160px' }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ 
                  padding: '0.75rem 1rem',
                  paddingLeft: '2.5rem',
                  background: 'var(--ai-bg-secondary)',
                  border: '1px solid var(--ai-border-color)',
                  borderRadius: '8px',
                  color: 'var(--ai-text-primary)',
                  width: '100%',
                  cursor: 'pointer',
                  outline: 'none',
                  fontSize: '0.875rem',
                  appearance: 'none'
                }}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div style={{ position: 'relative', minWidth: '160px' }}>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{ 
                  padding: '0.75rem 1rem',
                  background: 'var(--ai-bg-secondary)',
                  border: '1px solid var(--ai-border-color)',
                  borderRadius: '8px',
                  color: 'var(--ai-text-primary)',
                  width: '100%',
                  cursor: 'pointer',
                  outline: 'none',
                  fontSize: '0.875rem',
                  appearance: 'none'
                }}
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {skills.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem',
              background: 'var(--ai-bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--ai-border-color)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--ai-text-primary)' }}>暂无 Skills</h3>
              <p style={{ color: 'var(--ai-text-secondary)' }}>请稍后再来查看</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {skills.map((skill) => (
                <Link
                  to={`/skills/${skill.id}`}
                  key={skill.id}
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
                    {skill.icon ? (
                      <img
                        src={skill.icon}
                        alt={skill.name}
                        style={{ 
                          width: '56px', 
                          height: '56px', 
                          borderRadius: '12px',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '1.5rem' }}>⚡</span>
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontWeight: 600, 
                        marginBottom: '0.25rem',
                        color: 'var(--ai-text-primary)',
                        fontSize: '1.125rem'
                      }}>
                        {skill.name}
                      </h3>
                      <span style={{ 
                        fontSize: '0.7rem',
                        background: 'var(--ai-bg-elevated)',
                        color: 'var(--ai-accent-green)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        {skill.category || '未分类'}
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
                    {skill.description || '暂无描述'}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--ai-border-color)'
                  }}>
                    <div>
                      <span style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'transparent'
                      }}>
                        ¥{(skill.pricePerCall / 100).toFixed(2)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)', marginLeft: '0.25rem' }}>积分</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--ai-text-muted)' }}>
                      <Users size={14} />
                      <span style={{ fontSize: '0.75rem' }}>{skill.usageCount || 0}</span>
                    </div>
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

export default HomeNew