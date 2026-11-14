"""Construção do grafo: nós = docentes, arestas = produções em comum, peso = Σ α(tipo)/(n−1).

Internamente os docentes são indexados pelo SIAPE (chave do SIGAA). Para fora (JSON do front),
use `id_publico`, que não expõe o SIAPE.
"""
import hashlib
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from itertools import combinations

from .casamento import Casador
from .config import ALPHA
from .openalex import eh_unifei, tipo_producao


def id_publico(siape: str) -> str:
    return "doc-" + hashlib.sha1(siape.encode()).hexdigest()[:10]


def _vazio():
    return {"peso": 0.0, "n_producoes": 0, **{k: 0 for k in ALPHA}}


@dataclass
class Grafo:
    docentes: list[dict]                                   # ordem do CSV do SIGAA
    arestas: dict = field(default_factory=lambda: defaultdict(_vazio))        # (a, b) -> agregado
    arestas_ano: dict = field(default_factory=lambda: defaultdict(_vazio))    # (a, b, ano) -> por ano
    producoes: Counter = field(default_factory=Counter)    # siape -> nº de produções no OpenAlex
    casamentos: Counter = field(default_factory=Counter)   # método -> nº de autorias casadas
    nao_casados: Counter = field(default_factory=Counter)  # nome -> nº de autorias

    @property
    def por_siape(self) -> dict:
        return {d["siape"]: d for d in self.docentes}


def construir(docentes: list[dict], works: list[dict]) -> Grafo:
    g = Grafo(docentes=docentes)
    casador = Casador(docentes)

    for w in works:
        n = len(w["authorships"])
        unifei = set()
        for a in w["authorships"]:
            if not eh_unifei(a):
                continue
            nome = a["author"].get("display_name") or a.get("raw_author_name") or ""
            d, metodo = casador.casar(nome)
            if d:
                unifei.add(d["siape"])
                g.casamentos[metodo] += 1
            else:
                g.nao_casados[nome] += 1
        for s in unifei:
            g.producoes[s] += 1
        if n < 2 or len(unifei) < 2:
            continue

        tipo = tipo_producao(w)
        contrib = ALPHA[tipo] / (n - 1)
        ano = w.get("publication_year")
        for a, b in combinations(sorted(unifei), 2):
            for e in (g.arestas[(a, b)], g.arestas_ano[(a, b, ano)]):
                e["peso"] += contrib
                e[tipo] += 1
                e["n_producoes"] += 1
    return g
