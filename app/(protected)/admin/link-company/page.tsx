'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Link, CheckCircle2, AlertCircle } from 'lucide-react'

interface Member {
  id: string
  full_name: string
}

interface Company {
  id: string
  name: string
}

interface LinkData {
  id: string
  member_id: string
  company_id: string
  member_name: string
  company_name: string
}

export default function LinkCompanyPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [links, setLinks] = useState<LinkData[]>([])
  const [companiesWithoutLinks, setCompaniesWithoutLinks] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/debug-links')
      const result = await response.json()

      if (result.success) {
        setMembers(result.data.members || [])
        setCompanies(result.data.companies || [])
        setLinks(result.data.links || [])
        setCompaniesWithoutLinks(result.data.companiesWithoutLinks || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateLink = async () => {
    if (!selectedMember || !selectedCompany) {
      setMessage({ type: 'error', text: 'Selecione um membro e uma empresa' })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/debug-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: selectedMember,
          company_id: selectedCompany
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Vinculo criado com sucesso!' })
        setSelectedMember('')
        setSelectedCompany('')
        fetchData()
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao criar vinculo' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao criar vinculo' })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Vincular Empresa a Membro</h1>

      {/* Criar Vinculo */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Link className="w-5 h-5" />
            Criar Novo Vinculo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Membro</label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Empresa</label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <Button
            onClick={handleCreateLink}
            disabled={creating || !selectedMember || !selectedCompany}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Criar Vinculo
          </Button>
        </CardContent>
      </Card>

      {/* Empresas sem Vinculo */}
      {companiesWithoutLinks.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Empresas sem Vinculo ({companiesWithoutLinks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {companiesWithoutLinks.map((company) => (
                <span key={company.id} className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
                  {company.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vinculos Existentes */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Vinculos Existentes ({links.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-gray-400">Nenhum vinculo encontrado</p>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="flex items-center gap-2 p-2 rounded bg-white/5">
                  <span className="text-amber-400">{link.member_name}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-white">{link.company_name}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
