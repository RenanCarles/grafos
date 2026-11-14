"""Coleta: lista pública de docentes da UNIFEI por instituto (SIGAA, sem login)."""
import csv
import html
import re
import time
import urllib.request

from .config import DOCENTES_CSV, SIGAA_PUBLICO

UA = {"User-Agent": "Mozilla/5.0 (trabalho academico UNIFEI - grafos)"}

BLOCO = re.compile(
    r'<span class="nome">(?P<nome>.*?)</span>.*?'
    r'(?:<span class="enderecoLattes">.*?href="(?P<lattes>[^"]*)".*?)?'
    r'portal\.jsf\?siape=(?P<siape>\d+)',
    re.S,
)


def _get(url: str) -> str:
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read().decode("utf-8", errors="replace")


def _limpa(s: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def listar_unidades() -> list[tuple[str, str, str]]:
    """[(id_unidade, sigla, nome)] dos institutos/campi."""
    s = _get(f"{SIGAA_PUBLICO}/centro/lista.jsf")
    unidades, atual = [], None
    for m in re.finditer(r'class="nomeCentro">(.*?)</a>|departamento/portal\.jsf\?id=(\d+)', s, re.S):
        if m.group(1):
            atual = _limpa(m.group(1))
        elif atual:
            nome, _, sigla = atual.rpartition(" - ")
            unidades.append((m.group(2), sigla.strip(), nome.strip()))
            atual = None
    return unidades


def docentes_da_unidade(uid: str):
    s = _get(f"{SIGAA_PUBLICO}/departamento/professores.jsf?id={uid}")
    partes = re.split(r"<h2[^>]*>(.*?)</h2>", s, flags=re.S)  # títulos = categoria funcional
    categoria = ""
    for i, parte in enumerate(partes):
        if i % 2 == 1:
            categoria = _limpa(parte)
            continue
        for m in BLOCO.finditer(parte):
            bruto = _limpa(m.group("nome"))
            t = re.search(r"\(([^)]*)\)\s*$", bruto)
            lattes = (m.group("lattes") or "").strip()
            lid = re.search(r"(\d{16})", lattes)
            yield {
                "categoria": categoria,
                "nome": bruto[: t.start()].strip() if t else bruto,
                "titulacao": t.group(1) if t else "",
                "lattes_id": lid.group(1) if lid else "",
                "lattes_url": lattes,
                "siape": m.group("siape"),
                "sigaa_url": f"{SIGAA_PUBLICO}/docente/portal.jsf?siape={m.group('siape')}",
            }


def coletar(destino=DOCENTES_CSV) -> list[dict]:
    linhas = []
    for uid, sigla, nome in listar_unidades():
        docs = list(docentes_da_unidade(uid))
        print(f"  {sigla:15} {len(docs):4} docentes")
        linhas += [{"instituto_sigla": sigla, "instituto_nome": nome, "unidade_id": uid, **d} for d in docs]
        time.sleep(1)
    destino.parent.mkdir(parents=True, exist_ok=True)
    with destino.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(linhas[0].keys()))
        w.writeheader()
        w.writerows(linhas)
    return linhas


def carregar(origem=DOCENTES_CSV) -> list[dict]:
    return list(csv.DictReader(origem.open(encoding="utf-8-sig")))
