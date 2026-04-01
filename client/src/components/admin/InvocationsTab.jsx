import { useState, useEffect } from 'react'
import api from '../../utils/api'
import dayjs from 'dayjs'
import { Search, X, Eye, Download, Play, CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react'

const statusConfig = {
  queued: { label: '队列中', color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.1)' },
  processing: { label: '进行中', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', icon: Play },
  completed: { label: '已完成', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle },
  failed: { label: '失败', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: XCircle },
  timeout: { label: '超时', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.1)', icon: AlertTriangle }
}

function LoadingSpinner() {
  return <div style={{ padding: '3rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
}

function EmptyState({ text }) {
  return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}><Package size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} /><p style={{ fontSize: '0.875rem' }}>{text}</p></div>
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
      <input
        type="text"
        className="input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: '2.5rem' }}
      />
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
            <tr><td colSpan={columns.length}><EmptyState text={emptyText || '暂无数据'} /></td></tr>
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

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  )
}

function TaskDetailModal({ task, onClose }) {
  if (!task) return null

  const status = statusConfig[task.status] || { label: task.status, color: '#6b7280', bgColor: '#f3f4f6' }

  return (
    <Modal title="任务详情" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>任务 ID</p>
          <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{task.taskId}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>状态</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500, background: status.bgColor, color: status.color }}>
            {status.icon && <status.icon size={12} />}
            {status.label}
          </span>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>用户</p>
          <p style={{ fontSize: '0.875rem' }}>{task.user?.email || '-'}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>模型</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{task.modelName || '-'}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>厂商</p>
          <p style={{ fontSize: '0.875rem' }}>{task.provider || '-'}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>进度</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#3b82f6' }}>{task.progress || 0}%</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>消耗积分</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6366f1' }}>{task.cost || 0}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>创建时间</p>
          <p style={{ fontSize: '0.875rem' }}>{dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
        </div>
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>提示词</p>
        <p style={{ fontSize: '0.875rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '4px' }}>{task.prompt || '-'}</p>
      </div>
      
      {task.imageUrls && task.imageUrls.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>参考图片</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {task.imageUrls.map((url, i) => (
              <img key={i} src={url} alt={`Reference ${i}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
            ))}
          </div>
        </div>
      )}
      
      {task.resultUrl && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>生成结果</p>
          <img src={task.resultUrl} alt="Result" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '0.5rem' }} />
          <a href={task.resultUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', color: '#6366f1', fontSize: '0.875rem' }}>
            <Download size={14} /> 下载结果
          </a>
        </div>
      )}
      
      {task.errorMessage && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>错误信息</p>
          <p style={{ fontSize: '0.875rem', color: '#ef4444', background: '#fef2f2', padding: '0.5rem', borderRadius: '4px' }}>{task.errorMessage}</p>
        </div>
      )}
    </Modal>
  )
}

export default function InvocationsTab() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  
  useEffect(() => {
    fetchTasks()
  }, [page, status])
  
  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('pageSize', '20')
      if (status) params.append('status', status)
      
      const response = await api.get(`/admin/ai-tasks?${params}`)
      setTasks(response.data.tasks || [])
      setTotalPages(response.data.pagination?.pages || 1)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const filteredTasks = tasks.filter(task => 
    task.taskId?.toLowerCase().includes(search.toLowerCase()) ||
    task.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    task.modelName?.toLowerCase().includes(search.toLowerCase()) ||
    task.prompt?.toLowerCase().includes(search.toLowerCase())
  )
  
  const handleStatusFilter = (value) => {
    setStatus(value)
    setPage(1)
  }
  
  const statusFilters = [
    { value: '', label: '全部' },
    { value: 'queued', label: '队列中' },
    { value: 'processing', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'failed', label: '失败' }
  ]
  
  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => handleStatusFilter(f.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: status === f.value ? '#6366f1' : '#e2e8f0',
                background: status === f.value ? '#6366f1' : 'white',
                color: status === f.value ? 'white' : '#64748b',
                transition: 'all 0.15s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="搜索任务 ID/用户/模型/提示词..." style={{ flex: 1, minWidth: '200px' }} />
      </div>
      
      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? <LoadingSpinner /> : (
          <Table
            columns={[
              { 
                key: 'taskId', 
                title: '任务 ID',
                render: r => <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{r.taskId?.slice(0, 12)}...</span>
              },
              { 
                key: 'user', 
                title: '用户',
                render: r => <span style={{ fontSize: '0.875rem' }}>{r.user?.email || '-'}</span>
              },
              { 
                key: 'model', 
                title: '模型',
                render: r => (
                  <div>
                    <p style={{ fontWeight: 500, color: '#0f172a' }}>{r.modelName || '-'}</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.provider || '-'}</p>
                  </div>
                )
              },
              { 
                key: 'prompt', 
                title: '提示词',
                render: r => <span style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.prompt || '-'}</span>
              },
              { 
                key: 'status', 
                title: '状态',
                render: r => {
                  const s = statusConfig[r.status] || { label: r.status, color: '#6b7280', bgColor: '#f3f4f6' }
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500, background: s.bgColor, color: s.color }}>
                      {s.icon && <s.icon size={12} />}
                      {s.label}
                    </span>
                  )
                }
              },
              { 
                key: 'progress', 
                title: '进度',
                align: 'right',
                render: r => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, maxWidth: '80px', height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                      <div style={{ width: `${r.progress || 0}%`, height: '100%', background: r.status === 'completed' ? '#22c55e' : r.status === 'failed' ? '#ef4444' : '#3b82f6', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.progress || 0}%</span>
                  </div>
                )
              },
              { 
                key: 'cost', 
                title: '积分',
                align: 'right',
                render: r => <span style={{ fontWeight: 500, color: '#6366f1' }}>{r.cost || 0}</span>
              },
              { 
                key: 'createdAt', 
                title: '时间',
                render: r => <span style={{ color: '#94a3b8' }}>{dayjs(r.createdAt).format('MM-DD HH:mm')}</span>
              },
              {
                key: 'actions',
                title: '',
                align: 'right',
                render: r => (
                  <button 
                    onClick={() => setSelectedTask(r)}
                    style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1' }}
                    title="查看详情"
                  >
                    <Eye size={16} />
                  </button>
                )
              }
            ]}
            data={filteredTasks}
            emptyText="暂无 AI 生成任务"
          />
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: page === 1 ? '#cbd5e1' : '#64748b',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1
            }}
          >
            上一页
          </button>
          <span style={{ fontSize: '0.875rem', color: '#64748b', padding: '0 0.5rem' }}>
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: page === totalPages ? '#cbd5e1' : '#64748b',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1
            }}
          >
            下一页
          </button>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
