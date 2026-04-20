'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  current: number;
  completed?: number[];
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, current, completed = [], onStepClick }: StepperProps) {
  return (
    <div className="flex w-full items-center">
      {steps.map((step, idx) => {
        const isDone = completed.includes(idx) && idx !== current;
        const isCurrent = idx === current;
        const lastStep = idx === steps.length - 1;
        return (
          <div key={step.label} className="flex flex-1 items-center">
            <button
              type="button"
              disabled={!onStepClick}
              onClick={() => onStepClick?.(idx)}
              className="flex items-center gap-2 disabled:cursor-default"
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  isDone && 'bg-blue-600 text-white',
                  isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-100',
                  !isDone && !isCurrent && 'bg-gray-100 text-gray-400',
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </span>
              <span
                className={cn(
                  'text-sm font-medium whitespace-nowrap',
                  isCurrent && 'text-gray-900',
                  isDone && 'text-blue-600',
                  !isDone && !isCurrent && 'text-gray-400',
                )}
              >
                {step.label}
              </span>
            </button>
            {!lastStep ? (
              <div
                className={cn(
                  'mx-3 h-px flex-1',
                  isDone ? 'bg-blue-200' : 'bg-gray-100',
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
