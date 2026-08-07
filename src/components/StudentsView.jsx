import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import MessagePopup from './MessagePopup'

const studentKey = (attempt) => attempt.user_id || `name:${attempt.student_name || 'Anonymous'}`

const studentLabel = (attempt) =>
  attempt.student_name || (attempt.user_id ? 'Student' : 'Anonymous')

const initials = (name = '') =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

export default function StudentsView({ onBack }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [expandedAttempt, setExpandedAttempt] = useState(null)
  const [message, setMessage] = useState(null)

  const loadAttempts = async () => {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw error
    setAttempts(data || [])
  }

  useEffect(() => {
    ;(async () => {
      try {
        await loadAttempts()
      } catch (e) {
        setMessage({ text: 'Failed to load students: ' + e.message, tone: 'error' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const deleteAttempt = async (id) => {
    if (!window.confirm('Delete this result?')) return
    try {
      await supabase.from('quiz_attempts').delete().eq('id', id)
      await loadAttempts()
    } catch (e) {
      setMessage({ text: 'Delete failed: ' + e.message, tone: 'error' })
    }
  }

  const students = useMemo(() => {
    const map = new Map()
    for (const attempt of attempts) {
      const key = studentKey(attempt)
      if (!map.has(key)) {
        map.set(key, { key, name: studentLabel(attempt), attempts: [] })
      }
      map.get(key).attempts.push(attempt)
    }
    return [...map.values()].sort((a, b) => b.attempts.length - a.attempts.length)
  }, [attempts])

  const stats = (student) => {
    const list = student.attempts
    const average = Math.round(
      list.reduce((sum, a) => sum + (a.percent || 0), 0) / list.length
    )
    const best = Math.max(...list.map((a) => a.percent || 0))
    const last = new Date(list[0].created_at).toLocaleString()
    return { average, best, last }
  }

  const passingStudents = students.filter(
    (s) => stats(s).average >= 50
  ).length
  const allAverage =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percent || 0), 0) / attempts.length)
      : 0

  return (
    <div className="admin">
      <header className="admin-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to admin panel">
          <ArrowLeft size={18} />
          <span>Admin Panel</span>
        </button>
        <h1>Students</h1>
        <div className="admin-header-actions" />
      </header>

      <MessagePopup
        message={message?.text}
        tone={message?.tone || 'error'}
        onClose={() => setMessage(null)}
      />

      {students.length > 0 && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">Students</span>
            <span className="stat-value">{students.length}</span>
            <span className="stat-sub">
              {passingStudents} averaging 50% or above
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total attempts</span>
            <span className="stat-value">{attempts.length}</span>
            <span className="stat-sub">Across all students</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Average score</span>
            <span className="stat-value">{allAverage}%</span>
            <div className="score-track" aria-hidden="true">
              <div
                className={`score-fill ${allAverage >= 50 ? 'pass' : 'fail'}`}
                style={{ transform: `scaleX(${Math.max(allAverage, 3) / 100})` }}
              />
            </div>
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
      ) : students.length === 0 ? (
        <div className="notice">
          No attempts yet. When a student finishes a quiz and submits their result, they will
          appear here with their full history and attempt count.
        </div>
      ) : (
        <div className="attempt-list">
          {students.map((student) => {
            const { average, best, last } = stats(student)
            const isOpen = expanded === student.key
            return (
              <div key={student.key} className="attempt-row">
                <div
                  className="attempt-row-main"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : student.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setExpanded(isOpen ? null : student.key)
                    }
                  }}
                >
                  <span className="monogram">{initials(student.name)}</span>
                  <div className="attempt-body">
                    <h3 className="attempt-title">{student.name}</h3>
                    <p className="attempt-sub">
                      <strong>{student.attempts.length}</strong>
                      {student.attempts.length === 1 ? ' attempt' : ' attempts'}
                      <span> · </span>
                      best {best}%
                      <span> · </span>
                      <span className="attempt-date">last {last}</span>
                    </p>
                    <div className="score-track" aria-hidden="true">
                      <div
                        className={`score-fill ${average >= 50 ? 'pass' : 'fail'}`}
                        style={{ transform: `scaleX(${Math.max(average, 3) / 100})` }}
                      />
                    </div>
                  </div>
                  <span className={`attempt-badge ${average >= 50 ? 'pass' : 'fail'}`}>
                    {average}%
                  </span>
                  <button
                    className="icon-btn"
                    title={isOpen ? 'Hide attempts' : 'Show attempts'}
                    onClick={() => setExpanded(isOpen ? null : student.key)}
                  >
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {isOpen && (
                  <div className="attempt-detail">
                    {student.attempts.map((attempt) => {
                      const failures = attempt.failed_questions || []
                      const attemptOpen = expandedAttempt === attempt.id
                      const passed = attempt.percent >= 50
                      return (
                        <div key={attempt.id} className="attempt-row">
                          <div
                            className="attempt-row-main"
                            role="button"
                            tabIndex={0}
                            aria-expanded={attemptOpen}
                            onClick={() =>
                              setExpandedAttempt(attemptOpen ? null : attempt.id)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setExpandedAttempt(attemptOpen ? null : attempt.id)
                              }
                            }}
                          >
                            <div className="attempt-body">
                              <h4 className="attempt-title">{attempt.topic_name || 'Topic'}</h4>
                              <p className="attempt-sub">
                                <strong>
                                  {attempt.score}/{attempt.total}
                                </strong>
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
                            <button
                              className="icon-btn danger"
                              title="Delete result"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteAttempt(attempt.id)
                              }}
                            >
                              <Trash2 size={17} />
                            </button>
                            <button
                              className="icon-btn"
                              title={attemptOpen ? 'Hide details' : 'Show details'}
                              onClick={() =>
                                setExpandedAttempt(attemptOpen ? null : attempt.id)
                              }
                            >
                              {attemptOpen ? (
                                <ChevronUp size={17} />
                              ) : (
                                <ChevronDown size={17} />
                              )}
                            </button>
                          </div>

                          {attemptOpen && (
                            <div className="attempt-detail attempt-detail--inner">
                              {failures.length === 0 ? (
                                <p className="attempt-note">
                                  <CheckCircle2 size={15} />
                                  <span>Perfect score — no mistakes.</span>
                                </p>
                              ) : (
                                failures.map((f) => (
                                  <div key={f.number} className="failure-item">
                                    <div className="failure-head">
                                      <span className="failure-number">#{f.number}</span>
                                      <span className="failure-question">{f.question}</span>
                                    </div>
                                    <p className="review-wrong-answer">
                                      Your answer: {f.yourAnswer}
                                    </p>
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
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
