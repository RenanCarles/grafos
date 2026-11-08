export type ModoCor = 'claro' | 'escuro';

export const CATEGORICA: Record<ModoCor, readonly string[]> = {
  claro: ['#00909a', '#bf3f2f', '#7a3b8f', '#b8860b', '#3d6db5', '#5f8a1f', '#d4547c', '#a5521a'],
  escuro: ['#1b9a9f', '#d4573f', '#a05cb8', '#c08a10', '#5585cc', '#759c2c', '#d4608a', '#b0642a'],
};

export const COR_OUTROS: Record<ModoCor, string> = { claro: '#898781', escuro: '#898781' };

// O oliva (índice 5) colide com a telha para daltônicos quando qualquer par pode ficar vizinho.
export const SLOTS_REDE: readonly number[] = [0, 1, 2, 3, 4, 6];

export interface CoresChrome {
  superficie: string;
  tinta: string;
  tintaSecundaria: string;
  grade: string;
  eixo: string;
}

export const CHROME: Record<ModoCor, CoresChrome> = {
  claro: { superficie: '#faf9f6', tinta: '#1c1b19', tintaSecundaria: '#52514e', grade: '#e1e0d9', eixo: '#c3c2b7' },
  escuro: { superficie: '#17181a', tinta: '#f2f0ea', tintaSecundaria: '#c3c2b7', grade: '#2c2c2a', eixo: '#383835' },
};

export function corCategorica(modo: ModoCor, indice: number): string {
  const cores = CATEGORICA[modo];
  return indice >= 0 && indice < cores.length ? cores[indice] : COR_OUTROS[modo];
}

export function corRede(modo: ModoCor, indice: number): string {
  if (indice < 0 || indice >= SLOTS_REDE.length) return COR_OUTROS[modo];
  return CATEGORICA[modo][SLOTS_REDE[indice]];
}
