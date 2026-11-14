"""Testes da API (usa os JSON de dados/processados)."""
import json

import pytest
from fastapi.testclient import TestClient

from api.app import app
from pipeline.config import PROCESSADOS

c = TestClient(app)


def _json(nome):
    return json.loads((PROCESSADOS / nome).read_text(encoding="utf-8"))


def test_catalogo():
    r = c.get("/api/catalogo").json()
    assert len(r["institutos"]) == 12 and r["areas"] == []


def test_rede_sem_filtro_devolve_tudo():
    r = c.get("/api/rede").json()
    assert len(r["nos"]) == 549
    assert len(r["arestas"]) == len(_json("rede.json")["arestas"])


def test_rede_agregada_igual_ao_esboco():
    r = c.get("/api/rede", params={"agregar": "true"}).json()
    ref = {tuple(sorted((e["origemId"], e["destinoId"]))): e["peso"] for e in _json("rede_agregada.json")["arestas"]}
    novo = {tuple(sorted((e["origemId"], e["destinoId"]))): e["peso"] for e in r["arestas"]}
    assert novo.keys() == ref.keys()
    for k in ref:
        assert novo[k] == pytest.approx(ref[k], abs=1e-5)


def test_filtro_instituto_e_ano():
    r = c.get("/api/rede", params={"institutos": "imc", "anoInicio": 2024, "anoFim": 2025}).json()
    assert len(r["nos"]) == 49 and all(n["institutoId"] == "imc" for n in r["nos"])
    ids = {n["id"] for n in r["nos"]}
    assert all(e["origemId"] in ids and e["destinoId"] in ids and 2024 <= e["ano"] <= 2025 for e in r["arestas"])


def test_peso_minimo():
    r = c.get("/api/rede", params={"agregar": "true", "pesoMinimo": 1}).json()
    assert len(r["arestas"]) == 93 and all(e["peso"] >= 1 for e in r["arestas"])


def test_areas_e_vizinhanca():
    a = c.get("/api/areas").json()
    assert a["areas"] == [] and sum(i["pesquisadores"] for i in a["institutos"]) == 549
    v = c.get("/api/institutos/imc/vizinhanca").json()
    assert v["foco"]["sigla"] == "IMC" and len(v["nos"]) == 74
    assert c.get("/api/institutos/xyz/vizinhanca").status_code == 503
