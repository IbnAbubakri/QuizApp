import { useState } from 'react'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { validateEmail } from '../lib/validation'
import Logo from './Logo'

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    setLoading(false)
    if (error) {
      setError('Could not send reset email. Please try again.')
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="auth-screen" id="main-content" role="main">
        <Logo withText />
        <div className="auth-card">
          <div className="login-icon">
            <CheckCircle2 size={28} />
          </div>
          <h1>Check your inbox</h1>
          <p>
            We sent a password reset link to <strong>{email}</strong>. Follow the link to set a new
            password, then come back and log in.
          </p>
          <button className="primary-btn full-width" onClick={onBack}>
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen" id="main-content" role="main">
      <Logo withText />
      <div className="forgot-screen">
        <button className="back-btn" onClick={onBack} aria-label="Back to login">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>
      <form
        className="auth-card"
        onSubmit={handleSubmit}
        aria-label="Forgot password"
        noValidate
      >
        <div className="login-icon">
          <Mail size={28} />
        </div>
        <h1>Reset your password</h1>
        <p>Enter your email and we&apos;ll send you a reset link.</p>

        <div className="form-group">
          <label htmlFor="forgot-email">
            Email <span className="required-star" aria-hidden="true">*</span>
          </label>
          <input
            id="forgot-email"
            type="email"
            className={`auth-input ${error ? 'input-error' : ''}`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            autoComplete="email"
            autoFocus
            required
            aria-invalid={!!error}
          />
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <button type="submit" className="primary-btn full-width" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </div>
  )
}
