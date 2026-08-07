import { useState, useCallback } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

export function useConfirm() {
  const [state, setState] = useState(null)

  const confirm = useCallback(({ title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm }) => {
    setState({ title, message, confirmLabel, cancelLabel, onConfirm })
  }, [])

  const dialog = state ? (
    <ConfirmDialog
      open
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      onConfirm={() => {
        const action = state.onConfirm
        setState(null)
        action()
      }}
      onCancel={() => setState(null)}
    />
  ) : null

  return { confirm, dialog }
}
