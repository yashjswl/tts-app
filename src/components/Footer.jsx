import { COPYRIGHT } from '../config';

export default function Footer({ className = '' }) {
  return <footer className={`footer ${className}`.trim()}>{COPYRIGHT}</footer>;
}
