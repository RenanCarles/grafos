import type { ElementDefinition, LayoutOptions, StylesheetJson } from 'cytoscape';
import type { Catalogo } from '@app/core/repositorios';
import type { NoRede, Rede } from '@app/shared/models/dominio';
import type { ConfigRede } from '@app/shared/models/visao';
import { CHROME, SLOTS_REDE, corRede, type ModoCor } from '@app/shared/viz/paleta';

export interface EntradaRede {
  rede: Rede;
  catalogo: Catalogo;
  config: ConfigRede;
  modo: ModoCor;
}

export interface ItemLegenda {
  rotulo: string;
  cor: string;
  institutoId?: string;
  comunidade?: number;
  outros?: boolean;
}

export interface LinhaRede {
  id: string;
  nome: string;
  instituto: string;
  areas: string;
  grau: number;
  forca: number | null;
  intermediacao: number;
  grupo: number;
  vizinhosFora: number | null;
  institutosDoGrupo: string;
}

export interface ModeloRede {
  elementos: ElementDefinition[];
  estilo: StylesheetJson;
  layout: LayoutOptions;
  legenda: ItemLegenda[];
  linhas: LinhaRede[];
}

const TAMANHO_FIXO = 22;
const TAMANHO_MIN = 14;
const TAMANHO_MAX = 44;

export function escalar(
  valor: number,
  min: number,
  max: number,
  saidaMin: number,
  saidaMax: number,
): number {
  if (max === min) return (saidaMin + saidaMax) / 2;
  return saidaMin + ((valor - min) / (max - min)) * (saidaMax - saidaMin);
}

function indiceDeCor(no: NoRede, config: ConfigRede, catalogo: Catalogo): number {
  switch (config.corPor) {
    case 'instituto':
      return catalogo.institutos.findIndex((instituto) => instituto.id === no.institutoId);
    case 'area':
      return catalogo.areas.findIndex((area) => area.id === no.areaIds[0]);
    case 'comunidade':
      return no.comunidade;
  }
}

function rotuloDoIndice(indice: number, config: ConfigRede, catalogo: Catalogo): string {
  switch (config.corPor) {
    case 'instituto':
      return catalogo.institutos[indice]?.sigla ?? `Instituto ${indice + 1}`;
    case 'area':
      return catalogo.areas[indice]?.nome ?? `Área ${indice + 1}`;
    case 'comunidade':
      return `Grupo ${indice + 1}`;
  }
}

function montarLegenda(
  indices: number[],
  config: ConfigRede,
  catalogo: Catalogo,
  modo: ModoCor,
): ItemLegenda[] {
  const presentes = [...new Set(indices)].sort((a, b) => a - b);
  if (config.corPor === 'instituto') {
    return presentes
      .filter((i) => i >= 0)
      .map((i) => ({
        rotulo: catalogo.institutos[i].sigla,
        cor: catalogo.institutos[i].cor ?? corRede(modo, i),
        institutoId: catalogo.institutos[i].id,
      }));
  }
  const dentroDosSlots = (indice: number) => indice >= 0 && indice < SLOTS_REDE.length;
  const legenda: ItemLegenda[] = presentes.filter(dentroDosSlots).map((indice) => ({
    rotulo: rotuloDoIndice(indice, config, catalogo),
    cor: corRede(modo, indice),
    ...(config.corPor === 'comunidade' ? { comunidade: indice } : {}),
  }));
  if (presentes.some((indice) => !dentroDosSlots(indice)))
    legenda.push({ rotulo: 'Outros', cor: corRede(modo, -1), outros: true });
  return legenda;
}

function montarLayout(config: ConfigRede): LayoutOptions {
  switch (config.layout) {
    case 'concentrico':
      return {
        name: 'concentric',
        animate: false,
        fit: true,
        padding: 30,
        concentric: (no) => no.data('grau') as number,
        levelWidth: () => 2,
      };
    case 'circulo':
      return { name: 'circle', animate: false, fit: true, padding: 30 };
    case 'forca':
      return { name: 'cose', animate: false, randomize: false, fit: true, padding: 30 };
  }
}

function montarEstilo(modo: ModoCor): StylesheetJson {
  const chrome = CHROME[modo];
  return [
    {
      selector: 'node',
      style: {
        'background-color': 'data(cor)',
        width: 'data(tamanho)',
        height: 'data(tamanho)',
        label: 'data(label)',
        color: chrome.tintaSecundaria,
        'font-size': 10,
        'text-valign': 'bottom',
        'text-margin-y': 4,
        'border-width': 2,
        'border-color': chrome.superficie,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 'data(espessura)',
        'line-color': chrome.tintaSecundaria,
        'line-opacity': 0.45,
      },
    },
    { selector: 'edge[tipo = "orientacao"]', style: { 'line-style': 'dotted' } },
    { selector: 'edge[tipo = "projeto"]', style: { 'line-style': 'dashed' } },
    { selector: 'node:selected', style: { 'border-width': 4, 'border-color': chrome.tinta } },
    { selector: '.apagado', style: { opacity: 0.12 } },
    { selector: 'node.destaque', style: { 'border-width': 4, 'border-color': chrome.tinta } },
  ];
}

export function montarModeloRede({ rede, catalogo, config, modo }: EntradaRede): ModeloRede {
  const metrica = (no: NoRede): number => {
    switch (config.tamanhoPor) {
      case 'forca':
        return no.forca ?? 0;
      case 'intermediacaoPonderada':
        return no.intermediacaoPonderada ?? 0;
      case 'grau':
        return no.grau;
      default:
        return no.intermediacao;
    }
  };
  const valores = rede.nos.map(metrica);
  const min = Math.min(...valores);
  const max = Math.max(...valores);

  const indices = rede.nos.map((no) => indiceDeCor(no, config, catalogo));
  const total = rede.nos.length;

  const nos: ElementDefinition[] = rede.nos.map((no, posicao) => {
    const angulo = (2 * Math.PI * posicao) / Math.max(total, 1);
    return {
      group: 'nodes',
      data: {
        id: no.id,
        nome: no.nome,
        label: config.mostrarRotulos ? no.nome : '',
        cor:
          config.corPor === 'instituto'
            ? (catalogo.institutos[indices[posicao]]?.cor ?? corRede(modo, indices[posicao]))
            : corRede(modo, indices[posicao]),
        tamanho:
          config.tamanhoPor === 'fixo'
            ? TAMANHO_FIXO
            : escalar(metrica(no), min, max, TAMANHO_MIN, TAMANHO_MAX),
        grau: no.grau,
        intermediacao: no.intermediacao,
        institutoId: no.institutoId,
        instituto:
          catalogo.institutos.find((i) => i.id === no.institutoId)?.sigla ?? no.institutoId,
        comunidade: no.comunidade,
        grupo: no.comunidade + 1,
      },
      position: { x: 240 * Math.cos(angulo), y: 240 * Math.sin(angulo) },
    };
  });

  const ids = new Set(rede.nos.map((no) => no.id));
  const relacoes = rede.arestas.filter(
    (a) => config.tiposRelacao.includes(a.tipo) && ids.has(a.origemId) && ids.has(a.destinoId),
  );
  const pesos = relacoes.map((a) => a.peso);
  const pesoMin = pesos.length ? Math.min(...pesos) : 0;
  const pesoMax = pesos.length ? Math.max(...pesos) : 0;
  const arestas: ElementDefinition[] = relacoes.map((a) => ({
    group: 'edges',
    data: {
      id: `${a.origemId}>${a.destinoId}:${a.tipo}`,
      source: a.origemId,
      target: a.destinoId,
      tipo: a.tipo,
      peso: a.peso,
      espessura: escalar(a.peso, pesoMin, pesoMax, 1, 4),
    },
  }));

  const linhas: LinhaRede[] = rede.nos
    .map((no) => ({
      id: no.id,
      nome: no.nome,
      instituto: catalogo.institutos.find((i) => i.id === no.institutoId)?.sigla ?? no.institutoId,
      areas:
        no.areaIds.map((id) => catalogo.areas.find((a) => a.id === id)?.nome ?? id).join(', ') ||
        'Não disponível nesta coleta',
      grau: no.grau,
      forca: no.forca ?? null,
      intermediacao: no.intermediacao,
      grupo: no.comunidade + 1,
      vizinhosFora: no.vizinhosFora ?? null,
      institutosDoGrupo: no.institutosDoGrupo?.length ? no.institutosDoGrupo.join(', ') : '—',
    }))
    .sort((a, b) => b.grau - a.grau || a.nome.localeCompare(b.nome, 'pt-BR'));

  return {
    elementos: [...nos, ...arestas],
    estilo: montarEstilo(modo),
    layout: montarLayout(config),
    legenda: montarLegenda(indices, config, catalogo, modo),
    linhas,
  };
}
