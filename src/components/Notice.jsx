import { X } from 'lucide-react';

export default function Notice({ children, onDismiss, tone = 'error' }) {
  if (!children) return null;
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <p>{children}</p>
      {onDismiss && (
        <button type="button" className="btn btn--icon btn--ghost" onClick={onDismiss} aria-label="Dismiss message">
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
