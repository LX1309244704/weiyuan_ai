import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Wallet, CreditCard, Check, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'
import api from '../utils/api'

function Recharge() {
  const navigate = useNavigate()
  const { user, isAuthenticated, refreshUser } = useAuthStore()
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('wechat')
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])
  
  const packages = [
    { size: 100, price: 1000, popular: false },
    { size: 500, price: 4500, popular: true },
    { size: 1000, price: 8000, popular: false },
    { size: 2000, price: 15000, popular: false },
    { size: 5000, price: 35000, popular: false },
    { size: 10000, price: 60000, popular: false }
  ]
  
  const handleRecharge = async () => {
    if (!selectedPackage) {
      alert('请选择充值套餐')
      return
    }
    
    setLoading(true)
    
    try {
      // 1. 创建订单（不关联 skillId，通用充值）
      const orderResponse = await api.post('/orders/create', {
        userId: user.id,
        skillId: null,
        packageSize: selectedPackage.size,
        paymentMethod: paymentMethod
      })
      
      const order = orderResponse.data.order
      
      // 2. 创建支付
      const paymentResponse = await api.post('/payment/create', {
        orderId: order.id,
        paymentMethod: paymentMethod
      })
      
      // 3. 跳转到支付页面
      navigate(`/payment/${order.orderNo}`)
      
    } catch (error) {
      alert('创建订单失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }
  
  if (!isAuthenticated) return null
  
  return (
    <div className="animate-fadeIn" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)'
        }}>
          <Wallet size={32} color="white" />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          充值积分
        </h1>
        <p style={{ color: '#64748b' }}>
          当前余额：<span style={{ fontWeight: 600, color: '#6366f1', fontSize: '1.25rem' }}>{user?.balance || 0}</span> 积分
        </p>
      </div>
      
      {/* Package Selection */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>
          选择充值套餐
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {packages.map((pkg, index) => (
            <div
              key={index}
              onClick={() => setSelectedPackage(pkg)}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                border: selectedPackage?.size === pkg.size 
                  ? '2px solid #6366f1' 
                  : '2px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedPackage?.size === pkg.size 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)'
                  : 'white',
                position: 'relative'
              }}
            >
              {pkg.popular && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  padding: '0.25rem 0.5rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  borderRadius: '9999px'
                }}>
                  推荐
                </span>
              )}
              {selectedPackage?.size === pkg.size && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '-8px',
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Check size={14} color="white" />
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6366f1', marginBottom: '0.25rem' }}>
                  {pkg.size}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>积分</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginTop: '0.5rem' }}>
                  ¥{(pkg.price / 100).toFixed(0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Payment Method */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>
          支付方式
        </h3>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setPaymentMethod('wechat')}
            style={{
              flex: 1,
              padding: '1rem',
              border: paymentMethod === 'wechat' ? '2px solid #22c55e' : '2px solid #e2e8f0',
              borderRadius: '12px',
              background: paymentMethod === 'wechat' ? '#f0fdf4' : 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: paymentMethod === 'wechat' ? 600 : 400,
              color: paymentMethod === 'wechat' ? '#22c55e' : '#64748b'
            }}
          >
            <Wallet size={18} />
            微信支付
          </button>
          <button
            onClick={() => setPaymentMethod('alipay')}
            style={{
              flex: 1,
              padding: '1rem',
              border: paymentMethod === 'alipay' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
              borderRadius: '12px',
              background: paymentMethod === 'alipay' ? '#eff6ff' : 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: paymentMethod === 'alipay' ? 600 : 400,
              color: paymentMethod === 'alipay' ? '#3b82f6' : '#64748b'
            }}
          >
            <CreditCard size={18} />
            支付宝
          </button>
        </div>
      </div>
      
      {/* Summary */}
      {selectedPackage && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>充值金额</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                ¥{(selectedPackage.price / 100).toFixed(0)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>获得积分</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>
                +{selectedPackage.size}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Submit Button */}
      <button
        onClick={handleRecharge}
        disabled={loading || !selectedPackage}
        className="btn-primary"
        style={{ 
          width: '100%', 
          padding: '1rem', 
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        {loading ? (
          <>
            <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
            处理中...
          </>
        ) : (
          <>
            立即充值
            <ArrowRight size={18} />
          </>
        )}
      </button>
      
      {/* Help */}
      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
        如有问题，请联系客服
      </p>
    </div>
  )
}

export default Recharge