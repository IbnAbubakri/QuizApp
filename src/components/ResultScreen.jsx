import { RotateCcw, Home, CheckCircle2, XCircle } from 'lucide-react'

const CIRC = 2 * Math.PI * 52

export default function ResultScreen({ topic, quiz, onRestart, onExit }) {
  const { score, total, answers, answeredCount } = quiz
  const percent = total > 0 ? Math.round((score / total) * 100) : 0

  const emoji = percent === 100 ? '🏆' : percent >= 80 ? '🎉' : percent >= 60 ? '🙂' : '💪'
  const message =
    percent === 100
      ? 'Perfect score! You are a math superstar!'
      : percent >= 80
        ? 'Great job! Almost there.'
        : percent >= 60
          ? 'Good effort! Keep practicing.'
          : 'Keep going — practice makes perfect!'

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
            <span className="page-hero-tile">{topic.emoji || '📘'}</span>
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

      <div className="result-card" style={{ '--accent': topic.accent || '#4f46e5' }}>
        <div className="result-emoji">{emoji}</div>

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
              strokeDashoffset={CIRC * (1 - percent / 100)}
            />
          </svg>
          <div className="score-ring-value">
            {percent}
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
          .map((a) => (
          <div key={a.number} className={`review-item ${a.correct ? 'correct' : 'wrong'}`}>
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
