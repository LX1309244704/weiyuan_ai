import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../context/AuthContext'
import { User, Sparkles, Plug, FileText, UserCircle2, LogOut, Settings, Coins, DollarSign } from 'lucide-react'
import '../styles/generate.css'

export default function TopNavigationBar({ title = "Weiyuan AI", balance = 0 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  const menuItems = [
    { label: 'AI创作', path: '/', icon: Sparkles, highlightPaths: ['/', '/generate'] },
    { label: '生成记录', path: '/generate/history', icon: FileText, highlightPaths: ['/generate/history'] },
    { label: 'API', path: '/api-market', icon: Plug, highlightPaths: ['/api-market'] },
    { label: '个人中心', path: '/profile', icon: UserCircle2, highlightPaths: ['/profile', '/recharge'] }
  ]

  // 检查是否当前路径匹配此菜单项
  const isActive = (menuPath, highlightPaths) => {
    const currentPath = location.pathname;
    return currentPath === menuPath || highlightPaths.some(path => {
      if (path === '/') return currentPath === '/'
      return currentPath.startsWith(path)
    });
  };

  return (
    <nav style={{
      height: '60px',
      background: 'var(--ai-bg-secondary)',
      borderBottom: '1px solid var(--ai-border-color)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 2rem',
      flexShrink: 0,
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        flex: 1
      }}>
        <div 
          style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}
          onClick={() => navigate('/')}
        >
          {title}
        </div>
        
        {menuItems.map((item, index) => {
          const active = isActive(item.path, item.highlightPaths);
          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              style={{
                color: active ? 'var(--ai-accent-green)' : 'var(--ai-text-secondary)',
                background: 'transparent',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: active ? 600 : 500,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--ai-bg-hover)'
                if (!active) {
                  e.target.style.color = 'var(--ai-text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = active ? 'var(--ai-accent-green)' : 'var(--ai-text-secondary)'
              }}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isAuthenticated && user?.role === 'admin' && (
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--ai-border-color)',
              borderRadius: '8px',
              color: 'var(--ai-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'var(--ai-accent-blue)'
              e.target.style.color = 'var(--ai-accent-blue)'
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'var(--ai-border-color)'
              e.target.style.color = 'var(--ai-text-secondary)'
            }}
          >
            <Settings size={16} />
            管理后台
          </button>
        )}
        {isAuthenticated ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: '#ffffff',
              border: '1px solid #d97706',
              borderRadius: '8px'
            }}>
              <DollarSign size={16} style={{ color: '#d97706' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400e' }}>{Number(balance || 0).toLocaleString()}</span>
            </div>
            <button
              onClick={() => navigate('/profile')}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--ai-bg-elevated)',
                border: '1px solid var(--ai-border-color)',
                borderRadius: '8px',
                color: 'var(--ai-text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--ai-border-highlight)'
                e.target.style.backgroundColor = 'var(--ai-bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--ai-border-color)'
                e.target.style.backgroundColor = 'var(--ai-bg-elevated)'
              }}
            >
              <User size={16} />
              {user?.username || user?.name || '我的账户'}
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'transparent',
                border: '1px solid var(--ai-border-color)',
                borderRadius: '8px',
                color: 'var(--ai-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#ef4444'
                e.target.style.color = '#ef4444'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--ai-border-color)'
                e.target.style.color = 'var(--ai-text-secondary)'
              }}
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--ai-accent-green)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            登录
          </button>
        )}
      </div>
    </nav>
  )
}