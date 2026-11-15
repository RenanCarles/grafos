# Mapa da colaboração científica da UNIFEI — Frontend

Interface Angular para explorar os dados reais servidos por `back/`: docentes do SIGAA e coautorias do OpenAlex, 2021–2025.
Na coleta atual há 549 docentes, 12 unidades e 852 pares de coautoria. Áreas, orientações e projetos ainda não estão integrados.

## Executar no Windows

Requisitos: Node 22.14 ou superior da linha 22 e Python com suporte às dependências de `back/requirements.txt`.
Abra dois terminais a partir da raiz do repositório. Os comandos usam `npm.cmd` para funcionar mesmo quando o PowerShell bloqueia `npm.ps1`.

Terminal 1 — backend:

```powershell
cd back
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn api.app:app --reload --port 8000
```

Os dados processados já estão no repositório. Para reconstruí-los a partir dos brutos incluídos, com a API parada:

```powershell
.\.venv\Scripts\python.exe -m pipeline
```

Terminal 2 — frontend:

```powershell
cd front
node --version
npm.cmd ci
npm.cmd start
```

Abra http://localhost:4200. Documentação da API: http://localhost:8000/docs.
Encerre cada serviço com Ctrl+C. Não é necessário ativar o ambiente virtual.

## Usar a aplicação

- Abra “Colaboração entre institutos” para ver a coleta completa. Sem filtros: 549 pesquisadores e 852 pares.
- Clique em um vértice, ou numa linha da tabela, para ver quem é: instituto, métricas e o grupo. Passe o mouse para ver nome, instituto e grupo. Use “Tabela” para uma leitura tabular. O clique no cabeçalho ordena; Força, em ordem decrescente, mostra quem concentra peso na rede completa.
- Em Comunidades, clique num grupo para ver quantas pessoas ele reúne neste recorte, os institutos da rede completa e o que o agrupamento representa: Louvain sobre a coautoria de 2021–2025, não um instituto nem uma área de pesquisa. A legenda também destaca o instituto ou a comunidade correspondente. O clique esmaece o restante do grafo.
- Edite ou crie uma visão para escolher institutos, período, peso mínimo, layout, cores e tamanho dos nós.
- Peso mínimo começa em zero e aceita frações. O corte se aplica à soma dos anos selecionados; peso 1 mantém 115 pares na coleta atual.
- No editor, escolha a **Fórmula do peso**: Reimberg (padrão) ou Zanoli. Para Zanoli, informe λ (0 a 0,5; padrão 0,1) e ano de referência (2025 a 2100; padrão 2026).
- Zanoli representa **somente W_prod** nesta coleta. Orientação, banca e projeto são desconhecidos, não zeros observados. Abra “Entender as fórmulas de Reimberg e Zanoli” para consultar todos os componentes propostos.
- As fórmulas têm escalas diferentes: comece a comparação com peso mínimo 0. Com λ=0,1 e referência=2026, peso mínimo 1 mantém 166 pares em Zanoli e 115 em Reimberg.
- Passe o mouse sobre uma aresta para consultar o peso. Use tamanho por Força ou Intermediação ponderada para explorar o efeito do modelo nas métricas ponderadas. A força também aparece na tabela e no painel do pesquisador.
- Ao selecionar institutos, só permanecem relações cujas duas pontas estão na seleção. Isso não inclui automaticamente parceiros externos ao recorte.
- Grau, força, intermediação, comunidade, parceiros fora do instituto e institutos do grupo são da rede completa de 2021–2025 da fórmula escolhida. Os filtros alteram a exibição, sem recalcular essas métricas.
- O rodapé da rede compara as duas fórmulas nessa rede completa: grupos que atravessam institutos e o que permanece junto quando o peso passa de Reimberg para Zanoli. O texto não desenha um segundo grafo e não muda com instituto, ano ou peso mínimo.
- Áreas e temas ainda não estão disponíveis. Na visão “Áreas e temas”, use Barras e agrupamento por Instituto para contar docentes.
- As contagens de docentes incluem os isolados; ausência de aresta nesta coleta não prova ausência de colaboração científica.

## Organização

| Pasta | Responsabilidade |
|---|---|
| `src/app/core` | Contratos dos repositórios e estrutura geral da aplicação |
| `src/app/data-access/http` | Consultas HTTP, validação dos envelopes e parâmetros compartilhados |
| `src/app/data-access` | Provedores, configurações iniciais e armazenamento local das visões |
| `src/app/data-access/mock` | Dados simulados usados nos testes; sem fallback em execução |
| `src/app/features` | Editor, listagem, visualizador, grafo e gráficos de áreas |
| `src/app/shared` | Modelos, mensagens, contexto da coleta e recursos visuais compartilhados |

Componentes usam contratos de repositório; não montam URLs nem acessam arquivos do backend.
Os repositórios HTTP consultam `/api/catalogo`, `/api/rede`, `/api/areas` e `/api/meta`.
Rede e áreas usam `agregar=true`. O backend permanece responsável por filtros, agregação e métricas.
As consultas de rede, áreas e metadados enviam `formulaPeso`; Zanoli envia também `lambdaTemporal` e `anoReferencia`.
O backend calcula redes alternativas em memória, sem alterar os JSON de referência. Reinicie a API após mudar os dados brutos/processados para renovar o cache.
Visões salvas antes da seleção de fórmula continuam usando Reimberg quando os novos campos estão ausentes.

`proxy.conf.json` encaminha `/api/**` para `http://localhost:8000` durante `npm.cmd start`.
Em produção, configure o servidor/reverse proxy para encaminhar `/api` ao backend e servir as rotas Angular com fallback para `index.html`.
O proxy de desenvolvimento não é incluído no build estático.

Cada visão salva vira um arquivo JSON em `back/dados/visoes`, com o identificador no nome do arquivo.
A pasta é criada na primeira consulta. Se ainda não houver arquivo, a API grava as duas visões iniciais.
Apagar todos os arquivos deixa a lista vazia; isso é diferente de a API estar fora do ar.
Na primeira listagem, o navegador copia as visões de `mapa-colaboracao:visoes:reais:v1` que ainda não existem em disco
e marca a cópia em `mapa-colaboracao:visoes:reais:v1:arquivos`. A chave antiga `mapa-colaboracao:visoes:v1` permanece
intacta e não é importada. Se a API falhar, a tela mostra o erro e não volta a usar o navegador como fonte.

## Verificar

```powershell
# Dentro de front/
npm.cmd test -- --watch=false
npm.cmd run build

# Dentro de back/
.\.venv\Scripts\python.exe -m pytest tests -q
```

Falha de conexão: confirme a API na porta 8000 e reinicie `npm.cmd start` após mudar o proxy.
HTTP 503: confirme os JSON em `back/dados/processados` e reconstrua o pipeline, se necessário.
A API nunca é substituída silenciosamente por dados simulados.

O guia didático está em `../docs/Guia_Integracao_Frontend.docx`.
