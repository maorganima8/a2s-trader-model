"use client";

import { useState } from "react";

type StepId = "step1" | "step2" | "step3" | "step4" | "step5" | "step6";

interface Step {
  id: StepId;
  title: string;
  description: string;
  tf: string;
}

interface Props {
  steps: Step[];
  initialSteps: Record<StepId, boolean>;
}

export default function ChecklistClient({ steps, initialSteps }: Props) {
  const [checked, setChecked] = useState<Record<StepId, boolean>>(initialSteps);
  const [loading, setLoading] = useState<StepId | null>(null);

  const doneCount = Object.values(checked).filter(Boolean).length;
  const allDone = doneCount === steps.length;

  async function toggle(stepId: StepId) {
    const newValue = !checked[stepId];
    setChecked((prev) => ({ ...prev, [stepId]: newValue }));
    setLoading(stepId);

    try {
      await fetch("/api/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepId, value: newValue }),
      });
    } catch {
      // revert on error
      setChecked((prev) => ({ ...prev, [stepId]: !newValue }));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">התקדמות</span>
          <span className="text-white font-medium">{doneCount}/{steps.length}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        {allDone && (
          <p className="text-green-400 text-sm text-center mt-3 font-medium">
            הצ׳קליסט הושלם — מוכן לסשן!
          </p>
        )}
      </div>

      {/* Steps */}
      {steps.map((step, index) => {
        const done = checked[step.id];
        const isLoading = loading === step.id;

        return (
          <button
            key={step.id}
            onClick={() => toggle(step.id)}
            disabled={isLoading}
            className={`w-full text-right p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3 ${
              done
                ? "bg-green-950 border-green-800"
                : "bg-gray-900 border-gray-800 hover:border-gray-600"
            }`}
          >
            {/* Checkbox */}
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                done ? "bg-green-500 border-green-500" : "border-gray-600"
              }`}
            >
              {done && <span className="text-white text-sm">✓</span>}
              {!done && (
                <span className="text-gray-600 text-xs font-bold">{index + 1}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-sm font-semibold ${done ? "text-green-400 line-through" : "text-white"}`}>
                  {step.title}
                </span>
                <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                  {step.tf}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${done ? "text-gray-500" : "text-gray-400"}`}>
                {step.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
