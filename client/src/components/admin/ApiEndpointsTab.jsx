import { useState, useEffect } from 'react'
import api from '../../utils/api'
import dayjs from 'dayjs'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, X, Play, Eye, Code, Copy, Check } from 'lucide-react'

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
    headersMapping: endpoint?.headersMapping || {},
    requestExample: endpoint?.requestExample || '',
    responseExample: endpoint?.responseExample || '',
    pricePerCall: endpoint?.pricePerCall ? endpoint.pricePerCall / 100 : 1,
    rateLimit: endpoint?.rateLimit || 60,
    timeout: endpoint?.timeout || 30000,
    isActive: endpoint?.isActive ?? true,
    type: endpoint?.type || 'api',
    icon: endpoint?.icon || '',
    defaultParams: endpoint?.defaultParams ? JSON.stringify(endpoint.defaultParams, null, 2) : '{\n  \n}',
    outputFields: endpoint?.outputFields ? JSON.stringify(endpoint.outputFields, null, 2) : '{\n  \n}',
    isGenerateTool: endpoint?.isGenerateTool ?? false,
    showInGenerate: endpoint?.showInGenerate ?? false,
    requestType: endpoint?.requestType || 'runninghub'
  })
  const [saving, setSaving] = useState(false)
  const [showAuthValue, setShowAuthValue] = useState(false)
  const [headerKey, setHeaderKey] = useState('')
  const [headerValue, setHeaderValue] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      let parsedDefaultParams = {}
      let parsedOutputFields = {}
      
      try {
        parsedDefaultParams = form.defaultParams ? JSON.parse(form.defaultParams) : {}
      } catch {
        alert('默认参数必须是有效的 JSON')
        setSaving(false)
        return
      }
      
      try {
        parsedOutputFields = form.outputFields ? JSON.parse(form.outputFields) : {}
      } catch {
        alert('输出字段映射必须是有效的 JSON')
        setSaving(false)
        return
      }

      const data = {
        ...form,
        pricePerCall: Math.round(form.pricePerCall * 100),
        authValue: form.authValue || undefined,
        defaultParams: parsedDefaultParams,
        outputFields: parsedOutputFields
      }

      if (endpoint) {
        await api.put(`/admin/endpoints/${endpoint.id}`, data)
      } else {
        await api.post('/admin/endpoints', data)
      }

      onSave()
    } catch (error) {
      alert('保存失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setSaving(false)
    }
  }

  const addHeader = () => {
    if (headerKey && headerValue) {
      setForm({
        ...form,
        headersMapping: {
          ...form.headersMapping,
          [headerKey]: headerValue
        }
      })
      setHeaderKey('')
      setHeaderValue('')
    }
  }

  const removeHeader = (key) => {
    const newHeaders = { ...form.headersMapping }
    delete newHeaders[key]
    setForm({ ...form, headersMapping: newHeaders })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{endpoint ? '编辑 API 端点' : '新增 API 端点'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                placeholder="如: RunningHub AI生成"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                rows={2}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="API功能描述"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="如: 图像生成"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HTTP方法</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.method}
                onChange={e => setForm({ ...form, method: e.target.value })}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">目标URL *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                value={form.targetUrl}
                onChange={e => setForm({ ...form, targetUrl: e.target.value })}
                required
                placeholder="https://api.example.com/v1/chat/completions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">路径前缀 *</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">/api/proxy/</span>
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                  value={form.pathPrefix}
                  onChange={e => setForm({ ...form, pathPrefix: e.target.value.replace(/^\//, '') })}
                  required
                  placeholder="v1/chat"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">认证类型</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.authType}
                onChange={e => setForm({ ...form, authType: e.target.value })}
              >
                <option value="none">无认证</option>
                <option value="bearer">Bearer Token</option>
                <option value="api_key">API Key</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            {form.authType !== 'none' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.authType === 'bearer' ? 'Bearer Token' : 
                   form.authType === 'api_key' ? 'API Key' : 
                   'Basic Auth (username:password)'}
                </label>
                <div className="relative">
                  <input
                    type={showAuthValue ? 'text' : 'password'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                    value={form.authValue}
                    onChange={e => setForm({ ...form, authValue: e.target.value })}
                    placeholder={endpoint ? '留空保持不变' : '输入认证值'}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowAuthValue(!showAuthValue)}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

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
              <label className="block text-sm font-medium text-gray-700 mb-1">限流(次/分钟)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.rateLimit}
                onChange={e => setForm({ ...form, rateLimit: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">超时时间</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.timeout}
                onChange={e => setForm({ ...form, timeout: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.isActive ? 'true' : 'false'}
                onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}
              >
                <option value="true">启用</option>
                <option value="false">禁用</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">端点类型</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="api">普通API</option>
                <option value="image">图片生成</option>
                <option value="video">视频生成</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">图标</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                placeholder="如: 🖼️ 或 🎬"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isGenerateTool}
                  onChange={e => setForm({ ...form, isGenerateTool: e.target.checked })}
                  className="rounded border-gray-300"
                />
                是否为AI生成工具
              </label>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">请求类型</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={form.requestType}
                onChange={e => setForm({ ...form, requestType: e.target.value })}
              >
                <option value="runninghub">RunningHub 格式 (使用 requestExample 转换请求)</option>
                <option value="huoshan">火山引擎格式 (Google Gemini 兼容)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">请求示例</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                rows={6}
                value={form.requestExample}
                onChange={e => setForm({ ...form, requestExample: e.target.value })}
                placeholder='{"key": "value"} - 请求参数的示例'
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">响应示例</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                rows={6}
                value={form.responseExample}
                onChange={e => setForm({ ...form, responseExample: e.target.value })}
                placeholder='{"taskId": "xxx", "status": "SUCCESS"} - 响应格式的示例'
              />
            </div>

            {form.isGenerateTool && (
              <>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">默认参数 (JSON)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                    rows={4}
                    value={form.defaultParams}
                    onChange={e => setForm({ ...form, defaultParams: e.target.value })}
                    placeholder='{"aspectRatio": "1:1", "numImages": 4}'
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">输出字段映射 (JSON)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                    rows={4}
                    value={form.outputFields}
                    onChange={e => setForm({ ...form, outputFields: e.target.value })}
                    placeholder='{"result": "data[0].url"}'
                  />
                </div>
              </>
            )}

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">自定义请求头</label>
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={headerKey}
                  onChange={e => setHeaderKey(e.target.value)}
                  placeholder="Header名称"
                />
                <input
                  type="text"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  value={headerValue}
                  onChange={e => setHeaderValue(e.target.value)}
                  placeholder="Header值"
                />
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  onClick={addHeader}
                >
                  添加
                </button>
              </div>
              {Object.keys(form.headersMapping).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(form.headersMapping).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      <span className="font-mono text-gray-700">{key}:</span>
                      <span className="font-mono text-gray-500">{value}</span>
                      <button
                        type="button"
                        className="ml-auto text-gray-400 hover:text-red-500"
                        onClick={() => removeHeader(key)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

function TestModal({ endpoint, onClose }) {
  const [testBody, setTestBody] = useState('{\n  \n}')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copiedLang, setCopiedLang] = useState('')

  const serverUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const apiPath = `/api/proxy/${endpoint?.pathPrefix}`
  
  const generatePythonCode = () => {
    const bodyStr = testBody.trim() || '{}'
    return `\`\`\`python
import requests

url = "${serverUrl}${apiPath}"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY"
}
payload = ${bodyStr}

response = requests.post(url, json=payload, headers=headers)
print(response.status_code)
print(response.json())
\`\`\``
  }

  const generateJsCode = () => {
    const bodyStr = testBody.trim() || '{}'
    return `\`\`\`javascript
const response = await fetch("${serverUrl}${apiPath}", {
  method: "${endpoint?.method || 'POST'}",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY"
  },
  body: JSON.stringify(${bodyStr})
});

const data = await response.json();
console.log(response.status);
console.log(data);
\`\`\``
  }

  const generateCurlCode = () => {
    const bodyStr = testBody.trim() ? `-d '${testBody.trim()}'` : ''
    return `\`\`\`bash
curl -X ${endpoint?.method || 'POST'} "${serverUrl}${apiPath}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  ${bodyStr}
\`\`\``
  }

  const handleCopy = async (lang) => {
    let code = ''
    if (lang === 'python') code = generatePythonCode()
    else if (lang === 'javascript') code = generateJsCode()
    else if (lang === 'curl') code = generateCurlCode()
    
    const textOnly = code.replace(/```\w+\n?/g, '').trim()
    await navigator.clipboard.writeText(textOnly)
    setCopiedLang(lang)
    setTimeout(() => setCopiedLang(''), 2000)
  }

  const handleTest = async () => {
    setLoading(true)
    setResult(null)
    try {
      let body = {}
      try {
        body = JSON.parse(testBody)
      } catch {
        alert('请输入有效的JSON')
        setLoading(false)
        return
      }

      const response = await api.post(`/admin/endpoints/${endpoint.id}/test`, { testBody: body })
      setResult(response.data)
    } catch (error) {
      setResult({
        success: false,
        error: error.response?.data?.error || error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">测试 API 端点: {endpoint?.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 代码复制区域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">复制代码</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleCopy('python')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
              >
                {copiedLang === 'python' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Python
              </button>
              <button
                onClick={() => handleCopy('javascript')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
              >
                {copiedLang === 'javascript' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                JavaScript
              </button>
              <button
                onClick={() => handleCopy('curl')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {copiedLang === 'curl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                cURL
              </button>
            </div>
            {copiedLang && (
              <p className="text-xs text-green-600 mt-2">已复制到剪贴板</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">请求Body (JSON)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
              rows={10}
              value={testBody}
              onChange={e => setTestBody(e.target.value)}
            />
          </div>

          <button
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            onClick={handleTest}
            disabled={loading}
          >
            <Play className="w-4 h-4" />
            {loading ? '测试中...' : '发送测试请求'}
          </button>

          {result && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                响应结果
                {result.latency && <span className="text-gray-400 ml-2">({result.latency}ms)</span>}
              </label>
              <div className={`p-4 rounded-lg text-sm font-mono overflow-auto max-h-64 ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LogsModal({ endpoint, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [expandedLog, setExpandedLog] = useState(null)

  useEffect(() => {
    fetchLogs()
  }, [endpoint.id, page])

  const fetchLogs = async () => {
    try {
      const response = await api.get(`/admin/endpoints/${endpoint.id}/logs?page=${page}&limit=20`)
      setLogs(response.data.logs || [])
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (logId) => {
    setExpandedLog(expandedLog === logId ? null : logId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">调用日志: {endpoint?.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无调用记录</div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-gray-600 text-xs">{log.invocationId?.slice(0, 8)}...</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        log.status === 'success' ? 'bg-green-100 text-green-700' : 
                        log.status === 'timeout' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status === 'success' ? '成功' : log.status === 'timeout' ? '超时' : '失败'}
                      </span>
                      <span className="text-gray-500 text-xs">用户: {log.user?.email || log.userId?.slice(0, 8)}...</span>
                      <span className="text-gray-500 text-xs">耗时: {log.latency}ms</span>
                      <span className="text-gray-500 text-xs">费用: ¥{(log.cost / 100).toFixed(2)}</span>
                      {log.responseCode && (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          log.responseCode < 400 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.responseCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">{dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                      <X className={`w-4 h-4 text-gray-400 transition-transform ${expandedLog === log.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {expandedLog === log.id && (
                    <div className="p-4 bg-white space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">请求信息</span>
                          <span className="text-xs text-gray-400">{log.request_path}</span>
                        </div>
                        <div className="p-3 bg-gray-900 rounded-lg overflow-auto max-h-48">
                          <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                            {log.request_body || '无'}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">响应信息</span>
                          {log.error_message && (
                            <span className="text-xs text-red-500">{log.error_message}</span>
                          )}
                        </div>
                        <div className="p-3 bg-gray-900 rounded-lg overflow-auto max-h-48">
                          <pre className="text-xs font-mono text-blue-400 whitespace-pre-wrap">
                            {log.response_body || '无'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {logs.length > 0 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-500">第 {page} 页</span>
              <button
                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => setPage(p => p + 1)}
                disabled={logs.length < 20}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ApiEndpointsTab() {
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState(null)
  const [testingEndpoint, setTestingEndpoint] = useState(null)
  const [logsEndpoint, setLogsEndpoint] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchEndpoints()
  }, [])

  const fetchEndpoints = async () => {
    try {
      const response = await api.get('/admin/endpoints?limit=100')
      setEndpoints(response.data.endpoints || [])
    } catch (error) {
      console.error('Failed to fetch endpoints:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (endpoint) => {
    if (!confirm(`确定要删除端点 "${endpoint.name}" 吗？`)) return

    try {
      await api.delete(`/admin/endpoints/${endpoint.id}`)
      fetchEndpoints()
    } catch (error) {
      alert('删除失败')
    }
  }

  const handleToggle = async (endpoint) => {
    try {
      await api.put(`/admin/endpoints/${endpoint.id}`, { isActive: !endpoint.isActive })
      fetchEndpoints()
    } catch (error) {
      alert('操作失败')
    }
  }

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.name?.toLowerCase().includes(search.toLowerCase()) ||
    endpoint.category?.toLowerCase().includes(search.toLowerCase()) ||
    endpoint.pathPrefix?.toLowerCase().includes(search.toLowerCase())
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索 API 端点..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => { setEditingEndpoint(null); setShowModal(true); }}
        >
          <Plus className="w-5 h-5" />
          新增 API 端点
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">名称</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">路径</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">目标URL</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">价格</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">调用次数</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEndpoints.map((endpoint) => (
                <tr key={endpoint.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{endpoint.name}</p>
                      <p className="text-sm text-gray-500">{endpoint.category || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {endpoint.method} /api/proxy/{endpoint.pathPrefix}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 font-mono truncate max-w-xs" title={endpoint.targetUrl}>
                      {endpoint.targetUrl}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">¥{endpoint.pricePerCall / 100}/次</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      endpoint.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {endpoint.isActive ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{endpoint.usageCount || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        onClick={() => { setTestingEndpoint(endpoint); setShowTestModal(true); }}
                        title="测试"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        onClick={() => { setLogsEndpoint(endpoint); setShowLogsModal(true); }}
                        title="日志"
                      >
                        <Code className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => { setEditingEndpoint(endpoint); setShowModal(true); }}
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className={`p-2 rounded-lg transition-colors ${
                          endpoint.isActive
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        onClick={() => handleToggle(endpoint)}
                        title={endpoint.isActive ? '禁用' : '启用'}
                      >
                        {endpoint.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleDelete(endpoint)}
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

        {filteredEndpoints.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Code className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无 API 端点</p>
          </div>
        )}
      </div>

      {showModal && (
        <EndpointModal
          endpoint={editingEndpoint}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchEndpoints(); }}
        />
      )}

      {showTestModal && testingEndpoint && (
        <TestModal
          endpoint={testingEndpoint}
          onClose={() => { setShowTestModal(false); setTestingEndpoint(null); }}
        />
      )}

      {showLogsModal && logsEndpoint && (
        <LogsModal
          endpoint={logsEndpoint}
          onClose={() => { setShowLogsModal(false); setLogsEndpoint(null); }}
        />
      )}
    </div>
  )
}