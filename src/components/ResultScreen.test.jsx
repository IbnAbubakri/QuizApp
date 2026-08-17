import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResultScreen from './ResultScreen'

const topic = { id: 't1', name: 'Space Math', accent: '#4f46e5' }

beforeEach(() => {
  global.requestAnimationFrame = () => 1
  global.cancelAnimationFrame = () => {}
})

describe('ResultScreen', () => {
  const answers = [
    { question: 'What is 2 + 2?', chosenText: '5', correctText: '4', explanation: 'Two plus two is four.', correct: false },
    { question: 'Is water wet?', chosenText: 'Yes', correctText: 'Yes', explanation: '', correct: true },
  ]

  it('shows a perfect-score message at 100%', () => {
    render(
      <ResultScreen
        topic={topic}
        quiz={{ score: 4, total: 4, answers, answeredCount: 4 }}
        onRestart={vi.fn()}
        onExit={vi.fn()}
      />
    )
    expect(screen.getByText('Perfect score! You are a math superstar!')).toBeInTheDocument()
    expect(screen.getByText('4 / 4 correct')).toBeInTheDocument()
  })

  it('encourages practice on a low score', () => {
    render(
      <ResultScreen
        topic={topic}
        quiz={{ score: 1, total: 10, answers, answeredCount: 2 }}
        onRestart={vi.fn()}
        onExit={vi.fn()}
      />
    )
    expect(screen.getByText('Keep going — practice makes perfect!')).toBeInTheDocument()
  })

  it('lists review items with correct and wrong answers', () => {
    render(
      <ResultScreen
        topic={topic}
        quiz={{ score: 1, total: 2, answers, answeredCount: 2 }}
        onRestart={vi.fn()}
        onExit={vi.fn()}
      />
    )
    expect(screen.getByText('Review your answers')).toBeInTheDocument()
    expect(screen.getByText('1. What is 2 + 2?')).toBeInTheDocument()
    expect(screen.getByText('Your answer: 5')).toBeInTheDocument()
    expect(screen.getByText('Correct answer: 4')).toBeInTheDocument()
    expect(screen.getByText('Why: Two plus two is four.')).toBeInTheDocument()
    expect(screen.getByText('2. Is water wet?')).toBeInTheDocument()
  })

  it('wires up the Try again and Topics buttons', () => {
    const onRestart = vi.fn()
    const onExit = vi.fn()
    render(
      <ResultScreen
        topic={topic}
        quiz={{ score: 5, total: 10, answers, answeredCount: 2 }}
        onRestart={onRestart}
        onExit={onExit}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRestart).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^Topics$/ }))
    expect(onExit).toHaveBeenCalled()
  })
})
