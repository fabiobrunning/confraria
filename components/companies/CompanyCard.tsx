'use client';

import { Phone, Instagram, Users, Building2, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Company } from './types';

interface CompanyCardProps {
  company: Company;
  onSelect: (company: Company) => void;
}

export function CompanyCard({ company, onSelect }: CompanyCardProps) {
  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    // Remove caracteres nao numericos
    const cleaned = phone.replace(/\D/g, '');
    // Formata para WhatsApp link
    return cleaned;
  };

  const formatInstagram = (instagram: string | null) => {
    if (!instagram) return null;
    // Remove @ se existir
    return instagram.replace('@', '');
  };

  const phoneNumber = formatPhone(company.phone);
  const instagramHandle = formatInstagram(company.instagram);

  const hasLocation = company.address_city && company.address_state;

  return (
    <Card
      className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
      onClick={() => onSelect(company)}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
              {company.name}
            </h3>
            {hasLocation && (
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {company.address_city}, {company.address_state}
              </p>
            )}
          </div>
        </div>

        {/* Descricao */}
        {company.description && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">
            {company.description}
          </p>
        )}

        {/* Acoes */}
        <div className="flex flex-wrap gap-2 mt-4">
          {phoneNumber && (
            <Button
              variant="outline"
              size="sm"
              className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://wa.me/55${phoneNumber}`, '_blank');
              }}
            >
              <Phone className="w-4 h-4 mr-1" />
              Chamar
            </Button>
          )}

          {instagramHandle && (
            <Button
              variant="outline"
              size="sm"
              className="bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://instagram.com/${instagramHandle}`, '_blank');
              }}
            >
              <Instagram className="w-4 h-4 mr-1" />
              Instagram
            </Button>
          )}
        </div>

        {/* Membros Vinculados */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">
              {company.members_count === 0
                ? 'Sem membros vinculados'
                : company.members_count === 1
                  ? '1 membro vinculado'
                  : `${company.members_count} membros vinculados`}
            </span>
          </div>
          {company.members && company.members.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {company.members.slice(0, 3).map((member) => (
                <span
                  key={member.id}
                  className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400"
                >
                  {member.full_name.split(' ')[0]}
                </span>
              ))}
              {company.members.length > 3 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-400">
                  +{company.members.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
