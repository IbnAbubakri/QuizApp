import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResultsView from './ResultsView'

const makeChain = (result) => {
  const c = {
    select: vi.fn(() => c),
    eq: vi.fn(() => c),
    order: vi.fn(() => c),
    limit: vi.fn(() => c),
    insert: vi.fn(() => c),
    update: vi.fn(() => c),
    delete: vi.fn(() => c),
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

const topics = [{ id: 't1', name: 'Space Math', accent: '#4f46e5' }]

const attempts = [
  {
    id: 'a1',
    topic_id: 't1',
    topic_name: 'Space Math',
    student_name: 'Ali B',
    user_id: 'u1',
    score: 8,
    total: 10,
    percent: 80,
    created_at: '2026-08-01T10:00:00Z',
    failed_questions: [
      { number: 3, question: 'What is 2 + 2?', yourAnswer: null, correctAnswer: '4', explanation: 'Because.' },
    ],
  },
]

let fromChain

beforeEach(() => {
  fromChain = makeChain({ data: attempts, error: null })
  supabase.from.mockReturnValue(fromChain)
})

describe('ResultsView', () => {
  it('shows topic cards grouped from attempts', async () => {
    render(<ResultsView topics={topics} onBack={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: 'Student Results' })).toBeInTheDocument()
    const card = await screen.findByRole('button', { name: /Space Math/ })
    expect(card).toBeInTheDocument()
  })

  it('shows a notice when there are no attempts', async () => {
    fromChain = makeChain({ data: [], error: null })
    supabase.from.mockReturnValue(fromChain)
    render(<ResultsView topics={topics} onBack={vi.fn()} />)
    expect(
      await screen.findByText(/No results yet/)
    ).toBeInTheDocument()
  })

  it('drills into a topic, then a student, then an attempt', async () => {
    render(<ResultsView topics={topics} onBack={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Space Math/ }))

    const studentRow = await screen.findByRole('button', { name: /Ali B/ })
    fireEvent.click(studentRow)

    const attemptRow = await screen.findByRole('button', { name: /8\/10/ })
    fireEvent.click(attemptRow)

    expect(await screen.findByText('#3')).toBeInTheDocument()
    expect(screen.getByText('Your answer: Not answered')).toBeInTheDocument()
    expect(screen.getByText('Correct answer: 4')).toBeInTheDocument()
    expect(screen.getByText('Why: Because.')).toBeInTheDocument()
  })

  it('deletes an attempt after confirmation', async () => {
    render(<ResultsView topics={topics} onBack={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Space Math/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Ali B/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Delete result' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(fromChain.delete).toHaveBeenCalled())
    expect(fromChain.delete.mock.calls[0][0]).toBeUndefined()
  })
})
