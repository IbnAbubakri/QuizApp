import { describe, it, expect } from 'vitest'
import { validateName, validateEmail, validatePassword, passwordStrength } from './validation'

describe('validateName', () => {
  it('rejects empty and very short names', () => {
    expect(validateName('')).toBe('Please enter your name.')
    expect(validateName('   ')).toBe('Please enter your name.')
    expect(validateName('a')).toBe('Name must be at least 2 characters.')
  })

  it('accepts a valid name', () => {
    expect(validateName('Faaruq')).toBe('')
  })
})

describe('validateEmail', () => {
  it('rejects missing and malformed emails', () => {
    expect(validateEmail('')).toBe('Please enter your email.')
    expect(validateEmail('nope')).toBe('Please enter a valid email address.')
    expect(validateEmail('a@b')).toBe('Please enter a valid email address.')
    expect(validateEmail('a@b.com extra')).toBe('Please enter a valid email address.')
  })

  it('accepts a valid email', () => {
    expect(validateEmail('student@example.com')).toBe('')
  })
})

describe('validatePassword', () => {
  it('rejects missing, short and weak passwords', () => {
    expect(validatePassword('')).toBe('Please enter a password.')
    expect(validatePassword('abcdefgh')).toBe('Add at least one uppercase letter.')
    expect(validatePassword('ABCDEFGH')).toBe('Add at least one number.')
    expect(validatePassword('Short1')).toBe('Password must be at least 8 characters.')
  })

  it('accepts a strong password', () => {
    expect(validatePassword('Abcdefgh1')).toBe('')
  })
})

describe('passwordStrength', () => {
  it('scores empty input as 0', () => {
    expect(passwordStrength('').score).toBe(0)
    expect(passwordStrength(null).score).toBe(0)
  })

  it('scores 4 for a password meeting every rule', () => {
    const { score, label } = passwordStrength('Abcdefgh1!')
    expect(score).toBe(4)
    expect(label).toBe('Strong')
  })

  it('rewards each satisfied rule', () => {
    expect(passwordStrength('abcdefgh').score).toBe(1)
    expect(passwordStrength('Abcdefgh').score).toBe(2)
    expect(passwordStrength('Abcdefgh1').score).toBe(3)
  })
})
