"""Gera os HTMLs interativos (vis-network embutido, funcionam offline) — os mesmos do esboço."""
import json
from pathlib import Path

from .. import vizinhanca
from ..config import ALPHA, ANOS, CORES
from ..construcao import id_publico

AQUI = Path(__file__).parent


def _render(titulo, nodes, edges, foco_html=None) -> str:
    html = (AQUI / "template_grafo.html").read_text(encoding="utf-8")
    visjs = (AQUI / "vis-network.min.js").read_text(encoding="utf-8").replace("</script", "<\\/script")
    return (html.replace("__VISJS__", visjs)
                .replace("__NODES__", json.dumps(nodes, ensure_ascii=False))
                .replace("__EDGES__", json.dumps(edges, ensure_ascii=False))
                .replace("__CORES__", json.dumps(CORES))
                .replace("__ALPHA__", json.dumps(ALPHA))
                .replace("__FOCO_HTML__", json.dumps(foco_html, ensure_ascii=False))
                .replace("__ANOS__", ANOS)
                .replace("__TITULO__", titulo))


def _tooltip_aresta(prefixo, e):
    return f"{prefixo}peso {e['peso']:.3f} · {e['n_producoes']} produções\n" + \
        ", ".join(f"{k}: {e[k]}" for k in ALPHA if e[k])


def geral(g, metricas) -> str:
    nodes = []
    for d in g.docentes:
        s, m = d["siape"], metricas[d["siape"]]
        nodes.append({
            "id": id_publico(s), "label": d["nome"].title(), "inst": d["instituto_sigla"],
            "value": round(m["forca"], 3) + 0.05, "isolado": m["grau"] == 0,
            "title": f"{d['nome'].title()}\n{d['instituto_sigla']} · {d['categoria']}\n"
                     f"produções (OpenAlex): {g.producoes[s]}\ngrau: {m['grau']} · força: {m['forca']:.2f}",
        })
    edges = [{"from": id_publico(a), "to": id_publico(b), "value": round(e["peso"], 4),
              "title": _tooltip_aresta("", e)} for (a, b), e in g.arestas.items()]
    return _render("Rede de colaboração — UNIFEI", nodes, edges)


def instituto(g, sigla: str) -> str:
    v = vizinhanca.calcular(g, sigla)
    inst = {d["siape"]: d["instituto_sigla"] for d in g.docentes}
    r = vizinhanca.resumo(v, inst)
    ps = g.por_siape
    nodes = []
    for s in v.selecionados:
        d, dentro = ps[s], s in v.foco
        nodes.append({
            "id": id_publico(s), "label": d["nome"].title(), "inst": inst[s], "foco": dentro,
            "value": round(v.forca[s], 3) + 0.05, "isolado": v.grau[s] == 0,
            "title": f"{d['nome'].title()}\n{inst[s]}{' (foco)' if dentro else ''}\n"
                     f"grau: {v.grau[s]} · força: {v.forca[s]:.2f}\n"
                     f"ligações foco↔fora: {v.grau_ponte[s]} (peso {v.forca_ponte[s]:.2f})",
        })
    edges = [{"from": id_publico(a), "to": id_publico(b), "value": round(e["peso"], 4), "cls": cls,
              "title": _tooltip_aresta(f"{cls} · ", e)} for a, b, cls, e in v.arestas]
    pc = r["pesoPorClasse"]
    parceiros = "".join(f"<br>{k}: {x:.2f}" for k, x in r["pesoPontesPorInstituto"].items())
    foco_html = (
        f"<b>Foco: {sigla}</b> — {r['docentesFoco']} docentes (borda escura), {r['docentesFocoSemAresta']} sem "
        f"nenhuma aresta (marque “mostrar docentes sem aresta”).<br>"
        f"{r['vizinhosExternos']} docentes de fora com ligação direta.<br>"
        f"Arestas: <span style='color:#444'>■</span> dentro do {sigla} (peso {pc['foco']:.1f}) · "
        f"<span style='color:#c85a14'>■</span> {sigla}↔fora ({pc['ponte']:.1f}) · "
        f"<span style='color:#aaa'>■</span> fora↔fora ({pc['fora']:.1f})"
        f"<br><br><b>Peso das ligações com cada instituto:</b>{parceiros}"
    )
    return _render(f"Rede de colaboração — foco {sigla}", nodes, edges, foco_html)


def tudo(g, metricas, destino) -> list:
    destino.mkdir(parents=True, exist_ok=True)
    gerados = [destino / "grafo_geral.html"]
    gerados[0].write_text(geral(g, metricas), encoding="utf-8")
    for sigla in sorted({d["instituto_sigla"] for d in g.docentes}):
        p = destino / f"instituto_{sigla}.html"
        p.write_text(instituto(g, sigla), encoding="utf-8")
        gerados.append(p)
    return gerados
