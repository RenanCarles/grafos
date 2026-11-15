"""Visões persistidas em um JSON por arquivo."""
import json

import pytest
from fastapi.testclient import TestClient

from api import visoes_arquivos
from api.app import app
from api.visoes_arquivos import VisaoInvalida, importar

cliente = TestClient(app)


@pytest.fixture(autouse=True)
def pasta_isolada(tmp_path, monkeypatch):
    monkeypatch.setattr(visoes_arquivos, "PASTA", tmp_path)
    return tmp_path


def rascunho(nome="Minha visão", **filtros):
    base = {
        "institutos": [],
        "areas": [],
        "anoInicio": 2021,
        "anoFim": 2025,
        "pesoMinimo": 0,
        "formulaPeso": "reimberg",
    }
    base.update(filtros)
    return {
        "nome": nome,
        "descricao": "Recorte do grupo",
        "tipo": "rede",
        "filtros": base,
        "config": {
            "layout": "forca",
            "corPor": "instituto",
            "tamanhoPor": "grau",
            "tiposRelacao": ["coautoria"],
            "mostrarRotulos": False,
        },
    }


def test_primeira_consulta_cria_as_duas_visoes_em_arquivos(pasta_isolada):
    resposta = cliente.get("/api/visoes")
    assert resposta.status_code == 200
    nomes = [item["nome"] for item in resposta.json()]
    assert nomes == ["Colaboração entre institutos", "Pontes e centralidade"]
    arquivos = list(pasta_isolada.glob("*.json"))
    assert len(arquivos) == 2
    pontes = json.loads((pasta_isolada / "visao-pontes-centralidade.json").read_text(encoding="utf-8"))
    assert pontes["config"]["corPor"] == "comunidade"
    assert pontes["filtros"]["formulaPeso"] == "reimberg"


def test_lista_vazia_nao_recria_as_visoes_iniciais(pasta_isolada):
    (pasta_isolada / ".inicializado").write_text("ok\n", encoding="utf-8")
    resposta = cliente.get("/api/visoes")
    assert resposta.status_code == 200
    assert resposta.json() == []


def test_cria_atualiza_duplica_e_exclui_um_arquivo_por_visao(pasta_isolada):
    criada = cliente.post("/api/visoes", json=rascunho()).json()
    assert (pasta_isolada / f"{criada['id']}.json").is_file()
    assert criada["criadoEm"] == criada["atualizadoEm"]

    atualizada = cliente.put(f"/api/visoes/{criada['id']}", json=rascunho("Depois")).json()
    assert atualizada["id"] == criada["id"]
    assert atualizada["criadoEm"] == criada["criadoEm"]
    assert atualizada["nome"] == "Depois"
    gravada = json.loads((pasta_isolada / f"{criada['id']}.json").read_text(encoding="utf-8"))
    assert gravada["nome"] == "Depois"

    copia = cliente.post(f"/api/visoes/{criada['id']}/duplicar").json()
    assert copia["nome"] == "Depois (cópia)"
    assert copia["id"] != criada["id"]
    assert (pasta_isolada / f"{copia['id']}.json").is_file()

    assert cliente.delete(f"/api/visoes/{copia['id']}").status_code == 204
    assert not (pasta_isolada / f"{copia['id']}.json").exists()
    assert cliente.get(f"/api/visoes/{copia['id']}").status_code == 404


def test_preserva_visao_antiga_sem_formula(pasta_isolada):
    (pasta_isolada / ".inicializado").write_text("ok\n", encoding="utf-8")
    corpo = rascunho()
    del corpo["filtros"]["formulaPeso"]
    criada = cliente.post("/api/visoes", json=corpo)
    assert criada.status_code == 201
    assert "formulaPeso" not in criada.json()["filtros"]


def test_recusa_visao_invalida_sem_gravar_arquivo(pasta_isolada):
    (pasta_isolada / ".inicializado").write_text("ok\n", encoding="utf-8")
    resposta = cliente.post("/api/visoes", json=rascunho("x"))
    assert resposta.status_code == 400
    assert resposta.json()["detail"]
    assert list(pasta_isolada.glob("*.json")) == []


def test_ignora_arquivo_ilegivel_e_mantem_o_valido(pasta_isolada):
    (pasta_isolada / ".inicializado").write_text("ok\n", encoding="utf-8")
    criada = cliente.post("/api/visoes", json=rascunho()).json()
    (pasta_isolada / "quebrada.json").write_text("{não é json", encoding="utf-8")
    resposta = cliente.get("/api/visoes")
    assert [item["id"] for item in resposta.json()] == [criada["id"]]
    assert (pasta_isolada / "quebrada.json").is_file()


def test_importa_com_o_mesmo_id_e_nao_duplica(pasta_isolada):
    (pasta_isolada / ".inicializado").write_text("ok\n", encoding="utf-8")
    corpo = {**rascunho("Comuidades"), "id": "visao-do-grupo", "criadoEm": "2026-11-01T00:00:00.000Z"}
    primeira = cliente.post("/api/visoes/importar", json=corpo).json()
    segunda = cliente.post("/api/visoes/importar", json=corpo).json()
    assert primeira["id"] == "visao-do-grupo"
    assert primeira["nome"] == "Comunidades"
    assert primeira["criadoEm"] == "2026-11-01T00:00:00.000Z"
    assert segunda["id"] == primeira["id"]
    assert len(list(pasta_isolada.glob("*.json"))) == 1
    assert json.loads((pasta_isolada / "visao-do-grupo.json").read_text(encoding="utf-8"))["nome"] == "Comunidades"


def test_recusa_id_que_escapa_da_pasta(pasta_isolada):
    with pytest.raises(VisaoInvalida):
        importar({**rascunho(), "id": "../fora"}, pasta_isolada)
    assert not (pasta_isolada.parent / "fora.json").exists()
