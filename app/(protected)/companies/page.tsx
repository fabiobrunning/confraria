'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Building2, MapPin, Instagram, Globe, Phone } from 'lucide-react'

interface MemberInfo {
  id: string
  full_name: string
  phone: string
}

interface Company {
  id: string
  name: string
  cnpj: string | null
  description: string | null
  phone: string | null
  instagram: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_cep: string | null
  member_companies: Array<{
    member: MemberInfo
  }>
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/companies')
      const data = await response.json()

      if (response.ok) {
        setCompanies(data.companies)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar empresas',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Regra de privacidade: só exibe telefone se for diferente do telefone do membro
  const shouldDisplayPhone = (company: Company): string | null => {
    if (!company.phone) return null

    // Busca o telefone do membro dono da empresa
    const memberPhone = company.member_companies[0]?.member?.phone

    // Se não há membro associado, exibe o telefone
    if (!memberPhone) return company.phone

    // Se os telefones são diferentes, exibe
    if (company.phone !== memberPhone) {
      return company.phone
    }

    // Se são iguais, não exibe (privacidade do membro)
    return null
  }

  const formatAddress = (company: Company): string | null => {
    const parts = []

    if (company.address_street) {
      let street = company.address_street
      if (company.address_number) street += `, ${company.address_number}`
      if (company.address_complement) street += ` - ${company.address_complement}`
      parts.push(street)
    }

    if (company.address_neighborhood) parts.push(company.address_neighborhood)
    if (company.address_city && company.address_state) {
      parts.push(`${company.address_city}/${company.address_state}`)
    }
    if (company.address_cep) parts.push(`CEP: ${company.address_cep}`)

    return parts.length > 0 ? parts.join(', ') : null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Nossas Empresas</h1>
        <p className="text-muted-foreground">
          Conheça as empresas dos membros da Confraria Pedra Branca
        </p>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma empresa cadastrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => {
            const address = formatAddress(company)
            const displayPhone = shouldDisplayPhone(company)

            return (
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {company.name}
                      </CardTitle>
                      {company.cnpj && (
                        <p className="text-xs text-muted-foreground mt-1">
                          CNPJ: {company.cnpj}
                        </p>
                      )}
                    </div>
                  </div>
                  {company.description && (
                    <CardDescription className="mt-3 line-clamp-3">
                      {company.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Endereço */}
                  {address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground">{address}</p>
                    </div>
                  )}

                  {/* Instagram/Site */}
                  {company.instagram && (
                    <div className="flex items-center gap-2 text-sm">
                      {company.instagram.startsWith('@') ? (
                        <>
                          <Instagram className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`https://instagram.com/${company.instagram.slice(1)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {company.instagram}
                          </a>
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={company.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate"
                          >
                            {company.instagram}
                          </a>
                        </>
                      )}
                    </div>
                  )}

                  {/* Telefone (com regra de privacidade) */}
                  {displayPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${displayPhone.replace(/\D/g, '')}`}
                        className="text-primary hover:underline"
                      >
                        {displayPhone}
                      </a>
                    </div>
                  )}

                  {/* Badge do membro dono */}
                  {company.member_companies[0]?.member && (
                    <div className="pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        {company.member_companies[0].member.full_name}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
