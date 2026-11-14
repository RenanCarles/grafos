"""Casamento de nomes de autores (OpenAlex) com docentes (SIGAA). Heurístico — só até termos IDs do Lattes."""
import re
import unicodedata

PARTICULAS = {"DE", "DA", "DO", "DOS", "DAS", "E", "D", "DI", "DEL", "VAN", "VON"}
SUFIXOS = {"FILHO", "JUNIOR", "JR", "NETO", "SOBRINHO"}


def tokens(nome: str) -> list[str]:
    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().upper()
    s = re.sub(r"[^A-Z ]", " ", s)
    return [t for t in s.split() if t not in PARTICULAS]


class Casador:
    """1) nome normalizado idêntico; 2) mesmo primeiro nome e todo nome/inicial restante presente no
    docente (qualquer ordem, ao menos um sobrenome por extenso), com candidato único."""

    def __init__(self, docentes: list[dict]):
        self.por_chave = {}
        self.docentes = []
        for d in docentes:
            tk = tokens(d["nome"])
            self.docentes.append((d, [t for t in tk if t not in SUFIXOS]))
            self.por_chave[" ".join(tk)] = d

    def casar(self, nome: str):
        tk_full = tokens(nome)
        if (d := self.por_chave.get(" ".join(tk_full))):
            return d, "exato"
        tk = [t for t in tk_full if t not in SUFIXOS]
        if len(tk) < 2:
            return None, None
        cands = [d for d, dt in self.docentes if dt[0] == tk[0] and self._contido(tk[1:], dt[1:])]
        if len(cands) == 1:
            return cands[0], "parcial"
        return None, None

    @staticmethod
    def _contido(parte, todo):
        if not any(len(t) > 1 for t in parte):
            return False
        livres = list(todo)
        for t in sorted(parte, key=len, reverse=True):  # nomes por extenso antes das iniciais
            for i, u in enumerate(livres):
                if u == t or (len(t) == 1 and u[0] == t):
                    del livres[i]
                    break
            else:
                return False
        return True
