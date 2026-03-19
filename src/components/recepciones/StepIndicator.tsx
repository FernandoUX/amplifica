import { IconCheck } from "@tabler/icons-react";

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
    <>
      {/* ── Desktop stepper ── */}
      <div className="hidden sm:flex items-center gap-0">
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
                className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-300
                  ${clickable ? "cursor-pointer hover:bg-neutral-100" : "cursor-default"}
                  ${done ? "text-green-600" : active ? "text-primary-500" : "text-neutral-400"}
                `}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0
                    ${done   ? "bg-green-500 text-white"   : ""}
                    ${active ? "bg-primary-500 text-white"  : ""}
                    ${!done && !active && reachable  ? "bg-primary-100 text-primary-500" : ""}
                    ${!done && !active && !reachable ? "bg-neutral-100 text-neutral-400"    : ""}
                  `}
                >
                  {done ? <IconCheck className="w-4 h-4" /> : step.number}
                </div>
                <span className={`text-sm font-medium whitespace-nowrap
                  ${done            ? "text-green-600"  : ""}
                  ${active          ? "text-primary-600" : ""}
                  ${!done && !active && reachable  ? "text-primary-400" : ""}
                  ${!done && !active && !reachable ? "text-neutral-400"   : ""}
                `}>
                  {step.label}
                </span>
              </button>

              {i < activeSteps.length - 1 && (
                <div className={`h-px w-12 mx-3 flex-shrink-0 ${done ? "bg-green-400" : "bg-neutral-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mobile stepper ── */}
      <div className="sm:hidden">
        {/* Progress dots + connectors */}
        <div className="flex items-center justify-center gap-0">
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
                  className={`flex items-center justify-center transition-colors duration-300
                    ${clickable ? "cursor-pointer" : "cursor-default"}
                  `}
                >
                  <div
                    className={`flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 transition-all duration-300
                      ${active ? "w-7 h-7 text-sm" : "w-6 h-6"}
                      ${done   ? "bg-green-500 text-white"   : ""}
                      ${active ? "bg-primary-500 text-white ring-4 ring-primary-100"  : ""}
                      ${!done && !active && reachable  ? "bg-primary-100 text-primary-500" : ""}
                      ${!done && !active && !reachable ? "bg-neutral-100 text-neutral-400"    : ""}
                    `}
                  >
                    {done ? <IconCheck className="w-3.5 h-3.5" /> : step.number}
                  </div>
                </button>

                {i < activeSteps.length - 1 && (
                  <div className={`h-px w-14 mx-3 flex-shrink-0 ${done ? "bg-green-400" : "bg-neutral-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Active step label */}
        <p className="text-center text-xs font-semibold text-primary-600 mt-2">
          Paso {current} de {activeSteps.length} — {activeSteps.find(s => s.number === current)?.label}
        </p>
      </div>
    </>
  );
}
