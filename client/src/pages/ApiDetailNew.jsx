import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import api from '../utils/api'
import { ArrowLeft, Play, Copy, Check, XCircle, Clock, AlertCircle, Key, Send } from 'lucide-react'
import TopNavigationBar from '../components/TopNavigationBar'
import '../styles/generate.css'

const methodColors = {
  GET: { bg: 'rgba(59, 130, 246, 0.2)', color: 'var(--ai-accent-blue)', label: 'GET' },
  POST: { bg: 'rgba(34, 197, 94, 0.2)', color: 'var(--ai-accent-green)', label: 'POST' },
  PUT: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'PUT' },
  DELETE: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', label: 'DELETE' },
  PATCH: { bg: 'rgba(168, 85, 247, 0.2)', color: 'var(--ai-accent-purple)', label: 'PATCH' }
}

export default function ApiDetailNew() {
  const { id } = useParams()
  const navigate = useNavigate()
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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        background: 'var(--ai-bg-primary)',
        color: 'var(--ai-text-primary)'
      }}>
        <TopNavigationBar title="Weiyuan AI" />
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div className="loading-spinner" style={{ borderTopColor: 'var(--ai-accent-green)' }}></div>
          <p style={{ marginLeft: '1rem', color: 'var(--ai-text-secondary)' }}>加载中...</p>
        </div>
      </div>
    )
  }

  if (!endpoint) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        background: 'var(--ai-bg-primary)',
        color: 'var(--ai-text-primary)'
      }}>
        <TopNavigationBar title="Weiyuan AI" />
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div style={{ textAlign: 'center', color: 'var(--ai-text-secondary)' }}>
            <XCircle size={40} style={{ marginBottom: '1rem', color: 'var(--ai-text-muted)' }} />
            <p>API 端点不存在</p>
            <Link 
              to="/api-market" 
              style={{ 
                marginTop: '1rem',
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: 'var(--ai-accent-green)',
                borderRadius: '6px',
                color: '#000',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              返回 API 市场
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const methodStyle = methodColors[endpoint.method] || methodColors.GET

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: 'var(--ai-bg-primary)',
      color: 'var(--ai-text-primary)',
      overflow: 'hidden'
    }}>
      <TopNavigationBar title="Weiyuan AI" />
      
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link
            to="/api-market"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: 'var(--ai-text-muted)', 
              fontSize: '0.875rem', 
              marginBottom: '1rem', 
              textDecoration: 'none' 
            }}
          >
            <ArrowLeft size={16} />
            返回 API 市场
          </Link>

          <div style={{ 
            background: 'var(--ai-bg-secondary)',
            border: '1px solid var(--ai-border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
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
              <code style={{ fontFamily: 'monospace', fontSize: '0.9375rem', color: 'var(--ai-text-primary)', fontWeight: 500 }}>
                {endpoint.path}
              </code>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ai-text-primary)', marginBottom: '0.5rem' }}>
              {endpoint.name}
            </h1>
            <p style={{ color: 'var(--ai-text-secondary)', fontSize: '0.875rem' }}>{endpoint.description}</p>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--ai-border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)' }}>价格</span>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ai-accent-green)' }}>¥{(endpoint.pricePerCall / 100).toFixed(2)}/次</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)' }}>限流</span>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ai-text-primary)' }}>{endpoint.rateLimit}次/分钟</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)' }}>分类</span>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ai-text-primary)' }}>{endpoint.category || '通用'}</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ 
              background: 'var(--ai-bg-secondary)',
              border: '1px solid var(--ai-border-color)',
              borderRadius: '12px',
              padding: '1.5rem' 
            }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: 600, 
                color: 'var(--ai-text-primary)', 
                marginBottom: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                <Send size={18} style={{ color: 'var(--ai-accent-green)' }} />
                请求配置
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: 'var(--ai-text-secondary)', 
                  marginBottom: '0.5rem' 
                }}>
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
                    background: 'var(--ai-bg-elevated)',
                    border: '1px solid var(--ai-border-color)',
                    borderRadius: '8px',
                    color: 'var(--ai-text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--ai-accent-green)'}
                  onBlur={e => e.target.style.borderColor = 'var(--ai-border-color)'}
                />
                {!apiKey && (
                  <Link to="/profile" style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.375rem', display: 'block' }}>
                    请先在个人中心获取 API Key
                  </Link>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: 'var(--ai-text-secondary)', 
                  marginBottom: '0.5rem', 
                  display: 'block' 
                }}>
                  请求体 (JSON)
                </label>
                <textarea
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.8125rem',
                    fontFamily: 'monospace',
                    background: 'var(--ai-bg-primary)',
                    color: 'var(--ai-text-primary)',
                    border: '1px solid var(--ai-border-color)',
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
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.75rem',
                  background: testing || !apiKey ? 'var(--ai-text-muted)' : 'var(--ai-accent-green)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 600,
                  cursor: testing || !apiKey ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {testing ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <span>发送中...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>发送测试请求</span>
                  </>
                )}
              </button>

              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ai-text-secondary)', marginBottom: '0.5rem' }}>复制代码</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleCopyCode('python')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'var(--ai-bg-elevated)',
                      color: 'var(--ai-text-primary)',
                      border: '1px solid var(--ai-border-color)',
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
                      background: 'var(--ai-accent-blue)',
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
                  <p style={{ fontSize: '0.75rem', color: 'var(--ai-accent-green)', marginTop: '0.375rem' }}>已复制到剪贴板</p>
                )}
              </div>
            </div>

            <div style={{ 
              background: 'var(--ai-bg-secondary)',
              border: '1px solid var(--ai-border-color)',
              borderRadius: '12px',
              padding: '1.5rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  fontWeight: 600, 
                  color: 'var(--ai-text-primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem' 
                }}>
                  <Clock size={18} style={{ color: 'var(--ai-accent-green)' }} />
                  响应结果
                </h3>
                {testResult && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: testResult.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: testResult.success ? 'var(--ai-accent-green)' : '#ef4444'
                    }}>
                      {testResult.status} {testResult.success ? 'OK' : 'Error'}
                    </span>
                    {testResult.time > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ai-text-muted)' }}>{testResult.time}ms</span>
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
                      background: 'var(--ai-bg-elevated)',
                      border: '1px solid var(--ai-border-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: 'var(--ai-text-muted)',
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
                    background: 'var(--ai-bg-primary)',
                    color: 'var(--ai-text-primary)',
                    padding: '1rem',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '280px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    border: '1px solid var(--ai-border-color)'
                  }}>
                    {JSON.stringify(testResult.success ? testResult.data : testResult.data || { error: testResult.error }, null, 2)}
                  </pre>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ai-text-muted)' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: 'var(--ai-bg-elevated)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 0.75rem' 
                  }}>
                    <Play size={20} />
                  </div>
                  <p style={{ fontSize: '0.875rem' }}>点击发送按钮测试 API</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ 
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginTop: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '0.125rem' }} />
              <div style={{ fontSize: '0.875rem', color: '#f59e0b' }}>
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
    </div>
  )
}