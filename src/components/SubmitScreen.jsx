import { useState, useEffect } from 'react'
import { Save, Home, UserRound, RefreshCw, AlertTriangle } from 'lucide-react'
import { displayName } from '../lib/AuthContext'
import { saveAttempt } from '../lib/saveAttempt'
import TopicIcon from './TopicIcon'
import ConfirmDialog from './ConfirmDialog'

export default function SubmitScreen({ topic, quiz, user, questions, onSubmitted, onExit }) {
  const { score, total, answers, timedOut } = quiz
  const studentName = displayName(user) || 'Student'
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [exitDialog, setExitDialog] = useState(false)

  useEffect(() => {
    if (timedOut && !saving && !submitted) {
      saveResult(new Event('submit'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut])

  const saveResult = async (e) => {
    e.preventDefault()
    if (saving || submitted) return
    setSaving(true)
    setSaveError('')
    const error = await saveAttempt({ topic, questions, answers })
    setSaving(false)
    if (error) {
      setSaveError('Could not submit your result. Please check your connection and try again.')
      return
    }
    setSubmitted(true)
    onSubmitted()
  }

  const handleExit = () => {
    if (!submitted) {
      setExitDialog(true)
    } else {
      onExit()
    }
  }

  return (
    <div className="result">
      <div className="page-top">
        <button className="back-btn" onClick={handleExit} aria-label="Back to topics">
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
          <button
            type="submit"
            className="primary-btn"
            disabled={saving || submitted}
            aria-live="polite"
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="spin" />
                Submitting…
              </>
            ) : submitted ? (
              'Submitted'
            ) : (
              <>
                <Save size={18} />
                Submit
              </>
            )}
          </button>
          {saveError && (
            <p className="save-result-error" role="alert">
              {saveError}
            </p>
          )}
        </form>

        <div className="result-actions">
          <button className="secondary-btn" onClick={handleExit}>
            <Home size={18} />
            Topics
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={exitDialog}
        title="Result not submitted"
        message={
          <>
            <AlertTriangle size={18} style={{ verticalAlign: '-3px', marginRight: 6 }} />
            Your result hasn&apos;t been submitted yet. If you leave now, Mr. Faaruq won&apos;t
            receive your score.
          </>
        }
        confirmLabel="Retry submit"
        cancelLabel="Discard & exit"
        onConfirm={() => {
          setExitDialog(false)
          saveResult(new Event('submit'))
        }}
        onCancel={() => {
          setExitDialog(false)
          onExit()
        }}
      />
    </div>
  )
}
