import type { DadosAreas, NoRede, Relacao } from '@app/shared/models/dominio';
import type { FiltrosVisao } from '@app/shared/models/visao';
import type { DadosMock } from './gerar-dados';

export interface RecorteMock {
  nos: NoRede[];
  arestas: Relacao[];
}

function chavePar(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function aplicarFiltros(dados: DadosMock, filtros: FiltrosVisao): RecorteMock {
  const nos = dados.nos.filter(
    (no) =>
      (filtros.institutos.length === 0 || filtros.institutos.includes(no.institutoId)) &&
      (filtros.areas.length === 0 || no.areaIds.some((areaId) => filtros.areas.includes(areaId))),
  );
  const ids = new Set(nos.map((no) => no.id));
  const arestas = dados.arestas.filter(
    (aresta) =>
      ids.has(aresta.origemId) &&
      ids.has(aresta.destinoId) &&
      aresta.ano >= filtros.anoInicio &&
      aresta.ano <= filtros.anoFim &&
      aresta.peso >= filtros.pesoMinimo,
  );
  return { nos, arestas };
}

export function agregarAreas(dados: DadosMock, filtros: FiltrosVisao): DadosAreas {
  const { nos, arestas } = aplicarFiltros(dados, filtros);
  const institutoDe = new Map(nos.map((no) => [no.id, no.institutoId]));

  const paresComRelacao = new Set<string>();
  for (const aresta of arestas) {
    const a = institutoDe.get(aresta.origemId)!;
    const b = institutoDe.get(aresta.destinoId)!;
    if (a !== b) paresComRelacao.add(chavePar(a, b));
  }

  const areas = dados.areas.map((area) => {
    const membros = nos.filter((no) => no.areaIds.includes(area.id));
    const porInstituto: Record<string, number> = {};
    for (const membro of membros) porInstituto[membro.institutoId] = (porInstituto[membro.institutoId] ?? 0) + 1;

    const institutos = Object.keys(porInstituto);
    let ehPonte = false;
    for (let i = 0; i < institutos.length && !ehPonte; i++) {
      for (let j = i + 1; j < institutos.length && !ehPonte; j++) {
        if (!paresComRelacao.has(chavePar(institutos[i], institutos[j]))) ehPonte = true;
      }
    }

    const idsMembros = new Set(membros.map((membro) => membro.id));
    const colaboracoes = arestas.filter((a) => idsMembros.has(a.origemId) && idsMembros.has(a.destinoId)).length;

    return {
      areaId: area.id,
      nome: area.nome,
      grandeArea: area.grandeArea,
      pesquisadores: membros.length,
      colaboracoes,
      ehPonte,
      porInstituto,
    };
  });

  const institutos = dados.institutos.map((instituto) => ({
    institutoId: instituto.id,
    sigla: instituto.sigla,
    nome: instituto.nome,
    pesquisadores: nos.filter((no) => no.institutoId === instituto.id).length,
  }));

  return { areas, institutos };
}
