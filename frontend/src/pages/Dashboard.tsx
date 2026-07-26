import { useState } from 'react'
import { FileText, Clock, CheckCircle, Users, TrendingUp, TrendingDown, Plus, Search, MessageSquare, Mic, Upload, BarChart2, MapPin, ChevronRight, Activity, ArrowUpRight } from 'lucide-react'
import type { Lang } from '../utils/translations'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { KPI_DATA, ANALYTICS_DATA, FIRS } from '../data/mockData'
import type { Page } from '../components/Layout'

interface DashboardProps { onNavigate: (page: Page, data?: unknown) => void; darkMode: boolean; lang: Lang }

const QUICK_ACTIONS = [
  { label: { en: 'Register FIR', kn: 'ಎಫ್‌ಐಆರ್ ನೋಂದಾಯಿಸಿ' }, icon: Plus, color: '#2563EB', bg: '#DBEAFE', page: 'search' },
  { label: { en: 'Search Cases', kn: 'ಪ್ರಕರಣ ಹುಡುಕಿ' }, icon: Search, color: '#7C3AED', bg: '#EDE9FE', page: 'search' },
  { label: { en: 'AI Assistant', kn: 'AI ಸಹಾಯಕ' }, icon: MessageSquare, color: '#0891B2', bg: '#CFFAFE', page: 'ai-assistant' },
  { label: { en: 'Voice Assistant', kn: 'ಧ್ವನಿ ಸಹಾಯಕ' }, icon: Mic, color: '#D97706', bg: '#FEF3C7', page: 'voice-assistant' },
  { label: { en: 'Upload Evidence', kn: 'ಸಾಕ್ಷ್ಯ ಅಪ್‌ಲೋಡ್' }, icon: Upload, color: '#16A34A', bg: '#DCFCE7', page: 'admin' },
  { label: { en: 'Reports', kn: 'ವರದಿಗಳು' }, icon: BarChart2, color: '#DC2626', bg: '#FEE2E2', page: 'analytics' },
]

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Under Investigation': { bg: '#FEF9C3', color: '#A16207' },
  'Chargesheet Filed': { bg: '#F3E8FF', color: '#7E22CE' },
  'Closed': { bg: '#DCFCE7', color: '#15803D' },
  'Open': { bg: '#DBEAFE', color: '#1D4ED8' },
}

const GRAVITY_COLORS: Record<string, { bg: string; color: string }> = {
  'Heinous': { bg: '#FEE2E2', color: '#B91C1C' },
  'Serious': { bg: '#FEF3C7', color: '#A16207' },
  'Moderate': { bg: '#DCFCE7', color: '#166534' },
}

const ACTIVITY = [
  { time: '10:42 AM', text: 'FIR CR-No.198/2024 registered at Rajajinagar PS', type: 'fir', officer: 'Const. Raju P' },
  { time: '09:15 AM', text: 'Accused A1 arrested in CR-No.142/2024', type: 'arrest', officer: 'Insp. Manjunath B H' },
  { time: '08:30 AM', text: 'Chargesheet filed in CC No. 145/2024', type: 'chargesheet', officer: 'SI Priya Nair M' },
  { time: 'Yesterday', text: 'Court date set for CC No. 234/2024 – Feb 28', type: 'court', officer: 'PP Advocate' },
  { time: 'Yesterday', text: 'Evidence uploaded in CR-No.178/2024', type: 'evidence', officer: 'Insp. Venkatesh Rao' },
]

const TYPE_COLORS: Record<string, string> = {
  fir: '#2563EB', arrest: '#EF4444', chargesheet: '#7C3AED', court: '#F59E0B', evidence: '#22C55E'
}

export default function Dashboard({ onNavigate, darkMode, lang }: DashboardProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const c = (light: string, dark: string) => darkMode ? dark : light
  const lbl = (en: string, kn: string) => lang === 'en' ? en : kn

  const KPIs = [
    { label: lbl('Total FIRs', 'ಒಟ್ಟು ಎಫ್‌ಐಆರ್'), value: KPI_DATA.totalFIRs.toLocaleString(), icon: FileText, color: '#2563EB', bg: '#DBEAFE', trend: '+12%', up: true, sub: lbl('All time', 'ಎಲ್ಲಾ ಸಮಯ') },
    { label: lbl('Active Investigations', 'ಸಕ್ರಿಯ ತನಿಖೆಗಳು'), value: KPI_DATA.activeInvestigations.toLocaleString(), icon: Activity, color: '#F59E0B', bg: '#FEF3C7', trend: '+5%', up: true, sub: lbl('This month', 'ಈ ತಿಂಗಳು') },
    { label: lbl('Chargesheets Filed', 'ಆರೋಪಪಟ್ಟಿ ಸಲ್ಲಿಕೆ'), value: KPI_DATA.chargesheetsFileds.toLocaleString(), icon: CheckCircle, color: '#8B5CF6', bg: '#EDE9FE', trend: '+8%', up: true, sub: lbl('This year', 'ಈ ವರ್ಷ') },
    { label: lbl('Arrests Made', 'ಬಂಧನಗಳು'), value: KPI_DATA.arrestsMade.toLocaleString(), icon: Users, color: '#22C55E', bg: '#DCFCE7', trend: '+3%', up: true, sub: lbl('This year', 'ಈ ವರ್ಷ') },
    { label: lbl('Pending Cases', 'ಬಾಕಿ ಪ್ರಕರಣಗಳು'), value: KPI_DATA.pendingCases.toLocaleString(), icon: Clock, color: '#64748B', bg: '#F1F5F9', trend: '-2%', up: false, sub: lbl('Requires action', 'ಕ್ರಮ ಅಗತ್ಯ') },
    { label: lbl("Today's FIRs", 'ಇಂದಿನ ಎಫ್‌ಐಆರ್'), value: KPI_DATA.todayFIRs.toLocaleString(), icon: FileText, color: '#0891B2', bg: '#CFFAFE', trend: '+3', up: true, sub: lbl('Registered today', 'ಇಂದು ನೋಂದಾಯಿಸಲಾಗಿದೆ') },
    { label: lbl('Success Rate', 'ಯಶಸ್ಸಿನ ದರ'), value: `${KPI_DATA.successRate}%`, icon: TrendingUp, color: '#16A34A', bg: '#DCFCE7', trend: '+1.2%', up: true, sub: lbl('Investigation rate', 'ತನಿಖಾ ದರ') },
  ]

  const chartData = period === 'week'
    ? ANALYTICS_DATA.monthlyCrimes.slice(-4).map(d => ({ ...d, label: d.month }))
    : period === 'year'
    ? ANALYTICS_DATA.monthlyCrimes
    : ANALYTICS_DATA.monthlyCrimes.slice(-6)

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: c('#0F172A', '#F1F5F9'), letterSpacing: '-0.02em' }}>
            {lbl('Good morning, Inspector Rajesh Kumar', 'ಶುಭೋದಯ, ನಿರೀಕ್ಷಕ ರಾಜೇಶ್ ಕುಮಾರ್')}
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 3 }}>
            {lbl('Karnataka Police · Koramangala PS · Tuesday, 22 July 2024', 'ಕರ್ನಾಟಕ ಪೊಲೀಸ್ · ಕೋರಮಂಗಲ ಪಿಎಸ್ · ಮಂಗಳವಾರ, 22 ಜುಲೈ 2024')}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 'auto' }}>
        {KPIs.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-2xl p-5 card-hover cursor-pointer"
              style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: kpi.bg }}>
                  <Icon size={17} style={{ color: kpi.color }} />
                </div>
                <div className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: kpi.up ? '#16A34A' : '#DC2626' }}>
                  {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {kpi.trend}
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: c('#0F172A', '#F1F5F9'), fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{kpi.label}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{kpi.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9'), marginBottom: 12 }}>
          {lbl('Quick Actions', 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು')}
        </h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon
            return (
              <button key={action.label.en} onClick={() => onNavigate(action.page as Page)}
                className="rounded-xl p-4 text-center card-hover flex flex-col items-center gap-2"
                style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: action.bg }}>
                  <Icon size={18} style={{ color: action.color }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: c('#374151', '#CBD5E1'), lineHeight: 1.3 }}>{action.label[lang]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: '2fr 1fr' }}>

        {/* Area chart */}
        <div className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9') }}>{lbl('Investigation Activity', 'ತನಿಖಾ ಚಟುವಟಿಕೆ')}</h3>
              <p style={{ fontSize: 12, color: '#64748B' }}>{lbl('FIRs, Arrests & Chargesheets', 'ಎಫ್‌ಐಆರ್, ಬಂಧನಗಳು & ಆರೋಪಪಟ್ಟಿ')}</p>
            </div>
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: c('#F8FAFC', '#0F172A') }}>
              {(['week', 'month', 'year'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: period === p ? '#2563EB' : 'transparent', color: period === p ? '#fff' : '#64748B' }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorFirs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorArrests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1E293B' : '#F1F5F9'} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: darkMode ? '#1E293B' : '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="firs" stroke="#2563EB" strokeWidth={2} fill="url(#colorFirs)" name="FIRs" />
              <Area type="monotone" dataKey="arrests" stroke="#22C55E" strokeWidth={2} fill="url(#colorArrests)" name="Arrests" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-3">
            {[{ label: 'FIRs', color: '#2563EB' }, { label: 'Arrests', color: '#22C55E' }, { label: 'Chargesheets', color: '#8B5CF6' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                <span style={{ fontSize: 11, color: '#64748B' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart – crime categories */}
        <div className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9'), marginBottom: 2 }}>Crime Categories</h3>
          <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Distribution by type</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ANALYTICS_DATA.crimeByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1E293B' : '#F1F5F9'} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={120} />
              <Tooltip contentStyle={{ background: darkMode ? '#1E293B' : '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent FIRs + Activity */}
      <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>

        {/* Recent FIRs table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: c('#E2E8F0', '#334155') }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9') }}>Recent FIRs</h3>
            <button onClick={() => onNavigate('search')} className="flex items-center gap-1 text-xs" style={{ color: '#2563EB', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: c('#F8FAFC', '#0F172A') }}>
                  {['Crime No.', 'Category', 'Station', 'Date', 'Gravity', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIRS.map(fir => (
                  <tr key={fir.id} className="table-hover border-b" style={{ borderColor: c('#F1F5F9', '#1E293B') }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#2563EB' }}>{fir.crimeNumber}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: c('#374151', '#CBD5E1') }}>{fir.crimeHead}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: c('#374151', '#CBD5E1') }}>
                      <div>{fir.policeStation}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={9} />{fir.district}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>{fir.registrationDate}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge" style={{ background: GRAVITY_COLORS[fir.gravity]?.bg ?? '#F1F5F9', color: GRAVITY_COLORS[fir.gravity]?.color ?? '#64748B' }}>
                        {fir.gravity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge" style={{ background: STATUS_COLORS[fir.status]?.bg ?? '#F1F5F9', color: STATUS_COLORS[fir.status]?.color ?? '#64748B' }}>
                        {fir.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => onNavigate('case-details', fir)}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: '#2563EB', fontWeight: 600, background: '#EFF6FF', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
                        Open <ArrowUpRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9'), marginBottom: 4 }}>Officer Activity</h3>
          <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Real-time investigation updates</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ACTIVITY.map((act, i) => (
              <div key={i} className="flex gap-3" style={{ paddingBottom: 16, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: TYPE_COLORS[act.type] ?? '#94A3B8' }} />
                  {i < ACTIVITY.length - 1 && <div style={{ width: 1, flex: 1, background: c('#E2E8F0', '#334155'), marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12.5, color: c('#374151', '#CBD5E1'), lineHeight: 1.5, marginBottom: 2 }}>{act.text}</p>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{act.time}</span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>· {act.officer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate('analytics')}
            className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-1"
            style={{ background: c('#F8FAFC', '#0F172A'), color: '#64748B', border: `1px solid ${c('#E2E8F0', '#334155')}`, fontWeight: 500, cursor: 'pointer', fontSize: 12 }}>
            View Full Activity Log <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
