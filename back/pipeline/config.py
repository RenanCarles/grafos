"""Parâmetros do pipeline. Alterar aqui muda os dados gerados — rode os testes depois."""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DADOS = RAIZ / "dados"
BRUTOS = DADOS / "brutos"
PROCESSADOS = DADOS / "processados"

DOCENTES_CSV = BRUTOS / "docentes_unifei.csv"
OPENALEX_JSON = BRUTOS / "openalex_works_unifei.json"

# ---- fontes
SIGAA_PUBLICO = "https://sigaa.unifei.edu.br/sigaa/public"
UNIFEI_OPENALEX = "I8165072"          # id da UNIFEI no OpenAlex
ANOS = "2021-2025"                    # janela de publicações

# ---- fórmula do peso:  w_ij = Σ_p α(tipo_p) / (n_p − 1)
ALPHA = {
    "artigo_periodico": 1.0,
    "livro": 1.0,
    "evento_completo": 0.7,
    "capitulo": 0.7,
    "outro": 0.3,
}

# ---- métricas
SEMENTE_LOUVAIN = 42

# ---- visualização
CORES = {
    "ICPA": "#4e79a7", "ICT": "#f28e2b", "IEDU": "#e15759", "IEPG": "#76b7b2", "IESTI": "#59a14f",
    "IEM": "#edc948", "IEI": "#b07aa1", "IFQ": "#ff9da7", "IMC": "#9c755f", "IRN": "#bcbd22",
    "ISEE": "#d62728", "PA": "#17becf",
}
