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
  const pct = Math.round((doneCount / steps.length) * 100);

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
      setChecked((prev) => ({ ...prev, [stepId]: !newValue }));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3 pb-24">
      {/* Progress bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-2">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-zinc-400 text-sm">התקדמות</span>
          <span className={`text-sm font-bold ${allDone ? "text-yellow-400" : "text-white"}`}>
            {doneCount}/{steps.length}
          </span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${allDone ? "bg-yellow-400" : "bg-yellow-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {allDone && (
          <div className="mt-3 flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span className="text-yellow-400 text-sm font-semibold">מוכן לסשן!</span>
          </div>
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
                ? "bg-yellow-500/5 border-yellow-500/25"
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 active:scale-[0.99]"
            } ${isLoading ? "opacity-60" : ""}`}
          >
            {/* Circle */}
            <div className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
              done ? "bg-yellow-500 border-yellow-500" : "border-zinc-700"
            }`}>
              {done ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <span className="text-zinc-600 text-xs font-bold">{index + 1}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className={`text-sm font-semibold transition-all ${done ? "text-zinc-500 line-through" : "text-white"}`}>
                  {step.title}
                </span>
                <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-md font-mono">
                  {step.tf}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${done ? "text-zinc-600" : "text-zinc-500"}`}>
                {step.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
