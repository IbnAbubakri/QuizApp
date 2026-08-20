import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterPage from './RegisterPage'

const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }))

vi.mock('../lib/AuthContext', () => ({ useAuth: () => ({ signUp }) }))

const fill = () => {
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Ali B' } })
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } })
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'Passw0rd!' } })
  fireEvent.change(screen.getByLabelText(/Confirm password/), { target: { value: 'Passw0rd!' } })
  fireEvent.click(screen.getByLabelText(/I agree to use this app/))
}

const submitForm = () => fireEvent.submit(document.querySelector('form'))

beforeEach(() => {
  signUp.mockReset()
  signUp.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null })
})

describe('RegisterPage', () => {
  it('renders the registration form', () => {
    render(<RegisterPage onSwitch={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })

  it('shows a mismatch error when passwords differ', async () => {
    render(<RegisterPage onSwitch={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Ali B' } })
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'Passw0rd!' } })
    fireEvent.change(screen.getByLabelText(/Confirm password/), { target: { value: 'nope' } })
    fireEvent.click(screen.getByLabelText(/I agree to use this app/))
    submitForm()
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('requires accepting the terms', async () => {
    render(<RegisterPage onSwitch={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Ali B' } })
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'Passw0rd!' } })
    fireEvent.change(screen.getByLabelText(/Confirm password/), { target: { value: 'Passw0rd!' } })
    submitForm()
    expect(
      await screen.findByText('Please accept the terms to continue.')
    ).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('shows the confirmation screen when sign-up returns no session', async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null })
    render(<RegisterPage onSwitch={vi.fn()} />)
    fill()
    submitForm()
    expect(await screen.findByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument()
  })

  it('maps already-registered emails to a friendly message', async () => {
    signUp.mockResolvedValue({ error: { message: 'User already registered' } })
    render(<RegisterPage onSwitch={vi.fn()} />)
    fill()
    submitForm()
    expect(
      await screen.findByText('An account with this email already exists. Try logging in instead.')
    ).toBeInTheDocument()
  })

  it('falls back to a generic message for unknown errors', async () => {
    signUp.mockResolvedValue({ error: { message: 'capacity exceeded' } })
    render(<RegisterPage onSwitch={vi.fn()} />)
    fill()
    submitForm()
    expect(
      await screen.findByText('Something went wrong. Please try again.')
    ).toBeInTheDocument()
  })

  it('does not show an error when sign-up succeeds with a session', async () => {
    render(<RegisterPage onSwitch={vi.fn()} />)
    fill()
    submitForm()
    await waitFor(() => expect(signUp).toHaveBeenCalled())
    expect(
      screen.queryByText('Something went wrong. Please try again.')
    ).not.toBeInTheDocument()
  })
})
