"""API HTTP que serve os dados processados no contrato do front.

Espelha front/src/app/core/repositorios.ts:
  CatalogoRepository.obterCatalogo()   -> GET /api/catalogo
  RedeRepository.obterRede(filtros)    -> GET /api/rede?institutos=&areas=&anoInicio=&anoFim=&pesoMinimo=
  AreasRepository.obterAreas(filtros)  -> GET /api/areas?<mesmos filtros>
A lógica de filtro é a mesma de front/src/app/data-access/mock/filtros-mock.ts.

Recursos adicionais:
  GET /api/institutos/{sigla}/vizinhanca  -> grafo focado no instituto (ex.: IMC)
  GET /api/matriz-institutos              -> peso total entre pares de institutos
  GET /api/meta                           -> fonte, fórmula, α, data de geração (usado pelo front)
  /api/visoes                             -> uma visão por arquivo JSON em dados/visoes

Rodar:  uvicorn api.app:app --reload --port 8000     (a partir da raiz do back)
"""
import json
from functools import lru_cache

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from pipeline.config import PROCESSADOS
from pipeline.pesos import FormulaPeso, ParametrosPeso
from .modelos_peso import obter_rede
from .visoes_arquivos import router as visoes_router


def parametros_peso(
    formulaPeso: FormulaPeso = Query("reimberg"),
    lambdaTemporal: float = Query(0.1, ge=0, le=0.5, allow_inf_nan=False),
    anoReferencia: int = Query(2026, ge=2025, le=2100),
) -> ParametrosPeso:
    return ParametrosPeso(formulaPeso, lambdaTemporal, anoReferencia)

app = FastAPI(title="Mapa da Colaboração Científica — UNIFEI", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # ng serve
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(visoes_router)


@lru_cache
def _carregar(nome: str) -> dict:
    caminho = PROCESSADOS / nome
    if not caminho.exists():
        raise HTTPException(503, f"{nome} não encontrado — rode `python -m pipeline` antes.")
    return json.loads(caminho.read_text(encoding="utf-8"))


def _lista(valor: str | None) -> list[str]:
    return [v for v in (valor or "").split(",") if v]


def _filtrar(institutos, areas, ano_inicio, ano_fim, peso_minimo, agregar, parametros):
    """Mesma semântica de aplicarFiltros() do front. Com agregar=true, soma os anos da janela por par
    e aplica pesoMinimo sobre a soma (recomendado: o peso por ano costuma ser < 1)."""
    rede = obter_rede(parametros)
    nos = [n for n in rede["nos"]
           if (not institutos or n["institutoId"] in institutos)
           and (not areas or any(a in areas for a in n["areaIds"]))]
    ids = {n["id"] for n in nos}
    na_janela = [e for e in rede["arestas"]
                 if e["origemId"] in ids and e["destinoId"] in ids and ano_inicio <= e["ano"] <= ano_fim]
    if not agregar:
        return nos, [e for e in na_janela if e["peso"] >= peso_minimo]

    pares: dict[tuple, dict] = {}
    for e in na_janela:
        k = (e["origemId"], e["destinoId"])
        if k not in pares:
            pares[k] = {**e, "porTipoProducao": dict(e["porTipoProducao"]), "anos": []}
        else:
            p = pares[k]
            p["peso"] += e["peso"]
            p["nProducoes"] += e["nProducoes"]
            p["ano"] = max(p["ano"], e["ano"])
            for t, v in e["porTipoProducao"].items():
                p["porTipoProducao"][t] += v
        pares[k]["anos"].append(e["ano"])
    arestas = []
    for p in pares.values():
        p["peso"] = round(p["peso"], 6)
        if p["peso"] >= peso_minimo:
            arestas.append(p)
    return nos, arestas


FILTROS = dict(
    institutos=Query(None, description="ids separados por vírgula (ex.: imc,iesti); vazio = todos"),
    areas=Query(None, description="ids de área separados por vírgula; vazio = todas"),
    anoInicio=Query(2021),
    anoFim=Query(2025),
    pesoMinimo=Query(0.0, ge=0),
    agregar=Query(False, description="true = uma aresta por par somando os anos da janela"),
)


@app.get("/api/meta")
def meta(parametros: ParametrosPeso = Depends(parametros_peso)):
    return obter_rede(parametros)["meta"]


@app.get("/api/catalogo")
def catalogo():
    return _carregar("catalogo.json")


@app.get("/api/rede")
def rede(institutos: str | None = FILTROS["institutos"], areas: str | None = FILTROS["areas"],
         anoInicio: int = FILTROS["anoInicio"], anoFim: int = FILTROS["anoFim"],
         pesoMinimo: float = FILTROS["pesoMinimo"], agregar: bool = FILTROS["agregar"],
         parametros: ParametrosPeso = Depends(parametros_peso)):
    nos, arestas = _filtrar(_lista(institutos), _lista(areas), anoInicio, anoFim, pesoMinimo, agregar, parametros)
    return {"nos": nos, "arestas": arestas, "meta": obter_rede(parametros)["meta"]}


@app.get("/api/areas")
def areas(institutos: str | None = FILTROS["institutos"], areas: str | None = FILTROS["areas"],
          anoInicio: int = FILTROS["anoInicio"], anoFim: int = FILTROS["anoFim"],
          pesoMinimo: float = FILTROS["pesoMinimo"], agregar: bool = FILTROS["agregar"],
          parametros: ParametrosPeso = Depends(parametros_peso)):
    """Mesma lógica de agregarAreas() do front. Áreas ainda vazias (virão do Lattes)."""
    nos, arestas = _filtrar(_lista(institutos), _lista(areas), anoInicio, anoFim, pesoMinimo, agregar, parametros)
    cat = _carregar("catalogo.json")
    inst_de = {n["id"]: n["institutoId"] for n in nos}
    pares = {tuple(sorted((inst_de[e["origemId"]], inst_de[e["destinoId"]]))) for e in arestas
             if inst_de[e["origemId"]] != inst_de[e["destinoId"]]}

    resumo_areas = []
    for area in cat["areas"]:
        membros = [n for n in nos if area["id"] in n["areaIds"]]
        por_inst: dict[str, int] = {}
        for m in membros:
            por_inst[m["institutoId"]] = por_inst.get(m["institutoId"], 0) + 1
        insts = list(por_inst)
        eh_ponte = any(tuple(sorted((insts[i], insts[j]))) not in pares
                       for i in range(len(insts)) for j in range(i + 1, len(insts)))
        ids = {m["id"] for m in membros}
        resumo_areas.append({
            "areaId": area["id"], "nome": area["nome"], "grandeArea": area["grandeArea"],
            "pesquisadores": len(membros),
            "colaboracoes": sum(1 for e in arestas if e["origemId"] in ids and e["destinoId"] in ids),
            "ehPonte": eh_ponte, "porInstituto": por_inst,
        })
    resumo_inst = [{"institutoId": i["id"], "sigla": i["sigla"], "nome": i["nome"],
                    "pesquisadores": sum(1 for n in nos if n["institutoId"] == i["id"])}
                   for i in cat["institutos"]]
    return {"areas": resumo_areas, "institutos": resumo_inst}


@app.get("/api/institutos/{sigla}/vizinhanca")
def vizinhanca(sigla: str):
    return _carregar(f"institutos/{sigla.upper()}.json")


@app.get("/api/matriz-institutos")
def matriz_institutos():
    return _carregar("matriz_institutos.json")
