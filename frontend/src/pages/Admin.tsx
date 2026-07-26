import { useState } from 'react'
import { Users, Building, Shield, Activity, Settings, Search, Plus, Edit, Trash2, Check, Filter, Download, AlertTriangle, X, Save, Eye } from 'lucide-react'
import Modal from '../components/Modal'
import { toast, downloadCSV } from '../utils/toast'

interface AdminProps { darkMode: boolean; lang?: 'en' | 'kn' }

const TABS = ['Users', 'Police Stations', 'Roles & Permissions', 'Audit Logs', 'System Settings']

type Officer = { id: string; name: string; email: string; rank: string; station: string; district: string; status: 'Active' | 'Inactive'; lastLogin: string; cases: number }

const INITIAL_USERS: Officer[] = [
  { id: 'USR001', name: 'Rajesh Kumar S', email: 'rajesh.kumar@ksp.gov.in', rank: 'Inspector', station: 'Koramangala PS', district: 'Bengaluru Urban', status: 'Active', lastLogin: '2024-07-22 10:42', cases: 45 },
  { id: 'USR002', name: 'Priya Nair M', email: 'priya.nair@ksp.gov.in', rank: 'Sub Inspector', station: 'Indiranagar PS', district: 'Bengaluru Urban', status: 'Active', lastLogin: '2024-07-22 09:15', cases: 38 },
  { id: 'USR003', name: 'Manjunath B H', email: 'manjunath.bh@ksp.gov.in', rank: 'Inspector', station: 'Koramangala PS', district: 'Bengaluru Urban', status: 'Active', lastLogin: '2024-07-21 17:30', cases: 52 },
  { id: 'USR004', name: 'Suma Reddy G', email: 'suma.reddy@ksp.gov.in', rank: 'Sub Inspector', station: 'Whitefield PS', district: 'Bengaluru Urban', status: 'Inactive', lastLogin: '2024-07-20 14:00', cases: 41 },
  { id: 'USR005', name: 'Venkatesh Rao K', email: 'venkatesh.rao@ksp.gov.in', rank: 'Inspector', station: 'Jayanagar PS', district: 'Bengaluru Urban', status: 'Active', lastLogin: '2024-07-22 08:30', cases: 48 },
]

type AuditLog = { time: string; user: string; action: string; resource: string; ip: string; status: 'Success' | 'Failed' }

const ALL_AUDIT_LOGS: AuditLog[] = [
  { time: '2024-07-22 10:42:15', user: 'Rajesh Kumar S', action: 'VIEWED', resource: 'CR-No.142/2024', ip: '192.168.1.45', status: 'Success' },
  { time: '2024-07-22 10:35:22', user: 'Priya Nair M', action: 'UPDATED', resource: 'CR-No.056/2024', ip: '192.168.1.67', status: 'Success' },
  { time: '2024-07-22 10:20:10', user: 'Suma Reddy G', action: 'EXPORT', resource: 'FIR Report Q2-2024', ip: '10.0.0.12', status: 'Failed' },
  { time: '2024-07-22 09:45:33', user: 'Manjunath B H', action: 'ARREST RECORDED', resource: 'CR-No.142/2024 · A1', ip: '192.168.1.89', status: 'Success' },
  { time: '2024-07-22 09:15:08', user: 'System', action: 'AUTO-BACKUP', resource: 'FIR Database Snapshot', ip: 'localhost', status: 'Success' },
  { time: '2024-07-22 08:30:44', user: 'Venkatesh Rao K', action: 'LOGIN', resource: 'Portal Authentication', ip: '192.168.2.11', status: 'Success' },
  { time: '2024-07-21 17:55:10', user: 'Priya Nair M', action: 'UPDATED', resource: 'CR-No.178/2024', ip: '192.168.1.67', status: 'Success' },
  { time: '2024-07-21 16:20:00', user: 'Unknown', action: 'LOGIN', resource: 'Portal Authentication', ip: '203.0.113.42', status: 'Failed' },
]

const BLANK_OFFICER: Omit<Officer, 'id' | 'lastLogin' | 'cases'> = { name: '', email: '', rank: 'Constable', station: '', district: 'Bengaluru Urban', status: 'Active' }

const RANKS = ['Constable', 'Head Constable', 'Assistant Sub Inspector', 'Sub Inspector', 'Inspector', 'Deputy Superintendent']
const DISTRICTS = ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mangaluru', 'Belagavi', 'Hubballi-Dharwad', 'Kalaburagi']
const AUDIT_ACTIONS = ['All', 'LOGIN', 'VIEWED', 'UPDATED', 'EXPORT', 'ARREST RECORDED', 'AUTO-BACKUP']
const AUDIT_STATUSES = ['All', 'Success', 'Failed']

const ROLES = [
  { role: 'Super Admin', permissions: ['Full Access', 'User Management', 'System Settings', 'Audit Logs', 'All FIRs'], users: 2, color: '#7C3AED' },
  { role: 'District Admin', permissions: ['District FIRs', 'Officer Management', 'Reports', 'Analytics'], users: 28, color: '#2563EB' },
  { role: 'Inspector', permissions: ['Station FIRs', 'Case Investigation', 'Arrests', 'Evidence', 'Chargesheet'], users: 245, color: '#16A34A' },
  { role: 'Sub Inspector', permissions: ['Assigned FIRs', 'Evidence Upload', 'Witness Statements'], users: 612, color: '#D97706' },
  { role: 'Constable', permissions: ['View FIRs', 'Patrol Reports', 'Evidence Collection'], users: 1840, color: '#64748B' },
  { role: 'Read Only', permissions: ['View FIRs', 'View Reports'], users: 89, color: '#94A3B8' },
]

type Station = { id: string; name: string; district: string; officers: number; cases: number; status: 'Active' | 'Maintenance' }
const INITIAL_STATIONS: Station[] = [
  { id: 'PS001', name: 'Koramangala PS', district: 'Bengaluru Urban', officers: 42, cases: 128, status: 'Active' },
  { id: 'PS002', name: 'Indiranagar PS', district: 'Bengaluru Urban', officers: 38, cases: 95, status: 'Active' },
  { id: 'PS003', name: 'Whitefield PS', district: 'Bengaluru Urban', officers: 45, cases: 156, status: 'Active' },
  { id: 'PS004', name: 'Devaraja PS', district: 'Mysuru', officers: 31, cases: 67, status: 'Active' },
  { id: 'PS005', name: 'Nazarbad PS', district: 'Mysuru', officers: 28, cases: 54, status: 'Maintenance' },
]

const PAGE_SIZE = 5

export default function Admin({ darkMode }: AdminProps) {
  const [tab, setTab] = useState('Users')
  const c = (l: string, d: string) => darkMode ? d : l

  // Users state
  const [users, setUsers] = useState<Officer[]>(INITIAL_USERS)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userPage, setUserPage] = useState(1)
  const [showAddOfficer, setShowAddOfficer] = useState(false)
  const [editingUser, setEditingUser] = useState<Officer | null>(null)
  const [newOfficer, setNewOfficer] = useState({ ...BLANK_OFFICER })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Audit logs state
  const [auditAction, setAuditAction] = useState('All')
  const [auditStatus, setAuditStatus] = useState('All')
  const [auditSearch, setAuditSearch] = useState('')

  // Stations state
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS)
  const [showAddStation, setShowAddStation] = useState(false)
  const [newStation, setNewStation] = useState({ name: '', district: 'Bengaluru Urban' })
  const [editStation, setEditStation] = useState<Station | null>(null)

  // Permissions edit
  const [editingRole, setEditingRole] = useState<string | null>(null)

  // System settings edit
  const [editingSetting, setEditingSetting] = useState<string | null>(null)

  const filteredUsers = users.filter(u =>
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
     u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
     u.station.toLowerCase().includes(userSearch.toLowerCase()))
  )
  const totalUserPages = Math.ceil(filteredUsers.length / PAGE_SIZE)
  const pagedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE)

  const filteredLogs = ALL_AUDIT_LOGS.filter(l => {
    if (auditAction !== 'All' && l.action !== auditAction) return false
    if (auditStatus !== 'All' && l.status !== auditStatus) return false
    if (auditSearch && !l.user.toLowerCase().includes(auditSearch.toLowerCase()) && !l.resource.toLowerCase().includes(auditSearch.toLowerCase())) return false
    return true
  })

  function handleDeleteUser(id: string) {
    if (deleteConfirm === id) {
      setUsers(prev => prev.filter(u => u.id !== id))
      setSelectedUsers(prev => prev.filter(sid => sid !== id))
      setDeleteConfirm(null)
      toast('Officer account deleted', 'success')
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  function handleBulkDelete() {
    setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)))
    toast(`${selectedUsers.length} officer${selectedUsers.length > 1 ? 's' : ''} deleted`, 'success')
    setSelectedUsers([])
  }

  function handleAddOfficer() {
    if (!newOfficer.name || !newOfficer.email || !newOfficer.station) {
      toast('Please fill in all required fields', 'error'); return
    }
    const officer: Officer = {
      ...newOfficer,
      id: `USR${Date.now()}`,
      lastLogin: 'Never',
      cases: 0,
    }
    setUsers(prev => [officer, ...prev])
    setShowAddOfficer(false)
    setNewOfficer({ ...BLANK_OFFICER })
    toast(`Officer ${officer.name} added successfully`, 'success')
  }

  function handleSaveEdit() {
    if (!editingUser) return
    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u))
    setEditingUser(null)
    toast('Officer profile updated', 'success')
  }

  function handleToggleStatus(id: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u))
    const user = users.find(u => u.id === id)
    toast(`${user?.name} marked as ${user?.status === 'Active' ? 'Inactive' : 'Active'}`, 'info')
  }

  function handleExportUsers() {
    const rows = [
      ['ID', 'Name', 'Email', 'Rank', 'Station', 'District', 'Status', 'Cases'],
      ...filteredUsers.map(u => [u.id, u.name, u.email, u.rank, u.station, u.district, u.status, String(u.cases)])
    ]
    downloadCSV(rows, 'officers_export.csv')
  }

  function handleExportLogs() {
    const rows = [
      ['Timestamp', 'User', 'Action', 'Resource', 'IP', 'Status'],
      ...filteredLogs.map(l => [l.time, l.user, l.action, l.resource, l.ip, l.status])
    ]
    downloadCSV(rows, 'audit_logs_export.csv')
  }

  function handleAddStation() {
    if (!newStation.name) { toast('Station name is required', 'error'); return }
    setStations(prev => [...prev, { id: `PS${Date.now()}`, name: newStation.name, district: newStation.district, officers: 0, cases: 0, status: 'Active' }])
    setShowAddStation(false)
    setNewStation({ name: '', district: 'Bengaluru Urban' })
    toast('Police station added', 'success')
  }

  function handleDeleteStation(id: string) {
    setStations(prev => prev.filter(s => s.id !== id))
    toast('Police station removed', 'success')
  }

  function handleSaveStation() {
    if (!editStation) return
    setStations(prev => prev.map(s => s.id === editStation.id ? editStation : s))
    setEditStation(null)
    toast('Station updated', 'success')
  }

  const tabIcons: Record<string, React.ComponentType<{ size: number; style?: React.CSSProperties }>> = {
    Users, 'Police Stations': Building, 'Roles & Permissions': Shield, 'Audit Logs': Activity, 'System Settings': Settings
  }

  const InputStyle = { width: '100%', padding: '9px 12px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 9, fontSize: 13, color: c('#0F172A', '#F1F5F9'), background: c('#F8FAFC', '#0F172A'), outline: 'none', boxSizing: 'border-box' as const }
  const SelectStyle = { ...InputStyle, cursor: 'pointer' }

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c('#0F172A', '#F1F5F9'), letterSpacing: '-0.01em' }}>Admin Panel</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>Manage users, stations, roles, and system settings</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '6px 12px' }}>
            <AlertTriangle size={11} style={{ display: 'inline', marginRight: 4 }} />
            4 pending approvals
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Officers', value: users.length.toLocaleString(), color: '#2563EB', bg: '#DBEAFE' },
          { label: 'Active Stations', value: stations.filter(s => s.status === 'Active').length.toString(), color: '#22C55E', bg: '#DCFCE7' },
          { label: 'Roles Configured', value: String(ROLES.length), color: '#8B5CF6', bg: '#EDE9FE' },
          { label: 'Active Users', value: users.filter(u => u.status === 'Active').length.toString(), color: '#F59E0B', bg: '#FEF3C7' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, background: c('#F8FAFC', '#1E293B'), borderRadius: 12, border: `1px solid ${c('#E2E8F0', '#334155')}`, width: 'fit-content' }}>
        {TABS.map(t => {
          const Icon = tabIcons[t]
          return (
            <button key={t} onClick={() => setTab(t)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: t === tab ? 600 : 400, background: t === tab ? '#2563EB' : 'transparent', color: t === tab ? '#fff' : '#64748B' }}>
              <Icon size={13} style={{ color: t === tab ? '#fff' : undefined }} />
              {t}
            </button>
          )
        })}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'Users' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: c('#E2E8F0', '#334155') }}>
            <div className="relative" style={{ width: 280 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1) }} placeholder="Search officers..."
                style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, fontSize: 13, color: c('#0F172A', '#F1F5F9'), background: c('#F8FAFC', '#0F172A'), outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div className="flex gap-2 ml-auto">
              {selectedUsers.length > 0 && (
                <button onClick={handleBulkDelete}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                  <Trash2 size={12} /> Delete ({selectedUsers.length})
                </button>
              )}
              <button onClick={handleExportUsers}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#EFF6FF', color: '#2563EB', borderRadius: 8, border: '1px solid #BFDBFE', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                <Download size={12} /> Export CSV
              </button>
              <button onClick={() => setShowAddOfficer(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#2563EB', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                <Plus size={12} /> Add Officer
              </button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: c('#F8FAFC', '#0F172A') }}>
                <th style={{ padding: '10px 16px', width: 36 }}>
                  <input type="checkbox" style={{ accentColor: '#2563EB' }} checked={selectedUsers.length === pagedUsers.length && pagedUsers.length > 0} onChange={e => setSelectedUsers(e.target.checked ? pagedUsers.map(u => u.id) : [])} />
                </th>
                {['Officer', 'Rank', 'Station', 'Cases', 'Last Login', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map(user => (
                <tr key={user.id} className="border-b" style={{ borderColor: c('#F1F5F9', '#334155') }}>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="checkbox" style={{ accentColor: '#2563EB' }} checked={selectedUsers.includes(user.id)} onChange={e => setSelectedUsers(e.target.checked ? [...selectedUsers, user.id] : selectedUsers.filter(id => id !== user.id))} />
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-700"
                        style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', fontWeight: 700, flexShrink: 0 }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: c('#0F172A', '#F1F5F9') }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: c('#374151', '#CBD5E1') }}>{user.rank}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: c('#374151', '#CBD5E1') }}>
                    <div>{user.station}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>{user.district}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2563EB', fontWeight: 600 }}>{user.cases}</td>
                  <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748B' }}>{user.lastLogin}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => handleToggleStatus(user.id)}>
                      <span className="badge" style={{ background: user.status === 'Active' ? '#DCFCE7' : '#F1F5F9', color: user.status === 'Active' ? '#15803D' : '#64748B', cursor: 'pointer' }}>
                        {user.status}
                      </span>
                    </button>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingUser({ ...user })} title="Edit officer"
                        style={{ padding: '5px 8px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                        <Edit size={12} />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} title={deleteConfirm === user.id ? 'Click again to confirm' : 'Delete officer'}
                        style={{ padding: '5px 8px', background: deleteConfirm === user.id ? '#EF4444' : '#FEF2F2', color: deleteConfirm === user.id ? '#fff' : '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                        {deleteConfirm === user.id ? <Check size={12} /> : <Trash2 size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedUsers.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No officers found</td></tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${c('#F1F5F9', '#334155')}` }}>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Showing {Math.min((userPage - 1) * PAGE_SIZE + 1, filteredUsers.length)}–{Math.min(userPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}
                style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${c('#E2E8F0', '#334155')}`, background: 'none', color: userPage === 1 ? '#CBD5E1' : '#64748B', cursor: userPage === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                ← Prev
              </button>
              {Array.from({ length: totalUserPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setUserPage(p)}
                  style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${p === userPage ? '#2563EB' : c('#E2E8F0', '#334155')}`, background: p === userPage ? '#2563EB' : 'none', color: p === userPage ? '#fff' : '#64748B', cursor: 'pointer', fontSize: 12, fontWeight: p === userPage ? 600 : 400 }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))} disabled={userPage === totalUserPages}
                style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${c('#E2E8F0', '#334155')}`, background: 'none', color: userPage === totalUserPages ? '#CBD5E1' : '#64748B', cursor: userPage === totalUserPages ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POLICE STATIONS TAB ── */}
      {tab === 'Police Stations' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: c('#E2E8F0', '#334155') }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: c('#0F172A', '#F1F5F9') }}>Police Stations ({stations.length})</h3>
            <button onClick={() => setShowAddStation(true)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#2563EB', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
              <Plus size={12} /> Add Station
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: c('#F8FAFC', '#0F172A') }}>
                {['Station Name', 'District', 'Officers', 'Active Cases', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stations.map(station => (
                <tr key={station.id} className="border-b" style={{ borderColor: c('#F1F5F9', '#334155') }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: c('#0F172A', '#F1F5F9') }}>{station.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B' }}>{station.district}</td>
                  <td style={{ padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2563EB', fontWeight: 600 }}>{station.officers}</td>
                  <td style={{ padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>{station.cases}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge" style={{ background: station.status === 'Active' ? '#DCFCE7' : '#FEF3C7', color: station.status === 'Active' ? '#15803D' : '#A16207' }}>{station.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex gap-2">
                      <button onClick={() => setEditStation({ ...station })}
                        style={{ padding: '5px 10px', background: '#EFF6FF', color: '#2563EB', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteStation(station.id)}
                        style={{ padding: '5px 8px', background: '#FEF2F2', color: '#EF4444', borderRadius: 7, border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ROLES TAB ── */}
      {tab === 'Roles & Permissions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {ROLES.map(role => (
            <div key={role.role} className="rounded-2xl p-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: role.color }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: c('#0F172A', '#F1F5F9') }}>{role.role}</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: role.color, fontWeight: 600 }}>{role.users} users</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {role.permissions.map(perm => (
                  <div key={perm} className="flex items-center gap-2">
                    <Check size={11} style={{ color: role.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: c('#475569', '#94A3B8') }}>{perm}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setEditingRole(editingRole === role.role ? null : role.role); toast(`Editing ${role.role} permissions`, 'info') }}
                style={{ marginTop: 16, width: '100%', padding: '7px 0', background: editingRole === role.role ? role.color : `${role.color}15`, color: editingRole === role.role ? '#fff' : role.color, borderRadius: 8, border: `1px solid ${role.color}30`, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                {editingRole === role.role ? 'Close Editor' : 'Edit Permissions'}
              </button>
              {editingRole === role.role && (
                <div style={{ marginTop: 12, padding: '12px', background: c('#F8FAFC', '#0F172A'), borderRadius: 10, border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                  <p style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>Toggle access permissions:</p>
                  {['View FIRs', 'Edit FIRs', 'Delete FIRs', 'User Management', 'Export Data', 'System Settings'].map(perm => (
                    <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={role.permissions.some(p => p.toLowerCase().includes(perm.split(' ')[0].toLowerCase()))} style={{ accentColor: role.color }} />
                      <span style={{ fontSize: 12, color: c('#374151', '#CBD5E1') }}>{perm}</span>
                    </label>
                  ))}
                  <button onClick={() => { setEditingRole(null); toast(`${role.role} permissions saved`, 'success') }}
                    style={{ width: '100%', marginTop: 8, padding: '6px 0', background: role.color, color: '#fff', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                    Save Permissions
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── AUDIT LOGS TAB ── */}
      {tab === 'Audit Logs' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b flex-wrap" style={{ borderColor: c('#E2E8F0', '#334155') }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: c('#0F172A', '#F1F5F9') }}>Audit Logs ({filteredLogs.length})</h3>
            <div className="relative" style={{ width: 220 }}>
              <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="Search user or resource..."
                style={{ width: '100%', paddingLeft: 28, paddingRight: 8, paddingTop: 6, paddingBottom: 6, border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, fontSize: 12, color: c('#0F172A', '#F1F5F9'), background: c('#F8FAFC', '#0F172A'), outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <select value={auditAction} onChange={e => setAuditAction(e.target.value)}
              style={{ padding: '6px 10px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, fontSize: 12, color: '#64748B', background: c('#fff', '#1E293B'), outline: 'none', cursor: 'pointer' }}>
              {AUDIT_ACTIONS.map(a => <option key={a}>{a}</option>)}
            </select>
            <select value={auditStatus} onChange={e => setAuditStatus(e.target.value)}
              style={{ padding: '6px 10px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 8, fontSize: 12, color: '#64748B', background: c('#fff', '#1E293B'), outline: 'none', cursor: 'pointer' }}>
              {AUDIT_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={handleExportLogs} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: c('#F8FAFC', '#0F172A'), color: '#64748B', borderRadius: 8, border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer', fontSize: 12 }}>
              <Download size={12} /> Export CSV
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: c('#F8FAFC', '#0F172A') }}>
                {['Timestamp', 'User', 'Action', 'Resource', 'IP Address', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
                <tr key={i} className="border-b" style={{ borderColor: c('#F1F5F9', '#334155'), background: log.status === 'Failed' ? (darkMode ? 'rgba(239,68,68,0.05)' : '#FFF5F5') : 'transparent' }}>
                  <td style={{ padding: '11px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748B' }}>{log.time}</td>
                  <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 500, color: c('#374151', '#CBD5E1') }}>{log.user}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: log.action === 'LOGIN' ? '#2563EB' : log.action === 'UPDATED' ? '#D97706' : log.action === 'EXPORT' ? '#8B5CF6' : log.action.includes('ARREST') ? '#EF4444' : '#64748B' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: '#2563EB', fontFamily: "'JetBrains Mono', monospace" }}>{log.resource}</td>
                  <td style={{ padding: '11px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748B' }}>{log.ip}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span className="badge" style={{ background: log.status === 'Success' ? '#DCFCE7' : '#FEE2E2', color: log.status === 'Success' ? '#15803D' : '#B91C1C' }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No matching audit logs</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SYSTEM SETTINGS TAB ── */}
      {tab === 'System Settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {([
            { title: 'Database Configuration', desc: 'FIR database connections and backup settings', key: 'db', items: ['PostgreSQL · Connected · v15.4', 'Auto Backup: Daily 02:00 hrs', 'Retention Policy: 10 years', 'Last Backup: 2024-07-22 02:00'] },
            { title: 'Email Server (SMTP)', desc: 'Configure outgoing email for notifications', key: 'smtp', items: ['Host: smtp.ksp.gov.in:587', 'TLS Encryption: Enabled', 'From: noreply@ksp.gov.in', 'Delivery Rate: 99.2%'] },
            { title: 'AI Services', desc: 'AI investigation assistant configuration', key: 'ai', items: ['Model: Karnataka Police AI v2.1', 'OCR Engine: Tesseract 5.0 (Advanced)', 'NLP: Enabled · Kannada + English', 'Requests Today: 1,247'] },
            { title: 'Security Policies', desc: 'Password, session, and access policies', key: 'security', items: ['Password Expiry: 90 days', 'Session Timeout: 8 hours', 'Max Login Attempts: 5', 'IP Allowlist: Enabled'] },
          ] as const).map(setting => (
            <div key={setting.title} className="rounded-2xl p-5" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 14, color: c('#0F172A', '#F1F5F9'), marginBottom: 3 }}>{setting.title}</h4>
                  <p style={{ fontSize: 12, color: '#64748B' }}>{setting.desc}</p>
                </div>
                <button onClick={() => { setEditingSetting(editingSetting === setting.key ? null : setting.key); toast(`Editing ${setting.title}`, 'info') }}
                  style={{ padding: '5px 10px', background: editingSetting === setting.key ? '#2563EB' : '#EFF6FF', color: editingSetting === setting.key ? '#fff' : '#2563EB', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                  {editingSetting === setting.key ? 'Close' : 'Edit'}
                </button>
              </div>
              {editingSetting === setting.key ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {setting.items.map((item, i) => {
                    const [label, ...rest] = item.split(': ')
                    return (
                      <div key={i}>
                        <label style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 3 }}>{label}</label>
                        <input defaultValue={rest.join(': ')}
                          style={{ width: '100%', padding: '6px 10px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 7, fontSize: 12, color: c('#0F172A', '#F1F5F9'), background: c('#F8FAFC', '#0F172A'), outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'JetBrains Mono', monospace" }} />
                      </div>
                    )
                  })}
                  <button onClick={() => { setEditingSetting(null); toast(`${setting.title} saved`, 'success') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#2563EB', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, marginTop: 4 }}>
                    <Save size={12} /> Save Settings
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {setting.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c('#475569', '#94A3B8') }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Add Officer Modal */}
      <Modal open={showAddOfficer} onClose={() => setShowAddOfficer(false)} title="Add New Officer" darkMode={darkMode}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          {([{ label: 'Full Name *', key: 'name' }, { label: 'Email Address *', key: 'email' }, { label: 'Mobile Number', key: 'phone' }, { label: 'Police Station *', key: 'station' }] as { label: string; key: keyof typeof newOfficer }[]).map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5 }}>{f.label}</label>
              <input value={(newOfficer as Record<string, string>)[f.key] ?? ''} onChange={e => setNewOfficer(p => ({ ...p, [f.key]: e.target.value }))} style={InputStyle} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5 }}>Rank</label>
            <select value={newOfficer.rank} onChange={e => setNewOfficer(p => ({ ...p, rank: e.target.value }))} style={SelectStyle}>
              {RANKS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5 }}>District</label>
            <select value={newOfficer.district} onChange={e => setNewOfficer(p => ({ ...p, district: e.target.value }))} style={SelectStyle}>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5 }}>Status</label>
            <select value={newOfficer.status} onChange={e => setNewOfficer(p => ({ ...p, status: e.target.value as 'Active' | 'Inactive' }))} style={SelectStyle}>
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={() => setShowAddOfficer(false)} style={{ padding: '9px 18px', background: 'none', color: '#64748B', borderRadius: 10, border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={handleAddOfficer} style={{ padding: '9px 18px', background: '#2563EB', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Add Officer</button>
        </div>
      </Modal>

      {/* Edit Officer Modal */}
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Edit Officer" darkMode={darkMode}>
        {editingUser && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              {(['name', 'email', 'station'] as (keyof Officer)[]).map(key => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5, textTransform: 'capitalize' }}>{key}</label>
                  <input value={String(editingUser[key])} onChange={e => setEditingUser(p => p ? { ...p, [key]: e.target.value } : p)} style={InputStyle} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5 }}>Rank</label>
                <select value={editingUser.rank} onChange={e => setEditingUser(p => p ? { ...p, rank: e.target.value } : p)} style={SelectStyle}>
                  {RANKS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5 }}>Status</label>
                <select value={editingUser.status} onChange={e => setEditingUser(p => p ? { ...p, status: e.target.value as 'Active' | 'Inactive' } : p)} style={SelectStyle}>
                  <option>Active</option><option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => setEditingUser(null)} style={{ padding: '9px 18px', background: 'none', color: '#64748B', borderRadius: 10, border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ padding: '9px 18px', background: '#2563EB', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Save Changes</button>
            </div>
          </>
        )}
      </Modal>

      {/* Add Station Modal */}
      <Modal open={showAddStation} onClose={() => setShowAddStation(false)} title="Add Police Station" darkMode={darkMode}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5 }}>Station Name *</label>
          <input value={newStation.name} onChange={e => setNewStation(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Rajajinagar PS" style={InputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5 }}>District</label>
          <select value={newStation.district} onChange={e => setNewStation(p => ({ ...p, district: e.target.value }))} style={SelectStyle}>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowAddStation(false)} style={{ padding: '9px 18px', background: 'none', color: '#64748B', borderRadius: 10, border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={handleAddStation} style={{ padding: '9px 18px', background: '#2563EB', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Add Station</button>
        </div>
      </Modal>

      {/* Edit Station Modal */}
      <Modal open={!!editStation} onClose={() => setEditStation(null)} title="Edit Station" darkMode={darkMode}>
        {editStation && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5 }}>Station Name</label>
              <input value={editStation.name} onChange={e => setEditStation(p => p ? { ...p, name: e.target.value } : p)} style={InputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5 }}>District</label>
              <select value={editStation.district} onChange={e => setEditStation(p => p ? { ...p, district: e.target.value } : p)} style={SelectStyle}>
                {DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 5 }}>Status</label>
              <select value={editStation.status} onChange={e => setEditStation(p => p ? { ...p, status: e.target.value as 'Active' | 'Maintenance' } : p)} style={SelectStyle}>
                <option>Active</option><option>Maintenance</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditStation(null)} style={{ padding: '9px 18px', background: 'none', color: '#64748B', borderRadius: 10, border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={handleSaveStation} style={{ padding: '9px 18px', background: '#2563EB', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Save</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
