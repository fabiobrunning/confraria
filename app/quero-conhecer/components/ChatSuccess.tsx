'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Instagram, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatSuccessProps {
  firstName: string;
}

interface Confetti {
  id: number;
  left: number;
  animationDelay: number;
  animationDuration: number;
  color: string;
}

export function ChatSuccess({ firstName }: ChatSuccessProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Gerar confetti
    const colors = ['#C4A052', '#FFD700', '#FFFFFF', '#C4A052'];
    const newConfetti: Confetti[] = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDelay: Math.random() * 2,
      animationDuration: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfetti(newConfetti);

    // Mostrar conteudo apos delay
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden"
      style={{ backgroundColor: '#e5ddd5' }}
    >
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${piece.left}%`,
              top: '-10px',
              backgroundColor: piece.color,
              animationDelay: `${piece.animationDelay}s`,
              animationDuration: `${piece.animationDuration}s`,
            }}
          />
        ))}
      </div>

      {/* Conteudo */}
      <div
        className={cn(
          "relative z-10 space-y-6 max-w-md transition-all duration-700",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
      >
        {/* Icone de sucesso */}
        <div className="flex justify-center">
          <div className="text-6xl mb-4">🎉</div>
        </div>

        {/* Mensagem estilo WhatsApp */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-800">
            Perfeito, {firstName}!
          </h2>

          <p className="text-gray-600 text-base leading-relaxed">
            Muito obrigado pelo seu interesse.
          </p>

          <p className="text-gray-600 text-base leading-relaxed">
            Em breve um dos nossos membros entrara em contato pelo WhatsApp.
          </p>
        </div>

        {/* CTA Instagram */}
        <div className="space-y-4 pt-4">
          <p className="text-gray-600 text-sm">
            Enquanto isso, siga-nos no Instagram:
          </p>

          <Link
            href="https://instagram.com/confrariadapedrabranca"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-3 px-6 py-3 rounded-full",
              "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500",
              "text-white font-medium",
              "hover:scale-105 active:scale-95",
              "transition-transform duration-200",
              "shadow-lg shadow-pink-500/25"
            )}
          >
            <Instagram className="w-5 h-5" />
            @confrariadapedrabranca
          </Link>
        </div>

        {/* Link para voltar */}
        <Link
          href="/"
          className="inline-block text-gray-600 hover:text-gray-800 text-sm transition-colors mt-4"
        >
          Voltar para a pagina inicial
        </Link>
      </div>

      {/* Estilo para animacao do confetti */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
