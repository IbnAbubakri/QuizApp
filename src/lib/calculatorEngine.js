export const BASE_RADIX = { dec: 10, bin: 2, oct: 8, hex: 16 }

const UNOP_PREC = 2.5

const toInt = (n) => n | 0

const OPERATORS = {
  '+': { prec: 1, assoc: 'left', fn: (a, b) => a + b },
  '-': { prec: 1, assoc: 'left', fn: (a, b) => a - b },
  '*': { prec: 2, assoc: 'left', fn: (a, b) => a * b },
  '/': { prec: 2, assoc: 'left', fn: (a, b) => (b === 0 ? NaN : a / b) },
  '%': { prec: 2, assoc: 'left', fn: (a, b) => a % b },
  '^': { prec: 3, assoc: 'right', fn: (a, b) => Math.pow(a, b) },
  npr: { prec: 3, assoc: 'left', fn: (a, b) => permute(a, b) },
  ncr: { prec: 3, assoc: 'left', fn: (a, b) => combine(a, b) },
  shl: { prec: 2, assoc: 'left', fn: (a, b) => toInt(a) << toInt(b) },
  shr: { prec: 2, assoc: 'left', fn: (a, b) => toInt(a) >>> toInt(b) },
  and: { prec: 0.5, assoc: 'left', fn: (a, b) => toInt(a) & toInt(b) },
  or: { prec: 0.5, assoc: 'left', fn: (a, b) => toInt(a) | toInt(b) },
  xor: { prec: 0.5, assoc: 'left', fn: (a, b) => toInt(a) ^ toInt(b) },
  nand: { prec: 0.5, assoc: 'left', fn: (a, b) => ~(toInt(a) & toInt(b)) },
  nor: { prec: 0.5, assoc: 'left', fn: (a, b) => ~(toInt(a) | toInt(b)) },
  xnor: { prec: 0.5, assoc: 'left', fn: (a, b) => ~(toInt(a) ^ toInt(b)) },
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

function permute(n, r) {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n || n > 170) return NaN
  return factorial(n) / factorial(n - r)
}

function combine(n, r) {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n || n > 170) return NaN
  return factorial(n) / (factorial(r) * factorial(n - r))
}

const toRad = (a, angle) => (angle === 'deg' ? (a * Math.PI) / 180 : a)
const toDeg = (a, angle) => (angle === 'deg' ? (a * 180) / Math.PI : a)

const PREFIX = {
  sqrt: (a) => (a < 0 ? NaN : Math.sqrt(a)),
  cbrt: (a) => Math.cbrt(a),
  sin: (a, m) => Math.sin(toRad(a, m)),
  cos: (a, m) => Math.cos(toRad(a, m)),
  tan: (a, m) => {
    const r = toRad(a, m)
    const c = Math.cos(r)
    return c === 0 ? NaN : Math.sin(r) / c
  },
  asin: (a, m) => (a < -1 || a > 1 ? NaN : toDeg(Math.asin(a), m)),
  acos: (a, m) => (a < -1 || a > 1 ? NaN : toDeg(Math.acos(a), m)),
  atan: (a, m) => toDeg(Math.atan(a), m),
  sinh: (a) => Math.sinh(a),
  cosh: (a) => Math.cosh(a),
  tanh: (a) => Math.tanh(a),
  asinh: (a) => Math.asinh(a),
  acosh: (a) => (a < 1 ? NaN : Math.acosh(a)),
  atanh: (a) => (Math.abs(a) >= 1 ? NaN : Math.atanh(a)),
  ln: (a) => (a <= 0 ? NaN : Math.log(a)),
  log: (a) => (a <= 0 ? NaN : Math.log10(a)),
  exp: (a) => Math.exp(a),
  ten: (a) => Math.pow(10, a),
}

const POSTFIX = {
  sq: (a) => a * a,
  cube: (a) => a * a * a,
  recip: (a) => (a === 0 ? NaN : 1 / a),
  fact: (a) => factorial(a),
}

const CONSTANTS = {
  pi: Math.PI,
  e: Math.E,
}

const DIGIT_RE = {
  dec: /[0-9.]/,
  bin: /[01]/,
  oct: /[0-7]/,
  hex: /[0-9a-fA-F]/,
}

export function tokenize(input, base = 'dec') {
  const tokens = []
  let i = 0
  const consumeDigits = () => {
    let j = i
    while (j < input.length && DIGIT_RE[base].test(input[j])) j++
    const raw = input.slice(i, j)
    const value = base === 'dec' ? Number(raw) : parseInt(raw, BASE_RADIX[base])
    if (Number.isNaN(value)) throw new Error('Invalid number')
    tokens.push({ type: 'number', value })
    return j
  }
  while (i < input.length) {
    const ch = input[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }
    if (DIGIT_RE[base].test(ch)) {
      if (base === 'hex' && /[a-fA-F]/.test(ch)) {
        let k = i
        while (k < input.length && /[a-zA-Z]/.test(input[k])) k++
        const w = input.slice(i, k).toLowerCase()
        if (OPERATORS[w] || PREFIX[w] || POSTFIX[w] || w === 'not') {
          // fall through: keyword starting with a hex letter
        } else {
          i = consumeDigits()
          continue
        }
      } else {
        i = consumeDigits()
        continue
      }
    }
    if ('+-*/%^'.includes(ch)) {
      if (ch === '-') {
        const prev = tokens[tokens.length - 1]
        const unary =
          !prev ||
          prev.type === 'op' ||
          prev.type === 'unop' ||
          prev.type === 'fn' ||
          prev.type === 'postfix' ||
          (prev.type === 'paren' && prev.value === '(')
        if (unary) {
          tokens.push({ type: 'unop', value: '-' })
          i++
          continue
        }
      }
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }
    if ('!²³'.includes(ch)) {
      const map = { '²': 'sq', '³': 'cube', '!': 'fact' }
      tokens.push({ type: 'postfix', value: map[ch] })
      i++
      continue
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch })
      i++
      continue
    }
    if (/[a-zA-Z]/.test(ch)) {
      let j = i
      while (j < input.length && /[a-zA-Z]/.test(input[j])) j++
      const name = input.slice(i, j).toLowerCase()
      if (OPERATORS[name]) {
        tokens.push({ type: 'op', value: name })
      } else if (PREFIX[name]) {
        tokens.push({ type: 'fn', value: name })
      } else if (POSTFIX[name]) {
        tokens.push({ type: 'postfix', value: name })
      } else if (name === 'not') {
        tokens.push({ type: 'unop', value: 'not' })
      } else if (base === 'hex' && /^[0-9a-f]+$/.test(name)) {
        tokens.push({ type: 'number', value: parseInt(name, 16) })
      } else if (CONSTANTS[name] !== undefined) {
        tokens.push({ type: 'number', value: CONSTANTS[name] })
      } else {
        throw new Error(`Unknown function: ${name}`)
      }
      i = j
      continue
    }
    throw new Error(`Unexpected character: ${ch}`)
  }
  return tokens
}

export function evaluate(input, angle = 'deg', base) {
  const tokens = tokenize(input, base)
  const output = []
  const stack = []

  for (const tok of tokens) {
    if (tok.type === 'number') {
      output.push(tok)
    } else if (tok.type === 'fn') {
      stack.push(tok)
    } else if (tok.type === 'postfix') {
      output.push(tok)
    } else if (tok.type === 'unop') {
      stack.push(tok)
    } else if (tok.type === 'op') {
      while (stack.length) {
        const top = stack[stack.length - 1]
        if (top.type === 'unop') {
          if (OPERATORS[tok.value].prec < UNOP_PREC) {
            output.push(stack.pop())
            continue
          }
          break
        }
        if (top.type === 'op') {
          const o1 = OPERATORS[tok.value]
          const o2 = OPERATORS[top.value]
          if ((o1.assoc === 'left' && o1.prec <= o2.prec) || (o1.assoc === 'right' && o1.prec < o2.prec)) {
            output.push(stack.pop())
            continue
          }
        }
        break
      }
      stack.push(tok)
    } else if (tok.type === 'paren') {
      if (tok.value === '(') {
        stack.push(tok)
      } else {
        let found = false
        while (stack.length) {
          const top = stack.pop()
          if (top.type === 'paren' && top.value === '(') {
            found = true
            break
          }
          output.push(top)
        }
        if (!found) throw new Error('Mismatched parentheses')
        if (stack.length && stack[stack.length - 1].type === 'fn') {
          output.push(stack.pop())
        }
      }
    }
  }

  while (stack.length) {
    const top = stack.pop()
    if (top.type === 'paren') throw new Error('Mismatched parentheses')
    output.push(top)
  }

  const values = []
  for (const tok of output) {
    if (tok.type === 'number') {
      values.push(tok.value)
    } else if (tok.type === 'fn') {
      const a = values.pop()
      const r = PREFIX[tok.value](a, angle)
      if (Number.isNaN(r)) throw new Error('Invalid operation')
      values.push(r)
    } else if (tok.type === 'postfix') {
      const a = values.pop()
      const r = POSTFIX[tok.value](a)
      if (Number.isNaN(r)) throw new Error('Invalid operation')
      values.push(r)
    } else if (tok.type === 'unop') {
      if (!values.length) throw new Error('Invalid expression')
      const a = values.pop()
      values.push(tok.value === 'not' ? ~a : -a)
    } else if (tok.type === 'op') {
      const b = values.pop()
      const a = values.pop()
      const r = OPERATORS[tok.value].fn(a, b)
      if (Number.isNaN(r)) throw new Error('Invalid operation')
      values.push(r)
    }
  }

  if (values.length !== 1) throw new Error('Invalid expression')
  const v = values[0]
  return base ? Math.trunc(v) : v
}

export function formatResult(n, base) {
  if (Number.isNaN(n)) return 'Error'
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '-∞'
  if (base === undefined) {
    const text = String(n)
    if (text.length <= 14) return text
    return n.toPrecision(12).replace(/\.?0+$/, '')
  }
  if (base !== 'dec') {
    const v = Math.trunc(n) >>> 0
    if (base === 'bin') return v.toString(2)
    if (base === 'oct') return v.toString(8)
    return v.toString(16).toUpperCase()
  }
  const text = String(Math.trunc(n))
  if (text.length <= 14) return text
  return n.toPrecision(12).replace(/\.?0+$/, '')
}
