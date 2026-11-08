import type { Area, Instituto, NoRede, Relacao, TipoRelacao } from '@app/shared/models/dominio';
import { ANO_MAX, ANO_MIN } from '@app/shared/models/visao';
import { calcularGrau, calcularIntermediacao } from './metricas-rede';
import { criarPrng, sortearInteiro, sortearItem, sortearPonderado, type Prng } from './prng';

export interface DadosMock {
  institutos: Instituto[];
  areas: Area[];
  nos: NoRede[];
  arestas: Relacao[];
}

export const SEMENTE_PADRAO = 2026;

export const INSTITUTOS_MOCK: Instituto[] = [
  { id: 'iesti', sigla: 'IESTI', nome: 'Instituto de Engenharia de Sistemas e Tecnologia da Informação' },
  { id: 'iem', sigla: 'IEM', nome: 'Instituto de Engenharia Mecânica' },
  { id: 'irn', sigla: 'IRN', nome: 'Instituto de Recursos Naturais' },
  { id: 'ifq', sigla: 'IFQ', nome: 'Instituto de Física e Química' },
  { id: 'imc', sigla: 'IMC', nome: 'Instituto de Matemática e Computação' },
  { id: 'iepg', sigla: 'IEPG', nome: 'Instituto de Engenharia de Produção e Gestão' },
];

export const AREAS_MOCK: Area[] = [
  { id: 'ia', nome: 'Inteligência Artificial', grandeArea: 'Ciências Exatas e da Terra' },
  { id: 'energia', nome: 'Sistemas de Energia', grandeArea: 'Engenharias' },
  { id: 'matematica', nome: 'Matemática Aplicada', grandeArea: 'Ciências Exatas e da Terra' },
  { id: 'mecanica', nome: 'Mecânica e Materiais', grandeArea: 'Engenharias' },
  { id: 'agua', nome: 'Recursos Hídricos', grandeArea: 'Ciências Ambientais' },
  { id: 'fisica', nome: 'Física da Matéria Condensada', grandeArea: 'Ciências Exatas e da Terra' },
  { id: 'quimica', nome: 'Química Ambiental', grandeArea: 'Ciências Ambientais' },
  { id: 'producao', nome: 'Pesquisa Operacional e Gestão', grandeArea: 'Engenharias' },
];

const PESQUISADORES_POR_INSTITUTO: Record<string, number> = { iesti: 14, iem: 10, irn: 10, ifq: 9, imc: 9, iepg: 8 };

const AREAS_DO_INSTITUTO: Record<string, string[]> = {
  iesti: ['ia', 'matematica'],
  iem: ['mecanica', 'energia'],
  irn: ['agua', 'quimica'],
  ifq: ['fisica', 'quimica'],
  imc: ['matematica', 'ia'],
  iepg: ['producao', 'energia'],
};

const GRUPOS_DO_INSTITUTO: Record<string, { item: number; peso: number }[]> = {
  iesti: [{ item: 0, peso: 70 }, { item: 6, peso: 30 }],
  iem: [{ item: 1, peso: 80 }, { item: 7, peso: 20 }],
  irn: [{ item: 2, peso: 75 }, { item: 7, peso: 25 }],
  ifq: [{ item: 3, peso: 70 }, { item: 6, peso: 30 }],
  imc: [{ item: 4, peso: 70 }, { item: 6, peso: 30 }],
  iepg: [{ item: 5, peso: 75 }, { item: 7, peso: 25 }],
};

const PRENOMES = [
  'Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Karina', 'Lucas', 'Marina', 'Nelson', 'Olívia', 'Paulo', 'Queila', 'Rafael', 'Sandra', 'Tiago',
  'Úrsula', 'Vitor', 'Wagner', 'Ximena', 'Yuri', 'Zélia', 'Alberto', 'Beatriz', 'Caio', 'Daniela',
];

const SOBRENOMES = [
  'Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferreira', 'Gomes', 'Honório', 'Ibrahim', 'Jesus',
  'Klein', 'Lima', 'Machado', 'Nogueira', 'Oliveira', 'Pereira', 'Queiroz', 'Ribeiro', 'Santos', 'Teixeira',
  'Ueda', 'Vieira', 'Werner', 'Xavier', 'Yamada', 'Zanetti', 'Amaral', 'Borges', 'Carvalho', 'Duarte',
];

const TIPOS: { item: TipoRelacao; peso: number }[] = [
  { item: 'coautoria', peso: 65 },
  { item: 'orientacao', peso: 20 },
  { item: 'projeto', peso: 15 },
];

const PESO_MAXIMO: Record<TipoRelacao, number> = { coautoria: 6, orientacao: 3, projeto: 4 };

interface PesquisadorBase {
  id: string;
  nome: string;
  institutoId: string;
  areaIds: string[];
  grupo: number;
}

function criarPesquisadores(prng: Prng): PesquisadorBase[] {
  const pesquisadores: PesquisadorBase[] = [];
  const todasAsAreas = AREAS_MOCK.map((area) => area.id);
  let indice = 0;
  for (const instituto of INSTITUTOS_MOCK) {
    for (let k = 0; k < PESQUISADORES_POR_INSTITUTO[instituto.id]; k++) {
      const areaIds = [sortearItem(prng, AREAS_DO_INSTITUTO[instituto.id])];
      if (prng() < 0.35) {
        const extra = sortearItem(prng, todasAsAreas);
        if (!areaIds.includes(extra)) areaIds.push(extra);
      }
      if (prng() < 0.1) {
        const extra = sortearItem(prng, todasAsAreas);
        if (!areaIds.includes(extra)) areaIds.push(extra);
      }
      pesquisadores.push({
        id: `p${String(indice + 1).padStart(2, '0')}`,
        nome: `${PRENOMES[indice % 30]} ${SOBRENOMES[(indice * 7 + Math.floor(indice / 30) * 11) % 30]}`,
        institutoId: instituto.id,
        areaIds,
        grupo: sortearPonderado(prng, GRUPOS_DO_INSTITUTO[instituto.id]),
      });
      indice++;
    }
  }
  return pesquisadores;
}

function criarRelacao(prng: Prng, origemId: string, destinoId: string): Relacao {
  const tipo = sortearPonderado(prng, TIPOS);
  return {
    origemId,
    destinoId,
    tipo,
    peso: sortearInteiro(prng, 1, PESO_MAXIMO[tipo]),
    ano: sortearInteiro(prng, ANO_MIN, ANO_MAX),
  };
}

function criarRelacoes(prng: Prng, pesquisadores: PesquisadorBase[]): Relacao[] {
  const arestas: Relacao[] = [];
  const chaves = new Set<string>();

  const adicionar = (a: string, b: string): boolean => {
    if (a === b) return false;
    const [origemId, destinoId] = a < b ? [a, b] : [b, a];
    const chave = `${origemId}|${destinoId}`;
    if (chaves.has(chave)) return false;
    chaves.add(chave);
    arestas.push(criarRelacao(prng, origemId, destinoId));
    return true;
  };

  for (let i = 0; i < pesquisadores.length; i++) {
    for (let j = i + 1; j < pesquisadores.length; j++) {
      const a = pesquisadores[i];
      const b = pesquisadores[j];
      const probabilidade = a.grupo === b.grupo ? 0.35 : a.institutoId === b.institutoId ? 0.08 : 0.01;
      if (prng() < probabilidade) adicionar(a.id, b.id);
    }
  }

  pesquisadores.forEach((origem, indice) => {
    if (indice % 12 !== 0) return;
    let adicionadas = 0;
    for (let tentativa = 0; tentativa < 60 && adicionadas < 3; tentativa++) {
      const alvo = sortearItem(prng, pesquisadores);
      if (alvo.institutoId !== origem.institutoId && adicionar(origem.id, alvo.id)) adicionadas++;
    }
  });

  const comRelacao = new Set(arestas.flatMap((a) => [a.origemId, a.destinoId]));
  for (const pesquisador of pesquisadores) {
    if (comRelacao.has(pesquisador.id)) continue;
    const colegas = pesquisadores.filter((p) => p.grupo === pesquisador.grupo && p.id !== pesquisador.id);
    const alvo = colegas.length > 0 ? sortearItem(prng, colegas) : pesquisadores.find((p) => p.id !== pesquisador.id)!;
    adicionar(pesquisador.id, alvo.id);
  }

  return arestas;
}

export function gerarDadosMock(semente: number = SEMENTE_PADRAO): DadosMock {
  const prng = criarPrng(semente);
  const pesquisadores = criarPesquisadores(prng);
  const arestas = criarRelacoes(prng, pesquisadores);

  const ids = pesquisadores.map((p) => p.id);
  const graus = calcularGrau(ids, arestas);
  const intermediacoes = calcularIntermediacao(ids, arestas);

  const tamanhos = new Map<number, number>();
  for (const p of pesquisadores) tamanhos.set(p.grupo, (tamanhos.get(p.grupo) ?? 0) + 1);
  const ordemDosGrupos = [...tamanhos.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([grupo]) => grupo);
  const comunidadeDoGrupo = new Map(ordemDosGrupos.map((grupo, indice) => [grupo, indice]));

  const nos: NoRede[] = pesquisadores.map((p) => ({
    id: p.id,
    nome: p.nome,
    institutoId: p.institutoId,
    areaIds: p.areaIds,
    grau: graus.get(p.id)!,
    intermediacao: Number(intermediacoes.get(p.id)!.toFixed(4)),
    comunidade: comunidadeDoGrupo.get(p.grupo)!,
  }));

  return { institutos: structuredClone(INSTITUTOS_MOCK), areas: structuredClone(AREAS_MOCK), nos, arestas };
}

let cache: DadosMock | undefined;

export function obterDadosMock(): DadosMock {
  return (cache ??= gerarDadosMock());
}
