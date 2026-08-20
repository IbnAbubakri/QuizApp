import { useState } from 'react'
import { LogIn, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { validateEmail } from '../lib/validation'
import Logo from './Logo'

const getErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.'
  const msg = error.message || ''
  if (msg === 'Invalid login credentials')
    return 'Incorrect email or password. Please try again.'
  if (msg === 'Email not confirmed')
    return 'Please confirm your email address first. Check your inbox for the confirmation link.'
  return 'Something went wrong. Please try again.'
}

export default function LoginPage({ onSwitch, onForgotPassword }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    const errs = {}
    const em = validateEmail(email)
    if (em) errs.email = em
    if (!password) errs.password = 'Please enter your password.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    const { error } = await signIn({ email: email.trim(), password })
    if (error) setFormError(getErrorMessage(error))
    setLoading(false)
  }

  return (
    <div className="auth-screen" id="main-content" role="main">
      <Logo withText />
      <form
        className="auth-card"
        onSubmit={handleSubmit}
        aria-label="Student login"
        noValidate
      >
        <div className="login-icon">
          <LogIn size={28} />
        </div>
        <h1>Welcome back</h1>
        <p>Log in with the email you registered with.</p>

        <div className="form-group">
          <label htmlFor="login-email">
            Email <span className="required-star" aria-hidden="true">*</span>
          </label>
          <input
            id="login-email"
            type="email"
            className={`auth-input ${errors.email ? 'input-error' : ''}`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((prev) => ({ ...prev, email: '' }))
            }}
            autoComplete="email"
            autoFocus
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
          />
          {errors.email && (
            <p className="field-error" id="login-email-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="login-password">
            Password <span className="required-star" aria-hidden="true">*</span>
          </label>
          <div className="password-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className={`auth-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((prev) => ({ ...prev, password: '' }))
              }}
              autoComplete="current-password"
              required
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
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
          {errors.password && (
            <p className="field-error" id="login-password-error" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        {formError && (
          <div className="login-error auth-error" role="alert">
            {formError}
          </div>
        )}

        <button type="submit" className="primary-btn full-width" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        {onForgotPassword && (
          <p className="auth-forgot">
            <button type="button" onClick={onForgotPassword}>
              <KeyRound size={14} />
              Forgot password?
            </button>
          </p>
        )}

        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={onSwitch}>
            Sign up
          </button>
        </p>
      </form>
    </div>
  )
}
