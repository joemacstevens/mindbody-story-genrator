import React from 'react';
import type { ReactNode, MouseEvent } from 'react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, className }) => {
  if (!isOpen) return null;

  const handleOverlayClick = () => {
    onClose();
  };

  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-background-deep/80 backdrop-blur-xl transition"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'relative w-[min(95vw,520px)] max-h-[90vh] overflow-hidden rounded-3xl border border-border-light/60 bg-background shadow-[0_24px_60px_rgba(15,23,42,0.45)]',
          'animate-[modalFadeIn_240ms_ease-out]',
          className,
        )}
        onClick={handleContentClick}
      >
        <div className="flex items-center justify-between border-b border-border-light/60 px-6 py-5">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-light/60 bg-surface/60 text-lg text-text-tertiary transition hover:border-primary hover:text-text-primary"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-5 text-sm text-text-secondary">
          {children}
        </div>
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-border-light/60 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
      <style>
        {`
          @keyframes modalFadeIn {
            from {
              opacity: 0;
              transform: translateY(12px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Modal;
