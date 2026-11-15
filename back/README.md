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
  "vizinhosFora": 4,              // só na resposta da API: parceiros de outro instituto
  "institutosDoGrupo": ["IMC", "IESTI", "ISEE"], // só na resposta da API: siglas do grupo de Louvain
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

## Integração com o frontend

O frontend já usa repositórios HTTP para catálogo, rede, áreas, metadados e visões. As consultas de rede e áreas
enviam `agregar=true`. O proxy de desenvolvimento encaminha `/api` à porta 8000.

### Visões em arquivo

`GET /api/visoes`, `POST /api/visoes`, `GET /api/visoes/{id}`, `PUT /api/visoes/{id}`, `POST /api/visoes/{id}/duplicar`
e `DELETE /api/visoes/{id}` guardam cada visão em `dados/visoes/{id}.json`. `POST /api/visoes/importar` grava uma visão
já existente com o mesmo id e, se o arquivo já estiver lá, devolve o conteúdo do disco. A primeira consulta cria a pasta
e as duas visões iniciais. Uma pasta já iniciada e sem JSON responde lista vazia. Arquivo ilegível fica no disco e sai da lista.

- Filtros padrão: 2021–2025 e peso mínimo 0, com suporte a frações e sem máximo fixo.
- Áreas permanecem vazias; a interface informa a limitação e desabilita filtro/cor por área.
- Apenas coautoria está disponível. Orientação e projeto ainda dependem da integração de fontes.
- As métricas dos nós são globais, calculadas em 2021–2025; o filtro não as recalcula.
- Cores institucionais vêm do catálogo. Comunidades além dos slots da paleta são agrupadas visualmente em “Outros”.

Veja [o guia de execução do frontend](../front/README.md) e o [documento Word](../docs/Guia_Integracao_Frontend.docx).

### Seleção da fórmula

`GET /api/rede`, `/api/areas` e `/api/meta` aceitam:

| Parâmetro | Padrão | Valores |
|---|---|---|
| `formulaPeso` | `reimberg` | `reimberg` ou `zanoli` |
| `lambdaTemporal` | `0.1` | 0 a 0,5, finito; aplicado a Zanoli |
| `anoReferencia` | `2026` | Inteiro de 2025 a 2100; aplicado a Zanoli |

Exemplo: `/api/rede?formulaPeso=zanoli&lambdaTemporal=0.1&anoReferencia=2026&agregar=true&pesoMinimo=0`.

Zanoli calcula **somente a produção** com raiz no denominador e decaimento temporal; orientações, bancas e projetos
não têm dados disponíveis. A resposta de rede inclui metadados com `idFormula`, parâmetros, componentes disponíveis/indisponíveis
e escopo das métricas. Cada nó da resposta traz `vizinhosFora` e `institutosDoGrupo`, calculados na rede
completa da fórmula antes dos filtros. `meta.leituraGrupos` compara as partições de Reimberg e Zanoli
sem devolver a segunda rede. Esses campos são acrescentados em memória; os JSON exportados não precisam
ser regenerados para exibi-los. Consulte [MODELAGEM.md](docs/MODELAGEM.md) para as equações completas propostas.

`api/modelos_peso.py` constrói redes alternativas em memória, com cache limitado a oito configurações Zanoli.
`pipeline/pesos.py` contém a função matemática e os parâmetros imutáveis. As publicações brutas são necessárias apenas para Zanoli;
Reimberg usa a rede processada original. Reinicie a API após trocar arquivos da coleta, para invalidar os caches.
Os endpoints de vizinhança e matriz de institutos permanecem nos dados exportados de referência Reimberg e não aceitam essa seleção.

## Igualdade com o esboço

`tests/test_igualdade.py` compara com `tests/referencia/` (saída dos scripts da 1ª versão):
mesmos 549 nós (grau, força, produções), mesmas 852 arestas (peso, nº e tipo das produções, inter-instituto),
mesma matriz entre institutos e mesmo grafo do IMC (74 nós). Tolerância 1e-4 nos pesos
(a referência foi gravada com 4 casas).
