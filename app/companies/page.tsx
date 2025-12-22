import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Phone, Globe, Instagram, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Company {
  id: string
  name: string
  description: string | null
  phone: string | null
  instagram: string | null
  website: string | null
}

export default async function PublicCompaniesPage() {
  const supabase = await createClient()

  // Buscar empresas (dados públicos)
  const { data: companiesData, error } = await supabase
    .from('companies')
    .select('id, name, description, phone, instagram, website')
    .order('name', { ascending: true })

  if (error) {
    console.error('Erro ao buscar empresas:', error)
  }

  const companies: Company[] = (companiesData || []) as Company[]

  // Formatar telefone
  const formatPhone = (phone: string | null) => {
    if (!phone) return null
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <nav className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <Link href="/">
              <Image
                src="/Confraria branca.png"
                alt="Confraria Pedra Branca"
                width={150}
                height={40}
                className="h-8 sm:h-10 w-auto"
              />
            </Link>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Nossas Empresas
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Conheça as empresas que fazem parte da Confraria Pedra Branca
            </p>
          </div>

          {/* Companies Grid */}
          {companies.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/40 text-lg">Nenhuma empresa cadastrada ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 group"
                >
                  {/* Company Icon */}
                  <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/30 transition-colors">
                    <Building2 className="h-7 w-7 text-amber-500" />
                  </div>

                  {/* Name */}
                  <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                    {company.name}
                  </h2>

                  {/* Description */}
                  {company.description && (
                    <p className="text-white/60 text-sm mb-4 line-clamp-3">
                      {company.description}
                    </p>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2 pt-4 border-t border-white/10">
                    {/* Phone */}
                    {company.phone && (
                      <a
                        href={`tel:${company.phone.replace(/\D/g, '')}`}
                        className="flex items-center gap-2 text-white/50 hover:text-amber-400 transition-colors text-sm"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{formatPhone(company.phone)}</span>
                      </a>
                    )}

                    {/* Website */}
                    {company.website && (
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white/50 hover:text-amber-400 transition-colors text-sm"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}

                    {/* Instagram */}
                    {company.instagram && (
                      <a
                        href={`https://instagram.com/${company.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white/50 hover:text-amber-400 transition-colors text-sm"
                      >
                        <Instagram className="h-4 w-4" />
                        <span>@{company.instagram.replace('@', '')}</span>
                      </a>
                    )}

                    {/* No contact info */}
                    {!company.phone && !company.website && !company.instagram && (
                      <p className="text-white/30 text-sm italic">Sem informações de contato</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-white/40 text-sm">
            Desenvolvido pela{' '}
            <a
              href="https://looping.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:text-amber-400 transition-colors"
            >
              Looping
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
