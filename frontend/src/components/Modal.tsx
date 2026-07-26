import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: number
  darkMode?: boolean
}

export default function Modal({ open, onClose, title, children, width = 520, darkMode = false }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const c = (l: string, d: string) => darkMode ? d : l

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
      {/* Panel */}
      <div style={{ position: 'relative', width, maxWidth: '100%', background: c('#fff', '#1E293B'), borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: `1px solid ${c('#E2E8F0', '#334155')}`, animation: 'fadeIn 0.2s ease', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${c('#E2E8F0', '#334155')}`, flexShrink: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: c('#0F172A', '#F1F5F9'), margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ padding: 6, background: c('#F8FAFC', '#334155'), border: 'none', borderRadius: 8, cursor: 'pointer', color: '#64748B', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
