import { useEffect, useCallback } from 'react';
import { Cancel } from 'pixelarticons/react';

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
}

export function TransactionDialog({ open, onClose, onConfirm, title, children, confirmLabel = 'Confirm', loading }: TransactionDialogProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) onClose();
  }, [onClose, loading]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="pixel-card p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl uppercase tracking-wide">{title}</h3>
          <button onClick={onClose} disabled={loading} className="pixel-icon-btn w-8 h-8 text-m2e-text-muted hover:text-m2e-text disabled:opacity-50">
            <Cancel className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-m2e-text-secondary text-lg">
          {children}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="pixel-btn pixel-btn-secondary flex-1 py-2.5 text-sm" disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} className="pixel-btn pixel-btn-primary flex-1 py-2.5 text-sm" disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
