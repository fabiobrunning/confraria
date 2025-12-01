'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ChatForm } from './components';

export default function QueroConhecerPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e5ddd5' }}>
      {/* Header estilo WhatsApp */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center gap-3" style={{ backgroundColor: '#075e54' }}>
        <Link
          href="/"
          className="text-white hover:opacity-80 transition-opacity"
          aria-label="Voltar para a pagina inicial"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl" role="img" aria-label="handshake">🤝</span>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-white font-medium text-base truncate">
            Confraria Pedra Branca
          </h1>
          <p className="text-white/70 text-xs">
            online
          </p>
        </div>
      </header>

      {/* Chat container */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-hidden">
        <ChatForm />
      </main>
    </div>
  );
}
