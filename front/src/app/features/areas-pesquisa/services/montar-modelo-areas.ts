import type { EChartsCoreOption } from 'echarts/core';
import type { DadosAreas, ResumoArea, ResumoInstituto } from '@app/shared/models/dominio';
import type { ConfigAreas } from '@app/shared/models/visao';
import { CHROME, corCategorica, corRede, type CoresChrome, type ModoCor } from '@app/shared/viz/paleta';

export interface EntradaAreas {
  dados: DadosAreas;
  config: ConfigAreas;
  modo: ModoCor;
}

export interface ItemLegenda {
  rotulo: string;
  cor: string;
}

export interface LinhaAreas {
  nome: string;
  grupo: string;
  pesquisadores: number;
  colaboracoes: number | null;
  ponte: boolean | null;
}

export interface ModeloAreas {
  opcoes: EChartsCoreOption;
  legenda: ItemLegenda[];
  linhas: LinhaAreas[];
  nota: string | null;
  vazio: boolean;
}

interface NoHierarquia {
  name: string;
  value?: number;
  children?: NoHierarquia[];
  itemStyle: { color: string; opacity?: number };
  label?: { color: string };
}

const NOTA_PONTE =
  'Áreas-ponte em destaque: conectam institutos sem colaboração direta. As demais aparecem esmaecidas.';
const PROPORCAO_ESMAECIDA = 0.35;

/** Mistura `cor` com `base`; usada no lugar de opacidade porque o ECharts só esmaece o texto no treemap. */
function misturar(cor: string, base: string, proporcaoCor: number): string {
  const canal = (hex: string, indice: number) => parseInt(hex.slice(1 + indice * 2, 3 + indice * 2), 16);
  const misto = (indice: number) =>
    Math.round(canal(cor, indice) * proporcaoCor + canal(base, indice) * (1 - proporcaoCor))
      .toString(16)
      .padStart(2, '0');
  return `#${misto(0)}${misto(1)}${misto(2)}`;
}
const LIMITE_ROTULOS = 8;

function ordenarPorPesquisadores<T extends { pesquisadores: number }>(itens: T[], nome: (item: T) => string): T[] {
  return [...itens].sort(
    (a, b) => b.pesquisadores - a.pesquisadores || nome(a).localeCompare(nome(b), 'pt-BR'),
  );
}

function estiloDoTooltip(chrome: CoresChrome) {
  return { backgroundColor: chrome.superficie, borderColor: chrome.grade, textStyle: { color: chrome.tinta } };
}

function modeloVazio(): ModeloAreas {
  return { opcoes: {}, legenda: [], linhas: [], nota: null, vazio: true };
}

function montarBarras({ dados, config, modo }: EntradaAreas): ModeloAreas {
  const chrome = CHROME[modo];
  const porInstituto = config.agruparPor === 'instituto';
  const limite = Math.max(1, config.topN);

  interface ItemBarra {
    nome: string;
    grupo: string;
    valor: number;
    colaboracoes: number | null;
    ponte: boolean | null;
  }

  const itens: ItemBarra[] = porInstituto
    ? ordenarPorPesquisadores(
        dados.institutos.filter((instituto) => instituto.pesquisadores > 0),
        (instituto) => instituto.sigla,
      )
        .slice(0, limite)
        .map((instituto) => ({
          nome: instituto.sigla,
          grupo: 'Instituto',
          valor: instituto.pesquisadores,
          colaboracoes: null,
          ponte: null,
        }))
    : ordenarPorPesquisadores(
        dados.areas.filter((area) => area.pesquisadores > 0),
        (area) => area.nome,
      )
        .slice(0, limite)
        .map((area) => ({
          nome: area.nome,
          grupo: area.grandeArea,
          valor: area.pesquisadores,
          colaboracoes: area.colaboracoes,
          ponte: area.ehPonte,
        }));

  if (itens.length === 0) return modeloVazio();

  const destacar = config.destacarAreasPonte && !porInstituto;
  const corBase = corCategorica(modo, 0);
  const corPonte = corCategorica(modo, 1);
  const rotular = itens.length <= LIMITE_ROTULOS;

  const serie = (nome: string, cor: string, valores: (number | null)[]) => ({
    name: nome,
    type: 'bar',
    stack: 'total',
    barMaxWidth: 18,
    data: valores,
    itemStyle: { color: cor, borderColor: chrome.superficie, borderWidth: 1, borderRadius: [0, 4, 4, 0] },
    label: { show: rotular, position: 'right', color: chrome.tintaSecundaria },
  });

  const series = destacar
    ? [
        serie('Área-ponte', corPonte, itens.map((item) => (item.ponte ? item.valor : null))),
        serie('Demais áreas', corBase, itens.map((item) => (item.ponte ? null : item.valor))),
      ]
    : [serie('Pesquisadores', corBase, itens.map((item) => item.valor))];

  return {
    opcoes: {
      grid: { left: 8, right: 48, top: 8, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...estiloDoTooltip(chrome) },
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: chrome.tintaSecundaria },
        splitLine: { lineStyle: { color: chrome.grade, width: 1, type: 'solid' } },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: itens.map((item) => item.nome),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: chrome.eixo } },
        axisLabel: { color: chrome.tintaSecundaria },
      },
      series,
    },
    legenda: destacar
      ? [
          { rotulo: 'Área-ponte', cor: corPonte },
          { rotulo: 'Demais áreas', cor: corBase },
        ]
      : [],
    linhas: itens.map((item) => ({
      nome: item.nome,
      grupo: item.grupo,
      pesquisadores: item.valor,
      colaboracoes: item.colaboracoes,
      ponte: item.ponte,
    })),
    nota: null,
    vazio: false,
  };
}

function hierarquiaPorArea(dados: DadosAreas, destacar: boolean, modo: ModoCor) {
  const chrome = CHROME[modo];
  const grandesAreas = [...new Set(dados.areas.map((area) => area.grandeArea))];
  const arvore: NoHierarquia[] = [];
  const legenda: ItemLegenda[] = [];

  grandesAreas.forEach((grandeArea, indice) => {
    const cor = corCategorica(modo, indice);
    const filhos = dados.areas
      .filter((area) => area.grandeArea === grandeArea && area.pesquisadores > 0)
      .map<NoHierarquia>((area) => {
        const esmaecida = destacar && !area.ehPonte;
        return {
          name: area.nome,
          value: area.pesquisadores,
          itemStyle: { color: esmaecida ? misturar(cor, chrome.superficie, PROPORCAO_ESMAECIDA) : cor },
          label: { color: esmaecida ? chrome.tinta : chrome.superficie },
        };
      });
    if (filhos.length === 0) return;
    arvore.push({ name: grandeArea, children: filhos, itemStyle: { color: cor } });
    legenda.push({ rotulo: grandeArea, cor });
  });

  const linhas: LinhaAreas[] = ordenarPorPesquisadores(
    dados.areas.filter((area) => area.pesquisadores > 0),
    (area) => area.nome,
  ).map((area: ResumoArea) => ({
    nome: area.nome,
    grupo: area.grandeArea,
    pesquisadores: area.pesquisadores,
    colaboracoes: area.colaboracoes,
    ponte: area.ehPonte,
  }));

  return { arvore, legenda, linhas };
}

function hierarquiaPorInstituto(dados: DadosAreas, modo: ModoCor) {
  const arvore: NoHierarquia[] = [];
  const legenda: ItemLegenda[] = [];
  const linhas: LinhaAreas[] = [];

  dados.institutos.forEach((instituto: ResumoInstituto, indice) => {
    const cor = corRede(modo, indice);
    const filhos = dados.areas
      .filter((area) => (area.porInstituto[instituto.institutoId] ?? 0) > 0)
      .map<NoHierarquia>((area) => ({
        name: area.nome,
        value: area.porInstituto[instituto.institutoId],
        itemStyle: { color: cor },
      }));
    if (filhos.length === 0) return;
    arvore.push({ name: instituto.sigla, children: filhos, itemStyle: { color: cor } });
    legenda.push({ rotulo: instituto.sigla, cor });
    for (const filho of filhos) {
      linhas.push({
        nome: filho.name,
        grupo: instituto.sigla,
        pesquisadores: filho.value ?? 0,
        colaboracoes: null,
        ponte: null,
      });
    }
  });

  return { arvore, legenda, linhas };
}

function montarHierarquico({ dados, config, modo }: EntradaAreas): ModeloAreas {
  const chrome = CHROME[modo];
  const porInstituto = config.agruparPor === 'instituto';
  const destacar = config.destacarAreasPonte && !porInstituto;
  const { arvore, legenda, linhas } = porInstituto
    ? hierarquiaPorInstituto(dados, modo)
    : hierarquiaPorArea(dados, destacar, modo);

  if (arvore.length === 0) return modeloVazio();

  const tooltip = {
    ...estiloDoTooltip(chrome),
    formatter: (info: { name: string; value: number }) => `${info.name}: ${info.value} pesquisadores`,
  };
  const separacao = { borderColor: chrome.superficie, borderWidth: 2 };

  const opcoes: EChartsCoreOption =
    config.grafico === 'treemap'
      ? {
          tooltip,
          series: [
            {
              type: 'treemap',
              data: arvore,
              roam: false,
              nodeClick: false,
              breadcrumb: { show: false },
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              label: { show: true, color: chrome.superficie, fontSize: 12, formatter: '{b}' },
              upperLabel: { show: true, height: 24, color: chrome.superficie, fontSize: 12, fontWeight: 600 },
              itemStyle: { ...separacao, gapWidth: 2 },
              levels: [{ itemStyle: { borderWidth: 0, gapWidth: 4 } }, { itemStyle: { gapWidth: 2 } }],
            },
          ],
        }
      : {
          tooltip,
          series: [
            {
              type: 'sunburst',
              data: arvore,
              radius: ['16%', '94%'],
              nodeClick: false,
              sort: undefined,
              itemStyle: separacao,
              label: { color: chrome.superficie, fontSize: 11, minAngle: 10 },
              levels: [
                {},
                { r0: '16%', r: '52%', label: { rotate: 'tangential' } },
                { r0: '54%', r: '94%', label: { rotate: 'radial', align: 'center', width: 80, overflow: 'truncate' } },
              ],
            },
          ],
        };

  return { opcoes, legenda, linhas, nota: destacar ? NOTA_PONTE : null, vazio: false };
}

export function montarModeloAreas(entrada: EntradaAreas): ModeloAreas {
  return entrada.config.grafico === 'barras' ? montarBarras(entrada) : montarHierarquico(entrada);
}
