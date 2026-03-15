import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Package, Info, X, Check, Terminal, AlertCircle, Users, TrendingUp } from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'
import api from '../utils/api'
import TopNavigationBar from '../components/TopNavigationBar'
import '../styles/generate.css'

function SkillDetailNew() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  
  const [skill, setSkill] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [installInfo, setInstallInfo] = useState(null)
  
  useEffect(() => {
    fetchSkill()
  }, [id])
  
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [showModal])
  
  const fetchSkill = async () => {
    try {
      const response = await api.get(`/skills/${id}`)
      setSkill(response.data.skill)
    } catch (error) {
      console.error('Failed to fetch skill:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleInstall = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    setDownloading(true)
    try {
      const response = await api.get(`/skills/${id}/install`)
      
      setInstallInfo({
        ...response.data,
        apiKey: user?.apiKey
      })
      
      const downloadUrl = `${window.location.origin}${response.data.download.signedUrl}`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${skill.name.replace(/\s+/g, '-')}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setSkill(prev => ({
        ...prev,
        downloadCount: (prev.downloadCount || 0) + 1
      }))
      
      setShowModal(true)
    } catch (error) {
      alert('获取下载链接失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setDownloading(false)
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
  
  if (!skill) {
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
          <div style={{ textAlign: 'center', color: 'var(--ai-text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--ai-text-primary)' }}>Skill 不存在</h3>
            <p>该技能可能已被删除</p>
          </div>
        </div>
      </div>
    )
  }
  
  const pricePerCall = (skill.pricePerCall / 100).toFixed(2)
  
  const categoryLabels = {
    productivity: '效率工具',
    ai: 'AI 助手',
    developer: '开发者',
    creative: '创意工具'
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
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--ai-text-secondary)',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--ai-text-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--ai-text-secondary)'}
          >
            <ArrowLeft size={16} />
            返回市场
          </button>
          
          <div style={{ 
            background: 'var(--ai-bg-secondary)',
            border: '1px solid var(--ai-border-color)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
              {skill.icon ? (
                <img src={skill.icon} alt={skill.name} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} />
              ) : (
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Package size={32} color="white" />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ai-text-primary)' }}>{skill.name}</h1>
                  {skill.version && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.125rem 0.5rem', 
                      background: 'var(--ai-bg-elevated)', 
                      borderRadius: '4px', 
                      color: 'var(--ai-text-muted)' 
                    }}>
                      v{skill.version}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    background: 'rgba(74, 222, 128, 0.2)',
                    color: 'var(--ai-accent-green)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    {categoryLabels[skill.category] || skill.category || '未分类'}
                  </span>
                  {skill.author && <span style={{ color: 'var(--ai-text-muted)', fontSize: '0.875rem' }}>by {skill.author}</span>}
                  <span style={{ fontWeight: 600, color: 'var(--ai-accent-green)' }}>¥{pricePerCall}/次</span>
                </div>
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '0.75rem', 
              padding: '0.75rem', 
              background: 'var(--ai-bg-elevated)', 
              borderRadius: '10px', 
              marginBottom: '1.5rem' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: 'var(--ai-accent-blue)' }}>{skill.usageCount || 0}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)' }}>使用次数</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: 'var(--ai-accent-green)' }}>{skill.downloadCount || 0}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)' }}>下载次数</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: 'var(--ai-accent-purple)' }}>¥{pricePerCall}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)' }}>单次价格</p>
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: 'var(--ai-text-primary)', 
                marginBottom: '0.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                <Info size={16} style={{ color: 'var(--ai-accent-green)' }} />
                详细介绍
              </h3>
              <p style={{ color: 'var(--ai-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {skill.description || '暂无描述'}
              </p>
            </div>
            
            {skill.readme && (
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                background: 'var(--ai-bg-elevated)', 
                borderRadius: '8px',
                border: '1px solid var(--ai-border-color)'
              }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--ai-text-primary)' }}>
                  安装说明
                </h4>
                <pre style={{ 
                  fontSize: '0.75rem', 
                  whiteSpace: 'pre-wrap', 
                  margin: 0, 
                  color: 'var(--ai-text-secondary)',
                  fontFamily: 'inherit' 
                }}>
                  {skill.readme}
                </pre>
              </div>
            )}
            
            <button 
              onClick={handleInstall} 
              disabled={downloading || !skill.packageUrl} 
              style={{ 
                width: '100%', 
                padding: '1rem', 
                fontSize: '1rem',
                background: downloading || !skill.packageUrl 
                  ? 'var(--ai-text-muted)' 
                  : 'var(--ai-accent-green)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: 600,
                cursor: downloading || !skill.packageUrl ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {downloading ? (
                <>
                  <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: '#000' }} />
                  获取下载链接...
                </>
              ) : (
                <>
                  <Download size={18} />
                  安装 Skill
                </>
              )}
            </button>
            
            {!skill.packageUrl && (
              <p style={{ textAlign: 'center', color: 'var(--ai-text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                该 Skill 暂无安装包
              </p>
            )}
          </div>
        </div>
      </div>
      
      {showModal && installInfo && createPortal(
        <div onClick={() => setShowModal(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: 'var(--ai-bg-secondary)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--ai-border-color)'
          }}>
            <div style={{ 
              padding: '1rem 1.25rem', 
              borderBottom: '1px solid var(--ai-border-color)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ai-text-primary)' }}>安装 Skill</h3>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: '4px', 
                  cursor: 'pointer', 
                  color: 'var(--ai-text-muted)' 
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '1.25rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                background: 'rgba(74, 222, 128, 0.2)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1rem' 
              }}>
                <Check size={24} style={{ color: 'var(--ai-accent-green)' }} />
              </div>
              
              <p style={{ textAlign: 'center', color: 'var(--ai-text-secondary)', marginBottom: '1.5rem' }}>
                Skill 压缩包已开始下载，请按以下步骤安装
              </p>
              
              <ol style={{ 
                paddingLeft: '1.25rem', 
                color: 'var(--ai-text-secondary)', 
                fontSize: '0.875rem', 
                lineHeight: 1.8, 
                marginBottom: '1.5rem' 
              }}>
                <li>解压下载的 <code style={{ background: 'var(--ai-bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>{skill.name}.zip</code></li>
                <li>将文件夹放到应用的 <code style={{ background: 'var(--ai-bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>skills</code> 目录</li>
                <li>配置 API Key（见下方）</li>
                <li>重启应用即可使用</li>
              </ol>
              
              <div style={{ 
                background: 'var(--ai-bg-elevated)', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '1rem',
                border: '1px solid var(--ai-border-color)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '0.5rem' 
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ai-text-primary)' }}>API Key</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(user?.apiKey || '')} 
                    style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--ai-accent-green)', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer' 
                    }}
                  >
                    复制
                  </button>
                </div>
                <code style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ai-text-muted)', wordBreak: 'break-all' }}>
                  {user?.apiKey}
                </code>
              </div>
              
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '1rem',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '0.5rem', 
                  fontWeight: 600,
                  color: 'var(--ai-accent-blue)'
                }}>
                  <Terminal size={14} />
                  计费 API 端点
                </div>
                <code style={{ display: 'block', wordBreak: 'break-all', fontSize: '0.75rem', color: 'var(--ai-text-secondary)' }}>
                  {installInfo.installation?.billingApi}
                </code>
              </div>
              
              <div style={{ 
                background: 'rgba(245, 158, 11, 0.1)', 
                borderRadius: '8px', 
                padding: '12px', 
                fontSize: '0.75rem', 
                color: '#f59e0b',
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.5rem',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>下载链接 {installInfo.download?.expiresIn || 300} 秒内有效，请尽快下载。API Key 与你的账户绑定，请勿分享给他人。</span>
              </div>
            </div>
            
            <div style={{ 
              padding: '1rem 1.25rem', 
              borderTop: '1px solid var(--ai-border-color)', 
              display: 'flex', 
              gap: '0.75rem' 
            }}>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ 
                  flex: 1, 
                  padding: '0.75rem',
                  background: 'var(--ai-bg-elevated)',
                  border: '1px solid var(--ai-border-color)',
                  borderRadius: '8px',
                  color: 'var(--ai-text-primary)',
                  cursor: 'pointer'
                }}
              >
                关闭
              </button>
              <button 
                onClick={() => { setShowModal(false); navigate('/profile') }} 
                style={{ 
                  flex: 1, 
                  padding: '0.75rem',
                  background: 'var(--ai-accent-green)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                查看我的积分
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default SkillDetailNew