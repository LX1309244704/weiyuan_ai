import { useState, useEffect } from 'react'
import api from '../../utils/api'
import dayjs from 'dayjs'
import { Search, Eye, RefreshCw, ShoppingCart, CreditCard, Wallet, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react'

const statusConfig = {
  pending: { label: '待支付', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  paid: { label: '已支付', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  refunded: { label: '已退款', color: 'bg-gray-100 text-gray-600', icon: XCircle },
}

const paymentMethodConfig = {
  wechat: { label: '微信', icon: Wallet },
  alipay: { label: '支付宝', icon: CreditCard },
}

function OrderDetailModal({ order, onClose, onRefund }) {
  const [refunding, setRefunding] = useState(false)
  
  const handleRefund = async () => {
    if (!confirm('确定要退款吗？')) return
    
    setRefunding(true)
    try {
      await onRefund()
      onClose()
    } catch (error) {
      alert('退款失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setRefunding(false)
    }
  }
  
  if (!order) return null
  
  const status = statusConfig[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' }
  const StatusIcon = status.icon
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">订单详情</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">订单号</p>
              <p className="font-mono text-sm text-gray-900 break-all">{order.orderNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">状态</p>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">用户</p>
              <p className="text-sm text-gray-900">{order.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">支付方式</p>
              <div className="flex items-center gap-1 text-sm text-gray-900">
                {paymentMethodConfig[order.paymentMethod]?.icon && (
                  <span className="w-4 h-4">
                    {(() => {
                      const Icon = paymentMethodConfig[order.paymentMethod].icon
                      return <Icon className="w-4 h-4" />
                    })()}
                  </span>
                )}
                {paymentMethodConfig[order.paymentMethod]?.label || '-'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">金额</p>
              <p className="text-lg font-bold text-green-600">¥{order.amount / 100}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">积分</p>
              <p className="text-lg font-semibold text-gray-900">{order.packageSize}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">交易号</p>
            <p className="font-mono text-xs text-gray-600">{order.transactionId || '-'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">创建时间</p>
              <p className="text-sm text-gray-900">{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">支付时间</p>
              <p className="text-sm text-gray-900">{order.paidAt ? dayjs(order.paidAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</p>
            </div>
          </div>
        </div>
        
        {order.status === 'paid' && (
          <div className="p-6 pt-0">
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              onClick={handleRefund}
              disabled={refunding}
            >
              <RefreshCw className={`w-4 h-4 ${refunding ? 'animate-spin' : ''}`} />
              {refunding ? '退款中...' : '退款'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  
  useEffect(() => {
    fetchOrders()
  }, [status])
  
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      params.append('limit', '100')
      const response = await api.get(`/admin/orders?${params}`)
      setOrders(response.data.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleRefund = async () => {
    await api.post(`/admin/orders/${selectedOrder.id}/refund`, { reason: '管理员手动退款' })
    alert('退款成功')
    fetchOrders()
  }
  
  const filteredOrders = orders.filter(order => 
    order.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
    order.user?.email?.toLowerCase().includes(search.toLowerCase())
  )
  
  const statusFilters = [
    { value: '', label: '全部' },
    { value: 'pending', label: '待支付' },
    { value: 'paid', label: '已支付' },
    { value: 'refunded', label: '已退款' }
  ]
  
  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单号/用户..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">订单号</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">用户</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">金额</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">积分</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">支付方式</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' }
                const StatusIcon = status.icon
                const paymentMethod = paymentMethodConfig[order.paymentMethod] || { label: order.paymentMethod }
                const PaymentIcon = paymentMethod.icon
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-600">{order.orderNo?.substring(0, 16)}...</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.user?.email?.substring(0, 24) || '-'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">¥{order.amount / 100}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.packageSize}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        {PaymentIcon && <PaymentIcon className="w-4 h-4" />}
                        {paymentMethod.label}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{dayjs(order.createdAt).format('MM-DD HH:mm')}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无数据</p>
          </div>
        )}
      </div>
      
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefund={handleRefund}
        />
      )}
    </div>
  )
}