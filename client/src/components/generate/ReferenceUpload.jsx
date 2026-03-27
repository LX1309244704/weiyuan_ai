import { useState, useCallback, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react'
import api from '../../utils/api'

const MAX_IMAGES = 10

// 上传图片到后端
const uploadImageToServer = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  
  return response.data.url
}

export default function ReferenceUpload({ images = [], onChange }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingIds, setUploadingIds] = useState(new Set())
  
  // 检查是否有图片正在上传
  const isUploading = uploadingIds.size > 0
  
  // 通知父组件上传状态变化
  useEffect(() => {
    if (onChange) {
      // 通过回调通知父组件
      onChange.isUploading = isUploading
    }
  }, [isUploading])
  
  const handleFiles = useCallback(async (files) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'))
    
    // 创建临时预览（标记为上传中）
    const tempImages = fileArray.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random()}`,
      uploading: true  // 标记正在上传
    }))
    
    const allImages = [...images, ...tempImages].slice(0, MAX_IMAGES)
    onChange?.(allImages)
    
    // 标记正在上传的图片
    setUploadingIds(prev => {
      const newSet = new Set(prev)
      tempImages.forEach(img => newSet.add(img.id))
      return newSet
    })
    
    // 后台上传每个图片
    for (const img of tempImages) {
      try {
        const uploadedUrl = await uploadImageToServer(img.file)
        
        // 释放临时 URL 并更新为真实 URL
        URL.revokeObjectURL(img.url)
        onChange?.(prev => prev.map(p => 
          p.id === img.id ? { ...p, url: uploadedUrl, file: null, uploading: false } : p
        ))
      } catch (err) {
        // 上传失败
        onChange?.(prev => prev.map(p => 
          p.id === img.id ? { ...p, file: null, uploading: false, uploadError: true } : p
        ))
      } finally {
        setUploadingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(img.id)
          return newSet
        })
      }
    }
  }, [images, onChange])
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])
  
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])
  
  const handleInputChange = useCallback((e) => {
    handleFiles(e.target.files)
    // 清空 input value，允许重复选择相同文件
    e.target.value = ''
  }, [handleFiles])
  
  const handleRemove = useCallback((id) => {
    const newImages = images.filter(img => img.id !== id)
    onChange?.(newImages)
    setUploadingIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [images, onChange])
  
  return (
    <div>
      <div className="ai-section-title">
        <span>📤 参考生图 (可选)</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isUploading && (
            <span style={{ color: '#f59e0b', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Loader2 size={12} className="animate-spin" />
              上传中...
            </span>
          )}
          <span className="ai-upload-count">{images.length}/{MAX_IMAGES}</span>
        </div>
      </div>
      
      <div
        className={`ai-upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && document.getElementById('reference-upload-input')?.click()}
        style={{ opacity: isUploading ? 0.7 : 1, cursor: isUploading ? 'wait' : 'pointer' }}
      >
        {images.length === 0 ? (
          <div className="ai-upload-placeholder">
            <div className="ai-upload-icon">
              <Upload size={20} />
            </div>
            <span style={{ fontSize: '0.75rem' }}>点击或拖拽上传图片</span>
            <span style={{ fontSize: '0.625rem', color: 'var(--ai-text-muted)' }}>
              支持 JPG、PNG 格式，单张不超过 10MB
            </span>
          </div>
        ) : (
          <div className="ai-upload-grid">
            {images.map((img) => (
              <div key={img.id} className="ai-upload-item" style={{ position: 'relative' }}>
                <img src={img.url} alt="reference" style={{ opacity: img.uploading ? 0.5 : 1 }} />
                
                {/* 上传状态覆盖层 */}
                {img.uploading && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px'
                  }}>
                    <Loader2 size={20} className="animate-spin" style={{ color: 'white' }} />
                  </div>
                )}
                
                {/* 上传成功标记 */}
                {!img.uploading && !img.uploadError && img.url?.startsWith('http') && (
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle size={12} style={{ color: 'white' }} />
                  </div>
                )}
                
                {/* 上传失败标记 */}
                {img.uploadError && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(239,68,68,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    fontSize: '0.6rem',
                    color: 'white'
                  }}>
                    上传失败
                  </div>
                )}
                
                <button
                  className="ai-upload-remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(img.id)
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && !isUploading && (
              <div
                className="ai-upload-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed var(--ai-border-color)',
                  background: 'transparent'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  document.getElementById('reference-upload-input')?.click()
                }}
              >
                <Upload size={20} style={{ color: 'var(--ai-text-muted)' }} />
              </div>
            )}
          </div>
        )}
      </div>
      
      <input
        id="reference-upload-input"
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />
    </div>
  )
}