"""Coleta: publicações da UNIFEI na API aberta do OpenAlex (substituto temporário do Lattes)."""
import json
import urllib.parse
import urllib.request

from .config import ANOS, OPENALEX_JSON, UNIFEI_OPENALEX

SELECT = "id,doi,title,type,publication_year,authorships,primary_location"


def coletar(destino=OPENALEX_JSON) -> list[dict]:
    # paginação por page= (cursor= exige API key; page= vai até 10.000 resultados)
    works, page = [], 1
    while True:
        q = urllib.parse.urlencode({
            "filter": f"institutions.id:{UNIFEI_OPENALEX},publication_year:{ANOS}",
            "per_page": 200, "page": page, "select": SELECT,
        }, safe=":,")
        req = urllib.request.Request(f"https://api.openalex.org/works?{q}",
                                     headers={"User-Agent": "curl/8.0 (trabalho academico UNIFEI)"})
        with urllib.request.urlopen(req, timeout=120) as r:
            d = json.load(r)
        works += d["results"]
        print(f"  baixados {len(works)}/{d['meta']['count']}")
        if not d["results"] or len(works) >= d["meta"]["count"]:
            break
        page += 1
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(works, ensure_ascii=False), encoding="utf-8")
    return works


def carregar(origem=OPENALEX_JSON) -> list[dict]:
    return json.loads(origem.read_text(encoding="utf-8"))


def tipo_producao(w: dict) -> str:
    """Classifica a produção nas chaves de ALPHA."""
    t = w.get("type")
    src = ((w.get("primary_location") or {}).get("source") or {}).get("type")
    if t in ("article", "review"):
        return "evento_completo" if src == "conference" else "artigo_periodico"
    if t == "book":
        return "livro"
    if t == "book-chapter":
        return "evento_completo" if src == "conference" else "capitulo"
    return "outro"


def eh_unifei(autoria: dict) -> bool:
    return any((i.get("id") or "").endswith(UNIFEI_OPENALEX) for i in autoria.get("institutions", []))
