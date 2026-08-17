import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import QuestionManager from './QuestionManager'

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

const topic = { id: 't1', name: 'Space Math', accent: '#4f46e5' }

const questions = [
  { id: 'q1', question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], answer: 1, explanation: 'Because.' },
]

let fromChain

beforeEach(() => {
  window.scrollTo = vi.fn()
  fromChain = makeChain({ data: questions, error: null })
  supabase.from.mockReturnValue(fromChain)
})

describe('QuestionManager', () => {
  it('loads and lists questions for the topic', async () => {
    render(<QuestionManager topic={topic} onBack={vi.fn()} onRefresh={vi.fn()} />)
    expect(await screen.findByText('What is 2 + 2?')).toBeInTheDocument()
    expect(screen.getByText('A. 3')).toBeInTheDocument()
    expect(screen.getByText('B. 4')).toBeInTheDocument()
  })

  it('shows an error when questions fail to load', async () => {
    fromChain = makeChain({ data: [], error: { message: 'nope' } })
    supabase.from.mockReturnValue(fromChain)
    render(<QuestionManager topic={topic} onBack={vi.fn()} onRefresh={vi.fn()} />)
    expect(await screen.findByText('Failed to load questions: nope')).toBeInTheDocument()
  })

  it('requires a question and all four options', async () => {
    render(<QuestionManager topic={topic} onBack={vi.fn()} onRefresh={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add question' }))
    const form = document.querySelector('form')
    fireEvent.submit(form)
    expect(
      await screen.findByText('Please fill in the question and all four options.')
    ).toBeInTheDocument()
    expect(fromChain.insert).not.toHaveBeenCalled()
  })

  it('inserts a valid question and refreshes', async () => {
    const onRefresh = vi.fn()
    render(<QuestionManager topic={topic} onBack={vi.fn()} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add question' }))

    const textboxes = screen.getAllByRole('textbox')
    fireEvent.change(textboxes[0], { target: { value: 'What is 12 × 8?' } })
    fireEvent.change(textboxes[1], { target: { value: '86' } })
    fireEvent.change(textboxes[2], { target: { value: '96' } })
    fireEvent.change(textboxes[3], { target: { value: '68' } })
    fireEvent.change(textboxes[4], { target: { value: '99' } })

    const form = document.querySelector('form')
    fireEvent.submit(form)

    await waitFor(() => expect(fromChain.insert).toHaveBeenCalled())
    expect(fromChain.insert.mock.calls[0][0]).toEqual({
      topic_id: 't1',
      question: 'What is 12 × 8?',
      options: ['86', '96', '68', '99'],
      answer: 0,
      explanation: '',
    })
    expect(await screen.findByText('Question added')).toBeInTheDocument()
    expect(onRefresh).toHaveBeenCalled()
  })

  it('deletes a question after confirmation', async () => {
    render(<QuestionManager topic={topic} onBack={vi.fn()} onRefresh={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(fromChain.delete).toHaveBeenCalled())
  })
})
