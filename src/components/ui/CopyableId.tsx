"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / non-HTTPS
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export default function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 bg-neutral-100 hover:bg-primary-50 text-neutral-700 hover:text-primary-700 rounded px-1 py-0.5 text-xs font-mono cursor-pointer transition-colors group relative"
      title="Copiar ID"
    >
      {value}
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[11px] px-2 py-1 rounded-md whitespace-nowrap shadow-lg z-50">
          Copiado
        </span>
      )}
    </button>
  );
}
