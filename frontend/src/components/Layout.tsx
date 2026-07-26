import { useState } from 'react'
import {
  LayoutDashboard, Search, FileText, MessageSquare, BarChart3,
  Mic, Settings, Shield, Bell, ChevronDown, Menu, X,
  LogOut, User, Moon, Sun, ChevronRight, Zap, Database, Languages
} from 'lucide-react'
import type { Lang } from '../utils/translations'

export type Page =
  | 'landing' | 'login' | 'signup' | 'forgot' | 'verify' | 'profile-setup'
  | 'dashboard' | 'search' | 'case-details' | 'ai-assistant'
  | 'analytics' | 'voice-assistant' | 'settings' | 'admin' | 'notifications'

interface LayoutProps {
  currentPage: Page
  onNavigate: (page: Page, data?: unknown) => void
  children: React.ReactNode
  darkMode: boolean
  onToggleDark: () => void
  lang: Lang
  onToggleLang: () => void
}

function getNavItems(lang: Lang) {
  return [
    { id: 'ai-assistant', label: lang === 'en' ? 'AI Assistant' : 'AI ಸಹಾಯಕ', icon: MessageSquare, badge: 'AI' },
    { id: 'search', label: lang === 'en' ? 'FIR Search' : 'ಎಫ್‌ಐಆರ್ ಹುಡುಕಾಟ', icon: Search, badge: null },
    { id: 'dashboard', label: lang === 'en' ? 'Dashboard' : 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', icon: LayoutDashboard, badge: null },
    { id: 'analytics', label: lang === 'en' ? 'Analytics' : 'ವಿಶ್ಲೇಷಣೆ', icon: BarChart3, badge: null },
    { id: 'voice-assistant', label: lang === 'en' ? 'Voice Assistant' : 'ಧ್ವನಿ ಸಹಾಯಕ', icon: Mic, badge: null },
    { id: 'admin', label: lang === 'en' ? 'Admin Panel' : 'ನಿರ್ವಾಹಕ ಫಲಕ', icon: Database, badge: null },
    { id: 'settings', label: lang === 'en' ? 'Settings' : 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', icon: Settings, badge: null },
  ]
}

export default function Layout({ currentPage, onNavigate, children, darkMode, onToggleDark, lang, onToggleLang }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const NAV_ITEMS = getNavItems(lang)

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New FIR Assigned', desc: 'CR-No.198/2024 assigned to you', time: '5 min ago', read: false, type: 'case' },
    { id: 2, title: 'Arrest Recorded', desc: 'A1 arrested in CR-No.142/2024', time: '1 hr ago', read: false, type: 'arrest' },
    { id: 3, title: 'Chargesheet Deadline', desc: 'CR-No.089/2024 due in 3 days', time: '2 hrs ago', read: true, type: 'alert' },
    { id: 4, title: 'Court Date Reminder', desc: 'CC No. 234/2024 hearing tomorrow', time: '1 day ago', read: true, type: 'court' },
  ])
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}
      style={{ background: darkMode ? '#0B1120' : '#F8FAFC' }}>

      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col transition-all duration-300 z-30"
        style={{
          width: sidebarOpen ? 240 : 64,
          background: darkMode ? '#0D1526' : '#FFFFFF',
          borderRight: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
        }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: darkMode ? '#1E293B' : '#E2E8F0', minHeight: 64 }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>
            <Shield size={16} color="#fff" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-xs font-700 leading-tight"
                style={{ color: darkMode ? '#F1F5F9' : '#0F172A', fontWeight: 700, fontSize: 12, letterSpacing: '-0.01em' }}>
                {lang === 'en' ? 'Karnataka Police' : 'ಕರ್ನಾಟಕ ಪೊಲೀಸ್'}
              </div>
              <div className="text-xs font-500 leading-tight"
                style={{ color: '#2563EB', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Intellectus' : 'ಇಂಟೆಲೆಕ್ಟಸ್'}
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as Page)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150"
                style={{
                  width: 'calc(100% - 16px)',
                  marginInline: 8,
                  marginBlock: 1,
                  borderRadius: 8,
                  background: isActive
                    ? darkMode ? 'rgba(37,99,235,0.15)' : '#EFF6FF'
                    : 'transparent',
                  color: isActive
                    ? '#2563EB'
                    : darkMode ? '#94A3B8' : '#64748B',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 13.5,
                }}
                title={!sidebarOpen ? item.label : undefined}>
                <Icon size={17} style={{ flexShrink: 0, color: isActive ? '#2563EB' : 'inherit' }} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: 10, fontWeight: 600 }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* Quick action */}
        {sidebarOpen && (
          <div className="mx-3 mb-3 p-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={13} color="#93C5FD" />
              <span style={{ color: '#93C5FD', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Quick Action' : 'ತ್ವರಿತ ಕ್ರಿಯೆ'}
              </span>
            </div>
            <p style={{ color: '#BFDBFE', fontSize: 11, marginBottom: 8 }}>
              {lang === 'en' ? 'Register a new FIR instantly' : 'ತಕ್ಷಣ ಹೊಸ ಎಫ್‌ಐಆರ್ ನೋಂದಾಯಿಸಿ'}
            </p>
            <button
              className="w-full py-1.5 rounded-lg text-xs"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 12 }}
              onClick={() => onNavigate('search')}>
              {lang === 'en' ? '+ Register FIR' : '+ ಎಫ್‌ಐಆರ್ ನೋಂದಾಯಿಸಿ'}
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <div className="border-t px-3 py-3" style={{ borderColor: darkMode ? '#1E293B' : '#E2E8F0' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center py-2 rounded-lg"
            style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>
            {sidebarOpen ? <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-6"
          style={{
            height: 64,
            background: darkMode ? '#0D1526' : '#FFFFFF',
            borderBottom: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
            <Shield size={14} style={{ color: '#2563EB' }} />
            <ChevronRight size={12} />
            <span style={{ color: darkMode ? '#F1F5F9' : '#0F172A', fontWeight: 500 }}>
              {NAV_ITEMS.find(n => n.id === currentPage)?.label ?? 'Portal'}
            </span>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search FIR, Case, Accused...' : 'ಎಫ್‌ಐಆರ್, ಪ್ರಕರಣ, ಆರೋಪಿ ಹುಡುಕಿ...'}
                onClick={() => onNavigate('search')}
                readOnly
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg cursor-pointer"
                style={{
                  background: darkMode ? '#1E293B' : '#F8FAFC',
                  border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
                  color: darkMode ? '#94A3B8' : '#94A3B8',
                  fontSize: 13,
                }} />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">

            {/* Language toggle */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: darkMode ? '#1E293B' : '#F8FAFC',
                border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
                color: '#2563EB',
                fontWeight: 600,
                fontSize: 12,
              }}
              title="Toggle language / ಭಾಷೆ ಬದಲಿಸಿ">
              <Languages size={13} />
              {lang === 'en' ? 'ಕನ್ನಡ' : 'English'}
            </button>

            {/* Dark mode */}
            <button
              onClick={onToggleDark}
              className="p-2 rounded-lg"
              style={{ color: darkMode ? '#94A3B8' : '#64748B', background: darkMode ? '#1E293B' : '#F8FAFC' }}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
                className="p-2 rounded-lg relative"
                style={{ color: darkMode ? '#94A3B8' : '#64748B', background: darkMode ? '#1E293B' : '#F8FAFC' }}>
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-center"
                    style={{ background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 700, lineHeight: '16px' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl z-50 overflow-hidden"
                  style={{ background: darkMode ? '#1E293B' : '#fff', border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: darkMode ? '#334155' : '#E2E8F0' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: darkMode ? '#F1F5F9' : '#0F172A' }}>
                      {lang === 'en' ? 'Notifications' : 'ಅಧಿಸೂಚನೆಗಳು'}
                    </span>
                    <span className="badge" style={{ background: '#EFF6FF', color: '#2563EB' }}>{unreadCount} new</span>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} className="flex gap-3 px-4 py-3 border-b"
                      style={{
                        borderColor: darkMode ? '#334155' : '#F1F5F9',
                        background: !n.read ? (darkMode ? 'rgba(37,99,235,0.08)' : '#F0F7FF') : 'transparent'
                      }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.read ? '#CBD5E1' : '#2563EB' }} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: darkMode ? '#F1F5F9' : '#0F172A' }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{n.desc}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-2.5 text-center text-sm" style={{ color: '#2563EB', fontWeight: 500 }}
                    onClick={() => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); setNotifOpen(false) }}>
                    {lang === 'en' ? 'Mark all as read' : 'ಎಲ್ಲಾ ಓದಿದ್ದು ಎಂದು ಗುರುತಿಸಿ'}
                  </button>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg"
                style={{ background: darkMode ? '#1E293B' : '#F8FAFC', border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', fontWeight: 700 }}>
                  RK
                </div>
                <div className="text-left">
                  <div style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#F1F5F9' : '#0F172A', lineHeight: 1.2 }}>Rajesh Kumar</div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>Inspector</div>
                </div>
                <ChevronDown size={12} style={{ color: '#94A3B8' }} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl z-50 overflow-hidden"
                  style={{ background: darkMode ? '#1E293B' : '#fff', border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: darkMode ? '#334155' : '#E2E8F0' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: darkMode ? '#F1F5F9' : '#0F172A' }}>Rajesh Kumar S</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Inspector · KAR/INS/2456</div>
                  </div>
                  {[
                    { icon: User, label: lang === 'en' ? 'My Profile' : 'ನನ್ನ ಪ್ರೊಫೈಲ್', action: 'settings' },
                    { icon: Settings, label: lang === 'en' ? 'Settings' : 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', action: 'settings' },
                  ].map(({ icon: Icon, label, action }) => (
                    <button key={label} onClick={() => { onNavigate(action as Page); setProfileOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5"
                      style={{ fontSize: 13, color: darkMode ? '#CBD5E1' : '#475569' }}>
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                  <div className="border-t" style={{ borderColor: darkMode ? '#334155' : '#E2E8F0' }}>
                    <button onClick={() => { onNavigate('landing'); setProfileOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5"
                      style={{ fontSize: 13, color: '#EF4444' }}>
                      <LogOut size={14} />
                      {lang === 'en' ? 'Exit Portal' : 'ಪೋರ್ಟಲ್ ನಿರ್ಗಮಿಸಿ'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: darkMode ? '#0B1120' : '#F8FAFC' }}>
          {children}
        </main>
      </div>

      {/* Backdrop for dropdowns */}
      {(notifOpen || profileOpen) && (
        <div className="fixed inset-0 z-20" onClick={() => { setNotifOpen(false); setProfileOpen(false) }} />
      )}
    </div>
  )
}
