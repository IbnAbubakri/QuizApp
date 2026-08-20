import { useState } from 'react'
import { Lock, ArrowLeft, LogOut, ShieldAlert, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { validateEmail } from '../lib/validation'

export default function AdminLogin({ onLogin, onBack }) {
  const { user, signIn, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isAdmin = !!user && user.app_metadata?.is_admin === true

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const emailError = validateEmail(email)
    if (emailError || !password) {
      setError(emailError || 'Please enter your password.')
      return
    }
    setLoading(true)
    const { data, error } = await signIn({ email: email.trim(), password })
    if (error) {
      setError('Incorrect email or password. Please try again.')
      setLoading(false)
      return
    }
    if (data?.user?.app_metadata?.is_admin === true) {
      setLoading(false)
      onLogin()
      return
    }
    await signOut()
    setLoading(false)
    setError('This account is not a teacher. Sign in with the teacher account to manage topics.')
  }

  if (isAdmin) return null

  if (user && !isAdmin) {
    return (
      <div className="admin-login" id="main-content" role="main">
        <div className="page-top">
          <button className="back-btn" onClick={onBack} aria-label="Back">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </div>
        <section className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-main">
              <span className="page-hero-tile">
                <Lock size={24} />
              </span>
              <div className="page-hero-body">
                <h1 className="page-hero-title">Teacher access only</h1>
                <p className="page-hero-sub">
                  You&apos;re signed in as a student. Only the teacher account can manage topics and
                  questions.
                </p>
              </div>
            </div>
          </div>
        </section>
        <div className="login-card">
          <div className="login-icon">
            <ShieldAlert size={26} />
          </div>
          <p className="login-hint">Sign out and use the teacher account to continue.</p>
          <button
            className="primary-btn full-width"
            onClick={async () => {
              await signOut()
            }}
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-login" id="main-content" role="main">
      <div className="page-top">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-main">
            <span className="page-hero-tile">
              <Lock size={24} />
            </span>
            <div className="page-hero-body">
              <h1 className="page-hero-title">Teacher Login</h1>
              <p className="page-hero-sub">
                Sign in with the teacher account to manage topics and questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <form
        className="login-card"
        onSubmit={handleSubmit}
        aria-label="Teacher login"
        noValidate
      >
        <div className="form-group">
          <label htmlFor="admin-email">
            Email <span className="required-star" aria-hidden="true">*</span>
          </label>
          <input
            id="admin-email"
            type="email"
            className="auth-input"
            placeholder="teacher@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            autoComplete="email"
            autoFocus
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="admin-password">
            Password <span className="required-star" aria-hidden="true">*</span>
          </label>
          <div className="password-wrap">
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="primary-btn full-width" disabled={loading}>
          <Lock size={18} />
          {loading ? 'Signing in…' : 'Unlock panel'}
        </button>
      </form>
    </div>
  )
}
