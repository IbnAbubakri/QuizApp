import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SubmitScreen from './SubmitScreen'

const { saveAttempt } = vi.hoisted(() => ({ saveAttempt: vi.fn() }))
const { displayName } = vi.hoisted(() => ({ displayName: vi.fn() }))

vi.mock('../lib/saveAttempt', () => ({ saveAttempt }))
vi.mock('../lib/AuthContext', () => ({ displayName }))

const topic = { id: 't1', name: 'Space Math', accent: '#4f46e5' }
const quiz = { score: 8, total: 10, answers: [{ chosen: 1 }] }
const questions = [{ id: 'q1' }]
const user = { id: 'u1', user_metadata: { full_name: 'Ali B' } }

beforeEach(() => {
  saveAttempt.mockReset()
  saveAttempt.mockResolvedValue(null)
  displayName.mockReset()
  displayName.mockReturnValue('Ali B')
})

describe('SubmitScreen', () => {
  it('summarises the score before submitting', () => {
    render(
      <SubmitScreen
        topic={topic}
        quiz={quiz}
        user={user}
        questions={questions}
        onSubmitted={vi.fn()}
        onExit={vi.fn()}
      />
    )
    expect(screen.getByText('You got 8 of 10 correct — submit to save your result.')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('Submitting as')).toBeInTheDocument()
    expect(screen.getByText('Ali B')).toBeInTheDocument()
  })

  it('submits the result and calls onSubmitted on success', async () => {
    const onSubmitted = vi.fn()
    render(
      <SubmitScreen
        topic={topic}
        quiz={quiz}
        user={user}
        questions={questions}
        onSubmitted={onSubmitted}
        onExit={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled())
    expect(saveAttempt).toHaveBeenCalledWith({ topic, questions, answers: quiz.answers })
  })

  it('shows an error and does not submit twice on failure', async () => {
    saveAttempt.mockResolvedValue({ message: 'network down' })
    const onSubmitted = vi.fn()
    render(
      <SubmitScreen
        topic={topic}
        quiz={quiz}
        user={user}
        questions={questions}
        onSubmitted={onSubmitted}
        onExit={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(
      await screen.findByText('Could not submit your result. Please check your connection and try again.')
    ).toBeInTheDocument()
    expect(onSubmitted).not.toHaveBeenCalled()
  })

  it('exits to topics without saving', () => {
    const onExit = vi.fn()
    render(
      <SubmitScreen
        topic={topic}
        quiz={quiz}
        user={user}
        questions={questions}
        onSubmitted={vi.fn()}
        onExit={onExit}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /^Topics$/ }))
    expect(onExit).toHaveBeenCalled()
  })
})
