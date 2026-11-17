import type { ItemRanking } from '@app/shared/models/card-metrica';

export interface CriteriosRanking<T> {
  valor: (item: T) => number;
  nome: (item: T) => string;
  detalhe: (item: T) => string;
}

/** Top 3 por valor decrescente, desempate por nome. Itens com valor 0 ficam de fora. */
export function rankearTres<T>(itens: readonly T[], criterios: CriteriosRanking<T>): ItemRanking[] {
  return itens
    .filter((item) => criterios.valor(item) > 0)
    .sort(
      (a, b) =>
        criterios.valor(b) - criterios.valor(a) ||
        criterios.nome(a).localeCompare(criterios.nome(b), 'pt-BR'),
    )
    .slice(0, 3)
    .map((item, indice) => ({
      posicao: indice + 1,
      rotulo: criterios.nome(item),
      detalhe: criterios.detalhe(item),
    }));
}
