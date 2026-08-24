import { useState, useEffect, useCallback } from 'react'

export const QUIZ_DURATION_MS = 90 * 60 * 1000

export const topicDurationMs = () => QUIZ_DURATION_MS

export const formatDuration = (ms) => {
  const minutes = Math.round(ms / 60000)
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    const hours = `${h} hour${h > 1 ? 's' : ''}`
    return m === 0 ? hours : `${hours} ${m} minute${m > 1 ? 's' : ''}`
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`
}

export function useQuiz(questions, durationMs = QUIZ_DURATION_MS, initial = null) {
  const [current, setCurrent] = useState(initial?.current ?? 0)
  const [answers, setAnswers] = useState(
    initial?.answers ?? Array(questions.length).fill(null)
  )
  const [finished, setFinished] = useState(initial?.finished ?? false)
  const [timedOut, setTimedOut] = useState(false)
  const [timeLeft, setTimeLeft] = useState(initial?.timeLeft ?? durationMs)

  const question = questions[current]
  const selected = question ? (answers[current]?.chosen ?? null) : null
  const score = answers.filter(Boolean).filter((a) => a.correct).length
  const answeredCount = answers.filter(Boolean).length

  useEffect(() => {
    if (initial) {
      setAnswers(initial.answers ?? Array(questions.length).fill(null))
      setCurrent(initial.current ?? 0)
      setFinished(!!initial.finished)
      setTimedOut(!!initial.timedOut)
      setTimeLeft(initial.timeLeft ?? durationMs)
    } else {
      setAnswers(Array(questions.length).fill(null))
      setCurrent(0)
      setFinished(false)
      setTimeLeft(durationMs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, durationMs])

  useEffect(() => {
    if (finished) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1000) {
          clearInterval(interval)
          setFinished(true)
          setTimedOut(true)
          return 0
        }
        return t - 1000
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [finished])

  const selectAnswer = useCallback(
    (index) => {
      if (!question) return
      setAnswers((prev) => {
        const next = [...prev]
        next[current] = {
          id: question.id,
          question: question.question,
          chosen: index,
          chosenText: question.options[index],
          correctText: question.options[question.answer],
          explanation: question.explanation || '',
          correct: index === question.answer,
        }
        return next
      })
    },
    [question, current]
  )

  const goTo = useCallback(
    (index) => {
      if (index < 0 || index >= questions.length) return
      setCurrent(index)
    },
    [questions.length]
  )

  const next = useCallback(() => {
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1)
    } else {
      setFinished(true)
    }
  }, [current, questions.length])

  const prev = useCallback(() => {
    setCurrent((c) => Math.max(0, c - 1))
  }, [])

  const restart = useCallback(() => {
    setCurrent(0)
    setAnswers(Array(questions.length).fill(null))
    setFinished(false)
    setTimedOut(false)
    setTimeLeft(durationMs)
  }, [questions.length, durationMs])

  return {
    question,
    current,
    total: questions.length,
    selected,
    answers,
    score,
    answeredCount,
    finished,
    timedOut,
    timeLeft,
    selectAnswer,
    goTo,
    next,
    prev,
    restart,
  }
}
