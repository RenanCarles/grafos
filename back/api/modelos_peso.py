"""Gera redes alternativas em memória sem sobrescrever os dados de referência."""
import json
from functools import lru_cache

from fastapi import HTTPException

from pipeline import construcao, exportar, metricas, openalex, sigaa
from pipeline.config import ALPHA, PROCESSADOS
from pipeline.pesos import ParametrosPeso
from .leitura_grupos import enriquecer_nos, leitura_grupos


@lru_cache(maxsize=1)
def _fontes():
    return sigaa.carregar(), openalex.carregar()


@lru_cache(maxsize=8)
def _rede_zanoli(parametros: ParametrosPeso) -> dict:
    docentes, producoes = _fontes()
    grafo = construcao.construir(docentes, producoes, parametros)
    return enriquecer_nos(exportar.rede(grafo, metricas.calcular(grafo)))


@lru_cache(maxsize=1)
def _rede_reimberg() -> dict:
    rede = json.loads((PROCESSADOS / "rede.json").read_text(encoding="utf-8"))
    return enriquecer_nos(rede)


def obter_rede(parametros: ParametrosPeso) -> dict:
    try:
        base = _rede_reimberg() if parametros.formula == "reimberg" else _rede_zanoli(parametros)
        # A outra fórmula entra só na comparação. Os parâmetros de Zanoli são os da consulta;
        # em Reimberg, a interface omite λ e o ano, e a API usa 0,1 e 2026.
        zanoli = _rede_zanoli(ParametrosPeso("zanoli", parametros.lambda_temporal, parametros.ano_referencia))
        comparacao = leitura_grupos(_rede_reimberg(), zanoli)
    except (OSError, ValueError, KeyError, TypeError) as erro:
        raise HTTPException(503, "Não foi possível calcular a rede. Confira os dados brutos e processados no backend.") from erro
    # Não alterar os dicionários compartilhados pelo cache.
    return {**base, "meta": {
        **base["meta"],
        "idFormula": parametros.formula,
        "formulaPeso": "Σ α(tipo)/(n−1)" if parametros.formula == "reimberg" else "Σ α(tipo)·exp(−λ·(anoReferencia−ano))/√(n−1)",
        "parametrosPeso": {
            "alpha": ALPHA,
            "lambdaTemporal": parametros.lambda_temporal if parametros.formula == "zanoli" else None,
            "anoReferencia": parametros.ano_referencia if parametros.formula == "zanoli" else None,
        },
        "componentesDisponiveis": ["producao"],
        "componentesIndisponiveis": ["orientacao", "banca", "projeto"],
        "escopoMetricas": "Rede completa de 2021–2025, usando os pesos da fórmula selecionada; filtros não recalculam as métricas.",
        "leituraGrupos": comparacao,
    }}
