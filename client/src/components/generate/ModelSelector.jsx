import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function ModelSelector({ models, selectedModel, onSelect }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSelect = (model) => {
    onSelect(model)
    setIsOpen(false)
  }
  
  return (
    <div className="ai-model-selector" ref={dropdownRef}>
      <button
        className={`ai-model-select-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="ai-model-text">{selectedModel?.name || '选择模型'}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            flexShrink: 0
          }} 
        />
      </button>
      
      {isOpen && (
        <div 
          className="ai-model-dropdown"
          role="listbox"
        >
          {models.map((model) => (
            <div
              key={model.id}
              className={`ai-model-option ${selectedModel?.id === model.id ? 'selected' : ''}`}
              onClick={() => handleSelect(model)}
              role="option"
            >
              <div className="ai-model-text-wrapper">
                <span className="ai-model-name">{model.name}</span>
                {model.description && (
                  <span className="ai-model-desc">{model.description}</span>
                )}
              </div>
              {selectedModel?.id === model.id && (
                <div className="ai-check-indicator">
                  <div className="ai-check-dot" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}