import { useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

const MAX_IMAGES = 10

export default function ReferenceUpload({ images = [], onChange }) {
  const [isDragOver, setIsDragOver] = useState(false)
  
  const handleFiles = useCallback((files) => {
    const newImages = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        file,
        url: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random()}`
      }))
    
    const allImages = [...images, ...newImages].slice(0, MAX_IMAGES)
    onChange?.(allImages)
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
  }, [handleFiles])
  
  const handleRemove = useCallback((id) => {
    const newImages = images.filter(img => img.id !== id)
    onChange?.(newImages)
  }, [images, onChange])
  
  return (
    <div>
      <div className="ai-section-title">
        <span>📤 参考生图 (可选)</span>
        <span className="ai-upload-count">{images.length}/{MAX_IMAGES}</span>
      </div>
      
      <div
        className={`ai-upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('reference-upload-input')?.click()}
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
              <div key={img.id} className="ai-upload-item">
                <img src={img.url} alt="reference" />
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
            {images.length < MAX_IMAGES && (
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
      />
    </div>
  )
}