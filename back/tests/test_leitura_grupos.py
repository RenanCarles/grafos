"""Parceiros fora do instituto e comparação de grupos, antes dos filtros."""
from collections import defaultdict

import pytest
from fastapi.testclient import TestClient

from api.app import app
from api.leitura_grupos import enriquecer_nos, leitura_grupos

cliente = TestClient(app)

TEXTO_COLETA = (
    "Reimberg e Zanoli têm, cada uma, 27 grupos com mais de uma pessoa; "
    "19 deles reúnem institutos diferentes. "
    "O maior grupo de Reimberg, com 40 pessoas, mantém 31 juntas sob Zanoli. "
    "O grupo de 26 pessoas centrado no IEPG se divide, e só 8 permanecem juntas."
)


def _no(identificador, instituto, comunidade):
    return {
        "id": identificador,
        "institutoId": instituto,
        "comunidade": comunidade,
        "areaIds": [],
    }


def _rede(nos, arestas):
    return {"nos": nos, "arestas": arestas}


def test_vizinhos_fora_ignoram_ano_repetido_e_nao_preenchem_area():
    rede = _rede(
        [_no("a", "iem", 0), _no("b", "iem", 0), _no("c", "iepg", 0), _no("d", "iepg", 1)],
        [
            {"origemId": "a", "destinoId": "b", "ano": 2021},
            {"origemId": "a", "destinoId": "b", "ano": 2022},
            {"origemId": "a", "destinoId": "c", "ano": 2023},
            {"origemId": "c", "destinoId": "d", "ano": 2024},
        ],
    )
    enriquecer_nos(rede)
    por_id = {no["id"]: no for no in rede["nos"]}
    assert por_id["a"]["vizinhosFora"] == 1
    assert por_id["b"]["vizinhosFora"] == 0
    assert por_id["c"]["vizinhosFora"] == 1
    assert por_id["d"]["vizinhosFora"] == 0
    assert por_id["a"]["institutosDoGrupo"] == ["IEM", "IEPG"]
    assert por_id["c"]["institutosDoGrupo"] == ["IEM", "IEPG"]
    assert por_id["d"]["institutosDoGrupo"] == ["IEPG"]
    assert all(no["areaIds"] == [] for no in rede["nos"])


def test_texto_acompanha_as_duas_particoes():
    reimberg = _rede(
        [
            _no("a", "iesti", 0), _no("b", "iesti", 0), _no("c", "iesti", 0), _no("g", "imc", 0),
            _no("d", "iepg", 1), _no("e", "iepg", 1), _no("f", "iepg", 1),
        ],
        [],
    )
    zanoli = _rede(
        [
            _no("a", "iesti", 0), _no("b", "iesti", 0), _no("c", "iesti", 0),
            _no("g", "imc", 1),
            _no("d", "iepg", 2), _no("e", "iepg", 2),
            _no("f", "iepg", 3),
        ],
        [],
    )
    leitura = leitura_grupos(reimberg, zanoli)
    assert leitura["reimberg"] == {"gruposComMaisDeUmaPessoa": 2, "gruposEntreInstitutos": 1}
    assert leitura["zanoli"] == {"gruposComMaisDeUmaPessoa": 2, "gruposEntreInstitutos": 0}
    assert leitura["maiorGrupoReimberg"] == {"pessoas": 4, "permanecemJuntas": 3}
    assert leitura["grupoCentradoNoIepg"] == {"pessoas": 3, "permanecemJuntas": 2}
    assert "se divide, e só 2 permanecem juntas" in leitura["texto"]
    assert "nos" not in leitura

    juntos = _rede(
        [_no("d", "iepg", 0), _no("e", "iepg", 0), _no("a", "imc", 1)],
        [],
    )
    mesma = leitura_grupos(juntos, juntos)
    assert "permanece junto sob Zanoli" in mesma["texto"]
    assert mesma["grupoCentradoNoIepg"]["permanecemJuntas"] == 2


def _por_nome(nos):
    return {no["nome"]: no for no in nos}


def test_api_leitura_da_rede_completa_nao_muda_com_filtro():
    cheia = cliente.get("/api/rede", params={"agregar": True, "pesoMinimo": 0}).json()
    recorte = cliente.get(
        "/api/rede",
        params={"agregar": True, "institutos": "imc", "anoInicio": 2024, "anoFim": 2024, "pesoMinimo": 1},
    ).json()
    meta = cliente.get("/api/meta").json()
    assert cheia["meta"]["leituraGrupos"]["texto"] == TEXTO_COLETA
    assert recorte["meta"]["leituraGrupos"] == cheia["meta"]["leituraGrupos"] == meta["leituraGrupos"]
    assert "nos" not in cheia["meta"]["leituraGrupos"]

    nos = cheia["nos"]
    assert len(nos) == 549
    instituto = {no["id"]: no["institutoId"] for no in nos}
    vizinhos = defaultdict(set)
    for aresta in cheia["arestas"]:
        vizinhos[aresta["origemId"]].add(aresta["destinoId"])
        vizinhos[aresta["destinoId"]].add(aresta["origemId"])
    membros = defaultdict(list)
    for no in nos:
        membros[no["comunidade"]].append(no)
        esperado = sum(1 for vizinho in vizinhos[no["id"]] if instituto[vizinho] != no["institutoId"])
        assert no["vizinhosFora"] == esperado
        assert no["vizinhosFora"] <= no["grau"]
        assert no["areaIds"] == []
    for grupo in membros.values():
        siglas = sorted({no["institutoId"].upper() for no in grupo})
        assert all(no["institutosDoGrupo"] == siglas for no in grupo)

    por_nome = _por_nome(nos)
    frinhani = por_nome["RAFAEL DE MAGALHAES DIAS FRINHANI"]
    assert frinhani["grau"] == 11 and frinhani["vizinhosFora"] == 4
    assert "IMC" in frinhani["institutosDoGrupo"]
    assert por_nome["TALES CLEBER PIMENTA"]["vizinhosFora"] == 6
    benedito = por_nome["BENEDITO CLAUDIO DA SILVA"]
    assert benedito["grau"] == 9 and benedito["vizinhosFora"] == 0
    forcas = sorted((no["forca"] for no in nos), reverse=True)
    assert forcas[0] > forcas[1]
    assert max(nos, key=lambda no: no["forca"])["nome"] == "GUILHERME FERREIRA GOMES"

    por_id = {no["id"]: no for no in nos}
    assert recorte["nos"]
    for no in recorte["nos"]:
        origem = por_id[no["id"]]
        assert no["vizinhosFora"] == origem["vizinhosFora"]
        assert no["institutosDoGrupo"] == origem["institutosDoGrupo"]
        assert no["grau"] == origem["grau"]
        assert no["forca"] == origem["forca"]
        assert no["comunidade"] == origem["comunidade"]


def test_api_zanoli_muda_grupo_e_preserva_grau_e_vizinhos_fora():
    reimberg = cliente.get("/api/rede", params={"agregar": True}).json()
    zanoli = cliente.get("/api/rede", params={"formulaPeso": "zanoli", "agregar": True}).json()
    assert zanoli["meta"]["leituraGrupos"]["texto"] == TEXTO_COLETA
    assert zanoli["meta"]["idFormula"] == "zanoli"
    por_zanoli = {no["id"]: no for no in zanoli["nos"]}
    assert any(no["institutosDoGrupo"] != por_zanoli[no["id"]]["institutosDoGrupo"] for no in reimberg["nos"])
    assert any(no["forca"] != por_zanoli[no["id"]]["forca"] for no in reimberg["nos"])
    for no in reimberg["nos"]:
        outro = por_zanoli[no["id"]]
        assert no["grau"] == outro["grau"]
        assert no["vizinhosFora"] == outro["vizinhosFora"]
    forcas = sorted((no["forca"] for no in zanoli["nos"]), reverse=True)
    assert forcas[0] > forcas[1]
    assert max(zanoli["nos"], key=lambda no: no["forca"])["nome"] == "GUILHERME FERREIRA GOMES"


@pytest.mark.parametrize("parametros", [
    {"formulaPeso": "reimberg", "lambdaTemporal": 0, "anoReferencia": 2026},
    {"formulaPeso": "zanoli", "lambdaTemporal": 0, "anoReferencia": 2026},
])
def test_api_comparacao_existe_para_lambda_zero(parametros):
    meta = cliente.get("/api/meta", params=parametros).json()
    assert isinstance(meta["leituraGrupos"]["texto"], str)
    assert meta["leituraGrupos"]["texto"]
    assert meta["leituraGrupos"]["reimberg"]["gruposComMaisDeUmaPessoa"] >= 1
