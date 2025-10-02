/**
 * Sistema de logging centralizado
 * Permite fácil integração com serviços externos como Sentry no futuro
 */

export interface LogData {
  [key: string]: string | number | boolean | null | undefined | LogData | LogData[];
}

export const logger = {
  /**
   * Log de erro
   * @param message Mensagem de erro
   * @param data Dados adicionais para contexto
   */
  error: (message: string, data?: LogData) => {
    console.error(`[ERROR] ${message}`, data);
    // TODO: Integrar com serviço de monitoramento (Sentry, LogRocket, etc.)
  },

  /**
   * Log de aviso
   * @param message Mensagem de aviso
   * @param data Dados adicionais para contexto
   */
  warn: (message: string, data?: LogData) => {
    console.warn(`[WARN] ${message}`, data);
  },

  /**
   * Log de informação
   * @param message Mensagem informativa
   * @param data Dados adicionais para contexto
   */
  info: (message: string, data?: LogData) => {
    console.info(`[INFO] ${message}`, data);
  },

  /**
   * Log de debug (apenas em desenvolvimento)
   * @param message Mensagem de debug
   * @param data Dados adicionais para contexto
   */
  debug: (message: string, data?: LogData) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  },
};

/**
 * Helper para capturar e logar erros de forma padronizada
 * @param error Erro capturado
 * @param context Contexto onde o erro ocorreu
 */
export const logError = (error: unknown, context: string) => {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error(`Erro em ${context}`, {
    message: errorMessage,
    stack: errorStack,
    context,
  });
};