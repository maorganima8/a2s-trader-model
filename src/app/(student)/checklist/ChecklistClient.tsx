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
    <div className="space-y-4 pb-24 lg:pb-8">
      {/* Progress */}
      <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 mb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">התקדמות</span>
          <span className={`text-sm font-black ${allDone ? "text-primary" : "text-on-surface"}`}>
            {doneCount}/{steps.length}
          </span>
        </div>
        <div className="w-full bg-surface-container-highest rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500 bg-primary-container"
            style={{ width: `${pct}%` }}
          />
        </div>
        {allDone && (
          <div className="mt-4 flex items-center justify-center gap-2 bg-primary-container/20 border border-primary-container rounded-xl py-3">
            <span
              className="material-symbols-outlined text-on-primary-container text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="text-on-primary-container text-sm font-bold">מוכן לסשן!</span>
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
            className={`w-full text-right p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 ${
              done
                ? "bg-primary-container/10 border-primary-container/30"
                : "bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant hover:shadow-sm active:scale-[0.99]"
            } ${isLoading ? "opacity-60" : ""}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 transition-all ${
              done ? "bg-primary-container" : "border-2 border-outline-variant bg-surface-container"
            }`}>
              {done ? (
                <span
                  className="material-symbols-outlined text-on-primary-container text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check
                </span>
              ) : (
                <span className="text-on-surface-variant text-xs font-black">{index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-sm font-bold transition-all ${done ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                  {step.title}
                </span>
                <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md font-mono border border-outline-variant/20">
                  {step.tf}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${done ? "text-on-surface-variant/50" : "text-on-surface-variant"}`}>
                {step.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
