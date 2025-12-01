'use client';

import { useState, useMemo } from 'react';
import { Search, Building2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CompanyCard } from './CompanyCard';
import { CompanyDetailModal } from './CompanyDetailModal';
import type { Company, CompanyFormData } from './types';

interface CompaniesClientProps {
  initialCompanies: Company[];
  isAdmin: boolean;
}

export function CompaniesClient({ initialCompanies, isAdmin }: CompaniesClientProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading] = useState(false);

  // Filtrar empresas localmente
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(company =>
      company.name.toLowerCase().includes(term) ||
      company.description?.toLowerCase().includes(term) ||
      company.address_city?.toLowerCase().includes(term)
    );
  }, [companies, searchTerm]);

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedCompany(null);
  };

  const handleUpdateCompany = async (id: string, data: Partial<CompanyFormData>) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar empresa');
      }

      // Atualizar lista local
      setCompanies(prev =>
        prev.map(c => c.id === id ? { ...c, ...result.data } : c)
      );

      // Atualizar empresa selecionada
      if (selectedCompany?.id === id) {
        setSelectedCompany(prev => prev ? { ...prev, ...result.data } : null);
      }
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Empresas</h1>
          <p className="text-gray-400 mt-1">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa conectada' : 'empresas conectadas'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            As empresas sao cadastradas atraves do perfil de cada membro
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          type="text"
          placeholder="Buscar por nome, descricao ou cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500/50"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* Grid de Empresas */}
      {!isLoading && filteredCompanies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onSelect={handleSelectCompany}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCompanies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="p-4 rounded-full bg-gray-800 mb-4">
            <Building2 className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
          </h3>
          <p className="text-gray-400 text-center max-w-md">
            {searchTerm
              ? `Nao encontramos empresas com "${searchTerm}". Tente outro termo.`
              : 'As empresas sao cadastradas atraves do perfil de cada membro.'}
          </p>
        </div>
      )}

      {/* Modal de Detalhes */}
      <CompanyDetailModal
        company={selectedCompany}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        isAdmin={isAdmin}
        onUpdate={handleUpdateCompany}
      />
    </div>
  );
}
