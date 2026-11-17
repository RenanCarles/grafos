import type { Catalogo } from '@app/core/repositorios';
import type { Rede } from '@app/shared/models/dominio';
import type { CardMetrica } from '@app/shared/models/card-metrica';
import { formatarNumero, pluralizar } from '@app/shared/util/formatar';
import { rankearTres } from '@app/shared/util/ranking';
import { resumirComunidades } from './resumir-comunidades';

export interface EntradaCardsRede {
  rede: Rede;
  catalogo: Catalogo;
}

const NOTA_GRUPOS = 'Grupos calculados na rede completa; o filtro não os refaz.';
const NOTA_PONTES =
  'Intermediação: quanto o docente conecta pessoas que não colaboram diretamente entre si.';

export function montarCardsRede({ rede, catalogo }: EntradaCardsRede): CardMetrica[] {
  const siglaDe = (institutoId: string) =>
    catalogo.institutos.find((instituto) => instituto.id === institutoId)?.sigla ?? institutoId;
  const institutoDoNo = new Map(rede.nos.map((no) => [no.id, no.institutoId]));

  const paresDistintos = new Set<string>();
  let pesoTotal = 0;
  let pesoEntreInstitutos = 0;
  for (const aresta of rede.arestas) {
    paresDistintos.add(
      aresta.origemId < aresta.destinoId
        ? `${aresta.origemId}|${aresta.destinoId}`
        : `${aresta.destinoId}|${aresta.origemId}`,
    );
    pesoTotal += aresta.peso;
    const origem = institutoDoNo.get(aresta.origemId);
    const destino = institutoDoNo.get(aresta.destinoId);
    if (origem !== undefined && destino !== undefined && origem !== destino) {
      pesoEntreInstitutos += aresta.peso;
    }
  }

  const geral: CardMetrica = {
    tipo: 'numeros',
    id: 'rede-geral',
    titulo: 'Visão geral',
    itens: [
      { rotulo: 'Pesquisadores', valor: formatarNumero(rede.nos.length) },
      { rotulo: 'Ligações', valor: formatarNumero(paresDistintos.size) },
      { rotulo: 'Peso total', valor: formatarNumero(pesoTotal, 2) },
    ],
  };
  if (rede.nos.length === 0) return [geral];

  const maisParceiros: CardMetrica = {
    tipo: 'ranking',
    id: 'rede-parceiros',
    titulo: 'Mais parceiros',
    itens: rankearTres(rede.nos, {
      valor: (no) => no.grau,
      nome: (no) => no.nome,
      detalhe: (no) =>
        `${siglaDe(no.institutoId)} · ${pluralizar(no.grau, 'parceiro', 'parceiros')}`,
    }),
  };

  const maioresPontes: CardMetrica = {
    tipo: 'ranking',
    id: 'rede-pontes',
    titulo: 'Maiores pontes',
    itens: rankearTres(rede.nos, {
      valor: (no) => no.intermediacao,
      nome: (no) => no.nome,
      detalhe: (no) => `${siglaDe(no.institutoId)} · ${formatarNumero(no.intermediacao, 3)}`,
    }),
    nota: NOTA_PONTES,
  };

  const institutosPresentes = new Set(rede.nos.map((no) => no.institutoId)).size;
  const integracao: CardMetrica = {
    tipo: 'numeros',
    id: 'rede-integracao',
    titulo: 'Integração entre institutos',
    itens: [
      {
        rotulo: 'Peso entre institutos diferentes',
        valor:
          pesoTotal > 0 ? `${formatarNumero((100 * pesoEntreInstitutos) / pesoTotal, 1)}%` : '—',
      },
      { rotulo: 'Institutos no recorte', valor: formatarNumero(institutosPresentes) },
    ],
  };

  const { grupos, isolados } = resumirComunidades(rede.nos, siglaDe);
  const comVariasPessoas = grupos.filter((grupo) => grupo.pessoas > 1);
  const maiorGrupo = comVariasPessoas.reduce((maior, grupo) => Math.max(maior, grupo.pessoas), 0);
  const gruposCard: CardMetrica = {
    tipo: 'numeros',
    id: 'rede-grupos',
    titulo: 'Grupos de colaboração',
    itens: [
      { rotulo: 'Grupos com 2 ou mais pessoas', valor: formatarNumero(comVariasPessoas.length) },
      {
        rotulo: 'Maior grupo',
        valor: maiorGrupo > 0 ? pluralizar(maiorGrupo, 'pessoa', 'pessoas') : '—',
      },
      { rotulo: 'Sem parceiro', valor: formatarNumero(isolados) },
    ],
    nota: NOTA_GRUPOS,
  };

  return [geral, maisParceiros, maioresPontes, integracao, gruposCard];
}
