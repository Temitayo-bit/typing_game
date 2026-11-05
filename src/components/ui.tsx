import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[28px] border border-line bg-white p-6 sm:p-7 ${className}`}>{children}</div>;
}

type ButtonProps = { children: ReactNode; onClick: () => void; kind?: 'primary' | 'soft' | 'ghost'; disabled?: boolean };

export function Button({ children, onClick, kind = 'primary', disabled }: ButtonProps) {
  const styles = {
    primary: 'bg-accent text-white hover:bg-berry',
    soft: 'bg-petal text-wine hover:bg-blush',
    ghost: 'text-wine hover:bg-petal',
  }[kind];
  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        onClick();
        e.currentTarget.blur();
      }}
      className={`min-h-11 rounded-full px-6 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md bg-petal px-2 py-0.5 font-mono text-sm">{children}</kbd>;
}

export function Heart({ size = 26, color = '#F06A9B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 2.9 5 6.4 5c2.1 0 3.6 1.2 4.4 2.6h2.4C14 6.2 15.5 5 17.6 5 21.1 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}
