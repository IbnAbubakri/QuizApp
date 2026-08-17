import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from './LoginPage'

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }))

vi.mock('../lib/AuthContext', () => ({ useAuth: () => ({ signIn }) }))

const submitForm = () => fireEvent.submit(document.querySelector('form'))

beforeEach(() => {
  signIn.mockReset()
  signIn.mockResolvedValue({ error: null })
})

describe('LoginPage', () => {
  it('renders the login form', () => {
    render(<LoginPage onSwitch={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
  })

  it('shows a validation error for an invalid email', async () => {
    render(<LoginPage onSwitch={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nope' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
    submitForm()
    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('requires a password', async () => {
    render(<LoginPage onSwitch={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    submitForm()
    expect(await screen.findByText('Please enter your password.')).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('maps invalid login credentials to a friendly message', async () => {
    signIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    render(<LoginPage onSwitch={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
    submitForm()
    expect(
      await screen.findByText('Incorrect email or password. Please try again.')
    ).toBeInTheDocument()
  })

  it('falls back to a generic message for unknown errors', async () => {
    signIn.mockResolvedValue({ error: { message: 'Rate limit exceeded' } })
    render(<LoginPage onSwitch={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
    submitForm()
    expect(
      await screen.findByText('Something went wrong. Please try again.')
    ).toBeInTheDocument()
  })

  it('does not surface an error when sign-in succeeds', async () => {
    render(<LoginPage onSwitch={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
    submitForm()
    await waitFor(() => expect(signIn).toHaveBeenCalled())
    expect(
      screen.queryByText('Something went wrong. Please try again.')
    ).not.toBeInTheDocument()
  })
})
