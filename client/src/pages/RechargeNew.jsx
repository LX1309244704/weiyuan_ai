import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Wallet, CreditCard, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../context/AuthContext'
import api from '../utils/api'
import TopNavigationBar from '../components/TopNavigationBar'
import '../styles/generate.css'

function RechargeNew() {
  const navigate = useNavigate()
  const { user, isAuthenticated, refreshUser } = useAuthStore()
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('wechat')
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
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
      const orderResponse = await api.post('/orders/create', {
        skillId: null,
        packageSize: selectedPackage.size,
        paymentMethod: paymentMethod
      })
      
      const order = orderResponse.data.order
      
      await api.post('/payment/create', {
        orderId: order.id,
        paymentMethod: paymentMethod
      })
      
      navigate(`/payment/${order.orderNo}`)
      
    } catch (error) {
      alert('创建订单失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }
  
  if (!isAuthenticated) return null
  
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
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <button 
            onClick={() => navigate('/profile')} 
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
            返回个人中心
          </button>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 16px -4px rgba(74, 222, 128, 0.4)'
            }}>
              <Wallet size={32} color="white" />
            </div>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, var(--ai-accent-green) 0%, var(--ai-accent-blue) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              充值积分
            </h1>
            <p style={{ color: 'var(--ai-text-secondary)' }}>
              当前余额：<span style={{ fontWeight: 600, color: 'var(--ai-accent-green)', fontSize: '1.25rem' }}>{user?.balance || 0}</span> 积分
            </p>
          </div>
          
          <div style={{ 
            background: 'var(--ai-bg-secondary)',
            border: '1px solid var(--ai-border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--ai-text-primary)' }}>
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
                      ? '2px solid var(--ai-accent-green)' 
                      : '2px solid var(--ai-border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedPackage?.size === pkg.size 
                      ? 'rgba(74, 222, 128, 0.1)'
                      : 'var(--ai-bg-elevated)',
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
                      background: 'var(--ai-accent-green)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={14} color="#000" />
                    </div>
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ai-accent-green)', marginBottom: '0.25rem' }}>
                      {pkg.size}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)' }}>积分</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ai-text-primary)', marginTop: '0.5rem' }}>
                      ¥{(pkg.price / 100).toFixed(0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ 
            background: 'var(--ai-bg-secondary)',
            border: '1px solid var(--ai-border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--ai-text-primary)' }}>
              支付方式
            </h3>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setPaymentMethod('wechat')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  border: paymentMethod === 'wechat' ? '2px solid var(--ai-accent-green)' : '2px solid var(--ai-border-color)',
                  borderRadius: '12px',
                  background: paymentMethod === 'wechat' ? 'rgba(74, 222, 128, 0.1)' : 'var(--ai-bg-elevated)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: paymentMethod === 'wechat' ? 600 : 400,
                  color: paymentMethod === 'wechat' ? 'var(--ai-accent-green)' : 'var(--ai-text-muted)'
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
                  border: paymentMethod === 'alipay' ? '2px solid var(--ai-accent-blue)' : '2px solid var(--ai-border-color)',
                  borderRadius: '12px',
                  background: paymentMethod === 'alipay' ? 'rgba(96, 165, 250, 0.1)' : 'var(--ai-bg-elevated)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: paymentMethod === 'alipay' ? 600 : 400,
                  color: paymentMethod === 'alipay' ? 'var(--ai-accent-blue)' : 'var(--ai-text-muted)'
                }}
              >
                <CreditCard size={18} />
                支付宝
              </button>
            </div>
          </div>
          
          {selectedPackage && (
            <div style={{ 
              background: 'var(--ai-bg-secondary)',
              border: '1px solid var(--ai-border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--ai-text-muted)', fontSize: '0.875rem' }}>充值金额</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ai-text-primary)' }}>
                    ¥{(selectedPackage.price / 100).toFixed(0)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'var(--ai-text-muted)', fontSize: '0.875rem' }}>获得积分</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ai-accent-green)' }}>
                    +{selectedPackage.size}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleRecharge}
            disabled={loading || !selectedPackage}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1rem',
              background: loading || !selectedPackage ? 'var(--ai-text-muted)' : 'var(--ai-accent-green)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 600,
              cursor: loading || !selectedPackage ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: '#000' }} />
                处理中...
              </>
            ) : (
              <>
                立即充值
                <ArrowRight size={18} />
              </>
            )}
          </button>
          
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--ai-text-muted)' }}>
            如有问题，请联系客服
          </p>
        </div>
      </div>
    </div>
  )
}

export default RechargeNew