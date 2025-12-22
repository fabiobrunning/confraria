'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatOptions } from './ChatOptions';
import { ChatSuccess } from './ChatSuccess';
import { ChatStep, Message, ProspectFormData, HOW_FOUND_OPTIONS } from '../types';

const TYPING_DELAY = 800;
const MESSAGE_DELAY = 600;

const steps: ChatStep[] = [
  {
    field: 'full_name',
    question: 'Ola, seja bem-vindo!\n\nQue bom que voce quer conhecer a Nossa Confraria.\n\nPara comecar, qual e o seu nome?',
    type: 'text',
    placeholder: 'Digite seu nome completo...',
  },
  {
    field: 'email',
    question: 'Prazer, {first_name}!\n\nPara podermos entrar em contato com voce depois, qual e o seu e-mail?',
    type: 'email',
    placeholder: 'seu@email.com',
  },
  {
    field: 'phone',
    question: 'E seu numero de WhatsApp?',
    type: 'tel',
    placeholder: '(00) 00000-0000',
  },
  {
    field: 'how_found_us',
    question: 'Como voce conheceu a Confraria?',
    type: 'select',
    options: HOW_FOUND_OPTIONS,
  },
  {
    field: 'company_name',
    question: 'Qual o nome da sua empresa?',
    type: 'text',
    placeholder: 'Nome da empresa...',
  },
  {
    field: 'business_sector',
    question: 'E o que a {company_name} faz?',
    type: 'text',
    placeholder: 'Ex: Consultoria financeira, Advocacia...',
  },
  {
    field: 'has_networking_experience',
    question: 'Voce ja participou de algum grupo de networking?',
    type: 'boolean',
    options: [
      { value: 'true', label: 'Sim' },
      { value: 'false', label: 'Nao' },
    ],
  },
  {
    field: 'networking_experience',
    question: 'Poderia compartilhar brevemente como foi sua experiencia?',
    type: 'textarea',
    placeholder: 'Compartilhe sua experiencia com networking...',
    conditional: 'has_networking_experience',
  },
];

export function ChatForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [formData, setFormData] = useState<Partial<ProspectFormData>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getActiveSteps = useCallback(() => {
    return steps.filter((step) => {
      if (!step.conditional) return true;
      const conditionalValue = formData[step.conditional];
      return conditionalValue === true;
    });
  }, [formData]);

  const replaceVariables = useCallback((text: string): string => {
    return text.replace(/\{(\w+)\}/g, (_, key) => {
      // Se for first_name mas temos full_name, extrair primeiro nome
      if (key === 'first_name' && formData.full_name) {
        return formData.full_name.split(' ')[0];
      }
      return (formData[key as keyof ProspectFormData] as string) || '';
    });
  }, [formData]);

  const addBotMessage = useCallback((content: string) => {
    const id = Date.now().toString();

    // Mostrar typing primeiro
    setIsTyping(true);
    setMessages((prev) => [...prev, { id: `typing-${id}`, type: 'bot', content: '', isTyping: true }]);

    // Depois de um delay, mostrar a mensagem real
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === `typing-${id}` ? { id, type: 'bot', content, isTyping: false } : msg
        )
      );
      setIsTyping(false);
    }, TYPING_DELAY);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    const id = Date.now().toString();
    setMessages((prev) => [...prev, { id, type: 'user', content }]);
  }, []);

  // Inicializar com a primeira pergunta
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const firstStep = steps[0];
      setTimeout(() => {
        addBotMessage(firstStep.question);
      }, 500);
    }
  }, [addBotMessage]);

  const submitForm = async (finalData: ProspectFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar formulario');
      }

      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      addBotMessage('Ops! Ocorreu um erro ao enviar seu cadastro. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswer = useCallback(
    async (value: string, displayValue?: string) => {
      const activeSteps = getActiveSteps();
      const currentStepData = activeSteps[currentStep];

      if (!currentStepData) return;

      // Adicionar resposta do usuario
      addUserMessage(displayValue || value);

      // Atualizar formData
      let parsedValue: string | boolean = value;
      if (currentStepData.type === 'boolean') {
        parsedValue = value === 'true';
      }

      const newFormData = {
        ...formData,
        [currentStepData.field]: parsedValue,
      };
      setFormData(newFormData);

      // Verificar proxima etapa
      setTimeout(() => {
        // Recalcular steps ativos com os novos dados
        const updatedActiveSteps = steps.filter((step) => {
          if (!step.conditional) return true;
          const conditionalValue = newFormData[step.conditional];
          return conditionalValue === true;
        });

        const nextStep = currentStep + 1;

        if (nextStep < updatedActiveSteps.length) {
          setCurrentStep(nextStep);
          const nextQuestion = replaceVariables(updatedActiveSteps[nextStep].question);
          addBotMessage(nextQuestion);
        } else {
          // Formulario completo - enviar para API
          // Extrair first_name e last_name do full_name
          const fullName = newFormData.full_name || '';
          const nameParts = fullName.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const finalFormData: ProspectFormData = {
            first_name: firstName,
            last_name: lastName,
            phone: newFormData.phone || '',
            email: newFormData.email || '',
            company_name: newFormData.company_name || '',
            business_sector: newFormData.business_sector || '',
            how_found_us: newFormData.how_found_us || 'other',
            has_networking_experience: newFormData.has_networking_experience || false,
            networking_experience: newFormData.networking_experience,
          };

          addBotMessage('Perfeito! Aguarde um momento enquanto salvamos suas informacoes...');

          setTimeout(() => {
            submitForm(finalFormData);
          }, MESSAGE_DELAY);
        }
      }, MESSAGE_DELAY);
    },
    [currentStep, formData, getActiveSteps, addBotMessage, addUserMessage, replaceVariables]
  );

  const activeSteps = getActiveSteps();
  const currentStepData = activeSteps[currentStep];

  if (isComplete) {
    const firstName = formData.full_name?.split(' ')[0] || 'Amigo';
    return <ChatSuccess firstName={firstName} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area com background estilo WhatsApp */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,.02) 35px, rgba(0,0,0,.02) 70px)',
      }}>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            type={message.type}
            content={message.content}
            isTyping={message.isTyping}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area estilo WhatsApp */}
      <div className="flex-shrink-0 px-2 py-2 bg-[#f0f0f0]">
        {error && (
          <div className="mb-2 mx-2 p-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {currentStepData && !isTyping && !isSubmitting && (
          <>
            {currentStepData.type === 'boolean' && currentStepData.options && (
              <div className="px-2 pb-1">
                <ChatOptions
                  options={currentStepData.options}
                  onSelect={(value, label) => handleAnswer(value, label)}
                  variant="boolean"
                />
              </div>
            )}

            {currentStepData.type === 'select' && currentStepData.options && (
              <div className="px-2 pb-1">
                <ChatOptions
                  options={currentStepData.options}
                  onSelect={(value, label) => handleAnswer(value, label)}
                />
              </div>
            )}

            {(currentStepData.type === 'text' ||
              currentStepData.type === 'tel' ||
              currentStepData.type === 'email' ||
              currentStepData.type === 'textarea') && (
              <ChatInput
                type={currentStepData.type}
                placeholder={currentStepData.placeholder}
                onSubmit={(value) => handleAnswer(value)}
              />
            )}
          </>
        )}

        {(isTyping || isSubmitting) && (
          <div className="flex items-center justify-center py-3 text-gray-500 text-sm">
            {isSubmitting ? 'Enviando...' : 'Digitando...'}
          </div>
        )}
      </div>
    </div>
  );
}
