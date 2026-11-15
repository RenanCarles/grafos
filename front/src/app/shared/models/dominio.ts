import type { FormulaPeso } from './peso';

export interface Instituto {
  id: string;
  sigla: string;
  nome: string;
  cor?: string;
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

/** Contagem de grupos na rede completa de uma fórmula, sem o recorte da tela. */
export interface ResumoParticao {
  gruposComMaisDeUmaPessoa: number;
  gruposEntreInstitutos: number;
}

/** Quantas pessoas de um grupo de Reimberg continuam no mesmo grupo de Zanoli. */
export interface PermanenciaGrupo {
  pessoas: number;
  permanecemJuntas: number;
}

/**
 * Comparação das duas partições. O texto descreve as duas fórmulas;
 * a resposta da rede continua sendo só a fórmula selecionada.
 */
export interface LeituraGrupos {
  texto: string;
  reimberg?: ResumoParticao;
  zanoli?: ResumoParticao;
  maiorGrupoReimberg?: PermanenciaGrupo;
  grupoCentradoNoIepg?: PermanenciaGrupo | null;
}

/** Contrato de GET /api/meta para a coleta de coautoria atual. */
export interface MetadadosColeta {
  fonteNos: string;
  fonteArestas: string;
  anos: string;
  tipoRelacao: 'coautoria';
  geradoEm: string;
  idFormula?: FormulaPeso;
  formulaPeso?: string;
  leituraGrupos?: LeituraGrupos;
}

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
  forca?: number;
  intermediacaoPonderada?: number;
  /** Parceiros de outro instituto na rede completa da fórmula. Ausente se a API não enviou. */
  vizinhosFora?: number;
  /** Siglas do grupo de Louvain na rede completa. Não é recalculado pelo filtro. */
  institutosDoGrupo?: string[];
}

export interface Rede {
  nos: NoRede[];
  arestas: Relacao[];
  meta?: MetadadosColeta;
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
