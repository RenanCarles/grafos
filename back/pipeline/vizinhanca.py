"""Subgrafo focado em um instituto: docentes do instituto + docentes de fora com ligação direta.

O subgrafo é induzido; as arestas recebem uma classe:
  foco  = instituto ↔ instituto
  ponte = instituto ↔ fora
  fora  = fora ↔ fora (entre dois vizinhos externos)
"""
from collections import Counter, defaultdict
from dataclasses import dataclass

CLASSES = {2: "foco", 1: "ponte", 0: "fora"}


@dataclass
class Vizinhanca:
    sigla: str
    foco: set
    vizinhos: set
    arestas: list            # [(a, b, classe, dados_agregados)]
    grau: Counter
    forca: Counter
    grau_ponte: Counter
    forca_ponte: Counter

    @property
    def selecionados(self) -> set:
        return self.foco | self.vizinhos


def calcular(g, sigla: str) -> Vizinhanca:
    inst = {d["siape"]: d["instituto_sigla"] for d in g.docentes}
    foco = {s for s, i in inst.items() if i == sigla}

    vizinhos = set()
    for a, b in g.arestas:
        if (a in foco) != (b in foco):
            vizinhos.add(b if a in foco else a)
    sel = foco | vizinhos

    sub = []
    grau, forca, gp, fp = Counter(), Counter(), Counter(), Counter()
    for (a, b), e in g.arestas.items():
        if a in sel and b in sel:
            cls = CLASSES[(a in foco) + (b in foco)]
            sub.append((a, b, cls, e))
            for x in (a, b):
                grau[x] += 1
                forca[x] += e["peso"]
                if cls == "ponte":
                    gp[x] += 1
                    fp[x] += e["peso"]
    return Vizinhanca(sigla, foco, vizinhos, sub, grau, forca, gp, fp)


def resumo(v: Vizinhanca, inst: dict) -> dict:
    peso_cls = defaultdict(float)
    cont_cls = Counter()
    peso_parceiro = defaultdict(float)
    for a, b, cls, e in v.arestas:
        peso_cls[cls] += e["peso"]
        cont_cls[cls] += 1
        if cls == "ponte":
            peso_parceiro[inst[b if a in v.foco else a]] += e["peso"]
    return {
        "docentesFoco": len(v.foco),
        "docentesFocoSemAresta": sum(1 for s in v.foco if v.grau[s] == 0),
        "vizinhosExternos": len(v.vizinhos),
        "vizinhosPorInstituto": dict(Counter(inst[s] for s in v.vizinhos).most_common()),
        "arestasPorClasse": {c: cont_cls[c] for c in ("foco", "ponte", "fora")},
        "pesoPorClasse": {c: round(peso_cls[c], 6) for c in ("foco", "ponte", "fora")},
        "pesoPontesPorInstituto": {k: round(x, 6) for k, x in sorted(peso_parceiro.items(), key=lambda t: -t[1])},
    }
