import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Package, Info, X, Check, Terminal, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'
import api from '../utils/api'

function SkillDetail() {
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
      <div className="loading-wrapper">
        <div className="loading-spinner"></div>
        <p className="text-secondary">加载中...</p>
      </div>
    )
  }
  
  if (!skill) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📦</div>
        <h3 style={{ marginBottom: '0.5rem', color: '#0f172a' }}>Skill 不存在</h3>
        <p className="text-secondary">该技能可能已被删除</p>
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
    <div className="animate-fadeIn" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/')} 
        className="btn btn-ghost"
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={18} />
        返回市场
      </button>
      
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
          {skill.icon ? (
            <img src={skill.icon} alt={skill.name} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={32} color="white" />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{skill.name}</h1>
              {skill.version && <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', background: '#f1f5f9', borderRadius: '4px', color: '#64748b' }}>v{skill.version}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{categoryLabels[skill.category] || skill.category || '未分类'}</span>
              {skill.author && <span style={{ color: '#64748b', fontSize: '0.875rem' }}>by {skill.author}</span>}
              <span style={{ fontWeight: 600, color: '#6366f1' }}>¥{pricePerCall}/次</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: '#6366f1' }}>{skill.usageCount || 0}</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>使用次数</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: '#22c55e' }}>{skill.downloadCount || 0}</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>下载次数</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: '#8b5cf6' }}>¥{pricePerCall}</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>单次价格</p>
          </div>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={16} style={{ color: '#6366f1' }} />
            详细介绍
          </h3>
          <p style={{ color: '#64748b', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{skill.description || '暂无描述'}</p>
        </div>
        
        {skill.readme && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>安装说明</h4>
            <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', margin: 0, color: '#64748b' }}>{skill.readme}</pre>
          </div>
        )}
        
        <button onClick={handleInstall} disabled={downloading || !skill.packageUrl} className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
          {downloading ? (
            <>
              <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              获取下载链接...
            </>
          ) : (
            <>
              <Download size={18} />
              安装 Skill
            </>
          )}
        </button>
        
        {!skill.packageUrl && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.5rem' }}>该 Skill 暂无安装包</p>}
      </div>
      
      {showModal && installInfo && createPortal(
        <div onClick={() => setShowModal(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>安装 Skill</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Check size={24} style={{ color: '#22c55e' }} />
              </div>
              
              <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1.5rem' }}>Skill 压缩包已开始下载，请按以下步骤安装</p>
              
              <ol style={{ paddingLeft: '1.25rem', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                <li>解压下载的 <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{skill.name}.zip</code></li>
                <li>将文件夹放到 OpenClaw 的 <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>skills</code> 目录</li>
                <li>配置 API Key（见下方）</li>
                <li>重启 OpenClaw 即可使用</li>
              </ol>
              
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>API Key</span>
                  <button onClick={() => navigator.clipboard.writeText(user?.apiKey || '')} style={{ fontSize: '0.75rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>复制</button>
                </div>
                <code style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-all' }}>{user?.apiKey}</code>
              </div>
              
              <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '12px', marginBottom: '1rem', fontSize: '0.75rem', color: '#1e40af' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <Terminal size={14} />
                  计费 API 端点
                </div>
                <code style={{ display: 'block', wordBreak: 'break-all' }}>{installInfo.installation?.billingApi}</code>
              </div>
              
              <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '12px', fontSize: '0.75rem', color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>下载链接 {installInfo.download?.expiresIn || 300} 秒内有效，请尽快下载。API Key 与你的账户绑定，请勿分享给他人。</span>
              </div>
            </div>
            
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>关闭</button>
              <button onClick={() => { setShowModal(false); navigate('/profile') }} className="btn-primary" style={{ flex: 1 }}>查看我的积分</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default SkillDetail