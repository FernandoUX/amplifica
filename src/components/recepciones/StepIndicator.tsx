import { Check } from "lucide-react";

type Step = { label: string; number: number };
const STEPS: Step[] = [
  { number: 1, label: "Definición de Destino" },
  { number: 2, label: "Detalle de Artículos" },
  { number: 3, label: "Reserva de andén" },
];

interface StepIndicatorProps {
  current: number;
  maxReached?: number;           // highest step the user has visited
  onStepClick?: (step: number) => void;
  steps?: Step[];                // optional override (e.g. only 2 steps)
}

export default function StepIndicator({ current, maxReached, onStepClick, steps }: StepIndicatorProps) {
  const activeSteps = steps ?? STEPS;
  const max = maxReached ?? current;

  return (
    <div className="flex items-center gap-0">
      {activeSteps.map((step, i) => {
        const done      = step.number < current;
        const active    = step.number === current;
        const reachable = step.number <= max;
        const clickable = reachable && !!onStepClick && step.number !== current;

        return (
          <div key={step.number} className="flex items-center">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(step.number)}
              className={`flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors
                ${clickable ? "cursor-pointer hover:bg-gray-100" : "cursor-default"}
                ${done ? "text-green-600" : active ? "text-indigo-600" : "text-gray-400"}
              `}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0
                  ${done   ? "bg-green-500 text-white"   : ""}
                  ${active ? "bg-indigo-600 text-white"  : ""}
                  ${!done && !active && reachable  ? "bg-indigo-100 text-indigo-500" : ""}
                  ${!done && !active && !reachable ? "bg-gray-100 text-gray-400"    : ""}
                `}
              >
                {done ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span className={`text-sm font-medium whitespace-nowrap
                ${done            ? "text-green-600"  : ""}
                ${active          ? "text-indigo-700" : ""}
                ${!done && !active && reachable  ? "text-indigo-400" : ""}
                ${!done && !active && !reachable ? "text-gray-400"   : ""}
              `}>
                {step.label}
              </span>
            </button>

            {i < activeSteps.length - 1 && (
              <div className={`h-px w-12 mx-3 flex-shrink-0 ${done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
