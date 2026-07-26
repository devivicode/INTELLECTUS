import { useState } from 'react'
import { Camera, Upload, ScanLine, CheckCircle, AlertTriangle, RefreshCw, Copy, Edit3, Zap, FileText, X, CheckSquare } from 'lucide-react'
import { copyToClipboard, downloadText, toast } from '../utils/toast'

interface OCRScannerProps { darkMode: boolean }

const EXTRACTED_TEXT = `FIRST INFORMATION REPORT
(Under Section 154 Cr.P.C.)

District: Bengaluru Urban
Police Station: Koramangala
Year: 2024
FIR No.: 142

Date & Time of Occurrence: 14/03/2024 2345 Hrs.
Date & Time of FIR: 15/03/2024 0230 Hrs.

Type of Information: Written

Place of Occurrence:
No. 45, 5th Block, Koramangala,
Bengaluru Urban - 560095

Act Section(s): IPC Section 302, 34

Name of the Complainant/Informant:
Suresh Babu V
S/o: Venkataramu
DOB: 12/05/1982
Nationality: Indian
Present Address: No. 46, 5th Block, Koramangala

Details of Known/Suspected/Unknown accused:
Accused 1: Santhosh Hegde
Accused 2: Kiran Kumar B

Reason for delay in reporting:
Incident discovered at 2345 hrs. FIR filed next day.

Particulars of Properties Stolen/involved:
N/A

Total value of properties involved (Rs.): N/A

Inquest Report/U.D. Case No., if any: N/A

First Information contents: On 14.03.2024 at 2345 hrs...

Signature of the Investigating Officer:
Insp. Manjunath B H
KAR/INS/1234`

const INITIAL_CORRECTIONS = [
  { field: 'FIR No.', original: '142', suggested: '142/2024', confidence: 98, applied: false },
  { field: 'Date of Occurrence', original: '14/03/2024 2345 Hrs.', suggested: '14/03/2024 23:45 hrs', confidence: 95, applied: false },
  { field: 'Section', original: 'IPC Section 302, 34', suggested: 'IPC Sections 302 & 34', confidence: 92, applied: false },
]

export default function OCRScanner({ darkMode }: OCRScannerProps) {
  const [mode, setMode] = useState<'upload' | 'camera' | 'result'>('upload')
  const [progress, setProgress] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [extractedText, setExtractedText] = useState(EXTRACTED_TEXT)
  const [confidence] = useState(91.4)
  const [fileName, setFileName] = useState('')
  const [corrections, setCorrections] = useState(INITIAL_CORRECTIONS)
  const [imported, setImported] = useState(false)
  const c = (l: string, d: string) => darkMode ? d : l

  function applyCorrection(i: number) {
    const corr = corrections[i]
    setExtractedText(prev => prev.replace(corr.original, corr.suggested))
    setCorrections(prev => prev.map((c, ci) => ci === i ? { ...c, applied: true } : c))
    toast(`Correction applied: "${corr.field}"`, 'success')
  }

  function applyAllCorrections() {
    let text = extractedText
    const updated = corrections.map(c => {
      if (!c.applied) text = text.replace(c.original, c.suggested)
      return { ...c, applied: true }
    })
    setExtractedText(text)
    setCorrections(updated)
    toast('All AI corrections applied', 'success')
  }

  function handleImport() {
    setImported(true)
    toast('FIR data imported to database successfully', 'success')
  }

  async function startScan(file?: File) {
    setScanning(true)
    setProgress(0)
    if (file) setFileName(file.name)
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 150))
      setProgress(i)
    }
    setScanning(false)
    setMode('result')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) startScan(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) startScan(file)
  }

  const confidenceColor = confidence > 90 ? '#22C55E' : confidence > 75 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c('#0F172A', '#F1F5F9'), letterSpacing: '-0.01em' }}>OCR & FIR Scanner</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>Scan physical FIR documents using camera or upload images for AI-powered text extraction</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode('upload')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: mode === 'upload' ? '#2563EB' : c('#fff', '#1E293B'), color: mode === 'upload' ? '#fff' : '#64748B', border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer', fontWeight: 500, fontSize: 12 }}>
            <Upload size={13} /> Upload
          </button>
          <button onClick={() => setMode('camera')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: mode === 'camera' ? '#2563EB' : c('#fff', '#1E293B'), color: mode === 'camera' ? '#fff' : '#64748B', border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer', fontWeight: 500, fontSize: 12 }}>
            <Camera size={13} /> Camera
          </button>
        </div>
      </div>

      {mode !== 'result' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Upload / Camera area */}
          <div>
            {mode === 'upload' ? (
              <div>
                <div
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  className="rounded-2xl p-12 text-center border-2 border-dashed cursor-pointer"
                  style={{ borderColor: c('#BFDBFE', '#334155'), background: c('#F0F7FF', 'rgba(37,99,235,0.05)'), minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => document.getElementById('fir-file-input')?.click()}>
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#DBEAFE' }}>
                    <Upload size={28} style={{ color: '#2563EB' }} />
                  </div>
                  <h3 style={{ fontWeight: 600, fontSize: 16, color: c('#1D4ED8', '#93C5FD'), marginBottom: 8 }}>Drop FIR Document Here</h3>
                  <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Supports JPG, PNG, TIFF, PDF · Max 20MB</p>
                  <button style={{ padding: '9px 20px', background: '#2563EB', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    Browse Files
                  </button>
                  <input id="fir-file-input" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>

                {/* Tips */}
                <div className="rounded-xl p-4 mt-4" style={{ background: c('#FFF7ED', '#1E293B'), border: '1px solid #FED7AA' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#C2410C', marginBottom: 6 }}>Tips for best results</div>
                  {['Ensure document is well-lit and in focus', 'Place document flat, avoid shadows', 'Capture the entire page without cropping', 'Use 300 DPI or higher for scanned documents'].map(tip => (
                    <div key={tip} className="flex items-center gap-2 mb-1">
                      <CheckCircle size={11} style={{ color: '#22C55E', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#64748B' }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#000', border: `1px solid ${c('#E2E8F0', '#334155')}`, minHeight: 380 }}>
                {/* Camera placeholder */}
                <div style={{ minHeight: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
                  <Camera size={48} style={{ color: '#334155', marginBottom: 12 }} />
                  <div style={{ color: '#94A3B8', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Camera Access</div>
                  <p style={{ color: '#64748B', fontSize: 12, marginBottom: 20, textAlign: 'center', maxWidth: 200 }}>Click the button below to enable your camera and scan an FIR document</p>

                  {/* Viewfinder overlay */}
                  <div style={{ position: 'relative', width: 240, height: 170, border: '2px solid rgba(37,99,235,0.6)', borderRadius: 8, marginBottom: 16 }}>
                    <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTop: '3px solid #2563EB', borderLeft: '3px solid #2563EB', borderRadius: '4px 0 0 0' }} />
                    <div style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTop: '3px solid #2563EB', borderRight: '3px solid #2563EB', borderRadius: '0 4px 0 0' }} />
                    <div style={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottom: '3px solid #2563EB', borderLeft: '3px solid #2563EB', borderRadius: '0 0 0 4px' }} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottom: '3px solid #2563EB', borderRight: '3px solid #2563EB', borderRadius: '0 0 4px 0' }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Position FIR document here</div>
                    </div>
                  </div>

                  <button onClick={() => startScan()}
                    style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ScanLine size={15} /> Capture & Scan
                  </button>
                </div>
              </div>
            )}

            {/* Scanning progress */}
            {scanning && (
              <div className="rounded-xl p-5 mt-4" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <ScanLine size={15} style={{ color: '#2563EB' }} className="animate-spin" />
                  <span style={{ fontWeight: 600, fontSize: 13, color: c('#0F172A', '#F1F5F9') }}>Processing Document...</span>
                </div>
                <div style={{ background: c('#F1F5F9', '#334155'), borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #2563EB, #3B82F6)', width: `${progress}%`, transition: 'width 0.15s' }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    {progress < 30 ? 'Preprocessing image...' : progress < 60 ? 'Extracting text...' : progress < 85 ? 'Analyzing structure...' : 'Applying AI corrections...'}
                  </span>
                  <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{progress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div>
            <div className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
              <h3 style={{ fontWeight: 600, fontSize: 14, color: c('#0F172A', '#F1F5F9'), marginBottom: 16 }}>How OCR Scanning Works</h3>
              {[
                { step: 1, title: 'Upload or Capture', desc: 'Upload an FIR image/PDF or capture it using your camera.' },
                { step: 2, title: 'AI Pre-processing', desc: 'The system auto-crops, deskews, and enhances the document for optimal OCR accuracy.' },
                { step: 3, title: 'Text Extraction', desc: 'Advanced OCR engine extracts text with character-level confidence scoring.' },
                { step: 4, title: 'AI Correction', desc: 'AI suggests corrections for common OCR errors in legal documents.' },
                { step: 5, title: 'Review & Import', desc: 'Review extracted text, apply corrections, and import into the FIR database.' },
              ].map(s => (
                <div key={s.step} className="flex gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-700 flex-shrink-0"
                    style={{ background: '#DBEAFE', color: '#1D4ED8', fontWeight: 700, fontSize: 12 }}>{s.step}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: c('#0F172A', '#F1F5F9'), marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-5 mt-4" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)', border: '1px solid #DBEAFE' }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} style={{ color: '#7C3AED' }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: '#4C1D95' }}>AI-Powered Features</span>
              </div>
              {['Auto-detect FIR format (Karnataka/Central)', 'Smart field mapping to database schema', 'Legal section validation against IPC/POCSO', 'Automatic date format standardization', 'Cross-reference with existing FIR records'].map(f => (
                <div key={f} className="flex items-center gap-2 mb-1.5">
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#4C1D95' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Results view */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Original document */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: c('#0F172A', '#F1F5F9') }}>Original Document</h3>
              <button onClick={() => setMode('upload')} className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B', background: 'none', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                <RefreshCw size={11} /> Rescan
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: c('#F8FAFC', '#0F172A'), border: `1px solid ${c('#E2E8F0', '#334155')}`, minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', padding: 40 }}>
                <FileText size={48} style={{ color: '#BFDBFE', marginBottom: 12 }} />
                <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>FIR Document Preview</div>
                <div style={{ fontSize: 11, color: '#CBD5E1', fontFamily: "'JetBrains Mono', monospace" }}>{fileName || 'fir_cr142_2024.jpg'}</div>
              </div>
            </div>
          </div>

          {/* Extracted text */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: c('#0F172A', '#F1F5F9'), marginBottom: 2 }}>Extracted Text</h3>
                <div className="flex items-center gap-2">
                  <div style={{ fontSize: 12, color: confidenceColor, fontWeight: 600 }}>
                    {confidence >= 90 ? <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} /> : <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />}
                    {confidence}% Confidence
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: editMode ? '#2563EB' : '#64748B', background: editMode ? '#EFF6FF' : 'none', border: `1px solid ${editMode ? '#BFDBFE' : c('#E2E8F0', '#334155')}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                  <Edit3 size={11} /> Edit
                </button>
                <button onClick={() => copyToClipboard(extractedText)} className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B', background: 'none', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                  <Copy size={11} /> Copy
                </button>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="flex items-center gap-3 mb-3">
              <div style={{ flex: 1, background: c('#F1F5F9', '#334155'), borderRadius: 99, height: 6 }}>
                <div style={{ height: '100%', borderRadius: 99, background: confidenceColor, width: `${confidence}%`, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: confidenceColor, fontWeight: 600 }}>{confidence}%</span>
            </div>

            {editMode ? (
              <textarea value={extractedText} onChange={e => setExtractedText(e.target.value)}
                style={{ width: '100%', minHeight: 400, padding: 16, border: `2px solid #2563EB`, borderRadius: 12, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.8, color: c('#0F172A', '#F1F5F9'), background: c('#fff', '#1E293B'), resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            ) : (
              <div className="rounded-2xl p-4 overflow-y-auto" style={{ background: c('#F8FAFC', '#0F172A'), border: `1px solid ${c('#E2E8F0', '#334155')}`, maxHeight: 400 }}>
                <pre style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.9, color: c('#334155', '#CBD5E1'), whiteSpace: 'pre-wrap', margin: 0 }}>{extractedText}</pre>
              </div>
            )}

            {/* AI Corrections */}
            <div className="mt-4 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFFBEB)', border: '1px solid #FED7AA' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={13} style={{ color: '#D97706' }} />
                  <span style={{ fontWeight: 600, fontSize: 12, color: '#92400E' }}>AI Suggested Corrections</span>
                </div>
                <button onClick={applyAllCorrections}
                  style={{ fontSize: 11, color: '#D97706', background: 'rgba(255,255,255,0.7)', border: '1px solid #FCD34D', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}>
                  Apply All
                </button>
              </div>
              {corrections.map((corr, i) => (
                <div key={i} className="flex items-center gap-3 mb-2 p-2 rounded-lg" style={{ background: corr.applied ? 'rgba(220,252,231,0.6)' : 'rgba(255,255,255,0.6)' }}>
                  <span style={{ fontSize: 10, color: '#92400E', fontWeight: 600, width: 110, flexShrink: 0 }}>{corr.field}</span>
                  <span style={{ fontSize: 11, color: corr.applied ? '#94A3B8' : '#DC2626', textDecoration: corr.applied ? 'none' : 'line-through', fontFamily: "'JetBrains Mono', monospace" }}>{corr.original}</span>
                  <span style={{ fontSize: 11, color: '#64748B' }}>→</span>
                  <span style={{ fontSize: 11, color: '#16A34A', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{corr.suggested}</span>
                  <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>{corr.confidence}%</span>
                  {corr.applied ? (
                    <CheckCircle size={13} style={{ color: '#16A34A', marginLeft: 'auto', flexShrink: 0 }} />
                  ) : (
                    <button onClick={() => applyCorrection(i)}
                      style={{ marginLeft: 'auto', fontSize: 10, color: '#D97706', background: 'none', border: '1px solid #FCD34D', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', flexShrink: 0 }}>
                      Apply
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button onClick={handleImport} disabled={imported}
                style={{ flex: 1, padding: '10px 16px', background: imported ? '#22C55E' : '#2563EB', color: '#fff', borderRadius: 10, border: 'none', cursor: imported ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {imported ? <><CheckCircle size={14} /> Imported Successfully</> : 'Import to FIR Database'}
              </button>
              <button onClick={() => downloadText(extractedText, `ocr_${fileName || 'fir_extract'}.txt`)}
                style={{ flex: 1, padding: '10px 16px', background: c('#fff', '#1E293B'), color: '#64748B', borderRadius: 10, border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
                Export as Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
