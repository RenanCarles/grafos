export interface ParAresta {
  origemId: string;
  destinoId: string;
}

function montarAdjacencia(ids: readonly string[], arestas: readonly ParAresta[]): Map<string, Set<string>> {
  const adjacencia = new Map<string, Set<string>>(ids.map((id) => [id, new Set<string>()]));
  for (const { origemId, destinoId } of arestas) {
    if (origemId === destinoId) continue;
    adjacencia.get(origemId)?.add(destinoId);
    adjacencia.get(destinoId)?.add(origemId);
  }
  return adjacencia;
}

export function calcularGrau(ids: readonly string[], arestas: readonly ParAresta[]): Map<string, number> {
  const adjacencia = montarAdjacencia(ids, arestas);
  return new Map(ids.map((id) => [id, adjacencia.get(id)!.size]));
}

/** Intermediação de Brandes (grafo não direcionado, sem pesos), normalizada para [0, 1]. */
export function calcularIntermediacao(ids: readonly string[], arestas: readonly ParAresta[]): Map<string, number> {
  const adjacencia = montarAdjacencia(ids, arestas);
  const acumulado = new Map<string, number>(ids.map((id) => [id, 0]));

  for (const origem of ids) {
    const pilha: string[] = [];
    const predecessores = new Map<string, string[]>(ids.map((id) => [id, []]));
    const caminhos = new Map<string, number>(ids.map((id) => [id, 0]));
    const distancia = new Map<string, number>(ids.map((id) => [id, -1]));
    caminhos.set(origem, 1);
    distancia.set(origem, 0);

    const fila: string[] = [origem];
    for (let i = 0; i < fila.length; i++) {
      const v = fila[i];
      pilha.push(v);
      for (const w of adjacencia.get(v)!) {
        if (distancia.get(w)! < 0) {
          distancia.set(w, distancia.get(v)! + 1);
          fila.push(w);
        }
        if (distancia.get(w) === distancia.get(v)! + 1) {
          caminhos.set(w, caminhos.get(w)! + caminhos.get(v)!);
          predecessores.get(w)!.push(v);
        }
      }
    }

    const dependencia = new Map<string, number>(ids.map((id) => [id, 0]));
    while (pilha.length > 0) {
      const w = pilha.pop()!;
      for (const v of predecessores.get(w)!) {
        dependencia.set(v, dependencia.get(v)! + (caminhos.get(v)! / caminhos.get(w)!) * (1 + dependencia.get(w)!));
      }
      if (w !== origem) acumulado.set(w, acumulado.get(w)! + dependencia.get(w)!);
    }
  }

  const n = ids.length;
  const fator = n > 2 ? 1 / ((n - 1) * (n - 2)) : 0;
  return new Map(ids.map((id) => [id, acumulado.get(id)! * fator]));
}
