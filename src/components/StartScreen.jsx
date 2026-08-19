import { useState } from 'react'
import { LogOut, UserRound, BarChart3, Brain, Lock, Play, Trash2 } from 'lucide-react'
import { displayName } from '../lib/AuthContext'
import Logo from './Logo'
import ConfirmDialog from './ConfirmDialog'
import MessagePopup from './MessagePopup'
import TopicIcon from './TopicIcon'
import { topicDurationMs, formatDuration } from '../hooks/useQuiz'

export default function StartScreen({
  topics,
  loading,
  error,
  user,
  onLogout,
  onDashboard,
  onSelect,
  draft,
  onResume,
  onDiscard,
}) {
  const [confirmTopic, setConfirmTopic] = useState(null)
  const [lockedMsg, setLockedMsg] = useState('')
  const firstName =
    user?.user_metadata?.full_name?.trim().split(/\s+/)[0] ||
    (user?.email || '').split('@')[0] ||
    'there'
  const prettyName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  const totalQuestions = topics.reduce((sum, t) => {
    const count = t.question_count || 0
    return sum + Math.min(count, 50)
  }, 0)
  const isLocked = (t) => t.is_open === false

  const handleTopicClick = (topic) => {
    if (isLocked(topic)) {
      setLockedMsg(`"${topic.name}" is not available at the moment. Mr. Faaruq hasn't opened it yet.`)
      return
    }
    setConfirmTopic(topic)
  }

  return (
    <div className="home">
      <header className="topbar">
        <Logo withText />
        <div className="topbar-right">
          <span className="topbar-user">
            <span className="topbar-user-avatar">
              <UserRound size={15} />
            </span>
            <span className="topbar-user-name">{displayName(user) || 'Student'}</span>
          </span>
          <button className="topbar-logout" onClick={onLogout} aria-label="Log out">
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </header>

      <section className="dash-hero home-hero entrance">
        <div className="dash-hero-body">
          <p className="dash-hero-eyebrow">
            <Brain size={15} />
            Math practice
          </p>
          <h1 className="dash-hero-title">Hi, {prettyName}</h1>
          <p className="dash-hero-sub">
            Pick a topic below and take a multiple-choice quiz. See how many you can get right!
          </p>
          <div className="dash-hero-stats">
            <div className="dash-hero-stat">
              <span className="dash-hero-stat-value">{topics.length}</span>
              <span className="dash-hero-stat-label">Topics</span>
            </div>
            <div className="dash-hero-stat">
              <span className="dash-hero-stat-value">{totalQuestions}</span>
              <span className="dash-hero-stat-label">Questions</span>
            </div>
          </div>
          <button className="dash-hero-cta" onClick={onDashboard}>
            <BarChart3 size={18} />
            My results
          </button>
        </div>

        <div className="dash-hero-side">
          <div className="dash-hero-placeholder">
            <Brain />
          </div>
          <p className="dash-hero-ring-label">Ready to practice</p>
        </div>
      </section>

      {loading && (
        <div className="categories" aria-label="Loading topics">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-card skeleton">
              <span className="skeleton-tile skeleton" />
              <div className="skeleton-lines">
                <span className="skeleton-line skeleton" style={{ width: '55%' }} />
                <span className="skeleton-line skeleton" style={{ width: '90%' }} />
                <span className="skeleton-line skeleton" style={{ width: '35%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="notice error">
          <strong>Could not load topics.</strong> Make sure your Supabase project is set up
          (SQL schema + <code>.env</code> keys).
          <div className="notice-error-detail">{error}</div>
        </div>
      )}

      {!loading && !error && topics.length === 0 && (
        <div className="notice">
          No topics yet. Open the admin panel to create your first topic and questions.
        </div>
      )}

      {!loading && topics.length > 0 && (
        <>
          {draft && (
            <div className="resume-banner entrance" role="region" aria-label="Resume quiz">
              <div className="resume-banner-icon">
                <Play size={18} />
              </div>
              <div className="resume-banner-body">
                <strong>You have a quiz in progress</strong>
                <p>
                  &quot;{draft.topic?.name}&quot; ·{' '}
                  {(draft.answers || []).filter(Boolean).length} answered so far
                </p>
              </div>
              <div className="resume-banner-actions">
                <button className="primary-btn" onClick={onResume}>
                  Resume
                </button>
                <button
                  className="icon-btn resume-discard"
                  onClick={onDiscard}
                  aria-label="Discard draft"
                  title="Discard draft"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
          <div className="dash-section-head">
            <h2>Choose a topic</h2>
            <span className="dash-section-count">{topics.length}</span>
          </div>
          <div className="categories">
            {topics.map((topic, index) => {
              const locked = isLocked(topic)
              return (
                <button
                  key={topic.id}
                  className={`category-card entrance ${locked ? 'locked' : ''}`}
                  style={{ '--accent': topic.accent || '#4f46e5', '--delay': `${Math.min(index * 45, 500)}ms` }}
                  onClick={() => handleTopicClick(topic)}
                  title={locked ? 'Not available yet' : undefined}
                >
                  <div className="category-emoji">
                    <TopicIcon topic={topic} size={26} />
                  </div>
                  <div className="category-body">
                    <h3>{topic.name}</h3>
                    <p>{topic.description}</p>
                    {locked ? (
                      <span className="category-meta locked">
                        <Lock size={12} />
                        Not available
                      </span>
                    ) : (
                      <span className="category-meta">
                        {Math.min(topic.question_count ?? 0, 50)} questions
                      </span>
                    )}
                  </div>
                  {locked && (
                    <span className="category-lock-badge" aria-hidden="true">
                      <Lock size={16} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}

      <MessagePopup
        message={lockedMsg}
        tone="info"
        icon={Lock}
        autoDismiss={4000}
        onClose={() => setLockedMsg('')}
      />

      <ConfirmDialog
        open={confirmTopic !== null}
        title="Start quiz?"
        message={`Are you sure you want to start the "${confirmTopic?.name}" quiz? Your ${formatDuration(topicDurationMs(confirmTopic))} timer will begin.`}
        confirmLabel="Yes, start"
        cancelLabel="No, go back"
        onConfirm={() => {
          const topic = confirmTopic
          setConfirmTopic(null)
          onSelect(topic)
        }}
        onCancel={() => setConfirmTopic(null)}
      />
    </div>
  )
}
