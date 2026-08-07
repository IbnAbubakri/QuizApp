import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ClipboardList,
  Target,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import MessagePopup from './MessagePopup'

const RING_SIZE = 132
const RING_RADIUS = 56
const RING_STROKE = 10
const RING_CIRC = 2 * Math.PI * RING_RADIUS

export default function StudentDashboard({ user, onBack }) {
  const [attempts, setAttempts] = useState([])
  const [topicMap, setTopicMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [message, setMessage] = useState(null)
  const [ringReady, setRingReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRingReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const [attemptsRes, topicsRes] = await Promise.all([
          supabase
            .from('quiz_attempts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100),
          supabase.from('topics').select('id, name, emoji, accent'),
        ])
        if (attemptsRes.error) throw attemptsRes.error
        setAttempts(attemptsRes.data || [])
        const map = {}
        for (const t of topicsRes.data || []) map[t.name] = t
        setTopicMap(map)
      } catch (e) {
        setMessage({ text: 'Could not load your results: ' + e.message, tone: 'error' })
      } finally {
        setLoading(false)
      }
    })()
  }, [user.id])

  const totalAttempts = attempts.length
  const average =
    totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percent || 0), 0) / totalAttempts)
      : 0
  const best = totalAttempts > 0 ? Math.max(...attempts.map((a) => a.percent || 0)) : 0
  const passCount = attempts.filter((a) => (a.percent || 0) >= 50).length

  const firstName =
    user?.user_metadata?.full_name?.trim().split(/\s+/)[0] ||
    (user?.email || '').split('@')[0] ||
    'there'
  const prettyName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  const topicEmoji = (attempt) => topicMap[attempt.topic_name]?.emoji || '📘'
  const topicAccent = (attempt) => topicMap[attempt.topic_name]?.accent || '#4f46e5'

  const ringOffset = RING_CIRC * (1 - average / 100)

  return (
    <div className="dash">
      <header className="admin-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to topics">
          <ArrowLeft size={18} />
          <span>Topics</span>
        </button>
        <h1>My dashboard</h1>
        <div className="admin-header-actions" />
      </header>

      <MessagePopup
        message={message?.text}
        tone={message?.tone || 'error'}
        onClose={() => setMessage(null)}
      />

      <section className="dash-hero">
        <div className="dash-hero-body">
          <p className="dash-hero-eyebrow">My results</p>
          <h2 className="dash-hero-title">Hi, {prettyName}</h2>
          <p className="dash-hero-sub">
            {totalAttempts === 0
              ? "You haven't taken a quiz yet — start one to see your scores and progress here."
              : `You've taken ${totalAttempts} quiz${
                  totalAttempts === 1 ? '' : 'zes'
                } so far. Keep going — every attempt counts!`}
          </p>
          <div className="dash-hero-stats">
            <div className="dash-hero-stat">
              <span className="dash-hero-stat-value">{totalAttempts}</span>
              <span className="dash-hero-stat-label">Quizzes</span>
            </div>
            <div className="dash-hero-stat">
              <span className="dash-hero-stat-value">{best}%</span>
              <span className="dash-hero-stat-label">Best score</span>
            </div>
            <div className="dash-hero-stat">
              <span className="dash-hero-stat-value">
                {totalAttempts > 0 ? `${passCount}/${totalAttempts}` : '0'}
              </span>
              <span className="dash-hero-stat-label">Passed (50%+)</span>
            </div>
          </div>
          <button className="dash-hero-cta" onClick={onBack}>
            <BookOpen size={18} />
            Take a quiz
          </button>
        </div>

        <div className="dash-hero-side">
          {totalAttempts > 0 ? (
            <>
              <div className="dash-ring">
                <svg className="score-ring" viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                  <circle
                    className="ring-bg"
                    cx="66"
                    cy="66"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth={RING_STROKE}
                  />
                  <circle
                    className="ring-fg"
                    cx="66"
                    cy="66"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth={RING_STROKE}
                    strokeDasharray={RING_CIRC}
                    strokeDashoffset={ringReady ? ringOffset : RING_CIRC}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="score-ring-value">
                  {average}
                  <small>%</small>
                </div>
              </div>
              <p className="dash-hero-ring-label">Average score</p>
            </>
          ) : (
            <div className="dash-hero-placeholder">
              <Target />
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <div className="notice">Loading your results…</div>
      ) : attempts.length === 0 ? (
        <div className="notice empty-state">
          <div className="empty-state-icon">
            <ClipboardList size={24} />
          </div>
          <h2>No results yet</h2>
          <p>
            Take a quiz to see your history here — how you scored each time and which questions
            you missed.
          </p>
          <button className="primary-btn" onClick={onBack}>
            <BookOpen size={18} />
            Take a quiz
          </button>
        </div>
      ) : (
        <>
          <div className="dash-section-head">
            <h2>Recent attempts</h2>
            <span className="dash-section-count">{totalAttempts}</span>
          </div>
          <div className="dash-attempt-list">
            {attempts.map((attempt) => {
              const failures = attempt.failed_questions || []
              const isOpen = expanded === attempt.id
              const passed = attempt.percent >= 50
              return (
                <div
                  key={attempt.id}
                  className="dash-attempt"
                  style={{ '--accent': topicAccent(attempt) }}
                >
                  <div
                    className="dash-attempt-main"
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
                    <span className="dash-attempt-tile">{topicEmoji(attempt)}</span>
                    <div className="dash-attempt-body">
                      <h3 className="dash-attempt-title">{attempt.topic_name || 'Topic'}</h3>
                      <p className="dash-attempt-sub">
                        <span className="dash-attempt-date">
                          {new Date(attempt.created_at).toLocaleString()}
                        </span>
                        <span> · </span>
                        {attempt.score}/{attempt.total} correct
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
                    <span className={`dash-attempt-percent ${passed ? 'pass' : 'fail'}`}>
                      {attempt.percent}%
                    </span>
                    <button
                      className="icon-btn"
                      type="button"
                      title={isOpen ? 'Hide details' : 'Show details'}
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpanded(isOpen ? null : attempt.id)
                      }}
                    >
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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
                            <p className="review-correct-answer">
                              Correct answer: {f.correctAnswer}
                            </p>
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
        </>
      )}
    </div>
  )
}
