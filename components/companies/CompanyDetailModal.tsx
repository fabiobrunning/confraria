'use client';

import { useState } from 'react';
import { Phone, Instagram, Building2, MapPin, Edit2, Save, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Company, CompanyFormData } from './types';

interface CompanyDetailModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onUpdate: (id: string, data: Partial<CompanyFormData>) => Promise<void>;
}

export function CompanyDetailModal({
  company,
  isOpen,
  onClose,
  isAdmin,
  onUpdate,
}: CompanyDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    description: '',
    cnpj: '',
    phone: '',
    instagram: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_cep: '',
  });

  // Atualizar formData quando company mudar
  const handleStartEdit = () => {
    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
        cnpj: company.cnpj || '',
        phone: company.phone || '',
        instagram: company.instagram || '',
        address_street: company.address_street || '',
        address_number: company.address_number || '',
        address_complement: company.address_complement || '',
        address_neighborhood: company.address_neighborhood || '',
        address_city: company.address_city || '',
        address_state: company.address_state || '',
        address_cep: company.address_cep || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!company) return;
    setIsSaving(true);
    try {
      await onUpdate(company.id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!company) return null;

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    return phone.replace(/\D/g, '');
  };

  const formatInstagram = (instagram: string | null) => {
    if (!instagram) return null;
    return instagram.replace('@', '');
  };

  const formatAddress = () => {
    const parts = [];
    if (company.address_street) {
      let street = company.address_street;
      if (company.address_number) street += `, ${company.address_number}`;
      if (company.address_complement) street += ` - ${company.address_complement}`;
      parts.push(street);
    }
    if (company.address_neighborhood) parts.push(company.address_neighborhood);
    if (company.address_city && company.address_state) {
      parts.push(`${company.address_city}/${company.address_state}`);
    }
    if (company.address_cep) parts.push(`CEP: ${company.address_cep}`);
    return parts.length > 0 ? parts.join(' - ') : null;
  };

  const phoneNumber = formatPhone(company.phone);
  const instagramHandle = formatInstagram(company.instagram);
  const fullAddress = formatAddress();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Building2 className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl">
                {isEditing ? 'Editar Empresa' : company.name}
              </DialogTitle>
            </div>
            {isAdmin && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEdit}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </DialogHeader>

        {isEditing ? (
          /* Formulario de Edicao */
          <div className="space-y-6 mt-4">
            {/* Dados Basicos */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                Dados Basicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Descricao</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="Descricao da empresa"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="@usuario"
                  />
                </div>
              </div>
            </div>

            {/* Endereco */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                Endereco
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address_street">Rua</Label>
                  <Input
                    id="address_street"
                    value={formData.address_street}
                    onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="Nome da rua"
                  />
                </div>
                <div>
                  <Label htmlFor="address_number">Numero</Label>
                  <Input
                    id="address_number"
                    value={formData.address_number}
                    onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="123"
                  />
                </div>
                <div>
                  <Label htmlFor="address_complement">Complemento</Label>
                  <Input
                    id="address_complement"
                    value={formData.address_complement}
                    onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="Sala 101"
                  />
                </div>
                <div>
                  <Label htmlFor="address_neighborhood">Bairro</Label>
                  <Input
                    id="address_neighborhood"
                    value={formData.address_neighborhood}
                    onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="address_cep">CEP</Label>
                  <Input
                    id="address_cep"
                    value={formData.address_cep}
                    onChange={(e) => setFormData({ ...formData, address_cep: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <Label htmlFor="address_city">Cidade</Label>
                  <Input
                    id="address_city"
                    value={formData.address_city}
                    onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="address_state">Estado</Label>
                  <Input
                    id="address_state"
                    value={formData.address_state}
                    onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Botoes */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.name.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Visualizacao */
          <div className="space-y-6 mt-4">
            {/* Descricao */}
            {company.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Descricao
                </h3>
                <p className="text-gray-300">{company.description}</p>
              </div>
            )}

            {/* CNPJ */}
            {company.cnpj && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
                  CNPJ
                </h3>
                <p className="text-gray-300">{company.cnpj}</p>
              </div>
            )}

            {/* Contato */}
            {(phoneNumber || instagramHandle) && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                  Contato
                </h3>
                <div className="flex flex-wrap gap-3">
                  {phoneNumber && (
                    <Button
                      variant="outline"
                      className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300"
                      onClick={() => window.open(`https://wa.me/55${phoneNumber}`, '_blank')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {company.phone}
                    </Button>
                  )}
                  {instagramHandle && (
                    <Button
                      variant="outline"
                      className="bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300"
                      onClick={() => window.open(`https://instagram.com/${instagramHandle}`, '_blank')}
                    >
                      <Instagram className="w-4 h-4 mr-2" />
                      @{instagramHandle}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Endereco */}
            {fullAddress && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Endereco
                </h3>
                <div className="flex items-start gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
                  <p>{fullAddress}</p>
                </div>
              </div>
            )}

            {/* Membros Vinculados */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                Membros Vinculados ({company.members_count})
              </h3>
              {company.members && company.members.length > 0 ? (
                <div className="space-y-2">
                  {company.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-medium">
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-200">{member.full_name}</span>
                      </div>
                      <div className="flex gap-2">
                        {member.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            onClick={() => window.open(`https://wa.me/55${member.phone.replace(/\D/g, '')}`, '_blank')}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                        {member.instagram && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
                            onClick={() => window.open(`https://instagram.com/${member.instagram?.replace('@', '')}`, '_blank')}
                          >
                            <Instagram className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum membro vinculado a esta empresa.</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
