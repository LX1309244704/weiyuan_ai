import { useState, useEffect } from 'react'
import { useAuthStore } from '../../context/AuthContext'
import api from '../../utils/api'
import dayjs from 'dayjs'
import { Package, DollarSign, Users, Zap, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'

function StatCard({ title, value, icon: Icon, color, trend, prefix = '' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{Math.abs(trend)}% 较昨日</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardTab() {
  const [stats, setStats] = useState(null)
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchStats()
  }, [])
  
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats')
      setStats(response.data)
      setTrend(response.data.dailyTrend || [])
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
        ))}
      </div>
    )
  }
  
  const { stats: s } = stats || {}
  
  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="今日订单" 
          value={s?.todayOrders || 0} 
          icon={Package} 
          color="blue"
          trend={s?.todayOrdersTrend}
        />
        <StatCard 
          title="今日收入" 
          value={((s?.todayRevenue || 0) / 100).toFixed(2)} 
          icon={DollarSign} 
          color="green"
          prefix="¥"
          trend={s?.todayRevenueTrend}
        />
        <StatCard 
          title="总用户" 
          value={s?.totalUsers || 0} 
          icon={Users} 
          color="purple"
        />
        <StatCard 
          title="总调用" 
          value={s?.totalInvocations || 0} 
          icon={Zap} 
          color="orange"
        />
      </div>
      
      {/* Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">近7日趋势</h3>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        
        {trend.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">日期</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">订单数</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">收入</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trend.map((day, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-sm text-gray-900">{day.date}</td>
                    <td className="py-4 text-sm text-right font-medium">{day.orders}</td>
                    <td className="py-4 text-sm text-right text-green-600 font-medium">¥{(day.revenue / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}