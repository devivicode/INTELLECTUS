import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { subscribeToasts, type ToastEntry } from '../utils/toast'

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const STYLES = {
  success: { bg: '#F0FDF4', border: '#86EFAC', icon: '#16A34A', text: '#14532D' },
  error: { bg: '#FEF2F2', border: '#FCA5A5', icon: '#DC2626', text: '#7F1D1D' },
  info: { bg: '#EFF6FF', border: '#93C5FD', icon: '#2563EB', text: '#1E3A8A' },
  warning: { bg: '#FFFBEB', border: '#FCD34D', icon: '#D97706', text: '#78350F' },
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastEntry[]>([])

  useEffect(() => {
    return subscribeToasts(setToasts)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: "'Inter', sans-serif" }}>
      {toasts.map(t => {
        const Icon = ICONS[t.type]
        const s = STYLES[t.type]
        return (
          <div key={t.id}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 280, maxWidth: 400, animation: 'fadeIn 0.2s ease' }}>
            <Icon size={16} style={{ color: s.icon, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: s.text, flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
