import type { TipoRelacao } from './dominio';
import type { AgruparPor, CorPor, GraficoAreas, LayoutRede, TamanhoPor, TipoVisao } from './visao';

export const ROTULO_TIPO_VISAO: Record<TipoVisao, string> = {
  rede: 'Rede de colaboração',
  areas: 'Áreas e temas',
};

export const ROTULO_TIPO_RELACAO: Record<TipoRelacao, string> = {
  coautoria: 'Coautoria',
  orientacao: 'Orientação',
  projeto: 'Projeto',
};

export const ROTULO_LAYOUT: Record<LayoutRede, string> = {
  forca: 'Força',
  concentrico: 'Concêntrico',
  circulo: 'Círculo',
};

export const ROTULO_COR_POR: Record<CorPor, string> = {
  instituto: 'Instituto',
  area: 'Área',
  comunidade: 'Comunidade',
};

export const ROTULO_TAMANHO_POR: Record<TamanhoPor, string> = {
  grau: 'Grau',
  intermediacao: 'Intermediação',
  fixo: 'Fixo',
};

export const ROTULO_GRAFICO: Record<GraficoAreas, string> = {
  barras: 'Barras',
  treemap: 'Treemap',
  sunburst: 'Sunburst',
};

export const ROTULO_AGRUPAR_POR: Record<AgruparPor, string> = {
  area: 'Área',
  instituto: 'Instituto',
};

export function opcoes<T extends string>(mapa: Record<T, string>): { valor: T; rotulo: string }[] {
  return (Object.keys(mapa) as T[]).map((valor) => ({ valor, rotulo: mapa[valor] }));
}
