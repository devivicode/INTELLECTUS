import { useState } from 'react'
import { Search, Shield, ChevronRight, FileText, Users, TrendingUp, CheckCircle, Clock, MapPin, Zap, ArrowRight, Mic, BarChart2 } from 'lucide-react'
import type { Page } from '../components/Layout'
import type { Lang } from '../utils/translations'

interface LandingProps {
  onNavigate: (page: Page, data?: unknown) => void
  lang: Lang
}

const STATS = [
  { label: { en: 'Total FIRs', kn: 'ಒಟ್ಟು ಎಫ್‌ಐಆರ್' }, value: '3,896', icon: FileText, color: '#2563EB', bg: '#DBEAFE' },
  { label: { en: 'Active Cases', kn: 'ಸಕ್ರಿಯ ಪ್ರಕರಣಗಳು' }, value: '1,234', icon: Clock, color: '#F59E0B', bg: '#FEF3C7' },
  { label: { en: 'Arrests Made', kn: 'ಬಂಧನಗಳು' }, value: '2,156', icon: Users, color: '#22C55E', bg: '#DCFCE7' },
  { label: { en: 'Chargesheets', kn: 'ಆರೋಪಪಟ್ಟಿ' }, value: '892', icon: CheckCircle, color: '#8B5CF6', bg: '#EDE9FE' },
]

const QUICK_CHIPS = [
  { en: 'FIR', kn: 'ಎಫ್‌ಐಆರ್' },
  { en: 'Missing Persons', kn: 'ನಾಪತ್ತೆ ವ್ಯಕ್ತಿಗಳು' },
  { en: 'Under Investigation', kn: 'ತನಿಖೆ ಅಡಿ' },
  { en: 'Cyber Crime', kn: 'ಸೈಬರ್ ಅಪರಾಧ' },
  { en: 'Murder', kn: 'ಕೊಲೆ' },
]

const FEATURES = [
  { icon: Search, title: { en: 'Intelligent Search', kn: 'ಬುದ್ಧಿಯುತ ಹುಡುಕಾಟ' }, desc: { en: 'Search across FIRs, accused, victims, complainants with AI-powered relevance ranking and criminal network analysis.', kn: 'AI ಶ್ರೇಣೀಕರಣ ಮತ್ತು ಅಪರಾಧಿ ಜಾಲ ವಿಶ್ಲೇಷಣೆಯೊಂದಿಗೆ ಎಫ್‌ಐಆರ್, ಆರೋಪಿ, ಸಂತ್ರಸ್ತರನ್ನು ಹುಡುಕಿ.' } },
  { icon: Zap, title: { en: 'AI Investigation Assistant', kn: 'AI ತನಿಖೆ ಸಹಾಯಕ' }, desc: { en: 'Get AI-generated summaries, legal section suggestions, similar case recommendations, and investigation timelines.', kn: 'AI ಸಾರಾಂಶ, ಕಾನೂನು ವಿಭಾಗ ಸಲಹೆ, ಇದೇ ರೀತಿಯ ಪ್ರಕರಣ ಶಿಫಾರಸು ಮತ್ತು ತನಿಖಾ ವೇಳಾಪಟ್ಟಿ ಪಡೆಯಿರಿ.' } },
  { icon: Mic, title: { en: 'Voice Typing Assistant', kn: 'ಧ್ವನಿ ಟೈಪಿಂಗ್ ಸಹಾಯಕ' }, desc: { en: 'Dictate FIR content, case notes, and search queries using voice in Kannada or English.', kn: 'ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಧ್ವನಿ ಬಳಸಿ ಎಫ್‌ಐಆರ್ ವಿಷಯ, ಪ್ರಕರಣ ಟಿಪ್ಪಣಿಗಳನ್ನು ಡಿಕ್ಟೇಟ್ ಮಾಡಿ.' } },
  { icon: TrendingUp, title: { en: 'Crime Analytics', kn: 'ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ' }, desc: { en: 'District-wise heatmaps, monthly trends, category distribution, and investigation performance dashboards.', kn: 'ಜಿಲ್ಲಾ ಹೀಟ್‌ಮ್ಯಾಪ್‌ಗಳು, ಮಾಸಿಕ ಪ್ರವೃತ್ತಿಗಳು ಮತ್ತು ತನಿಖಾ ಕಾರ್ಯಕ್ಷಮತೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗಳು.' } },
  { icon: Users, title: { en: 'Criminal Networks', kn: 'ಅಪರಾಧಿ ಜಾಲ' }, desc: { en: 'Trace criminal associations — see who a suspect has previously worked with across multiple FIRs.', kn: 'ಅಪರಾಧಿ ಸಂಪರ್ಕಗಳನ್ನು ಪತ್ತೆ ಮಾಡಿ — ಅನೇಕ ಎಫ್‌ಐಆರ್‌ಗಳಲ್ಲಿ ಯಾರೊಂದಿಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸಿದ್ದಾರೆ ಎಂದು ನೋಡಿ.' } },
  { icon: MapPin, title: { en: 'Geographic Intelligence', kn: 'ಭೌಗೋಳಿಕ ಗುಪ್ತಚರ' }, desc: { en: 'Interactive crime location maps, hotspot identification, and district-wise crime distribution analysis.', kn: 'ಸಂವಾದಾತ್ಮಕ ಅಪರಾಧ ಸ್ಥಳ ನಕ್ಷೆಗಳು, ಹಾಟ್‌ಸ್ಪಾಟ್ ಗುರುತಿಸುವಿಕೆ ಮತ್ತು ಜಿಲ್ಲಾ ವಿಶ್ಲೇಷಣೆ.' } },
]

const RECENT_FIRS = [
  { crimeNo: 'CR-No.198/2024', type: 'Murder', station: 'Rajajinagar PS', district: 'Bengaluru Urban', time: '2 hrs ago', status: 'Open', gravity: 'Heinous' },
  { crimeNo: 'CR-No.197/2024', type: 'Cyber Fraud', station: 'Whitefield PS', district: 'Bengaluru Urban', time: '3 hrs ago', status: 'Open', gravity: 'Serious' },
  { crimeNo: 'CR-No.196/2024', type: 'Robbery', station: 'Devaraja PS', district: 'Mysuru', time: '5 hrs ago', status: 'Under Investigation', gravity: 'Serious' },
  { crimeNo: 'CR-No.195/2024', type: 'Chain Snatching', station: 'Cubbon Park PS', district: 'Bengaluru Urban', time: '6 hrs ago', status: 'Closed', gravity: 'Moderate' },
]

export default function Landing({ onNavigate, lang }: LandingProps) {
  const [query, setQuery] = useState('')
  const [selectedChip, setSelectedChip] = useState<string | null>(null)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    onNavigate('search', { query })
  }

  const l = lang

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>

      {/* Top nav */}
      <nav className="flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', letterSpacing: '-0.01em' }}>
              {l === 'en' ? 'Karnataka Police' : 'ಕರ್ನಾಟಕ ಪೊಲೀಸ್'}
            </div>
            <div style={{ fontWeight: 600, fontSize: 10, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {l === 'en' ? 'Intellectus' : 'ಇಂಟೆಲೆಕ್ಟಸ್'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('ai-assistant')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            {l === 'en' ? 'Enter Portal' : 'ಪೋರ್ಟಲ್ ನಮೂದಿಸಿ'} <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)', padding: '80px 32px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>

          <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
            <Shield size={36} color="#93C5FD" />
          </div>

          <div className="badge mx-auto mb-4" style={{ background: 'rgba(37,99,235,0.3)', color: '#93C5FD', border: '1px solid rgba(147,197,253,0.3)', display: 'inline-flex' }}>
            {l === 'en' ? 'Government of Karnataka · Police Department' : 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ · ಪೊಲೀಸ್ ಇಲಾಖೆ'}
          </div>

          <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
            {l === 'en' ? 'Karnataka Police' : 'ಕರ್ನಾಟಕ ಪೊಲೀಸ್'}<br />
            <span style={{ color: '#60A5FA' }}>
              {l === 'en' ? 'Intellectus' : 'ಇಂಟೆಲೆಕ್ಟಸ್'}
            </span>
          </h1>
          <p style={{ color: '#93C5FD', fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 48px' }}>
            {l === 'en'
              ? 'AI-powered investigation and case management system. Search, analyze, and manage FIR records with intelligence.'
              : 'AI-ಚಾಲಿತ ತನಿಖೆ ಮತ್ತು ಕೇಸ್ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ. ಬುದ್ಧಿಮತ್ತೆಯಿಂದ ಎಫ್‌ಐಆರ್ ದಾಖಲೆಗಳನ್ನು ಹುಡುಕಿ, ವಿಶ್ಲೇಷಿಸಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ.'}
          </p>

          {/* Search */}
          <form onSubmit={handleSearch}>
            <div className="relative mx-auto" style={{ maxWidth: 680 }}>
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={l === 'en'
                  ? 'Search Crime Number, FIR, Victim, Accused, Complainant, Police Station...'
                  : 'ಅಪರಾಧ ಸಂಖ್ಯೆ, ಎಫ್‌ಐಆರ್, ಸಂತ್ರಸ್ತ, ಆರೋಪಿ, ಪೊಲೀಸ್ ಠಾಣೆ ಹುಡುಕಿ...'}
                className="w-full rounded-2xl text-sm"
                style={{
                  padding: '16px 140px 16px 52px',
                  fontSize: 14,
                  background: '#fff',
                  border: '2px solid transparent',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  color: '#0F172A',
                  outline: 'none',
                }} />
              <button type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
                style={{ background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: 13 }}>
                {l === 'en' ? 'Search' : 'ಹುಡುಕಿ'} <ArrowRight size={14} />
              </button>
            </div>
          </form>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {QUICK_CHIPS.map(chip => (
              <button key={chip.en}
                onClick={() => { setSelectedChip(chip.en); onNavigate('search', { query: chip.en }) }}
                className="px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: selectedChip === chip.en ? '#2563EB' : 'rgba(255,255,255,0.1)',
                  color: selectedChip === chip.en ? '#fff' : '#BFDBFE',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontWeight: 500,
                  fontSize: 12,
                }}>
                {chip[l]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section style={{ maxWidth: 1100, margin: '-40px auto 0', padding: '0 32px', position: 'relative', zIndex: 10 }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {STATS.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label.en} className="rounded-2xl p-5 card-hover"
                style={{ background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: stat.bg }}>
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', fontFamily: "'JetBrains Mono', monospace" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{stat.label[l]}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Recent FIRs */}
      <section style={{ maxWidth: 1100, margin: '48px auto 0', padding: '0 32px' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
              {l === 'en' ? 'Recent FIR Registrations' : 'ಇತ್ತೀಚಿನ ಎಫ್‌ಐಆರ್ ನೋಂದಣಿಗಳು'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              {l === 'en' ? 'Live feed from Karnataka Police stations' : 'ಕರ್ನಾಟಕ ಪೊಲೀಸ್ ಠಾಣೆಗಳಿಂದ ನೇರ ಫೀಡ್'}
            </p>
          </div>
          <button onClick={() => onNavigate('search')} className="flex items-center gap-1.5 text-sm" style={{ color: '#2563EB', fontWeight: 600, fontSize: 13 }}>
            {l === 'en' ? 'View All' : 'ಎಲ್ಲಾ ನೋಡಿ'} <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {RECENT_FIRS.map((fir, i) => (
            <div key={i} className="rounded-xl p-4 card-hover cursor-pointer"
              onClick={() => onNavigate('search', { query: fir.crimeNo })}
              style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#2563EB' }}>{fir.crimeNo}</span>
                    <span className="badge"
                      style={{ background: fir.gravity === 'Heinous' ? '#FEE2E2' : fir.gravity === 'Serious' ? '#FEF3C7' : '#F0FFF4', color: fir.gravity === 'Heinous' ? '#B91C1C' : fir.gravity === 'Serious' ? '#A16207' : '#166534', fontSize: 9 }}>
                      {fir.gravity}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>{fir.type}</div>
                  <div className="flex items-center gap-1 mt-1" style={{ color: '#64748B', fontSize: 12 }}>
                    <MapPin size={11} />
                    {fir.station} · {fir.district}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="badge" style={{ background: fir.status === 'Open' ? '#DBEAFE' : fir.status === 'Closed' ? '#DCFCE7' : '#FEF9C3', color: fir.status === 'Open' ? '#1D4ED8' : fir.status === 'Closed' ? '#15803D' : '#A16207' }}>
                    {fir.status}
                  </span>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{fir.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '64px auto 0', padding: '0 32px' }}>
        <div className="text-center mb-12">
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {l === 'en' ? 'Everything you need to investigate' : 'ತನಿಖೆಗೆ ಅಗತ್ಯವಿರುವ ಎಲ್ಲವೂ'}
          </h2>
          <p style={{ fontSize: 15, color: '#64748B', marginTop: 8, maxWidth: 500, margin: '8px auto 0' }}>
            {l === 'en'
              ? 'A complete intelligence platform built for Karnataka Police officers and investigators'
              : 'ಕರ್ನಾಟಕ ಪೊಲೀಸ್ ಅಧಿಕಾರಿಗಳು ಮತ್ತು ತನಿಖಾ ಅಧಿಕಾರಿಗಳಿಗಾಗಿ ನಿರ್ಮಿಸಲಾದ ಸಂಪೂರ್ಣ ಬುದ್ಧಿಮತ್ತೆ ವೇದಿಕೆ'}
          </p>
        </div>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} className="rounded-2xl p-6 card-hover"
                style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: '#EFF6FF' }}>
                  <Icon size={18} style={{ color: '#2563EB' }} />
                </div>
                <h3 style={{ fontWeight: 600, fontSize: 15, color: '#0F172A', marginBottom: 6 }}>{f.title[l]}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{f.desc[l]}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1100, margin: '64px auto 64px', padding: '0 32px' }}>
        <div className="rounded-3xl p-12 text-center" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>
          <Shield size={40} color="rgba(255,255,255,0.4)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10 }}>
            {l === 'en' ? 'Access Investigation Portal' : 'ತನಿಖಾ ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಿ'}
          </h2>
          <p style={{ color: '#93C5FD', fontSize: 15, marginBottom: 28, maxWidth: 440, margin: '0 auto 28px' }}>
            {l === 'en'
              ? 'Start searching FIRs, cases, criminal records and people with our AI-powered portal.'
              : 'ನಮ್ಮ AI-ಚಾಲಿತ ಪೋರ್ಟಲ್‌ನಿಂದ ಎಫ್‌ಐಆರ್, ಪ್ರಕರಣಗಳು, ಅಪರಾಧ ದಾಖಲೆಗಳನ್ನು ಹುಡುಕಲು ಪ್ರಾರಂಭಿಸಿ.'}
          </p>
          <button onClick={() => onNavigate('ai-assistant')}
            className="px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 mx-auto"
            style={{ background: '#fff', color: '#1E3A8A', fontWeight: 700, fontSize: 15 }}>
            <BarChart2 size={16} />
            {l === 'en' ? 'Go to AI Assistant' : 'AI ಸಹಾಯಕಕ್ಕೆ ಹೋಗಿ'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E2E8F0', background: '#fff', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: '#2563EB' }} />
            <span style={{ fontSize: 12, color: '#64748B' }}>
              {l === 'en' ? 'Karnataka Police · Intellectus · Government of Karnataka' : 'ಕರ್ನಾಟಕ ಪೊಲೀಸ್ · ಇಂಟೆಲೆಕ್ಟಸ್ · ಕರ್ನಾಟಕ ಸರ್ಕಾರ'}
            </span>
          </div>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>© 2024 Karnataka Police.</span>
        </div>
      </footer>
    </div>
  )
}
