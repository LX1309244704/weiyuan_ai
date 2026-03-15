import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'
import TopNavigationBar from '../components/TopNavigationBar'
import '../styles/generate.css'

function RegisterNew() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')
  
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
  
  const inputStyle = (name) => ({
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 2.75rem',
    background: 'var(--ai-bg-elevated)',
    border: `1px solid ${focused === name ? 'var(--ai-accent-green)' : 'var(--ai-border-color)'}`,
    borderRadius: '8px',
    color: 'var(--ai-text-primary)',
    fontSize: '0.9375rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease'
  })
  
  const iconStyle = {
    position: 'absolute',
    left: '0.875rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: focused ? 'var(--ai-accent-green)' : 'var(--ai-text-muted)',
    transition: 'color 0.2s ease',
    pointerEvents: 'none',
    width: '18px',
    height: '18px'
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
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 16px -4px rgba(74, 222, 128, 0.4)'
            }}>
              <span style={{ fontSize: '2rem' }}>✨</span>
            </div>
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 700, 
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              创建账户
            </h1>
            <p style={{ color: 'var(--ai-text-secondary)' }}>加入 Weiyuan AI</p>
          </div>
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
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
          
          <div style={{ 
            background: 'var(--ai-bg-secondary)',
            border: '1px solid var(--ai-border-color)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--ai-text-secondary)',
                  marginBottom: '0.5rem'
                }}>
                  昵称
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={iconStyle} />
                  <input
                    type="text"
                    placeholder="你的昵称（可选）"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle('name')}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused('')}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--ai-text-secondary)',
                  marginBottom: '0.5rem'
                }}>
                  邮箱地址
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={iconStyle} />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle('email')}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--ai-text-secondary)',
                  marginBottom: '0.5rem'
                }}>
                  密码
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={iconStyle} />
                  <input
                    type="password"
                    placeholder="至少6个字符"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={inputStyle('password')}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '0.875rem',
                  background: loading ? 'var(--ai-text-muted)' : 'var(--ai-accent-green)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: '#000' }}></div>
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
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--ai-border-color)',
              marginTop: '0.5rem'
            }}>
              <span style={{ color: 'var(--ai-text-muted)', fontSize: '0.875rem' }}>已有账号？</span>
              <Link to="/login" style={{ color: 'var(--ai-accent-green)', fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none', marginLeft: '0.375rem' }}>
                立即登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterNew