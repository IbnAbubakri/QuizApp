import { useCallback, useEffect, useRef, useState } from 'react'
import { evaluate, formatResult, BASE_RADIX } from '../lib/calculatorEngine'
import './calculator.css'

const KEYS = [
  { key: 'AC', label: 'AC', kind: 'fn' },
  { key: 'open', label: '(', kind: 'paren' },
  { key: 'close', label: ')', kind: 'paren' },
  { key: 'sqrt', label: '√', kind: 'fn' },
  { key: 'div', label: '÷', kind: 'op' },
  { key: { digit: '7' }, label: '7', kind: 'num' },
  { key: { digit: '8' }, label: '8', kind: 'num' },
  { key: { digit: '9' }, label: '9', kind: 'num' },
  { key: 'mul', label: '×', kind: 'op' },
  { key: 'back', label: '⌫', kind: 'fn' },
  { key: { digit: '4' }, label: '4', kind: 'num' },
  { key: { digit: '5' }, label: '5', kind: 'num' },
  { key: { digit: '6' }, label: '6', kind: 'num' },
  { key: 'sub', label: '−', kind: 'op' },
  { key: 'pow', label: 'xʸ', kind: 'op' },
  { key: { digit: '1' }, label: '1', kind: 'num' },
  { key: { digit: '2' }, label: '2', kind: 'num' },
  { key: { digit: '3' }, label: '3', kind: 'num' },
  { key: 'add', label: '+', kind: 'op' },
  { key: 'pct', label: '%', kind: 'op' },
  { key: { digit: '0' }, label: '0', kind: 'num', wide: true },
  { key: 'dot', label: '.', kind: 'num' },
  { key: 'eq', label: '=', kind: 'eq', wide: true },
]

const SCIFN = [
  { key: 'sin', label: 'sin', kind: 'sci' },
  { key: 'cos', label: 'cos', kind: 'sci' },
  { key: 'tan', label: 'tan', kind: 'sci' },
  { key: 'pi', label: 'π', kind: 'sci' },
  { key: 'e', label: 'e', kind: 'sci' },
  { key: 'sinh', label: 'sinh', kind: 'sci' },
  { key: 'cosh', label: 'cosh', kind: 'sci' },
  { key: 'tanh', label: 'tanh', kind: 'sci' },
  { key: 'ten', label: '10ˣ', kind: 'sci' },
  { key: 'cbrt', label: '∛', kind: 'sci' },
  { key: 'ln', label: 'ln', kind: 'sci' },
  { key: 'log', label: 'log', kind: 'sci' },
  { key: 'exp', label: 'eˣ', kind: 'sci' },
  { key: 'sq', label: 'x²', kind: 'sci' },
  { key: 'cube', label: 'x³', kind: 'sci' },
  { key: 'asin', label: 'asin', kind: 'sci' },
  { key: 'acos', label: 'acos', kind: 'sci' },
  { key: 'atan', label: 'atan', kind: 'sci' },
  { key: 'fact', label: 'x!', kind: 'sci' },
  { key: 'recip', label: '1/x', kind: 'sci' },
  { key: 'asinh', label: 'asinh', kind: 'sci' },
  { key: 'acosh', label: 'acosh', kind: 'sci' },
  { key: 'atanh', label: 'atanh', kind: 'sci' },
  { key: 'npr', label: 'nPr', kind: 'sci' },
  { key: 'ncr', label: 'nCr', kind: 'sci' },
]

const BINFN = [
  { key: 'and', label: 'AND', kind: 'bin' },
  { key: 'or', label: 'OR', kind: 'bin' },
  { key: 'xor', label: 'XOR', kind: 'bin' },
  { key: 'not', label: 'NOT', kind: 'bin' },
  { key: 'nand', label: 'NAND', kind: 'bin' },
  { key: 'nor', label: 'NOR', kind: 'bin' },
  { key: 'xnor', label: 'XNOR', kind: 'bin' },
  { key: 'shl', label: 'SHL', kind: 'bin' },
  { key: 'shr', label: 'SHR', kind: 'bin' },
  { key: { digit: 'A' }, label: 'A', kind: 'bin' },
  { key: { digit: 'B' }, label: 'B', kind: 'bin' },
  { key: { digit: 'C' }, label: 'C', kind: 'bin' },
  { key: { digit: 'D' }, label: 'D', kind: 'bin' },
  { key: { digit: 'E' }, label: 'E', kind: 'bin' },
  { key: { digit: 'F' }, label: 'F', kind: 'bin' },
]

const VALID_DIGITS = {
  dec: '0123456789.',
  bin: '01',
  oct: '01234567',
  hex: '0123456789abcdef',
}

const LOGIC_WORDS = new Set(['and', 'or', 'xor', 'not', 'nand', 'nor', 'xnor', 'shl', 'shr'])

const GLYPH = {
  div: '/',
  mul: '*',
  sub: '-',
  add: '+',
  pct: '%',
  pow: '^',
  sqrt: 'sqrt',
  open: '(',
  close: ')',
  sin: 'sin(',
  cos: 'cos(',
  tan: 'tan(',
  asin: 'asin(',
  acos: 'acos(',
  atan: 'atan(',
  sinh: 'sinh(',
  cosh: 'cosh(',
  tanh: 'tanh(',
  asinh: 'asinh(',
  acosh: 'acosh(',
  atanh: 'atanh(',
  ln: 'ln(',
  log: 'log(',
  exp: 'exp(',
  ten: 'ten(',
  cbrt: 'cbrt',
  sq: 'sq',
  cube: 'cube',
  fact: '!',
  recip: 'recip',
  npr: 'npr',
  ncr: 'ncr',
  pi: 'pi',
  e: 'e',
  and: 'and',
  or: 'or',
  xor: 'xor',
  not: 'not',
  nand: 'nand',
  nor: 'nor',
  xnor: 'xnor',
  shl: 'shl',
  shr: 'shr',
}

function pretty(raw) {
  return raw
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−')
    .replace(/\^/g, '^')
    .replace(/sqrt/g, '√')
    .replace(/sq/g, '²')
    .replace(/cube/g, '³')
    .replace(/recip/g, '1/x')
    .replace(/pi/g, 'π')
    .replace(/exp\(/g, 'eˣ(')
    .replace(/ten\(/g, '10ˣ(')
    .replace(/cbrt/g, '∛')
    .replace(/npr/g, 'P')
    .replace(/ncr/g, 'C')
    .replace(/\bxnor\b/g, 'XNOR')
    .replace(/\bnand\b/g, 'NAND')
    .replace(/\bnor\b/g, 'NOR')
    .replace(/\band\b/g, 'AND')
    .replace(/\bor\b/g, 'OR')
    .replace(/\bxor\b/g, 'XOR')
    .replace(/\bnot\b/g, 'NOT')
    .replace(/\bshl\b/g, 'SHL')
    .replace(/\bshr\b/g, 'SHR')
}

const keyName = (b) => (typeof b.key === 'object' ? b.label : b.key)

export default function Calculator() {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState('0')
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [flash, setFlash] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [mode, setMode] = useState('basic')
  const [angle, setAngle] = useState('deg')
  const [base, setBase] = useState('dec')
  const nextId = useRef(0)
  const riseRef = useRef(null)
  const [fitScale, setFitScale] = useState(1)
  const fitScaleRef = useRef(1)

  const activeBase = mode === 'bin' ? base : undefined

  const changeMode = (m) => {
    setMode(m)
    setExpr('')
    setResult('0')
    setError(null)
    if (m !== 'bin') setBase('dec')
  }

  const parseShown = (s, from) => {
    if (!s || s === 'Error' || s === '∞' || s === '-∞') return NaN
    const neg = s.startsWith('-')
    const body = neg ? s.slice(1) : s
    const v = from === 'dec' ? Number(body) : parseInt(body, BASE_RADIX[from])
    return Number.isNaN(v) ? NaN : neg ? -v : v
  }

  const switchBase = (b) => {
    if (b === base) return
    const current = base
    let value
    try {
      value = expr !== '' ? evaluate(expr, angle, current) : parseShown(result, current)
    } catch {
      value = NaN
    }
    if (Number.isNaN(value)) {
      setBase(b)
      return
    }
    setBase(b)
    setExpr('')
    setResult(formatResult(value, b))
    setError(null)
  }

  useEffect(() => {
    const el = riseRef.current
    if (!el) return
    const measure = () => {
      if (mode === 'basic') {
        setFitScale(1)
        return
      }
      const rect = el.getBoundingClientRect()
      const unscaled = rect.height / fitScaleRef.current
      const available = window.innerHeight - rect.top - 14
      setFitScale(Math.max(0.7, Math.min(1, available / unscaled)))
    }
    const raf = window.requestAnimationFrame ? requestAnimationFrame(measure) : measure()
    window.addEventListener('resize', measure)
    return () => {
      if (raf !== undefined) cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [mode])

  useEffect(() => {
    fitScaleRef.current = fitScale
  }, [fitScale])

  const computePreview = useCallback(
    (raw) => {
      if (!raw) return ''
      try {
        return formatResult(evaluate(raw, angle, activeBase), activeBase)
      } catch {
        return ''
      }
    },
    [angle, activeBase]
  )

  const push = useCallback(
    (raw) => {
      setExpr(raw)
      setError(null)
      const preview = computePreview(raw)
      if (preview && !raw.endsWith('=')) setResult(preview)
    },
    [computePreview]
  )

  const press = useCallback(
    (key) => {
      if (typeof key === 'object') {
        if (mode === 'bin' && !VALID_DIGITS[base].includes(key.digit.toLowerCase())) return
        const needsSpace = /\b(and|or|xor|not|nand|nor|xnor|shl|shr)$/.test(expr)
        push(expr + (needsSpace ? ' ' : '') + key.digit)
        return
      }

      switch (key) {
        case 'AC':
          setExpr('')
          setResult('0')
          setError(null)
          return
        case 'back':
          push(expr.slice(0, -1) || '')
          return
        case 'eq': {
          if (!expr) return
          try {
            const value = evaluate(expr, angle, activeBase)
            const prettyResult = formatResult(value, activeBase)
            setResult(prettyResult)
            setError(null)
            setHistory((h) => [{ expression: expr, result: prettyResult, id: ++nextId.current }, ...h].slice(0, 12))
            setExpr('')
            setFlash(true)
            window.setTimeout(() => setFlash(false), 450)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Error')
          }
          return
        }
        case 'dot': {
          if (mode === 'bin') return
          const tail = expr.split(/[+−×÷()^%]/).pop() ?? ''
          if (tail.includes('.')) return
          push(expr === '' ? '0.' : expr + '.')
          return
        }
        default: {
          const op = GLYPH[key]
          if (op) {
            const isLogic = LOGIC_WORDS.has(op)
            const isPostfix = /^(sq|cube|recip|fact)$/.test(op)
            const isBinaryOp = /^(npr|ncr)$/.test(op)
            const needsTimes =
              !isPostfix && !isBinaryOp && !isLogic && /[0-9.)]$/.test(expr) && /[a-zA-Z(]/.test(op[0] ?? '')
            push(expr + (isLogic && expr ? ' ' : '') + (needsTimes ? '*' : '') + op)
          }
        }
      }
    },
    [expr, push, angle, activeBase, mode, base]
  )

  const recall = useCallback((entry) => {
    setResult(entry.result)
    setExpr(entry.result)
    setError(null)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target?.tagName
      if (t === 'INPUT' || t === 'TEXTAREA') return

      if (/[0-9]/.test(e.key)) {
        press({ digit: e.key })
      } else if (/[a-fA-F]/.test(e.key) && mode === 'bin' && base === 'hex') {
        press({ digit: e.key.toUpperCase() })
      } else if (e.key === '.') {
        press('dot')
      } else if (e.key === '+') {
        press('add')
      } else if (e.key === '-') {
        press('sub')
      } else if (e.key === '*') {
        press('mul')
      } else if (e.key === '/') {
        e.preventDefault()
        press('div')
      } else if (e.key === '(') {
        press('open')
      } else if (e.key === ')') {
        press('close')
      } else if (e.key === '%') {
        press('pct')
      } else if (e.key === '^') {
        press('pow')
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault()
        press('eq')
      } else if (e.key === 'Backspace') {
        press('back')
      } else if (e.key.toLowerCase() === 's') {
        press('sqrt')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press, mode, base])

  const isDisabled = (b) =>
    mode === 'bin' &&
    (typeof b.key === 'object' ? !VALID_DIGITS[base].includes(b.key.digit.toLowerCase()) : b.key === 'dot')

  const btnClass = (b) => {
    let cls = 'calc-key'
    if (b.kind === 'eq') cls += ' k-eq'
    else if (b.kind === 'op') cls += ' k-op'
    else if (b.kind === 'fn') cls += ' k-fn'
    else if (b.kind === 'paren') cls += ' k-paren'
    else if (b.kind === 'sci') cls += ' k-sci'
    else if (b.kind === 'bin') cls += ' k-bin'
    else cls += ' k-num'
    if (b.wide) cls += ' k-wide'
    return cls
  }

  return (
    <div className="calc-root">
      <div ref={riseRef} className="calc-rise" style={{ zoom: fitScale }}>
        <div
          className="calc-modebar"
          role="tablist"
          aria-label="Calculator mode"
          aria-orientation="horizontal"
        >
          <span aria-hidden className={`calc-modebar-pill${mode === 'sci' ? ' sci' : mode === 'bin' ? ' bin' : ''}`} />
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'basic'}
            onClick={() => changeMode('basic')}
          >
            Basic
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'sci'}
            onClick={() => changeMode('sci')}
          >
            Scientific
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'bin'}
            onClick={() => changeMode('bin')}
          >
            Binary
          </button>
        </div>

        <div className="calc-body">
          <section aria-label="Calculator" className="calc-card">
            <div className="calc-brand-row">
              <span className="calc-brand">Calculator</span>
              <button
                type="button"
                className="calc-hist-toggle"
                onClick={() => setPanelOpen((v) => !v)}
                aria-expanded={panelOpen}
              >
                {history.length ? `History · ${history.length}` : 'History'}
              </button>
            </div>

            <div className="calc-display">
              <div className="calc-expr" aria-live="polite">
                {error ? <span className="calc-error">{error}</span> : pretty(expr || '\u00A0')}
              </div>
              <div className={`calc-lcd${flash ? ' calc-eq-flash calc-lcd-roll' : ''}`}>{result}</div>
              <div className="calc-display-foot">
                <span>{expr ? 'Preview' : 'Ready'}</span>
                {mode === 'sci' ? (
                  <button
                    type="button"
                    className={`calc-chip${angle === 'rad' ? ' active' : ''}`}
                    onClick={() => setAngle((a) => (a === 'deg' ? 'rad' : 'deg'))}
                    aria-pressed={angle === 'rad'}
                  >
                    {angle}
                  </button>
                ) : mode === 'bin' ? (
                  <div className="calc-chips">
                    {['dec', 'bin', 'oct', 'hex'].map((b) => (
                      <button
                        type="button"
                        key={b}
                        className={`calc-chip${base === b ? ' active' : ''}`}
                        onClick={() => switchBase(b)}
                        aria-pressed={base === b}
                      >
                        {b.toUpperCase()}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span>Dec</span>
                )}
              </div>
            </div>

            {mode === 'sci' && (
              <div className="calc-sci">
                {SCIFN.map((b, i) => (
                  <button
                    type="button"
                    key={keyName(b)}
                    className={btnClass(b)}
                    style={{ animationDelay: `${80 + i * 18}ms` }}
                    onClick={() => press(b.key)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}

            {mode === 'bin' && (
              <div className="calc-bin">
                {(base === 'hex' ? BINFN : BINFN.slice(0, 9)).map((b, i) => (
                  <button
                    type="button"
                    key={keyName(b)}
                    className={btnClass(b)}
                    style={{ animationDelay: `${80 + i * 18}ms` }}
                    onClick={() => press(b.key)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}

            <div className="calc-keys">
              {KEYS.map((b, i) => (
                <button
                  type="button"
                  key={keyName(b)}
                  disabled={isDisabled(b)}
                  className={btnClass(b)}
                  style={{ animationDelay: `${80 + i * 22}ms` }}
                  onClick={() => press(b.key)}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <p className="calc-hint">
              Keyboard supported — <kbd>Enter</kbd> solve · <kbd>S</kbd> sqrt · <kbd>Del</kbd> delete
            </p>
          </section>

          <aside aria-label="History" className={`calc-hist${panelOpen ? ' open' : ''}`}>
            <div className="calc-hist-head">
              <h2>History</h2>
              {history.length > 0 && (
                <button type="button" className="calc-hist-clear" onClick={() => setHistory([])}>
                  Clear
                </button>
              )}
            </div>
            <div className="calc-hist-list">
              {history.length === 0 ? (
                <p className="calc-hist-empty">No calculations yet</p>
              ) : (
                <ul>
                  {history.map((entry) => (
                    <li key={entry.id} className="calc-hist-in">
                      <button type="button" className="calc-hist-item" onClick={() => recall(entry)}>
                        <div className="calc-hist-item-expr">{pretty(entry.expression || '')}</div>
                        <div className="calc-hist-item-result">{entry.result}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
