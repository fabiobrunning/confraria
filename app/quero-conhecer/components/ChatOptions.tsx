'use client';

import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface ChatOptionsProps {
  options: Option[];
  onSelect: (value: string, label: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'boolean';
}

export function ChatOptions({ options, onSelect, disabled = false, variant = 'default' }: ChatOptionsProps) {
  if (variant === 'boolean') {
    return (
      <div className="flex gap-2 animate-fade-in-up">
        {options.map((option, index) => (
          <button
            key={option.value}
            onClick={() => !disabled && onSelect(option.value, option.label)}
            disabled={disabled}
            className={cn(
              "flex-1 px-6 py-3 rounded-full",
              "font-medium text-sm",
              "transition-all duration-200",
              "border-2",
              option.value === 'true'
                ? "bg-white border-[#075e54] text-[#075e54] hover:bg-[#075e54] hover:text-white"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
              disabled && "opacity-50 cursor-not-allowed",
              !disabled && "active:scale-95"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 animate-fade-in-up">
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => !disabled && onSelect(option.value, option.label)}
          disabled={disabled}
          className={cn(
            "px-4 py-2.5 rounded-full",
            "bg-white border border-gray-300",
            "text-gray-700 text-sm",
            "transition-all duration-200",
            !disabled && "hover:bg-gray-50 hover:border-[#075e54] hover:text-[#075e54]",
            !disabled && "active:scale-95",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
