"""Roda o pipeline completo.

    python -m pipeline              # usa os dados brutos já baixados (dados/brutos/)
    python -m pipeline --coletar    # baixa de novo do SIGAA e do OpenAlex antes de processar
    python -m pipeline --sem-html   # não gera as visualizações HTML
"""
import argparse

from . import construcao, exportar, metricas, openalex, sigaa, visualizacao
from .config import BRUTOS, PROCESSADOS


def main():
    p = argparse.ArgumentParser(prog="python -m pipeline")
    p.add_argument("--coletar", action="store_true", help="baixar de novo SIGAA e OpenAlex")
    p.add_argument("--sem-html", action="store_true", help="não gerar os HTMLs")
    args = p.parse_args()

    if args.coletar:
        print("[1/4] coletando docentes (SIGAA)…"); sigaa.coletar()
        print("[1/4] coletando publicações (OpenAlex)…"); openalex.coletar()
    else:
        print(f"[1/4] usando dados brutos em {BRUTOS}")
    docentes, works = sigaa.carregar(), openalex.carregar()

    print(f"[2/4] construindo grafo ({len(docentes)} docentes, {len(works)} produções)…")
    g = construcao.construir(docentes, works)
    print(f"      autorias casadas: {dict(g.casamentos)} | não casadas: {sum(g.nao_casados.values())}")
    print(f"      arestas: {len(g.arestas)} (pares) / {len(g.arestas_ano)} (par x ano)")

    print("[3/4] calculando métricas (grau, força, intermediação, comunidades)…")
    m = metricas.calcular(g)

    print(f"[4/4] exportando para {PROCESSADOS}…")
    gerados = exportar.tudo(g, m)
    if not args.sem_html:
        gerados += visualizacao.tudo(g, m, PROCESSADOS / "html")
    for x in gerados:
        print("      ", x.relative_to(PROCESSADOS))


if __name__ == "__main__":
    main()
