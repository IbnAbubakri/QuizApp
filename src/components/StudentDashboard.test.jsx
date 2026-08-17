import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StudentDashboard from './StudentDashboard'

const chain = (result) => {
  const c = {
    select: vi.fn(() => c),
    eq: vi.fn(() => c),
    order: vi.fn(() => c),
    limit: vi.fn(() => c),
  }
  Object.defineProperty(c, 'then', {
    value: (res, rej) => Promise.resolve(result).then(res, rej),
  })
  return c
}

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'

const user = { id: 'u1', email: 'a@b.com', user_metadata: { full_name: 'Ali B' } }

const attempts = [
  {
    id: 'a1',
    topic_name: 'Space Math',
    score: 8,
    total: 10,
    percent: 80,
    created_at: '2026-08-01T10:00:00Z',
    failed_questions: [
      { number: 3, question: 'What is 2 + 2?', yourAnswer: null, correctAnswer: '4', explanation: 'Because.' },
    ],
  },
]

beforeEach(() => {
  supabase.from.mockImplementation((table) =>
    table === 'topics'
      ? chain({ data: [{ id: 't1', name: 'Space Math', accent: '#4f46e5' }], error: null })
      : chain({ data: attempts, error: null })
  )
})

describe('StudentDashboard', () => {
  it('shows the student greeting and attempts', async () => {
    render(<StudentDashboard user={user} onBack={vi.fn()} />)
    expect(await screen.findByText('Hi, Ali')).toBeInTheDocument()
    expect(await screen.findByText('Space Math')).toBeInTheDocument()
    expect(screen.getByText('80%', { selector: '.dash-attempt-percent' })).toBeInTheDocument()
    expect(
      screen.getByText((content, el) => el.classList.contains('dash-attempt-sub') && el.textContent.includes('8/10 correct'))
    ).toBeInTheDocument()
  })

  it('expands an attempt to review missed questions', async () => {
    render(<StudentDashboard user={user} onBack={vi.fn()} />)
    const row = await screen.findByRole('button', { name: /Space Math/ })
    expect(row).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(row)
    expect(await screen.findByText('#3')).toBeInTheDocument()
    expect(screen.getByText('Your answer: Not answered')).toBeInTheDocument()
    expect(screen.getByText('Correct answer: 4')).toBeInTheDocument()
  })

  it('shows the empty state when there are no attempts', async () => {
    supabase.from.mockImplementation((table) =>
      table === 'topics'
        ? chain({ data: [], error: null })
        : chain({ data: [], error: null })
    )
    render(<StudentDashboard user={user} onBack={vi.fn()} />)
    expect(await screen.findByText('No results yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /take a quiz/i }).length).toBeGreaterThan(0)
  })
})
