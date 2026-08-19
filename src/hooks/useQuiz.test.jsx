import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuiz, QUIZ_DURATION_MS, topicDurationMs, formatDuration } from './useQuiz'

const questions = [
  { question: 'One?', options: ['A', 'B', 'C', 'D'], answer: 1, explanation: 'Because.' },
  { question: 'Two?', options: ['A', 'B', 'C', 'D'], answer: 2, explanation: '' },
]

describe('useQuiz', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts on the first question with no score', () => {
    const { result } = renderHook(() => useQuiz(questions))
    expect(result.current.current).toBe(0)
    expect(result.current.total).toBe(2)
    expect(result.current.score).toBe(0)
    expect(result.current.answeredCount).toBe(0)
    expect(result.current.finished).toBe(false)
  })

  it('scores a correct answer and lets the selection be changed', () => {
    const { result } = renderHook(() => useQuiz(questions))
    act(() => result.current.selectAnswer(1))
    expect(result.current.selected).toBe(1)
    expect(result.current.score).toBe(1)
    act(() => result.current.selectAnswer(0))
    expect(result.current.selected).toBe(0)
    expect(result.current.score).toBe(0)
    expect(result.current.answeredCount).toBe(1)
  })

  it('records wrong answers without scoring', () => {
    const { result } = renderHook(() => useQuiz(questions))
    act(() => result.current.selectAnswer(3))
    expect(result.current.score).toBe(0)
    expect(result.current.answeredCount).toBe(1)
    expect(result.current.answers[0].correct).toBe(false)
  })

  it('navigates next/prev and finishes on the last question', () => {
    const { result } = renderHook(() => useQuiz(questions))
    act(() => result.current.next())
    expect(result.current.current).toBe(1)
    act(() => result.current.prev())
    expect(result.current.current).toBe(0)
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.finished).toBe(true)
  })

  it('restarts cleanly', () => {
    const { result } = renderHook(() => useQuiz(questions))
    act(() => result.current.selectAnswer(1))
    act(() => result.current.next())
    act(() => result.current.restart())
    expect(result.current.current).toBe(0)
    expect(result.current.score).toBe(0)
    expect(result.current.answeredCount).toBe(0)
    expect(result.current.timeLeft).toBe(QUIZ_DURATION_MS)
  })

  it('auto-finishes when the timer runs out', () => {
    const { result } = renderHook(() => useQuiz(questions))
    act(() => {
      vi.advanceTimersByTime(QUIZ_DURATION_MS + 2000)
    })
    expect(result.current.finished).toBe(true)
    expect(result.current.timeLeft).toBe(0)
  })

  it('uses a custom duration when provided and resets to it on restart', () => {
    const custom = 2 * 60 * 60 * 1000
    const { result } = renderHook(() => useQuiz(questions, custom))
    expect(result.current.timeLeft).toBe(custom)
    act(() => result.current.selectAnswer(1))
    act(() => result.current.restart())
    expect(result.current.timeLeft).toBe(custom)
  })

  it('resets the timer to the provided duration when questions change', () => {
    const custom = 2 * 60 * 60 * 1000
    const { result, rerender } = renderHook(({ qs }) => useQuiz(qs, custom), {
      initialProps: { qs: questions },
    })
    act(() => result.current.selectAnswer(1))
    rerender({ qs: [...questions] })
    expect(result.current.timeLeft).toBe(custom)
  })

  it('returns the default duration for all topics', () => {
    expect(topicDurationMs({ name: 'Binary Number (Addition, Subtraction and Multiplication)' })).toBe(
      QUIZ_DURATION_MS
    )
    expect(topicDurationMs({ name: 'Number Basics' })).toBe(QUIZ_DURATION_MS)
    expect(topicDurationMs(null)).toBe(QUIZ_DURATION_MS)
  })

  it('formats durations for the start dialog', () => {
    expect(formatDuration(2 * 60 * 60 * 1000)).toBe('2 hours')
    expect(formatDuration(90 * 60 * 1000)).toBe('1 hour 30 minutes')
  })

  it('restores an in-progress quiz from a saved draft', () => {
    const initial = {
      current: 1,
      answers: [
        null,
        {
          question: 'Two?',
          chosen: 1,
          chosenText: 'A',
          correctText: 'C',
          explanation: '',
          correct: true,
        },
      ],
      timeLeft: 123000,
      finished: false,
    }
    const { result } = renderHook(() => useQuiz(questions, QUIZ_DURATION_MS, initial))
    expect(result.current.current).toBe(1)
    expect(result.current.timeLeft).toBe(123000)
    expect(result.current.score).toBe(1)
    expect(result.current.answeredCount).toBe(1)
    expect(result.current.selected).toBe(1)
  })

  it('lets a restored draft be restarted cleanly', () => {
    const initial = { current: 1, answers: [null, null], timeLeft: 90000, finished: false }
    const { result } = renderHook(() => useQuiz(questions, QUIZ_DURATION_MS, initial))
    act(() => result.current.restart())
    expect(result.current.current).toBe(0)
    expect(result.current.answers).toEqual([null, null])
    expect(result.current.timeLeft).toBe(QUIZ_DURATION_MS)
  })
})
