import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FolderOpen, Video, BookOpen, Plug } from 'lucide-react'

export default function SidebarNav() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const navItems = [
    { 
      icon: FolderOpen, 
      label: '资产', 
      path: '/assets',
      active: location.pathname === '/assets'
    },
    { 
      icon: Video, 
      label: '生成', 
      path: '/generate',
      active: location.pathname.startsWith('/generate')
    },
    { 
      icon: BookOpen, 
      label: '技能', 
      path: '/skills',
      active: location.pathname.startsWith('/skills')
    },
    { 
      icon: Plug, 
      label: 'API', 
      path: '/api-market',
      active: location.pathname.startsWith('/api-market')
    }
  ]
  
  const handleNavClick = (path) => {
    if (path === '/assets') {
      navigate(path)
    } else {
      navigate(path)
    }
  }
  
  return (
    <nav className="ai-sidebar-nav">
      <div className="ai-sidebar-logo" onClick={() => navigate('/')}>
        W
      </div>
      
      {navItems.map((item, index) => (
        <div
          key={index}
          className={`ai-nav-item ${item.active ? 'active' : ''}`}
          title={item.label}
          onClick={() => navigate(item.path)}
          style={{ cursor: 'pointer' }}
        >
          <item.icon size={20} />
        </div>
      ))}
      
      <div className="ai-nav-spacer" />
      
      <div className="ai-nav-bottom">
        {/* 底部功能预留 */}
      </div>
    </nav>
  )
}