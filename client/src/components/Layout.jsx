import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/AuthContext'

function Layout() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  
  const handleLogout = () => {
    logout()
    navigate('/')
  }
  
  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'U'
  }
  
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="header-logo">
            <div className="header-logo-icon">OC</div>
            <span className="header-logo-text">OpenClaw</span>
          </Link>
          
<nav className="header-nav">
            <Link to="/" className="header-link">市场</Link>
            <Link to="/generate" className="header-link">AI创作</Link>
            <Link to="/api-market" className="header-link">API</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="header-link">个人中心</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="header-link">管理后台</Link>
                )}
                <Link to="/recharge" className="header-balance" style={{ textDecoration: 'none' }}>
                  <svg className="header-balance-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{user?.balance || 0} 积分</span>
                </Link>
                <div className="header-actions">
                  <div className="header-dropdown">
                    <div className="header-avatar">{getUserInitial()}</div>
                    <div className="header-dropdown-menu">
                      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.name || '用户'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.email}</div>
                      </div>
                      <Link to="/recharge" className="header-dropdown-item">充值积分</Link>
                      <Link to="/profile" className="header-dropdown-item">个人中心</Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" className="header-dropdown-item">管理后台</Link>
                      )}
                      <div className="header-dropdown-divider" />
                      <button onClick={handleLogout} className="header-dropdown-item" style={{ color: '#ef4444' }}>
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="header-actions">
                <Link to="/login" className="header-btn header-btn-ghost">登录</Link>
                <Link to="/register" className="header-btn header-btn-primary">注册</Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      
      <div className="page-wrapper">
        <main className="container">
          <Outlet />
        </main>
      </div>
      
      <footer style={{ background: 'rgba(255,255,255,0.95)', borderTop: '1px solid #e2e8f0', padding: '2rem 0' }}>
        <div className="container text-center">
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ 
              fontSize: '0.875rem', 
              color: '#64748b',
              fontWeight: 500
            }}>
              OpenClaw Skill 市场
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            发现、购买、使用各类优质技能，提升你的 OpenClaw 体验
          </p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            © 2024 OpenClaw. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout