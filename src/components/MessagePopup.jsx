import { useEffect, useRef } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const TONES = {
  info: { Icon: Info },
  success: { Icon: CheckCircle2 },
  error: { Icon: AlertTriangle },
}

export default function MessagePopup({
  message,
  tone = 'info',
  icon: IconOverride,
  autoDismiss = 4500,
  onClose,
}) {
  const { Icon } = TONES[tone] || TONES.info
  const IconComponent = IconOverride || Icon
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!message || !autoDismiss) return
    const t = setTimeout(() => onCloseRef.current && onCloseRef.current(), autoDismiss)
    return () => clearTimeout(t)
  }, [message, autoDismiss])

  useEffect(() => {
    if (!message) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current && onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [message])

  if (!message) return null

  return (
    <div className="msg-popup-backdrop">
      <div
        className="msg-popup"
        role={tone === 'error' ? 'alert' : 'status'}
        aria-live={tone === 'error' ? 'assertive' : 'polite'}
      >
        <span className={`msg-popup-icon msg-popup-icon--${tone}`}>
          <IconComponent size={22} />
        </span>
        <p className="msg-popup-text">{message}</p>
        {onClose && (
          <button
            type="button"
            className="msg-popup-close"
            onClick={onClose}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
