import { useState } from 'react'
import { UserPlus, Eye, EyeOff, Mail } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import {
  validateName,
  validateEmail,
  validatePassword,
  passwordStrength,
} from '../lib/validation'
import Logo from './Logo'

const getErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.'
  const msg = error.message || String(error)
  if (msg.includes('already registered')) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (msg.includes('signup_disabled'))
    return 'New registrations are currently disabled. Ask Mr. Faaruq to enable them.'
  return msg
}

export default function RegisterPage({ onSwitch }) {
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)

  const strength = passwordStrength(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    const errs = {}
    const nm = validateName(name)
    const em = validateEmail(email)
    const pw = validatePassword(password)
    if (nm) errs.name = nm
    if (em) errs.email = em
    if (pw) errs.password = pw
    if (password !== confirmPassword) errs.confirm = 'Passwords do not match.'
    if (!acceptedTerms) errs.terms = 'Please accept the terms to continue.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    const { data, error } = await signUp({
      name: name.trim(),
      email: email.trim(),
      password,
    })
    if (error) {
      setFormError(getErrorMessage(error))
    } else if (!data?.session) {
      setNeedsConfirm(true)
    }
    setLoading(false)
  }

  if (needsConfirm) {
    return (
      <div className="auth-screen">
        <Logo withText />
        <div className="auth-card">
          <div className="login-icon">
            <Mail size={28} />
          </div>
          <h1>Check your inbox</h1>
          <p>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
            account, then come back and log in.
          </p>
          <button
            className="primary-btn full-width"
            onClick={() => {
              setNeedsConfirm(false)
              onSwitch()
            }}
          >
            Go to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <Logo withText />
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="login-icon">
          <UserPlus size={28} />
        </div>
        <h1>Create your account</h1>
        <p>Register once to start taking quizzes.</p>

        <div className="form-group">
          <label htmlFor="reg-name">Full name</label>
          <input
            id="reg-name"
            type="text"
            className="auth-input"
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((prev) => ({ ...prev, name: '' }))
            }}
            autoComplete="name"
            autoFocus
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((prev) => ({ ...prev, email: '' }))
            }}
            autoComplete="email"
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="reg-password">Password</label>
          <div className="password-wrap">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="8+ characters, a capital letter and a number"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((prev) => ({ ...prev, password: '' }))
              }}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {password && (
            <div className="strength">
              <div className="strength-bar">
                <span
                  className="strength-fill"
                  style={{
                    transform: `scaleX(${strength.score / 4})`,
                    background: ['var(--red)', '#f59e0b', '#f59e0b', '#10b981', '#10b981'][
                      strength.score
                    ],
                  }}
                />
              </div>
              <span className="strength-label">{strength.label}</span>
            </div>
          )}
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="reg-confirm">Confirm password</label>
          <input
            id="reg-confirm"
            type="password"
            className="auth-input"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setErrors((prev) => ({ ...prev, confirm: '' }))
            }}
            autoComplete="new-password"
          />
          {errors.confirm && <p className="field-error">{errors.confirm}</p>}
        </div>

        <label className="terms">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => {
              setAcceptedTerms(e.target.checked)
              setErrors((prev) => ({ ...prev, terms: '' }))
            }}
          />
          <span>
            I agree to use this app for my quizzes and will submit my results honestly.
          </span>
        </label>
        {errors.terms && <p className="field-error">{errors.terms}</p>}

        {formError && <div className="login-error auth-error">{formError}</div>}

        <button type="submit" className="primary-btn full-width" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="auth-switch">
          Already have an account? <button type="button" onClick={onSwitch}>Log in</button>
        </p>
      </form>
    </div>
  )
}
