import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/AuthContext'
import api from '../utils/api'
import TopNavigationBar from '../components/TopNavigationBar'
import ModelSelector from '../components/generate/ModelSelector'
import ReferenceUpload from '../components/generate/ReferenceUpload'
import PromptInput from '../components/generate/PromptInput'
import ParamPanel from '../components/generate/ParamPanel'
import PreviewArea from '../components/generate/PreviewArea'
import { Zap, Loader2, Sparkles } from 'lucide-react'
import '../styles/generate.css'

const DEFAULT_MODELS = []

export default function GenerateNew() {
  const navigate = useNavigate()
  const { user, isAuthenticated, token } = useAuthStore()
  
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [referenceImages, setReferenceImages] = useState([])
  const [params, setParams] = useState({})
  
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(null)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [tasks, setTasks] = useState([])
  
  const [userApiKey, setUserApiKey] = useState('')
  const [balance, setBalance] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
    
  useEffect(() => {
    fetchApiEndpoints()
    if (isAuthenticated) {
      fetchUserApiKey()
    }
  }, [])
  
  useEffect(() => {
    if (user?.balance !== undefined) {
      setBalance(user.balance)
    }
  }, [user])
  
  const fetchUserApiKey = async () => {
    try {
      const res = await api.get('/users/me')
      if (res.data.user?.apiKey) {
        setUserApiKey(res.data.user.apiKey)
      }
      if (res.data.user?.balance !== undefined) {
        setBalance(res.data.user.balance)
      }
    } catch (err) {
        console.error('Failed to fetch user API key:', err)
      }
    }
    
    const fetchApiEndpoints = async () => {
    try {
      const response = await api.get('/ai-generate/models')
      console.log('AI Generate models:', response.data)
      const modelsList = response.data.models || []
      
      if (modelsList.length > 0) {
        const formattedModels = modelsList.map(m => ({
          id: m.id,
          name: m.name,
          description: m.description || `${m.type} 类型模型`,
          type: m.type,
          icon: m.icon || '🖼️',
          isBuiltIn: false,
          pathPrefix: m.pathPrefix,
          defaultParams: m.defaultParams || {},
          paramConfig: m.paramConfig || [],  // 参数配置
          pricePerCall: m.pricePerCall
        }))
        setModels(formattedModels)
        setSelectedModel(formattedModels[0])
        setParams(formattedModels[0].defaultParams || {})
      }
    } catch (err) {
      console.error('Failed to fetch AI Generate models:', err)
      setModels([])
    }
  }
  
  useEffect(() => {
    if (selectedModel && selectedModel.defaultParams) {
      const defaultParams = selectedModel.defaultParams || {}
      
      const hasStructuredParams = Object.values(defaultParams).some(
        val => val && typeof val === 'object' && val.options
      )
      
      if (hasStructuredParams) {
        const customParams = defaultParams
        const initialParams = {}
        Object.entries(customParams).forEach(([key, config]) => {
          initialParams[key] = config.value || config.default || config.options?.[0]?.value
        })
        setParams(initialParams)
      } else {
        const simpleParams = {}
        Object.entries(defaultParams).forEach(([key, val]) => {
          if (typeof val !== 'object') {
            simpleParams[key] = val
          }
        })
        setParams(simpleParams)
      }
    }
  }, [selectedModel])
  
  // 处理从预览区拖拽添加参考图
  const handleAddReference = useCallback((items) => {
    const newImages = items.map(item => {
      if (item.url && !item.file) {
        // URL 对象（从外部拖入的图片链接）
        return {
          id: `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: item.url,
          name: item.name,
          type: item.type
        }
      }
      // File 对象（本地文件）
      return {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file: item,
        url: URL.createObjectURL(item),
        name: item.name,
        type: item.type
      }
    })
    setReferenceImages(prev => [...prev, ...newImages])
  }, [])
  
  // 处理从历史图片添加 URL 参考图
  const handleAddReferenceUrl = useCallback((url) => {
    const newImage = {
      id: `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: url,
      name: url.split('/').pop() || 'image',
      type: 'image/*'
    }
    setReferenceImages(prev => [...prev, newImage])
  }, [])
  
  // 处理使用历史提示词
  const handleUsePrompt = useCallback((prompt) => {
    setPrompt(prompt)
  }, [])
  
  const handleGenerate = useCallback(async () => {
    if (!isAuthenticated) {
      alert('请先登录')
      navigate('/login')
      return
    }
    
    if (!prompt.trim()) {
      alert('请输入提示词')
      return
    }
    
    if (!selectedModel?.pathPrefix) {
      alert('请选择模型')
      return
    }
    
    const currentPrompt = prompt.trim()
    const currentImages = [...referenceImages]
    const currentParams = { ...params }
    
    // 防重复点击
    if (isSubmitting) return
    setIsSubmitting(true)
    
    // 立即重置表单，用户可以继续输入
    setPrompt('')
    setReferenceImages([])
    setError(null)
    
    // 添加新任务到列表（只在 GenerateNew 本地显示）
    const newTask = {
      taskId: `pending_${Date.now()}`,
      prompt: currentPrompt,
      modelName: selectedModel.name,
      status: 'queued',
      progress: 0,
      createdAt: new Date()
    }
    setTasks(prev => [newTask, ...prev])
    
    try {
      const requestBody = {
        prompt: currentPrompt,
        ...currentParams
      }
      
      if (currentImages.length > 0) {
        requestBody.imageUrls = currentImages.map(img => img.url)
      }
      
      const response = await api.post(`/ai-generate/${selectedModel.pathPrefix}`, requestBody, {
        headers: userApiKey ? { 'X-API-Key': userApiKey } : {}
      })
      
      const data = response.data
      
      if (data.success || response.status === 200) {
        if (data.taskId) {
          const taskStatus = data.status || 'queued'
          const resultUrl = data.resultUrl || data.result?.[0] || null
          // 更新本地任务
          setTasks(prev => prev.map(t => 
            t.taskId === newTask.taskId 
              ? { ...t, taskId: data.taskId, realTaskId: data.taskId, status: resultUrl ? 'completed' : taskStatus, progress: resultUrl ? 100 : 0, resultUrl }
              : t
          ))
          if (data.balance !== undefined) {
            setBalance(data.balance)
          }
        } else if (data.data) {
          setTasks(prev => prev.map(t => 
            t.taskId === newTask.taskId 
              ? { ...t, status: 'completed', progress: 100, resultUrl: data.data }
              : t
          ))
        } else {
          setTasks(prev => prev.map(t => 
            t.taskId === newTask.taskId 
              ? { ...t, status: 'failed', errorMessage: data.error || '生成失败' }
              : t
          ))
        }
      } else {
        setTasks(prev => prev.map(t => 
          t.taskId === newTask.taskId 
            ? { ...t, status: 'failed', errorMessage: data.error || '提交失败' }
            : t
        ))
      }
    } catch (err) {
      setTasks(prev => prev.map(t => 
        t.taskId === newTask.taskId 
          ? { ...t, status: 'failed', errorMessage: err.response?.data?.error || err.message }
          : t
      ))
    } finally {
      setIsSubmitting(false)
    }
  }, [isAuthenticated, selectedModel, params, userApiKey, prompt, referenceImages, isSubmitting])
  
  const handleDownload = async (url) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `weiyuan-${Date.now()}.${url.includes('.mp4') ? 'mp4' : 'png'}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  const handleLogin = () => {
    navigate('/login')
  }
  
  const modelType = selectedModel?.type || 'image'
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: 'var(--ai-bg-primary)',
      color: 'var(--ai-text-primary)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Top Navigation Bar */}
      <TopNavigationBar title="Weiyuan AI" balance={balance} />
      
      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          padding: '2rem',
          gap: '1.5rem',
          overflowY: 'auto',
          maxWidth: '600px',
          margin: '0 auto 0 2rem'
        }}>
          <ModelSelector
            models={models}
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
          />
          
          <ReferenceUpload
            images={referenceImages}
            onChange={setReferenceImages}
          />
          
          <PromptInput
            value={prompt}
            onChange={setPrompt}
          />
          
          <ParamPanel
            modelType={modelType}
            params={params}
            onChange={setParams}
            paramConfig={selectedModel?.paramConfig || []}
          />
          
          <div style={{ marginTop: '1rem' }}>
            <button
              className={`ai-generate-btn ${generating ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              style={{
                padding: '1rem 2rem',
                background: generating || !prompt.trim() 
                  ? 'var(--ai-text-muted)' 
                  : 'linear-gradient(135deg, var(--ai-accent-green), var(--ai-accent-green-hover))',
                border: 'none',
                borderRadius: '12px',
                color: '#000',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: generating || !prompt.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: generating || !prompt.trim() 
                  ? 'none' 
                  : '0 4px 12px rgba(74, 222, 128, 0.3)',
                width: '100%',
                maxWidth: '300px',
                margin: '0 auto'
              }}
            >
              {generating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles size={20} fill="currentColor" />
                  开始生成
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginTop: '1rem'
            }}>
              {error}
            </div>
          )}
          
          <div style={{
            marginTop: 'auto',
            padding: '1rem',
            background: 'var(--ai-bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--ai-border-color)'
          }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--ai-text-secondary)' }}>
              💡 创作提示
            </h3>
            <ul style={{ fontSize: '0.75rem', color: 'var(--ai-text-secondary)', margin: 0, padding: '0 0 0 1rem' }}>
              <li>尽可能详细地描述您想要的内容</li>
              <li>使用具体的视觉元素词汇如颜色、风格、构图</li>
              <li>参考图可以提升生成的一致性</li>
            </ul>
          </div>
        </div>
        
        <div style={{ 
          flex: 1, 
          borderLeft: '1px solid var(--ai-border-color)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0
        }}>
          <PreviewArea
            generating={generating}
            progress={progress}
            estimatedTime={estimatedTime}
            modelType={modelType}
            onRegenerate={handleGenerate}
            isLoggedIn={isAuthenticated}
            onLogin={handleLogin}
            userApiKey={userApiKey}
            token={token}
            externalTasks={tasks}
            onAddReference={handleAddReference}
            onAddReferenceUrl={handleAddReferenceUrl}
            onUsePrompt={handleUsePrompt}
          />
        </div>
      </div>
    </div>
  )
}