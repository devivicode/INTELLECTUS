import { useState, useRef } from 'react'
import { MapPin, Calendar, User, FileText, Shield, Clock, ChevronLeft, Download, Share, AlertTriangle, CheckCircle, Users, Gavel, Camera, Paperclip, Brain, Image, File, Video, Mic, X } from 'lucide-react'
import type { FIR, Evidence } from '../data/mockData'
import type { Page } from '../components/Layout'
import { toast, downloadJSON, copyToClipboard } from '../utils/toast'
import { exportFIRToPDF } from '../utils/pdfExport'

interface CaseDetailsProps { fir: FIR | null; onNavigate: (page: Page, data?: unknown) => void; darkMode: boolean }

const TABS = ['Overview', 'Complainants', 'Victims', 'Accused', 'Acts & Sections', 'Arrests', 'Chargesheet', 'Evidence', 'AI Summary']

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: React.ComponentType<{ size: number }> }> = {
  'Under Investigation': { bg: '#FEF9C3', color: '#A16207', icon: Clock },
  'Chargesheet Filed': { bg: '#F3E8FF', color: '#7E22CE', icon: FileText },
  'Closed': { bg: '#DCFCE7', color: '#15803D', icon: CheckCircle },
  'Open': { bg: '#DBEAFE', color: '#1D4ED8', icon: AlertTriangle },
}

const GRAVITY_STYLES: Record<string, { bg: string; color: string }> = {
  Heinous: { bg: '#FEE2E2', color: '#B91C1C' },
  Serious: { bg: '#FEF3C7', color: '#A16207' },
  Moderate: { bg: '#DCFCE7', color: '#166534' },
}

const EV_ICONS: Record<string, React.ComponentType<{ size: number; style?: React.CSSProperties }>> = {
  Image: Image, PDF: File, Video: Video, Audio: Mic, Document: Paperclip
}

const EV_TYPE_COLORS: Record<string, string> = {
  Image: '#2563EB', PDF: '#EF4444', Video: '#8B5CF6', Audio: '#22C55E', Document: '#F59E0B'
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, padding: '10px 0', borderBottom: '1px solid #F1F5F9', alignItems: 'start' }}>
      <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#0F172A', fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit' }}>{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: '#F1F5F9', color: '#64748B', icon: Clock }
  const Icon = s.icon
  return (
    <span className="badge flex items-center gap-1.5" style={{ background: s.bg, color: s.color }}>
      <Icon size={10} /> {status}
    </span>
  )
}

function guessType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg','jpeg','png','gif','webp','bmp'].includes(ext)) return 'Image'
  if (ext === 'pdf') return 'PDF'
  if (['mp4','mov','avi','mkv'].includes(ext)) return 'Video'
  if (['mp3','wav','ogg','m4a'].includes(ext)) return 'Audio'
  return 'Document'
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CaseDetails({ fir, onNavigate, darkMode }: CaseDetailsProps) {
  const [tab, setTab] = useState('Overview')
  const [uploadedFiles, setUploadedFiles] = useState<Evidence[]>([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const c = (l: string, d: string) => darkMode ? d : l

  if (!fir) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
        <FileText size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>No case selected</h2>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>Please search for a case and open it</p>
        <button onClick={() => onNavigate('search')} style={{ padding: '8px 20px', background: '#2563EB', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          Go to Search
        </button>
      </div>
    )
  }

  const safeFir = fir!
  const allEvidence = [...safeFir.evidence, ...uploadedFiles]

  function handleExport() {
    downloadJSON(safeFir, `${safeFir.crimeNumber.replace(/[\/ ]/g, '_')}.json`)
  }

  function handlePdfExport() {
    if (!exportFIRToPDF(safeFir)) {
      toast('Allow pop-ups to export this case as a PDF', 'warning')
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}?case=${safeFir.crimeNumber}`
    await copyToClipboard(`${safeFir.crimeNumber} | ${safeFir.crimeHead} | ${safeFir.policeStation}\n${url}`)
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newEvidence: Evidence[] = Array.from(files).map((f, i) => ({
      id: `UPL${Date.now()}${i}`,
      type: guessType(f.name),
      name: f.name,
      date: new Date().toISOString().split('T')[0],
      size: humanSize(f.size),
      tags: ['Uploaded', guessType(f.name)],
    }))
    setUploadedFiles(prev => [...prev, ...newEvidence])
    toast(`${newEvidence.length} file${newEvidence.length > 1 ? 's' : ''} uploaded to evidence`, 'success')
  }

  function removeUploaded(id: string) {
    setUploadedFiles(prev => prev.filter(e => e.id !== id))
    toast('Evidence file removed', 'info')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const g = GRAVITY_STYLES[fir.gravity] ?? { bg: '#F1F5F9', color: '#64748B' }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Sticky header */}
      <div style={{ background: c('#fff', '#0D1526'), borderBottom: `1px solid ${c('#E2E8F0', '#1E293B')}`, padding: '0 32px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${c('#F1F5F9', '#1E293B')}` }}>
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('search')} className="flex items-center gap-1.5 text-sm"
              style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              <ChevronLeft size={16} /> Back to Search
            </button>
            <div style={{ width: 1, height: 16, background: c('#E2E8F0', '#334155') }} />
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#2563EB', fontSize: 14 }}>{fir.crimeNumber}</span>
              <StatusBadge status={fir.status} />
              <span className="badge" style={g}>{fir.gravity}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePdfExport}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 8, background: '#2563EB', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 600 }}>
              <Download size={13} /> Export PDF
            </button>
            <button onClick={handleExport}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12, color: '#64748B' }}>
              <Download size={13} /> Export JSON
            </button>
            <button onClick={handleShare}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12, color: '#64748B' }}>
              <Share size={13} /> Copy Link
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', marginBottom: -1 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? '#2563EB' : '#64748B', borderBottom: tab === t ? '2px solid #2563EB' : '2px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              {t === 'AI Summary' ? '✨ AI Summary' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px' }}>

        {tab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <div>
              <div className="rounded-2xl p-6 mb-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: c('#0F172A', '#F1F5F9'), marginBottom: 4 }}>{fir.crimeHead}</h3>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>{fir.crimeCategory}</p>
                <InfoRow label="Crime Number" value={fir.crimeNumber} mono />
                <InfoRow label="Case Number" value={fir.caseNumber} mono />
                <InfoRow label="FIR Category" value={<span className="badge" style={{ background: '#EFF6FF', color: '#2563EB' }}>{fir.firCategory}</span>} />
                <InfoRow label="Registration Date" value={fir.registrationDate} mono />
                <InfoRow label="Incident Date" value={`${fir.incidentDate} at ${fir.incidentTime} hrs`} mono />
                <InfoRow label="Current Status" value={<StatusBadge status={fir.status} />} />
                <InfoRow label="Gravity" value={<span className="badge" style={GRAVITY_STYLES[fir.gravity] ?? {}}>{fir.gravity}</span>} />
                <InfoRow label="Police Station" value={fir.policeStation} />
                <InfoRow label="District" value={fir.district} />
                <InfoRow label="Investigating Officer" value={<span>{fir.investigatingOfficer.name} <span style={{ color: '#64748B', fontSize: 11 }}>({fir.investigatingOfficer.rank} · {fir.investigatingOfficer.badge})</span></span>} />
              </div>

              <div className="rounded-2xl p-6 mb-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: c('#0F172A', '#F1F5F9'), marginBottom: 12 }}>Brief Facts</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.8 }}>{fir.briefFacts}</p>
              </div>

              <div className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: c('#0F172A', '#F1F5F9'), marginBottom: 16 }}>Investigation Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { date: fir.incidentDate, label: 'Incident Occurred', color: '#EF4444', desc: `At ${fir.incidentTime} hrs — ${fir.location}` },
                    { date: fir.registrationDate, label: 'FIR Registered', color: '#2563EB', desc: `At ${fir.policeStation} · ${fir.crimeNumber}` },
                    ...(fir.arrests[0] ? [{ date: fir.arrests[0].date, label: 'First Arrest', color: '#F59E0B', desc: `${fir.arrests[0].accusedName} arrested by ${fir.arrests[0].officer}` }] : []),
                    ...(fir.chargesheet ? [{ date: fir.chargesheet.date, label: 'Chargesheet Filed', color: '#8B5CF6', desc: `${fir.chargesheet.reportType} · ${fir.chargesheet.court}` }] : []),
                  ].map((ev, i, arr) => (
                    <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < arr.length - 1 ? 20 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.color, flexShrink: 0, marginTop: 3 }} />
                        {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: c('#E2E8F0', '#334155'), marginTop: 4 }} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: c('#0F172A', '#F1F5F9') }}>{ev.label}</span>
                          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>{ev.date}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#64748B' }}>{ev.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)', height: 200, border: `1px solid ${c('#E2E8F0', '#334155')}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <MapPin size={28} style={{ color: '#2563EB' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>Incident Location</div>
                  <div style={{ fontSize: 11, color: '#64748B', maxWidth: 160, lineHeight: 1.4, marginTop: 4 }}>{fir.location}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{fir.latitude}°N, {fir.longitude}°E</div>
                </div>
              </div>

              {[
                { label: 'Complainants', value: fir.complainants.length, icon: Users, color: '#2563EB' },
                { label: 'Victims', value: fir.victims.length, icon: Users, color: '#EF4444' },
                { label: 'Accused', value: fir.accused.length, icon: Shield, color: '#F59E0B' },
                { label: 'Arrests Made', value: fir.arrests.length, icon: CheckCircle, color: '#22C55E' },
                { label: 'Legal Sections', value: fir.sections.length, icon: Gavel, color: '#8B5CF6' },
                { label: 'Evidence Items', value: allEvidence.length, icon: Paperclip, color: '#0891B2' },
              ].map(stat => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="rounded-xl p-4 flex items-center gap-3"
                    style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                      <Icon size={16} style={{ color: stat.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: c('#0F172A', '#F1F5F9'), fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{stat.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'Complainants' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fir.complainants.map((comp, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-700"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #1E3A8A)', fontWeight: 700, fontSize: 14 }}>
                    {comp.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: c('#0F172A', '#F1F5F9') }}>{comp.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Complainant</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                  <InfoRow label="Age" value={`${comp.age} years`} />
                  <InfoRow label="Gender" value={comp.gender} />
                  <InfoRow label="Occupation" value={comp.occupation} />
                  <InfoRow label="Religion" value={comp.religion} />
                  <InfoRow label="Caste" value={comp.caste} />
                  <InfoRow label="Phone" value={comp.phone} mono />
                </div>
                <InfoRow label="Address" value={comp.address} />
              </div>
            ))}
          </div>
        )}

        {tab === 'Victims' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fir.victims.map((v, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-700"
                    style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', fontWeight: 700, fontSize: 14 }}>
                    {v.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: c('#0F172A', '#F1F5F9') }}>{v.name}</div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 12, color: '#64748B' }}>Victim</span>
                      {v.isPolicePersonnel && <span className="badge" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>Police Personnel</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                  <InfoRow label="Age" value={`${v.age} years`} />
                  <InfoRow label="Gender" value={v.gender} />
                  <InfoRow label="Occupation" value={v.occupation} />
                </div>
                <InfoRow label="Address" value={v.address} />
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: 11, color: '#B91C1C', fontWeight: 600, marginBottom: 3 }}>Injuries / Harm</div>
                  <div style={{ fontSize: 13, color: '#7F1D1D' }}>{v.injuries}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Accused' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fir.accused.map((acc, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-700"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', fontWeight: 700, fontSize: 14 }}>
                      {acc.accusedNo}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: c('#0F172A', '#F1F5F9') }}>{acc.name}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{acc.accusedNo} · {acc.gender}</div>
                    </div>
                  </div>
                  <span className="badge" style={{ background: acc.arrestStatus === 'Arrested' ? '#DCFCE7' : '#FEE2E2', color: acc.arrestStatus === 'Arrested' ? '#15803D' : '#B91C1C' }}>
                    {acc.arrestStatus}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                  <InfoRow label="Age" value={acc.age ? `${acc.age} years` : 'Unknown'} />
                  <InfoRow label="Arrest Date" value={acc.arrestDate ?? 'Not arrested'} mono />
                </div>
                <InfoRow label="Address" value={acc.address} />
              </div>
            ))}
          </div>
        )}

        {tab === 'Acts & Sections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fir.sections.map((sec, i) => (
              <div key={i} className="rounded-2xl p-5 flex items-center gap-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <div className="flex-shrink-0 w-16 text-center">
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 800, color: '#2563EB' }}>{sec.section}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sec.act}</div>
                </div>
                <div style={{ width: 1, height: 48, background: c('#E2E8F0', '#334155') }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: c('#0F172A', '#F1F5F9'), marginBottom: 4 }}>{sec.description}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{sec.act} Section {sec.section}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Arrests' && (
          fir.arrests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fir.arrests.map((arr, i) => (
                <div key={i} className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                      <CheckCircle size={15} style={{ color: '#16A34A' }} />
                    </div>
                    <div style={{ fontWeight: 700, color: c('#0F172A', '#F1F5F9') }}>{arr.accusedName}</div>
                    <span className="badge" style={{ background: '#DCFCE7', color: '#15803D' }}>{arr.type}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                    <InfoRow label="Arrest Date" value={arr.date} mono />
                    <InfoRow label="Arresting Officer" value={arr.officer} />
                    <InfoRow label="Police Station" value={arr.station} />
                    <InfoRow label="Court" value={arr.court} />
                    <InfoRow label="State" value={arr.state} />
                    <InfoRow label="District" value={arr.district} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Shield size={36} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
              <h3 style={{ fontWeight: 600, color: '#374151', fontSize: 16 }}>No arrests recorded</h3>
              <p style={{ color: '#94A3B8', fontSize: 13 }}>Investigation is ongoing</p>
            </div>
          )
        )}

        {tab === 'Chargesheet' && (
          fir.chargesheet ? (
            <div className="rounded-2xl p-8 max-w-lg" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#EDE9FE' }}>
                  <Gavel size={22} style={{ color: '#7C3AED' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: c('#0F172A', '#F1F5F9') }}>Chargesheet Filed</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{fir.chargesheet.courtNumber}</div>
                </div>
              </div>
              <InfoRow label="Date Filed" value={fir.chargesheet.date} mono />
              <InfoRow label="Report Type" value={fir.chargesheet.reportType} />
              <InfoRow label="Filing Officer" value={fir.chargesheet.filingOfficer} />
              <InfoRow label="Court" value={fir.chargesheet.court} />
              <InfoRow label="Court Number" value={fir.chargesheet.courtNumber} mono />
              <button onClick={() => downloadJSON(fir.chargesheet, `chargesheet_${fir.crimeNumber.replace(/[\/ ]/g, '_')}.json`)}
                style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#EDE9FE', color: '#7C3AED', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                <Download size={13} /> Download Chargesheet
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <FileText size={36} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
              <h3 style={{ fontWeight: 600, color: '#374151', fontSize: 16 }}>Chargesheet not yet filed</h3>
              <p style={{ color: '#94A3B8', fontSize: 13 }}>Investigation is pending</p>
            </div>
          )
        )}

        {tab === 'Evidence' && (
          <div>
            {/* Upload zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl p-6 border-2 border-dashed flex flex-col items-center gap-3 mb-5 cursor-pointer"
              style={{ borderColor: dragging ? '#2563EB' : c('#BFDBFE', '#334155'), background: dragging ? '#EFF6FF' : c('#F0F7FF', 'rgba(37,99,235,0.05)'), transition: 'all 0.15s' }}>
              <Camera size={24} style={{ color: dragging ? '#1D4ED8' : '#2563EB' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: '#1D4ED8', fontSize: 13 }}>{dragging ? 'Drop files here' : 'Upload Evidence'}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Drag and drop files, or click to browse · Images, PDFs, Videos, Audio</div>
              </div>
              <button style={{ padding: '7px 18px', background: '#2563EB', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                Browse Files
              </button>
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.mp4,.mov,.mp3,.wav" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
            </div>

            {/* Evidence grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {allEvidence.map(ev => {
                const Icon = EV_ICONS[ev.type] ?? Paperclip
                const isUploaded = ev.id.startsWith('UPL')
                return (
                  <div key={ev.id} className="rounded-2xl p-5 card-hover relative" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                    {isUploaded && (
                      <button onClick={() => removeUploaded(ev.id)}
                        style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: '#FEE2E2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                        <X size={11} />
                      </button>
                    )}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: `${EV_TYPE_COLORS[ev.type] ?? '#2563EB'}15` }}>
                      <Icon size={18} style={{ color: EV_TYPE_COLORS[ev.type] ?? '#2563EB' }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: c('#0F172A', '#F1F5F9'), marginBottom: 4, wordBreak: 'break-word' }}>{ev.name}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>{ev.type} · {ev.size} · {ev.date}</div>
                    <div className="flex flex-wrap gap-1">
                      {ev.tags.map(tag => (
                        <span key={tag} style={{ padding: '2px 8px', background: c('#F8FAFC', '#0F172A'), border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 99, fontSize: 10, color: '#64748B' }}>
                          {tag}
                        </span>
                      ))}
                      {isUploaded && <span style={{ padding: '2px 8px', background: '#DCFCE7', borderRadius: 99, fontSize: 10, color: '#15803D', fontWeight: 600 }}>New</span>}
                    </div>
                  </div>
                )
              })}
              {allEvidence.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60 }}>
                  <Paperclip size={36} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
                  <h3 style={{ fontWeight: 600, color: '#374151', fontSize: 16 }}>No evidence uploaded yet</h3>
                  <p style={{ color: '#94A3B8', fontSize: 13 }}>Use the upload zone above to add evidence files</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'AI Summary' && (
          <div style={{ maxWidth: 760 }}>
            <div className="rounded-2xl p-6 mb-5" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)', border: '1px solid #DBEAFE' }}>
              <div className="flex items-center gap-2 mb-3">
                <Brain size={18} style={{ color: '#7C3AED' }} />
                <span style={{ fontWeight: 700, color: '#4C1D95', fontSize: 14 }}>AI Investigation Analysis</span>
                <span className="badge" style={{ background: '#EDE9FE', color: '#7C3AED' }}>Powered by AI</span>
              </div>
              <p style={{ fontSize: 13, color: '#4C1D95', lineHeight: 1.8 }}>
                Based on the FIR data for <strong>{fir.crimeNumber}</strong>, this is a <strong>{fir.gravity} {fir.crimeHead}</strong> case
                registered on {fir.registrationDate} at {fir.policeStation}. The case involves {fir.accused.length} accused
                person{fir.accused.length !== 1 ? 's' : ''}, of whom {fir.arrests.length} {fir.arrests.length === 1 ? 'has' : 'have'} been arrested.
                {fir.chargesheet ? ` A chargesheet has been filed at ${fir.chargesheet.court}.` : ' The investigation is currently ongoing.'}
              </p>
            </div>

            <div className="rounded-2xl p-6 mb-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
              <h3 style={{ fontWeight: 600, fontSize: 14, color: c('#0F172A', '#F1F5F9'), marginBottom: 12 }}>Applicable Legal Sections</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
                The case has been registered under{' '}
                {fir.sections.map((s, i) => (
                  <span key={i}><strong style={{ color: '#2563EB' }}>{s.act} Section {s.section}</strong> ({s.description}){i < fir.sections.length - 1 ? ', ' : ''}</span>
                ))}.
              </p>
            </div>

            <div className="rounded-2xl p-6 mb-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
              <h3 style={{ fontWeight: 600, fontSize: 14, color: c('#0F172A', '#F1F5F9'), marginBottom: 12 }}>Recommended Next Steps</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  fir.arrests.length < fir.accused.length ? `Expedite arrest of ${fir.accused.filter(a => a.arrestStatus !== 'Arrested').length} remaining accused` : null,
                  !fir.chargesheet ? 'Prepare and file chargesheet within stipulated time' : null,
                  fir.evidence.length < 3 ? 'Collect and upload additional forensic evidence' : null,
                  'Conduct witness statements and record in case diary',
                  'Coordinate with FSL for pending lab reports',
                ].filter(Boolean).map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: c('#374151', '#CBD5E1'), lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => onNavigate('ai-assistant')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#2563EB', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                <Brain size={15} /> Open AI Assistant
              </button>
              <button onClick={() => downloadJSON({ summary: `AI Summary for ${fir.crimeNumber}`, ...fir }, `ai_summary_${fir.crimeNumber.replace(/[\/ ]/g, '_')}.json`)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: c('#F8FAFC', '#1E293B'), color: '#64748B', borderRadius: 10, border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
                <Download size={15} /> Export Summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
