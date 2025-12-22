/**
 * Icon Component - 10,000 Free Icons (Gradient Style)
 *
 * Componente reutilizável para renderizar ícones da biblioteca
 * "10,000 Free Icons - Open Source Icon Set" (Estilo Gradient)
 *
 * @see https://www.figma.com/community/file/1250041133606945841
 */

import React from 'react';

export interface IconProps {
  /** Nome do ícone (deve corresponder ao arquivo em /public/icons/gradient/) */
  name: string;
  /** Tamanho do ícone em pixels (padrão: 24) */
  size?: number;
  /** Cor do ícone (padrão: currentColor - herda do elemento pai) */
  color?: string;
  /** Classes CSS adicionais */
  className?: string;
  /** Callback ao clicar no ícone */
  onClick?: () => void;
}

/**
 * Renderiza um ícone SVG da biblioteca Gradient
 *
 * @example
 * // Ícone básico
 * <Icon name="user" />
 *
 * @example
 * // Ícone customizado
 * <Icon name="heart" size={32} color="#ff0000" className="hover:scale-110" />
 *
 * @example
 * // Ícone em botão (tamanho padrão: 20px)
 * <Button>
 *   <Icon name="plus" size={20} />
 *   Adicionar
 * </Button>
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  className = '',
  onClick,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-block ${className}`}
      onClick={onClick}
      style={{ color }}
    >
      <use href={`/icons/gradient/${name}.svg#icon`} />
    </svg>
  );
};

/**
 * Variantes pré-configuradas para casos de uso comuns
 */
export const IconVariants = {
  /** Ícones de navegação (24px) */
  Navigation: (props: Omit<IconProps, 'size'>) => <Icon {...props} size={24} />,

  /** Ícones em botões (20px) */
  Button: (props: Omit<IconProps, 'size'>) => <Icon {...props} size={20} />,

  /** Ícones em cards (16px) */
  Card: (props: Omit<IconProps, 'size'>) => <Icon {...props} size={16} />,

  /** Ícones grandes (32px) */
  Large: (props: Omit<IconProps, 'size'>) => <Icon {...props} size={32} />,

  /** Ícones pequenos (12px) */
  Small: (props: Omit<IconProps, 'size'>) => <Icon {...props} size={12} />,
};

export default Icon;
