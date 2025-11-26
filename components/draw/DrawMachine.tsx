'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dices, Trophy, RotateCcw, Sparkles } from 'lucide-react'

interface DrawMachineProps {
  availableNumbers: number[]
  excludedNumbers?: number[]
  onNumberDrawn?: (number: number) => void
  onDrawComplete: (
    drawnNumbers: number[],
    winner: number,
    position: number
  ) => void
  minDraws?: number
  disabled?: boolean
}

export function DrawMachine({
  availableNumbers,
  excludedNumbers = [],
  onNumberDrawn,
  onDrawComplete,
  minDraws = 5,
  disabled = false,
}: DrawMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentNumber, setCurrentNumber] = useState<number | null>(null)
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  const [winner, setWinner] = useState<number | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const remainingNumbers = availableNumbers.filter(
    (n) => !drawnNumbers.includes(n) && !excludedNumbers.includes(n)
  )
  const canFinish = drawnNumbers.length >= minDraws && remainingNumbers.length > 0
  const canDraw = remainingNumbers.length > 0 && !winner

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [])

  const startDraw = useCallback(() => {
    if (!canDraw || isSpinning) return

    setIsSpinning(true)
    let iterations = 0
    const maxIterations = 25 + Math.floor(Math.random() * 15) // 25-40 iterations

    const animate = () => {
      iterations++
      const randomIndex = Math.floor(Math.random() * remainingNumbers.length)
      setCurrentNumber(remainingNumbers[randomIndex])

      if (iterations < maxIterations) {
        // Speed decreases as we approach the end (easing)
        const progress = iterations / maxIterations
        const delay = 50 + progress * progress * 250 // 50ms to ~300ms
        animationRef.current = setTimeout(animate, delay)
      } else {
        // Final selection
        const finalIndex = Math.floor(Math.random() * remainingNumbers.length)
        const selectedNumber = remainingNumbers[finalIndex]
        setCurrentNumber(selectedNumber)
        setDrawnNumbers((prev) => [...prev, selectedNumber])
        setIsSpinning(false)
        onNumberDrawn?.(selectedNumber)
      }
    }

    animate()
  }, [canDraw, isSpinning, remainingNumbers, onNumberDrawn])

  const finishDraw = useCallback(() => {
    if (!canFinish || isSpinning) return

    // The last drawn number is the winner
    const winnerNumber = drawnNumbers[drawnNumbers.length - 1]
    if (!winnerNumber) return

    setWinner(winnerNumber)
    setShowCelebration(true)

    // Hide celebration after animation
    setTimeout(() => {
      setShowCelebration(false)
    }, 3000)

    onDrawComplete(drawnNumbers, winnerNumber, drawnNumbers.length)
  }, [canFinish, isSpinning, drawnNumbers, onDrawComplete])

  const reset = useCallback(() => {
    setDrawnNumbers([])
    setCurrentNumber(null)
    setWinner(null)
    setShowCelebration(false)
    setIsSpinning(false)
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden">
      <CardHeader className="text-center bg-gradient-to-r from-accent/20 to-accent/10">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Dices className="h-6 w-6" />
          Maquina de Sorteio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Current Number Display */}
        <div className="flex justify-center py-8">
          <div className="relative">
            {/* Glow effect background */}
            <motion.div
              className={`absolute inset-0 rounded-full blur-xl ${
                isSpinning ? 'bg-accent/50' : winner ? 'bg-green-500/50' : 'bg-accent/20'
              }`}
              animate={{
                scale: isSpinning ? [1, 1.2, 1] : 1,
                opacity: isSpinning ? [0.5, 0.8, 0.5] : winner ? 0.6 : 0.3,
              }}
              transition={{
                duration: 0.5,
                repeat: isSpinning ? Infinity : 0,
              }}
            />

            {/* Main number display */}
            <motion.div
              className={`
                relative w-36 h-36 rounded-full flex items-center justify-center
                text-6xl font-bold border-4 shadow-2xl
                ${
                  winner
                    ? 'bg-green-500 border-green-400 text-white'
                    : isSpinning
                    ? 'bg-accent border-accent text-white'
                    : 'bg-card border-border text-foreground'
                }
              `}
              animate={{
                scale: isSpinning ? [1, 1.05, 1] : winner ? [1, 1.1, 1] : 1,
                rotate: isSpinning ? [0, 5, -5, 0] : 0,
              }}
              transition={{
                duration: isSpinning ? 0.15 : 0.3,
                repeat: isSpinning ? Infinity : 0,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentNumber ?? 'empty'}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  {currentNumber ?? '?'}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Celebration overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10"
            >
              <div className="text-center space-y-4 p-8">
                <motion.div
                  animate={{
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 0.5, repeat: 3 }}
                >
                  <Trophy className="h-20 w-20 text-yellow-400 mx-auto" />
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-3xl font-bold text-white">GANHADOR!</p>
                  <p className="text-5xl font-bold text-yellow-400">
                    Cota #{winner}
                  </p>
                </motion.div>
                {/* Sparkles animation */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{
                      x: 0,
                      y: 0,
                      opacity: 1,
                    }}
                    animate={{
                      x: Math.cos((i * 30 * Math.PI) / 180) * 150,
                      y: Math.sin((i * 30 * Math.PI) / 180) * 150,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 1,
                      delay: 0.2,
                      repeat: 2,
                    }}
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Winner announcement (persistent) */}
        <AnimatePresence>
          {winner && !showCelebration && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-4 bg-green-500/20 border border-green-500/50 rounded-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-green-500" />
                <p className="text-xl font-bold text-green-600">
                  GANHADOR: Cota #{winner}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Sorteio salvo com sucesso!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drawn Numbers History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Numeros sorteados:
            </p>
            <Badge variant="outline" className="text-xs">
              {drawnNumbers.length}/{minDraws} minimo
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-muted/30 rounded-lg">
            <AnimatePresence>
              {drawnNumbers.map((num, idx) => (
                <motion.div
                  key={`${num}-${idx}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Badge
                    variant={num === winner ? 'default' : 'secondary'}
                    className={`text-lg px-3 py-1 ${
                      num === winner
                        ? 'bg-green-500 hover:bg-green-600'
                        : ''
                    }`}
                  >
                    {num}
                    {idx === drawnNumbers.length - 1 && !winner && (
                      <span className="ml-1 text-xs opacity-70">
                        (ultimo)
                      </span>
                    )}
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
            {drawnNumbers.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Nenhum numero sorteado ainda
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={startDraw}
            disabled={disabled || isSpinning || !canDraw || !!winner}
            size="lg"
            className="flex-1 text-lg h-14"
          >
            {isSpinning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Dices className="mr-2 h-5 w-5" />
                </motion.div>
                Sorteando...
              </>
            ) : (
              <>
                <Dices className="mr-2 h-5 w-5" />
                SORTEAR
              </>
            )}
          </Button>

          {canFinish && !winner && (
            <Button
              onClick={finishDraw}
              disabled={disabled || isSpinning}
              size="lg"
              className="flex-1 text-lg h-14 bg-green-600 hover:bg-green-700"
            >
              <Trophy className="mr-2 h-5 w-5" />
              SALVAR GANHADOR
            </Button>
          )}

          {winner && (
            <Button
              onClick={reset}
              variant="outline"
              size="lg"
              className="flex-1 text-lg h-14"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Novo Sorteio
            </Button>
          )}
        </div>

        {/* Progress Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>
            Cotas disponiveis: {remainingNumbers.length}
            {drawnNumbers.length > 0 && ` (${availableNumbers.length} total)`}
          </p>
          {!canFinish && drawnNumbers.length > 0 && drawnNumbers.length < minDraws && (
            <p className="text-amber-600 font-medium">
              Sorteie mais {minDraws - drawnNumbers.length} numero(s) antes de
              finalizar
            </p>
          )}
          {canFinish && !winner && (
            <p className="text-green-600 font-medium">
              Voce pode salvar o ganhador ou continuar sorteando
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
