# Entrega do back: o que está sendo passado

Este documento explica **o que entra nesta pasta**, **de onde vieram os dados**, **como o grafo foi montado** e
**o que falta** para o front consumir tudo. Para comandos e o formato detalhado dos arquivos, veja o
[README.md](README.md). A fórmula e as decisões de modelagem estão em [docs/MODELAGEM.md](docs/MODELAGEM.md).

---

## 1. Resumo em 30 segundos

- Montamos um **grafo de colaboração real** entre os **549 docentes da UNIFEI**.
- **Nós** = docentes (lista oficial do SIGAA), **coloridos pelo instituto**.
- **Arestas** = publicações em comum (OpenAlex, 2021–2025), com um **peso** que considera o tipo da produção
  e o número de autores.
- Tudo isso foi transformado em **arquivos JSON no formato que o front já usa** (`Catalogo`, `Rede`,
  `NoRede`, `Relacao`), com uma **API** pronta que espelha os repositórios do front.
- Há **testes** garantindo que os dados batem com o esboço que validamos.

> ⚠️ Os dados de publicações são **provisórios**. O OpenAlex substitui o Lattes até termos acesso aos XMLs.
> Quando o Lattes chegar, muda só a coleta. A fórmula, os formatos e a API continuam iguais.

---

## 2. De onde vieram os dados

| Dado | Fonte | Como foi obtido | Arquivo |
|---|---|---|---|
| Docentes e instituto de cada um | **SIGAA UNIFEI** (páginas públicas, sem login) | scraping da lista de docentes por instituto | `dados/brutos/docentes_unifei.csv` |
| Publicações | **OpenAlex** (base aberta, API oficial gratuita) | todas as publicações com afiliação UNIFEI, 2021–2025 | `dados/brutos/openalex_works_unifei.json` |

**Por que não o Lattes (ainda)?** O Extrator Lattes (API oficial do CNPq) só é liberado para a
**instituição**, com convênio, IP fixo e termo assinado. O site público do Lattes tem captcha e não pode ser
raspado em massa. O pedido precisa sair da PRPPG/DTI da UNIFEI. O SIGAA já fornece o **ID Lattes de 422 dos
549 docentes**, que é a lista a enviar quando o acesso for liberado.

**Números da coleta:**
- **549 docentes** em 12 unidades: ICPA 71 · IEM 59 · IFQ 59 · IRN 59 · IEPG 57 · IEI 53 · IMC 49 · ICT 46 ·
  IESTI 43 · ISEE 30 · IEDU 14 · Pouso Alegre 9.
- **4.472 publicações** no OpenAlex (2021–2025).

---

## 3. Como o grafo foi montado

```text
SIGAA (docentes) ──┐
                   ├─► casamento de nomes ─► arestas + pesos ─► métricas ─► JSON / CSV / HTML ─► API
OpenAlex (pubs) ───┘
```

1. **Docentes → nós.** Cada docente do SIGAA vira um nó. A cor é o instituto **do SIGAA**, e não o do Lattes,
   que é texto livre.
2. **Casamento de nomes.** O OpenAlex só tem o nome dos autores. Para cada autor afiliado à UNIFEI, o
   pipeline procura o docente correspondente:
   - nome idêntico, depois de normalizado (sem acentos e sem "de/da/dos"): **4.003** autorias;
   - nome parcial: mesmo primeiro nome, e os demais nomes ou iniciais presentes no nome do docente, com
     resultado único (ex.: "Paulo F. Ribeiro" → PAULO FERNANDO RIBEIRO): **739** autorias;
   - sem par (alunos, externos, aposentados): 5.770 autorias, ignoradas.
3. **Arestas.** Toda publicação com 2 ou mais docentes cria ou reforça a aresta entre cada par deles.
4. **Peso** (detalhes em [docs/MODELAGEM.md](docs/MODELAGEM.md)):

   ```
   w(i,j) = Σ  α(tipo) / (n − 1)        n = nº total de autores da produção
   ```

   | Tipo | α |
   |---|---|
   | Artigo em periódico, livro | 1,0 |
   | Trabalho em evento, capítulo | 0,7 |
   | Outros | 0,3 |

   - **Dividir por (n − 1)** é a normalização de Newman (2001): artigos com dezenas ou centenas de autores
     não dominam a rede.
   - **α** diferencia a força de cada tipo de produção.
5. **Métricas** por docente:
   - grau;
   - força (soma dos pesos);
   - intermediação, sem peso e ponderada;
   - comunidade (Louvain).
6. **Grafo por instituto.** Para cada instituto, um subgrafo com os docentes dele + os docentes de fora com
   ligação direta. As arestas são classificadas em `foco` (dentro), `ponte` (instituto ↔ fora) e `fora`
   (fora ↔ fora).

**Resultado:** 852 arestas; 343 dos 549 docentes colaboram com pelo menos um colega. **34% do peso** liga
institutos diferentes.

---

## 4. O que está nesta pasta

| Pasta / arquivo | O que é |
|---|---|
| `pipeline/` | código que gera tudo (`python -m pipeline`) |
| `pipeline/config.py` | **parâmetros do modelo** (α, anos, cores): mexa aqui para testar variações |
| `api/app.py` | API FastAPI no contrato do front |
| `dados/brutos/` | dados coletados (SIGAA + OpenAlex) |
| `dados/processados/` | **o que o front consome** (gerado pelo pipeline) |
| `dados/processados/html/` | grafos interativos: abrir no navegador (`grafo_geral.html`, `instituto_IMC.html`…) |
| `dados/processados/csv/` | nós e arestas para Gephi/planilha |
| `tests/` | testes de igualdade com o esboço + testes da API |
| `docs/MODELAGEM.md` | fórmula, métricas, decisões e limitações |
| `README.md` | como rodar + formato de cada arquivo |

### Arquivos para o front (`dados/processados/`)

| Arquivo | Para quê | Tipo no front |
|---|---|---|
| `catalogo.json` | institutos (id, sigla, nome, cor, nº docentes) | `Catalogo` |
| `rede.json` | rede com uma relação **por par e por ano** (para o filtro de anos) | `Rede` |
| `rede_agregada.json` | rede com uma aresta por par (todos os anos somados) | `Rede` |
| `institutos/<SIGLA>.json` | grafo focado em um instituto (ex.: IMC) | novo |
| `matriz_institutos.json` | peso total entre cada par de institutos | novo |

### API (substitui os mocks do front)

| Repositório do front | Endpoint |
|---|---|
| `CatalogoRepository` | `GET /api/catalogo` |
| `RedeRepository` | `GET /api/rede?institutos=&anoInicio=&anoFim=&pesoMinimo=&agregar=` |
| `AreasRepository` | `GET /api/areas?<mesmos filtros>` |
| (novo) | `GET /api/institutos/{sigla}/vizinhanca` · `GET /api/matriz-institutos` · `GET /api/meta` |

Os filtros seguem a mesma lógica do mock (`front/src/app/data-access/mock/filtros-mock.ts`).
Documentação interativa: `http://localhost:8000/docs`.

---

## 5. Como rodar

```bash
cd back
pip install -r requirements.txt
python -m pipeline                          # gera dados/processados/ a partir dos brutos
python -m pytest tests -q                   # 12 testes: igualdade com o esboço + API
uvicorn api.app:app --reload --port 8000    # sobe a API
```

Para coletar tudo de novo (SIGAA + OpenAlex): `python -m pipeline --coletar`.

---

## 6. ⚠️ O que o front precisa ajustar (nada foi alterado no front)

1. **`pesoMinimo`.** O formulário aceita 1 a 6, e o padrão é 1, porque os pesos do mock são inteiros. Os
   pesos reais são frações: **só 93 das 852 arestas têm peso ≥ 1** (mediana 0,3). Com o padrão atual, 89% da
   rede some. **Sugestão:** padrão 0, passo 0,1, sem máximo fixo.
2. **Anos.** O front começa em 2018; os dados vão de **2021 a 2025**.
3. **Áreas de pesquisa.** Ainda estão vazias (`catalogo.areas = []`, `areaIds = []`); virão do Lattes. A
   visão de áreas fica vazia, e "cor por área" não tem efeito.
4. **Comunidades.** São 231: 25 com 2 ou mais docentes e 206 unitárias (docentes sem aresta). Sugestão:
   cinza para as unitárias.
5. **Ligar na API.** Criar versões HTTP dos 3 repositórios e trocar em `provideDados()`. A CORS já está
   liberada para `http://localhost:4200`.
6. **Nomes** vêm como no SIGAA (MAIÚSCULAS). A formatação fica a cargo do front.

---

## 7. Limitações (para a discussão crítica do trabalho)

- **Casamento por nome:** pode confundir alunos homônimos de docentes. Com o Lattes, a ligação passa a ser
  por ID.
- **Só publicações indexadas:** faltam orientações, projetos, bancas e muitos eventos nacionais. Por isso,
  hoje só existe o tipo de relação `coautoria`.
- **Docentes fora do SIGAA** (aposentados, colaboradores) não entram. Ex.: Bonatto, Zambroni e Tiago Filho
  (ISEE) têm muitas publicações e ficaram de fora, o que deixa o ISEE mais fraco do que é.
- **Valores de α** são escolha do grupo. A validação proposta é comparar rankings com e sem α (análise de
  sensibilidade).

---

## 8. Próximos passos

- [ ] Pedir à PRPPG/DTI acesso ao Extrator Lattes (lista de IDs: coluna `lattes_id` de `docentes_unifei.csv`).
- [ ] Trocar a fonte das arestas para o Lattes (ligação por ID), adicionando relações `orientacao` e `projeto`.
- [ ] Preencher áreas do conhecimento (`catalogo.areas`, `areaIds`).
- [ ] Front: repositórios HTTP + ajustes da seção 6.
- [ ] Análise de sensibilidade dos α.

---

## 9. Observações sobre privacidade

- No JSON que vai para o front, o **id do docente é um hash do SIAPE**, e o SIAPE não aparece.
- O SIAPE aparece em `dados/brutos/docentes_unifei.csv` e em `tests/referencia/`. Ele é público nas páginas
  do SIGAA, mas vale considerar antes de deixar o repositório público.
- `dados/brutos/openalex_works_unifei.json` tem **~25 MB**. Se o grupo preferir não versioná-lo, há uma linha
  pronta no `.gitignore` (dá para baixar de novo com `--coletar`).
