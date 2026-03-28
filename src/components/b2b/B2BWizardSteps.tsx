"use client";

import { Check } from "lucide-react";

type Step = {
  number: number;
  label: string;
};

type B2BWizardStepsProps = {
  steps: Step[];
  currentStep: number;
};

export default function B2BWizardSteps({ steps, currentStep }: B2BWizardStepsProps) {
  return (
    <div className="flex items-center gap-2 px-1">
      {steps.map((step, i) => {
        const isDone = step.number < currentStep;
        const isActive = step.number === currentStep;
        const isPending = step.number > currentStep;

        return (
          <div key={step.number} className="flex items-center gap-2 flex-1">
            {/* Step circle */}
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-primary-500 text-white ring-4 ring-primary-100"
                    : "bg-neutral-200 text-neutral-400"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : step.number}
              </div>
              <span
                className={`text-xs font-medium truncate ${
                  isDone
                    ? "text-green-700"
                    : isActive
                    ? "text-primary-700"
                    : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 rounded-full min-w-[20px] ${
                  isDone ? "bg-green-300" : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
