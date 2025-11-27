import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-2xl">
        <img
          src="/Confraria branca.png"
          alt="Confraria Pedra Branca"
          className="h-32 w-auto mx-auto"
        />
        <h1 className="text-4xl sm:text-5xl font-display tracking-wide text-white">
          CONFRARIA PEDRA BRANCA
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 font-serif">
          Sistema de Gestao de Consorcios
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white font-medium px-8"
            >
              Acessar Sistema
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
