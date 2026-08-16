import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AdminPanel from './AdminPanel'

describe('AdminPanel', () => {
  it('opens and closes the calculator from the header', () => {
    render(<AdminPanel topics={[]} onRefresh={vi.fn()} onLogout={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'AC' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Calculator' }))
    expect(screen.getByRole('button', { name: 'AC' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Calculator' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close calculator' }))
    expect(screen.queryByRole('button', { name: 'AC' })).not.toBeInTheDocument()
  })
})
