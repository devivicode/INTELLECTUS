import type { BackendFIR } from './api'
import type { FIR, Accused, Victim, Complainant, Arrest, Chargesheet } from '../data/mockData'

const NOT_RECORDED = 'Not recorded'

function toAge(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

/** Heuristic severity classification — the source database has no gravity column,
 * so this mirrors the category keywords already used elsewhere in the system. */
export function guessGravity(crimeCode: string): 'Heinous' | 'Serious' | 'Moderate' | 'Minor' {
  const text = (crimeCode || '').toLowerCase()
  if (/murder|rape|pocso|dacoity|kidnap|terror|homicide/.test(text)) return 'Heinous'
  if (/robbery|assault|extortion|arms|drug|narcotic|peddling/.test(text)) return 'Serious'
  if (/theft|burglary|cheating|fraud|mischief|snatching/.test(text)) return 'Moderate'
  return 'Minor'
}

export function adaptBackendFIR(data: BackendFIR): FIR {
  const gravity = guessGravity(data.crime_code)

  const complainants: Complainant[] = (data.complainants || []).map(c => ({
    name: c.ComplainantName || NOT_RECORDED,
    age: toAge(c.AgeYear) ?? 0,
    gender: c.gender || NOT_RECORDED,
    occupation: NOT_RECORDED,
    religion: NOT_RECORDED,
    caste: NOT_RECORDED,
    address: NOT_RECORDED,
    phone: NOT_RECORDED,
  }))

  const victims: Victim[] = (data.victims || []).map(v => ({
    name: v.VictimName || NOT_RECORDED,
    age: toAge(v.AgeYear) ?? 0,
    gender: v.gender || NOT_RECORDED,
    isPolicePersonnel: String(v.VictimPolice ?? '').toLowerCase() === 'true' || v.VictimPolice === '1',
    occupation: NOT_RECORDED,
    address: NOT_RECORDED,
    injuries: NOT_RECORDED,
  }))

  const arrestCount = (data.arrest_records || []).length
  const accused: Accused[] = (data.accused || []).map((a, i) => {
    // Source schema has no per-accused arrest link at this endpoint, so arrests are
    // matched positionally as a best-effort signal rather than a verified fact.
    const arrested = i < arrestCount
    return {
      accusedNo: `A${i + 1}`,
      name: a.AccusedName || NOT_RECORDED,
      age: toAge(a.AgeYear),
      gender: a.gender || NOT_RECORDED,
      address: NOT_RECORDED,
      arrestStatus: arrested ? 'Arrested' : 'Wanted',
      arrestDate: arrested ? (data.arrest_records[i]?.ArrestSurrenderDate ?? null) : null,
    }
  })

  const arrests: Arrest[] = (data.arrest_records || []).map(a => ({
    date: a.ArrestSurrenderDate || NOT_RECORDED,
    type: a.arrest_type || NOT_RECORDED,
    accusedName: NOT_RECORDED, // source schema has no per-arrest accused link at this endpoint
    officer: NOT_RECORDED,
    station: a.police_station || data.police_station || NOT_RECORDED,
    court: a.court_name || NOT_RECORDED,
    state: 'Karnataka',
    district: a.district_name || data.district || NOT_RECORDED,
  }))

  const chargesheet: Chargesheet | null = (data.chargesheets && data.chargesheets[0])
    ? {
        date: data.chargesheets[0].csdate || NOT_RECORDED,
        reportType: data.chargesheets[0].chargesheet_type || NOT_RECORDED,
        filingOfficer: NOT_RECORDED,
        court: NOT_RECORDED,
        courtNumber: NOT_RECORDED,
      }
    : null

  return {
    id: data.fir_id,
    crimeNumber: data.fir_id,
    caseNumber: `Source case #${data.source_case_id}`,
    firCategory: data.crime_group || 'FIR',
    registrationDate: data.incident_date || NOT_RECORDED,
    incidentDate: data.incident_date || NOT_RECORDED,
    incidentTime: '',
    status: data.case_status || NOT_RECORDED,
    gravity,
    crimeHead: data.crime_code || 'Unclassified',
    crimeCategory: data.crime_group || 'Unclassified',
    policeStation: data.police_station || NOT_RECORDED,
    district: data.district || NOT_RECORDED,
    investigatingOfficer: { id: '', name: NOT_RECORDED, rank: '', station: data.police_station || NOT_RECORDED, badge: '' },
    briefFacts: data.case_summary || 'No brief facts recorded.',
    latitude: 0,
    longitude: 0,
    location: `${data.police_station || NOT_RECORDED}, ${data.district || NOT_RECORDED}`,
    complainants,
    victims,
    accused,
    sections: [], // per-case act/section joins are not exposed by the current /api/fir endpoint
    arrests,
    chargesheet,
    evidence: [],
  }
}
