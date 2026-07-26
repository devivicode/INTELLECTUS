import type { FIR } from '../data/mockData'

function escapeHtml(value: unknown): string {
  return String(value ?? 'Not recorded')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function rows(items: Array<[string, unknown]>): string {
  return items.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')
}

function list(items: string[]): string {
  return items.length ? `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>` : '<p class="empty">Not recorded</p>'
}

/** Opens a print-ready document; the browser's Save as PDF destination creates the PDF. */
export function printHTMLToPDF(html: string): boolean {
  // `noopener` makes several browsers return null here, leaving the user on a blank tab.
  // This document is populated synchronously before printing, so a same-origin blank window
  // is required for reliable PDF export.
  const report = window.open('', '_blank')
  if (!report) return false
  report.document.write(html)
  report.document.close()
  report.focus()
  window.setTimeout(() => report.print(), 250)
  return true
}

/** Opens the browser print dialog. Choose “Save as PDF” to download the verified report. */
export function exportFIRToPDF(fir: FIR): boolean {
  const report = window.open('', '_blank', 'noopener,noreferrer')
  if (!report) return false

  const people = (title: string, entries: string[]) => `<section><h2>${title}</h2>${list(entries)}</section>`
  const accused = fir.accused.map(person => `<strong>${escapeHtml(person.accusedNo)} - ${escapeHtml(person.name)}</strong><br>Age: ${escapeHtml(person.age ?? 'Not recorded')} | ${escapeHtml(person.gender)} | Status: ${escapeHtml(person.arrestStatus)}`)
  const complainants = fir.complainants.map(person => `<strong>${escapeHtml(person.name)}</strong><br>Age: ${escapeHtml(person.age)} | ${escapeHtml(person.gender)} | Address: ${escapeHtml(person.address)}`)
  const victims = fir.victims.map(person => `<strong>${escapeHtml(person.name)}</strong><br>Age: ${escapeHtml(person.age)} | ${escapeHtml(person.gender)} | Injuries: ${escapeHtml(person.injuries)}`)
  const sections = fir.sections.map(section => `<strong>${escapeHtml(section.act)} ${escapeHtml(section.section)}</strong> - ${escapeHtml(section.description)}`)

  report.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(fir.crimeNumber)} report</title><style>
    @page { size: A4; margin: 16mm; } body { font-family: Arial, sans-serif; color: #0f172a; font-size: 11pt; line-height: 1.45; } h1 { color: #1e3a8a; font-size: 20pt; margin: 0; } h2 { color: #1e40af; font-size: 13pt; border-bottom: 1px solid #bfdbfe; padding-bottom: 4px; margin-top: 22px; } .meta { color: #475569; margin: 6px 0 20px; font-size: 9pt; } .status { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 10px; font-weight: bold; } table { width: 100%; border-collapse: collapse; } th, td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; } th { width: 34%; color: #475569; font-weight: 600; } .facts { white-space: pre-wrap; background: #f8fafc; padding: 12px; border-left: 3px solid #2563eb; } ul { padding-left: 18px; } li { margin-bottom: 10px; } .empty { color: #64748b; } footer { margin-top: 28px; border-top: 1px solid #cbd5e1; padding-top: 8px; color: #64748b; font-size: 8pt; }
  </style></head><body><h1>FIR Case Report</h1><div class="meta">Karnataka Police Intellectus Portal | Exported: ${escapeHtml(new Date().toLocaleString('en-IN'))}</div>
  <p><strong>${escapeHtml(fir.crimeNumber)}</strong> <span class="status">${escapeHtml(fir.status)}</span></p><table>${rows([['Case number', fir.caseNumber], ['Crime head', fir.crimeHead], ['Category', fir.firCategory], ['Gravity', fir.gravity], ['Registration date', fir.registrationDate], ['Incident date and time', `${fir.incidentDate}${fir.incidentTime ? ` at ${fir.incidentTime} hrs` : ''}`], ['Police station', fir.policeStation], ['District', fir.district], ['Location', fir.location], ['Investigating officer', fir.investigatingOfficer?.name]])}</table>
  <section><h2>Brief facts</h2><div class="facts">${escapeHtml(fir.briefFacts)}</div></section>${people('Complainants', complainants)}${people('Victims', victims)}${people('Accused', accused)}${people('Acts and sections', sections)}<footer>Generated from the currently loaded case record. Verify details against official source records.</footer></body></html>`)
  report.document.close()
  report.focus()
  window.setTimeout(() => report.print(), 250)
  return true
}
