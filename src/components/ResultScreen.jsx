import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, Home, CheckCircle2, XCircle, Trophy, PartyPopper, Smile, Dumbbell } from 'lucide-react'
import TopicIcon from './TopicIcon'

const CIRC = 2 * Math.PI * 52

const CONFETTI_COLORS = ['#4f46e5', '#7c5cf0', '#f59e0b', '#0d9668', '#06b6d4', '#f97316']

const rand = (min, max) => min + Math.random() * (max - min)

export default function ResultScreen({ topic, quiz, onRestart, onExit }) {
  const { score, total, answers, answeredCount } = quiz
  const percent = total > 0 ? Math.round((score / total) * 100) : 0

  const [displayPercent, setDisplayPercent] = useState(0)

  useEffect(() => {
    let raf
    const start = performance.now()
    const duration = 1200
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      setDisplayPercent(Math.round((1 - Math.pow(1 - p, 3)) * percent))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [percent])

  const confetti = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        left: rand(0, 100),
        delay: rand(0, 2.2),
        duration: rand(2.6, 4.6),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        width: rand(6, 10),
        height: rand(10, 16),
        drift: rand(-90, 90),
        spin: rand(420, 900),
        radius: i % 3 === 0 ? '50%' : '2px',
      })),
    []
  )

  const ResultEmoji =
    percent === 100 ? Trophy : percent >= 80 ? PartyPopper : percent >= 60 ? Smile : Dumbbell
  const message =
    percent === 100
      ? 'Perfect score! You are a math superstar!'
      : percent >= 80
        ? 'Great job! Almost there.'
        : percent >= 60
          ? 'Good effort! Keep practicing.'
          : 'Keep going — practice makes perfect!'

  return (
    <div className="result" id="main-content">
      {percent >= 60 && (
        <div className="confetti" aria-hidden="true">
          {confetti.map((c) => (
            <span
              key={c.id}
              className="confetti-piece"
              style={{
                left: `${c.left}%`,
                width: c.width,
                height: c.height,
                background: c.color,
                borderRadius: c.radius,
                animationDuration: `${c.duration}s`,
                animationDelay: `${c.delay}s`,
                '--drift': `${c.drift}px`,
                '--spin': `${c.spin}deg`,
              }}
            />
          ))}
        </div>
      )}

      <div className="page-top">
        <button className="back-btn" onClick={onExit} aria-label="Back to topics">
          <Home size={16} />
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
              <h1 className="page-hero-title">Quiz complete!</h1>
              <p className="page-hero-sub">{topic.name}</p>
            </div>
          </div>
          <span className="page-hero-count">
            {score} / {total} correct
          </span>
        </div>
      </section>

      <div className="result-card entrance" style={{ '--accent': topic.accent || '#4f46e5' }}>
        <div className="result-emoji">
          <ResultEmoji size={44} />
        </div>

        <div className="score-ring-wrap">
          <svg className="score-ring" viewBox="0 0 120 120" aria-hidden="true">
            <circle className="ring-bg" cx="60" cy="60" r="52" fill="none" strokeWidth="11" />
            <circle
              className="ring-fg"
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - displayPercent / 100)}
            />
          </svg>
          <div className="score-ring-value">
            {displayPercent}
            <small>%</small>
          </div>
        </div>

        <p className="result-message">{message}</p>

        <div className="result-actions">
          <button className="primary-btn" onClick={onRestart}>
            <RotateCcw size={18} />
            Try again
          </button>
          <button className="secondary-btn" onClick={onExit}>
            <Home size={18} />
            Topics
          </button>
        </div>
      </div>

      <div className="dash-section-head">
        <h2>Review your answers</h2>
        <span className="dash-section-count">{answeredCount}</span>
      </div>

      <div className="review">
        {answers
          .map((a, i) =>
            a
              ? {
                  number: i + 1,
                  question: a.question,
                  chosenText: a.chosenText,
                  correctText: a.correctText,
                  explanation: a.explanation || '',
                  correct: a.correct,
                }
              : null
          )
          .filter(Boolean)
          .map((a, i) => (
          <div
            key={a.number}
            className={`review-item entrance ${a.correct ? 'correct' : 'wrong'}`}
            style={{ '--delay': `${Math.min(i * 45, 700)}ms` }}
          >
            <div className="review-icon">
              {a.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            </div>
            <div className="review-body">
              <p className="review-question">
                {a.number}. {a.question}
              </p>
              {!a.correct && (
                <p className="review-wrong-answer">Your answer: {a.chosenText}</p>
              )}
              {!a.correct && (
                <p className="review-correct-answer">Correct answer: {a.correctText}</p>
              )}
              {!a.correct && a.explanation && (
                <p className="review-explanation">Why: {a.explanation}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
