"""Verifica as fórmulas propostas e sua aplicação a publicações com autoria total."""
from math import exp, sqrt

import pytest

from pipeline.construcao import construir
from pipeline.openalex import tipo_producao
from pipeline.pesos import ParametrosPeso, peso_producao


def test_conference_paper_entra_como_evento_completo():
    trabalho = {"type": "conference-paper", "primary_location": None}
    assert tipo_producao(trabalho) == "evento_completo"
    assert tipo_producao({"type": "conference-abstract"}) == "outro"
    assert tipo_producao({"type": "article", "primary_location": {"source": {"type": "journal"}}}) == "artigo_periodico"


def test_reimberg_preserva_formula_e_ignora_tempo():
    parametros = ParametrosPeso()
    assert peso_producao("artigo_periodico", 4, 2022, parametros) == pytest.approx(1 / 3)
    assert peso_producao("evento_completo", 3, 2012, parametros) == pytest.approx(0.7 / 2)


def test_zanoli_aplica_raiz_e_decaimento():
    parametros = ParametrosPeso("zanoli", 0.1, 2026)
    assert peso_producao("artigo_periodico", 4, 2022, parametros) == pytest.approx(exp(-0.4) / sqrt(3))
    recente = peso_producao("artigo_periodico", 2, 2025, parametros)
    antigo = peso_producao("artigo_periodico", 2, 2021, parametros)
    assert antigo < recente
    # Com dois autores, o decaimento pode fazer Zanoli ser MENOR que Reimberg.
    assert recente < peso_producao("artigo_periodico", 2, 2025, ParametrosPeso())


def test_lambda_zero_remove_apenas_decaimento():
    parametros = ParametrosPeso("zanoli", 0, 2026)
    assert peso_producao("livro", 5, 2021, parametros) == 0.5


@pytest.mark.parametrize("autores,ano,parametros", [
    (1, 2025, ParametrosPeso()),
    (2, 2027, ParametrosPeso("zanoli")),
    (2, 2025, ParametrosPeso("zanoli", -1)),
    (2, 2025, ParametrosPeso("zanoli", float("nan"))),
])
def test_entradas_invalidas(autores, ano, parametros):
    with pytest.raises(ValueError):
        peso_producao("artigo_periodico", autores, ano, parametros)


def test_construcao_usa_total_de_autores_incluindo_externos():
    docentes = [{"nome": "Ana Silva", "siape": "1"}, {"nome": "Bruno Lima", "siape": "2"}]
    autorias = [
        {"author": {"display_name": d["nome"]}, "institutions": [{"id": "https://openalex.org/I8165072"}]}
        for d in docentes
    ] + [{"author": {"display_name": "Externo"}, "institutions": []} for _ in range(2)]
    producao = {"authorships": autorias, "publication_year": 2025, "type": "article", "primary_location": None}
    grafo = construir(docentes, [producao], ParametrosPeso("zanoli", 0.1, 2026))
    assert grafo.arestas[("1", "2")]["peso"] == pytest.approx(exp(-0.1) / sqrt(3))
