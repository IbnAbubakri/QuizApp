import { useState } from 'react'
import { ArrowLeft, ArrowRight, Timer, Calculator as CalculatorIcon } from 'lucide-react'
import { saveAttempt } from '../lib/saveAttempt'
import ConfirmDialog from './ConfirmDialog'
import CalculatorModal from './CalculatorModal'
import TopicIcon from './TopicIcon'

const LOW_TIME_MS = 5 * 60 * 1000

const formatTime = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${h}:${pad(m)}:${pad(s)}`
}

export default function QuizScreen({ topic, quiz, user, onExit }) {
  const { question, current, total, selected, selectAnswer, goTo, next, prev, timeLeft, answers, score, answeredCount } =
    quiz
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0
  const urgent = timeLeft <= LOW_TIME_MS
  const [confirmExit, setConfirmExit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [calcOpen, setCalcOpen] = useState(false)

  const handleExit = async () => {
    setSaving(true)
    setSaveError('')
    const error = await saveAttempt({ user, topic, score, total, answers })
    setSaving(false)
    if (error) {
      setSaveError('Could not save your result. Please check your connection and try again.')
      return
    }
    setConfirmExit(false)
    onExit()
  }

  if (!question) {
    return (
      <div className="notice">
        This topic has no questions yet. Ask Mr. Faaruq to add some!
        <div style={{ marginTop: 14 }}>
          <button className="primary-btn" onClick={onExit}>Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz">
      <div className="page-top">
        <button
          className="back-btn"
          onClick={() => setConfirmExit(true)}
          aria-label="Back to topics"
        >
          <ArrowLeft size={16} />
          <span>Topics</span>
        </button>
      </div>

      <section className="page-hero entrance">
        <div className="page-hero-inner">
          <div className="page-hero-main">
            <span className="page-hero-tile">
              <TopicIcon topic={topic} size={24} />
            </span>
            <div className="page-hero-body">
              <h1 className="page-hero-title">{topic.name}</h1>
              <p className="page-hero-sub">
                Select an answer — you can change it before you finish
              </p>
            </div>
          </div>
          <div className="page-hero-meta">
            <span className={`quiz-timer ${urgent ? 'urgent' : ''}`} title="Time remaining">
              <Timer size={15} />
              {formatTime(timeLeft)}
            </span>
            <button
              className="quiz-calc-btn"
              onClick={() => setCalcOpen(true)}
              aria-label="Open calculator"
              title="Open calculator"
            >
              <CalculatorIcon size={15} />
              <span>Calc</span>
            </button>
            <span className="page-hero-count">
              {current + 1} / {total}
            </span>
          </div>
        </div>
        <div className="page-hero-progress">
          <div
            className="page-hero-progress-fill"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
      </section>

      <div className="quiz-card entrance" style={{ '--accent': topic.accent || '#4f46e5' }}>
        <div key={current} className="question-enter" aria-live="polite">
          <span className="question-chip">Question {current + 1}</span>
          <h2 className="question-text">{question.question}</h2>

          <div className="options" role="group" aria-label="Answer options">
            {question.options.map((option, index) => (
              <button
                key={index}
                className={`option ${selected === index ? 'selected' : ''}`}
                onClick={() => selectAnswer(index)}
                aria-pressed={selected === index}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-nav-row">
          <button className="secondary-btn quiz-nav-btn" onClick={prev} disabled={current === 0}>
            <ArrowLeft size={16} />
            Previous
          </button>
          <button className="primary-btn quiz-nav-btn" onClick={next}>
            {current === total - 1 ? 'Finish' : 'Next'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <section className="question-nav entrance" aria-label="Jump to a question">
        <div className="question-nav-head">
          <h3>Questions</h3>
          <span className="question-nav-count">
            {answeredCount} of {total} answered
          </span>
        </div>
        <div className="question-nav-legend">
          <span>
            <i className="legend-dot current" /> Current
          </span>
          <span>
            <i className="legend-dot answered" /> Answered
          </span>
          <span>
            <i className="legend-dot plain" /> Not answered
          </span>
        </div>
        <div className="qnum-grid">
          {Array.from({ length: total }, (_, i) => {
            const answered = !!answers[i]
            let cls = 'qnum'
            if (answered) cls += ' answered'
            if (i === current) cls += ' current'
            return (
              <button
                key={i}
                className={cls}
                onClick={() => goTo(i)}
                aria-current={i === current ? 'step' : undefined}
                aria-label={`Question ${i + 1}, ${answered ? 'answered' : 'not answered'}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </section>

      <ConfirmDialog
        open={confirmExit}
        title="Exit quiz?"
        message="Are you sure you want to leave? Your result so far will be saved and sent to Mr. Faaruq."
        confirmLabel="Save & exit"
        cancelLabel="Keep going"
        busy={saving}
        error={saveError}
        onConfirm={handleExit}
        onCancel={() => setConfirmExit(false)}
      />

      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  )
}
