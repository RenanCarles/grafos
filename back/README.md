# Back — Mapa da Colaboração Científica da UNIFEI

Pipeline que **coleta**, **constrói** e **exporta** o grafo de colaboração entre docentes da UNIFEI, e uma
**API** que serve esses dados no formato que o front (`front/`) já espera.

> ⚠️ **Fonte provisória.** As arestas vêm do **OpenAlex** (publicações indexadas, 2021–2025), com casamento de
> autores por **nome**. Quando chegarem os XMLs do Lattes, só a etapa de coleta/casamento muda; o resto
> (fórmula, métricas, formatos, API) continua igual.

---

## Como rodar

```bash
pip install -r requirements.txt

python -m pipeline              # processa os dados brutos já incluídos → dados/processados/
python -m pipeline --coletar    # (opcional) baixa de novo do SIGAA e do OpenAlex antes
python -m pytest tests -q       # confere igualdade com o esboço + API

uvicorn api.app:app --reload --port 8000    # API em http://localhost:8000  (docs: /docs)
```

## Estrutura

```text
back/
├── pipeline/                 # python -m pipeline
│   ├── config.py             # α, janela de anos, ids, cores  ← parâmetros do modelo
│   ├── sigaa.py              # coleta: docentes por instituto (páginas públicas do SIGAA)
│   ├── openalex.py           # coleta: publicações da UNIFEI (API OpenAlex) + tipo da produção
│   ├── casamento.py          # nome do autor (OpenAlex) → docente (SIGAA)
│   ├── construcao.py         # arestas e pesos (agregado e por ano)
│   ├── metricas.py           # grau, força, intermediação, comunidades (Louvain)
│   ├── vizinhanca.py         # grafo focado em um instituto (ex.: IMC)
│   ├── exportar.py           # JSON (contrato do front) + CSV
│   └── visualizacao/         # HTMLs interativos (vis-network embutido)
├── api/app.py                # FastAPI — espelha os repositórios do front
├── dados/
│   ├── brutos/               # docentes_unifei.csv (SIGAA) · openalex_works_unifei.json
│   └── processados/          # gerado pelo pipeline (ver abaixo)
├── tests/
│   ├── referencia/           # snapshot do esboço original (base da comparação)
│   ├── test_igualdade.py     # dados novos == esboço
│   └── test_api.py
└── docs/MODELAGEM.md         # fórmula do peso, decisões e limitações
```

## Modelo (resumo — detalhes em [docs/MODELAGEM.md](docs/MODELAGEM.md))

- **Nós:** 549 docentes do SIGAA. **Cor:** instituto (SIGAA).
- **Aresta:** dois docentes com ≥ 1 produção em comum.
- **Peso:** `w_ij = Σ_p α(tipo_p) / (n_p − 1)` — `n_p` = nº total de autores; α: periódico/livro 1,0 ·
  evento/capítulo 0,7 · outros 0,3.

## Dados gerados (`dados/processados/`)

| Arquivo | Conteúdo | Contrato do front |
|---|---|---|
| `catalogo.json` | institutos (`id`, `sigla`, `nome`, `cor`, `docentes`) e áreas (vazio por ora) | `Catalogo` |
| `rede.json` | nós + relações **por par e por ano** (o front filtra por ano) | `Rede` (`NoRede[]`, `Relacao[]`) |
| `rede_agregada.json` | nós + **uma aresta por par** (todos os anos somados) — é o grafo do esboço | `Rede` |
| `institutos/<SIGLA>.json` | grafo focado no instituto: docentes + vizinhos diretos, arestas com `classe` (`foco`, `ponte`, `fora`) e `resumo` | — (novo) |
| `matriz_institutos.json` | peso total entre cada par de institutos | — (novo) |
| `csv/` | `nos.csv`, `arestas.csv`, `matriz_institutos.csv` (Gephi/planilha) | — |
| `html/` | `grafo_geral.html` + `instituto_<SIGLA>.html` (abrir no navegador) | — |

### Nó (`NoRede` + extras)

```jsonc
{
  "id": "doc-1a2b3c4d5e",        // hash do SIAPE (o SIAPE não vai para o front)
  "nome": "ADLER DINIZ DE SOUZA", // como no SIGAA (maiúsculas)
  "institutoId": "imc",           // = catalogo.institutos[].id
  "areaIds": [],                  // vazio até termos áreas do Lattes
  "grau": 9,
  "intermediacao": 0.012,         // Brandes sem peso, normalizada [0,1] — mesma definição do mock do front
  "comunidade": 3,                // Louvain ponderado; 0 = maior comunidade; inteiro ≥ 0
  // extras
  "forca": 4.21,                  // soma dos pesos
  "intermediacaoPonderada": 0.01, // Brandes com distância = 1/peso
  "producoes": 37,                // produções no OpenAlex
  "categoria": "Ativo Permanente", "titulacao": "DOUTOR", "lattesId": "1234567890123456"
}
```

### Relação (`Relacao` + extras)

```jsonc
{
  "origemId": "doc-…", "destinoId": "doc-…",
  "tipo": "coautoria",            // por enquanto só coautoria; orientacao/projeto virão do Lattes
  "peso": 0.5,
  "ano": 2023,
  "nProducoes": 1,
  "porTipoProducao": { "artigo_periodico": 1, "livro": 0, "evento_completo": 0, "capitulo": 0, "outro": 0 }
}
```

Na `rede.json` há uma relação por **par × ano**; somando os anos de um par obtém-se exatamente o peso da
`rede_agregada.json` (coberto por teste).

## API

| Método do front (`core/repositorios.ts`) | Endpoint |
|---|---|
| `CatalogoRepository.obterCatalogo()` | `GET /api/catalogo` |
| `RedeRepository.obterRede(filtros)` | `GET /api/rede?institutos=imc,iesti&areas=&anoInicio=2021&anoFim=2025&pesoMinimo=0&agregar=false` |
| `AreasRepository.obterAreas(filtros)` | `GET /api/areas?<mesmos filtros>` |
| — | `GET /api/institutos/{sigla}/vizinhanca` |
| — | `GET /api/matriz-institutos` |
| — | `GET /api/meta` |

Os filtros reproduzem `aplicarFiltros()`/`agregarAreas()` de `front/src/app/data-access/mock/filtros-mock.ts`.
`agregar=true` soma os anos da janela por par **antes** de aplicar `pesoMinimo` (recomendado).
CORS liberado para `http://localhost:4200`.

## ⚠️ Pontos de integração com o front (não alterados aqui)

1. **`pesoMinimo`**: o formulário do front valida `min 1, max 6` e o padrão é `1` (pesos inteiros do mock).
   Os pesos reais são fracionários — **só 93 das 852 arestas têm peso ≥ 1** (mediana 0,3). Sugestão: padrão
   `0`, passo `0.1`, sem máximo fixo.
2. **Anos**: o front usa `ANO_MIN = 2018`; os dados cobrem **2021–2025**.
3. **Áreas**: `catalogo.areas` e `areaIds` estão vazios (o OpenAlex não foi usado para isso; virão do Lattes).
   A visão de áreas vai aparecer vazia, e `corPor: 'area'` não terá efeito.
4. **Comunidades**: 231 no total — 25 com 2+ docentes e 206 unitárias (docentes sem aresta). A paleta do front
   precisa lidar com índices altos (ex.: cinza para comunidades unitárias).
5. **Repositórios HTTP**: hoje `provideDados()` usa os mocks; basta criar implementações HTTP dos 3
   repositórios apontando para os endpoints acima.

## Igualdade com o esboço

`tests/test_igualdade.py` compara com `tests/referencia/` (saída dos scripts da 1ª versão):
mesmos 549 nós (grau, força, produções), mesmas 852 arestas (peso, nº e tipo das produções, inter-instituto),
mesma matriz entre institutos e mesmo grafo do IMC (74 nós). Tolerância 1e-4 nos pesos
(a referência foi gravada com 4 casas).
