# Levantamento de trabalhos acadêmicos da UNIFEI: fontes e metodologia

Data da coleta e consolidação: **17 de novembro de 2026**.

Este documento descreve o levantamento efetivamente realizado, os arquivos produzidos, os critérios de seleção e as limitações da base entregue. Trata-se de uma **base preliminar de registros bibliográficos e participações acadêmicas**, ainda sujeita à validação. Os totais abaixo foram conferidos nos arquivos locais.

## 1. Objetivo e recorte

O objetivo foi recuperar TCCs, trabalhos orientados e publicações, priorizando os professores de Computação e Matemática do **Instituto de Matemática e Computação (IMC)** da UNIFEI.

- Período dos trabalhos: **2021 a 2025**, inclusive.
- Recorte institucional pretendido: **UNIFEI, campus Itajubá**.
- Prioridade de análise: IMC, incluindo possíveis vínculos de autoria, orientação e coorientação.
- Participantes externos podem ser preservados quando aparecem em um trabalho do recorte.
- O levantamento não aplicou pesos de colaboração, coeficientes por tipo de produção ou fórmulas do grafo.

**Distinção necessária:** o campus pretendido não está comprovado em todos os registros consolidados. A base inclui candidatos relacionados a docentes do IMC, especialmente nas publicações e na pós-graduação, cuja vinculação ao campus ainda deve ser conferida. Portanto, não deve ser apresentada como uma base integralmente validada de trabalhos de Itajubá.

## 2. Fontes utilizadas

| Fonte | Endereço ou arquivo | Uso |
|---|---|---|
| Catálogo público do Sistema de Bibliotecas da UNIFEI, no SIGAA | [Busca ao acervo](https://sigaa.unifei.edu.br/sigaa/public/biblioteca/buscaPublicaAcervo.jsf?aba=p-biblioteca) | Localizar TFGs, consultar fichas, recuperar autores, títulos, anos e notas de orientação |
| Repositório institucional da UNIFEI | [Página inicial](https://repositorio.unifei.edu.br/jspui/) | Recuperar metadados de trabalhos acadêmicos, especialmente dissertações e teses |
| Serviço OAI-PMH do repositório | [ListRecords em Dublin Core](https://repositorio.unifei.edu.br/oai/request?verb=ListRecords&metadataPrefix=oai_dc) | Enumerar registros em volume por paginação oficial |
| Registro completo de cada item do repositório | URL do item acrescida de `?mode=full` | Obter campos específicos de orientador, coorientador, Lattes, departamento e data do trabalho |
| Cadastro de docentes já existente no projeto | `../brutos/docentes_unifei.csv` | Selecionar docentes com `instituto_sigla = IMC` e comparar nomes/IDs Lattes |
| Publicações OpenAlex já existentes no projeto | `../brutos/openalex_works_unifei.json` | Selecionar publicações com autoria candidata de docentes do IMC |

SIGAA e repositório são fontes institucionais oficiais da UNIFEI. **OpenAlex é uma fonte bibliográfica externa**, não um cadastro oficial da universidade. Seus dados foram reaproveitados do projeto: não houve nova coleta OpenAlex nesta etapa.

O arquivo original do OpenAlex contém 4.472 publicações. O cadastro original contém 549 docentes de diferentes unidades; a comparação nesta etapa foi restrita aos 49 docentes identificados como IMC nesse cadastro. Essa lista é um retrato cadastral, não uma reconstrução dos vínculos históricos entre 2021 e 2025.

### 2.1. Páginas usadas na descoberta das fontes

- [Trabalhos defendidos de SIN/CCO/IMC](https://sites.google.com/view/tfg-sin-cco-imc-unifei/trabalhos-defendidos): indicou a busca no acervo da biblioteca.
- [Perguntas frequentes de TFG SIN/CCO/IMC](https://sites.google.com/view/tfg-sin-cco-imc-unifei/perguntas-frequentes): contexto sobre depósito de trabalhos e folhas de aprovação.
- [Biblioteca Mauá — repositório institucional](https://bim.unifei.edu.br/repositorio-institucional/): descrição institucional do acervo.
- [Monografias do curso de Engenharia Mecânica Aeronáutica no SIGAA](https://sigaa.unifei.edu.br/sigaa/public/curso/monografias.jsf?id=43969927&lc=pt_BR): teste exploratório; a consulta por 2024 não retornou resultados e não foi a fonte da coleta em volume.

Essas páginas ajudaram a localizar as fontes. A indicação de existência de um acervo não foi tratada como comprovação de cobertura completa.

## 3. Sequência do trabalho

### 3.1. Diagnóstico inicial

Foram examinados os dados existentes no projeto. A base do grafo continha docentes e coautorias, mas não havia coleta de orientações. Identificou-se que seria necessário buscar registros de trabalhos e seus participantes diretamente nas fontes acadêmicas.

### 3.2. Amostragem exploratória

Foram consultadas manualmente fichas do catálogo para verificar onde apareciam os orientadores. A primeira amostra preservada foi ampliada até 28 registros, guardados em `amostra_tfg_2021_2025.json`.

Nessa exploração foram observados:

- nomes de orientadores e coorientadores no campo **Notas Gerais**;
- trabalhos com orientação ausente na ficha, mas com indicação de documento associado;
- divergências de curso/modalidade entre **Notas Gerais** e **Assunto**;
- variações de grafia, abreviações e títulos profissionais nos nomes;
- falhas ou resultados vazios ao aplicar o intervalo de anos pela interface.

A amostra não é uma base adicional a somar ao resultado consolidado. Ela é um registro da etapa exploratória. As anotações manuais da amostra não foram integralmente incorporadas à consolidação automática.

### 3.3. Mudança para coleta em volume

Após a exploração, as consultas foram realizadas diretamente por requisições às páginas públicas e ao serviço OAI-PMH. Foram usadas sessões HTTP para conservar o estado do formulário do SIGAA. Não foi necessário login nem acesso a sistemas internos.

Os scripts de coleta e consolidação foram executados como auxiliares temporários em `/tmp`. **Não foram instalados como um coletor permanente no projeto**. Os resultados e evidências foram salvos em `back/dados/levantamento/`. Para repetir a coleta, será necessário reimplementar o procedimento descrito ou recuperar os auxiliares, se ainda existirem no ambiente; a permanência de arquivos em `/tmp` não é garantida.

## 4. Coleta do catálogo SIGAA, passo a passo

1. Abrir a busca pública ao acervo e obter o formulário e seu estado de sessão.
2. Selecionar o campo **Assunto** e pesquisar o termo **TFG**.
3. Definir **100 registros por página**, mantendo a ordenação por título.
4. Não aplicar filtro de biblioteca ou intervalo de anos no formulário na coleta final.
5. Percorrer a paginação disponibilizada pelo próprio resultado.
6. Examinar as linhas da listagem e selecionar candidatas contendo um ano de 2021 a 2025.
7. Abrir a ficha pelo comando de detalhes disponibilizado na própria linha.
8. Extrair os campos da ficha e guardar seu HTML original.
9. Confirmar o ano pelo campo **Ano Publicação** durante a consolidação.
10. Aplicar os critérios locais de campus e prioridade IMC.

### 4.1. Parâmetros e alcance

| Parâmetro | Valor efetivamente utilizado |
|---|---|
| Campo de consulta | Assunto |
| Expressão | TFG |
| Registros por página | 100 |
| Ordenação | Título |
| Filtro de biblioteca | Não aplicado na consulta em volume |
| Filtro temporal do formulário | Não aplicado |
| Recorte temporal final | Campo Ano Publicação igual a 2021, 2022, 2023, 2024 ou 2025 |
| Total informado pela consulta | 1.131 registros, de diferentes anos |
| Páginas percorridas | 12 |
| Fichas detalhadas preservadas | 659 |

O filtro por **Tipo de Material = TFG** foi testado, mas retornou apenas 19 registros, predominantemente antigos. A consulta final usou o assunto TFG. Isso mostra que o tipo de material e o assunto não são intercambiáveis neste catálogo.

A triagem inicial procura o ano no texto da linha inteira, e a validação final utiliza o campo específico da ficha. Esse procedimento não substitui uma auditoria da consistência dos anos cadastrados.

### 4.2. Campos preservados

- Registro no Sistema e identificador interno `idTitulo`;
- autor, título e subtítulo;
- ano, local da publicação e editora;
- Notas Gerais, Assunto e Autores Secundários;
- resumo, quando presente no HTML;
- links diretos `verProducao` encontrados na linha de documentos associada ao resultado.

Os links de **Endereços Externos**, que exigem outra interação, não foram resolvidos sistematicamente. Uma lista `documentos` vazia **não comprova inexistência de arquivo digital**.

### 4.3. Critério de Itajubá no catálogo

Foram mantidas fichas cujo **Local da Publicação** é exatamente `Itajubá`, excluindo aquelas com `Itabira` no campo Autores Secundários.

O campo `campus_confirmado` recebe verdadeiro quando:

- Autores Secundários contém `Campus Itajubá`; ou
- Notas Gerais contém `Instituto de Matemática e Computação`.

Dos 659 registros consolidados do catálogo, **658 satisfazem esse critério explícito**. O restante foi selecionado pelo local de publicação e permanece pendente de comprovação adicional. Local de publicação, isoladamente, não garante campus de origem do trabalho.

### 4.4. Extração das participações

As Notas Gerais foram examinadas procurando rótulos de orientador e coorientador, incluindo formas como `Orientadora`, `Orientador(a)`, `Coorientador` e `Co-orientador`. O texto original das notas permanece disponível para revisão.

**Limitação verificada:** há 627 fichas com alguma participação extraída, mas isso não significa 627 orientadores principais confirmados. Na estrutura atual há 415 TCCs com papel `orientador` e 212 com papel `coorientador`. A extração deve ser revisada contra as notas e os documentos, especialmente quando uma mesma ficha informa ambos os papéis. Essas contagens descrevem o resultado do processamento, não a distribuição real de orientações da universidade.

## 5. Coleta do repositório institucional

### 5.1. Enumeração pelo serviço oficial

Foi utilizada a requisição:

```text
GET https://repositorio.unifei.edu.br/oai/request
    ?verb=ListRecords
    &metadataPrefix=oai_dc
```

As páginas seguintes foram solicitadas usando o `resumptionToken` retornado pelo próprio serviço:

```text
GET https://repositorio.unifei.edu.br/oai/request
    ?verb=ListRecords
    &resumptionToken=<token retornado pela página anterior>
```

Foram preservadas **44 páginas XML**. O serviço indicava `completeListSize = 4345`; a extração produziu **4.331 registros com campos Dublin Core**. A diferença de 14 corresponde a entradas não materializadas como registros com esses campos pelo extrator; sua causa individual não foi auditada. Não se deve equiparar os dois totais.

Essa coleta inicial é ampla e pode incluir outros anos e unidades. Seu papel é permitir a seleção posterior.

### 5.2. Seleção temporal e enriquecimento

1. Selecionar candidatos cujo primeiro valor de `date` no Dublin Core começa por 2021–2025.
2. Recuperar a URL institucional do item no campo de identificadores.
3. Consultar essa URL acrescida de `?mode=full`.
4. Extrair os campos específicos `dc.*` da tabela completa.
5. Confirmar o ano final por `dc.date.issued`, distinguindo-o de data de depósito ou disponibilização.

Foram consultados **1.041 registros completos**, sem entradas finais marcadas com erro nessa rodada. Esse total é do repositório consultado, e não deve ser confundido com os 1.041 registros da base consolidada: a igualdade numérica é coincidência.

A triagem pelo primeiro valor genérico de `date` pode perder registros se a ordem dos campos variar. Portanto, a cobertura temporal ainda precisa de auditoria independente.

### 5.3. Campos utilizados

- `dc.title`, `dc.creator`, `dc.type`;
- `dc.date.issued`;
- `dc.publisher.department`;
- `dc.contributor.advisor1`, `advisor2` e correspondentes `Lattes`;
- `dc.contributor.advisor-co1`, `advisor-co2` e correspondentes `Lattes`;
- `dc.contributor.referee1` a `referee4`, quando presentes, para membros de banca.

Os dados completos extraídos permanecem no arquivo de origem, mesmo quando não usados na consolidação.

### 5.4. Seleção para a base consolidada

Entraram os registros que indicavam IMC no departamento ou possuíam participante associado a um docente da lista IMC, por Lattes ou por nome. O resultado foi **70 dissertações e uma tese**.

Na base atual, nenhum dos 71 registros recebeu `campus_confirmado = true`: a implementação só marca esse campo quando encontra IMC explicitamente no departamento. A seleção por vínculo de participante foi suficiente para inclusão como candidato, mas não comprova o campus do trabalho.

Embora campos de banca tenham sido procurados, **não há participações com papel banca na base consolidada atual**. Isso não significa que os trabalhos não tenham bancas.

## 6. Publicações OpenAlex reaproveitadas

Foi utilizado o arquivo bruto já existente no projeto, sem atualização da API nesta etapa.

O coletor original do projeto usa a instituição OpenAlex `I8165072` (UNIFEI), a janela `2021-2025` e solicita os campos `id`, `doi`, `title`, `type`, `publication_year`, `authorships` e `primary_location`. Esses são os parâmetros registrados no código do projeto; o levantamento atual não revalidou a execução histórica daquela coleta.

Para cada publicação:

1. Examinar autorias com afiliação UNIFEI no registro OpenAlex.
2. Comparar o nome do autor com a lista de docentes do IMC.
3. Manter a publicação quando houver ao menos um candidato identificado.
4. Preservar todos os autores, mas registrar em `participacoes` somente os candidatos IMC identificados.
5. Manter DOI, identificador OpenAlex do trabalho e identificador OpenAlex do autor, quando disponíveis.

Foram selecionadas **311 publicações**. A data original da coleta não foi confirmada e foi explicitamente distinguida da consolidação em 17/11/2026. O campus dessas publicações permanece sem confirmação direta.

## 7. Identificação de docentes e prioridade IMC

### 7.1. Lista de referência

A lista de referência foi obtida filtrando `instituto_sigla = IMC` no CSV de docentes já existente. Não houve atualização desse cadastro nesta etapa.

### 7.2. Correspondência por Lattes

Quando um registro do repositório fornece ID Lattes de 16 dígitos, ele é comparado com os IDs dos docentes do IMC. Uma igualdade gera `metodo = id_lattes` e `status = identificador confirmado`.

O total registrado é de **72 participações associadas por ID Lattes**. Não são necessariamente 72 pessoas ou 72 trabalhos distintos. Esse resultado confirma a igualdade entre os identificadores fornecidos pelas fontes, não uma auditoria completa do currículo ou do vínculo funcional histórico.

### 7.3. Correspondência por nome

Na ausência de correspondência por ID, o procedimento:

1. Tenta remover títulos profissionais no início do nome.
2. Reorganiza nomes no formato `SOBRENOME, nomes`.
3. Normaliza acentos, caixa e partículas, usando o comparador já existente no projeto.
4. Procura igualdade do nome normalizado.
5. Na falta de igualdade, aceita candidato único com mesmo primeiro nome e compatibilidade dos demais nomes/iniciais, exigindo ao menos um sobrenome por extenso.

O comparador também desconsidera certos sufixos na tentativa parcial. As correspondências ficam como `nome_exato` ou `nome_parcial`, com o status **candidato; conferir identidade**. Homônimos e abreviações continuam sendo riscos, mesmo no caso de nome normalizado exato.

### 7.4. Regra de prioridade

| Fonte | Regra aplicada |
|---|---|
| Catálogo | Assunto contendo termos de Computação, Matemática ou Sistemas de Informação, ou participação com nome candidato de docente IMC |
| Repositório | Departamento com IMC ou participante associado à lista IMC |
| OpenAlex | Ao menos uma autoria UNIFEI com nome candidato de docente IMC |

A busca textual no assunto é ampla: pode identificar o tema do trabalho, não necessariamente seu curso. **`prioridade_imc = true` significa prioridade para análise, não certificação de pertencimento ao instituto.**

## 8. Consolidação e separações

### 8.1. Identificadores

- Catálogo: `sigaa:<Registro no Sistema>`;
- repositório: URL institucional do item;
- OpenAlex: identificador do trabalho no OpenAlex.

A consolidação remove repetições por igualdade de `id`, mantendo a última ocorrência. Não foi realizada deduplicação entre fontes por título, DOI ou combinação autor/ano.

Assim, os totais representam **registros consolidados por identificador de fonte**, não necessariamente trabalhos intelectuais únicos. Um TCC e um artigo derivado podem representar eventos acadêmicos distintos e não devem ser fundidos apenas por semelhança de título.

### 8.2. Ausência de dados

Ausência de orientador, coorientador, banca, documento ou campus significa **informação não recuperada/confirmada**. Não significa inexistência da relação ou atividade.

Coautoria não foi usada como prova de orientação. Também não foram criadas relações entre professores apenas porque orientaram trabalhos em um mesmo curso.

### 8.3. Estrutura resumida dos registros

| Campo | Significado |
|---|---|
| `id` | Identificador do registro consolidado |
| `tipo`, `ano`, `titulo`, `autores` | Descrição bibliográfica |
| `participacoes` | Papéis e nomes recuperados; pode conter associação candidata ou por Lattes ao IMC |
| `prioridade_imc`, `criterio_imc` | Indicador de seleção para análise do IMC e justificativa |
| `campus`, `campus_confirmado` | Campus atribuído e condição de confirmação segundo a regra operacional |
| `fonte`, `url`, `coleta` | Origem, endereço e informação temporal da coleta/consolidação |
| `notas_fonte`, `assuntos_fonte` | Texto preservado do catálogo para auditoria |
| `documentos` | Links diretos recuperados; lista vazia não prova ausência de documento |
| `departamento_fonte` | Departamento informado no repositório |
| `doi` | DOI da publicação, quando disponível |

Os campos variam conforme a fonte. A base ainda não tem um esquema uniforme para todas as pendências. Algumas observações manuais detalhadas existem somente na amostra inicial.

## 9. Resultados conferidos

### 9.1. Por fonte

| Conteúdo | Base consolidada | Prioridade IMC |
|---|---:|---:|
| TCCs/TFGs do catálogo | 659 | 212 |
| Dissertações e tese do repositório | 71 | 71 |
| Publicações OpenAlex reaproveitadas | 311 | 311 |
| **Total** | **1.041** | **594** |

### 9.2. Por ano

| Ano | Registros |
|---|---:|
| 2021 | 196 |
| 2022 | 201 |
| 2023 | 186 |
| 2024 | 230 |
| 2025 | 228 |

### 9.3. Tipos das 311 publicações OpenAlex

| Tipo original | Quantidade |
|---|---:|
| article | 189 |
| conference-paper | 89 |
| book-chapter | 10 |
| preprint | 9 |
| review | 8 |
| editorial | 2 |
| book | 1 |
| dataset | 1 |
| conference-abstract | 1 |
| supplementary-materials | 1 |

Esses tipos foram preservados da fonte. Nem todos representam artigos revisados por pares.

### 9.4. Indicadores de qualidade e pendências

- 627 TCCs com alguma participação extraída das notas;
- 32 TCCs sem participação extraída;
- 18 dos TCCs prioritários para IMC sem participação extraída;
- 658 registros com campus confirmado pela regra operacional, todos provenientes do catálogo;
- 383 registros sem confirmação explícita de campus nessa regra;
- 42 nomes distintos da lista IMC associados a pelo menos um registro, misturando candidatos por nome e correspondências por Lattes;
- 72 participações associadas por ID Lattes no repositório;
- nenhum papel de banca presente no resultado consolidado.

Esses indicadores não são medidas de produtividade docente nem estimativas da cobertura total da UNIFEI.

## 10. Arquivos entregues

Todos os caminhos abaixo são relativos à pasta deste documento, `back/dados/levantamento/`.

| Arquivo/pasta | Conteúdo e finalidade |
|---|---|
| [base_trabalhos.json](base_trabalhos.json) | Base consolidada de 1.041 registros |
| [base_prioridade_imc.json](base_prioridade_imc.json) | Subconjunto de 594 registros; não somar ao total da base completa |
| [consulta_base.html](consulta_base.html) | Consulta local pesquisável por texto, sem alterar os JSON |
| [contagens.json](contagens.json) | Contagens produzidas pela consolidação |
| [catalogo_tfg_bruto.json](catalogo_tfg_bruto.json) | 659 fichas extraídas do catálogo, com campos originais |
| [repositorio_oai_bruto.json](repositorio_oai_bruto.json) | 4.331 registros com Dublin Core da enumeração ampla |
| [repositorio_completo_2021_2025.json](repositorio_completo_2021_2025.json) | 1.041 registros completos consultados no repositório |
| [amostra_tfg_2021_2025.json](amostra_tfg_2021_2025.json) | 28 registros da exploração manual, incluindo anotações de divergências |
| `fontes/oai_000.xml` a `fontes/oai_043.xml` | 44 respostas XML preservadas |
| `fontes/catalogo_lista_000.html` a `fontes/catalogo_lista_011.html` | 12 páginas de resultados do catálogo |
| `fontes/catalogo_<idTitulo>.html` | 659 fichas HTML preservadas |

Os arquivos chamados “brutos” em JSON são **extrações estruturadas**. Os XML e HTML preservam respostas originais; as páginas completas do repositório não foram guardadas individualmente em HTML nesta rodada, apenas seus campos extraídos.

Os PDFs dos trabalhos não foram baixados e verificados em massa. Tentativas exploratórias de abertura de alguns documentos não tiveram sucesso, e seus conteúdos não foram usados para confirmar as lacunas de orientação.

## 11. Cuidados na interpretação

1. **Busca TFG não é inventário completo da graduação.** Trabalhos catalogados somente como TCC ou sob outros assuntos podem não ter sido recuperados.
2. **Campus ainda pendente em parte da base.** Vínculo com docente IMC é uma pista, não comprovação automática do campus do trabalho.
3. **Extração de papéis requer revisão.** Conferir casos em que orientador e coorientador aparecem juntos; preservar ambos sem confundir papéis.
4. **Divergências de curso permanecem.** Foram observadas fichas que indicam Física no assunto e Engenharia Elétrica nas notas, e outras que misturam Licenciatura e Bacharelado em Matemática.
5. **Identidade por nome é provisória.** Não unir pessoas automaticamente apenas por semelhança nominal.
6. **Lista atual não representa toda a história.** Docentes aposentados, externos ou ausentes do cadastro podem ter participação legítima nos trabalhos.
7. **OpenAlex não foi atualizado.** As publicações selecionadas vêm do arquivo já existente; a cobertura e a data original ainda exigem conferência.
8. **Duplicidade entre fontes não foi resolvida.** Contagens não devem ser apresentadas como número definitivo de trabalhos únicos.
9. **Orientação não implica colaboração entre dois docentes.** O registro deve preservar trabalho e participantes antes de qualquer projeção para o grafo.
10. **Contagem de participações não é contagem de pessoas.** Um mesmo professor pode aparecer em muitos trabalhos e papéis.

## 12. Como continuar e reproduzir o levantamento

1. Preservar os arquivos de origem e fazer cópia da base antes de alterações.
2. Repetir a busca pública TFG, com 100 resultados por página, guardando estado da sessão e paginação atualizados; não reutilizar identificadores de sessão antigos.
3. Acrescentar buscas complementares por TCC e cursos de Itajubá, medindo sobreposição por Registro no Sistema.
4. Repetir a enumeração OAI-PMH seguindo os tokens devolvidos pelo servidor até o fim.
5. Auditar a seleção temporal contra `dc.date.issued`, evitando depender da ordem dos campos genéricos de data.
6. Atualizar e validar a lista de docentes do IMC e seus identificadores, preservando a versão utilizada.
7. Revisar a extração de orientador/coorientador contra as fichas originais, começando pelos 212 TCCs prioritários IMC.
8. Consultar PDFs e páginas de depósito para resolver orientação, banca, curso e campus que permanecem pendentes.
9. Identificar homônimos e abreviações, preferindo IDs Lattes/ORCID e evidência institucional.
10. Conferir duplicidades entre fontes e distinguir registros da mesma obra de publicações derivadas.
11. Recalcular as contagens e registrar alterações metodológicas antes de usar a base em análises ou no grafo.

A coleta desta rodada utilizou até cinco tentativas por consulta do catálogo, timeout de 40 segundos e espera de dois segundos entre falhas. No repositório completo, foram usadas quatro consultas simultâneas, timeout de 30 segundos e até três tentativas por item. A enumeração OAI foi sequencial, com pequena pausa entre páginas. Esses parâmetros descrevem a execução, não garantem disponibilidade futura dos serviços.

## 13. Relação com o sistema existente

A base foi adicionada como levantamento separado. Não houve substituição dos JSON processados do grafo, mudança das fórmulas de colaboração, integração automática com a API ou alteração do frontend. Não foi feito commit nesta etapa de levantamento.

A validação dos dados deve preceder sua integração pelos desenvolvedores. Este documento registra o estado atual e não declara concluída a limpeza, a cobertura institucional ou a verificação de todas as relações.


## 14. Preparação da entrega para GitHub — 18/11/2026

As integrações de teste no backend e no frontend foram descartadas a pedido do usuário. A entrega é exclusivamente de dados, documentação e consulta HTML local. O README da pasta descreve o contrato para implementação pela equipe.

A versão 1.0.0 reextrai as participações do catálogo diretamente das notas originais, corrigindo o reconhecimento dos prefixos de coorientador e das duas pessoas na mesma ficha. Os totais atuais são 632 TCCs com orientador, 213 com coorientador e 27 sem orientação recuperada. Os números de extração das seções 4.4 e 9.4 descrevem a consolidação anterior e foram substituídos por estes e por `contagens.json`. Não houve nova coleta nem mudança do total de 1.041 registros/594 prioritários IMC.

O recorte IMC foi recalculado com as participações corrigidas. Campus não confirmado passa a ser representado por `campus: null`. Foram acrescentados `pendencias`, `status_validacao` e `versao_base`. O subset IMC e a consulta HTML foram regenerados. A base anterior permanece em `arquivo_local/`, excluída do Git.

As capturas HTML/XML permanecem locais, ignoradas pelo Git por conterem estado de sessão e dados fora do pacote necessário. Os campos originais dos 71 itens do repositório usados na consolidação estão em `fontes_repositorio_selecionadas.json`; o catálogo original permanece em `catalogo_tfg_bruto.json`. A enumeração OAI ampla e o conjunto completo de 1.041 itens do repositório também ficam locais.

O arquivo `manifesto.json` registra versão, recorte e hashes SHA-256 dos arquivos entregues para conferência de integridade. O termo entrega final refere-se ao pacote preparado para os desenvolvedores, e não a uma afirmação de validação humana ou de cobertura acadêmica completa.
