import { useEffect, useRef } from 'react'

const getFocusable = (node) =>
  node
    ? [
        ...node.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ),
      ]
    : []

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy,
  error,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const prevActive = document.activeElement
    const node = dialogRef.current
    const first = getFocusable(node)[0]
    if (first) first.focus()
    return () => {
      if (prevActive && document.contains(prevActive)) prevActive.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const node = dialogRef.current
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault()
        onCancel()
        return
      }
      if (e.key !== 'Tab' || !node) return
      const focusable = getFocusable(node)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={() => !busy && onCancel()}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button className="ghost-btn" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button className="primary-btn" onClick={onConfirm} disabled={busy}>
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
