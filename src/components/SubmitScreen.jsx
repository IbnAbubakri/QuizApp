import { useState } from 'react'
import { Save, Home, UserRound } from 'lucide-react'
import { displayName } from '../lib/AuthContext'
import { saveAttempt } from '../lib/saveAttempt'
import TopicIcon from './TopicIcon'

export default function SubmitScreen({ topic, quiz, user, onSubmitted, onExit }) {
  const { score, total, answers } = quiz
  const studentName = displayName(user) || 'Student'
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const saveResult = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setSaveError('')
    const error = await saveAttempt({ user, topic, score, total, answers })
    setSaving(false)
    if (error) {
      setSaveError('Could not submit your result. Please check your connection and try again.')
      return
    }
    onSubmitted()
  }

  return (
    <div className="result">
      <div className="page-top">
        <button className="back-btn" onClick={onExit} aria-label="Back to topics">
          <Home size={16} />
          <span>Topics</span>
        </button>
      </div>

      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-main">
            <span className="page-hero-tile">
              <TopicIcon topic={topic} size={24} />
            </span>
            <div className="page-hero-body">
              <h1 className="page-hero-title">Quiz finished!</h1>
              <p className="page-hero-sub">
                You got {score} of {total} correct — submit to save your result.
              </p>
            </div>
          </div>
          <span className="page-hero-count">
            {total > 0 ? `${Math.round((score / total) * 100)}%` : '0%'}
          </span>
        </div>
      </section>

      <div className="result-card" style={{ '--accent': topic.accent || '#4f46e5' }}>
        <p className="result-message">
          Submit your result and Mr. Faaruq will receive it. You can review your answers right
          after.
        </p>

        <form className="save-result" onSubmit={saveResult}>
          <div className="save-result-identity">
            <span className="save-result-avatar">
              <UserRound size={16} />
            </span>
            <span>
              Submitting as <strong>{studentName}</strong>
            </span>
          </div>
          <button type="submit" className="primary-btn" disabled={saving}>
            <Save size={18} />
            {saving ? 'Submitting…' : 'Submit'}
          </button>
          {saveError && <p className="save-result-error">{saveError}</p>}
        </form>

        <div className="result-actions">
          <button className="secondary-btn" onClick={onExit}>
            <Home size={18} />
            Topics
          </button>
        </div>
      </div>
    </div>
  )
}
