"""Exporta os dados processados nos formatos consumidos pelo front (JSON) e para análise (CSV).

JSON segue o contrato de front/src/app/shared/models/dominio.ts (Instituto, NoRede, Relacao, Rede),
com campos extras opcionais (ignorados pelo TypeScript se não declarados).
"""
import csv
import json
from collections import defaultdict
from datetime import datetime, timezone

from . import vizinhanca
from .config import ALPHA, ANOS, CORES, PROCESSADOS
from .construcao import id_publico

CASAS = 6  # casas decimais nos JSON


def _r(x: float) -> float:
    return round(x, CASAS)


def _json(caminho, obj):
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")


def _por_tipo(e: dict) -> dict:
    return {k: e[k] for k in ALPHA}


def catalogo(g) -> dict:
    institutos, vistos = [], {}
    for d in g.docentes:
        s = d["instituto_sigla"]
        if s not in vistos:
            vistos[s] = {"id": s.lower(), "sigla": s, "nome": d["instituto_nome"], "cor": CORES.get(s), "docentes": 0}
            institutos.append(vistos[s])
        vistos[s]["docentes"] += 1
    return {"institutos": institutos, "areas": []}


def _no(d: dict, m: dict, producoes: int) -> dict:
    return {
        # --- contrato NoRede do front
        "id": id_publico(d["siape"]),
        "nome": d["nome"],
        "institutoId": d["instituto_sigla"].lower(),
        "areaIds": [],
        "grau": m["grau"],
        "intermediacao": _r(m["intermediacao"]),
        "comunidade": m["comunidade"],
        # --- extras
        "forca": _r(m["forca"]),
        "intermediacaoPonderada": _r(m["intermediacaoPonderada"]),
        "producoes": producoes,
        "categoria": d["categoria"],
        "titulacao": d["titulacao"],
        "lattesId": d["lattes_id"] or None,
    }


def _meta(g, extra=None) -> dict:
    return {
        "fonteNos": "SIGAA UNIFEI (páginas públicas)",
        "fonteArestas": "OpenAlex (substituto temporário do Lattes)",
        "anos": ANOS,
        "formulaPeso": "w_ij = soma_p alpha(tipo_p) / (n_p - 1)",
        "alpha": ALPHA,
        "tipoRelacao": "coautoria",
        "geradoEm": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "casamentoNomes": {"casadas": dict(g.casamentos), "naoCasadas": sum(g.nao_casados.values())},
        **(extra or {}),
    }


def rede(g, metricas) -> dict:
    """Relações por par e por ano (o front filtra por ano). Σ dos anos = peso agregado."""
    arestas = [{
        "origemId": id_publico(a), "destinoId": id_publico(b), "tipo": "coautoria",
        "peso": _r(e["peso"]), "ano": ano,
        "nProducoes": e["n_producoes"], "porTipoProducao": _por_tipo(e),
    } for (a, b, ano), e in sorted(g.arestas_ano.items(), key=lambda x: (x[0][2], x[0][0], x[0][1]))]
    nos = [_no(d, metricas[d["siape"]], g.producoes[d["siape"]]) for d in g.docentes]
    return {"meta": _meta(g, {"granularidade": "par x ano"}), "nos": nos, "arestas": arestas}


def rede_agregada(g, metricas) -> dict:
    """Uma aresta por par (todos os anos somados) — é o grafo do esboço."""
    inst = {d["siape"]: d["instituto_sigla"] for d in g.docentes}
    anos = defaultdict(set)
    for a, b, ano in g.arestas_ano:
        anos[(a, b)].add(ano)
    arestas = [{
        "origemId": id_publico(a), "destinoId": id_publico(b), "tipo": "coautoria",
        "peso": _r(e["peso"]), "ano": max(anos[(a, b)]), "anos": sorted(anos[(a, b)]),
        "nProducoes": e["n_producoes"], "porTipoProducao": _por_tipo(e),
        "interInstituto": inst[a] != inst[b],
    } for (a, b), e in sorted(g.arestas.items(), key=lambda x: -x[1]["peso"])]
    nos = [_no(d, metricas[d["siape"]], g.producoes[d["siape"]]) for d in g.docentes]
    return {"meta": _meta(g, {"granularidade": "par (todos os anos)",
                              "obsAno": "ano = último ano com produção em comum; anos = lista completa"}),
            "nos": nos, "arestas": arestas}


def matriz_institutos(g) -> dict:
    inst = {d["siape"]: d["instituto_sigla"] for d in g.docentes}
    siglas = sorted(set(inst.values()))
    m = defaultdict(float)
    for (a, b), e in g.arestas.items():
        m[tuple(sorted((inst[a], inst[b])))] += e["peso"]
    return {
        "institutos": siglas,
        "valores": [[_r(m.get(tuple(sorted((i, j))), 0.0)) for j in siglas] for i in siglas],
    }


def instituto_foco(g, sigla: str) -> dict:
    v = vizinhanca.calcular(g, sigla)
    inst = {d["siape"]: d["instituto_sigla"] for d in g.docentes}
    ps = g.por_siape
    ordem = sorted(v.selecionados, key=lambda s: (s not in v.foco, -v.forca[s], s))
    return {
        "foco": {"id": sigla.lower(), "sigla": sigla},
        "resumo": vizinhanca.resumo(v, inst),
        "nos": [{
            "id": id_publico(s), "nome": ps[s]["nome"], "institutoId": inst[s].lower(),
            "noFoco": s in v.foco, "grauSub": v.grau[s], "forcaSub": _r(v.forca[s]),
            "grauPonte": v.grau_ponte[s], "forcaPonte": _r(v.forca_ponte[s]),
        } for s in ordem],
        "arestas": [{
            "origemId": id_publico(a), "destinoId": id_publico(b), "classe": cls,
            "peso": _r(e["peso"]), "nProducoes": e["n_producoes"], "porTipoProducao": _por_tipo(e),
        } for a, b, cls, e in sorted(v.arestas, key=lambda x: -x[3]["peso"])],
    }


def csvs(g, metricas, destino):
    """CSV no mesmo formato do esboço (id = id público), para Gephi/planilhas."""
    destino.mkdir(parents=True, exist_ok=True)
    inst = {d["siape"]: d["instituto_sigla"] for d in g.docentes}
    with (destino / "nos.csv").open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["id", "nome", "instituto", "categoria", "lattes_id", "producoes_openalex", "grau", "forca",
                    "intermediacao", "intermediacao_ponderada", "comunidade"])
        for d in g.docentes:
            m = metricas[d["siape"]]
            w.writerow([id_publico(d["siape"]), d["nome"], d["instituto_sigla"], d["categoria"], d["lattes_id"],
                        g.producoes[d["siape"]], m["grau"], _r(m["forca"]), _r(m["intermediacao"]),
                        _r(m["intermediacaoPonderada"]), m["comunidade"]])
    with (destino / "arestas.csv").open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["origem", "destino", "peso", "n_producoes", *ALPHA, "inter_instituto"])
        for (a, b), e in sorted(g.arestas.items(), key=lambda x: -x[1]["peso"]):
            w.writerow([id_publico(a), id_publico(b), _r(e["peso"]), e["n_producoes"], *_por_tipo(e).values(),
                        int(inst[a] != inst[b])])
    mi = matriz_institutos(g)
    with (destino / "matriz_institutos.csv").open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["instituto", *mi["institutos"]])
        for s, linha in zip(mi["institutos"], mi["valores"]):
            w.writerow([s, *linha])


def tudo(g, metricas, destino=PROCESSADOS) -> list:
    gerados = []

    def salvar(nome, obj):
        _json(destino / nome, obj)
        gerados.append(destino / nome)

    cat = catalogo(g)
    salvar("catalogo.json", cat)
    salvar("rede.json", rede(g, metricas))
    salvar("rede_agregada.json", rede_agregada(g, metricas))
    salvar("matriz_institutos.json", matriz_institutos(g))
    for i in cat["institutos"]:
        salvar(f"institutos/{i['sigla']}.json", instituto_foco(g, i["sigla"]))
    csvs(g, metricas, destino / "csv")
    return gerados
