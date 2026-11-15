import type { NoRede } from '@app/shared/models/dominio';

/** O que o número do grupo representa nesta coleta. Não é instituto nem área de pesquisa. */
export const SIGNIFICADO_COMUNIDADE =
  'Comunidade de Louvain na rede completa de coautoria de 2021–2025, com a fórmula escolhida. ' +
  'O grupo reúne docentes que colaboram mais entre si, pelo peso, do que com o restante da rede. ' +
  'O número ordena os grupos do maior para o menor nessa fórmula. Não é um instituto, não é uma área ' +
  'de pesquisa e pode reunir institutos diferentes. O filtro não refaz o agrupamento.';

export interface ResumoComunidade {
  indice: number;
  numero: number;
  pessoas: number;
  institutos: string[];
  institutosNaRedeCompleta: boolean;
  atravessa: boolean;
}

export interface LeituraComunidades {
  grupos: ResumoComunidade[];
  isolados: number;
}

export function resumirComunidades(
  nos: NoRede[],
  siglaDe: (institutoId: string) => string,
): LeituraComunidades {
  const porIndice = new Map<number, NoRede[]>();
  for (const no of nos) {
    const membros = porIndice.get(no.comunidade) ?? [];
    membros.push(no);
    porIndice.set(no.comunidade, membros);
  }

  const grupos: ResumoComunidade[] = [];
  let isolados = 0;
  for (const [indice, membros] of porIndice) {
    const daRedeCompleta = membros.find((no) => no.institutosDoGrupo?.length)?.institutosDoGrupo;
    const institutos =
      daRedeCompleta ??
      [...new Set(membros.map((no) => siglaDe(no.institutoId)))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      );
    const semParceiro = membros.length === 1 && membros[0].grau === 0 && institutos.length <= 1;
    if (semParceiro) {
      isolados += 1;
      continue;
    }
    grupos.push({
      indice,
      numero: indice + 1,
      pessoas: membros.length,
      institutos,
      institutosNaRedeCompleta: daRedeCompleta !== undefined,
      atravessa: institutos.length > 1,
    });
  }
  grupos.sort((a, b) => a.indice - b.indice);
  return { grupos, isolados };
}

export function descreverGrupo(grupo: ResumoComunidade): string {
  const pessoa = grupo.pessoas === 1 ? 'pessoa' : 'pessoas';
  const onde = grupo.institutosNaRedeCompleta
    ? `Institutos na rede completa: ${grupo.institutos.join(', ')}.`
    : `Institutos visíveis neste recorte: ${grupo.institutos.join(', ')}.`;
  const travessia = grupo.atravessa ? ' Este grupo reúne institutos diferentes.' : '';
  return `Grupo ${grupo.numero}: ${grupo.pessoas} ${pessoa} neste recorte. ${onde}${travessia}`;
}
