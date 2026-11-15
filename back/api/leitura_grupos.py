"""Leitura de colaboração entre institutos na rede completa de cada fórmula.

O recorte de instituto, ano ou peso mínimo acontece depois e não altera estes campos.
A comparação usa as duas partições apenas para o texto; a resposta continua com uma rede.
"""
from collections import Counter, defaultdict


def enriquecer_nos(rede: dict) -> dict:
    """Conta parceiros de outro instituto e lista as siglas do grupo de Louvain.

    Arestas repetidas do mesmo par em anos diferentes contam uma vez.
    `areaIds` não é preenchido: esta coleta não traz área de pesquisa.
    """
    instituto = {no["id"]: no["institutoId"] for no in rede["nos"]}
    vizinhos = defaultdict(set)
    for aresta in rede["arestas"]:
        origem, destino = aresta["origemId"], aresta["destinoId"]
        vizinhos[origem].add(destino)
        vizinhos[destino].add(origem)

    siglas_do_grupo = defaultdict(set)
    for no in rede["nos"]:
        siglas_do_grupo[no["comunidade"]].add(instituto[no["id"]].upper())
    listas = {comunidade: sorted(siglas) for comunidade, siglas in siglas_do_grupo.items()}

    for no in rede["nos"]:
        no["vizinhosFora"] = sum(
            1 for vizinho in vizinhos[no["id"]] if instituto[vizinho] != no["institutoId"]
        )
        no["institutosDoGrupo"] = list(listas[no["comunidade"]])
    return rede


def _por_comunidade(nos: list[dict]) -> dict[int, list[dict]]:
    grupos = defaultdict(list)
    for no in nos:
        grupos[no["comunidade"]].append(no)
    return grupos


def _resumo(nos: list[dict]) -> dict:
    grupos = _por_comunidade(nos)
    multi = [membros for membros in grupos.values() if len(membros) > 1]
    mistos = sum(1 for membros in multi if len({no["institutoId"] for no in membros}) > 1)
    return {
        "gruposComMaisDeUmaPessoa": len(multi),
        "gruposEntreInstitutos": mistos,
    }


def _instituto_modal(membros: list[dict]) -> str:
    contagem = Counter(no["institutoId"] for no in membros)
    return min(contagem, key=lambda instituto: (-contagem[instituto], instituto))


def _maior(grupos: dict[int, list[dict]]) -> list[dict]:
    return max(grupos.values(), key=lambda membros: (len(membros), -membros[0]["comunidade"]))


def _centrado_em(grupos: dict[int, list[dict]], instituto_id: str) -> list[dict] | None:
    candidatos = [
        membros
        for membros in grupos.values()
        if len(membros) > 1 and _instituto_modal(membros) == instituto_id
    ]
    if not candidatos:
        return None
    return max(candidatos, key=lambda membros: (len(membros), -membros[0]["comunidade"]))


def _permanecem_juntas(membros: list[dict], comunidade_de: dict[str, int]) -> int:
    contagem = Counter(comunidade_de[no["id"]] for no in membros)
    return contagem.most_common(1)[0][1]


def _texto(reimberg: dict, zanoli: dict, maior: int, juntas_maior: int, iepg: int | None, juntas_iepg: int) -> str:
    if (
        reimberg["gruposComMaisDeUmaPessoa"] == zanoli["gruposComMaisDeUmaPessoa"]
        and reimberg["gruposEntreInstitutos"] == zanoli["gruposEntreInstitutos"]
    ):
        n = reimberg["gruposComMaisDeUmaPessoa"]
        m = reimberg["gruposEntreInstitutos"]
        frases = [
            f"Reimberg e Zanoli têm, cada uma, {n} grupos com mais de uma pessoa; "
            f"{m} deles reúnem institutos diferentes."
        ]
    else:
        frases = [
            f"Reimberg tem {reimberg['gruposComMaisDeUmaPessoa']} grupos com mais de uma pessoa, "
            f"{reimberg['gruposEntreInstitutos']} deles entre institutos. "
            f"Zanoli tem {zanoli['gruposComMaisDeUmaPessoa']} grupos com mais de uma pessoa, "
            f"{zanoli['gruposEntreInstitutos']} deles entre institutos."
        ]
    frases.append(
        f"O maior grupo de Reimberg, com {maior} pessoas, mantém {juntas_maior} juntas sob Zanoli."
    )
    if iepg is not None:
        if juntas_iepg < iepg:
            frases.append(
                f"O grupo de {iepg} pessoas centrado no IEPG se divide, e só {juntas_iepg} permanecem juntas."
            )
        else:
            frases.append(f"O grupo de {iepg} pessoas centrado no IEPG permanece junto sob Zanoli.")
    return " ".join(frases)


def leitura_grupos(reimberg: dict, zanoli: dict) -> dict:
    """Compara as partições já calculadas. Não devolve a segunda rede."""
    resumo_reimberg = _resumo(reimberg["nos"])
    resumo_zanoli = _resumo(zanoli["nos"])
    grupos = _por_comunidade(reimberg["nos"])
    maior = _maior(grupos)
    iepg = _centrado_em(grupos, "iepg")
    comunidade_zanoli = {no["id"]: no["comunidade"] for no in zanoli["nos"]}
    juntas_maior = _permanecem_juntas(maior, comunidade_zanoli)
    juntas_iepg = _permanecem_juntas(iepg, comunidade_zanoli) if iepg is not None else 0
    pessoas_iepg = len(iepg) if iepg is not None else None
    return {
        "texto": _texto(resumo_reimberg, resumo_zanoli, len(maior), juntas_maior, pessoas_iepg, juntas_iepg),
        "reimberg": resumo_reimberg,
        "zanoli": resumo_zanoli,
        "maiorGrupoReimberg": {"pessoas": len(maior), "permanecemJuntas": juntas_maior},
        "grupoCentradoNoIepg": None
        if pessoas_iepg is None
        else {"pessoas": pessoas_iepg, "permanecemJuntas": juntas_iepg},
    }
