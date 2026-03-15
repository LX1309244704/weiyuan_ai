import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import api from '../utils/api'
import { ArrowLeft, Play, Copy, Check, XCircle, Clock, AlertCircle, Key, Send } from 'lucide-react'

const methodColors = {
  GET: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', label: 'GET' },
  POST: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', label: 'POST' },
  PUT: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', label: 'PUT' },
  DELETE: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', label: 'DELETE' },
  PATCH: { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', label: 'PATCH' }
}

export default function ApiDetail() {
  const { id } = useParams()
  const [endpoint, setEndpoint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [copiedLang, setCopiedLang] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [testBody, setTestBody] = useState('{\n  \n}')
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  const serverUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const apiPath = endpoint ? `/api/proxy/${endpoint.pathPrefix}` : ''

  const generatePythonCode = () => {
    const bodyStr = testBody.trim() || '{}'
    return `import requests

url = "${serverUrl}${apiPath}"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${apiKey || 'YOUR_API_KEY'}"
}
payload = ${bodyStr}

response = requests.post(url, json=payload, headers=headers)
print(response.status_code)
print(response.json())`
  }

  const generateJsCode = () => {
    const bodyStr = testBody.trim() || '{}'
    return `const response = await fetch("${serverUrl}${apiPath}", {
  method: "${endpoint?.method || 'POST'}",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${apiKey || 'YOUR_API_KEY'}"
  },
  body: JSON.stringify(${bodyStr})
});

const data = await response.json();
console.log(response.status);
console.log(data);`
  }

  const generateCurlCode = () => {
    const bodyStr = testBody.trim() ? `-d '${testBody.trim()}'` : ''
    return `curl -X ${endpoint?.method || 'POST'} "${serverUrl}${apiPath}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}" \\
  ${bodyStr}`
  }

  const handleCopyCode = async (lang) => {
    let code = ''
    if (lang === 'python') code = generatePythonCode()
    else if (lang === 'javascript') code = generateJsCode()
    else if (lang === 'curl') code = generateCurlCode()
    
    await navigator.clipboard.writeText(code)
    setCopiedLang(lang)
    setTimeout(() => setCopiedLang(''), 2000)
  }

  useEffect(() => {
    fetchEndpoint()
    loadApiKey()
  }, [id])

  const fetchEndpoint = async () => {
    try {
      const response = await api.get(`/proxy/endpoints/${id}`)
      const ep = response.data.endpoint
      setEndpoint(ep)
      if (ep.requestExample) {
        try {
          setTestBody(JSON.stringify(JSON.parse(ep.requestExample), null, 2))
        } catch {
          setTestBody(ep.requestExample)
        }
      } else {
        setTestBody('{\n  \n}')
      }
    } catch (error) {
      console.error('Failed to fetch endpoint:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadApiKey = async () => {
    try {
      const response = await api.get('/users/me')
      setApiKey(response.data.user?.apiKey || '')
    } catch (error) {
      setApiKey('')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTest = async () => {
    if (!apiKey) {
      alert('请先获取 API Key')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      let body = {}
      try {
        if (testBody.trim()) {
          body = JSON.parse(testBody)
        }
      } catch {
        alert('请输入有效的 JSON')
        setTesting(false)
        return
      }

      const startTime = Date.now()
      const response = await axios({
        method: endpoint.method,
        baseURL: '',
        url: endpoint.path,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: body
      })

      setTestResult({
        success: true,
        status: response.status,
        data: response.data,
        time: Date.now() - startTime
      })
    } catch (error) {
      setTestResult({
        success: false,
        status: error.response?.status || 0,
        data: error.response?.data,
        error: error.response?.data?.error || error.message,
        time: 0
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fadeIn" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ height: '200px', background: '#f1f5f9', borderRadius: '12px' }}></div>
      </div>
    )
  }

  if (!endpoint) {
    return (
      <div className="animate-fadeIn" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-icon"><XCircle size={40} /></div>
          <p className="text-secondary">API 端点不存在</p>
          <Link to="/api-market" className="btn-primary" style={{ marginTop: '1rem' }}>返回 API 市场</Link>
        </div>
      </div>
    )
  }

  const methodStyle = methodColors[endpoint.method] || methodColors.GET

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Link
        to="/api-market"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem', textDecoration: 'none' }}
      >
        <ArrowLeft size={16} />
        返回 API 市场
      </Link>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <span style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: methodStyle.bg,
            color: methodStyle.color
          }}>
            {methodStyle.label}
          </span>
          <code style={{ fontFamily: 'monospace', fontSize: '0.9375rem', color: '#0f172a', fontWeight: 500 }}>
            {endpoint.path}
          </code>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          {endpoint.name}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{endpoint.description}</p>
        
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>价格</span>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>¥{(endpoint.pricePerCall / 100).toFixed(2)}/次</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>限流</span>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{endpoint.rateLimit}次/分钟</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>分类</span>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{endpoint.category || '通用'}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} style={{ color: '#6366f1' }} />
            请求配置
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
              <Key size={14} />
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="输入您的 API Key"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            {!apiKey && (
              <Link to="/profile" style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.375rem', display: 'block' }}>
                请先在个人中心获取 API Key
              </Link>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
              请求体 (JSON)
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                background: '#1e293b',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                outline: 'none',
                resize: 'vertical',
                minHeight: '150px'
              }}
              value={testBody}
              onChange={e => setTestBody(e.target.value)}
              placeholder='{}'
            />
          </div>

          <button
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            {testing ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <span>发送中...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>发送测试请求</span>
              </>
            )}
          </button>

          {/* 代码复制按钮 */}
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>复制代码</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleCopyCode('python')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: '#1e293b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem'
                }}
              >
                {copiedLang === 'python' ? <Check size={14} /> : <Copy size={14} />}
                Python
              </button>
              <button
                onClick={() => handleCopyCode('javascript')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem'
                }}
              >
                {copiedLang === 'javascript' ? <Check size={14} /> : <Copy size={14} />}
                JavaScript
              </button>
              <button
                onClick={() => handleCopyCode('curl')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem'
                }}
              >
                {copiedLang === 'curl' ? <Check size={14} /> : <Copy size={14} />}
                cURL
              </button>
            </div>
            {copiedLang && (
              <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.375rem' }}>已复制到剪贴板</p>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: '#6366f1' }} />
              响应结果
            </h3>
            {testResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: testResult.success ? '#22c55e' : '#ef4444'
                }}>
                  {testResult.status} {testResult.success ? 'OK' : 'Error'}
                </span>
                {testResult.time > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{testResult.time}ms</span>
                )}
              </div>
            )}
          </div>

          {testResult ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => copyToClipboard(JSON.stringify(testResult.success ? testResult.data : testResult.data || { error: testResult.error }, null, 2))}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  padding: '0.375rem',
                  background: '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <pre style={{
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                background: '#1e293b',
                color: '#e2e8f0',
                padding: '1rem',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '280px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {JSON.stringify(testResult.success ? testResult.data : testResult.data || { error: testResult.error }, null, 2)}
              </pre>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <Play size={20} />
              </div>
              <p style={{ fontSize: '0.875rem' }}>点击发送按钮测试 API</p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>使用说明</h3>
        </div>
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '0.125rem' }} />
            <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
              <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>注意事项</p>
              <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.6 }}>
                <li>每次调用将扣除 <strong>¥{(endpoint.pricePerCall / 100).toFixed(2)}</strong></li>
                <li>请确保账户余额充足，余额不足返回 402 状态码</li>
                <li>API Key 在个人中心获取</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
