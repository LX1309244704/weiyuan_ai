import { useState, useEffect } from 'react'
import api from '../../utils/api'
import dayjs from 'dayjs'
import { Search, Eye, UserPlus, UserMinus, Users, Shield, Package, Zap, X } from 'lucide-react'

function UserDetailModal({ user, onClose, onAdjustBalance }) {
  const [userDetail, setUserDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [adjustAmount, setAdjustAmount] = useState(0)
  const [adjusting, setAdjusting] = useState(false)
  
  useEffect(() => {
    if (user) {
      fetchUserDetail()
    }
  }, [user])
  
  const fetchUserDetail = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/admin/users/${user.id}`)
      setUserDetail(response.data)
    } catch (error) {
      console.error('Failed to fetch user detail:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAdjust = async () => {
    if (adjustAmount === 0) {
      alert('请输入调整数量')
      return
    }
    
    setAdjusting(true)
    try {
      await onAdjustBalance(user.id, parseInt(adjustAmount))
      setAdjustAmount(0)
      fetchUserDetail()
    } catch (error) {
      alert('调整失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setAdjusting(false)
    }
  }
  
  if (!user) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">用户详情</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        ) : userDetail ? (
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">邮箱</p>
                <p className="font-medium text-gray-900">{userDetail.user?.email}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">昵称</p>
                <p className="font-medium text-gray-900">{userDetail.user?.name || '-'}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600 mb-1">余额</p>
                <p className="text-2xl font-bold text-blue-600">{userDetail.user?.balance} 积分</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-green-600 mb-1">累计购买</p>
                <p className="text-2xl font-bold text-green-600">{userDetail.user?.totalPurchased}</p>
              </div>
            </div>
            
            {/* API Key */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-2">API Key</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg font-mono text-xs break-all">
                  {userDetail.user?.apiKey}
                </code>
                <button 
                  onClick={() => navigator.clipboard.writeText(userDetail.user?.apiKey)}
                  className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  复制
                </button>
              </div>
            </div>
            
            {/* Adjust Balance */}
            <div className="p-4 border border-gray-200 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-3">调整余额</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="正数增加，负数减少"
                />
                <button
                  onClick={handleAdjust}
                  disabled={adjusting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {adjusting ? '调整中...' : <>确认</>}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">正数增加余额，负数减少余额</p>
            </div>
            
            {/* Recent Orders */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> 最近订单
              </p>
              {userDetail.recentOrders?.length > 0 ? (
                <div className="space-y-2">
                  {userDetail.recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs font-mono text-gray-600">{order.orderNo?.substring(0, 16)}...</p>
                        <p className="text-xs text-gray-500">{dayjs(order.createdAt).format('MM-DD HH:mm')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">¥{order.amount / 100}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">暂无订单</p>
              )}
            </div>
            
            {/* Recent Invocations */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> 最近调用
              </p>
              {userDetail.recentInvocations?.length > 0 ? (
                <div className="space-y-2">
                  {userDetail.recentInvocations.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-900">{inv.skill?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{dayjs(inv.createdAt).format('MM-DD HH:mm')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">-{inv.cost}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          inv.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">暂无调用记录</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">加载失败</div>
        )}
      </div>
    </div>
  )
}

export default function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  
  useEffect(() => {
    fetchUsers()
  }, [])
  
  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users?limit=100')
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAdjustBalance = async (userId, amount) => {
    await api.post(`/admin/users/${userId}/adjust-balance`, {
      amount,
      reason: '管理员手动调整'
    })
    alert('调整成功')
    fetchUsers()
  }
  
  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <div>
      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户邮箱/昵称..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500">
          共 {filteredUsers.length} 用户
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">用户</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">余额</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">累计购买</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">角色</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">注册时间</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {u.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name || '-'}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-blue-600">{u.balance}</span>
                    <span className="text-xs text-gray-500 ml-1">积分</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.totalPurchased}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      {u.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{dayjs(u.createdAt).format('YYYY-MM-DD')}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => setSelectedUser(u)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无数据</p>
          </div>
        )}
      </div>
      
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAdjustBalance={handleAdjustBalance}
        />
      )}
    </div>
  )
}