import type { DadosAreas } from '@app/shared/models/dominio';
import type { CardMetrica } from '@app/shared/models/card-metrica';
import { formatarNumero, pluralizar } from '@app/shared/util/formatar';
import { rankearTres } from '@app/shared/util/ranking';

const NOTA_PONTES = 'Áreas com pesquisadores de institutos que não colaboram diretamente.';

export function montarCardsAreas(dados: DadosAreas): CardMetrica[] {
  if (dados.areas.length === 0) {
    return [
      {
        tipo: 'numeros',
        id: 'areas-indisponiveis',
        titulo: 'Áreas e temas',
        itens: [],
        nota: 'Áreas ainda não estão disponíveis nesta coleta.',
      },
    ];
  }

  const comPesquisadores = dados.areas.filter((area) => area.pesquisadores > 0).length;
  const pontes = dados.areas.filter((area) => area.ehPonte);

  return [
    {
      tipo: 'numeros',
      id: 'areas-geral',
      titulo: 'Visão geral',
      itens: [
        {
          rotulo: 'Áreas com pesquisadores',
          valor: `${formatarNumero(comPesquisadores)} de ${formatarNumero(dados.areas.length)}`,
        },
      ],
    },
    {
      tipo: 'ranking',
      id: 'areas-pesquisadores',
      titulo: 'Mais pesquisadores',
      itens: rankearTres(dados.areas, {
        valor: (area) => area.pesquisadores,
        nome: (area) => area.nome,
        detalhe: (area) => pluralizar(area.pesquisadores, 'pesquisador', 'pesquisadores'),
      }),
    },
    {
      tipo: 'ranking',
      id: 'areas-colaboracoes',
      titulo: 'Mais colaborações',
      itens: rankearTres(dados.areas, {
        valor: (area) => area.colaboracoes,
        nome: (area) => area.nome,
        detalhe: (area) => pluralizar(area.colaboracoes, 'colaboração', 'colaborações'),
      }),
    },
    {
      tipo: 'ranking',
      id: 'areas-pontes',
      titulo: `Áreas-ponte (${formatarNumero(pontes.length)})`,
      itens: rankearTres(pontes, {
        valor: (area) => area.pesquisadores,
        nome: (area) => area.nome,
        detalhe: (area) => pluralizar(area.pesquisadores, 'pesquisador', 'pesquisadores'),
      }),
      nota: NOTA_PONTES,
    },
  ];
}
