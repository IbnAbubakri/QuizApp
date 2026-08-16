import { describe, it, expect } from 'vitest'
import { tokenize, evaluate, formatResult } from './calculatorEngine'

describe('tokenize', () => {
  it('parses a simple expression in decimal', () => {
    expect(tokenize('5 + 3')).toEqual([
      { type: 'number', value: 5 },
      { type: 'op', value: '+' },
      { type: 'number', value: 3 },
    ])
  })

  it('reads multi-digit binary numbers', () => {
    expect(tokenize('101', 'bin')).toEqual([{ type: 'number', value: 5 }])
  })

  it('reads hex digits and hex-number words', () => {
    expect(tokenize('face', 'hex')).toEqual([{ type: 'number', value: 0xface }])
  })

  it('disambiguates hex keywords from digit words', () => {
    expect(tokenize('a and f', 'hex')).toEqual([
      { type: 'number', value: 10 },
      { type: 'op', value: 'and' },
      { type: 'number', value: 15 },
    ])
  })

  it('rejects unknown symbols', () => {
    expect(() => tokenize('2 $ 3')).toThrow(/Unexpected character/)
  })
})

describe('evaluate — decimal & scientific', () => {
  it('adds and multiplies', () => {
    expect(evaluate('5 + 3')).toBe(8)
    expect(evaluate('2 * 3 + 4')).toBe(10)
    expect(evaluate('10 / 3')).toBeCloseTo(3.3333333333, 9)
  })

  it('respects precedence and parens', () => {
    expect(evaluate('2 + 3 * 4')).toBe(14)
    expect(evaluate('(2 + 3) * 4')).toBe(20)
    expect(evaluate('2 ^ 3 ^ 2')).toBe(512)
  })

  it('handles unary minus', () => {
    expect(evaluate('-5 + 3')).toBe(-2)
    expect(evaluate('3 + -2')).toBe(1)
  })

  it('computes functions, postfix and constants', () => {
    expect(evaluate('sqrt(16)')).toBe(4)
    expect(evaluate('sin(30)')).toBeCloseTo(0.5, 9)
    expect(evaluate('cos(0)')).toBe(1)
    expect(evaluate('5!')).toBe(120)
    expect(evaluate('3²')).toBe(9)
    expect(evaluate('10 nCr 2')).toBe(45)
    expect(evaluate('10 nPr 2')).toBe(90)
    expect(evaluate('pi')).toBeCloseTo(Math.PI, 9)
  })

  it('throws on invalid expressions', () => {
    expect(() => evaluate('1 +')).toThrow()
    expect(() => evaluate('sin')).toThrow()
    expect(() => evaluate('((1 + 2)')).toThrow(/Mismatched parentheses/)
    expect(() => evaluate('1 / 0')).toThrow(/Invalid operation/)
  })
})

describe('evaluate — logic, shifts, bases', () => {
  it('performs logic ops and shifts', () => {
    expect(evaluate('101 and 11', 'deg', 'bin')).toBe(1)
    expect(evaluate('5 xor 3')).toBe(6)
    expect(evaluate('2 shl 3')).toBe(16)
    expect(evaluate('8 shr 2')).toBe(2)
    expect(evaluate('not 5')).toBe(-6)
    expect(evaluate('12 nand 10')).toBe(-9)
    expect(evaluate('5 xnor 3')).toBe(-7)
    expect(evaluate('7 nor 10')).toBe(-16)
  })

  it('supports hex operands in hex base', () => {
    expect(evaluate('A + F', 'deg', 'hex')).toBe(25)
    expect(formatResult(evaluate('A + F', 'deg', 'hex'), 'hex')).toBe('19')
    expect(evaluate('F shl 4', 'deg', 'hex')).toBe(240)
    expect(evaluate('CAFE', 'deg', 'hex')).toBe(0xcafe)
  })

  it('truncates results only when a base is given', () => {
    expect(evaluate('10 / 3')).toBeCloseTo(3.3333333333, 9)
    expect(evaluate('11 / 10', 'deg', 'bin')).toBe(1)
    expect(evaluate('10 / 3', 'deg', 'dec')).toBe(3)
  })
})

describe('formatResult', () => {
  it('formats floating point without a base', () => {
    expect(formatResult(0.5)).toBe('0.5')
    expect(formatResult(3.3333333333333335)).toBe('3.33333333333')
  })

  it('formats in bin, oct and hex', () => {
    expect(formatResult(255, 'hex')).toBe('FF')
    expect(formatResult(255, 'bin')).toBe('11111111')
    expect(formatResult(6, 'oct')).toBe('6')
    expect(formatResult(19, 'hex')).toBe('13')
  })

  it('shows two\'s complement for negatives in non-dec bases', () => {
    expect(formatResult(-6, 'bin')).toBe('11111111111111111111111111111010')
    expect(formatResult(-9, 'hex')).toBe('FFFFFFF7')
  })

  it('truncates decimal results in a base', () => {
    expect(formatResult(3.75, 'dec')).toBe('3')
  })

  it('handles non-finite values', () => {
    expect(formatResult(NaN)).toBe('Error')
  })
})
