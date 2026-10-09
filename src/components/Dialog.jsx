import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Native <dialog>: focus trap, Esc to close and inert background come from the browser. */
export default function Dialog({ open, onClose, title, variant = 'center', children, labelledBy }) {
  const ref = useRef(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // React's autoFocus runs before the dialog is open, so focus the marked field here.
      dialog.querySelector('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`dialog dialog--${variant}`}
      aria-labelledby={labelledBy ?? 'dialog-title'}
      // Esc closes natively; ignore the close event that follows our own programmatic close().
      onClose={() => openRef.current && onClose()}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {open && (
        <div className="dialog__body">
          <header className="dialog__head">
            <h2 id={labelledBy ?? 'dialog-title'}>{title}</h2>
            <button type="button" className="btn btn--icon btn--ghost" onClick={onClose} aria-label="Close">
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
