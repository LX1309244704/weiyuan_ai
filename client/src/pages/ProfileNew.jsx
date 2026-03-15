import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Key, Wallet, ShoppingCart, Zap, Copy, RefreshCw, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Plus, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'
import api from '../utils/api'
import dayjs from 'dayjs'
import TopNavigationBar from '../components/TopNavigationBar'
import '../styles/generate.css'

function ProfileNew() {
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
    paid: { color: 'var(--ai-accent-green)', bg: 'rgba(34, 197, 94, 0.1)', label: '已支付' },
    pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: '待支付' },
    refunded: { color: 'var(--ai-text-muted)', bg: 'rgba(100, 116, 139, 0.1)', label: '已退款' }
  }
  
  const paymentLabels = {
    wechat: '微信支付',
    alipay: '支付宝'
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
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
            返回首页
          </button>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              个人中心
            </h1>
            <p style={{ color: 'var(--ai-text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              管理你的账户和订单
            </p>
          </div>
          
          <div style={{ 
            background: 'var(--ai-bg-secondary)',
            border: '1px solid var(--ai-border-color)',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 700
                }}>
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--ai-text-primary)' }}>
                    {user?.name || '用户'}
                  </p>
                  <p style={{ color: 'var(--ai-text-secondary)', fontSize: '0.875rem' }}>{user?.email}</p>
                </div>
              </div>
              <div style={{ 
                background: 'var(--ai-bg-elevated)',
                borderRadius: '12px',
                padding: '1rem 1.5rem',
                textAlign: 'center',
                border: '1px solid var(--ai-border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ai-accent-green)', marginBottom: '0.25rem' }}>
                  <Wallet size={18} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>剩余积分</span>
                </div>
                <p style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {user?.balance || 0}
                </p>
                <button 
                  onClick={() => navigate('/recharge')}
                  style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.375rem 0.75rem',
                    marginTop: '0.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: 'var(--ai-accent-green)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} />
                  充值
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: activeTab === tab.key ? 'var(--ai-accent-green)' : 'var(--ai-bg-secondary)',
                    border: '1px solid var(--ai-border-color)',
                    borderRadius: '8px',
                    color: activeTab === tab.key ? '#000' : 'var(--ai-text-secondary)',
                    fontWeight: activeTab === tab.key ? 600 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
          
          <div style={{ 
            background: 'var(--ai-bg-secondary)',
            border: '1px solid var(--ai-border-color)',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            {activeTab === 'api-key' && (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--ai-text-primary)' }}>
                  API Key 管理
                </h3>
                <p style={{ color: 'var(--ai-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  将以下 API Key 配置到你的应用中，即可自动计费
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
                    background: 'var(--ai-bg-elevated)',
                    border: '1px solid var(--ai-border-color)',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: 'var(--ai-text-primary)',
                    wordBreak: 'break-all'
                  }}>
                    {user?.apiKey || '暂无 API Key'}
                  </div>
                  <button
                    onClick={() => copyToClipboard(user?.apiKey || '')}
                    style={{ 
                      flexShrink: 0,
                      padding: '0.75rem 1rem',
                      background: 'var(--ai-bg-elevated)',
                      border: '1px solid var(--ai-border-color)',
                      borderRadius: '8px',
                      color: 'var(--ai-text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Copy size={16} />
                    复制
                  </button>
                </div>
                
                <button
                  onClick={handleResetApiKey}
                  disabled={resettingKey}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--ai-bg-elevated)',
                    border: '1px solid var(--ai-border-color)',
                    borderRadius: '8px',
                    color: 'var(--ai-text-primary)',
                    cursor: resettingKey ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <RefreshCw size={16} className={resettingKey ? 'animate-spin' : ''} />
                  {resettingKey ? '重置中...' : '重置 API Key'}
                </button>
              </div>
            )}
            
            {activeTab === 'balance' && (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--ai-text-primary)' }}>
                  余额明细
                </h3>
                
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                    <div className="loading-spinner" style={{ borderTopColor: 'var(--ai-accent-green)' }}></div>
                  </div>
                ) : balanceLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ai-text-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
                    <p>暂无记录</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--ai-border-color)' }}>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>时间</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>变动</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>原因</th>
                          <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>余额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balanceLogs.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid var(--ai-border-color)' }}>
                            <td style={{ padding: '1rem 0.75rem', color: 'var(--ai-text-secondary)' }}>
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
                                color: log.change > 0 ? 'var(--ai-accent-green)' : '#ef4444',
                                fontWeight: 600
                              }}>
                                {log.change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {log.change > 0 ? '+' : ''}{log.change}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 0.75rem', color: 'var(--ai-text-primary)' }}>{log.reason}</td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 500, color: 'var(--ai-accent-green)' }}>
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
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--ai-text-primary)' }}>
                  订单记录
                </h3>
                
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                    <div className="loading-spinner" style={{ borderTopColor: 'var(--ai-accent-green)' }}></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ai-text-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                    <p>暂无订单</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--ai-border-color)' }}>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>订单号</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>金额</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>积分</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>支付方式</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>状态</th>
                          <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const status = statusColors[order.status] || { color: 'var(--ai-text-muted)', bg: 'var(--ai-bg-elevated)', label: order.status }
                          return (
                            <tr key={order.id} style={{ borderBottom: '1px solid var(--ai-border-color)' }}>
                              <td style={{ padding: '1rem 0.75rem', fontFamily: 'monospace', color: 'var(--ai-text-muted)', fontSize: '0.75rem' }}>
                                {order.orderNo.slice(0, 12)}...
                              </td>
                              <td style={{ padding: '1rem 0.75rem', fontWeight: 600, color: 'var(--ai-text-primary)' }}>
                                ¥{(order.amount / 100).toFixed(2)}
                              </td>
                              <td style={{ padding: '1rem 0.75rem', color: 'var(--ai-accent-green)', fontWeight: 500 }}>
                                {order.packageSize}
                              </td>
                              <td style={{ padding: '1rem 0.75rem', color: 'var(--ai-text-secondary)' }}>
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
                              <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: 'var(--ai-text-secondary)' }}>
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
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--ai-text-primary)' }}>
                  调用记录
                </h3>
                
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                    <div className="loading-spinner" style={{ borderTopColor: 'var(--ai-accent-green)' }}></div>
                  </div>
                ) : invocations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ai-text-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                    <p>暂无记录</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--ai-border-color)' }}>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>类型</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>名称</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>消耗</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>状态</th>
                          <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--ai-text-secondary)', fontWeight: 500 }}>时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invocations.map((inv) => (
                          <tr key={inv.id} style={{ borderBottom: '1px solid var(--ai-border-color)' }}>
                            <td style={{ padding: '1rem 0.75rem' }}>
                              <span style={{
                                display: 'inline-flex',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                background: inv.type === 'api' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                                color: inv.type === 'api' ? 'var(--ai-accent-blue)' : 'var(--ai-accent-green)'
                              }}>
                                {inv.type === 'api' ? 'API' : 'Skill'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 0.75rem', fontWeight: 500, color: 'var(--ai-text-primary)' }}>
                              {inv.name}
                              {inv.endpointName && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ai-text-muted)', fontFamily: 'monospace' }}>{inv.endpointName}</span>}
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
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: 'var(--ai-text-secondary)' }}>
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
      </div>
    </div>
  )
}

export default ProfileNew