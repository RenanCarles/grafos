"""Métricas de rede sobre o grafo agregado (todos os anos).

- grau / força: iguais às do esboço original.
- intermediacao: Brandes sem pesos, normalizada em [0, 1] — mesma definição do mock do front
  (front/src/app/data-access/mock/metricas-rede.ts).
- intermediacaoPonderada: Brandes usando distância = 1/peso (laço forte = caminho curto).
- comunidade: Louvain ponderado (semente fixa). Numeradas por tamanho decrescente a partir de 0;
  docentes sem aresta ficam em comunidades unitárias, numeradas depois das demais.
"""
from collections import Counter

import networkx as nx

from .config import SEMENTE_LOUVAIN


def calcular(g) -> dict[str, dict]:
    G = nx.Graph()
    G.add_nodes_from(d["siape"] for d in g.docentes)
    for (a, b), e in g.arestas.items():
        G.add_edge(a, b, peso=e["peso"], distancia=1.0 / e["peso"])

    grau, forca = Counter(), Counter()
    for (a, b), e in g.arestas.items():
        forca[a] += e["peso"]; forca[b] += e["peso"]
        grau[a] += 1; grau[b] += 1

    inter = nx.betweenness_centrality(G, normalized=True)
    inter_pond = nx.betweenness_centrality(G, normalized=True, weight="distancia")

    comunidades = nx.community.louvain_communities(G, weight="peso", seed=SEMENTE_LOUVAIN)
    comunidades = sorted(comunidades, key=lambda c: (-len(c), min(c)))
    comunidade_de = {s: i for i, c in enumerate(comunidades) for s in c}

    return {
        s: {
            "grau": grau[s],
            "forca": forca[s],
            "intermediacao": inter[s],
            "intermediacaoPonderada": inter_pond[s],
            "comunidade": comunidade_de[s],
        }
        for s in G.nodes
    }
