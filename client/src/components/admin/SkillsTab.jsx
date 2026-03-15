import { useState, useEffect } from 'react'
import api from '../../utils/api'
import dayjs from 'dayjs'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, X, Package } from 'lucide-react'

function SkillModal({ skill, onClose, onSave }) {
  const [form, setForm] = useState({
    name: skill?.name || '',
    description: skill?.description || '',
    icon: skill?.icon || '',
    category: skill?.category || '',
    pricePerCall: skill?.pricePerCall ? skill.pricePerCall / 100 : 1,
    packageSizes: skill?.packageSizes || [
      { size: 100, price: 5000 },
      { size: 500, price: 20000 },
      { size: 1000, price: 35000 }
    ],
    isActive: skill?.isActive ?? true
  })
  const [saving, setSaving] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const data = {
        ...form,
        pricePerCall: Math.round(form.pricePerCall * 100)
      }
      
      if (skill) {
        await api.put(`/admin/skills/${skill.id}`, data)
      } else {
        await api.post('/admin/skills', data)
      }
      
      onSave()
    } catch (error) {
      alert('保存失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setSaving(false)
    }
  }
  
  const addPackage = () => {
    setForm({
      ...form,
      packageSizes: [...form.packageSizes, { size: 100, price: 5000 }]
    })
  }
  
  const updatePackage = (index, field, value) => {
    const packages = [...form.packageSizes]
    packages[index][field] = parseInt(value) || 0
    setForm({ ...form, packageSizes: packages })
  }
  
  const removePackage = (index) => {
    const packages = form.packageSizes.filter((_, i) => i !== index)
    setForm({ ...form, packageSizes: packages })
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{skill ? '编辑 Skill' : '新增 Skill'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">图标URL</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">单次价格(元) *</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.pricePerCall}
                onChange={e => setForm({ ...form, pricePerCall: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.isActive ? 'true' : 'false'}
                onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}
              >
                <option value="true">上架</option>
                <option value="false">下架</option>
              </select>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">次数包</label>
              <button 
                type="button" 
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                onClick={addPackage}
              >
                <Plus className="w-4 h-4" /> 添加套餐
              </button>
            </div>
            <div className="space-y-2">
              {form.packageSizes.map((pkg, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <input
                    type="number"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={pkg.size}
                    onChange={e => updatePackage(i, 'size', e.target.value)}
                    placeholder="次数"
                  />
                  <span className="text-gray-500">次 ¥</span>
                  <input
                    type="number"
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={pkg.price / 100}
                    onChange={e => updatePackage(i, 'price', e.target.value * 100)}
                    placeholder="金额"
                  />
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => removePackage(i)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              取消
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SkillsTab() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)
  const [search, setSearch] = useState('')
  
  useEffect(() => {
    fetchSkills()
  }, [])
  
  const fetchSkills = async () => {
    try {
      const response = await api.get('/admin/skills?limit=100')
      setSkills(response.data.skills || [])
    } catch (error) {
      console.error('Failed to fetch skills:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (skill) => {
    if (!confirm(`确定要删除 Skill "${skill.name}" 吗？`)) return
    
    try {
      await api.delete(`/admin/skills/${skill.id}`)
      fetchSkills()
    } catch (error) {
      alert('删除失败')
    }
  }
  
  const handleToggle = async (skill) => {
    try {
      await api.put(`/admin/skills/${skill.id}`, { isActive: !skill.isActive })
      fetchSkills()
    } catch (error) {
      alert('操作失败')
    }
  }
  
  const filteredSkills = skills.filter(skill => 
    skill.name?.toLowerCase().includes(search.toLowerCase()) ||
    skill.category?.toLowerCase().includes(search.toLowerCase())
  )
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索 Skill..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => { setEditingSkill(null); setShowModal(true); }}
        >
          <Plus className="w-5 h-5" />
          新增 Skill
        </button>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">名称</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">分类</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">价格</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSkills.map((skill) => (
                <tr key={skill.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {skill.icon ? (
                        <img src={skill.icon} alt={skill.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{skill.name}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{skill.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{skill.category || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">¥{skill.pricePerCall / 100}/次</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      skill.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {skill.isActive ? '上架' : '下架'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{dayjs(skill.createdAt).format('YYYY-MM-DD')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => { setEditingSkill(skill); setShowModal(true); }}
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className={`p-2 rounded-lg transition-colors ${
                          skill.isActive 
                            ? 'text-orange-600 hover:bg-orange-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        onClick={() => handleToggle(skill)}
                        title={skill.isActive ? '下架' : '上架'}
                      >
                        {skill.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleDelete(skill)}
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSkills.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无数据</p>
          </div>
        )}
      </div>
      
      {showModal && (
        <SkillModal
          skill={editingSkill}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchSkills(); }}
        />
      )}
    </div>
  )
}