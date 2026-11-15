export type FormulaPeso = 'reimberg' | 'zanoli';

export const LAMBDA_PADRAO = 0.1;
export const ANO_REFERENCIA_PADRAO = 2026;

export interface ConfiguracaoPeso {
  /** Ausência mantém compatibilidade com as visões salvas antes da seleção de fórmulas. */
  formulaPeso?: FormulaPeso;
  lambdaTemporal?: number;
  anoReferencia?: number;
}
