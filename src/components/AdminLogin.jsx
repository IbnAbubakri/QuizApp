import { useState } from 'react'
import { Lock, ArrowLeft } from 'lucide-react'

const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'admin123'

export default function AdminLogin({ onLogin, onBack }) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (passcode === ADMIN_PASSCODE) {
      onLogin()
    } else {
      setError('Wrong passcode. Try again.')
    }
  }

  return (
    <div className="admin-login">
      <div className="page-top">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-main">
            <span className="page-hero-tile">🔐</span>
            <div className="page-hero-body">
              <h1 className="page-hero-title">Teacher Login</h1>
              <p className="page-hero-sub">Enter the admin passcode to manage topics and questions.</p>
            </div>
          </div>
        </div>
      </section>

      <form className="login-card" onSubmit={handleSubmit}>
        <input
          type="password"
          className="login-input"
          placeholder="Passcode"
          aria-label="Admin passcode"
          value={passcode}
          onChange={(e) => {
            setPasscode(e.target.value)
            setError('')
          }}
          autoFocus
        />
        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="primary-btn full-width">
          <Lock size={18} />
          Unlock panel
        </button>

        <p className="login-hint">
          Change the passcode in your <code>.env</code> file ({'VITE_ADMIN_PASSCODE'}).
        </p>
      </form>
    </div>
  )
}
