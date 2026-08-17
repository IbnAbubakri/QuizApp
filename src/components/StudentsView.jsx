import { useState, useEffect, useMemo, useRef } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import MessagePopup from './MessagePopup'

const initials = (name = '') =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

const formatJoined = (iso) => {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return null
  }
}

export default function StudentsView({ onBack }) {
  const [profiles, setProfiles] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [message, setMessage] = useState(null)
  const listRef = useRef(null)

  const scrollToStudents = () =>
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const loadData = async (opts = {}) => {
    const { silent = false } = opts
    if (!silent) setLoading(true)
    const [profilesRes, attemptsRes] = await Promise.all([
      supabase.rpc('list_students'),
      supabase
        .from('quiz_attempts')
        .select('*')
        .order('created_at', { ascending: false }),
    ])
    if (profilesRes.error) throw profilesRes.error
    if (attemptsRes.error) throw attemptsRes.error
    setProfiles(profilesRes.data || [])
    setAttempts(attemptsRes.data || [])
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    const id = setInterval(() => {
      loadData({ silent: true }).catch(() => {})
    }, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        await loadData()
      } catch (e) {
        setMessage({ text: 'Failed to load students: ' + e.message, tone: 'error' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const students = useMemo(() => {
    const map = new Map()
    for (const p of profiles) {
      map.set(p.id, {
        key: p.id,
        id: p.id,
        name: p.full_name || 'Student',
        email: p.email,
        joined: p.created_at,
        best: p.best_percent || 0,
        attempts: [],
      })
    }
    for (const attempt of attempts) {
      const holder = attempt.user_id && map.get(attempt.user_id)
      if (holder) {
        holder.attempts.push(attempt)
      } else {
        const key = `name:${attempt.student_name || 'Anonymous'}`
        if (!map.has(key)) {
          map.set(key, {
            key,
            id: null,
            name: attempt.student_name || 'Anonymous',
            email: '',
            joined: null,
            best: 0,
            attempts: [],
          })
        }
        map.get(key).attempts.push(attempt)
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [profiles, attempts])

  const stats = (student) => {
    const list = student.attempts
    const average = list.length
      ? Math.round(list.reduce((sum, a) => sum + (a.percent || 0), 0) / list.length)
      : 0
    const best = list.length ? Math.max(...list.map((a) => a.percent || 0)) : student.best
    const last = list.length ? new Date(list[0].created_at).toLocaleString() : null
    return { average, best, last }
  }

  const passingStudents = students.filter(
    (s) => s.attempts.length > 0 && stats(s).average >= 50
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
        <div className="admin-header-actions">
          <span className="live-note" title="New students appear automatically">
            <span className="dot" aria-hidden="true" />
            Live
          </span>
        </div>
      </header>

      <MessagePopup
        message={message?.text}
        tone={message?.tone || 'error'}
        onClose={() => setMessage(null)}
      />

      {profiles.length > 0 && (
        <div className="stat-grid">
          <button
            className="stat-card clickable"
            type="button"
            onClick={scrollToStudents}
            title="View all students"
          >
            <span className="stat-label">Students</span>
            <span className="stat-value">{profiles.length}</span>
            <span className="stat-sub">
              {passingStudents} averaging 50% or above
            </span>
          </button>
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
          No students yet. When a student registers and submits a result, they will appear here
          with their profile.
        </div>
      ) : (
        <div className="attempt-list" ref={listRef}>
          {students.map((student) => {
            const isOpen = expanded === student.key
            const joined = formatJoined(student.joined)
            return (
              <div key={student.key} className="attempt-row">
                <button
                  type="button"
                  className="attempt-row-main row-btn"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : student.key)}
                >
                  <span className="monogram">{initials(student.name)}</span>
                  <div className="attempt-body">
                    <h3 className="attempt-title">{student.name}</h3>
                    <p className="attempt-sub">
                      {student.email && (
                        <>
                          <span>{student.email}</span>
                          <span> · </span>
                        </>
                      )}
                      {joined ? (
                        <span className="attempt-date">joined {joined}</span>
                      ) : (
                        <span className="attempt-date">guest</span>
                      )}
                    </p>
                  </div>
                  <span className="chevron" aria-hidden="true">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>

                {isOpen && (
                  <div className="attempt-detail">
                    <div className="student-profile">
                      <span className="student-profile-avatar">{initials(student.name)}</span>
                      <div className="student-profile-body">
                        <h4>{student.name}</h4>
                        <p className="attempt-sub">{student.email || 'No email on file'}</p>
                        <p className="attempt-sub">
                          {joined ? `Joined ${joined}` : 'Guest — submitted without an account'}
                        </p>
                        {student.id && (
                          <p className="attempt-sub student-profile-id">Member ID: {student.id}</p>
                        )}
                      </div>
                    </div>
                    <p className="attempt-note">
                      <BarChart3 size={15} />
                      <span>This student&apos;s results are shown in the Results tab.</span>
                    </p>
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
