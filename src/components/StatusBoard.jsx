import { describeState } from '../lib/status';

/** Station-board style readout: who this side is, what it is doing now, and in which language. */
export default function StatusBoard({ role, speech, language }) {
  const state = describeState(role, speech);
  return (
    <div className="board" data-tone={state.tone} role="status">
      <span className="board__cell board__role">{role === 'speaker' ? 'Speaker' : 'Typist'}</span>
      <span className="board__cell board__state">
        <i className="board__lamp" aria-hidden="true" />
        {state.label}
      </span>
      {language && <span className="board__cell board__lang">{language}</span>}
    </div>
  );
}
