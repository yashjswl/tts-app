// Two overlapping speech bubbles: one voice, one text.
export default function BrandMark({ size = 32 }) {
  return (
    <svg className="brandmark" viewBox="0 0 34 34" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        d="M4 5h16a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H11l-5 4v-4H4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z"
        fill="currentColor"
      />
      <path
        d="M12 13h16a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2v4l-5-4H12a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3z"
        fill="var(--signal)"
        stroke="var(--brandmark-edge, var(--board))"
        strokeWidth="2"
      />
    </svg>
  );
}
