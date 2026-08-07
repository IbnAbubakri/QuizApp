import { useState, useEffect, useCallback } from 'react'

export const QUIZ_DURATION_MS = 90 * 60 * 1000

export function useQuiz(questions) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_MS)

  const question = questions[current]
  const selected = question ? (answers[current]?.chosen ?? null) : null
  const score = answers.filter(Boolean).filter((a) => a.correct).length
  const answeredCount = answers.filter(Boolean).length

  useEffect(() => {
    setAnswers(Array(questions.length).fill(null))
    setCurrent(0)
    setFinished(false)
  }, [questions])

  useEffect(() => {
    if (finished) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1000) {
          clearInterval(interval)
          setFinished(true)
          return 0
        }
        return t - 1000
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [finished])

  const selectAnswer = useCallback(
    (index) => {
      if (!question || selected !== null) return
      setAnswers((prev) => {
        const next = [...prev]
        next[current] = {
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
    [question, current, selected]
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
    setTimeLeft(QUIZ_DURATION_MS)
  }, [questions.length])

  return {
    question,
    current,
    total: questions.length,
    selected,
    answers,
    score,
    answeredCount,
    finished,
    timeLeft,
    selectAnswer,
    goTo,
    next,
    prev,
    restart,
  }
}
