import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, RefreshCw, Home, User } from 'lucide-react'
import api from '../utils/api'
import { useAuthStore } from '../context/AuthContext'

function Payment() {
  const { orderNo } = useParams()
  const navigate = useNavigate()
  const { refreshUser, isAuthenticated } = useAuthStore()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [hasRefreshed, setHasRefreshed] = useState(false)
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchOrder()
  }, [orderNo, isAuthenticated])
  
  useEffect(() => {
    let interval
    if (polling && order?.status === 'pending') {
      interval = setInterval(fetchOrder, 3000)
    }
    return () => clearInterval(interval)
  }, [polling, order?.status])
  
  useEffect(() => {
    if (order?.status === 'paid' && !hasRefreshed) {
      refreshUser()
      setHasRefreshed(true)
    }
  }, [order?.status, hasRefreshed, refreshUser])
  
  const fetchOrder = async () => {
    try {
      const res = await api.get(`/payment/status/${orderNo}`)
      setOrder(res.data)
      
      if (res.data.status === 'paid') {
        setPolling(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }
  
  if (!order) {
    return (
      <div style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <XCircle size={64} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>订单不存在</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>请检查订单号是否正确</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          <Home size={16} /> 返回首页
        </button>
      </div>
    )
  }
  
  if (order.status === 'paid') {
    return (
      <div style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <CheckCircle size={48} color="white" />
        </div>
        <h2 style={{ marginBottom: '0.5rem', color: '#0f172a' }}>支付成功</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          已成功充值 <strong style={{ color: '#22c55e' }}>{order.packageSize}</strong> 积分
        </p>
        
        <div className="card" style={{ width: '100%', maxWidth: '400px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b' }}>订单号</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{order.orderNo}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b' }}>支付金额</span>
            <span style={{ fontWeight: 600, color: '#22c55e' }}>¥{(order.amount / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <span style={{ color: '#64748b' }}>支付时间</span>
            <span>{new Date(order.paidAt).toLocaleString()}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/')} className="btn-secondary">
            <Home size={16} /> 返回市场
          </button>
          <button onClick={() => navigate('/profile')} className="btn-primary">
            <User size={16} /> 查看余额
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#0f172a' }}>订单支付</h2>
        
        <div style={{ 
          background: '#f8fafc', 
          borderRadius: '12px', 
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: '#64748b' }}>订单号</span>
            <code style={{ fontSize: '0.875rem' }}>{order.orderNo}</code>
          </div>
          
          {order.skill && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#64748b' }}>Skill</span>
              <span style={{ fontWeight: 500 }}>{order.skill.name}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: '#64748b' }}>购买积分</span>
            <span style={{ fontWeight: 600, color: '#6366f1' }}>{order.packageSize}</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <span style={{ fontWeight: 500 }}>支付金额</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
              ¥{(order.amount / 100).toFixed(2)}
            </span>
          </div>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' }}>支付方式</p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '10px'
          }}>
            {order.paymentMethod === 'wechat' ? (
              <>
                <div style={{ width: '24px', height: '24px', background: '#22c55e', borderRadius: '4px' }}></div>
                <span>微信支付</span>
              </>
            ) : order.paymentMethod === 'alipay' ? (
              <>
                <div style={{ width: '24px', height: '24px', background: '#3b82f6', borderRadius: '4px' }}></div>
                <span>支付宝</span>
              </>
            ) : (
              <>
                <div style={{ width: '24px', height: '24px', background: '#8b5cf6', borderRadius: '4px' }}></div>
                <span>模拟支付（测试环境）</span>
              </>
            )}
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem',
          background: '#f8fafc',
          borderRadius: '12px',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '180px',
            height: '180px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            {order.paymentMethod === 'wechat' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '100px', height: '100px', background: '#22c55e', borderRadius: '8px', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: '2rem', fontWeight: 700 }}>微</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>微信扫码支付</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '100px', height: '100px', background: '#3b82f6', borderRadius: '8px', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: '2rem', fontWeight: 700 }}>支</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>支付宝扫码支付</p>
              </div>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            请使用{order.paymentMethod === 'wechat' ? '微信' : '支付宝'}扫描二维码完成支付
          </p>
        </div>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '1rem',
          background: '#fef3c7',
          borderRadius: '10px',
          marginBottom: '1rem',
          color: '#d97706'
        }}>
          <Clock size={18} />
          <span>等待支付中...</span>
          {polling && <RefreshCw size={16} className="animate-spin" />}
        </div>
        
        <button
          onClick={() => setPolling(!polling)}
          className="btn-ghost"
          style={{ width: '100%' }}
        >
          {polling ? '停止自动刷新' : '手动刷新状态'}
        </button>
        
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          支付完成后将自动跳转，如未跳转请点击刷新
        </p>
      </div>
    </div>
  )
}

export default Payment