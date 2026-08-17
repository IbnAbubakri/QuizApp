import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StudentsView from './StudentsView'

const makeChain = (result) => {
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
  supabase: { rpc: vi.fn(), from: vi.fn() },
}))

import { supabase } from '../lib/supabase'

const profiles = [
  { id: 'u1', full_name: 'Ali B', email: 'ali@school.com', created_at: '2026-08-01T10:00:00Z', best_percent: 80 },
]

const attempts = [
  {
    id: 'a1',
    user_id: 'u1',
    student_name: 'Ali B',
    percent: 80,
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'a2',
    user_id: null,
    student_name: 'Guesty',
    percent: 40,
    created_at: '2026-08-02T10:00:00Z',
  },
]

beforeEach(() => {
  supabase.rpc.mockReset()
  supabase.rpc.mockResolvedValue({ data: profiles, error: null })
  supabase.from.mockReturnValue(makeChain({ data: attempts, error: null }))
})

describe('StudentsView', () => {
  it('lists registered students and groups guest attempts', async () => {
    render(<StudentsView onBack={vi.fn()} />)
    expect(await screen.findByText('Ali B')).toBeInTheDocument()
    expect(await screen.findByText('Guesty')).toBeInTheDocument()
    expect(screen.getByText('ali@school.com')).toBeInTheDocument()
  })

  it('expands a student profile with their member id', async () => {
    render(<StudentsView onBack={vi.fn()} />)
    const row = await screen.findByRole('button', { name: /Ali B/ })
    expect(row).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(row)
    expect(await screen.findByText(/Member ID: u1/)).toBeInTheDocument()
  })

  it('shows the empty state when there are no students', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null })
    supabase.from.mockReturnValue(makeChain({ data: [], error: null }))
    render(<StudentsView onBack={vi.fn()} />)
    expect(
      await screen.findByText(/No students yet/)
    ).toBeInTheDocument()
  })
})
