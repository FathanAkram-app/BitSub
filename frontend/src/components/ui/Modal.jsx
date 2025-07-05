export function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function ModalContent({ children }) {
  return <div className="modal-content">{children}</div>
}

export function ModalActions({ children }) {
  return <div className="form-actions">{children}</div>
}