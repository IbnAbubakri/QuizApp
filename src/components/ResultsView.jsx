import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import MessagePopup from './MessagePopup'
import { useConfirm } from '../hooks/useConfirm'

const initials = (name = '') =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

export default function ResultsView({ onBack }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [message, setMessage] = useState(null)
  const { confirm, dialog } = useConfirm()

  const loadAttempts = async () => {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    setAttempts(data || [])
  }

  useEffect(() => {
    ;(async () => {
      try {
        await loadAttempts()
      } catch (e) {
        setMessage({ text: 'Failed to load results: ' + e.message, tone: 'error' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const deleteAttempt = (id) => {
    confirm({
      title: 'Delete result?',
      message: 'Delete this result? This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await supabase.from('quiz_attempts').delete().eq('id', id)
          await loadAttempts()
        } catch (e) {
          setMessage({ text: 'Delete failed: ' + e.message, tone: 'error' })
        }
      },
    })
  }

  const totalAttempts = attempts.length
  const average =
    totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percent || 0), 0) / totalAttempts)
      : 0
  const passCount = attempts.filter((a) => (a.percent || 0) >= 50).length
  const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0

  return (
    <div className="admin">
      <header className="admin-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to admin panel">
          <ArrowLeft size={18} />
          <span>Admin Panel</span>
        </button>
        <h1>Student Results</h1>
        <div className="admin-header-actions" />
      </header>

      <MessagePopup
        message={message?.text}
        tone={message?.tone || 'error'}
        onClose={() => setMessage(null)}
      />
      {dialog}

      {totalAttempts > 0 && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">Attempts</span>
            <span className="stat-value">{totalAttempts}</span>
            <span className="stat-sub">
              {passCount} passed · {totalAttempts - passCount} failed
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Average score</span>
            <span className="stat-value">{average}%</span>
            <div className="score-track" aria-hidden="true">
              <div
                className={`score-fill ${average >= 50 ? 'pass' : 'fail'}`}
                style={{ transform: `scaleX(${Math.max(average, 3) / 100})` }}
              />
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pass rate</span>
            <span className="stat-value">{passRate}%</span>
            <span className="stat-sub">Scored 50% or above</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="attempt-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="attempt-row">
              <div className="attempt-row-main">
                <span className="skeleton-tile skeleton" />
                <div className="skeleton-lines" style={{ flex: 1 }}>
                  <span className="skeleton-line skeleton" style={{ width: '45%' }} />
                  <span className="skeleton-line skeleton" style={{ width: '32%' }} />
                </div>
                <span
                  className="skeleton-line skeleton"
                  style={{ width: 52, height: 20, borderRadius: 999 }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="notice">
          No results yet. When a student finishes a quiz and submits their name, it will appear
          here.
        </div>
      ) : (
        <div className="attempt-list">
          {attempts.map((attempt) => {
            const failures = attempt.failed_questions || []
            const isOpen = expanded === attempt.id
            const passed = attempt.percent >= 50
            return (
              <div key={attempt.id} className="attempt-row">
                <div
                  className="attempt-row-main"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : attempt.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setExpanded(isOpen ? null : attempt.id)
                    }
                  }}
                >
                  <span className="monogram">{initials(attempt.student_name)}</span>
                  <div className="attempt-body">
                    <h3 className="attempt-title">{attempt.student_name || 'Anonymous'}</h3>
                    <p className="attempt-sub">
                      <strong>
                        {attempt.score}/{attempt.total}
                      </strong>
                      <span> · </span>
                      {attempt.topic_name || 'Topic'}
                      <span> · </span>
                      <span className="attempt-date">
                        {new Date(attempt.created_at).toLocaleString()}
                      </span>
                      {failures.length > 0 && (
                        <>
                          <span> · </span>
                          missed {failures.length}
                        </>
                      )}
                    </p>
                    <div className="score-track" aria-hidden="true">
                      <div
                        className={`score-fill ${passed ? 'pass' : 'fail'}`}
                        style={{ transform: `scaleX(${Math.max(attempt.percent, 3) / 100})` }}
                      />
                    </div>
                  </div>
                  <span className={`attempt-badge ${passed ? 'pass' : 'fail'}`}>
                    {attempt.percent}%
                  </span>
                  <button
                    className="icon-btn"
                    title={isOpen ? 'Hide details' : 'Show details'}
                    onClick={() => setExpanded(isOpen ? null : attempt.id)}
                  >
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Delete result"
                    onClick={() => deleteAttempt(attempt.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                {isOpen && (
                  <div className="attempt-detail">
                    {failures.length === 0 ? (
                      <p className="attempt-note">
                        <CheckCircle2 size={15} />
                        <span>Perfect score — every question answered correctly.</span>
                      </p>
                    ) : (
                      failures.map((f) => (
                        <div key={f.number} className="failure-item">
                          <div className="failure-head">
                            <span className="failure-number">#{f.number}</span>
                            <span className="failure-question">{f.question}</span>
                          </div>
                          <p className="review-wrong-answer">Your answer: {f.yourAnswer}</p>
                          <p className="review-correct-answer">Correct answer: {f.correctAnswer}</p>
                          {f.explanation && (
                            <p className="review-explanation">Why: {f.explanation}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
