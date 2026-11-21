# Mapa da Colaboração Científica — UNIFEI

Sistema para visualizar a rede de colaboração científica entre docentes da UNIFEI, construída a partir de
dados públicos do SIGAA (docentes) e do OpenAlex (coautorias, 2021–2025). O projeto é dividido em dois
serviços independentes:

- **`back/`** — pipeline de coleta/construção do grafo e uma API em FastAPI que serve os dados.
- **`front/`** — interface web em Angular que consome a API e exibe o grafo, gráficos e visões salvas.

Este README traz o passo a passo para colocar os dois serviços no ar a partir de um clone novo do
repositório. Para detalhes de cada parte (estrutura de pastas, endpoints, modelo de dados, fórmulas de
peso etc.), veja [`back/README.md`](back/README.md) e [`front/README.md`](front/README.md).

## Pré-requisitos

| Ferramenta | Versão usada neste guia | Observação |
|---|---|---|
| [Python](https://www.python.org/downloads/) | 3.11 | Qualquer 3.10+ deve funcionar |
| [Node.js](https://nodejs.org/) | 22.14 ou superior (linha 22) | Inclui o `npm` |
| [Git](https://git-scm.com/) | qualquer | Para clonar o repositório |

Os comandos abaixo são para **Windows** (PowerShell). Em Linux/macOS, troque `\.venv\Scripts\...` por
`.venv/bin/...` e `npm.cmd` por `npm`.

## 1. Clonar o repositório

```powershell
git clone https://github.com/RenanCarles/grafos
cd grafos
```

## 2. Rodar o backend (API)

Abra um terminal na raiz do repositório:

```powershell
cd back
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn api.app:app --reload --port 8000
```

Os dados já processados (`back/dados/processados/`) estão incluídos no repositório, então a API já sobe
pronta para uso. Deixe este terminal aberto — a API responde em `http://localhost:8000`
(documentação interativa em `http://localhost:8000/docs`).

> Só é necessário reconstruir os dados a partir dos brutos (`.\.venv\Scripts\python.exe -m pipeline`,
> com a API parada) se você alterar algo em `back/dados/brutos/` ou em `back/pipeline/`.

## 3. Rodar o frontend

Em um **segundo terminal**, também a partir da raiz do repositório:

```powershell
cd front
npm.cmd ci
npm.cmd start
```

Isso compila e inicia o Angular em modo desenvolvimento, com proxy configurado (`proxy.conf.json`) para
encaminhar `/api/**` ao backend na porta 8000.

## 4. Acessar o sistema

Abra o navegador em **http://localhost:4200**. Você deve ver a tela de "Visões" com a rede de colaboração
carregada a partir da API.

Para encerrar, pressione `Ctrl+C` em cada terminal. Não é necessário ativar o ambiente virtual do Python
manualmente — os comandos acima já chamam o Python de dentro do `.venv`.

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Tela de "Visões" mostra "Não foi possível conectar à API" | Backend não está rodando | Confirme que o terminal do `uvicorn` está ativo na porta 8000 |
| Erro HTTP 503 ao abrir o front | Faltam os JSON em `back/dados/processados/` | Rode `python -m pipeline` dentro de `back/` (com a API parada) |
| `npm.cmd` ou `npm.ps1` bloqueado no PowerShell | Política de execução do PowerShell | Use `npm.cmd` (já usado neste guia) em vez de `npm` |

## Testes

```powershell
# Dentro de back/, com o .venv já criado
.\.venv\Scripts\python.exe -m pytest tests -q

# Dentro de front/
npm.cmd test -- --watch=false
npm.cmd run build
```

## Estrutura do repositório

```text
grafos/
├── back/     # pipeline de dados + API FastAPI — veja back/README.md
└── front/    # aplicação Angular — veja front/README.md
```
