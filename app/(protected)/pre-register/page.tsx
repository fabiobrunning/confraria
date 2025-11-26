import { Card, CardContent } from '@/components/ui/card'

export default function PreRegisterPage() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Pre-Cadastro</h1>
        <p className="text-muted-foreground">Cadastre novos membros no sistema</p>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Pagina em migracao - use a versao anterior em /pre-register (Vite)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
