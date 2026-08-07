import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuiz, QUIZ_DURATION_MS } from './useQuiz'

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

  it('scores a correct answer and locks the selection', () => {
    const { result } = renderHook(() => useQuiz(questions))
    act(() => result.current.selectAnswer(1))
    expect(result.current.selected).toBe(1)
    expect(result.current.score).toBe(1)
    act(() => result.current.selectAnswer(0))
    expect(result.current.selected).toBe(1)
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
})
