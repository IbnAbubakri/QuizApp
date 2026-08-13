import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StartScreen from './StartScreen'

const user = { user_metadata: { full_name: 'Faaruq Student' }, email: 'student@example.com' }

const topics = [
  {
    id: 't1',
    name: 'Number Basics',
    description: 'Foundations',
    question_count: 5,
    is_open: true,
    accent: '#4f46e5',
  },
  {
    id: 't2',
    name: 'Algebra',
    description: 'Locked topic',
    question_count: 3,
    is_open: false,
    accent: '#0ea5e9',
  },
]

const baseProps = {
  topics,
  loading: false,
  error: null,
  user,
  onLogout: vi.fn(),
  onDashboard: vi.fn(),
  onSelect: vi.fn(),
}

describe('StartScreen', () => {
  it('lists topics and their question counts', () => {
    render(<StartScreen {...baseProps} />)
    expect(screen.getByText('Number Basics')).toBeInTheDocument()
    expect(screen.getByText('5 questions')).toBeInTheDocument()
  })

  it('marks locked topics as unavailable', () => {
    render(<StartScreen {...baseProps} />)
    expect(screen.getByText('Algebra')).toBeInTheDocument()
    expect(screen.getByText('Not available')).toBeInTheDocument()
  })

  it('shows a resume banner when a draft exists', () => {
    const draft = {
      topic: { name: 'Number Basics' },
      answers: [null, { correct: true }, null],
    }
    render(<StartScreen {...baseProps} draft={draft} onResume={vi.fn()} onDiscard={vi.fn()} />)
    expect(screen.getByRole('region', { name: 'Resume quiz' })).toBeInTheDocument()
    expect(screen.getByText(/quiz in progress/i)).toBeInTheDocument()
    expect(screen.getByText(/1 answered so far/i)).toBeInTheDocument()
  })

  it('does not show the resume banner without a draft', () => {
    render(<StartScreen {...baseProps} />)
    expect(screen.queryByRole('region', { name: 'Resume quiz' })).not.toBeInTheDocument()
  })

  it('resumes and discards via the banner buttons', () => {
    const onResume = vi.fn()
    const onDiscard = vi.fn()
    const draft = { topic: { name: 'Number Basics' }, answers: [] }
    render(
      <StartScreen {...baseProps} draft={draft} onResume={onResume} onDiscard={onDiscard} />
    )
    fireEvent.click(screen.getByRole('button', { name: /^resume$/i }))
    expect(onResume).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Discard draft' }))
    expect(onDiscard).toHaveBeenCalledTimes(1)
  })

  it('confirms before starting an open topic', () => {
    const onSelect = vi.fn()
    render(<StartScreen {...baseProps} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /number basics/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, start' }))
    expect(onSelect).toHaveBeenCalledWith(topics[0])
  })
})
