export default function Segmented({ label, value, onChange, options }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          className="segmented__option"
          onClick={() => onChange(option.id)}
          style={option.style}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
