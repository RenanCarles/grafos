"""Uma visão por arquivo JSON em dados/visoes.

A pasta nasce na primeira consulta. Vazia e ainda não iniciada, recebe as duas
visões iniciais. Se a pessoa apagar os arquivos depois disso, a lista fica vazia:
coleção vazia não é falha da API. Arquivo ilegível é ignorado e permanece no disco.
"""
import json
import math
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Body, HTTPException, Response

from pipeline.config import VISOES

PASTA = VISOES
_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$")
_MARCADOR = ".inicializado"

router = APIRouter()


class VisaoInvalida(ValueError):
    pass


class VisaoNaoEncontrada(LookupError):
    pass


def agora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def listar(pasta: Path | None = None) -> list[dict]:
    pasta = _pasta(pasta)
    _garantir(pasta)
    visoes = []
    for caminho in pasta.glob("*.json"):
        visao = _ler(caminho)
        if visao is None:
            continue
        corrigida = _corrigir_nome(visao)
        if corrigida["nome"] != visao["nome"]:
            _gravar(pasta, corrigida)
        visoes.append(corrigida)
    visoes.sort(key=lambda item: (item["criadoEm"], item["id"]))
    return visoes


def obter(visao_id: str, pasta: Path | None = None) -> dict:
    pasta = _pasta(pasta)
    _garantir(pasta)
    return _exigir_existente(pasta, visao_id)


def criar(dados: dict, pasta: Path | None = None) -> dict:
    pasta = _pasta(pasta)
    _garantir(pasta)
    momento = agora()
    visao = _corrigir_nome({
        **_normalizar(dados),
        "id": str(uuid.uuid4()),
        "criadoEm": momento,
        "atualizadoEm": momento,
    })
    _gravar(pasta, visao)
    return visao


def atualizar(visao_id: str, dados: dict, pasta: Path | None = None) -> dict:
    pasta = _pasta(pasta)
    _garantir(pasta)
    atual = _exigir_existente(pasta, visao_id)
    visao = _corrigir_nome({
        **_normalizar(dados),
        "id": atual["id"],
        "criadoEm": atual["criadoEm"],
        "atualizadoEm": agora(),
    })
    _gravar(pasta, visao)
    return visao


def duplicar(visao_id: str, pasta: Path | None = None) -> dict:
    pasta = _pasta(pasta)
    _garantir(pasta)
    original = _exigir_existente(pasta, visao_id)
    momento = agora()
    copia = {
        **original,
        "id": str(uuid.uuid4()),
        "nome": _nome_copia(original["nome"]),
        "criadoEm": momento,
        "atualizadoEm": momento,
    }
    _gravar(pasta, copia)
    return copia


def excluir(visao_id: str, pasta: Path | None = None) -> None:
    pasta = _pasta(pasta)
    _garantir(pasta)
    caminho = _caminho(pasta, _exigir_id(visao_id))
    if not caminho.is_file():
        raise VisaoNaoEncontrada("Visão não encontrada.")
    caminho.unlink()


def importar(dados: dict, pasta: Path | None = None) -> dict:
    """Grava a visão com o id informado. Se o arquivo já existe, devolve o que está no disco."""
    pasta = _pasta(pasta)
    _garantir(pasta)
    if not isinstance(dados, dict):
        raise VisaoInvalida("Visão inválida.")
    visao_id = _exigir_id(dados.get("id"))
    caminho = _caminho(pasta, visao_id)
    existente = _ler(caminho)
    if existente is not None:
        return _persistir_correcao(pasta, existente)
    momento = agora()
    visao = _corrigir_nome({
        **_normalizar(dados),
        "id": visao_id,
        "criadoEm": _texto_opcional(dados.get("criadoEm")) or momento,
        "atualizadoEm": _texto_opcional(dados.get("atualizadoEm")) or momento,
    })
    _gravar(pasta, visao)
    return visao


def _pasta(pasta: Path | None) -> Path:
    return PASTA if pasta is None else pasta


def _garantir(pasta: Path) -> None:
    pasta.mkdir(parents=True, exist_ok=True)
    marcador = pasta / _MARCADOR
    if marcador.exists() or any(pasta.glob("*.json")):
        marcador.touch(exist_ok=True)
        return
    momento = agora()
    for visao in _iniciais(momento):
        _gravar(pasta, visao)
    marcador.write_text("ok\n", encoding="utf-8")


def _exigir_existente(pasta: Path, visao_id: str) -> dict:
    visao = _ler(_caminho(pasta, _exigir_id(visao_id)))
    if visao is None:
        raise VisaoNaoEncontrada("Visão não encontrada.")
    return _persistir_correcao(pasta, visao)


def _caminho(pasta: Path, visao_id: str) -> Path:
    caminho = (pasta / f"{visao_id}.json").resolve()
    if pasta.resolve() not in caminho.parents:
        raise VisaoInvalida("Identificador de visão inválido.")
    return caminho


def _gravar(pasta: Path, visao: dict) -> None:
    destino = _caminho(pasta, visao["id"])
    temporario = destino.with_suffix(".json.tmp")
    temporario.write_text(json.dumps(visao, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporario, destino)


def _ler(caminho: Path) -> dict | None:
    if not caminho.is_file():
        return None
    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(dados, dict):
        return None
    try:
        return {
            **_normalizar(dados),
            "id": _exigir_id(dados.get("id")),
            "criadoEm": _texto_opcional(dados.get("criadoEm")) or "",
            "atualizadoEm": _texto_opcional(dados.get("atualizadoEm")) or "",
        }
    except VisaoInvalida:
        return None


def _corrigir_nome(visao: dict) -> dict:
    if visao.get("nome") == "Comuidades":
        return {**visao, "nome": "Comunidades"}
    return visao


def _persistir_correcao(pasta: Path, visao: dict) -> dict:
    corrigida = _corrigir_nome(visao)
    if corrigida["nome"] != visao["nome"]:
        _gravar(pasta, corrigida)
    return corrigida


def _nome_copia(nome: str) -> str:
    sufixo = " (cópia)"
    if len(nome) + len(sufixo) <= 80:
        return f"{nome}{sufixo}"
    return f"{nome[: 80 - len(sufixo)].rstrip()}{sufixo}"


def _iniciais(momento: str) -> list[dict]:
    filtros = {
        "institutos": [],
        "areas": [],
        "anoInicio": 2021,
        "anoFim": 2025,
        "pesoMinimo": 0,
        "formulaPeso": "reimberg",
        "lambdaTemporal": 0.1,
        "anoReferencia": 2026,
    }
    rede = {
        "layout": "forca",
        "corPor": "instituto",
        "tamanhoPor": "grau",
        "tiposRelacao": ["coautoria"],
        "mostrarRotulos": False,
    }
    return [
        {
            "id": "visao-colaboracao-institutos",
            "nome": "Colaboração entre institutos",
            "descricao": "Rede de coautoria de 2021–2025, com cor por instituto.",
            "tipo": "rede",
            "filtros": dict(filtros),
            "config": dict(rede),
            "criadoEm": momento,
            "atualizadoEm": momento,
        },
        {
            "id": "visao-pontes-centralidade",
            "nome": "Pontes e centralidade",
            "descricao": "Comunidades de colaboração e pesquisadores com maior intermediação na rede completa.",
            "tipo": "rede",
            "filtros": dict(filtros),
            "config": {**rede, "corPor": "comunidade", "tamanhoPor": "intermediacao"},
            "criadoEm": momento,
            "atualizadoEm": momento,
        },
    ]


def _normalizar(dados: dict) -> dict:
    if not isinstance(dados, dict):
        raise VisaoInvalida("Visão inválida.")
    nome = _texto(dados.get("nome"), "O nome", 3, 80)
    descricao = _texto(dados.get("descricao", ""), "A descrição", 0, 280)
    tipo = dados.get("tipo")
    if tipo not in ("rede", "areas"):
        raise VisaoInvalida("Tipo de visão inválido.")
    return {
        "nome": nome,
        "descricao": descricao,
        "tipo": tipo,
        "filtros": _filtros(dados.get("filtros")),
        "config": _config_rede(dados.get("config")) if tipo == "rede" else _config_areas(dados.get("config")),
    }


def _filtros(dados: object) -> dict:
    if not isinstance(dados, dict):
        raise VisaoInvalida("Filtros inválidos.")
    inicio = _inteiro(dados.get("anoInicio"), "Ano inicial", 2021, 2025)
    fim = _inteiro(dados.get("anoFim"), "Ano final", 2021, 2025)
    if inicio > fim:
        raise VisaoInvalida("O ano inicial não pode ser maior que o ano final.")
    filtros = {
        "institutos": _lista_texto(dados.get("institutos"), "Instituto"),
        "areas": _lista_texto(dados.get("areas"), "Área"),
        "anoInicio": inicio,
        "anoFim": fim,
        "pesoMinimo": _peso(dados.get("pesoMinimo")),
    }
    if "formulaPeso" in dados:
        formula = dados["formulaPeso"]
        if formula not in ("reimberg", "zanoli"):
            raise VisaoInvalida("Fórmula de peso inválida.")
        filtros["formulaPeso"] = formula
    if "lambdaTemporal" in dados:
        filtros["lambdaTemporal"] = _lambda(dados["lambdaTemporal"])
    if "anoReferencia" in dados:
        filtros["anoReferencia"] = _inteiro(dados["anoReferencia"], "Ano de referência", 2025, 2100)
    return filtros


def _config_rede(dados: object) -> dict:
    if not isinstance(dados, dict):
        raise VisaoInvalida("Configuração da rede inválida.")
    layout = dados.get("layout")
    cor = dados.get("corPor")
    tamanho = dados.get("tamanhoPor")
    relacoes = dados.get("tiposRelacao")
    rotulos = dados.get("mostrarRotulos")
    if layout not in ("forca", "concentrico", "circulo"):
        raise VisaoInvalida("Layout inválido.")
    if cor not in ("instituto", "area", "comunidade"):
        raise VisaoInvalida("Cor inválida.")
    if tamanho not in ("grau", "intermediacao", "forca", "intermediacaoPonderada", "fixo"):
        raise VisaoInvalida("Tamanho inválido.")
    if not isinstance(rotulos, bool):
        raise VisaoInvalida("A opção de rótulos é inválida.")
    if not isinstance(relacoes, list) or not relacoes:
        raise VisaoInvalida("Informe ao menos um tipo de relação.")
    permitidas = ("coautoria", "orientacao", "projeto")
    if any(item not in permitidas for item in relacoes):
        raise VisaoInvalida("Tipo de relação inválido.")
    return {
        "layout": layout,
        "corPor": cor,
        "tamanhoPor": tamanho,
        "tiposRelacao": list(dict.fromkeys(relacoes)),
        "mostrarRotulos": rotulos,
    }


def _config_areas(dados: object) -> dict:
    if not isinstance(dados, dict):
        raise VisaoInvalida("Configuração de áreas inválida.")
    grafico = dados.get("grafico")
    agrupar = dados.get("agruparPor")
    if grafico not in ("barras", "treemap", "sunburst"):
        raise VisaoInvalida("Gráfico inválido.")
    if agrupar not in ("area", "instituto"):
        raise VisaoInvalida("Agrupamento inválido.")
    if not isinstance(dados.get("destacarAreasPonte"), bool):
        raise VisaoInvalida("A opção de áreas ponte é inválida.")
    return {
        "grafico": grafico,
        "agruparPor": agrupar,
        "topN": _inteiro(dados.get("topN"), "Quantidade", 3, 20),
        "destacarAreasPonte": dados["destacarAreasPonte"],
    }


def _exigir_id(valor: object) -> str:
    if not isinstance(valor, str) or _ID.fullmatch(valor) is None:
        raise VisaoInvalida("Identificador de visão inválido.")
    return valor


def _texto(valor: object, campo: str, minimo: int, maximo: int) -> str:
    if not isinstance(valor, str):
        raise VisaoInvalida(f"{campo} é inválido.")
    texto = valor.strip()
    if not minimo <= len(texto) <= maximo:
        raise VisaoInvalida(f"{campo} precisa ter entre {minimo} e {maximo} caracteres.")
    return texto


def _texto_opcional(valor: object) -> str:
    if not isinstance(valor, str):
        return ""
    return valor.strip()


def _inteiro(valor: object, campo: str, minimo: int, maximo: int) -> int:
    if isinstance(valor, bool) or not isinstance(valor, int) or not minimo <= valor <= maximo:
        raise VisaoInvalida(f"{campo} inválido.")
    return valor


def _peso(valor: object) -> int | float:
    if isinstance(valor, bool) or not isinstance(valor, (int, float)) or not math.isfinite(valor) or valor < 0:
        raise VisaoInvalida("Peso mínimo inválido.")
    return valor


def _lambda(valor: object) -> int | float:
    if isinstance(valor, bool) or not isinstance(valor, (int, float)) or not math.isfinite(valor) or not 0 <= valor <= 0.5:
        raise VisaoInvalida("λ inválido.")
    return valor


def _lista_texto(valor: object, campo: str) -> list[str]:
    if not isinstance(valor, list) or len(valor) > 100:
        raise VisaoInvalida(f"{campo} inválido.")
    if any(not isinstance(item, str) or not item.strip() or len(item) > 80 for item in valor):
        raise VisaoInvalida(f"{campo} inválido.")
    return valor


def _executar(operacao):
    try:
        return operacao()
    except VisaoInvalida as erro:
        raise HTTPException(400, str(erro)) from erro
    except VisaoNaoEncontrada as erro:
        raise HTTPException(404, str(erro)) from erro


@router.get("/api/visoes")
def get_visoes():
    return listar()


@router.post("/api/visoes/importar")
def post_importar(corpo: dict = Body(...)):
    return _executar(lambda: importar(corpo))


@router.get("/api/visoes/{visao_id}")
def get_visao(visao_id: str):
    return _executar(lambda: obter(visao_id))


@router.post("/api/visoes", status_code=201)
def post_visao(corpo: dict = Body(...)):
    return _executar(lambda: criar(corpo))


@router.put("/api/visoes/{visao_id}")
def put_visao(visao_id: str, corpo: dict = Body(...)):
    return _executar(lambda: atualizar(visao_id, corpo))


@router.post("/api/visoes/{visao_id}/duplicar", status_code=201)
def post_duplicar(visao_id: str):
    return _executar(lambda: duplicar(visao_id))


@router.delete("/api/visoes/{visao_id}", status_code=204)
def delete_visao(visao_id: str):
    _executar(lambda: excluir(visao_id))
    return Response(status_code=204)
