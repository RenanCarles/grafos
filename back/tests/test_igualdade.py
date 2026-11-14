"""Garante que os dados exportados são iguais aos do esboço original (tests/referencia/, gerado pelos
scripts da primeira versão). Rodar depois de `python -m pipeline`:

    python -m pytest tests -q
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

import pytest

from pipeline.config import ALPHA, PROCESSADOS
from pipeline.construcao import id_publico

REF = Path(__file__).parent / "referencia"
TOL = 1e-4  # referência gravada com 4 casas decimais


def _csv(p):
    return list(csv.DictReader(p.open(encoding="utf-8-sig")))


def _json(nome):
    return json.loads((PROCESSADOS / nome).read_text(encoding="utf-8"))


def _par(a, b):
    return tuple(sorted((a, b)))


@pytest.fixture(scope="module")
def ref_nos():
    return {r["id"]: r for r in _csv(REF / "nos.csv")}  # chave = SIAPE


@pytest.fixture(scope="module")
def ref_arestas():
    return {_par(id_publico(r["origem"]), id_publico(r["destino"])): r for r in _csv(REF / "arestas.csv")}


@pytest.fixture(scope="module")
def agregada():
    return _json("rede_agregada.json")


def test_mesmos_nos(ref_nos, agregada):
    novos = {n["id"]: n for n in agregada["nos"]}
    assert len(novos) == len(ref_nos) == 549
    for siape, r in ref_nos.items():
        n = novos[id_publico(siape)]
        assert n["nome"] == r["nome"]
        assert n["institutoId"] == r["instituto"].lower()
        assert n["grau"] == int(r["grau"])
        assert n["producoes"] == int(r["producoes_openalex"])
        assert n["forca"] == pytest.approx(float(r["forca"]), abs=TOL)


def test_mesmas_arestas_agregadas(ref_arestas, agregada):
    novas = {_par(e["origemId"], e["destinoId"]): e for e in agregada["arestas"]}
    assert novas.keys() == ref_arestas.keys()
    assert len(novas) == 852
    for k, r in ref_arestas.items():
        e = novas[k]
        assert e["peso"] == pytest.approx(float(r["peso"]), abs=TOL)
        assert e["nProducoes"] == int(r["n_producoes"])
        assert e["porTipoProducao"] == {t: int(r[t]) for t in ALPHA}
        assert e["interInstituto"] == (r["inter_instituto"] == "1")


def test_rede_por_ano_soma_igual_a_agregada(agregada):
    por_ano = _json("rede.json")
    soma, nprod = defaultdict(float), defaultdict(int)
    for e in por_ano["arestas"]:
        assert e["tipo"] == "coautoria" and 2021 <= e["ano"] <= 2025
        k = _par(e["origemId"], e["destinoId"])
        soma[k] += e["peso"]
        nprod[k] += e["nProducoes"]
    ag = {_par(e["origemId"], e["destinoId"]): e for e in agregada["arestas"]}
    assert soma.keys() == ag.keys()
    for k, e in ag.items():
        assert soma[k] == pytest.approx(e["peso"], abs=TOL)
        assert nprod[k] == e["nProducoes"]
    assert [n["id"] for n in por_ano["nos"]] == [n["id"] for n in agregada["nos"]]


def test_matriz_institutos():
    ref = _csv(REF / "matriz_institutos.csv")
    nova = _json("matriz_institutos.json")
    idx = {s: i for i, s in enumerate(nova["institutos"])}
    for linha in ref:
        i = linha["instituto"]
        for j, v in linha.items():
            if j != "instituto":
                assert nova["valores"][idx[i]][idx[j]] == pytest.approx(float(v), abs=1e-3)


def test_vizinhanca_imc():
    ref_nos = {r["id"]: r for r in _csv(REF / "instituto_IMC" / "nos.csv")}
    ref_ar = {_par(id_publico(r["origem"]), id_publico(r["destino"])): r
              for r in _csv(REF / "instituto_IMC" / "arestas.csv")}
    novo = _json("institutos/IMC.json")
    nos = {n["id"]: n for n in novo["nos"]}
    assert len(nos) == len(ref_nos) == 74
    for siape, r in ref_nos.items():
        n = nos[id_publico(siape)]
        assert n["noFoco"] == (r["no_foco"] == "1")
        assert n["grauSub"] == int(r["grau_sub"]) and n["grauPonte"] == int(r["grau_ponte"])
        # a referência somou pesos já arredondados a 4 casas (o script antigo lia o CSV), então acumula
        # erro de arredondamento; o valor novo usa os pesos exatos. Tolerância compatível com isso.
        assert n["forcaSub"] == pytest.approx(float(r["forca_sub"]), abs=1e-3)
        assert n["forcaPonte"] == pytest.approx(float(r["forca_ponte"]), abs=1e-3)
    ar = {_par(e["origemId"], e["destinoId"]): e for e in novo["arestas"]}
    assert ar.keys() == ref_ar.keys()
    for k, r in ref_ar.items():
        assert ar[k]["classe"] == r["cls"]
        assert ar[k]["peso"] == pytest.approx(float(r["peso"]), abs=TOL)


def test_contrato_front(agregada):
    """Campos obrigatórios de NoRede/Relacao (front/src/app/shared/models/dominio.ts)."""
    cat = _json("catalogo.json")
    ids_inst = {i["id"] for i in cat["institutos"]}
    assert all({"id", "sigla", "nome"} <= i.keys() for i in cat["institutos"])
    for n in _json("rede.json")["nos"]:
        assert {"id", "nome", "institutoId", "areaIds", "grau", "intermediacao", "comunidade"} <= n.keys()
        assert n["institutoId"] in ids_inst
        assert isinstance(n["comunidade"], int) and n["comunidade"] >= 0
        assert 0 <= n["intermediacao"] <= 1
    for e in _json("rede.json")["arestas"]:
        assert {"origemId", "destinoId", "tipo", "peso", "ano"} <= e.keys()
    assert "SIAPE" not in json.dumps(agregada).upper()  # SIAPE não vaza para o front
