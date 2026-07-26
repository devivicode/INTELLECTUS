import { useState, useEffect } from 'react'
import { Search as SearchIcon, SlidersHorizontal, MapPin, Calendar, User, X, ArrowUpRight, Users, Network, Loader2 } from 'lucide-react'
import { DISTRICTS, CRIME_CATEGORIES } from '../data/mockData'
import type { FIR } from '../data/mockData'
import { searchRecords, getFIR } from '../utils/api'
import type { BackendFIR } from '../utils/api'
import { adaptBackendFIR } from '../utils/adapters'
import type { Page } from '../components/Layout'
import type { Lang } from '../utils/translations'

/** How many text-search hits get their full record fetched and rendered per query.
 * The backend's /api/search already caps at 50; this keeps detail-fetch fan-out reasonable. */
const MAX_DETAILED_RESULTS = 30

interface SearchProps { onNavigate: (page: Page, data?: unknown) => void; darkMode: boolean; lang: Lang; initialQuery?: string }

const STATUSES = ['Open', 'Under Investigation', 'Chargesheet Filed', 'Closed', 'Pending']
const GRAVITIES = ['Heinous', 'Serious', 'Moderate', 'Minor']
const CATEGORIES = ['FIR', 'Heinous Crime', 'Cyber Crime', 'PAR']
const SORT_OPTIONS = ['Newest', 'Oldest', 'Most Relevant', 'Recently Updated']

const GRAVITY_STYLES: Record<string, { bg: string; color: string }> = {
  Heinous: { bg: '#FEE2E2', color: '#B91C1C' },
  Serious: { bg: '#FEF3C7', color: '#A16207' },
  Moderate: { bg: '#DCFCE7', color: '#166534' },
  Minor: { bg: '#F1F5F9', color: '#64748B' },
}
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Under Investigation': { bg: '#FEF9C3', color: '#A16207' },
  'Chargesheet Filed': { bg: '#F3E8FF', color: '#7E22CE' },
  Closed: { bg: '#DCFCE7', color: '#15803D' },
  Open: { bg: '#DBEAFE', color: '#1D4ED8' },
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500, border: '1px solid',
      borderColor: active ? '#2563EB' : '#E2E8F0',
      background: active ? '#EFF6FF' : '#fff',
      color: active ? '#2563EB' : '#64748B',
      cursor: 'pointer', transition: 'all 0.15s'
    }}>{label}</button>
  )
}

function CaseCard({ fir, onOpen, darkMode }: { fir: FIR; onOpen: () => void; darkMode: boolean }) {
  const c = (l: string, d: string) => darkMode ? d : l
  return (
    <div className="rounded-2xl p-5 card-hover cursor-pointer" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#2563EB' }}>{fir.crimeNumber}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748B' }}>{fir.caseNumber}</span>
            <span className="badge" style={GRAVITY_STYLES[fir.gravity] ?? { bg: '#F1F5F9', color: '#64748B' }}>{fir.gravity}</span>
            <span className="badge" style={{ background: '#F0FFF4', color: '#166534' }}>{fir.firCategory}</span>
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: c('#0F172A', '#F1F5F9'), marginBottom: 6 }}>{fir.crimeHead}</h3>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {fir.briefFacts}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: '#64748B' }}>
              <MapPin size={12} />
              {fir.policeStation} · {fir.district}
            </div>
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: '#64748B' }}>
              <Calendar size={12} />
              {fir.registrationDate}
            </div>
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: '#64748B' }}>
              <User size={12} />
              IO: {fir.investigatingOfficer.name}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="badge" style={STATUS_STYLES[fir.status] ?? { bg: '#F1F5F9', color: '#64748B' }}>{fir.status}</span>
          <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'right' }}>{fir.crimeCategory}</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>
            {fir.accused.length} accused · {fir.arrests.length} arrested
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: c('#F1F5F9', '#334155') }}>
        <div className="flex gap-2">
          {fir.sections.slice(0, 3).map(s => (
            <span key={s.section} className="badge" style={{ background: c('#F8FAFC', '#0F172A'), color: '#64748B', border: `1px solid ${c('#E2E8F0', '#334155')}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
              {s.act} §{s.section}
            </span>
          ))}
        </div>
        <button onClick={onOpen}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-600"
          style={{ background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer' }}>
          Open Investigation <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  )
}

function buildCriminalNetwork(firList: FIR[], universe: FIR[]) {
  // Build a map of accused name -> all FIRs they appear in, scoped to the currently loaded
  // search results (the backend's own repeat-offender graph is used for the full database
  // view — see the "Find repeat offenders" suggestion in the AI Assistant).
  const accusedFIRs: Record<string, { name: string; cases: FIR[] }> = {}
  universe.forEach(fir => {
    fir.accused.forEach(acc => {
      if (!accusedFIRs[acc.name]) accusedFIRs[acc.name] = { name: acc.name, cases: [] }
      if (!accusedFIRs[acc.name].cases.find(f => f.id === fir.id)) {
        accusedFIRs[acc.name].cases.push(fir)
      }
    })
  })

  // Get all accused from filtered FIRs
  const filteredAccused = new Set<string>()
  firList.forEach(fir => fir.accused.forEach(acc => filteredAccused.add(acc.name)))

  // For each accused in filtered results, find their co-accused across ALL FIRs
  const network: { person: string; appearances: number; coAccused: { name: string; cases: string[] }[] }[] = []

  filteredAccused.forEach(personName => {
    const personFIRs = accusedFIRs[personName]?.cases ?? []
    const coAccusedMap: Record<string, string[]> = {}
    personFIRs.forEach(fir => {
      fir.accused.forEach(acc => {
        if (acc.name !== personName) {
          if (!coAccusedMap[acc.name]) coAccusedMap[acc.name] = []
          coAccusedMap[acc.name].push(fir.crimeNumber)
        }
      })
    })
    const coAccused = Object.entries(coAccusedMap).map(([name, cases]) => ({ name, cases }))
    if (coAccused.length > 0) {
      network.push({ person: personName, appearances: personFIRs.length, coAccused })
    }
  })

  return network
}

export default function Search({ onNavigate, darkMode, lang, initialQuery = '' }: SearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState('Newest')
  const [filters, setFilters] = useState({ district: '', station: '', category: '', status: '', gravity: '', firType: '', dateFrom: '', dateTo: '' })
  const [activeGravity, setActiveGravity] = useState<string[]>([])
  const [activeStatus, setActiveStatus] = useState<string[]>([])
  const [activeFirType, setActiveFirType] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showNetwork, setShowNetwork] = useState(false)
  const [results, setResults] = useState<FIR[]>([])
  const [loading, setLoading] = useState(true)
  const [searchError, setSearchError] = useState('')
  const c = (l: string, d: string) => darkMode ? d : l
  const lbl = (en: string, kn: string) => lang === 'en' ? en : kn

  // Native backend search: debounce the query, ask FastAPI's /api/search for matching FIR
  // ids/labels, then fetch each verified record so the existing rich card UI can render it.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setSearchError('')
    const timer = setTimeout(async () => {
      try {
        const hits = await searchRecords(query, 'FIR')
        const detailed = await Promise.all(
          hits.slice(0, MAX_DETAILED_RESULTS).map(hit => getFIR(hit.id).catch(() => null))
        )
        if (cancelled) return
        setResults(detailed.filter((d): d is BackendFIR => d !== null).map(adaptBackendFIR))
      } catch {
        if (!cancelled) { setSearchError('Unable to reach the search service. Check the backend connection.'); setResults([]) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])

  const filtered = results.filter(fir => {
    if (activeGravity.length && !activeGravity.includes(fir.gravity)) return false
    if (activeStatus.length && !activeStatus.includes(fir.status)) return false
    if (activeFirType.length && !activeFirType.includes(fir.firCategory)) return false
    if (filters.district && fir.district !== filters.district) return false
    if (filters.dateFrom && fir.registrationDate < filters.dateFrom) return false
    if (filters.dateTo && fir.registrationDate > filters.dateTo) return false
    return true
  }).sort((a, b) => {
    if (sort === 'Newest') return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
    if (sort === 'Oldest') return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime()
    if (sort === 'Gravity') {
      const order = { 'Heinous': 0, 'Serious': 1, 'Moderate': 2, 'Minor': 3 }
      return (order[a.gravity as keyof typeof order] ?? 1) - (order[b.gravity as keyof typeof order] ?? 1)
    }
    return 0
  })

  const criminalNetwork = query.length > 2 ? buildCriminalNetwork(filtered, results) : []

  function toggleFilter<T>(arr: T[], setArr: (v: T[]) => void, val: T) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const activeFilterCount = activeGravity.length + activeStatus.length + activeFirType.length + (filters.district ? 1 : 0)

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Inter', sans-serif" }}>

      {/* Search header */}
      <div className="mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: c('#0F172A', '#F1F5F9'), letterSpacing: '-0.01em', marginBottom: 4 }}>
          {lbl('FIR Search', 'ಎಫ್‌ಐಆರ್ ಹುಡುಕಾಟ')}
        </h1>
        <p style={{ fontSize: 13, color: '#64748B' }}>
          {lbl('Search across FIRs, accused, victims, and criminal networks in the Karnataka Police database', 'ಕರ್ನಾಟಕ ಪೊಲೀಸ್ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಎಫ್‌ಐಆರ್, ಆರೋಪಿ, ಸಂತ್ರಸ್ತ ಮತ್ತು ಅಪರಾಧಿ ಜಾಲ ಹುಡುಕಿ')}
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <SearchIcon size={17} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search Crime Number, Case Number, FIR, Victim, Accused, Complainant, Police Station, District, Act, Section..."
          style={{
            width: '100%', paddingLeft: 48, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
            border: '2px solid #E2E8F0', borderRadius: 14, fontSize: 14, color: c('#0F172A', '#F1F5F9'),
            background: c('#fff', '#1E293B'), outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.08)' }}
          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
        {query && (
          <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filter chips row */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: showFilters ? '#EFF6FF' : c('#fff', '#1E293B'), border: showFilters ? '1px solid #BFDBFE' : `1px solid ${c('#E2E8F0', '#334155')}`, color: showFilters ? '#2563EB' : '#64748B', fontWeight: 500, cursor: 'pointer', fontSize: 12 }}>
          <SlidersHorizontal size={13} />
          Filters
          {activeFilterCount > 0 && <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center text-white" style={{ background: '#2563EB', fontSize: 9 }}>{activeFilterCount}</span>}
        </button>

        <div style={{ width: 1, height: 20, background: c('#E2E8F0', '#334155') }} />

        <div className="flex gap-1.5 flex-wrap">
          {GRAVITIES.map(g => <FilterChip key={g} label={g} active={activeGravity.includes(g)} onClick={() => toggleFilter(activeGravity, setActiveGravity, g)} />)}
        </div>

        <div style={{ width: 1, height: 20, background: c('#E2E8F0', '#334155') }} />

        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => <FilterChip key={cat} label={cat} active={activeFirType.includes(cat)} onClick={() => toggleFilter(activeFirType, setActiveFirType, cat)} />)}
        </div>

        <div className="ml-auto">
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, fontSize: 12, color: '#64748B', background: c('#fff', '#1E293B'), outline: 'none', cursor: 'pointer' }}>
            {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 6 }}>District</label>
              <select value={filters.district} onChange={e => setFilters({ ...filters, district: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, fontSize: 13, color: c('#0F172A', '#F1F5F9'), background: c('#F8FAFC', '#0F172A'), outline: 'none' }}>
                <option value="">All Districts</option>
                {DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 6 }}>Crime Category</label>
              <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, fontSize: 13, color: c('#0F172A', '#F1F5F9'), background: c('#F8FAFC', '#0F172A'), outline: 'none' }}>
                <option value="">All Categories</option>
                {CRIME_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 6 }}>Date From</label>
              <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, fontSize: 13, color: c('#0F172A', '#F1F5F9'), background: c('#F8FAFC', '#0F172A'), outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 6 }}>Date To</label>
              <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, fontSize: 13, color: c('#0F172A', '#F1F5F9'), background: c('#F8FAFC', '#0F172A'), outline: 'none' }} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="flex gap-1.5 flex-wrap flex-1">
              {STATUSES.map(s => <FilterChip key={s} label={s} active={activeStatus.includes(s)} onClick={() => toggleFilter(activeStatus, setActiveStatus, s)} />)}
            </div>
            <button onClick={() => { setActiveGravity([]); setActiveStatus([]); setActiveFirType([]); setFilters({ district: '', station: '', category: '', status: '', gravity: '', firType: '', dateFrom: '', dateTo: '' }) }}
              style={{ padding: '6px 14px', background: 'none', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, fontSize: 12, color: '#64748B', cursor: 'pointer' }}>
              Clear All
            </button>
          </div>
        </div>
      )}

      {searchError && (
        <div className="rounded-xl p-3 mb-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 12 }}>
          {searchError}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p style={{ fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? (
            <span className="flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" /> {lbl('Searching verified records…', 'ಪರಿಶೀಲಿತ ದಾಖಲೆಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ…')}</span>
          ) : (
            <>
              {lbl('Showing', 'ತೋರಿಸಲಾಗುತ್ತಿದೆ')} <strong style={{ color: c('#0F172A', '#F1F5F9') }}>{filtered.length}</strong> {lbl('results', 'ಫಲಿತಾಂಶಗಳು')}
              {query && <> {lbl('for', 'ಗಾಗಿ')} "<strong style={{ color: '#2563EB' }}>{query}</strong>"</>}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          {criminalNetwork.length > 0 && (
            <button onClick={() => setShowNetwork(!showNetwork)}
              className="flex items-center gap-1.5"
              style={{ padding: '5px 12px', background: showNetwork ? '#7C3AED' : '#EDE9FE', color: showNetwork ? '#fff' : '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
              <Network size={12} />
              {lbl('Criminal Network', 'ಅಪರಾಧಿ ಜಾಲ')} ({criminalNetwork.length})
            </button>
          )}
          {activeFilterCount > 0 && (
            <button onClick={() => { setActiveGravity([]); setActiveStatus([]); setActiveFirType([]); setFilters({ district: '', station: '', category: '', status: '', gravity: '', firType: '', dateFrom: '', dateTo: '' }) }}
              className="flex items-center gap-1 text-xs" style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              <X size={12} /> {lbl('Clear', 'ತೆರವು')} {activeFilterCount} {lbl('filter', 'ಫಿಲ್ಟರ್')}{activeFilterCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Criminal Network Panel */}
      {showNetwork && criminalNetwork.length > 0 && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: c('#fff', '#1E293B'), border: '2px solid #DDD6FE' }}>
          <div className="flex items-center gap-2 mb-4">
            <Network size={16} style={{ color: '#7C3AED' }} />
            <h3 style={{ fontWeight: 700, fontSize: 15, color: c('#0F172A', '#F1F5F9') }}>
              {lbl('Criminal Network Analysis', 'ಅಪರಾಧಿ ಜಾಲ ವಿಶ್ಲೇಷಣೆ')}
            </h3>
            <span style={{ fontSize: 11, color: '#64748B', marginLeft: 4 }}>
              {lbl('— Associates of accused persons in search results', '— ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳ ಆರೋಪಿಗಳ ಸಹಚರರು')}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {criminalNetwork.map((entry, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: c('#F8FAFC', '#0F172A'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', fontWeight: 700 }}>
                    {entry.person.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: c('#0F172A', '#F1F5F9') }}>{entry.person}</div>
                    <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>
                      {entry.appearances} {lbl('FIR appearances', 'ಎಫ್‌ಐಆರ್ ಕಾಣಿಸಿಕೊಳ್ಳುವಿಕೆಗಳು')}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1" style={{ color: '#64748B', fontSize: 12 }}>
                    <Users size={12} />
                    {entry.coAccused.length} {lbl('known associates', 'ಪರಿಚಿತ ಸಹಚರರು')}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {entry.coAccused.map((co, j) => (
                    <div key={j} style={{ padding: '6px 12px', background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: c('#374151', '#CBD5E1') }}>{co.name}</div>
                      <div style={{ fontSize: 10, color: '#7C3AED', fontFamily: "'JetBrains Mono', monospace" }}>
                        {co.cases.slice(0, 2).join(', ')}{co.cases.length > 2 ? ` +${co.cases.length - 2}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length > 0 ? filtered.map(fir => (
          <CaseCard key={fir.id} fir={fir} onOpen={() => onNavigate('case-details', fir)} darkMode={darkMode} />
        )) : !loading && (
          <div className="text-center py-20 rounded-2xl" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
            <SearchIcon size={36} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
            <h3 style={{ fontWeight: 600, fontSize: 16, color: c('#374151', '#CBD5E1'), marginBottom: 6 }}>No FIRs found</h3>
            <p style={{ fontSize: 13, color: '#94A3B8' }}>Try adjusting your search terms or removing filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
