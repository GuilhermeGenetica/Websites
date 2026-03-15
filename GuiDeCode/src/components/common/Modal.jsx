import React, { useEffect, useCallback } from 'react'

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${maxWidth} w-full bg-card border border-border rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="sticky top-0 flex items-center justify-between p-6 pb-4 border-b border-border bg-card rounded-t-xl">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal