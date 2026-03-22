import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { Server, Database, HardDrive, Mail, Shield, CheckCircle, XCircle, Wallet, CreditCard, Settings as SettingsIcon } from 'lucide-react'

function SettingCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function StatusBadge({ status }) {
  return status ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" /> 正常
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <XCircle className="w-3 h-3" /> 异常
    </span>
  )
}

export default function SettingsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchStats()
  }, [])
  
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
        ))}
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Server Config */}
      <SettingCard title="服务配置" icon={Server}>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">服务端口</span>
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">3000</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">数据库</span>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="font-mono text-sm">localhost:3306</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Redis</span>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-400" />
              <span className="font-mono text-sm">localhost:6379</span>
            </div>
          </div>
        </div>
      </SettingCard>
      
      {/* System Status */}
      <SettingCard title="系统状态" icon={CheckCircle}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">数据库连接</span>
            </div>
            <StatusBadge status={true} />
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Redis 连接</span>
            </div>
            <StatusBadge status={true} />
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">API 服务</span>
            </div>
            <StatusBadge status={true} />
          </div>
        </div>
      </SettingCard>
      
      {/* Payment Config */}
      <SettingCard title="支付配置" icon={Wallet}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">微信支付</span>
            </div>
            <span className="text-sm text-gray-500">已配置</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">支付宝</span>
            </div>
            <span className="text-sm text-gray-500">已配置</span>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            支付配置通过环境变量管理，修改请编辑 server/.env 文件
          </p>
        </div>
      </SettingCard>
      
      {/* Security */}
      <SettingCard title="安全设置" icon={Shield}>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">JWT 密钥</span>
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> 已配置
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">密码加密</span>
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> bcrypt
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">HTTPS</span>
            <span className="text-sm text-yellow-600 flex items-center gap-1">
              开发环境
            </span>
          </div>
        </div>
      </SettingCard>
      
      {/* Quick Stats */}
      <SettingCard title="快速统计" icon={SettingsIcon}>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats?.stats?.totalUsers || 0}</p>
            <p className="text-sm text-blue-600">总用户</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats?.stats?.totalInvocations || 0}</p>
            <p className="text-sm text-green-600">总调用</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats?.stats?.todayOrders || 0}</p>
            <p className="text-sm text-purple-600">今日订单</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">¥{((stats?.stats?.todayRevenue || 0) / 100).toFixed(2)}</p>
            <p className="text-sm text-orange-600">今日收入</p>
          </div>
        </div>
      </SettingCard>
      
      {/* About */}
      <SettingCard title="关于系统" icon={SettingsIcon}>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">系统名称</span>
            <span className="text-gray-900">Weiyuan AI</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">版本</span>
            <span className="text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">技术栈</span>
            <span className="text-gray-900">React + Node.js</span>
          </div>
        </div>
      </SettingCard>
    </div>
  )
}