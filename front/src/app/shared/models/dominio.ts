export interface Instituto {
  id: string;
  sigla: string;
  nome: string;
}

export interface Area {
  id: string;
  nome: string;
  grandeArea: string;
}

export interface Pesquisador {
  id: string;
  nome: string;
  institutoId: string;
  areaIds: string[];
}

export type TipoRelacao = 'coautoria' | 'orientacao' | 'projeto';

export interface Relacao {
  origemId: string;
  destinoId: string;
  tipo: TipoRelacao;
  peso: number;
  ano: number;
}

export interface NoRede extends Pesquisador {
  grau: number;
  intermediacao: number;
  comunidade: number;
}

export interface Rede {
  nos: NoRede[];
  arestas: Relacao[];
}

export interface ResumoArea {
  areaId: string;
  nome: string;
  grandeArea: string;
  pesquisadores: number;
  colaboracoes: number;
  ehPonte: boolean;
  porInstituto: Record<string, number>;
}

export interface ResumoInstituto {
  institutoId: string;
  sigla: string;
  nome: string;
  pesquisadores: number;
}

/** Sempre inclui todas as áreas e institutos do catálogo, na ordem do catálogo, mesmo com zero pesquisadores. */
export interface DadosAreas {
  areas: ResumoArea[];
  institutos: ResumoInstituto[];
}
