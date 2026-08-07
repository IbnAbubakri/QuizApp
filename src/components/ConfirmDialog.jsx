import { useEffect } from 'react'

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
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={() => !busy && onCancel()}>
      <div
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
          <button className="ghost-btn" onClick={onCancel} disabled={busy} autoFocus>
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
