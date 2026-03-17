import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Wrench, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Settings,
  LogOut,
  Home,
  Code,
  ChevronRight,
  Sparkles,
  Package,
  Plug,
  FileText,
  UserCircle2,
  ArrowLeft
} from 'lucide-react'
import TopNavigationBar from '../TopNavigationBar'
import '../../styles/generate.css'

const menuItems = [
  { key: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { key: 'skills', label: 'Skill管理', icon: Wrench },
  { key: 'endpoints', label: 'API端点', icon: Code },
  { key: 'orders', label: '订单管理', icon: ShoppingCart },
  { key: 'users', label: '用户管理', icon: Users },
  { key: 'revenue', label: '财务统计', icon: DollarSign },
  { key: 'settings', label: '系统设置', icon: Settings },
]

const mainMenuItems = [
  { label: 'AI创作', path: '/generate', icon: Sparkles },
  { label: '生成记录', path: '/generate/history', icon: FileText },
  { label: '技能', path: '/', icon: Package },
  { label: 'API', path: '/api-market', icon: Plug },
  { label: '个人中心', path: '/profile', icon: UserCircle2 }
]

export default function AdminLayout({ children, activeTab, onTabChange, user, onLogout }) {
  const navigate = useNavigate()
  const currentItem = menuItems.find(item => item.key === activeTab)
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: 'var(--ai-bg-primary)',
      color: 'var(--ai-text-primary)',
      overflow: 'hidden'
    }}>
      <TopNavigationBar title="Weiyuan AI - 管理后台" />
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden' 
      }}>
        {/* 左侧菜单 */}
        <div style={{
          width: '240px',
          background: 'var(--ai-bg-secondary)',
          borderRight: '1px solid var(--ai-border-color)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          <div style={{ padding: '1.5rem 1rem 1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--ai-border-color)'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, var(--ai-accent-blue) 0%, var(--ai-accent-purple) 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Settings size={18} color="white" />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--ai-text-primary)' }}>管理后台</span>
            </div>
          </div>
          
          <nav style={{ padding: '0.5rem', flex: 1 }}>
            {/* 主站菜单 */}
            <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>主站</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {mainMenuItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(item.path)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.625rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        background: 'transparent',
                        color: 'var(--ai-text-secondary)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--ai-bg-hover)'
                        e.target.style.color = 'var(--ai-text-primary)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent'
                        e.target.style.color = 'var(--ai-text-secondary)'
                      }}
                    >
                      <Icon size={14} />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--ai-border-color)', margin: '0.5rem 0' }} />

            <p style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)', fontWeight: 600, padding: '0.5rem 0.75rem' }}>管理</p>
            {menuItems.map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.key
              
              return (
                <button
                  key={item.key}
                  onClick={() => onTabChange(item.key)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    background: isActive ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                    color: isActive ? 'var(--ai-accent-green)' : 'var(--ai-text-secondary)',
                    transition: 'all 0.2s',
                    marginBottom: '0.25rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.backgroundColor = 'var(--ai-bg-hover)'
                      e.target.style.color = 'var(--ai-text-primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.backgroundColor = 'transparent'
                      e.target.style.color = 'var(--ai-text-secondary)'
                    }
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? 'var(--ai-accent-green)' : 'var(--ai-text-muted)' }} />
                  {item.label}
                </button>
              )
            })}
          </nav>
          
          {/* 用户信息 */}
          <div style={{ 
            padding: '1rem', 
            borderTop: '1px solid var(--ai-border-color)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'var(--ai-bg-elevated)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={18} style={{ color: 'var(--ai-text-muted)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ai-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || '管理员'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem',
                  fontSize: '0.8125rem',
                  background: 'var(--ai-accent-green)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: 500
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1'
                }}
              >
                <ArrowLeft size={14} />
                返回用户端
              </button>
              <button
                onClick={onLogout}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem',
                  fontSize: '0.8125rem',
                  background: 'transparent',
                  border: '1px solid var(--ai-border-color)',
                  borderRadius: '6px',
                  color: 'var(--ai-text-secondary)',
                  cursor: 'pointer',
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
                退出
              </button>
            </div>
          </div>
        </div>
        
        {/* 主内容区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 顶部面包屑 */}
          <div style={{
            height: '48px',
            background: 'var(--ai-bg-secondary)',
            borderBottom: '1px solid var(--ai-border-color)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1.5rem',
            flexShrink: 0
          }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--ai-text-muted)', textDecoration: 'none' }}>
                <Home size={14} />
                首页
              </Link>
              <ChevronRight size={14} style={{ color: 'var(--ai-text-muted)' }} />
              <span style={{ color: 'var(--ai-text-primary)', fontWeight: 500 }}>{currentItem?.label}</span>
            </nav>
          </div>
          
          {/* 页面内容 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}