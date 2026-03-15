import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Home, User, RefreshCw } from 'lucide-react'
import api from '../utils/api'

function PaymentResult() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderNo = searchParams.get('orderNo')
  const type = searchParams.get('type') || 'success'
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (orderNo) {
      fetchOrder()
    } else {
      setLoading(false)
    }
  }, [orderNo])
  
  const fetchOrder = async () => {
    try {
      const res = await api.get(`/payment/status/${orderNo}`)
      setOrder(res.data)
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
  
  const isSuccess = type === 'success' || order?.status === 'paid'
  
  return (
    <div style={{ 
      minHeight: '60vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      {isSuccess ? (
        <>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.3)'
          }}>
            <CheckCircle size={48} color="white" />
          </div>
          <h2 style={{ marginBottom: '0.5rem', color: '#0f172a', fontSize: '1.5rem' }}>
            支付成功
          </h2>
          {order && (
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
              已成功充值 <strong style={{ color: '#22c55e', fontSize: '1.25rem' }}>{order.packageSize}</strong> 积分
            </p>
          )}
        </>
      ) : (
        <>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <XCircle size={48} color="white" />
          </div>
          <h2 style={{ marginBottom: '0.5rem', color: '#0f172a', fontSize: '1.5rem' }}>
            支付失败
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            支付遇到问题，请重试或联系客服
          </p>
        </>
      )}
      
      {order && (
        <div className="card" style={{ width: '100%', maxWidth: '400px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b' }}>订单号</span>
            <code style={{ fontSize: '0.875rem' }}>{order.orderNo}</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b' }}>支付金额</span>
            <span style={{ fontWeight: 600, color: isSuccess ? '#22c55e' : '#ef4444' }}>
              ¥{(order.amount / 100).toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <span style={{ color: '#64748b' }}>获得积分</span>
            <span style={{ fontWeight: 500 }}>{order.packageSize}</span>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate('/')} className="btn-secondary">
          <Home size={16} /> 返回市场
        </button>
        {isSuccess && (
          <button onClick={() => navigate('/profile')} className="btn-primary">
            <User size={16} /> 查看余额
          </button>
        )}
        {!isSuccess && orderNo && (
          <button onClick={() => navigate(`/payment/${orderNo}`)} className="btn-primary">
            <RefreshCw size={16} /> 重新支付
          </button>
        )}
      </div>
    </div>
  )
}

export default PaymentResult