import type { TipoRelacao } from './dominio';

export const ANO_MIN = 2018;
export const ANO_MAX = 2025;

export type TipoVisao = 'rede' | 'areas';
export type LayoutRede = 'forca' | 'concentrico' | 'circulo';
export type CorPor = 'instituto' | 'area' | 'comunidade';
export type TamanhoPor = 'grau' | 'intermediacao' | 'fixo';
export type GraficoAreas = 'barras' | 'treemap' | 'sunburst';
export type AgruparPor = 'area' | 'instituto';

export interface FiltrosVisao {
  institutos: string[];
  areas: string[];
  anoInicio: number;
  anoFim: number;
  pesoMinimo: number;
}

export interface ConfigRede {
  layout: LayoutRede;
  corPor: CorPor;
  tamanhoPor: TamanhoPor;
  tiposRelacao: TipoRelacao[];
  mostrarRotulos: boolean;
}

export interface ConfigAreas {
  grafico: GraficoAreas;
  agruparPor: AgruparPor;
  topN: number;
  destacarAreasPonte: boolean;
}

interface VisaoBase {
  id: string;
  nome: string;
  descricao: string;
  filtros: FiltrosVisao;
  criadoEm: string;
  atualizadoEm: string;
}

export interface VisaoRede extends VisaoBase {
  tipo: 'rede';
  config: ConfigRede;
}

export interface VisaoAreas extends VisaoBase {
  tipo: 'areas';
  config: ConfigAreas;
}

export type Visao = VisaoRede | VisaoAreas;

type SemMeta<T> = T extends unknown ? Omit<T, 'id' | 'criadoEm' | 'atualizadoEm'> : never;

/** Visão ainda não persistida (também usada para a pré-visualização do editor). */
export type RascunhoVisao = SemMeta<Visao>;

export function criarFiltrosPadrao(): FiltrosVisao {
  return { institutos: [], areas: [], anoInicio: ANO_MIN, anoFim: ANO_MAX, pesoMinimo: 1 };
}

export function criarConfigRedePadrao(): ConfigRede {
  return {
    layout: 'forca',
    corPor: 'instituto',
    tamanhoPor: 'grau',
    tiposRelacao: ['coautoria', 'orientacao', 'projeto'],
    mostrarRotulos: false,
  };
}

export function criarConfigAreasPadrao(): ConfigAreas {
  return { grafico: 'barras', agruparPor: 'area', topN: 8, destacarAreasPonte: true };
}
