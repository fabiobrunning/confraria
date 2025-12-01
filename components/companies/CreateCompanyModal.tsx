'use client';

import { useState } from 'react';
import { Building2, Save, Loader2 } from 'lucide-react';
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
import type { CompanyFormData } from './types';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CompanyFormData) => Promise<void>;
}

const initialFormData: CompanyFormData = {
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
};

export function CreateCompanyModal({
  isOpen,
  onClose,
  onCreate,
}: CreateCompanyModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setIsSaving(true);
    try {
      await onCreate(formData);
      setFormData(initialFormData);
      onClose();
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Building2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl">Nova Empresa</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Dados Basicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              Dados Basicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="create-name">Nome da Empresa *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 mt-1"
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="create-description">Descricao</Label>
                <Textarea
                  id="create-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 mt-1"
                  placeholder="Descricao da empresa"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="create-cnpj">CNPJ</Label>
                <Input
                  id="create-cnpj"
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
                <Label htmlFor="create-phone">Telefone</Label>
                <Input
                  id="create-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-gray-800 border-gray-700 mt-1"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="create-instagram">Instagram</Label>
                <Input
                  id="create-instagram"
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
                <Label htmlFor="create-address_street">Rua</Label>
                <Input
                  id="create-address_street"
                  value={formData.address_street}
                  onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                  className="bg-gray-800 border-gray-700 mt-1"
                  placeholder="Nome da rua"
                />
              </div>
              <div>
                <Label htmlFor="create-address_number">Numero</Label>
                <Input
                  id="create-address_number"
                  value={formData.address_number}
                  onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                  className="bg-gray-800 border-gray-700 mt-1"
                  placeholder="123"
                />
              </div>
              <div>
                <Label htmlFor="create-address_complement">Complemento</Label>
                <Input
                  id="create-address_complement"
                  value={formData.address_complement}
                  onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                  className="bg-gray-800 border-gray-700 mt-1"
                  placeholder="Sala 101"
                />
              </div>
              <div>
                <Label htmlFor="create-address_neighborhood">Bairro</Label>
                <Input
                  id="create-address_neighborhood"
                  value={formData.address_neighborhood}
                  onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                  className="bg-gray-800 border-gray-700 mt-1"
                  placeholder="Bairro"
                />
              </div>
              <div>
                <Label htmlFor="create-address_cep">CEP</Label>
                <Input
                  id="create-address_cep"
                  value={formData.address_cep}
                  onChange={(e) => setFormData({ ...formData, address_cep: e.target.value })}
                  className="bg-gray-800 border-gray-700 mt-1"
                  placeholder="00000-000"
                />
              </div>
              <div>
                <Label htmlFor="create-address_city">Cidade</Label>
                <Input
                  id="create-address_city"
                  value={formData.address_city}
                  onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                  className="bg-gray-800 border-gray-700 mt-1"
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label htmlFor="create-address_state">Estado</Label>
                <Input
                  id="create-address_state"
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
              onClick={handleClose}
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
                  Criando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Criar Empresa
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
