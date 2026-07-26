export type ToastType = 'success' | 'error' | 'info' | 'warning'
export interface ToastEntry { id: number; message: string; type: ToastType }

type Subscriber = (toasts: ToastEntry[]) => void

let _toasts: ToastEntry[] = []
let _nextId = 0
let _sub: Subscriber | null = null

export function subscribeToasts(fn: Subscriber) {
  _sub = fn
  return () => { _sub = null }
}

export function toast(message: string, type: ToastType = 'success', duration = 3500) {
  const id = ++_nextId
  _toasts = [..._toasts, { id, message, type }]
  _sub?.(_toasts)
  setTimeout(() => {
    _toasts = _toasts.filter(t => t.id !== id)
    _sub?.(_toasts)
  }, duration)
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
  toast(`${filename} downloaded`, 'success')
}

export function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
  toast(`${filename} downloaded`, 'success')
}

export function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
  toast(`${filename} downloaded`, 'success')
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast('Copied to clipboard', 'success')
  } catch {
    toast('Failed to copy', 'error')
  }
}
