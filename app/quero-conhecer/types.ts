export type HowFoundUs = 'instagram' | 'linkedin' | 'referral' | 'google' | 'event' | 'other';

export interface ProspectFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  company_name: string;
  business_sector: string;
  how_found_us: HowFoundUs;
  has_networking_experience: boolean;
  networking_experience?: string;
  full_name?: string; // Campo auxiliar para o formulário
}

export interface ChatStep {
  field: keyof ProspectFormData;
  question: string;
  type: 'text' | 'tel' | 'email' | 'textarea' | 'select' | 'boolean';
  options?: { value: string; label: string }[];
  conditional?: keyof ProspectFormData;
  placeholder?: string;
}

export interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  isTyping?: boolean;
}

export const HOW_FOUND_OPTIONS: { value: HowFoundUs; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referral', label: 'Indicacao de um membro' },
  { value: 'google', label: 'Pesquisa no Google' },
  { value: 'event', label: 'Evento' },
  { value: 'other', label: 'Outro' },
];
