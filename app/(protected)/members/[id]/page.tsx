import { Card, CardContent } from '@/components/ui/card'

export default function MemberEditPage() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Editar Membro</h1>
        <p className="text-muted-foreground">Edite as informacoes do membro</p>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Pagina em migracao - use a versao anterior
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
