import { useState } from 'react'
import { TrendingUp, BarChart3, Map, Download, Calendar, Filter } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { ANALYTICS_DATA, KPI_DATA } from '../data/mockData'

interface AnalyticsProps { darkMode: boolean; lang?: 'en' | 'kn' }

const DISTRICT_HEATMAP_COLORS = ['#DBEAFE', '#93C5FD', '#3B82F6', '#2563EB', '#1D4ED8', '#1E3A8A']

const PIE_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE']

const OFFICER_BARS = ANALYTICS_DATA.officerPerformance

export default function Analytics({ darkMode }: AnalyticsProps) {
  const [period, setPeriod] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual'>('Annual')
  const c = (l: string, d: string) => darkMode ? d : l

  const tooltipStyle = { background: darkMode ? '#1E293B' : '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c('#0F172A', '#F1F5F9'), letterSpacing: '-0.01em' }}>Crime Analytics & Reports</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>Karnataka Police · Statewide crime statistics and investigation performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: c('#F8FAFC', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
            {(['Q1', 'Q2', 'Q3', 'Q4', 'Annual'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: period === p ? '#2563EB' : 'transparent', color: period === p ? '#fff' : '#64748B' }}>
                {p}
              </button>
            ))}
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 10, cursor: 'pointer', fontSize: 12, color: '#64748B' }}>
            <Download size={13} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total FIRs (YTD)', value: '3,896', sub: '+12% vs last year', color: '#2563EB', bg: '#DBEAFE' },
          { label: 'Detection Rate', value: '78.4%', sub: '+1.2% improvement', color: '#22C55E', bg: '#DCFCE7' },
          { label: 'Chargesheet Rate', value: '72.3%', sub: 'Of solved cases', color: '#8B5CF6', bg: '#EDE9FE' },
          { label: 'Avg. Investigation Days', value: '42 days', sub: '-3 days vs 2023', color: '#F59E0B', bg: '#FEF3C7' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl p-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '2fr 1fr' }}>

        {/* Monthly trend */}
        <div className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9') }}>Monthly Crime Trends</h3>
              <p style={{ fontSize: 12, color: '#64748B' }}>FIRs registered, arrests, chargesheets & heinous crimes</p>
            </div>
            <TrendingUp size={18} style={{ color: '#2563EB' }} />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={ANALYTICS_DATA.monthlyCrimes}>
              <defs>
                <linearGradient id="gFirs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gArrests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1E293B' : '#F1F5F9'} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="firs" stroke="#2563EB" strokeWidth={2} fill="url(#gFirs)" name="FIRs Registered" />
              <Area type="monotone" dataKey="arrests" stroke="#22C55E" strokeWidth={2} fill="url(#gArrests)" name="Arrests" />
              <Line type="monotone" dataKey="heinous" stroke="#EF4444" strokeWidth={2} dot={false} name="Heinous" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9'), marginBottom: 2 }}>Crime Categories</h3>
          <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Distribution by category (2024)</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ANALYTICS_DATA.crimeByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="count" nameKey="category">
                {ANALYTICS_DATA.crimeByCategory.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [typeof v === 'number' ? v.toLocaleString() : String(v)]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ANALYTICS_DATA.crimeByCategory.map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#64748B', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.category}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: c('#374151', '#CBD5E1'), fontFamily: "'JetBrains Mono', monospace" }}>{cat.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* District stats */}
      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '1fr 1fr' }}>

        {/* Bar chart */}
        <div className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9') }}>District-wise FIR Statistics</h3>
              <p style={{ fontSize: 12, color: '#64748B' }}>Registered vs Solved vs Pending</p>
            </div>
            <BarChart3 size={16} style={{ color: '#2563EB' }} />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ANALYTICS_DATA.districtStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1E293B' : '#F1F5F9'} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="district" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="solved" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} name="Solved" />
              <Bar dataKey="pending" stackId="a" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap placeholder */}
        <div className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9') }}>Crime Intensity Heatmap</h3>
              <p style={{ fontSize: 12, color: '#64748B' }}>District-wise intensity (Karnataka)</p>
            </div>
            <Map size={16} style={{ color: '#2563EB' }} />
          </div>

          {/* Grid heatmap */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 12 }}>
            {ANALYTICS_DATA.districtStats.concat(ANALYTICS_DATA.districtStats.slice(0, 4)).map((d, i) => {
              const intensity = Math.floor((d.firs / 1456) * 5)
              return (
                <div key={i} title={d.district}
                  style={{
                    height: 36, borderRadius: 6, background: DISTRICT_HEATMAP_COLORS[Math.min(intensity, 5)],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                  }}>
                  <span style={{ fontSize: 9, color: intensity > 3 ? '#fff' : '#1E3A8A', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                    {d.district.split(' ')[0].substring(0, 6)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, color: '#94A3B8' }}>Low</span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'linear-gradient(to right, #DBEAFE, #2563EB, #1E3A8A)' }} />
            <span style={{ fontSize: 10, color: '#94A3B8' }}>High</span>
          </div>

          {/* Table */}
          <div style={{ marginTop: 16 }}>
            {ANALYTICS_DATA.districtStats.map((d, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b" style={{ borderColor: c('#F1F5F9', '#334155') }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: DISTRICT_HEATMAP_COLORS[Math.min(Math.floor((d.firs / 1456) * 5), 5)], flexShrink: 0 }} />
                <span style={{ fontSize: 12, flex: 1, color: c('#374151', '#CBD5E1') }}>{d.district}</span>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#64748B' }}>{d.firs.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>{Math.round(d.solved / d.firs * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Officer performance */}
      <div className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9') }}>Officer Performance</h3>
            <p style={{ fontSize: 12, color: '#64748B' }}>Cases handled, solved, and chargesheets filed per officer</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 24 }}>
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: c('#F8FAFC', '#0F172A') }}>
                  {['Officer', 'Cases', 'Solved', 'CS'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OFFICER_BARS.map((o, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: c('#F1F5F9', '#334155') }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: c('#0F172A', '#F1F5F9') }}>{o.name}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>{o.rank}</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#64748B' }}>{o.cases}</td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#22C55E', fontWeight: 600 }}>{o.solved}</td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#8B5CF6', fontWeight: 600 }}>{o.chargesheets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={OFFICER_BARS}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1E293B' : '#F1F5F9'} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={n => n.split(' ')[0]} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="cases" fill="#BFDBFE" radius={[4, 4, 0, 0]} name="Cases" />
              <Bar dataKey="solved" fill="#2563EB" radius={[4, 4, 0, 0]} name="Solved" />
              <Bar dataKey="chargesheets" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Chargesheets" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
