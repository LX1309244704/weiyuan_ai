import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { DollarSign, TrendingUp, Wallet, CreditCard, Award, Download } from 'lucide-react'

function StatCard({ title, value, icon: Icon, color, prefix = '' }) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default function RevenueTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchStats()
  }, [])
  
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats/revenue')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch revenue:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
        ))}
        <div className="md:col-span-2 bg-gray-100 rounded-xl h-64 animate-pulse" />
        <div className="bg-gray-100 rounded-xl h-64 animate-pulse" />
      </div>
    )
  }
  
  const wechatRevenue = (stats?.byPaymentMethod?.wechat || 0) / 100
  const alipayRevenue = (stats?.byPaymentMethod?.alipay || 0) / 100
  const totalRevenue = wechatRevenue + alipayRevenue
  const wechatPercent = totalRevenue > 0 ? Math.round((wechatRevenue / totalRevenue) * 100) : 0
  const alipayPercent = totalRevenue > 0 ? Math.round((alipayRevenue / totalRevenue) * 100) : 0
  
  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="总收入" 
          value={(stats?.totalRevenue / 100).toFixed(2)} 
          icon={DollarSign} 
          color="green"
          prefix="¥"
        />
        <StatCard 
          title="今日收入" 
          value={(stats?.todayRevenue / 100).toFixed(2)} 
          icon={TrendingUp} 
          color="blue"
          prefix="¥"
        />
        <StatCard 
          title="本月收入" 
          value={(stats?.monthRevenue / 100).toFixed(2)} 
          icon={Award} 
          color="purple"
          prefix="¥"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">支付方式统计</h3>
          
          <div className="space-y-6">
            {/* WeChat */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-900">微信支付</span>
                </div>
                <span className="text-lg font-bold text-gray-900">¥{wechatRevenue.toFixed(2)}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${wechatPercent}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">{wechatPercent}% ({stats?.byPaymentMethod?.wechat ? (stats.byPaymentMethod.wechat / 100).toFixed(0) : 0} 笔)</p>
            </div>
            
            {/* Alipay */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">支付宝</span>
                </div>
                <span className="text-lg font-bold text-gray-900">¥{alipayRevenue.toFixed(2)}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${alipayPercent}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">{alipayPercent}% ({stats?.byPaymentMethod?.alipay ? (stats.byPaymentMethod.alipay / 100).toFixed(0) : 0} 笔)</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">总订单数</span>
              <span className="text-xl font-bold text-gray-900">{stats?.orderCount || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Top API Endpoints */}
        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">API 端点收入排行 TOP10</h3>
            <Award className="w-5 h-5 text-gray-400" />
          </div>
          
          {stats?.topEndpoints?.length > 0 ? (
            <div className="space-y-3">
              {stats.topEndpoints.map((endpoint, i) => (
                <div key={endpoint.endpointId} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-700' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{endpoint.name}</p>
                    <p className="text-sm text-gray-500">{endpoint.orderCount || endpoint.invocationCount} 次调用</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">¥{(endpoint.revenue / 100).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}