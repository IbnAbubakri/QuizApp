import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuizScreen from './QuizScreen'
import { useQuiz } from '../hooks/useQuiz'

const questions = [
  {
    question: 'Which planet is closest to the Sun?',
    options: ['Venus', 'Mercury', 'Mars', 'Earth'],
    answer: 1,
    explanation: 'Mercury is the closest planet to the Sun.',
  },
  {
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    answer: 1,
    explanation: 'Two plus two is four.',
  },
]

const topic = { id: 't1', name: 'Space Math', accent: '#4f46e5' }

function Harness({ onExit = vi.fn() }) {
  const quiz = useQuiz(questions, 60000)
  return <QuizScreen topic={topic} quiz={quiz} user={{ id: 'u1' }} onExit={onExit} />
}

describe('QuizScreen', () => {
  it('renders the question and options', () => {
    render(<Harness />)
    expect(screen.getByRole('heading', { name: 'Which planet is closest to the Sun?' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).not.toHaveLength(0)
    expect(screen.getByText('Venus')).toBeInTheDocument()
    expect(screen.getByText('Mercury')).toBeInTheDocument()
  })

  it('announces question changes to screen readers', () => {
    const { container } = render(<Harness />)
    expect(container.querySelector('.question-enter')).toHaveAttribute('aria-live', 'polite')
  })

  it('marks the selected option with aria-pressed', () => {
    render(<Harness />)
    const venus = screen.getByText('Venus').closest('button')
    const mercury = screen.getByText('Mercury').closest('button')
    expect(venus).toHaveAttribute('aria-pressed', 'false')
    expect(mercury).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(mercury)
    expect(mercury).toHaveAttribute('aria-pressed', 'true')
    expect(venus).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(venus)
    expect(venus).toHaveAttribute('aria-pressed', 'true')
    expect(mercury).toHaveAttribute('aria-pressed', 'false')
  })

  it('moves to the next question and updates the count', () => {
    render(<Harness />)
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('heading', { name: 'What is 2 + 2?' })).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('offers a Finish button on the last question', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument()
  })

  it('opens a calculator overlay without leaving the quiz', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Open calculator' }))
    expect(screen.getByRole('button', { name: 'AC' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Which planet is closest to the Sun?' })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close calculator' }))
    expect(screen.queryByRole('button', { name: 'AC' })).not.toBeInTheDocument()
  })

  it('keeps the quiz answerable while the calculator is open', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Open calculator' }))
    const mercury = screen.getByText('Mercury').closest('button')
    fireEvent.click(mercury)
    expect(mercury).toHaveAttribute('aria-pressed', 'true')
  })
})
