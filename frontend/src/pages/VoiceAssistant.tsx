import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Copy, Trash2, ChevronRight } from 'lucide-react'
import { copyToClipboard } from '../utils/toast'
import type { Lang } from '../utils/translations'

interface VoiceAssistantProps { darkMode: boolean; lang: Lang }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any

const TEMPLATES = [
  {
    title: { en: 'FIR Description', kn: 'ಎಫ್‌ಐಆರ್ ವಿವರಣೆ' },
    prompt: { en: 'Describe the incident for FIR registration...', kn: 'ಎಫ್‌ಐಆರ್ ನೋಂದಣಿಗೆ ಘಟನೆಯನ್ನು ವಿವರಿಸಿ...' },
  },
  {
    title: { en: 'Witness Statement', kn: 'ಸಾಕ್ಷಿ ಹೇಳಿಕೆ' },
    prompt: { en: 'Record witness statement here...', kn: 'ಸಾಕ್ಷಿ ಹೇಳಿಕೆ ಇಲ್ಲಿ ದಾಖಲಿಸಿ...' },
  },
  {
    title: { en: 'Accused Description', kn: 'ಆರೋಪಿ ವಿವರ' },
    prompt: { en: 'Describe the accused person...', kn: 'ಆರೋಪಿಯ ವಿವರ ತಿಳಿಸಿ...' },
  },
  {
    title: { en: 'Investigation Notes', kn: 'ತನಿಖಾ ಟಿಪ್ಪಣಿ' },
    prompt: { en: 'Add investigation notes...', kn: 'ತನಿಖಾ ಟಿಪ್ಪಣಿ ಸೇರಿಸಿ...' },
  },
]

export default function VoiceAssistant({ darkMode, lang }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'kn-IN'>(lang === 'en' ? 'en-IN' : 'kn-IN')
  const [supported, setSupported] = useState(true)
  const [history, setHistory] = useState<{ text: string; time: string; template: string }[]>([])
  const recognitionRef = useRef<AnyRecognition | null>(null)
  const c = (l: string, d: string) => darkMode ? d : l
  const lbl = (en: string, kn: string) => lang === 'en' ? en : kn

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = voiceLang

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }
      if (final) setTranscript(prev => prev + final)
      setInterimText(interim)
    }

    recognition.onerror = () => {
      setIsListening(false)
      setInterimText('')
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
    }

    recognitionRef.current = recognition
    return () => { recognition.abort() }
  }, [voiceLang])

  function toggleListening() {
    const rec = recognitionRef.current
    if (!rec) return

    if (isListening) {
      rec.stop()
      setIsListening(false)
      setInterimText('')
    } else {
      rec.lang = voiceLang
      try {
        rec.start()
        setIsListening(true)
      } catch {
        // already started
      }
    }
  }

  function clearTranscript() {
    if (transcript.trim()) {
      setHistory(prev => [{
        text: transcript.trim(),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        template: TEMPLATES[selectedTemplate].title[lang]
      }, ...prev.slice(0, 4)])
    }
    setTranscript('')
    setInterimText('')
  }

  const displayText = transcript + (interimText ? `[${interimText}]` : '')

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c('#0F172A', '#F1F5F9'), letterSpacing: '-0.01em' }}>
            {lbl('Voice Typing Assistant', 'ಧ್ವನಿ ಟೈಪಿಂಗ್ ಸಹಾಯಕ')}
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
            {lbl('Dictate FIR content, witness statements, and case notes in Kannada or English.', 'ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಎಫ್‌ಐಆರ್, ಸಾಕ್ಷಿ ಹೇಳಿಕೆ ಮತ್ತು ಪ್ರಕರಣ ಟಿಪ್ಪಣಿ ಡಿಕ್ಟೇಟ್ ಮಾಡಿ.')}
          </p>
        </div>
      </div>

      {!supported && (
        <div className="rounded-2xl p-6 mb-6 text-center"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <MicOff size={32} style={{ color: '#EF4444', margin: '0 auto 12px' }} />
          <h3 style={{ fontWeight: 600, fontSize: 16, color: '#B91C1C', marginBottom: 6 }}>
            {lbl('Voice recognition not supported', 'ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ')}
          </h3>
          <p style={{ fontSize: 13, color: '#DC2626' }}>
            {lbl('Please use Chrome or Edge browser for voice typing support.', 'ಧ್ವನಿ ಟೈಪಿಂಗ್ ಬೆಂಬಲಕ್ಕೆ Chrome ಅಥವಾ Edge ಬ್ರೌಸರ್ ಬಳಸಿ.')}
          </p>
        </div>
      )}

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 280px' }}>

        {/* Main area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Template selector */}
          <div className="rounded-2xl p-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lbl('Select Template', 'ಟೆಂಪ್ಲೇಟ್ ಆಯ್ಕೆ ಮಾಡಿ')}
            </div>
            <div className="flex gap-2 flex-wrap">
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => setSelectedTemplate(i)}
                  style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, border: '1px solid',
                    borderColor: selectedTemplate === i ? '#2563EB' : c('#E2E8F0', '#334155'),
                    background: selectedTemplate === i ? '#EFF6FF' : 'transparent',
                    color: selectedTemplate === i ? '#2563EB' : '#64748B', cursor: 'pointer'
                  }}>
                  {t.title[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Language and controls */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: c('#F8FAFC', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
              {[{ code: 'en-IN' as const, label: 'English' }, { code: 'kn-IN' as const, label: 'ಕನ್ನಡ' }].map(opt => (
                <button key={opt.code} onClick={() => setVoiceLang(opt.code)}
                  style={{ padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: voiceLang === opt.code ? '#2563EB' : 'transparent', color: voiceLang === opt.code ? '#fff' : '#64748B' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              {lbl('Recognition language', 'ಗುರುತಿಸುವ ಭಾಷೆ')}
            </span>
          </div>

          {/* Transcript area */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: c('#fff', '#1E293B'), border: `2px solid ${isListening ? '#2563EB' : c('#E2E8F0', '#334155')}`, transition: 'border-color 0.3s' }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: c('#F1F5F9', '#334155'), background: isListening ? (darkMode ? 'rgba(37,99,235,0.1)' : '#EFF6FF') : 'transparent' }}>
              <div className="flex items-center gap-2">
                {isListening && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s ease infinite' }} />
                )}
                <span style={{ fontSize: 12, fontWeight: 600, color: isListening ? '#2563EB' : '#64748B' }}>
                  {isListening
                    ? lbl('Listening... Speak now', 'ಆಲಿಸುತ್ತಿದ್ದೇವೆ... ಈಗ ಮಾತಾಡಿ')
                    : lbl(TEMPLATES[selectedTemplate].prompt.en, TEMPLATES[selectedTemplate].prompt.kn)}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(transcript)}
                  title={lbl('Copy text', 'ಪಠ್ಯ ನಕಲಿಸಿ')}
                  style={{ padding: '5px 8px', background: c('#F8FAFC', '#0F172A'), border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 7, cursor: 'pointer', color: '#64748B' }}>
                  <Copy size={13} />
                </button>
                <button onClick={clearTranscript}
                  title={lbl('Clear', 'ತೆರವುಗೊಳಿಸಿ')}
                  style={{ padding: '5px 8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, cursor: 'pointer', color: '#EF4444' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <textarea
              value={displayText}
              onChange={e => setTranscript(e.target.value.replace(/\[.*?\]$/, ''))}
              placeholder={lbl('Your transcribed text will appear here. Click the microphone button to start...', 'ನಿಮ್ಮ ಟ್ರಾನ್ಸ್‌ಕ್ರೈಬ್ ಮಾಡಿದ ಪಠ್ಯ ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆ. ಪ್ರಾರಂಭಿಸಲು ಮೈಕ್ರೋಫೋನ್ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ...')}
              style={{
                width: '100%', minHeight: 240, padding: '20px', border: 'none', outline: 'none', resize: 'none',
                fontSize: 15, lineHeight: 1.8, color: c('#0F172A', '#F1F5F9'), background: 'transparent',
                fontFamily: lang === 'kn' ? "'Noto Sans Kannada', sans-serif" : "'Inter', sans-serif",
                boxSizing: 'border-box'
              }} />
          </div>

          {/* Mic button */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleListening}
              disabled={!supported}
              style={{
                width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: supported ? 'pointer' : 'not-allowed',
                background: isListening
                  ? 'linear-gradient(135deg, #DC2626, #EF4444)'
                  : 'linear-gradient(135deg, #1E3A8A, #2563EB)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isListening ? '0 0 0 8px rgba(239,68,68,0.2)' : '0 4px 20px rgba(37,99,235,0.35)',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}>
              {isListening ? <MicOff size={28} /> : <Mic size={28} />}
            </button>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: c('#0F172A', '#F1F5F9') }}>
                {isListening
                  ? lbl('Click to stop recording', 'ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ')
                  : lbl('Click to start voice typing', 'ಧ್ವನಿ ಟೈಪಿಂಗ್ ಪ್ರಾರಂಭಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ')}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                {lbl(`Language: ${voiceLang === 'en-IN' ? 'English (India)' : 'ಕನ್ನಡ (India)'}`, `ಭಾಷೆ: ${voiceLang === 'en-IN' ? 'English (India)' : 'ಕನ್ನಡ (India)'}`)}
              </div>
            </div>

            {transcript && (
              <button
                onClick={() => navigator.clipboard.writeText(transcript)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl ml-auto"
                style={{ background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                <Copy size={14} />
                {lbl('Copy All', 'ಎಲ್ಲಾ ನಕಲಿಸಿ')}
              </button>
            )}
          </div>

          {/* Word count */}
          {transcript && (
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: lbl('Words', 'ಪದಗಳು'), value: transcript.trim().split(/\s+/).filter(Boolean).length },
                { label: lbl('Characters', 'ಅಕ್ಷರಗಳು'), value: transcript.length },
                { label: lbl('Sentences', 'ವಾಕ್ಯಗಳು'), value: (transcript.match(/[.!?]+/g) || []).length },
              ].map(stat => (
                <div key={stat.label} style={{ padding: '8px 16px', background: c('#F8FAFC', '#0F172A'), borderRadius: 8, border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#2563EB', fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tips */}
          <div className="rounded-2xl p-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lbl('Tips', 'ಸಲಹೆಗಳು')}
            </div>
            {[
              lbl('Speak clearly and at a moderate pace', 'ಸ್ಪಷ್ಟವಾಗಿ ಮತ್ತು ಮಧ್ಯಮ ವೇಗದಲ್ಲಿ ಮಾತಾಡಿ'),
              lbl('Say "full stop" or "comma" for punctuation', '"ಪೂರ್ಣ ವಿರಾಮ" ಅಥವಾ "ಅಲ್ಪವಿರಾಮ" ಎಂದು ಹೇಳಿ'),
              lbl('Use a quiet environment for best results', 'ಉತ್ತಮ ಫಲಿತಾಂಶಕ್ಕಾಗಿ ಶಾಂತ ವಾತಾವರಣ ಬಳಸಿ'),
              lbl('You can edit the text after dictation', 'ಡಿಕ್ಟೇಷನ್ ನಂತರ ಪಠ್ಯ ಸಂಪಾದಿಸಬಹುದು'),
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <ChevronRight size={12} style={{ color: '#2563EB', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: c('#475569', '#94A3B8'), lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {lbl('Recent Sessions', 'ಇತ್ತೀಚಿನ ಅಧಿವೇಶನಗಳು')}
              </div>
              {history.map((h, i) => (
                <div key={i} className="rounded-xl p-3 mb-2 cursor-pointer"
                  onClick={() => setTranscript(h.text)}
                  style={{ background: c('#F8FAFC', '#0F172A'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                  <div style={{ fontSize: 10, color: '#2563EB', fontWeight: 600, marginBottom: 3 }}>{h.template} · {h.time}</div>
                  <div style={{ fontSize: 12, color: c('#374151', '#CBD5E1'), overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {h.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
