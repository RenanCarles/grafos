"""Modelos propostos pelo grupo; nomes Reimberg/Zanoli identificam as alternativas.

As constantes seguem o HTML comparativo fornecido, não uma calibração empírica.
Somente produção possui dados reais disponíveis no pipeline atual.
"""
from dataclasses import dataclass
from math import exp, isfinite, sqrt
from typing import Literal

from .config import ALPHA

FormulaPeso = Literal["reimberg", "zanoli"]


@dataclass(frozen=True)
class ParametrosPeso:
    formula: FormulaPeso = "reimberg"
    lambda_temporal: float = 0.1
    ano_referencia: int = 2026


def peso_producao(tipo: str, autores: int, ano: int, parametros: ParametrosPeso) -> float:
    if autores < 2:
        raise ValueError("Uma relação de coautoria requer ao menos dois autores.")
    if parametros.formula == "reimberg":
        return ALPHA[tipo] / (autores - 1)
    if parametros.formula != "zanoli":
        raise ValueError("Fórmula de peso desconhecida.")
    if not isfinite(parametros.lambda_temporal) or parametros.lambda_temporal < 0:
        raise ValueError("Lambda deve ser finito e não negativo.")
    if ano > parametros.ano_referencia:
        raise ValueError("O ano da produção não pode superar o ano de referência.")
    return ALPHA[tipo] * exp(-parametros.lambda_temporal * (parametros.ano_referencia - ano)) / sqrt(autores - 1)
