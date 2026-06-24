'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Copy, Check, Trophy } from 'lucide-react'

interface QuotaEntry {
  id: string
  quota_number: number
  member_name: string
}

interface GroupInfo {
  id: string
  name: string
  description: string | null
  quotas: QuotaEntry[]
}

const ACCESS_TOKEN = process.env.NEXT_PUBLIC_SORTEIO_TOKEN || 'confraria2026'

export default function SorteioPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const groupId = params.groupId as string
  const token = searchParams.get('token')

  const [authorized, setAuthorized] = useState(false)
  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [displayNumber, setDisplayNumber] = useState<number | null>(null)
  const [winner, setWinner] = useState<QuotaEntry | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (token === ACCESS_TOKEN) {
      setAuthorized(true)
    }
  }, [token])

  const fetchGroup = useCallback(async () => {
    if (!authorized) return
    try {
      const res = await fetch(`/api/groups/${groupId}/quotas`)
      if (!res.ok) throw new Error('Grupo não encontrado')
      const data = await res.json()
      setGroup(data)
    } catch {
      setGroup(null)
    } finally {
      setLoading(false)
    }
  }, [authorized, groupId])

  useEffect(() => { fetchGroup() }, [fetchGroup])

  const runDraw = useCallback(() => {
    if (!group || group.quotas.length === 0 || spinning) return
    setWinner(null)
    setSpinning(true)

    const duration = 4000
    const interval = 80
    let elapsed = 0

    const timer = setInterval(() => {
      elapsed += interval
      const rnd = group.quotas[Math.floor(Math.random() * group.quotas.length)]
      setDisplayNumber(rnd.quota_number)

      if (elapsed >= duration) {
        clearInterval(timer)
        const chosen = group.quotas[Math.floor(Math.random() * group.quotas.length)]
        setDisplayNumber(chosen.quota_number)
        setWinner(chosen)
        setSpinning(false)
      }
    }, interval)
  }, [group, spinning])

  const copyWinnerMessage = useCallback(async () => {
    if (!winner || !group) return
    const msg = `🏆 SORTEIO CONFRARIA PEDRA BRANCA\n\nGrupo: ${group.name}\nCota sorteada: #${winner.quota_number}\nGanhador: ${winner.member_name}\n\nParabéns! 🎉`
    await navigator.clipboard.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }, [winner, group])

  if (!authorized) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-brand text-label uppercase tracking-widest text-muted-foreground text-sm">
            Acesso restrito
          </p>
          <p className="text-muted-foreground text-sm">Token inválido ou ausente.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Grupo não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col select-none overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
        <Image
          src="/logo-confraria.svg"
          alt="Confraria Pedra Branca"
          width={140}
          height={40}
          className="h-10 w-auto"
          priority
        />
        <div className="text-right">
          <p className="font-brand text-label uppercase tracking-[0.2em] text-primary text-sm">
            {group.name}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {group.quotas.length} cotas participantes
          </p>
        </div>
      </header>

      {/* Máquina de sorteio */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12 px-8">
        {/* Display principal */}
        <div className="relative">
          <div
            className={[
              'w-64 h-64 sm:w-80 sm:h-80 rounded-3xl flex items-center justify-center',
              'bg-card border border-white/[0.08]',
              spinning ? 'animate-gold-pulse' : '',
              winner ? 'border-primary/40 shadow-[0_0_60px_hsl(44_37%_59%/0.2)]' : '',
            ].join(' ')}
          >
            {displayNumber !== null ? (
              <span
                className={[
                  'font-display font-bold leading-none tabular-nums',
                  displayNumber >= 100 ? 'text-6xl sm:text-7xl' : 'text-7xl sm:text-8xl',
                  winner ? 'text-primary animate-winner-reveal' : 'text-foreground',
                ].join(' ')}
              >
                {String(displayNumber).padStart(2, '0')}
              </span>
            ) : (
              <span className="font-display text-7xl sm:text-8xl text-white/10 font-bold">—</span>
            )}
          </div>

          {winner && (
            <div className="absolute -top-4 -right-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center animate-bounce">
              <Trophy className="w-5 h-5 text-black" />
            </div>
          )}
        </div>

        {/* Nome do ganhador */}
        {winner && (
          <div className="text-center animate-fade-up space-y-2">
            <p className="font-brand text-label uppercase tracking-[0.2em] text-primary/60 text-xs">
              Cota premiada
            </p>
            <p className="font-display text-3xl sm:text-4xl uppercase text-foreground">
              {winner.member_name}
            </p>
          </div>
        )}

        {/* Botão sortear */}
        <Button
          onClick={runDraw}
          disabled={spinning}
          className={[
            'h-16 px-12 text-lg font-brand uppercase tracking-widest',
            spinning ? 'opacity-60 cursor-wait' : '',
          ].join(' ')}
        >
          {spinning ? (
            <span className="flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Sorteando...
            </span>
          ) : winner ? (
            'Sortear novamente'
          ) : (
            'Iniciar sorteio'
          )}
        </Button>

        {/* Copiar mensagem WhatsApp */}
        {winner && (
          <Button
            variant="outline"
            onClick={copyWinnerMessage}
            className="gap-2"
          >
            {copied ? (
              <><Check className="w-4 h-4 text-green-500" /> Copiado!</>
            ) : (
              <><Copy className="w-4 h-4" /> Copiar mensagem WhatsApp</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
