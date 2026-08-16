import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Calculator from './Calculator'

const lcd = (container) => container.querySelector('.calc-lcd').textContent

describe('Calculator', () => {
  it('solves basic arithmetic', () => {
    const { container } = render(<Calculator />)
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    fireEvent.click(screen.getByRole('button', { name: '3' }))
    fireEvent.click(screen.getByRole('button', { name: '=' }))
    expect(lcd(container)).toBe('8')
  })

  it('clears with AC', () => {
    const { container } = render(<Calculator />)
    fireEvent.click(screen.getByRole('button', { name: '9' }))
    fireEvent.click(screen.getByRole('button', { name: 'AC' }))
    expect(lcd(container)).toBe('0')
  })

  it('deletes the last character with backspace', () => {
    const { container } = render(<Calculator />)
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '⌫' }))
    expect(lcd(container)).toBe('4')
  })

  it('switches to scientific mode and solves sin(30)', () => {
    const { container } = render(<Calculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Scientific' }))
    expect(screen.getByRole('button', { name: 'sin' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'sin' }))
    fireEvent.click(screen.getByRole('button', { name: '3' }))
    fireEvent.click(screen.getByRole('button', { name: '0' }))
    fireEvent.click(screen.getByRole('button', { name: ')' }))
    fireEvent.click(screen.getByRole('button', { name: '=' }))
    expect(lcd(container)).toBe('0.5')
  })

  it('computes logic ops and converts base in binary mode', () => {
    const { container } = render(<Calculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Binary' }))
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    fireEvent.click(screen.getByRole('button', { name: 'XOR' }))
    fireEvent.click(screen.getByRole('button', { name: '3' }))
    fireEvent.click(screen.getByRole('button', { name: '=' }))
    expect(lcd(container)).toBe('6')
    fireEvent.click(screen.getByRole('button', { name: 'BIN' }))
    expect(lcd(container)).toBe('110')
  })

  it('shows hex letter keys only in hex base', () => {
    render(<Calculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Binary' }))
    expect(screen.queryByRole('button', { name: 'F' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'HEX' }))
    expect(screen.getByRole('button', { name: 'F' })).toBeInTheDocument()
  })

  it('records solved results into history', () => {
    render(<Calculator />)
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getAllByText('4')).not.toHaveLength(0)
    expect(screen.queryByText('No calculations yet')).not.toBeInTheDocument()
  })
})
