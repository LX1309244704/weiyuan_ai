import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/AuthContext'
import api from '../utils/api'
import dayjs from 'dayjs'
import InvocationsTab from '../components/admin/InvocationsTab'
import { 
  LayoutDashboard, Wrench, ShoppingCart, Users, DollarSign, Settings, 
  Home, Package, Search, Plus,
  Edit2, Trash2, Eye, RefreshCw, Award, CheckCircle, XCircle,
  Wallet, CreditCard, Shield, TrendingUp, Zap, Clock,
  Copy, Server, X, AlertCircle, Download, Upload, Check, Code,
  ArrowLeft, LogOut
} from 'lucide-react'

const menuItems = [
  { key: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { key: 'skills', label: 'Skill 管理', icon: Wrench },
  { key: 'endpoints', label: 'API 端点', icon: Code },
  { key: 'invocations', label: '调用记录', icon: Zap },
  { key: 'orders', label: '订单管理', icon: ShoppingCart },
  { key: 'users', label: '用户管理', icon: Users },
  { key: 'revenue', label: '财务统计', icon: DollarSign },
  { key: 'settings', label: '系统设置', icon: Settings },
]

export default function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (user?.role !== 'admin') {
      navigate('/')
      return
    }
    setLoading(false)
  }, [isAuthenticated, user, navigate])
  
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }
  
  const currentItem = menuItems.find(item => item.key === activeTab)
  
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Top Navigation */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '13px'
              }}>OC</div>
              <span style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a' }}>管理后台</span>
            </div>
          </div>
          
          {/* Menu */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', height: '100%' }}>
            {menuItems.map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#6366f1' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '100%'
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              )
            })}
          </nav>
          
          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                background: '#22c55e',
                border: 'none',
                borderRadius: '6px',
                color: '#000',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              <ArrowLeft size={14} />
              返回用户端
            </button>
            <button
              onClick={() => logout() && navigate('/login')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                background: 'transparent',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                color: '#64748b',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#ef4444'
                e.target.style.color = '#ef4444'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.color = '#64748b'
              }}
            >
              <LogOut size={14} />
              退出
            </button>
          </div>
        </div>
      </header>
      
      {/* Page Title */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 1.5rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>{currentItem?.label}</h1>
        </div>
      </div>
      
      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'skills' && <SkillsTab />}
        {activeTab === 'endpoints' && <EndpointsTab />}
        {activeTab === 'invocations' && <InvocationsTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'revenue' && <RevenueTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  )
}

// ==================== Dashboard ====================

function DashboardTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => { fetchStats() }, [])
  
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats')
      setStats(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  const s = stats?.stats || {}
  
  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard title="今日订单" value={s.todayOrders || 0} icon={Package} color="#6366f1" />
        <StatCard title="今日收入" value={`¥${((s.todayRevenue || 0) / 100).toFixed(2)}`} icon={DollarSign} color="#22c55e" />
        <StatCard title="总用户" value={(s.totalUsers || 0).toLocaleString()} icon={Users} color="#8b5cf6" />
        <StatCard title="总调用" value={(s.totalInvocations || 0).toLocaleString()} icon={Zap} color="#f59e0b" />
      </div>
      
      {/* Trend */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>近7日趋势</h3>
        {(stats?.dailyTrend || []).length === 0 ? (
          <EmptyState icon={TrendingUp} text="暂无数据" />
        ) : (
          <Table
            columns={[
              { key: 'date', title: '日期' },
              { key: 'orders', title: '订单数', align: 'right', render: r => <span style={{ color: '#6366f1', fontWeight: 500 }}>{r.orders || 0}</span> },
              { key: 'revenue', title: '收入', align: 'right', render: r => <span style={{ color: '#22c55e', fontWeight: 500 }}>¥{((r.revenue || 0) / 100).toFixed(2)}</span> }
            ]}
            data={stats?.dailyTrend || []}
          />
        )}
      </div>
    </div>
  )
}

// ==================== Skills ====================

function SkillsTab() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editSkill, setEditSkill] = useState(null)
  const [search, setSearch] = useState('')
  
  useEffect(() => { fetchSkills() }, [])
  
  const fetchSkills = async () => {
    try {
      const res = await api.get('/admin/skills?limit=100')
      setSkills(res.data.skills || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }
  
  const handleDelete = async (skill) => {
    if (!confirm(`确定删除 "${skill.name}" 吗？`)) return
    try {
      await api.delete(`/admin/skills/${skill.id}`)
      fetchSkills()
    } catch (e) { alert('删除失败') }
  }
  
  const handleToggle = async (skill) => {
    try {
      await api.put(`/admin/skills/${skill.id}`, { isActive: !skill.isActive })
      fetchSkills()
    } catch (e) { alert('操作失败') }
  }
  
  const filtered = skills.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索 Skill..." style={{ flex: 1 }} />
        <button onClick={() => { setEditSkill(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> 新增
        </button>
      </div>
      
      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? <LoadingSpinner /> : (
          <Table
            columns={[
              { 
                key: 'name', 
                title: 'Skill',
                render: r => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {r.icon ? (
                      <img src={r.icon} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={20} style={{ color: '#94a3b8' }} />
                      </div>
                    )}
                    <div>
                      <p style={{ fontWeight: 500, color: '#0f172a' }}>{r.name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.category || '未分类'}</p>
                    </div>
                  </div>
                )
              },
              { 
                key: 'price', 
                title: '价格',
                align: 'right',
                render: r => <span style={{ fontWeight: 500, color: '#6366f1' }}>¥{(r.pricePerCall / 100).toFixed(2)}</span>
              },
              { 
                key: 'status', 
                title: '状态',
                render: r => (
                  <span className={`badge ${r.isActive ? 'badge-success' : 'badge-default'}`}>
                    {r.isActive ? '上架' : '下架'}
                  </span>
                )
              },
              { key: 'createdAt', title: '创建时间', render: r => dayjs(r.createdAt).format('YYYY-MM-DD') },
              {
                key: 'actions',
                title: '',
                align: 'right',
                render: r => (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setEditSkill(r); setShowModal(true); }} className="btn-icon" title="编辑"><Edit2 size={16} /></button>
                    <button onClick={() => handleToggle(r)} className="btn-icon" title={r.isActive ? '下架' : '上架'} style={{ color: r.isActive ? '#f59e0b' : '#22c55e' }}>
                      {r.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    </button>
                    <button onClick={() => handleDelete(r)} className="btn-icon" title="删除" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                  </div>
                )
              }
            ]}
            data={filtered}
            emptyText="暂无 Skill"
          />
        )}
      </div>
      
      {/* Modal */}
      {showModal && (
        <SkillModal 
          skill={editSkill} 
          onClose={() => setShowModal(false)} 
          onSave={() => { setShowModal(false); fetchSkills(); }}
        />
      )}
    </div>
  )
}

function SkillModal({ skill, onClose, onSave }) {
  const [form, setForm] = useState({
    name: skill?.name || '',
    description: skill?.description || '',
    category: skill?.category || '',
    pricePerCall: skill?.pricePerCall ? skill.pricePerCall / 100 : 1,
    version: skill?.version || '1.0.0',
    author: skill?.author || '',
    readme: skill?.readme || '',
    isActive: skill?.isActive ?? true
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [packageFile, setPackageFile] = useState(null)
  const [iconFile, setIconFile] = useState(null)
  const [hasPackage, setHasPackage] = useState(!!skill?.packageUrl)
  const [hasIcon, setHasIcon] = useState(!!skill?.icon)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('请输入名称')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = { ...form, pricePerCall: Math.round(form.pricePerCall * 100) }
      let skillId = skill?.id
      
      if (skill) {
        await api.put(`/admin/skills/${skill.id}`, data)
      } else {
        const res = await api.post('/admin/skills', data)
        skillId = res.data.skill.id
      }
      
      if (packageFile && skillId) {
        const formData = new FormData()
        formData.append('package', packageFile)
        await api.post(`/admin/skills/${skillId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      
      if (iconFile && skillId) {
        const formData = new FormData()
        formData.append('icon', iconFile)
        await api.post(`/admin/skills/${skillId}/icon`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      
      onSave()
    } catch (err) {
      setError(err.response?.data?.error || '保存失败')
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <Modal title={skill ? '编辑 Skill' : '新增 Skill'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert-error" style={{ marginBottom: '1rem' }}><AlertCircle size={16} /> {error}</div>}
        
        <FormField label="名称" required>
          <input type="text" className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Skill 名称" />
        </FormField>
        
        <FormField label="描述">
          <textarea className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="描述信息" style={{ minHeight: '80px', resize: 'vertical' }} />
        </FormField>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="分类">
            <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="">请选择分类</option>
              <option value="productivity">效率工具</option>
              <option value="ai">AI 助手</option>
              <option value="developer">开发者</option>
              <option value="creative">创意工具</option>
            </select>
          </FormField>
          <FormField label="版本">
            <input type="text" className="input" value={form.version} onChange={e => setForm({...form, version: e.target.value})} placeholder="1.0.0" />
          </FormField>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="单价 (元)" required>
            <input type="number" step="0.01" min="0" className="input" value={form.pricePerCall} onChange={e => setForm({...form, pricePerCall: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="作者">
            <input type="text" className="input" value={form.author} onChange={e => setForm({...form, author: e.target.value})} placeholder="作者名称" />
          </FormField>
        </div>
        
        <FormField label="安装说明 (Markdown)">
          <textarea className="input" value={form.readme} onChange={e => setForm({...form, readme: e.target.value})} placeholder="安装和使用说明..." style={{ minHeight: '60px', resize: 'vertical' }} />
        </FormField>
        
        <FormField label="状态">
          <select className="input" value={form.isActive ? 'true' : 'false'} onChange={e => setForm({...form, isActive: e.target.value === 'true'})}>
            <option value="true">上架</option>
            <option value="false">下架</option>
          </select>
        </FormField>
        
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>文件上传</h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Skill 压缩包 (.zip)</label>
            <div style={{ 
              border: '2px dashed #e2e8f0', 
              borderRadius: '8px', 
              padding: '1rem',
              textAlign: 'center',
              background: packageFile ? '#f0fdf4' : 'white',
              borderColor: packageFile ? '#22c55e' : '#e2e8f0'
            }}>
              <input 
                type="file" 
                accept=".zip" 
                onChange={e => setPackageFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="package-upload"
              />
              <label htmlFor="package-upload" style={{ cursor: 'pointer' }}>
                {packageFile ? (
                  <div>
                    <Check size={24} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: 500 }}>{packageFile.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>点击更换文件</p>
                  </div>
                ) : hasPackage ? (
                  <div>
                    <Check size={24} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: 500 }}>已上传</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>点击更换文件</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>点击或拖拽上传 .zip 文件</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>最大 50MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>图标图片</label>
            <div style={{ 
              border: '2px dashed #e2e8f0', 
              borderRadius: '8px', 
              padding: '1rem',
              textAlign: 'center',
              background: iconFile ? '#f0fdf4' : 'white',
              borderColor: iconFile ? '#22c55e' : '#e2e8f0'
            }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => setIconFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="icon-upload"
              />
              <label htmlFor="icon-upload" style={{ cursor: 'pointer' }}>
                {iconFile ? (
                  <div>
                    <Check size={24} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: 500 }}>{iconFile.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>点击更换图片</p>
                  </div>
                ) : hasIcon ? (
                  <div>
                    <Check size={24} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: 500 }}>已上传</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>点击更换图片</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>点击或拖拽上传图标</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>支持 PNG, JPG, SVG</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>取消</button>
          <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ==================== Orders ====================

function OrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  
  useEffect(() => { fetchOrders() }, [statusFilter])
  
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}&limit=100` : '?limit=100'
      const res = await api.get(`/admin/orders${params}`)
      setOrders(res.data.orders || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }
  
  const handleRefund = async () => {
    if (!confirm('确定退款？')) return
    try {
      await api.post(`/admin/orders/${detail.id}/refund`, { reason: '管理员退款' })
      alert('退款成功')
      setDetail(null)
      fetchOrders()
    } catch (e) {
      alert('退款失败')
    }
  }
  
  const statusMap = {
    pending: { label: '待支付', className: 'badge-warning' },
    paid: { label: '已支付', className: 'badge-success' },
    refunded: { label: '已退款', className: 'badge-default' }
  }
  
  const filtered = orders.filter(o =>
    o.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.email?.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['', 'pending', 'paid', 'refunded'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={statusFilter === s ? 'btn-primary' : 'btn-outline'}
            >
              {s === '' ? '全部' : statusMap[s]?.label}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索订单..." />
      </div>
      
      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? <LoadingSpinner /> : (
          <Table
            columns={[
              { key: 'orderNo', title: '订单号', render: r => <code style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.orderNo?.slice(0, 16)}...</code> },
              { key: 'user', title: '用户', render: r => r.user?.email?.slice(0, 24) || '-' },
              { key: 'amount', title: '金额', align: 'right', render: r => <span style={{ fontWeight: 600, color: '#22c55e' }}>¥{(r.amount / 100).toFixed(2)}</span> },
              { 
                key: 'status', 
                title: '状态',
                render: r => <span className={`badge ${statusMap[r.status]?.className || 'badge-default'}`}>{statusMap[r.status]?.label || r.status}</span>
              },
              { key: 'createdAt', title: '时间', render: r => dayjs(r.createdAt).format('MM-DD HH:mm') },
              { key: 'actions', title: '', align: 'right', render: r => <button onClick={() => setDetail(r)} className="btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}><Eye size={14} /> 详情</button> }
            ]}
            data={filtered}
            emptyText="暂无订单"
          />
        )}
      </div>
      
      {/* Detail Modal */}
      {detail && (
        <Modal title="订单详情" onClose={() => setDetail(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <InfoBlock label="订单号" value={detail.orderNo} mono />
            <InfoBlock label="状态" badge={statusMap[detail.status]?.label} badgeClass={statusMap[detail.status]?.className} />
          </div>
          <InfoBlock label="用户" value={detail.user?.email} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <InfoBlock label="金额" value={`¥${(detail.amount / 100).toFixed(2)}`} highlight />
            <InfoBlock label="积分" value={detail.packageSize} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <InfoBlock label="支付方式" value={detail.paymentMethod === 'wechat' ? '微信' : '支付宝'} />
            <InfoBlock label="时间" value={dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')} />
          </div>
          {detail.status === 'paid' && (
            <button onClick={handleRefund} className="btn-danger" style={{ width: '100%', marginTop: '0.5rem' }}>
              <RefreshCw size={16} /> 退款
            </button>
          )}
        </Modal>
      )}
    </div>
  )
}

// ==================== Users ====================

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [userData, setUserData] = useState(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  
  useEffect(() => { fetchUsers() }, [])
  
  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users?limit=100')
      setUsers(res.data.users || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }
  
  const viewDetail = async (user) => {
    setDetail(user)
    try {
      const res = await api.get(`/admin/users/${user.id}`)
      setUserData(res.data)
    } catch (e) { console.error(e) }
  }
  
  const handleAdjust = async () => {
    const changeValue = parseInt(adjustAmount)
    if (!changeValue) return alert('请输入数量')
    if (isNaN(changeValue)) return alert('请输入有效数字')
    setAdjusting(true)
    try {
      await api.post(`/admin/users/${detail.id}/adjust-balance`, { 
        change: changeValue, 
        reason: '管理员调整' 
      })
      alert('调整成功')
      setAdjustAmount('')
      fetchUsers()
      viewDetail({ ...detail, balance: detail.balance + changeValue })
    } catch (e) {
      alert('调整失败: ' + (e.response?.data?.error || e.message))
    } finally {
      setAdjusting(false)
    }
  }
  
  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索用户..." style={{ flex: 1 }} />
        <span style={{ color: '#64748b', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>共 {filtered.length} 位用户</span>
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        {loading ? <LoadingSpinner /> : (
          <Table
            columns={[
              { 
                key: 'user', 
                title: '用户',
                render: r => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                      {(r.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, color: '#0f172a' }}>{r.name || '-'}</p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.email}</p>
                    </div>
                  </div>
                )
              },
              { key: 'balance', title: '余额', align: 'right', render: r => <span style={{ fontWeight: 600, color: '#6366f1' }}>{r.balance}</span> },
              { key: 'role', title: '角色', render: r => <span className={`badge ${r.role === 'admin' ? 'badge-primary' : 'badge-default'}`}>{r.role === 'admin' ? '管理员' : '用户'}</span> },
              { key: 'createdAt', title: '注册时间', render: r => dayjs(r.createdAt).format('YYYY-MM-DD') },
              { key: 'actions', title: '', align: 'right', render: r => <button onClick={() => viewDetail(r)} className="btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}><Eye size={14} /> 详情</button> }
            ]}
            data={filtered}
            emptyText="暂无用户"
          />
        )}
      </div>
      
      {detail && (
        <Modal title="用户详情" onClose={() => setDetail(null)}>
          {userData ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                  {(userData.user?.email?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#0f172a' }}>{userData.user?.name || '未设置'}</p>
                  <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{userData.user?.email}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <InfoBlock label="当前余额" value={userData.user?.balance} highlight />
                <InfoBlock label="累计购买" value={userData.user?.totalPurchased} />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>API Key</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <code style={{ flex: 1, padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userData.user?.apiKey}</code>
                  <button onClick={() => navigator.clipboard.writeText(userData.user?.apiKey)} className="btn-outline" style={{ padding: '0.5rem' }}><Copy size={16} /></button>
                </div>
              </div>
              
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>调整余额</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" className="input" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="正数增加，负数减少" />
                  <button onClick={handleAdjust} disabled={adjusting} className="btn-primary">{adjusting ? '处理中...' : '确认'}</button>
                </div>
              </div>
            </>
          ) : <LoadingSpinner />}
        </Modal>
      )}
    </div>
  )
}

// ==================== Revenue ====================

function RevenueTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  
  useEffect(() => {
    api.get('/admin/stats/revenue').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])
  
  const handleExport = async (type) => {
    setExporting(true)
    try {
      const response = await api.get(`/admin/stats/export?format=csv&type=${type}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('导出失败')
    } finally {
      setExporting(false)
    }
  }
  
  if (loading) return <LoadingSpinner />
  
  const wechat = (stats?.byPaymentMethod?.wechat || 0) / 100
  const alipay = (stats?.byPaymentMethod?.alipay || 0) / 100
  const total = wechat + alipay
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>财务统计</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => handleExport('revenue')} disabled={exporting} className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}>
            <Download size={14} /> 导出收入报表
          </button>
          <button onClick={() => handleExport('orders')} disabled={exporting} className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}>
            <Download size={14} /> 导出订单报表
          </button>
          <button onClick={() => handleExport('users')} disabled={exporting} className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}>
            <Download size={14} /> 导出用户报表
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard title="总收入" value={`¥${((stats?.totalRevenue || 0) / 100).toFixed(2)}`} icon={DollarSign} color="#22c55e" />
        <StatCard title="今日收入" value={`¥${((stats?.todayRevenue || 0) / 100).toFixed(2)}`} icon={TrendingUp} color="#6366f1" />
        <StatCard title="本月收入" value={`¥${((stats?.monthRevenue || 0) / 100).toFixed(2)}`} icon={Award} color="#8b5cf6" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>支付方式</h3>
          <ProgressBar label="微信支付" value={wechat} total={total} color="#22c55e" />
          <ProgressBar label="支付宝" value={alipay} total={total} color="#3b82f6" />
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>总订单</span>
            <span style={{ fontWeight: 600 }}>{stats?.orderCount || 0}</span>
          </div>
        </div>
        
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>收入排行</h3>
          {(stats?.topSkills || []).length === 0 ? (
            <EmptyState icon={Award} text="暂无数据" />
          ) : (
            (stats?.topSkills || []).map((s, i) => (
              <div key={s.skillId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#cd7f32', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{s.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.orderCount} 笔</p>
                </div>
                <span style={{ fontWeight: 600, color: '#22c55e' }}>¥{(s.revenue / 100).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== Settings ====================

function SettingsTab() {
  const [paymentConfig, setPaymentConfig] = useState({
    wechat: { appId: '', mchId: '', apiKey: '', enabled: false },
    alipay: { appId: '', privateKey: '', enabled: false }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    fetchConfig()
  }, [])
  
  const fetchConfig = async () => {
    try {
      const res = await api.get('/admin/config/payment')
      if (res.data.config) {
        setPaymentConfig(res.data.config)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/config/payment', paymentConfig)
      alert('保存成功')
    } catch (e) {
      alert('保存失败: ' + (e.response?.data?.error || e.message))
    } finally {
      setSaving(false)
    }
  }
  
  const updateWechatConfig = (key, value) => {
    setPaymentConfig(prev => ({
      ...prev,
      wechat: { ...prev.wechat, [key]: value }
    }))
  }
  
  const updateAlipayConfig = (key, value) => {
    setPaymentConfig(prev => ({
      ...prev,
      alipay: { ...prev.alipay, [key]: value }
    }))
  }
  
  if (loading) return <LoadingSpinner />
  
  return (
    <div>
      {/* Payment Config */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={20} style={{ color: '#22c55e' }} />
          微信支付配置
        </h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={paymentConfig.wechat.enabled}
              onChange={(e) => updateWechatConfig('enabled', e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: 500 }}>启用微信支付</span>
          </label>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              AppID (公众号/小程序)
            </label>
            <input
              type="text"
              className="input"
              value={paymentConfig.wechat.appId}
              onChange={(e) => updateWechatConfig('appId', e.target.value)}
              placeholder="wx..."
              disabled={!paymentConfig.wechat.enabled}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              商户号 (MchID)
            </label>
            <input
              type="text"
              className="input"
              value={paymentConfig.wechat.mchId}
              onChange={(e) => updateWechatConfig('mchId', e.target.value)}
              placeholder="16xxxxxx"
              disabled={!paymentConfig.wechat.enabled}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              API 密钥 (v2)
            </label>
            <input
              type="password"
              className="input"
              value={paymentConfig.wechat.apiKey}
              onChange={(e) => updateWechatConfig('apiKey', e.target.value)}
              placeholder="32位密钥"
              disabled={!paymentConfig.wechat.enabled}
            />
          </div>
        </div>
        
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
          提示：APIv3 密钥和证书请通过环境变量配置，此处仅配置基础参数
        </p>
      </div>
      
      {/* Alipay Config */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={20} style={{ color: '#3b82f6' }} />
          支付宝配置
        </h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={paymentConfig.alipay.enabled}
              onChange={(e) => updateAlipayConfig('enabled', e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: 500 }}>启用支付宝</span>
          </label>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              应用 ID (AppID)
            </label>
            <input
              type="text"
              className="input"
              value={paymentConfig.alipay.appId}
              onChange={(e) => updateAlipayConfig('appId', e.target.value)}
              placeholder="2021xxxx..."
              disabled={!paymentConfig.alipay.enabled}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              应用私钥
            </label>
            <textarea
              className="input"
              value={paymentConfig.alipay.privateKey}
              onChange={(e) => updateAlipayConfig('privateKey', e.target.value)}
              placeholder="MIIEvgIBADANBg..."
              disabled={!paymentConfig.alipay.enabled}
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>
        </div>
        
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
          提示：支付宝公钥请通过环境变量 ALIPAY_PUBLIC_KEY 配置
        </p>
      </div>
      
      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary"
        style={{ marginBottom: '1.5rem' }}
      >
        {saving ? '保存中...' : '保存配置'}
      </button>
      
      {/* Other Settings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={18} style={{ color: '#6366f1' }} /> 服务配置
          </h3>
          <InfoRow label="端口" value="3000" />
          <InfoRow label="数据库" value="MySQL" />
          <InfoRow label="缓存" value="Redis" />
        </div>
        
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} style={{ color: '#22c55e' }} /> 系统状态
          </h3>
          <StatusRow label="数据库" />
          <StatusRow label="Redis" />
          <StatusRow label="API" />
        </div>
        
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} style={{ color: '#8b5cf6' }} /> 安全设置
          </h3>
          <InfoRow label="JWT" value="已启用" badge="success" />
          <InfoRow label="加密" value="bcrypt" />
          <InfoRow label="HTTPS" value="开发模式" badge="warning" />
        </div>
      </div>
    </div>
  )
}

// ==================== Common Components ====================

function LoadingSpinner() {
  return <div style={{ padding: '3rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
}

function EmptyState({ icon: Icon, text }) {
  return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}><Icon size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} /><p style={{ fontSize: '0.875rem' }}>{text}</p></div>
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{title}</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</p>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function SearchInput({ value, onChange, placeholder, ...props }) {
  return (
    <div style={{ position: 'relative', ...props.style }}>
      <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
      <input
        type="text"
        className="input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: '2.5rem', ...props.style }}
      />
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  )
}

function FormField({ label, required, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function Table({ columns, data, emptyText }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            {columns.map(col => (
              <th key={col.key} style={{ textAlign: col.align || 'left', padding: '0.75rem 1rem', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length}><EmptyState icon={Package} text={emptyText || '暂无数据'} /></td></tr>
          ) : data.map((row, i) => (
            <tr key={row.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: '0.75rem 1rem', textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InfoBlock({ label, value, mono, badge, badgeClass, highlight }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{label}</p>
      {badge ? (
        <span className={`badge ${badgeClass}`}>{badge}</span>
      ) : (
        <p style={{ fontWeight: highlight ? 600 : 400, color: highlight ? '#6366f1' : '#0f172a', fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? '0.75rem' : 'inherit' }}>{value}</p>
      )}
    </div>
  )
}

function InfoRow({ label, value, badge }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{label}</span>
      {badge ? <span className={`badge badge-${badge}`}>{value}</span> : <span style={{ fontSize: '0.875rem' }}>{value}</span>}
    </div>
  )
}

function StatusRow({ label }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{label}</span>
      </div>
      <span className="badge badge-success">正常</span>
    </div>
  )
}

function ProgressBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round(value / total * 100) : 0
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 500 }}>¥{value.toFixed(2)} ({pct}%)</span>
      </div>
      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }} />
      </div>
    </div>
  )
}

function EndpointsTab() {
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEndpoint, setEditEndpoint] = useState(null)
  const [search, setSearch] = useState('')
  
  useEffect(() => { fetchEndpoints() }, [])
  
  const fetchEndpoints = async () => {
    try {
      const res = await api.get('/admin/endpoints?limit=100')
      setEndpoints(res.data.endpoints || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }
  
  const handleDelete = async (endpoint) => {
    if (!confirm(`确定删除 "${endpoint.name}" 吗？`)) return
    try {
      await api.delete(`/admin/endpoints/${endpoint.id}`)
      fetchEndpoints()
    } catch (e) { alert('删除失败') }
  }
  
  const handleToggle = async (endpoint) => {
    try {
      await api.put(`/admin/endpoints/${endpoint.id}`, { isActive: !endpoint.isActive })
      fetchEndpoints()
    } catch (e) { alert('操作失败') }
  }
  
  const filtered = endpoints.filter(e => 
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase()) ||
    e.pathPrefix?.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索 API 端点..." style={{ flex: 1 }} />
        <button onClick={() => { setEditEndpoint(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> 新增
        </button>
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        {loading ? <LoadingSpinner /> : (
          <Table
            columns={[
              { 
                key: 'name', 
                title: 'API 端点',
                render: r => (
                  <div>
                    <p style={{ fontWeight: 500, color: '#0f172a' }}>{r.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.category || '通用'}</p>
                  </div>
                )
              },
              { 
                key: 'path', 
                title: '路径',
                render: r => (
                  <code style={{ fontSize: '0.75rem', background: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    {r.method} /api/proxy/{r.pathPrefix}
                  </code>
                )
              },
              { 
                key: 'target', 
                title: '目标URL',
                render: r => (
                  <span style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.targetUrl}
                  </span>
                )
              },
              { 
                key: 'price', 
                title: '价格',
                align: 'right',
                render: r => <span style={{ fontWeight: 500, color: '#6366f1' }}>¥{(r.pricePerCall / 100).toFixed(2)}</span>
              },
              { 
                key: 'status', 
                title: '状态',
                render: r => (
                  <span className={`badge ${r.isActive ? 'badge-success' : 'badge-default'}`}>
                    {r.isActive ? '启用' : '禁用'}
                  </span>
                )
              },
              { key: 'usage', title: '调用次数', align: 'right', render: r => r.usageCount || 0 },
              {
                key: 'actions',
                title: '',
                align: 'right',
                render: r => (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setEditEndpoint(r); setShowModal(true); }} className="btn-icon" title="编辑"><Edit2 size={16} /></button>
                    <button onClick={() => handleToggle(r)} className="btn-icon" title={r.isActive ? '禁用' : '启用'} style={{ color: r.isActive ? '#f59e0b' : '#22c55e' }}>
                      {r.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    </button>
                    <button onClick={() => handleDelete(r)} className="btn-icon" title="删除" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                  </div>
                )
              }
            ]}
            data={filtered}
            emptyText="暂无 API 端点"
          />
        )}
      </div>
      
      {showModal && (
        <EndpointModal 
          endpoint={editEndpoint} 
          onClose={() => setShowModal(false)} 
          onSave={() => { setShowModal(false); fetchEndpoints(); }}
        />
      )}
    </div>
  )
}

function EndpointModal({ endpoint, onClose, onSave }) {
  const [form, setForm] = useState({
    name: endpoint?.name || '',
    description: endpoint?.description || '',
    category: endpoint?.category || '',
    targetUrl: endpoint?.targetUrl || '',
    method: endpoint?.method || 'POST',
    pathPrefix: endpoint?.pathPrefix || '',
    authType: endpoint?.authType || 'none',
    authValue: '',
    pricePerCall: endpoint?.pricePerCall ? endpoint.pricePerCall / 100 : 1,
    rateLimit: endpoint?.rateLimit || 60,
    timeout: endpoint?.timeout || 30000,
    isActive: endpoint?.isActive ?? true
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.targetUrl.trim() || !form.pathPrefix.trim()) {
      setError('请填写必填项')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = { ...form, pricePerCall: Math.round(form.pricePerCall * 100) }
      
      if (endpoint) {
        await api.put(`/admin/endpoints/${endpoint.id}`, data)
      } else {
        await api.post('/admin/endpoints', data)
      }
      
      onSave()
    } catch (err) {
      setError(err.response?.data?.error || '保存失败')
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <Modal title={endpoint ? '编辑 API 端点' : '新增 API 端点'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert-error" style={{ marginBottom: '1rem' }}><AlertCircle size={16} /> {error}</div>}
        
        <FormField label="名称" required>
          <input type="text" className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="API 名称" />
        </FormField>
        
        <FormField label="描述">
          <textarea className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="API 功能描述" style={{ minHeight: '60px', resize: 'vertical' }} />
        </FormField>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="分类">
            <input type="text" className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="如：图像生成" />
          </FormField>
          <FormField label="HTTP 方法">
            <select className="input" value={form.method} onChange={e => setForm({...form, method: e.target.value})}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </FormField>
        </div>
        
        <FormField label="目标URL" required>
          <input type="text" className="input" value={form.targetUrl} onChange={e => setForm({...form, targetUrl: e.target.value})} placeholder="https://api.example.com/v1/..." style={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
        </FormField>
        
        <FormField label="路径前缀" required>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>/api/proxy/</span>
            <input type="text" className="input" value={form.pathPrefix} onChange={e => setForm({...form, pathPrefix: e.target.value.replace(/^\//, '')})} placeholder="v1/chat" style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.875rem' }} />
          </div>
        </FormField>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="认证类型">
            <select className="input" value={form.authType} onChange={e => setForm({...form, authType: e.target.value})}>
              <option value="none">无认证</option>
              <option value="bearer">Bearer Token</option>
              <option value="api_key">API Key</option>
              <option value="basic">Basic Auth</option>
            </select>
          </FormField>
          <FormField label="认证值">
            <input type="password" className="input" value={form.authValue} onChange={e => setForm({...form, authValue: e.target.value})} placeholder={endpoint ? '留空保持不变' : '输入认证值'} disabled={form.authType === 'none'} />
          </FormField>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <FormField label="单次价格(元)" required>
            <input type="number" step="0.01" min="0" className="input" value={form.pricePerCall} onChange={e => setForm({...form, pricePerCall: parseFloat(e.target.value) || 0})} />
          </FormField>
          <FormField label="限流(次/分钟)">
            <input type="number" min="1" className="input" value={form.rateLimit} onChange={e => setForm({...form, rateLimit: parseInt(e.target.value) || 60})} />
          </FormField>
          <FormField label="超时">
            <input type="number" min="1000" className="input" value={form.timeout} onChange={e => setForm({...form, timeout: parseInt(e.target.value) || 30000})} />
          </FormField>
        </div>
        
        <FormField label="状态">
          <select className="input" value={form.isActive ? 'true' : 'false'} onChange={e => setForm({...form, isActive: e.target.value === 'true'})}>
            <option value="true">启用</option>
            <option value="false">禁用</option>
          </select>
        </FormField>
        
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>取消</button>
          <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </Modal>
  )
}