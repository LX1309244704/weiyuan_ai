import { useState, useEffect, useCallback } from 'react'
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

const MODELS = [
  { 
    id: 'image-v3', 
    name: '图片 3.0', 
    description: '强化一致性，自由多参考图，全面效果升级',
    type: 'image',
    icon: '🖼️',
    defaultParams: {
      resolution: '2K',
      aspectRatio: '3:4',
      numImages: 2
    }
  },
  { 
    id: 'image-v2', 
    name: '图片 2.0', 
    description: '经典图片生成模型',
    type: 'image',
    icon: '🖼️',
    defaultParams: {
      resolution: '1080P',
      aspectRatio: '1:1',
      numImages: 4
    }
  },
  { 
    id: 'video-v1', 
    name: '视频 1.0', 
    description: '高质量视频生成',
    type: 'video',
    icon: '🎬',
    defaultParams: {
      resolution: '1080P',
      duration: 5,
      fps: 24
    }
  }
]

export default function GenerateNew() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  
  const [selectedModel, setSelectedModel] = useState(MODELS[0])
  const [prompt, setPrompt] = useState('')
  const [referenceImages, setReferenceImages] = useState([])
  const [params, setParams] = useState(MODELS[0].defaultParams)
  
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(null)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  
  const [tools, setTools] = useState([])
  const [selectedTool, setSelectedTool] = useState(null)
  
  useEffect(() => {
    fetchTools()
  }, [])
  
  useEffect(() => {
    if (selectedModel) {
      setParams(selectedModel.defaultParams || {})
    }
  }, [selectedModel])
  
  const fetchTools = async () => {
    try {
      const type = selectedModel?.type || 'image'
      const response = await api.get(`/generate/tools?type=${type}`)
      const toolsList = response.data.tools || []
      setTools(toolsList)
      
      if (toolsList.length > 0 && !selectedTool) {
        setSelectedTool(toolsList[0])
      }
    } catch (err) {
      console.error('Failed to fetch tools:', err)
    }
  }
  
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
    
    if (!selectedTool) {
      alert('请选择生成工具')
      return
    }
    
    setGenerating(true)
    setProgress(0)
    setResults([])
    setError(null)
    
    const startTime = Date.now()
    const estimatedTotal = selectedModel?.type === 'video' ? 60 : 30
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (estimatedTotal * 10))
        return Math.min(newProgress, 90)
      })
    }, 100)
    
    const timeInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const remaining = Math.max(0, estimatedTotal - elapsed)
      setEstimatedTime(Math.ceil(remaining))
    }, 500)
    
    try {
      const imageUrls = referenceImages.map(img => img.url)
      
      const response = await api.post('/generate/generate', {
        toolId: selectedTool.id,
        prompt: prompt.trim(),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        parameters: params
      })
      
      clearInterval(progressInterval)
      clearInterval(timeInterval)
      
      if (response.data.success) {
        setProgress(100)
        
        const resultUrls = []
        if (response.data.result?.result) {
          if (Array.isArray(response.data.result.result)) {
            resultUrls.push(...response.data.result.result.map(url => ({ url })))
          } else {
            resultUrls.push({ url: response.data.result.result })
          }
        }
        
        if (response.data.data?.images && Array.isArray(response.data.data.images)) {
          resultUrls.push(...response.data.data.images.map(url => ({ url })))
        }
        
        if (resultUrls.length === 0 && response.data.data?.url) {
          resultUrls.push({ url: response.data.data.url })
        }
        
        if (resultUrls.length > 0) {
          setResults(resultUrls)
        } else {
          setError('生成成功，但未返回结果')
        }
      } else {
        setError(response.data.error || '生成失败')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      clearInterval(progressInterval)
      clearInterval(timeInterval)
      setGenerating(false)
      setEstimatedTime(null)
    }
  }, [isAuthenticated, prompt, selectedTool, params, referenceImages, selectedModel])
  
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
      overflow: 'hidden'
    }}>
      {/* Top Navigation Bar */}
      <TopNavigationBar title="Weiyuan AI" />
      
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
            models={MODELS}
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
            results={results}
            modelType={modelType}
            onRegenerate={handleGenerate}
            onDownload={handleDownload}
            isLoggedIn={isAuthenticated}
            onLogin={handleLogin}
          />
        </div>
      </div>
    </div>
  )
}