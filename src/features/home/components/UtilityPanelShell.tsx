import type { ReactNode } from "react";

type UtilityPanelShellProps = {
  eyebrow: string;
  title: string;
  onClose?: () => void;
  children: ReactNode;
};

export default function UtilityPanelShell({ eyebrow, title, onClose, children }: UtilityPanelShellProps) {
  return (
    <div className="glass rounded-[2rem] p-3 shadow-[0_28px_60px_rgba(124,58,237,0.14)]">
      <div className="mb-3 flex items-center justify-between rounded-[1.25rem] px-3 py-2 glass-inset">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-violet-700/80">{eyebrow}</div>
          <div className="text-sm font-medium text-slate-800">{title}</div>
        </div>
        {onClose && (
          <button
            className="glass-btn inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700"
            onClick={onClose}
            title={`Hide ${title.toLowerCase()}`}
          >
            ×
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
