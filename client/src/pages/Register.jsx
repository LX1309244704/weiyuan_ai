import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await register(email, password, name)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || '注册失败')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div style={{ 
      maxWidth: '440px', 
      margin: '2rem auto',
      padding: '0 1rem'
    }}>
      <div className="animate-fadeIn">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 16px -4px rgba(34, 197, 94, 0.4)'
          }}>
            <span style={{ fontSize: '2rem' }}>✨</span>
          </div>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 700, 
            color: '#0f172a',
            marginBottom: '0.5rem'
          }}>
            创建账户
          </h1>
          <p style={{ color: '#64748b' }}>
            加入 OpenClaw 技能市场
          </p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}
        
        {/* Form */}
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ 
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                昵称
              </label>
              <div style={{ position: 'relative' }}>
                <User size={20} style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="text"
                  className="input"
                  placeholder="你的昵称（可选）"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ 
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                邮箱地址
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="email"
                  className="input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                密码
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="password"
                  className="input"
                  placeholder="至少6个字符"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                  注册中...
                </>
              ) : (
                <>
                  注册
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          
          <div style={{ 
            textAlign: 'center', 
            paddingTop: '1rem',
            borderTop: '1px solid #f1f5f9'
          }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
              已有账号？{' '}
            </span>
            <Link 
              to="/login" 
              style={{ 
                color: '#6366f1',
                fontWeight: 500,
                fontSize: '0.875rem',
                textDecoration: 'none'
              }}
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register