import { useState, useRef } from 'react'
import { User, Lock, Bell, Palette, Eye, EyeOff, Check, Monitor, AlertCircle } from 'lucide-react'
import { toast } from '../utils/toast'

interface SettingsProps { darkMode: boolean; onToggleDark: () => void }

const TABS = ['Profile', 'Security', 'Notifications', 'Appearance', 'Accessibility']

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      style={{ width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', background: checked ? '#2563EB' : '#CBD5E1', position: 'relative', transition: 'background 0.2s', padding: 0, flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #F1F5F9', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}

export default function Settings({ darkMode, onToggleDark }: SettingsProps) {
  const [tab, setTab] = useState('Profile')
  const photoRef = useRef<HTMLInputElement>(null)
  const [photoSrc, setPhotoSrc] = useState<string | null>(null)

  // Profile
  const [profile, setProfile] = useState({ name: 'Rajesh Kumar S', email: 'rajesh.kumar@ksp.gov.in', phone: '+91 98765 43210', badge: 'KAR/INS/2456', rank: 'Inspector', station: 'Koramangala PS', district: 'Bengaluru Urban' })
  const [originalProfile] = useState({ ...profile })
  const [profileSaved, setProfileSaved] = useState(false)

  // Security
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false })
  const [passError, setPassError] = useState('')
  const [passSaved, setPassSaved] = useState(false)
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome on Windows 11', location: 'Bengaluru, Karnataka', time: 'Active now', current: true },
    { id: 2, device: 'Safari on iPhone 15', location: 'Bengaluru, Karnataka', time: '2 hours ago', current: false },
    { id: 3, device: 'Firefox on Ubuntu', location: 'Mysuru, Karnataka', time: '1 day ago', current: false },
  ])
  const [secToggles, setSecToggles] = useState({ smsOtp: true, authenticator: false, biometric: false })

  // Notifications
  const [notifs, setNotifs] = useState({ email: true, sms: true, push: false, caseAssign: true, arrest: true, chargesheet: true, court: false, evidence: true })

  // Appearance
  const [compact, setCompact] = useState(false)
  const [fontSize, setFontSize] = useState<'Small' | 'Medium' | 'Large'>('Medium')
  const [colorTheme, setColorTheme] = useState<'Blue' | 'Navy' | 'Slate'>('Blue')

  // Accessibility
  const [a11y, setA11y] = useState({ highContrast: false, reduceMotion: false, screenReader: true, keyboard: true, focusIndicators: true })

  const c = (l: string, d: string) => darkMode ? d : l

  function handleSaveProfile() {
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
    toast('Profile updated successfully', 'success')
  }

  function handleCancelProfile() {
    setProfile({ ...originalProfile })
    toast('Changes discarded', 'info')
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhotoSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
    toast('Profile photo updated', 'success')
  }

  function handlePasswordChange() {
    setPassError('')
    if (!passwords.current) { setPassError('Please enter your current password'); return }
    if (passwords.newPass.length < 8) { setPassError('New password must be at least 8 characters'); return }
    if (passwords.newPass !== passwords.confirm) { setPassError('Passwords do not match'); return }
    setPassSaved(true)
    setPasswords({ current: '', newPass: '', confirm: '' })
    setTimeout(() => setPassSaved(false), 3000)
    toast('Password changed successfully', 'success')
  }

  function revokeSession(id: number) {
    setSessions(prev => prev.filter(s => s.id !== id))
    toast('Session revoked successfully', 'success')
  }

  function revokeAllSessions() {
    setSessions(prev => prev.filter(s => s.current))
    toast('All other sessions signed out', 'success')
  }

  function handleFontSize(size: 'Small' | 'Medium' | 'Large') {
    setFontSize(size)
    const map = { Small: '13px', Medium: '15px', Large: '17px' }
    document.documentElement.style.setProperty('--base-font-size', map[size])
    toast(`Font size set to ${size}`, 'info')
  }

  function handleTheme(theme: 'Blue' | 'Navy' | 'Slate') {
    setColorTheme(theme)
    const colors = { Blue: '#2563EB', Navy: '#1E3A8A', Slate: '#475569' }
    document.documentElement.style.setProperty('--color-primary', colors[theme])
    toast(`Color theme changed to ${theme}`, 'success')
  }

  function handleCompact(v: boolean) {
    setCompact(v)
    document.documentElement.style.setProperty('--spacing-compact', v ? '0.7' : '1')
    toast(`Compact mode ${v ? 'enabled' : 'disabled'}`, 'info')
  }

  function handleReduceMotion(v: boolean) {
    setA11y(prev => ({ ...prev, reduceMotion: v }))
    document.documentElement.style.setProperty('--transition-duration', v ? '0ms' : '150ms')
    toast(`Reduce motion ${v ? 'enabled' : 'disabled'}`, 'info')
  }

  const tabIcons: Record<string, React.ComponentType<{ size: number; style?: React.CSSProperties }>> = {
    Profile: User, Security: Lock, Notifications: Bell, Appearance: Palette, Accessibility: Eye
  }

  const THEME_COLORS = { Blue: '#2563EB', Navy: '#1E3A8A', Slate: '#475569' }

  function PasswordField({ label, field, value, show, onToggle }: { label: string; field: keyof typeof passwords; value: string; show: boolean; onToggle: () => void }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 6 }}>{label}</label>
        <div style={{ position: 'relative' }}>
          <input type={show ? 'text' : 'password'} value={value}
            onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
            placeholder="••••••••••"
            style={{ width: '100%', padding: '9px 36px 9px 12px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 9, fontSize: 13, color: c('#0F172A', '#F1F5F9'), background: c('#F8FAFC', '#0F172A'), outline: 'none', boxSizing: 'border-box' }} />
          <button type="button" onClick={onToggle}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Inter', sans-serif" }}>
      <div className="mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: c('#0F172A', '#F1F5F9'), letterSpacing: '-0.01em' }}>Settings</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>Manage your account, security, and notification preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>

        {/* Sidebar */}
        <div className="rounded-2xl p-3" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}`, height: 'fit-content' }}>
          {TABS.map(t => {
            const Icon = tabIcons[t]
            return (
              <button key={t} onClick={() => setTab(t)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-left"
                style={{ background: tab === t ? '#EFF6FF' : 'none', color: tab === t ? '#2563EB' : c('#64748B', '#94A3B8'), fontWeight: tab === t ? 600 : 400, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                <Icon size={15} style={{ color: tab === t ? '#2563EB' : undefined }} />
                {t}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="rounded-2xl p-6" style={{ background: c('#fff', '#1E293B'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>

          {tab === 'Profile' && (
            <div>
              <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl" style={{ background: c('#F8FAFC', '#0F172A'), border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-white text-xl font-700"
                  style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', fontWeight: 700, flexShrink: 0 }}>
                  {photoSrc ? <img src={photoSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'RK'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: c('#0F172A', '#F1F5F9') }}>{profile.name}</div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>{profile.rank} · {profile.badge}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>{profile.station} · {profile.district}</div>
                </div>
                <button onClick={() => photoRef.current?.click()}
                  style={{ marginLeft: 'auto', padding: '7px 14px', background: '#EFF6FF', color: '#2563EB', borderRadius: 8, border: '1px solid #BFDBFE', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                  Change Photo
                </button>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                {([
                  { label: 'Full Name', key: 'name' },
                  { label: 'Email Address', key: 'email' },
                  { label: 'Mobile Number', key: 'phone' },
                  { label: 'Badge ID', key: 'badge' },
                  { label: 'Rank', key: 'rank' },
                  { label: 'Police Station', key: 'station' },
                  { label: 'District', key: 'district' },
                ] as { label: string; key: keyof typeof profile }[]).map(field => (
                  <div key={field.key} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 6 }}>{field.label}</label>
                    <input value={profile[field.key]} onChange={e => setProfile({ ...profile, [field.key]: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c('#E2E8F0', '#334155')}`, borderRadius: 9, fontSize: 13, color: c('#0F172A', '#F1F5F9'), background: c('#F8FAFC', '#0F172A'), outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={handleSaveProfile}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: profileSaved ? '#22C55E' : '#2563EB', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  {profileSaved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
                </button>
                <button onClick={handleCancelProfile}
                  style={{ padding: '9px 20px', background: 'none', color: '#64748B', borderRadius: 10, border: `1px solid ${c('#E2E8F0', '#334155')}`, cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {tab === 'Security' && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9'), marginBottom: 20 }}>Security Settings</h3>

              <div className="rounded-xl p-5 mb-5" style={{ border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <h4 style={{ fontWeight: 600, fontSize: 13, color: c('#0F172A', '#F1F5F9'), marginBottom: 16 }}>Change Password</h4>
                <PasswordField label="Current Password" field="current" value={passwords.current} show={showPass.current} onToggle={() => setShowPass(p => ({ ...p, current: !p.current }))} />
                <PasswordField label="New Password" field="newPass" value={passwords.newPass} show={showPass.new} onToggle={() => setShowPass(p => ({ ...p, new: !p.new }))} />
                <PasswordField label="Confirm New Password" field="confirm" value={passwords.confirm} show={showPass.confirm} onToggle={() => setShowPass(p => ({ ...p, confirm: !p.confirm }))} />
                {passError && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <AlertCircle size={13} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#B91C1C' }}>{passError}</span>
                  </div>
                )}
                <button onClick={handlePasswordChange}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: passSaved ? '#22C55E' : '#2563EB', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  {passSaved ? <><Check size={14} /> Password Updated!</> : 'Update Password'}
                </button>
              </div>

              <div className="rounded-xl p-5 mb-5" style={{ border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <h4 style={{ fontWeight: 600, fontSize: 13, color: c('#0F172A', '#F1F5F9'), marginBottom: 16 }}>Two-Factor Authentication</h4>
                <SettingRow label="SMS OTP" desc="Receive OTP via registered mobile number">
                  <Toggle checked={secToggles.smsOtp} onChange={v => { setSecToggles(p => ({ ...p, smsOtp: v })); toast(`SMS OTP ${v ? 'enabled' : 'disabled'}`, v ? 'success' : 'info') }} />
                </SettingRow>
                <SettingRow label="Authenticator App" desc="Use TOTP authenticator for login">
                  <Toggle checked={secToggles.authenticator} onChange={v => { setSecToggles(p => ({ ...p, authenticator: v })); toast(`Authenticator app ${v ? 'enabled' : 'disabled'}`, v ? 'success' : 'info') }} />
                </SettingRow>
                <SettingRow label="Biometric Login" desc="Use fingerprint or face recognition">
                  <Toggle checked={secToggles.biometric} onChange={v => { setSecToggles(p => ({ ...p, biometric: v })); toast(`Biometric login ${v ? 'enabled' : 'disabled'}`, v ? 'success' : 'info') }} />
                </SettingRow>
              </div>

              <div className="rounded-xl p-5" style={{ border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <h4 style={{ fontWeight: 600, fontSize: 13, color: c('#0F172A', '#F1F5F9'), marginBottom: 12 }}>Active Sessions</h4>
                {sessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 py-3 border-b" style={{ borderColor: c('#F1F5F9', '#334155') }}>
                    <Monitor size={16} style={{ color: '#64748B', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: c('#0F172A', '#F1F5F9') }}>{s.device}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.location} · {s.time}</div>
                    </div>
                    {s.current ? (
                      <span className="badge" style={{ background: '#DCFCE7', color: '#15803D' }}>Current</span>
                    ) : (
                      <button onClick={() => revokeSession(s.id)}
                        style={{ fontSize: 11, color: '#EF4444', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}>
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
                {sessions.length > 1 && (
                  <button onClick={revokeAllSessions}
                    style={{ marginTop: 10, fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Sign out of all other sessions
                  </button>
                )}
                {sessions.length <= 1 && (
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>No other active sessions.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'Notifications' && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9'), marginBottom: 20 }}>Notification Preferences</h3>
              <div className="rounded-xl p-5 mb-5" style={{ border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <h4 style={{ fontWeight: 600, fontSize: 13, color: c('#0F172A', '#F1F5F9'), marginBottom: 12 }}>Channels</h4>
                <SettingRow label="Email Notifications" desc="Receive updates via email">
                  <Toggle checked={notifs.email} onChange={v => { setNotifs(p => ({ ...p, email: v })); toast(`Email notifications ${v ? 'on' : 'off'}`, 'info') }} />
                </SettingRow>
                <SettingRow label="SMS / Mobile Alerts" desc="Critical alerts on registered mobile">
                  <Toggle checked={notifs.sms} onChange={v => { setNotifs(p => ({ ...p, sms: v })); toast(`SMS alerts ${v ? 'on' : 'off'}`, 'info') }} />
                </SettingRow>
                <SettingRow label="Push Notifications" desc="Browser push notifications">
                  <Toggle checked={notifs.push} onChange={v => { setNotifs(p => ({ ...p, push: v })); toast(`Push notifications ${v ? 'on' : 'off'}`, 'info') }} />
                </SettingRow>
              </div>
              <div className="rounded-xl p-5" style={{ border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <h4 style={{ fontWeight: 600, fontSize: 13, color: c('#0F172A', '#F1F5F9'), marginBottom: 12 }}>Alert Types</h4>
                {([
                  { key: 'caseAssign', label: 'Case Assignments', desc: 'When a new FIR is assigned to you' },
                  { key: 'arrest', label: 'Arrest Notifications', desc: 'When arrest is made in your cases' },
                  { key: 'chargesheet', label: 'Chargesheet Deadlines', desc: 'Upcoming chargesheet filing deadlines' },
                  { key: 'court', label: 'Court Date Reminders', desc: 'Upcoming court hearings and dates' },
                  { key: 'evidence', label: 'Evidence Updates', desc: 'New evidence uploaded to your cases' },
                ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(item => (
                  <SettingRow key={item.key} label={item.label} desc={item.desc}>
                    <Toggle checked={notifs[item.key]} onChange={v => { setNotifs(p => ({ ...p, [item.key]: v })); toast(`${item.label} ${v ? 'enabled' : 'disabled'}`, 'info') }} />
                  </SettingRow>
                ))}
              </div>
            </div>
          )}

          {tab === 'Appearance' && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9'), marginBottom: 20 }}>Appearance</h3>
              <div className="rounded-xl p-5 mb-5" style={{ border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <SettingRow label="Dark Mode" desc="Switch between light and dark interface">
                  <Toggle checked={darkMode} onChange={v => { onToggleDark(); toast(`${v ? 'Dark' : 'Light'} mode enabled`, 'info') }} />
                </SettingRow>
                <SettingRow label="Compact Mode" desc="Reduce padding and spacing for more content">
                  <Toggle checked={compact} onChange={handleCompact} />
                </SettingRow>
              </div>

              <div className="rounded-xl p-5 mb-5" style={{ border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <h4 style={{ fontWeight: 600, fontSize: 13, color: c('#0F172A', '#F1F5F9'), marginBottom: 12 }}>Color Theme</h4>
                <div className="flex gap-4">
                  {(Object.entries(THEME_COLORS) as [keyof typeof THEME_COLORS, string][]).map(([name, color]) => (
                    <button key={name} onClick={() => handleTheme(name)} style={{ textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: color, border: colorTheme === name ? '3px solid #0F172A' : '2px solid transparent', marginBottom: 6, boxShadow: colorTheme === name ? '0 0 0 2px #fff, 0 0 0 4px ' + color : 'none' }} />
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: colorTheme === name ? 600 : 400 }}>{name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <h4 style={{ fontWeight: 600, fontSize: 13, color: c('#0F172A', '#F1F5F9'), marginBottom: 12 }}>Font Size</h4>
                <div className="flex gap-2">
                  {(['Small', 'Medium', 'Large'] as const).map(size => (
                    <button key={size} onClick={() => handleFontSize(size)}
                      style={{ padding: '7px 20px', borderRadius: 8, border: `1px solid ${fontSize === size ? '#2563EB' : c('#E2E8F0', '#334155')}`, background: fontSize === size ? '#EFF6FF' : 'none', color: fontSize === size ? '#2563EB' : '#64748B', cursor: 'pointer', fontSize: size === 'Small' ? 12 : size === 'Large' ? 15 : 13, fontWeight: fontSize === size ? 600 : 400 }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'Accessibility' && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c('#0F172A', '#F1F5F9'), marginBottom: 20 }}>Accessibility</h3>
              <div className="rounded-xl p-5" style={{ border: `1px solid ${c('#E2E8F0', '#334155')}` }}>
                <SettingRow label="High Contrast Mode" desc="Increase contrast for better readability">
                  <Toggle checked={a11y.highContrast} onChange={v => { setA11y(p => ({ ...p, highContrast: v })); document.documentElement.classList.toggle('high-contrast', v); toast(`High contrast ${v ? 'on' : 'off'}`, 'info') }} />
                </SettingRow>
                <SettingRow label="Reduce Motion" desc="Minimize animations and transitions">
                  <Toggle checked={a11y.reduceMotion} onChange={handleReduceMotion} />
                </SettingRow>
                <SettingRow label="Screen Reader Support" desc="Optimize for NVDA/JAWS screen readers">
                  <Toggle checked={a11y.screenReader} onChange={v => { setA11y(p => ({ ...p, screenReader: v })); toast(`Screen reader support ${v ? 'enabled' : 'disabled'}`, 'info') }} />
                </SettingRow>
                <SettingRow label="Keyboard Navigation" desc="Enable full keyboard navigation">
                  <Toggle checked={a11y.keyboard} onChange={v => { setA11y(p => ({ ...p, keyboard: v })); toast(`Keyboard navigation ${v ? 'enabled' : 'disabled'}`, 'info') }} />
                </SettingRow>
                <SettingRow label="Focus Indicators" desc="Show visible focus rings on all elements">
                  <Toggle checked={a11y.focusIndicators} onChange={v => { setA11y(p => ({ ...p, focusIndicators: v })); document.documentElement.style.setProperty('--focus-outline', v ? '2px solid #2563EB' : 'none'); toast(`Focus indicators ${v ? 'on' : 'off'}`, 'info') }} />
                </SettingRow>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
