from collections import defaultdict

import pytest
from fastapi.testclient import TestClient

from api.app import app

cliente = TestClient(app)


def test_zanoli_muda_pesos_sem_inventar_relacoes():
    parametros = {"formulaPeso": "zanoli", "agregar": True}
    resposta = cliente.get("/api/rede", params=parametros)
    assert resposta.status_code == 200
    nova = resposta.json()
    antiga = cliente.get("/api/rede", params={"agregar": True}).json()
    chave = lambda e: (e["origemId"], e["destinoId"])
    assert {chave(e) for e in nova["arestas"]} == {chave(e) for e in antiga["arestas"]}
    assert len(nova["arestas"]) == 852 and len(nova["nos"]) == 549
    pesos_antigos = {chave(e): e["peso"] for e in antiga["arestas"]}
    assert any(e["peso"] != pesos_antigos[chave(e)] for e in nova["arestas"])
    assert nova["meta"]["idFormula"] == "zanoli"
    assert nova["meta"]["componentesDisponiveis"] == ["producao"]
    assert nova["meta"]["componentesIndisponiveis"] == ["orientacao", "banca", "projeto"]
    forcas = defaultdict(float)
    for aresta in nova["arestas"]:
        forcas[aresta["origemId"]] += aresta["peso"]
        forcas[aresta["destinoId"]] += aresta["peso"]
    for no in nova["nos"]:
        assert no["forca"] == pytest.approx(forcas[no["id"]], abs=1e-4)
    # Consultar outra fórmula não altera a rede padrão nem os arquivos de referência.
    assert antiga["meta"]["idFormula"] == "reimberg"
    assert sum(e["peso"] >= 1 for e in antiga["arestas"]) == 115


def test_corte_soma_os_anos_antes_de_filtrar_tambem_em_zanoli():
    parametros = {"formulaPeso": "zanoli", "agregar": True}
    todas = cliente.get("/api/rede", params=parametros).json()
    cortada = cliente.get("/api/rede", params={**parametros, "pesoMinimo": 1}).json()
    assert cortada["arestas"] == [e for e in todas["arestas"] if e["peso"] >= 1]


def test_meta_e_areas_aceitam_parametros_do_modelo():
    parametros = {"formulaPeso": "zanoli", "lambdaTemporal": 0, "anoReferencia": 2026}
    meta = cliente.get("/api/meta", params=parametros)
    assert meta.status_code == 200
    assert meta.json()["parametrosPeso"]["lambdaTemporal"] == 0
    resposta = cliente.get("/api/areas", params={**parametros, "agregar": True})
    assert resposta.status_code == 200
    assert resposta.json()["areas"] == []


@pytest.mark.parametrize("parametros", [
    {"formulaPeso": "desconhecida"},
    {"lambdaTemporal": -0.1},
    {"lambdaTemporal": 0.6},
    {"lambdaTemporal": "nan"},
    {"anoReferencia": 2024},
    {"anoReferencia": 2026.5},
])
def test_api_rejeita_parametros_invalidos(parametros):
    assert cliente.get("/api/rede", params=parametros).status_code == 422
