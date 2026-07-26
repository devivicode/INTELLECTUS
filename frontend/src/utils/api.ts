// Thin client for the Intellectus FastAPI backend. Every call is relative ('/api/...') so it
// works both through the Vite dev proxy (see vite.config.ts) and same-origin in production,
// where the backend serves this built frontend directly.

export interface Citation {
  type: 'FIR' | 'CRIMINAL' | string
  id: string
  label: string
}

export interface ChatResponse {
  answer: string
  citations: Citation[]
  route: string
  evidence: Record<string, unknown>
  intent_source?: string
  session_id: string
  needs_clarification?: boolean
}

export interface BackendAccused { accused_id: string; AccusedName: string; AgeYear: string | number | null; gender: string }
export interface BackendVictim { VictimName: string; AgeYear: string | number | null; gender: string; VictimPolice?: string | null }
export interface BackendComplainant { ComplainantName: string; AgeYear: string | number | null; gender: string }
export interface BackendArrestRecord { ArrestSurrenderDate: string; arrest_type: string; court_name: string; district_name: string; police_station: string }
export interface BackendChargesheet { csdate: string; chargesheet_type: string }

export interface BackendFIR {
  fir_id: string
  source_case_id: string | number
  incident_date: string
  district: string
  police_station: string
  crime_code: string
  crime_group: string
  case_summary: string
  case_status: string
  accused_id: string | null
  full_name: string | null
  accused: BackendAccused[]
  victims: BackendVictim[]
  complainants: BackendComplainant[]
  arrest_records: BackendArrestRecord[]
  chargesheets: BackendChargesheet[]
}

export interface BackendCriminalArrest { ArrestSurrenderDate: string; arrest_type: string; court_name: string }
export interface BackendCriminalPastFIR { fir_id: string; incident_date: string; crime_code: string; district: string; case_status: string }

export interface BackendCriminal {
  accused_id: string
  full_name: string
  age: string | number | null
  gender: string
  past_offenses: string
  identity_note: string
  repeat_case_count: number
  past_firs: BackendCriminalPastFIR[]
  arrest_records: BackendCriminalArrest[]
}

export interface SearchResult { id: string; type: 'FIR' | 'CRIMINAL'; label: string }

export interface OverviewResponse {
  cases: number
  criminals: number
  recent: { fir_id: string; crime_code: string; district: string }[]
  source: string
}

class ApiError extends Error {}

async function asJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new ApiError(`Request failed (${response.status})`)
  return response.json() as Promise<T>
}

export async function getOverview(): Promise<OverviewResponse> {
  return asJson(await fetch('/api/overview'))
}

export async function sendChatMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
  })
  return asJson(response)
}

export async function clearConversation(sessionId: string): Promise<void> {
  try { await fetch(`/api/conversation/${encodeURIComponent(sessionId)}`, { method: 'DELETE' }) } catch { /* best-effort */ }
}

export async function getFIR(firId: string): Promise<BackendFIR> {
  return asJson(await fetch(`/api/fir/${encodeURIComponent(firId)}`))
}

export async function getCriminal(accusedId: string): Promise<BackendCriminal> {
  return asJson(await fetch(`/api/criminal/${encodeURIComponent(accusedId)}`))
}

export async function searchRecords(query: string, kind: 'ALL' | 'FIR' | 'CRIMINAL' = 'ALL'): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query, kind })
  return asJson(await fetch(`/api/search?${params.toString()}`))
}
