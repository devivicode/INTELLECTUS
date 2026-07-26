import { useState } from 'react'
import { Shield, Eye, EyeOff, ArrowLeft, Mail, Lock, User, Phone, Building, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import type { Page } from '../components/Layout'

interface AuthProps { mode: 'login' | 'signup' | 'forgot' | 'verify' | 'profile-setup'; onNavigate: (page: Page) => void }

function InputField({ label, type = 'text', placeholder, icon: Icon, value, onChange, error }: {
  label: string; type?: string; placeholder: string; icon: React.ComponentType<{size: number; style?: React.CSSProperties}>; value: string; onChange: (v: string) => void; error?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
      <div className="relative">
        <Icon size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', paddingLeft: 38, paddingRight: isPassword ? 38 : 12, paddingTop: 10, paddingBottom: 10,
            border: error ? '1px solid #EF4444' : '1px solid #E2E8F0', borderRadius: 10, fontSize: 14,
            color: '#0F172A', background: '#fff', outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#2563EB'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)' }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = error ? '#EF4444' : '#E2E8F0'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

export default function Auth({ mode, onNavigate }: AuthProps) {
  const [loading, setLoading] = useState(false)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [fields, setFields] = useState({ email: '', password: '', confirmPassword: '', name: '', phone: '', badgeId: '', station: '', district: '', rank: '' })
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaCode, setMfaCode] = useState('')

  function handleOtp(i: number, val: string) {
    if (val.length > 1) return
    const next = [...otpValues]; next[i] = val; setOtpValues(next)
    if (val && i < 5) {
      const nextInput = document.getElementById(`otp-${i + 1}`)
      if (nextInput) (nextInput as HTMLInputElement).focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    if (mode === 'login') {
      if (!mfaStep) { setMfaStep(true); return }
      onNavigate('ai-assistant')
    } else if (mode === 'signup') onNavigate('verify')
    else if (mode === 'forgot') onNavigate('verify')
    else if (mode === 'verify') onNavigate('profile-setup')
    else if (mode === 'profile-setup') onNavigate('ai-assistant')
  }

  const RANKS = ['Constable', 'Head Constable', 'Assistant Sub Inspector', 'Sub Inspector', 'Inspector', 'Deputy Superintendent', 'Superintendent', 'Deputy Inspector General', 'Inspector General', 'Additional DGP', 'DGP']

  const card = (
    <div style={{ background: '#fff', borderRadius: 20, padding: 40, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', width: '100%', maxWidth: 440, border: '1px solid #E2E8F0' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>
          <Shield size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Karnataka Police</div>
          <div style={{ fontWeight: 600, fontSize: 10, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Intellectus Portal</div>
        </div>
      </div>

      {/* MFA overlay for login */}
      {mode === 'login' && mfaStep ? (
        <div>
          <button onClick={() => setMfaStep(false)} className="flex items-center gap-1.5 mb-4" style={{ color: '#64748B', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Two-Factor Verification</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Enter the 6-digit OTP sent to your registered mobile number ending in **45</p>
          <div className="flex gap-2 justify-center mb-6">
            {otpValues.map((v, i) => (
              <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={v} onChange={e => handleOtp(i, e.target.value)}
                style={{ width: 48, height: 56, textAlign: 'center', border: '2px solid #E2E8F0', borderRadius: 12, fontSize: 22, fontWeight: 700, color: '#0F172A', fontFamily: "'JetBrains Mono', monospace", background: '#F8FAFC', outline: 'none' }}
                onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }} />
            ))}
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 rounded-xl font-600 text-sm flex items-center justify-center gap-2"
            style={{ background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}>
            {loading ? <><Loader size={15} className="animate-spin" /> Verifying...</> : 'Verify & Continue'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#64748B', marginTop: 12 }}>
            Didn't receive? <button style={{ color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Resend OTP</button>
          </p>
        </div>
      ) : mode === 'login' ? (
        <form onSubmit={handleSubmit}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Welcome back, Officer</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 28 }}>Sign in to your Karnataka Police account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <InputField label="Police ID / Email" type="email" placeholder="officer@ksp.gov.in" icon={Mail} value={fields.email} onChange={v => setFields({ ...fields, email: v })} />
            <InputField label="Password" type="password" placeholder="Enter your password" icon={Lock} value={fields.password} onChange={v => setFields({ ...fields, password: v })} />
          </div>
          <div className="flex items-center justify-between mt-3 mb-6">
            <label className="flex items-center gap-2" style={{ fontSize: 13, color: '#64748B', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: '#2563EB' }} /> Remember me
            </label>
            <button type="button" onClick={() => onNavigate('forgot')} style={{ fontSize: 13, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              Forgot password?
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-600 text-sm flex items-center justify-center gap-2"
            style={{ background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            {loading ? <><Loader size={15} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#64748B' }}>
            Don't have an account?{' '}
            <button type="button" onClick={() => onNavigate('signup')} style={{ color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Register here
            </button>
          </div>
          <div style={{ marginTop: 20, padding: '12px 16px', background: '#F0F7FF', borderRadius: 10, border: '1px solid #DBEAFE' }}>
            <div className="flex items-start gap-2">
              <AlertCircle size={13} style={{ color: '#2563EB', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: '#1D4ED8', lineHeight: 1.5 }}>This system is for authorized Karnataka Police personnel only. Unauthorized access is a criminal offence under IT Act 2000.</p>
            </div>
          </div>
        </form>
      ) : mode === 'signup' ? (
        <form onSubmit={handleSubmit}>
          <button type="button" onClick={() => onNavigate('login')} className="flex items-center gap-1.5 mb-4" style={{ color: '#64748B', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={14} /> Back to Login
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Create Officer Account</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Register with your Karnataka Police credentials</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InputField label="Full Name" placeholder="Inspector Rajesh Kumar" icon={User} value={fields.name} onChange={v => setFields({ ...fields, name: v })} />
            <InputField label="Email Address" type="email" placeholder="officer@ksp.gov.in" icon={Mail} value={fields.email} onChange={v => setFields({ ...fields, email: v })} />
            <InputField label="Police Badge ID" placeholder="KAR/INS/2456" icon={Shield} value={fields.badgeId} onChange={v => setFields({ ...fields, badgeId: v })} />
            <InputField label="Mobile Number" placeholder="+91 98765 43210" icon={Phone} value={fields.phone} onChange={v => setFields({ ...fields, phone: v })} />
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Rank</label>
              <select value={fields.rank} onChange={e => setFields({ ...fields, rank: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', background: '#fff', outline: 'none' }}>
                <option value="">Select Rank</option>
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <InputField label="Password" type="password" placeholder="Create a strong password" icon={Lock} value={fields.password} onChange={v => setFields({ ...fields, password: v })} />
            <InputField label="Confirm Password" type="password" placeholder="Confirm your password" icon={Lock} value={fields.confirmPassword} onChange={v => setFields({ ...fields, confirmPassword: v })} />
          </div>
          <p style={{ fontSize: 11, color: '#64748B', marginTop: 12, marginBottom: 16, lineHeight: 1.5 }}>
            By registering, you agree to the Karnataka Police Portal Terms of Service and acknowledge that all activities are monitored and logged.
          </p>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-600 flex items-center justify-center gap-2"
            style={{ background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? <><Loader size={15} className="animate-spin" /> Creating Account...</> : 'Create Account'}
          </button>
        </form>
      ) : mode === 'forgot' ? (
        <form onSubmit={handleSubmit}>
          <button type="button" onClick={() => onNavigate('login')} className="flex items-center gap-1.5 mb-4" style={{ color: '#64748B', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={14} /> Back to Login
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Reset Password</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Enter your registered email or Police ID to receive a reset link</p>
          <InputField label="Email / Police ID" type="email" placeholder="officer@ksp.gov.in" icon={Mail} value={fields.email} onChange={v => setFields({ ...fields, email: v })} />
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-600 mt-5 flex items-center justify-center gap-2"
            style={{ background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? <><Loader size={15} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
          </button>
        </form>
      ) : mode === 'verify' ? (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#DBEAFE' }}>
              <Mail size={28} style={{ color: '#2563EB' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Verify Your Email</h2>
            <p style={{ fontSize: 13, color: '#64748B' }}>Enter the 6-digit OTP sent to your email address</p>
          </div>
          <div className="flex gap-2 justify-center mb-6">
            {otpValues.map((v, i) => (
              <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={v} onChange={e => handleOtp(i, e.target.value)}
                style={{ width: 48, height: 56, textAlign: 'center', border: '2px solid #E2E8F0', borderRadius: 12, fontSize: 22, fontWeight: 700, color: '#0F172A', fontFamily: "'JetBrains Mono', monospace", background: '#F8FAFC', outline: 'none' }} />
            ))}
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 rounded-xl font-600 flex items-center justify-center gap-2"
            style={{ background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? <><Loader size={15} className="animate-spin" /> Verifying...</> : 'Verify Email'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#DCFCE7' }}>
              <CheckCircle size={28} style={{ color: '#22C55E' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Complete Your Profile</h2>
            <p style={{ fontSize: 13, color: '#64748B' }}>Set up your officer profile to get started</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InputField label="Police Station" placeholder="Koramangala Police Station" icon={Building} value={fields.station} onChange={v => setFields({ ...fields, station: v })} />
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>District</label>
              <select value={fields.district} onChange={e => setFields({ ...fields, district: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', background: '#fff', outline: 'none' }}>
                <option value="">Select District</option>
                {['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mangaluru', 'Belagavi', 'Hubballi-Dharwad'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-600 mt-5 flex items-center justify-center gap-2"
            style={{ background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? <><Loader size={15} className="animate-spin" /> Setting up...</> : 'Complete Setup & Enter Portal'}
          </button>
        </form>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-between p-12" style={{ flex: '0 0 45%', background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Shield size={18} color="#93C5FD" />
          </div>
          <div style={{ color: '#93C5FD', fontWeight: 600, fontSize: 13 }}>Karnataka Police</div>
        </div>
        <div>
          <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Modernizing Police<br />Investigation in Karnataka
          </h2>
          <p style={{ color: '#93C5FD', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
            AI-powered FIR search, smart investigation dashboards, OCR document scanning, and real-time analytics—all in one secure platform.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['AI-powered investigation assistant', 'Advanced FIR search & filtering', 'Secure government-grade authentication', 'Real-time crime analytics & heatmaps'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle size={15} style={{ color: '#34D399', flexShrink: 0 }} />
                <span style={{ color: '#CBD5E1', fontSize: 13 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ color: '#475569', fontSize: 11 }}>© 2024 Karnataka Police Department · Government of Karnataka</div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: '#F8FAFC' }}>
        {card}
      </div>
    </div>
  )
}
