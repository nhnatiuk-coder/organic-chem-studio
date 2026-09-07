type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function FlaskIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <path d="M10 3h4M10.5 3v6.2L5.6 18a2 2 0 0 0 1.7 3h9.4a2 2 0 0 0 1.7-3l-4.9-8.8V3" />
      <path d="M8 15h8" />
    </svg>
  );
}

export function PencilIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20Z" />
      <path d="M13.5 7 17 10.5" />
    </svg>
  );
}

export function TagIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <path d="M3.5 11.5V4.5a1 1 0 0 1 1-1h7l8.5 8.5-8 8-8.5-8.5Z" />
      <circle cx="8" cy="8" r="1.4" />
    </svg>
  );
}

export function HexIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4Z" />
      <path d="M12 7v10M8 9v6M16 9v6" />
    </svg>
  );
}

export function LightbulbIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <path d="M9 17h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.2.9 1.9V17h5.4v-1.3c0-.7.3-1.4.9-1.9A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

export function CheckIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function CrossIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function BookIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <path d="M4 4.5h6a3 3 0 0 1 2 .9 3 3 0 0 1 2-.9h6v13h-6a3 3 0 0 0-2 .9 3 3 0 0 0-2-.9H4Z" />
      <path d="M12 5.4V18.5" />
    </svg>
  );
}

export function ChartIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <path d="M4 20h16M7 20v-6M12 20V6M17 20v-9" />
    </svg>
  );
}
