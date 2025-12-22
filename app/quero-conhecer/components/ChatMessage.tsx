'use client';

import { useEffect, useRef } from 'react';

interface ChatMessageProps {
  type: 'bot' | 'user';
  content: string;
  isTyping?: boolean;
}

export function ChatMessage({ type, content, isTyping = false }: ChatMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [content, isTyping]);

  // Função para obter horário formatado
  const getTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (type === 'bot') {
    return (
      <div ref={messageRef} className="flex justify-start mb-3 animate-fade-in-up">
        <div className="bg-white text-gray-800 rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%] shadow-sm">
          {isTyping ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-line">{content}</p>
              <span className="text-[10px] text-gray-500 float-right mt-1 ml-2">
                {getTime()}
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={messageRef} className="flex justify-end mb-3 animate-fade-in-up">
      <div className="bg-[#dcf8c6] text-gray-800 rounded-2xl rounded-tr-none px-4 py-2 max-w-[80%] shadow-sm">
        <p className="text-sm leading-relaxed">{content}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-gray-500">{getTime()}</span>
          <span className="text-[#53bdeb] text-sm">✓✓</span>
        </div>
      </div>
    </div>
  );
}
