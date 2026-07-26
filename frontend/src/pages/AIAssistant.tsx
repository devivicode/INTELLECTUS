import { useState, useRef, useEffect } from 'react'
import { Send, Brain, Loader, Copy, ThumbsUp, ThumbsDown, FileText, Search, RotateCcw, Sparkles, ChevronRight, Download, AlertCircle } from 'lucide-react'
import { copyToClipboard, toast } from '../utils/toast'
import { sendChatMessage, clearConversation, getFIR, getCriminal, getOverview } from '../utils/api'
import type { Citation } from '../utils/api'
import { adaptBackendFIR } from '../utils/adapters'
import Modal from '../components/Modal'
import type { Page } from '../components/Layout'
import type { Lang } from '../utils/translations'

interface Message {
  role: 'user' | 'ai'
  content: string
  time: string
  citations?: Citation[]
  route?: string
  intentSource?: string
  feedback?: 'up' | 'down' | null
}

const SUGGESTIONS = [
  'Summarize a recent murder case in Bengaluru Urban',
  'What sections apply to robbery with a deadly weapon?',
  'Show similar cyber fraud cases',
  'How many cases are under investigation in Mysuru district?',
  'Find repeat offenders across multiple cases',
  'Show the district-wise breakdown of theft cases',
]

const WELCOME = `Based on the Karnataka Police FIR database, I can help you with:

**1. Case Summarization**
Comprehensive summaries of FIR cases, including complainant details, victim information, accused status, and investigation progress.

**2. Similar Case Detection**
Pattern matching across the FIR database to identify similar crimes, suspects with prior records, and modus operandi patterns.

**3. Repeat-Offender Networks**
Name-matched case histories showing everyone linked to more than one FIR.

**4. District & Category Analytics**
Verified counts and breakdowns by district, police station, crime category, or case status.

Ask a question below, or tap one of the suggestions to get started. Every answer is grounded in the source case database — the citations under each response link straight to the verified record.`

function formatTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function parseMarkdown(text: string) {
  // Minimal renderer matching the backend's markdown conventions (##, ###, **bold**, "- " lists).
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  const blocks = withBold.split(/\n\n+/).map(block => {
    if (block.startsWith('### ')) return `<h4 style="margin:10px 0 6px;font-size:13px;font-weight:700">${block.slice(4)}</h4>`
    if (block.startsWith('## ')) return `<h3 style="margin:10px 0 6px;font-size:14px;font-weight:700">${block.slice(3)}</h3>`
    const lines = block.split('\n')
    if (lines.length > 0 && lines.every(line => line.startsWith('- ') || line.trim() === '')) {
      return `<ul style="margin:0 0 10px;padding-left:18px">${lines.filter(Boolean).map(line => `<li>${line.slice(2)}</li>`).join('')}</ul>`
    }
    return `<p style="margin:0 0 10px">${block.replace(/\n/g, '<br/>')}</p>`
  })
  return blocks.join('')
}

interface AIAssistantProps { darkMode: boolean; onNavigate?: (page: Page, data?: unknown) => void; lang?: Lang }

function newSessionId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function AIAssistant({ darkMode, onNavigate, lang = 'en' }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([{ role: 'ai', content: WELCOME, time: formatTime() }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [citationLoading, setCitationLoading] = useState<string | null>(null)
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getCriminal>> | null>(null)
  const [recentCases, setRecentCases] = useState<{ fir_id: string; crime_code: string; district: string }[]>([])
  const sessionRef = useRef<string>(sessionStorage.getItem('intellectus_session') || newSessionId())
  const endRef = useRef<HTMLDivElement>(null)
  const c = (l: string, d: string) => darkMode ? d : l

  useEffect(() => { sessionStorage.setItem('intellectus_session', sessionRef.current) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { getOverview().then(data => setRecentCases(data.recent)).catch(() => {}) }, [])

  async function sendMessage(text?: string) {
    const msg = text ?? input
    if (!msg.trim() || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg, time: formatTime() }])
    setLoading(true)
    try {
      const data = await sendChatMessage(msg, sessionRef.current)
      sessionRef.current = data.session_id
      sessionStorage.setItem('intellectus_session', data.session_id)
      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.answer,
        time: formatTime(),
        citations: data.citations,
        route: data.route,
        intentSource: data.intent_source,
        feedback: null,
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Unable to reach the Intellectus analytics service. Please check the backend connection and try again.',
        time: formatTime(),
      }])
    } finally {
      setLoading(false)
    }
  }

  async function openCitation(citation: Citation) {
    if (citationLoading) return
    setCitationLoading(citation.id)
    try {
      if (citation.type === 'FIR') {
        const fir = await getFIR(citation.id)
        onNavigate?.('case-details', adaptBackendFIR(fir))
      } else if (citation.type === 'CRIMINAL') {
        const person = await getCriminal(citation.id)
        setProfile(person)
      }
    } catch {
      toast('Could not load that verified record. It may not exist in the source database.', 'error')
    } finally {
      setCitationLoading(null)
    }
  }

  async function openProfileCase(firId: string) {
    setCitationLoading(firId)
    try {
      const fir = await getFIR(firId)
      setProfile(null)
      onNavigate?.('case-details', adaptBackendFIR(fir))
    } catch {
      toast('Could not load that case record.', 'error')
    } finally {
      setCitationLoading(null)
    }
  }

  async function clearChat() {
    await clearConversation(sessionRef.current)
    sessionRef.current = newSessionId()
    sessionStorage.setItem('intellectus_session', sessionRef.current)
    setMessages([{ role: 'ai', content: WELCOME, time: formatTime() }])
  }

  const lbl = (en: string, kn: string) => lang === 'en' ? en : kn

  function exportPDF() {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AI Investigation Conversation - Karnataka Police</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #0F172A; }
    h1 { font-size: 20px; border-bottom: 2px solid #2563EB; padding-bottom: 12px; color: #1E3A8A; }
    .meta { font-size: 12px; color: #64748B; margin-bottom: 24px; }
    .msg { margin-bottom: 20px; padding: 14px; border-radius: 8px; }
    .ai { background: #EFF6FF; border-left: 4px solid #2563EB; }
    .user { background: #F8FAFC; border-left: 4px solid #64748B; }
    .role { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 6px; }
    .time { font-size: 10px; color: #94A3B8; }
    .text { font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
    .cite { display: inline-block; background: #EDE9FE; color: #7C3AED; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; margin: 2px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>AI Investigation Conversation</h1>
  <div class="meta">Karnataka Police Intellectus Portal · Exported: ${new Date().toLocaleString('en-IN')} · Session: ${sessionRef.current}</div>
  ${messages.map(msg => `
  <div class="msg ${msg.role}">
    <div class="role">${msg.role === 'ai' ? 'AI Investigation Assistant' : 'Officer'} <span class="time">${msg.time}</span></div>
    <div class="text">${msg.content.replace(/\*\*/g, '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    ${msg.citations ? msg.citations.map(cite => `<span class="cite">${cite.label}</span>`).join('') : ''}
  </div>`).join('')}
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AI_Conversation_${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', fontFamily: "'Inter', sans-serif" }}>

      {/* Left sidebar */}
      <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c('#E2E8F0', '#1E293B')}`, background: c('#fff', '#0D1526'), display: 'flex', flexDirection: 'column', padding: '16px 12px' }}>
        <button onClick={clearChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
          style={{ background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
          <Sparkles size={13} /> New Investigation
        </button>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, padding: '0 4px' }}>
          {lbl('Verified retrieval', 'ಪರಿಶೀಲಿತ ಹಿಂಪಡೆಯುವಿಕೆ')}
        </div>
        <p style={{ fontSize: 11.5, color: c('#64748B', '#94A3B8'), lineHeight: 1.6, padding: '0 4px' }}>
          Every answer is generated from live SQL, vector, or graph retrieval over the source case database — never invented. Citations below each response are clickable and open the verified record.
        </p>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Chat header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${c('#E2E8F0', '#1E293B')}`, background: c('#fff', '#0D1526'), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4C1D95, #7C3AED)' }}>
              <Brain size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: c('#0F172A', '#F1F5F9') }}>AI Investigation Assistant</div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
                <span style={{ fontSize: 11, color: '#64748B' }}>Online · Live retrieval over crime_analytics.sqlite3</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportPDF}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#EDE9FE', border: '1px solid #DDD6FE', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>
              <Download size={12} /> {lbl('Export PDF', 'PDF ರಫ್ತು')}
            </button>
            <button onClick={clearChat}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'none', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#64748B' }}>
              <RotateCcw size={12} /> {lbl('Clear Chat', 'ಚಾಟ್ ತೆರವು')}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
              {msg.role === 'ai' ? (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #4C1D95, #7C3AED)' }}>
                  <Brain size={14} color="#fff" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-700 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', fontWeight: 700, fontSize: 12 }}>
                  RK
                </div>
              )}
              <div style={{ maxWidth: '72%' }}>
                <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-ai'} style={{ padding: '12px 16px', marginBottom: 6 }}>
                  {msg.role === 'ai' ? (
                    <>
                      {msg.route && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                          {msg.route}{msg.intentSource ? ` · ${msg.intentSource === 'llm' ? 'LLM intent' : 'local intent'}` : ''}
                        </div>
                      )}
                      <div style={{ fontSize: 13.5, lineHeight: 1.75, color: c('#0F172A', '#F1F5F9') }}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                    </>
                  ) : (
                    <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{msg.content}</div>
                  )}
                </div>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {msg.citations.map((cite, ci) => (
                      <button key={`${cite.type}-${cite.id}-${ci}`}
                        onClick={() => openCitation(cite)}
                        disabled={citationLoading === cite.id}
                        title={`Open verified ${cite.type === 'FIR' ? 'case record' : 'profile'}`}
                        style={{
                          padding: '2px 8px', background: '#EDE9FE', color: '#7C3AED', borderRadius: 99, fontSize: 10, fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace", border: '1px solid #DDD6FE', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 4, opacity: citationLoading === cite.id ? 0.6 : 1,
                        }}>
                        {citationLoading === cite.id && <Loader size={9} className="animate-spin" />}
                        {cite.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>{msg.time}</span>
                  {msg.role === 'ai' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyToClipboard(msg.content.replace(/\*\*/g, ''))}
                        title="Copy message"
                        style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', borderRadius: 4 }}>
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={() => setMessages(prev => prev.map((m, mi) => mi === i ? { ...m, feedback: m.feedback === 'up' ? null : 'up' } : m))}
                        title="Helpful"
                        style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, color: msg.feedback === 'up' ? '#16A34A' : '#94A3B8' }}>
                        <ThumbsUp size={11} />
                      </button>
                      <button
                        onClick={() => setMessages(prev => prev.map((m, mi) => mi === i ? { ...m, feedback: m.feedback === 'down' ? null : 'down' } : m))}
                        title="Not helpful"
                        style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, color: msg.feedback === 'down' ? '#DC2626' : '#94A3B8' }}>
                        <ThumbsDown size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4C1D95, #7C3AED)', flexShrink: 0 }}>
                <Brain size={14} color="#fff" />
              </div>
              <div className="bubble-ai" style={{ padding: '14px 18px' }}>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', animation: `pulse-blue 1.2s ease ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="flex items-center gap-1.5"
                style={{ padding: '7px 12px', background: c('#F8FAFC', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 99, fontSize: 12, color: c('#374151', '#CBD5E1'), cursor: 'pointer', fontWeight: 400, maxWidth: 280 }}>
                <Sparkles size={11} style={{ color: '#7C3AED', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: '12px 24px 20px', borderTop: `1px solid ${c('#E2E8F0', '#1E293B')}`, background: c('#fff', '#0D1526') }}>
          <div className="relative flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Ask about an FIR, district, crime category, repeat offenders, or case pattern..."
              disabled={loading}
              style={{
                flex: 1, padding: '13px 16px', border: `2px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 14,
                fontSize: 14, color: c('#0F172A', '#F1F5F9'), background: c('#F8FAFC', '#1E293B'), outline: 'none'
              }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)' }}
              onBlur={e => { e.target.style.borderColor = c('#E2E8F0', '#334155'); e.target.style.boxShadow = 'none' }}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              style={{
                width: 48, height: 48, borderRadius: 12, border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                background: input.trim() ? 'linear-gradient(135deg, #4C1D95, #7C3AED)' : c('#F1F5F9', '#1E293B'),
                color: input.trim() ? '#fff' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s'
              }}>
              {loading ? <Loader size={18} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 8, textAlign: 'center' }}>
            AI responses are generated for investigation assistance only. Always verify with official sources and case diary.
          </p>
        </div>
      </div>

      {/* Right panel – context */}
      <div style={{ width: 260, flexShrink: 0, borderLeft: `1px solid ${c('#E2E8F0', '#1E293B')}`, background: c('#fff', '#0D1526'), padding: 16, overflowY: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Recent Cases</div>
        {recentCases.length === 0 && <p style={{ fontSize: 11, color: '#94A3B8' }}>Loading…</p>}
        {recentCases.map((rc, i) => (
          <button key={i} onClick={() => openCitation({ type: 'FIR', id: rc.fir_id, label: rc.fir_id })}
            className="w-full text-left rounded-xl p-3 mb-2" style={{ background: c('#F8FAFC', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2563EB', fontWeight: 600 }}>{rc.fir_id}</div>
            <div style={{ fontSize: 12, color: darkMode ? '#CBD5E1' : '#374151', fontWeight: 500 }}>{rc.crime_code}</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>{rc.district}</div>
          </button>
        ))}

        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, marginTop: 20 }}>Quick Actions</div>
        {[
          { label: 'Search FIR Database', icon: Search, page: 'search' },
          { label: 'View Case Details', icon: FileText, page: 'case-details' },
        ].map(({ label, icon: Icon, page }) => (
          <button key={label}
            onClick={() => onNavigate?.(page as Page)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1.5"
            style={{ background: 'none', border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer', fontSize: 12, color: c('#64748B', '#94A3B8') }}>
            <Icon size={13} />
            {label}
            <ChevronRight size={11} style={{ marginLeft: 'auto' }} />
          </button>
        ))}
      </div>

      {/* Criminal profile modal (opened from a CRIMINAL citation) */}
      <Modal open={!!profile} onClose={() => setProfile(null)} title={profile?.full_name || 'Accused profile'} darkMode={darkMode} width={560}>
        {profile && (
          <div style={{ fontSize: 13, color: c('#374151', '#CBD5E1') }}>
            <div className="flex items-center gap-2 mb-3" style={{ fontSize: 11, color: '#94A3B8' }}>
              <AlertCircle size={13} /> {profile.identity_note}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 8 }}>
              <span style={{ color: '#64748B' }}>Profile ID</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{profile.accused_id}</span>
              <span style={{ color: '#64748B' }}>Age</span><span>{profile.age ?? 'Not recorded'}</span>
              <span style={{ color: '#64748B' }}>Gender</span><span>{profile.gender}</span>
              <span style={{ color: '#64748B' }}>Linked offenses</span><span>{profile.past_offenses}</span>
              <span style={{ color: '#64748B' }}>Case count</span><span>{profile.repeat_case_count}</span>
            </div>
            {profile.past_firs.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>Case history</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {profile.past_firs.map((pf, i) => (
                    <button key={i} onClick={() => openProfileCase(pf.fir_id)} disabled={citationLoading === pf.fir_id}
                      className="text-left" style={{ padding: '8px 10px', background: c('#F8FAFC', '#0F172A'), border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                      <span style={{ color: '#2563EB', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{pf.fir_id}</span>
                      {' · '}{pf.incident_date} · {pf.crime_code} · {pf.district} · {pf.case_status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
