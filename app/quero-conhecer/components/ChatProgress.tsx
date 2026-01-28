'use client';

import { cn } from '@/lib/utils';

interface ChatProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function ChatProgress({ currentStep, totalSteps }: ChatProgressProps) {
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full space-y-2">
      {/* Barra de progresso */}
      <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Indicador de etapas */}
      <div className="flex justify-between items-center">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index < currentStep
                  ? "bg-accent scale-100"
                  : index === currentStep
                    ? "bg-accent/50 scale-110"
                    : "bg-white/20 scale-100"
              )}
            />
          ))}
        </div>
        <span className="text-xs text-white/40">
          {currentStep} de {totalSteps}
        </span>
      </div>
    </div>
  );
}
