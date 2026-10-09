import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({ label, hint, value, onChange, ...rest }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <div className="formrow">
      <label htmlFor={id}>{label}</label>
      <div className="field-wrap">
        <input
          id={id}
          className="field"
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          {...rest}
        />
        <button
          type="button"
          className="field-wrap__toggle"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
        >
          {shown ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}
