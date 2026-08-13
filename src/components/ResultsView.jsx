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
import { useConfirm } from '../hooks/useConfirm'
import TopicIcon from './TopicIcon'

const initials = (name = '') =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

const percentOf = (list) => {
  if (!list.length) return { average: 0, passCount: 0, passRate: 0 }
  const average = Math.round(list.reduce((sum, a) => sum + (a.percent || 0), 0) / list.length)
  const passCount = list.filter((a) => (a.percent || 0) >= 50).length
  return { average, passCount, passRate: Math.round((passCount / list.length) * 100) }
}

export default function ResultsView({ topics = [], onBack }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [expandedStudent, setExpandedStudent] = useState(null)
  const [expandedAttempt, setExpandedAttempt] = useState(null)
  const [message, setMessage] = useState(null)
  const { confirm, dialog } = useConfirm()

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

  const topicStats = useMemo(() => {
    const map = new Map()
    for (const t of topics) {
      map.set(t.id, { topic: t, attempts: [] })
    }
    for (const a of attempts) {
      const holder = a.topic_id && map.get(a.topic_id)
      if (holder) {
        holder.attempts.push(a)
        continue
      }
      const tname = a.topic_name || 'Topic'
      const key = `name:${tname}`
      if (!map.has(key)) {
        map.set(key, { topic: { id: key, name: tname, accent: '#4f46e5' }, attempts: [] })
      }
      map.get(key).attempts.push(a)
    }
    return [...map.values()]
      .map(({ topic, attempts: list }) => ({
        topic,
        attempts: list,
        count: list.length,
        ...percentOf(list),
      }))
      .sort((a, b) => b.count - a.count || a.topic.name.localeCompare(b.topic.name))
  }, [topics, attempts])

  const totalAttempts = attempts.length
  const global = percentOf(attempts)
  const selectedStats = useMemo(
    () => topicStats.find((s) => s.topic.id === selectedTopic?.id),
    [topicStats, selectedTopic]
  )

  const students = useMemo(() => {
    const list = selectedStats?.attempts || []
    const map = new Map()
    for (const a of list) {
      const key = a.user_id ? `u:${a.user_id}` : `n:${a.student_name || 'Anonymous'}`
      if (!map.has(key)) {
        map.set(key, { key, name: a.student_name || 'Anonymous', attempts: [] })
      }
      map.get(key).attempts.push(a)
    }
    return [...map.values()].sort(
      (x, y) => y.attempts.length - x.attempts.length || x.name.localeCompare(y.name)
    )
  }, [selectedStats])

  return (
    <div className="admin">
      <header className="admin-header">
        <button
          className="back-btn"
          onClick={selectedTopic ? () => setSelectedTopic(null) : onBack}
          aria-label={selectedTopic ? 'Back to topics' : 'Back to admin panel'}
        >
          <ArrowLeft size={18} />
          <span>{selectedTopic ? 'Topics' : 'Admin Panel'}</span>
        </button>
        <h1>{selectedTopic ? selectedTopic.name : 'Student Results'}</h1>
        <div className="admin-header-actions" />
      </header>

      <MessagePopup
        message={message?.text}
        tone={message?.tone || 'error'}
        onClose={() => setMessage(null)}
      />
      {dialog}

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
      ) : !selectedTopic ? (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Attempts</span>
              <span className="stat-value">{totalAttempts}</span>
              <span className="stat-sub">
                {global.passCount} passed · {totalAttempts - global.passCount} failed
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Average score</span>
              <span className="stat-value">{global.average}%</span>
              <div className="score-track" aria-hidden="true">
                <div
                  className={`score-fill ${global.average >= 50 ? 'pass' : 'fail'}`}
                  style={{ transform: `scaleX(${Math.max(global.average, 3) / 100})` }}
                />
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Pass rate</span>
              <span className="stat-value">{global.passRate}%</span>
              <span className="stat-sub">Scored 50% or above</span>
            </div>
          </div>

          <div className="dash-section-head">
            <h2>Choose a topic</h2>
            <span className="dash-section-count">{topicStats.length}</span>
          </div>
          <div className="attempt-list">
            {topicStats.map(({ topic, count, average, passCount }) => (
              <button
                key={topic.id}
                className="category-card entrance"
                style={{ '--accent': topic.accent || '#4f46e5' }}
                onClick={() => setSelectedTopic(topic)}
              >
                <span className="category-emoji">
                  <TopicIcon topic={topic} size={26} />
                </span>
                <div className="category-body">
                  <h2>{topic.name}</h2>
                  <p>
                    {count === 0
                      ? 'No attempts yet for this topic.'
                      : `${passCount} of ${count} attempts passed (${average}% average).`}
                  </p>
                  <span className="category-meta">
                    {count === 0 ? 'No attempts' : `${count} attempt${count === 1 ? '' : 's'}`}
                  </span>
                </div>
                <span className="category-arrow">
                  <ChevronDown size={18} />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Students</span>
              <span className="stat-value">{students.length}</span>
              <span className="stat-sub">Attempted this topic</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Attempts</span>
              <span className="stat-value">{selectedStats.count}</span>
              <span className="stat-sub">
                {selectedStats.passCount} passed · {selectedStats.count - selectedStats.passCount}{' '}
                failed
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Average score</span>
              <span className="stat-value">{selectedStats.average}%</span>
              <div className="score-track" aria-hidden="true">
                <div
                  className={`score-fill ${selectedStats.average >= 50 ? 'pass' : 'fail'}`}
                  style={{ transform: `scaleX(${Math.max(selectedStats.average, 3) / 100})` }}
                />
              </div>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="notice">
              No students have attempted this topic yet.
            </div>
          ) : (
            <div className="attempt-list">
              {students.map((student) => {
                const sOpen = expandedStudent === student.key
                const sAvg = Math.round(
                  student.attempts.reduce((sum, a) => sum + (a.percent || 0), 0) /
                    student.attempts.length
                )
                return (
                  <div key={student.key} className="attempt-row">
                    <div
                      className="attempt-row-main"
                      role="button"
                      tabIndex={0}
                      aria-expanded={sOpen}
                      onClick={() => setExpandedStudent(sOpen ? null : student.key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setExpandedStudent(sOpen ? null : student.key)
                        }
                      }}
                    >
                      <span className="monogram">{initials(student.name)}</span>
                      <div className="attempt-body">
                        <h3 className="attempt-title">{student.name}</h3>
                        <p className="attempt-sub">
                          <strong>
                            {student.attempts.length}{' '}
                            {student.attempts.length === 1 ? 'attempt' : 'attempts'}
                          </strong>
                          <span> · </span>
                          average {sAvg}%
                        </p>
                      </div>
                      <span className={`attempt-badge ${sAvg >= 50 ? 'pass' : 'fail'}`}>
                        {sAvg}%
                      </span>
                      <button
                        className="icon-btn"
                        title={sOpen ? 'Hide attempts' : 'Show attempts'}
                        onClick={() => setExpandedStudent(sOpen ? null : student.key)}
                      >
                        {sOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>

                    {sOpen && (
                      <div className="attempt-detail">
                        {student.attempts.map((attempt) => {
                          const failures = attempt.failed_questions || []
                          const aOpen = expandedAttempt === attempt.id
                          const passed = attempt.percent >= 50
                          return (
                            <div key={attempt.id} className="attempt-row">
                              <div
                                className="attempt-row-main"
                                role="button"
                                tabIndex={0}
                                aria-expanded={aOpen}
                                onClick={() => setExpandedAttempt(aOpen ? null : attempt.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    setExpandedAttempt(aOpen ? null : attempt.id)
                                  }
                                }}
                              >
                                <div className="attempt-body">
                                  <h4 className="attempt-title">
                                    {attempt.score}/{attempt.total}
                                  </h4>
                                  <p className="attempt-sub">
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
                                      style={{
                                        transform: `scaleX(${Math.max(attempt.percent, 3) / 100})`,
                                      }}
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
                                  title={aOpen ? 'Hide details' : 'Show details'}
                                  onClick={() => setExpandedAttempt(aOpen ? null : attempt.id)}
                                >
                                  {aOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                                </button>
                              </div>

                              {aOpen && (
                                <div className="attempt-detail attempt-detail--inner">
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
                                        <p className="review-wrong-answer">
                                          Your answer: {f.yourAnswer}
                                        </p>
                                        <p className="review-correct-answer">
                                          Correct answer: {f.correctAnswer}
                                        </p>
                                        {f.explanation && (
                                          <p className="review-explanation">
                                            Why: {f.explanation}
                                          </p>
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
        </>
      )}
    </div>
  )
}
