import { useState, useEffect } from 'react'
import api from '../../utils/api'
import dayjs from 'dayjs'
import { Search, Eye, Users, Shield, Copy } from 'lucide-react'

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
      <input
        type="text"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: '2.5rem', width: '100%' }}
      />
    </div>
  )
}

function UserDetailModal({ user, onClose, onAdjustBalance }) {
  const [userDetail, setUserDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [adjustAmount, setAdjustAmount] = useState('')
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
    if (!adjustAmount || parseInt(adjustAmount) === 0) {
      alert('请输入调整数量')
      return
    }
    
    setAdjusting(true)
    try {
      await onAdjustBalance(user.id, parseInt(adjustAmount))
      setAdjustAmount('')
      fetchUserDetail()
    } catch (error) {
      alert('调整失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setAdjusting(false)
    }
  }
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }
  
  if (!user) return null
  
  const userData = userDetail?.user || {}
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '2rem',
        width: '500px',
        maxWidth: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>用户详情</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>加载中...</div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 700
              }}>
                {userData.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{userData.username || '-'}</p>
                <p style={{ color: '#64748b', margin: 0 }}>{userData.email}</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '10px' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>账户余额</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1', margin: 0 }}>{userData.balance} 积分</p>
              </div>
              <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '10px' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>角色权限</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem',
                    background: userData.role === 'admin' ? '#f3f4f6' : '#e5e7eb',
                    color: userData.role === 'admin' ? '#6366f1' : '#6b7280'
                  }}>
                    {userData.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b', fontWeight: 500 }}>API Key</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <code style={{ flex: 1, padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {userData.apiKey || '未生成'}
                </code>
                <button
                  onClick={() => userData.apiKey && copyToClipboard(userData.apiKey)}
                  disabled={!userData.apiKey}
                  style={{
                    padding: '0.75rem',
                    background: userData.apiKey ? '#f1f5f9' : '#e2e8f0',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: userData.apiKey ? 'pointer' : 'not-allowed',
                    color: userData.apiKey ? '#64748b' : '#94a3b8'
                  }}
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '10px' }}>
              <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>调整余额</p>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="正数增加，负数减少"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <button
                  onClick={handleAdjust}
                  disabled={adjusting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#22c55e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: adjusting ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {adjusting ? '处理中...' : '确认调整'}
                </button>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>正数增加余额，负数减少余额</p>
            </div>
          </div>
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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  useEffect(() => {
    fetchUsers()
  }, [page, search])
    
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = { page, pageSize: 20 }
      if (search) params.keyword = search
      const response = await api.get('/admin/users', { params })
      setUsers(response.data.users || [])
      setTotalPages(response.data.pagination?.pages || 1)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }
    
  const handleAdjustBalance = async (userId, amount) => {
    try {
      await api.post(`/admin/users/${userId}/adjust-balance`, {
        change: amount,
        reason: '管理员手动调整'
      })
      alert('调整成功')
      fetchUsers()
    } catch (error) {
      alert('调整失败: ' + (error.response?.data?.error || error.message))
    }
  }
    
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }
    
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>用户管理</h2>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <SearchInput value={search} onChange={(e) => { setSearch(e); setPage(1) }} placeholder="搜索用户邮箱/昵称..." style={{ flex: 1, minWidth: '200px' }} />
        <span style={{ color: '#64748b', fontSize: '1rem' }}>
          共 {users.length} 位用户
        </span>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>加载中...</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          暂无用户数据
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontWeight: 500 }}>用户信息</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontWeight: 500 }}>余额积分</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontWeight: 500 }}>累计购买</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontWeight: 500 }}>角色权限</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontWeight: 500 }}>注册时间</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b', fontWeight: 500 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600
                      }}>
                        {u.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, margin: 0 }}>{u.username || '-'}</p>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#6366f1' }}>{u.balance}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{u.totalPurchased || 0}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      color: u.role === 'admin' ? '#6366f1' : '#64748b'
                    }}>
                      {u.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>
                    {dayjs(u.created_at || u.createdAt).format('YYYY-MM-DD')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => setSelectedUser(u)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                    >
                      <Eye size={16} />
                      <span style={{ marginLeft: '0.25rem' }}>详情</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '0.5rem 1rem',
              background: page === 1 ? '#e2e8f0' : '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              color: page === 1 ? '#94a3b8' : '#64748b'
            }}
          >
            上一页
          </button>
          <span style={{ padding: '0.5rem 1rem', color: '#64748b' }}>
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: page === totalPages ? '#e2e8f0' : '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              color: page === totalPages ? '#94a3b8' : '#64748b'
            }}
          >
            下一页
          </button>
        </div>
      )}
      
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
