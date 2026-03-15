import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Key, Wallet, ShoppingCart, Zap, Copy, RefreshCw, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Plus } from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'
import api from '../utils/api'
import dayjs from 'dayjs'

function Profile() {
  const navigate = useNavigate()
  const { user, isAuthenticated, updateUser, refreshUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('api-key')
  const [balanceLogs, setBalanceLogs] = useState([])
  const [orders, setOrders] = useState([])
  const [invocations, setInvocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [resettingKey, setResettingKey] = useState(false)
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    fetchData()
  }, [activeTab])
  
  useEffect(() => {
    if (isAuthenticated) {
      refreshUser()
    }
  }, [])
  
  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'balance') {
        const response = await api.get('/users/balance-logs')
        setBalanceLogs(response.data.logs || [])
      } else if (activeTab === 'orders') {
        const response = await api.get('/users/orders')
        setOrders(response.data.orders || [])
      } else if (activeTab === 'usage') {
        const [invRes, apiInvRes] = await Promise.all([
          api.get('/users/invocations'),
          api.get('/users/api-invocations')
        ])
        const skillInvocations = (invRes.data.records || []).map(inv => ({
          ...inv,
          type: 'skill',
          name: inv.skill?.name || 'Unknown',
          endpointName: null
        }))
        const apiInvocations = (apiInvRes.data.records || []).map(inv => ({
          ...inv,
          type: 'api',
          name: inv.endpoint?.name || 'Unknown',
          endpointName: inv.requestPath
        }))
        setInvocations([...skillInvocations, ...apiInvocations].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleResetApiKey = async () => {
    if (!confirm('确定要重置 API Key 吗？重置后旧的 Key 将立即失效。')) {
      return
    }
    
    setResettingKey(true)
    try {
      const response = await api.post('/users/reset-key')
      updateUser({ apiKey: response.data.apiKey })
      alert('API Key 已重置')
    } catch (error) {
      alert('重置失败')
    } finally {
      setResettingKey(false)
    }
  }
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }
  
  if (!isAuthenticated) return null
  
  const tabs = [
    { key: 'api-key', label: 'API Key', icon: Key },
    { key: 'balance', label: '余额明细', icon: Wallet },
    { key: 'orders', label: '订单记录', icon: ShoppingCart },
    { key: 'usage', label: '调用记录', icon: Zap }
  ]
  
  const statusColors = {
    paid: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', label: '已支付' },
    pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: '待支付' },
    refunded: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', label: '已退款' }
  }
  
  const paymentLabels = {
    wechat: '微信支付',
    alipay: '支付宝'
  }
  
  return (
    <div className="animate-fadeIn" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">个人中心</h1>
        <p className="page-description">管理你的账户和订单</p>
      </div>
      
      {/* User Info Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 700,
              boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)'
            }}>
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '1.125rem', color: '#0f172a' }}>
                {user?.name || '用户'}
              </p>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{user?.email}</p>
            </div>
          </div>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', marginBottom: '0.25rem' }}>
              <Wallet size={18} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>剩余积分</span>
            </div>
            <p style={{ 
              fontSize: '1.75rem', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {user?.balance || 0}
            </p>
            <Link 
              to="/recharge" 
              className="btn-primary"
              style={{ 
                fontSize: '0.75rem', 
                padding: '0.375rem 0.75rem',
                marginTop: '0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Plus size={14} />
              充值
            </Link>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            >
              <Icon size={16} style={{ marginRight: '0.5rem' }} />
              {tab.label}
            </button>
          )
        })}
      </div>
      
      {/* Tab Content */}
      <div className="card" style={{ padding: '2rem' }}>
        {activeTab === 'api-key' && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>
              API Key 管理
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              将以下 API Key 配置到你的 OpenClaw Skill 中，即可自动计费
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              marginBottom: '1.5rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                flex: 1,
                minWidth: '200px',
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: '#0f172a',
                wordBreak: 'break-all'
              }}>
                {user?.apiKey || '暂无 API Key'}
              </div>
              <button
                className="btn btn-outline"
                onClick={() => copyToClipboard(user?.apiKey || '')}
                style={{ flexShrink: 0 }}
              >
                <Copy size={16} />
                复制
              </button>
            </div>
            
            <button
              className="btn btn-secondary"
              onClick={handleResetApiKey}
              disabled={resettingKey}
            >
              <RefreshCw size={16} className={resettingKey ? 'animate-spin' : ''} />
              {resettingKey ? '重置中...' : '重置 API Key'}
            </button>
          </div>
        )}
        
        {activeTab === 'balance' && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: '#0f172a' }}>
              余额明细
            </h3>
            
            {loading ? (
              <div className="loading-wrapper" style={{ minHeight: '200px' }}>
                <div className="loading-spinner"></div>
              </div>
            ) : balanceLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💰</div>
                <p className="text-secondary">暂无记录</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>时间</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>变动</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>原因</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>余额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanceLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={14} />
                            {dayjs(log.createdAt).format('MM-DD HH:mm')}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: log.change > 0 ? '#22c55e' : '#ef4444',
                            fontWeight: 600
                          }}>
                            {log.change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {log.change > 0 ? '+' : ''}{log.change}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.75rem', color: '#0f172a' }}>{log.reason}</td>
                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 500, color: '#6366f1' }}>
                          {log.balanceAfter}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: '#0f172a' }}>
              订单记录
            </h3>
            
            {loading ? (
              <div className="loading-wrapper" style={{ minHeight: '200px' }}>
                <div className="loading-spinner"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🛒</div>
                <p className="text-secondary">暂无订单</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>订单号</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>金额</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>积分</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>支付方式</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>状态</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const status = statusColors[order.status] || { color: '#64748b', bg: '#f1f5f9', label: order.status }
                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem 0.75rem', fontFamily: 'monospace', color: '#64748b', fontSize: '0.75rem' }}>
                            {order.orderNo.slice(0, 12)}...
                          </td>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>
                            ¥{(order.amount / 100).toFixed(2)}
                          </td>
                          <td style={{ padding: '1rem 0.75rem', color: '#6366f1', fontWeight: 500 }}>
                            {order.packageSize}
                          </td>
                          <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>
                            {paymentLabels[order.paymentMethod] || order.paymentMethod}
                          </td>
                          <td style={{ padding: '1rem 0.75rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              background: status.bg,
                              color: status.color
                            }}>
                              {order.status === 'paid' && <CheckCircle size={12} />}
                              {order.status === 'pending' && <Clock size={12} />}
                              {order.status === 'refunded' && <XCircle size={12} />}
                              {status.label}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#64748b' }}>
                            {dayjs(order.createdAt).format('YYYY-MM-DD')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'usage' && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: '#0f172a' }}>
              调用记录
            </h3>
            
            {loading ? (
              <div className="loading-wrapper" style={{ minHeight: '200px' }}>
                <div className="loading-spinner"></div>
              </div>
            ) : invocations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚡</div>
                <p className="text-secondary">暂无记录</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>类型</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>名称</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>消耗</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>状态</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: '#64748b', fontWeight: 500 }}>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invocations.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            background: inv.type === 'api' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                            color: inv.type === 'api' ? '#6366f1' : '#22c55e'
                          }}>
                            {inv.type === 'api' ? 'API' : 'Skill'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.75rem', fontWeight: 500, color: '#0f172a' }}>
                          {inv.name}
                          {inv.endpointName && <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{inv.endpointName}</span>}
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <span style={{ color: '#ef4444', fontWeight: 500 }}>
                            -{inv.cost}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.75rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            background: inv.status === 'success' ? 'rgba(34, 197, 94, 0.1)' : inv.status === 'timeout' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: inv.status === 'success' ? '#22c55e' : inv.status === 'timeout' ? '#eab308' : '#ef4444'
                          }}>
                            {inv.status === 'success' ? <CheckCircle size={12} /> : inv.status === 'timeout' ? <Clock size={12} /> : <XCircle size={12} />}
                            {inv.status === 'success' ? '成功' : inv.status === 'timeout' ? '超时' : '失败'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#64748b' }}>
                          {dayjs(inv.createdAt).format('MM-DD HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile