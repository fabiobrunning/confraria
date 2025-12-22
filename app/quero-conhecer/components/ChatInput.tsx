'use client';

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  type: 'text' | 'tel' | 'email' | 'textarea';
  placeholder?: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function ChatInput({ type, placeholder = 'Digite sua resposta...', onSubmit, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled, type]);

  const validateInput = (inputValue: string): boolean => {
    if (!inputValue.trim()) {
      setError('Este campo e obrigatorio');
      return false;
    }

    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inputValue)) {
          setError('Digite um e-mail valido');
          return false;
        }
        break;
      case 'tel':
        const phoneRegex = /^[\d\s()+-]{10,}$/;
        if (!phoneRegex.test(inputValue.replace(/\D/g, ''))) {
          setError('Digite um telefone valido (minimo 10 digitos)');
          return false;
        }
        break;
      case 'text':
        if (inputValue.trim().length < 2) {
          setError('Digite pelo menos 2 caracteres');
          return false;
        }
        break;
    }

    setError('');
    return true;
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (disabled) return;

    if (validateInput(value)) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && type !== 'textarea') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatPhone = (input: string): string => {
    const numbers = input.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    if (type === 'tel') {
      newValue = formatPhone(newValue);
    }
    setValue(newValue);
    if (error) setError('');
  };

  const inputClasses = cn(
    "w-full bg-white rounded-full border-0",
    "px-4 py-2 pr-12",
    "text-gray-800 placeholder:text-gray-400",
    "focus:outline-none focus:ring-0",
    "transition-all duration-200",
    disabled && "opacity-50 cursor-not-allowed"
  );

  const textareaClasses = cn(
    "w-full bg-white rounded-2xl border-0",
    "px-4 py-2 pr-12",
    "text-gray-800 placeholder:text-gray-400",
    "focus:outline-none focus:ring-0",
    "transition-all duration-200 resize-none",
    disabled && "opacity-50 cursor-not-allowed"
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2">
        {type === 'textarea' ? (
          <div className="flex-1 relative">
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={3}
              className={textareaClasses}
            />
            <button
              type="submit"
              disabled={disabled || !value.trim()}
              className={cn(
                "absolute right-2 bottom-2",
                "w-10 h-10 rounded-full flex items-center justify-center text-white",
                "transition-all duration-200",
                disabled || !value.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#075e54] hover:bg-[#054d44] active:scale-95"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type === 'tel' ? 'tel' : type === 'email' ? 'email' : 'text'}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off'}
              className={inputClasses}
            />
            <button
              type="submit"
              disabled={disabled || !value.trim()}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0",
                "transition-all duration-200",
                disabled || !value.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#075e54] hover:bg-[#054d44] active:scale-95"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 mx-2 text-sm text-red-600 animate-fade-in">{error}</p>
      )}
    </form>
  );
}
