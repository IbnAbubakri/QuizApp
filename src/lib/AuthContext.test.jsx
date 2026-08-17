import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth, displayName } from './AuthContext'

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

import { supabase } from './supabase'

beforeEach(() => {
  supabase.auth.getSession.mockReset()
  supabase.auth.onAuthStateChange.mockReset()
  supabase.auth.signUp.mockReset()
  supabase.auth.signInWithPassword.mockReset()
  supabase.auth.signOut.mockReset()
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
})

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('AuthContext', () => {
  it('throws when useAuth is used outside a provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    )
  })

  it('exposes the session user after initialization', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    })
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.initializing).toBe(true)
    await waitFor(() => expect(result.current.initializing).toBe(false))
    expect(result.current.user).toEqual({ id: 'u1' })
  })

  it('clears the user when signed out via auth events', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user).toEqual({ id: 'u1' }))

    const onChange = supabase.auth.onAuthStateChange.mock.calls[0][0]
    act(() => onChange('SIGNED_OUT', null))
    expect(result.current.user).toBeNull()
  })

  it('signUp sends full_name in user metadata', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    })
    supabase.auth.signUp.mockResolvedValue({ data: {}, error: null })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.signUp({ name: 'Ali B', email: 'a@b.com', password: 'Passw0rd!' })
    })
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'Passw0rd!',
      options: {
        data: { full_name: 'Ali B' },
        redirectTo: window.location.origin,
      },
    })
  })

  it('signIn and signOut delegate to supabase', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    })
    supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null })
    supabase.auth.signOut.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.signIn({ email: 'a@b.com', password: 'pw' })
      await result.current.signOut()
    })
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pw',
    })
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})

describe('displayName', () => {
  it('prefers full_name over email', () => {
    expect(displayName({ user_metadata: { full_name: 'Ali' }, email: 'a@b.com' })).toBe('Ali')
    expect(displayName({ email: 'a@b.com' })).toBe('a@b.com')
    expect(displayName(null)).toBe('')
  })
})
