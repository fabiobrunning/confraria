import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoginDialog from "@/components/LoginDialog";

export default function Index() {
  const navigate = useNavigate();
  const numbersAnimated = useRef(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();

    // Animate numbers
    if (!numbersAnimated.current) {
      numbersAnimated.current = true;
      setTimeout(() => {
        const allNumbers = document.querySelectorAll('.count-up');
        
        if (allNumbers.length >= 3) {
          // Primeiro número (140 - MEMBROS ATIVOS)
          let count1 = 0;
          const timer1 = setInterval(() => {
            count1 += 2;
            if (allNumbers[0]) allNumbers[0].textContent = String(count1);
            if (count1 >= 140) {
              if (allNumbers[0]) allNumbers[0].textContent = '140';
              clearInterval(timer1);
            }
          }, 25);

          // Segundo número (150 - EMPRESAS CONECTADAS)
          let count2 = 0;
          const timer2 = setInterval(() => {
            count2 += 3;
            if (allNumbers[1]) allNumbers[1].textContent = String(count2);
            if (count2 >= 150) {
              if (allNumbers[1]) allNumbers[1].textContent = '150';
              clearInterval(timer2);
            }
          }, 25);

          // Terceiro número (15M - VALOR MOVIMENTADO)
          let count3 = 0;
          const timer3 = setInterval(() => {
            count3 += 1;
            if (allNumbers[2]) allNumbers[2].textContent = '+ ' + count3 + 'M';
            if (count3 >= 15) {
              if (allNumbers[2]) allNumbers[2].textContent = '+ 15M';
              clearInterval(timer3);
            }
          }, 60);
        }
      }, 300);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen overflow-x-hidden text-white font-inter antialiased">
      {/* Background gradient */}
      <div className="fixed top-0 left-0 w-full h-full z-[1]" 
           style={{ background: 'linear-gradient(135deg, #000 0%, #000 70%, #545454 100%)' }} />
      
      {/* Mountain animation */}
      <div className="fixed bottom-0 left-0 w-full h-full z-[2] pointer-events-none overflow-hidden">
        <div 
          className="absolute bottom-0 left-0 w-[200%] h-full animate-mountain-move"
          style={{
            background: `
              linear-gradient(45deg, transparent 49.5%, rgba(128, 128, 128, 0.1) 50%, transparent 50.5%),
              linear-gradient(-45deg, transparent 49.5%, rgba(128, 128, 128, 0.08) 50%, transparent 50.5%),
              linear-gradient(30deg, transparent 49.8%, rgba(128, 128, 128, 0.06) 50%, transparent 50.2%),
              linear-gradient(-30deg, transparent 49.8%, rgba(128, 128, 128, 0.05) 50%, transparent 50.2%)
            `,
            backgroundSize: '120px 120px, 100px 100px, 80px 80px, 60px 60px'
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-20 backdrop-blur-[10px] border-b border-white/10"
              style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
        <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">
          <div className="animate-slide-in-left opacity-0 delay-100 flex items-center">
            <img 
              src="/logo-confraria.svg" 
              alt="Confraria Pedra Branca" 
              className="animate-float h-36 sm:h-48 w-auto object-contain"
            />
          </div>
          <button
            onClick={() => setLoginDialogOpen(true)}
            className="animate-slide-in-right opacity-0 delay-200 bg-transparent border border-white/30 text-white font-medium px-4 sm:px-6 py-1.5 sm:py-2 rounded text-xs sm:text-sm btn-login transition-all duration-300 relative overflow-hidden hover:bg-white hover:text-black hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,255,255,0.2)]"
          >
            Login
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10">
        <section className="px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-20">
          <div className="max-w-screen-2xl mx-auto text-center">
            <h1
              className="text-white font-archive font-normal mb-6 sm:mb-8 px-2"
              style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)', lineHeight: '1.1', letterSpacing: '0.02em' }}
            >
              CONFRARIA PEDRA BRANCA
            </h1>
            <h2
              className="font-medium font-cormorant mb-8 sm:mb-12 text-white/90 px-4"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', lineHeight: '1.3' }}
            >
              Pessoas com Visão geram Negócios com Propósito.
            </h2>
            <div className="max-w-3xl mx-auto space-y-3 sm:space-y-2 text-base sm:text-lg text-white/80 leading-relaxed px-4">
              <p>Sabe aquele networking autêntico que todo empresário procura, mas raramente encontra?</p>
              <p className="hidden sm:block">Bem-vindo à Confraria Pedra Branca. Nosso propósito é fortalecer os líderes de negócios da nossa região, criando um ambiente de confiança mútua. Aqui, o conhecimento é compartilhado sem segundas intenções, os desafios são divididos por escolha, e as conquistas são celebradas com orgulho genuíno.</p>
              <p className="sm:hidden">Bem-vindo à Confraria Pedra Branca. Fortalecemos líderes de negócios criando um ambiente de confiança mútua e conhecimento compartilhado.</p>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-6 sm:py-12">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 sm:mb-16">
              <p className="font-inter text-white/80 text-base sm:text-xl px-4">E nossos números refletem exatamente isso:</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-16 text-center">
              {/* Primeiro número - MEMBROS ATIVOS */}
              <div className="py-4">
                <div
                  className="count-up text-white font-bold font-cormorant mb-3 sm:mb-4"
                  style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)', lineHeight: '1' }}
                >
                  0
                </div>
                <div className="font-inter text-xs sm:text-sm font-medium text-white/60 tracking-wide uppercase px-2">
                  Membros Ativos
                </div>
              </div>

              {/* Segundo número - EMPRESAS CONECTADAS */}
              <div className="py-4 border-y sm:border-y-0 sm:border-x border-white/10">
                <div
                  className="count-up text-white font-bold font-cormorant mb-3 sm:mb-4"
                  style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)', lineHeight: '1' }}
                >
                  0
                </div>
                <div className="font-inter text-xs sm:text-sm font-medium text-white/60 tracking-wide uppercase px-2">
                  Empresas Conectadas
                </div>
              </div>

              {/* Terceiro número - VALOR MOVIMENTADO */}
              <div className="py-4">
                <div
                  className="count-up text-white font-bold font-cormorant mb-3 sm:mb-4"
                  style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)', lineHeight: '1' }}
                >
                  0
                </div>
                <div className="font-inter text-xs sm:text-sm font-medium text-white/60 tracking-wide uppercase px-2">
                  Valor Movimentado
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 sm:py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs sm:text-sm text-white/50 animate-fade-simple">
            © 2025 | Desenvolvido por Seivi | CNPJ: 52.607.164/0001-85
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes mountainMove {
          0% {
            transform: translateX(0) translateY(20px);
          }
          100% {
            transform: translateX(-50%) translateY(20px);
          }
        }
        .animate-mountain-move {
          animation: mountainMove 30s linear infinite;
        }
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slide-in-left {
          animation: slideInFromLeft 1s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: slideInFromRight 1s ease-out forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fade-simple {
          animation: fadeIn 1s ease-out forwards;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .btn-login::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        .btn-login:hover::before {
          left: 100%;
        }
      `}</style>

      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </div>
  );
}
