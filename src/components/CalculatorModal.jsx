import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import Calculator from './Calculator'

export default function CalculatorModal({ open, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const prevActive = document.activeElement
    const node = dialogRef.current
    const focusables = node
      ? [
          ...node.querySelectorAll(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ),
        ]
      : []
    if (focusables[0]) focusables[0].focus()
    return () => {
      if (prevActive && document.contains(prevActive)) prevActive.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="calc-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Calculator"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="calc-modal-head">
          <span className="calc-modal-title">Calculator</span>
          <button
            type="button"
            className="calc-modal-close"
            onClick={onClose}
            aria-label="Close calculator"
          >
            <X size={16} />
          </button>
        </div>
        <Calculator />
      </div>
    </div>
  )
}
