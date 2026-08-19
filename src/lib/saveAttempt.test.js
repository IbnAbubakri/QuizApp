import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { saveAttempt } from './saveAttempt'
import { supabase } from './supabase'

beforeEach(() => {
  supabase.rpc.mockReset()
  supabase.rpc.mockResolvedValue({ error: null })
})

describe('saveAttempt', () => {
  it('calls submit_attempt with answers keyed by question id', async () => {
    await saveAttempt({
      topic: { id: 't1' },
      questions: [{ id: 'q1' }, { id: 'q2' }],
      answers: [{ chosen: 0 }, { chosen: null }],
    })
    expect(supabase.rpc).toHaveBeenCalledWith('submit_attempt', {
      p_topic_id: 't1',
      p_answers: { q1: 0, q2: null },
    })
  })

  it('maps missing answers to null', async () => {
    await saveAttempt({
      topic: { id: 't1' },
      questions: [{ id: 'q1' }, { id: 'q2' }],
      answers: [],
    })
    expect(supabase.rpc).toHaveBeenCalledWith('submit_attempt', {
      p_topic_id: 't1',
      p_answers: { q1: null, q2: null },
    })
  })

  it('returns the rpc error when submission fails', async () => {
    supabase.rpc.mockResolvedValue({ error: { message: 'boom' } })
    const error = await saveAttempt({
      topic: { id: 't1' },
      questions: [],
      answers: [],
    })
    expect(error.message).toBe('boom')
  })

  it('returns null on success', async () => {
    const error = await saveAttempt({
      topic: { id: 't1' },
      questions: [],
      answers: [],
    })
    expect(error).toBeNull()
  })
})
