/** Scritta ASCII statica (es. un banner FIGlet) che si adatta alla larghezza. */
export default function AsciiText({ lines, label, className = '', maxFont }) {
  const cols = Math.max(...lines.map((l) => l.length));
  return (
    <div className={`ascii-wrap ${className}`}>
      <pre
        className="ascii ascii-static"
        style={{ '--cols': cols, '--rows': lines.length, ...(maxFont ? { '--ascii-max': `${maxFont}px` } : null) }}
        role="img"
        aria-label={label}
      >
        {lines.map((line, i) => (
          <span key={i} className="ascii-line" style={{ '--i': i }}>
            {line.padEnd(cols)}
          </span>
        ))}
      </pre>
    </div>
  );
}
