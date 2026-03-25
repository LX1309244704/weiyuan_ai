import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../context/AuthContext'

/**
 * 受保护的路由组件
 * 检查用户是否已认证，未认证则重定向到登录页面
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const location = useLocation()
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()
  
  // 等待 hydration 完成
  if (!_hasHydrated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
  
  // 未认证，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  
  // 需要管理员权限但用户不是管理员
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  
  return children
}