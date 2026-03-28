"use client";

import { useState } from "react";
import { X, Mail, MessageSquare, Smartphone, Send, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";

type Channel = "email" | "sms" | "whatsapp";

const CHANNELS: { key: Channel; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: Smartphone },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

const TEMPLATES = [
  { key: "confirmacion", label: "Confirmación de pedido", preview: "Hola {nombre}, tu pedido {id} ha sido confirmado y está siendo procesado. Te avisaremos cuando esté listo para envío." },
  { key: "preparacion", label: "Pedido en preparación", preview: "Hola {nombre}, tu pedido {id} está siendo preparado en nuestro almacén. Estimamos tenerlo listo pronto." },
  { key: "enviado", label: "Pedido enviado", preview: "Hola {nombre}, tu pedido {id} ha sido despachado. Puedes seguir tu envío con el siguiente enlace." },
  { key: "entregado", label: "Pedido entregado", preview: "Hola {nombre}, tu pedido {id} fue entregado exitosamente. ¡Esperamos que lo disfrutes!" },
  { key: "valoracion", label: "Solicitud de valoración", preview: "Hola {nombre}, ¿cómo fue tu experiencia con el pedido {id}? Nos encantaría conocer tu opinión." },
];

type NotificationDrawerProps = {
  open: boolean;
  onClose: () => void;
  destinatario: { nombre: string; email: string; telefono: string };
  pedidoId: string;
};

export default function NotificationDrawer({ open, onClose, destinatario, pedidoId }: NotificationDrawerProps) {
  const [channel, setChannel] = useState<Channel>("email");
  const [template, setTemplate] = useState(TEMPLATES[0].key);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const selectedTemplate = TEMPLATES.find(t => t.key === template) ?? TEMPLATES[0];
  const previewText = selectedTemplate.preview
    .replace("{nombre}", destinatario.nombre.split(" ")[0])
    .replace("{id}", pedidoId);

  const channelDest = channel === "email" ? destinatario.email : destinatario.telefono;

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => { setSent(false); onClose(); }, 1500);
    }, 1200);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Enviar notificación</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Pedido {pedidoId}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Channel selector */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Canal de envío
            </label>
            <div className="flex gap-2">
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                const isActive = channel === ch.key;
                return (
                  <button
                    key={ch.key}
                    onClick={() => setChannel(ch.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? "border-primary-400 bg-primary-50 text-primary-700"
                        : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destinatario */}
          <div className="bg-neutral-50 rounded-lg px-4 py-3">
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Destinatario</p>
            <p className="text-sm font-medium text-neutral-900">{destinatario.nombre}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{channelDest || "No disponible"}</p>
          </div>

          {/* Template */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Plantilla
            </label>
            <div className="relative">
              <select
                value={template}
                onChange={e => setTemplate(e.target.value)}
                className="w-full h-9 pl-3 pr-8 border border-neutral-300 rounded-md text-sm text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none appearance-none bg-white transition-all"
              >
                {TEMPLATES.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Vista previa
            </label>
            <div className="border border-neutral-200 rounded-lg p-4 bg-white">
              <p className="text-xs text-neutral-400 mb-2 font-medium">
                {channel === "email" ? "Asunto:" : "Mensaje:"} {selectedTemplate.label}
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed">{previewText}</p>
            </div>
          </div>

          {/* Sent success */}
          {sent && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
              <p className="text-sm font-medium text-green-700">✓ Notificación enviada correctamente</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 px-5 py-4 flex gap-3">
          <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSend}
            loading={sending}
            loadingText="Enviando..."
            iconLeft={<Send className="w-3.5 h-3.5" />}
            className="flex-1"
            disabled={!channelDest || sent}
          >
            Enviar notificación
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
