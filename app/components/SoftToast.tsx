"use client";

type Props = {
  show: boolean;
  emoji?: string;
  title: string;
  subtitle?: string;
  variant?: "friend" | "sparkle" | "color";
};

export function SoftToast({ show, emoji, title, subtitle, variant = "color" }: Props) {
  return (
    <div className={`toast soft-toast ${variant} ${show ? "show" : ""}`} role="status">
      {emoji && <span className="toast-emoji">{emoji}</span>}
      <div>
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  );
}
