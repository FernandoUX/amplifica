"use client";

import { useState, type ReactNode } from "react";
import { InfoCircle, X, CheckCircle } from "@untitled-ui/icons-react";

type PageInfoModalProps = {
  /** Page title shown in the modal header */
  title: string;
  /** Descriptive paragraph (supports JSX) */
  description: ReactNode;
  /** Optional bullet list with green check icons */
  features?: string[];
  /** Extra content below features */
  children?: ReactNode;
};

export default function PageInfoModal({ title, description, features, children }: PageInfoModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="text-neutral-400 hover:text-neutral-600 transition-colors duration-300"
      >
        <InfoCircle className="w-5 h-5" />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <InfoCircle className="w-5 h-5 text-primary-500" />
                </div>
                <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 flex-shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <div className="text-sm text-neutral-600 leading-relaxed">{description}</div>

            {/* Features list */}
            {features && features.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-neutral-500">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {/* Extra content */}
            {children}
          </div>
        </div>
      )}
    </>
  );
}
