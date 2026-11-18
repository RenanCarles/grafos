# Base acadêmica UNIFEI — entrega 1.0.0

Preparada em **18/11/2026**, com coleta de **17/11/2026**, período **2021–2025**.
Pacote de dados para implementação pela equipe. Nenhuma integração de teste no backend ou frontend acompanha esta entrega.

**São 1.041 registros, com 594 prioritários para análise do IMC.** A entrega está pronta para versionamento; a validação acadêmica de todos os registros não está concluída. Os nomes por correspondência textual e os campi pendentes estão identificados nos dados.

## Arquivos para implementar

| Arquivo | Uso |
|---|---|
| `base_trabalhos.json` | Base principal: 1.041 registros de todas as fontes selecionadas |
| `base_prioridade_imc.json` | Subconjunto de 594 registros; não somar à base principal |
| `docentes_imc_referencia.json` | 49 docentes da lista de referência, com ID público compatível com o grafo e Lattes quando disponível; sem SIAPE |
| `schema_base.schema.json` | Contrato JSON Schema dos registros para validação |
| `contagens.json` | Totais e pendências recalculados sobre a entrega |
| `manifesto.json` | Versão, recorte, contagens e SHA-256 dos arquivos de dados/documentação |
| `consulta_base.html` | Consulta local pesquisável; abrir diretamente no navegador |
| `catalogo_tfg_bruto.json` | Campos extraídos das 659 fichas do catálogo, antes da transformação |
| `fontes_repositorio_selecionadas.json` | Campos completos dos 71 itens do repositório usados na base |
| `LEVANTAMENTO_METODOLOGIA.md` | Procedimento, fontes, consultas, decisões e limitações |

As 311 publicações OpenAlex são derivadas do arquivo `../brutos/openalex_works_unifei.json`, já existente no projeto. **Elas não são publicações adicionais a somar novamente à coleta original.** O cadastro completo de referência é `../brutos/docentes_unifei.csv`; os dados publicados neste pacote não incluem SIAPE.

## Conteúdo

| Origem | Registros | Prioridade IMC |
|---|---:|---:|
| Catálogo oficial SIGAA — TCC/TFG | 659 | 212 |
| Repositório oficial UNIFEI — dissertações/tese | 71 | 71 |
| OpenAlex — seleção da coleta existente | 311 | 311 |
| Total | 1.041 | 594 |

Após revisar a separação dos papéis nas notas, há **632 TCCs com orientador extraído**, **213 com coorientador** e **27 sem orientação recuperada**. Os dois primeiros conjuntos se sobrepõem. Há 658 registros com campus confirmado pela regra operacional e 383 com campus pendente.

## Contrato de consumo

Cada base é um array JSON em UTF-8. Identificar registros por `id`, não por título ou posição no array. O subconjunto IMC é exatamente o filtro `prioridade_imc === true` da base completa.

- `tipo`, `ano`, `titulo`, `autores`: descrição bibliográfica; os tipos originais OpenAlex estão preservados.
- `participacoes`: array de nomes e papéis (`orientador`, `coorientador`, `coautor`, `banca`). Array vazio significa participação não recuperada.
- `participacoes[].docente_imc`: associação à lista IMC ou `null`. `id_lattes` identifica correspondência de identificadores; `nome_exato` e `nome_parcial` continuam candidatos sujeitos a conferência. O nome associado permite localizar a pessoa em `docentes_imc_referencia.json`.
- `participacoes[].lattes_id`: pode existir em registros do repositório. Não confundir ID Lattes com ID público do nó.
- `prioridade_imc`: indicador de triagem por assunto/departamento/participante; **não confirma o instituto do trabalho**.
- `campus_confirmado`: confirmação segundo as evidências da coleta. Quando falso, `campus` é `null`. A afiliação de um autor ao IMC não comprova automaticamente o campus do trabalho.
- `fonte`, `url`, `coleta`: proveniência. No catálogo, a URL é a busca geral; usar também `id_titulo` e o número após `sigaa:` para localizar a ficha.
- `notas_fonte`, `assuntos_fonte`, `departamento_fonte`, `documentos`, `doi`: campos opcionais conforme a fonte. Não exigir sua presença em todos os registros.
- `pendencias`: lista explícita de condições não verificadas. Lista vazia não transforma automaticamente o registro em revisão humana concluída.
- `status_validacao`: nesta versão, `metadados_coletados; validacao_academica_pendente`.
- `versao_base`: `1.0.0`.

`null`, campo ausente e array vazio devem ser tratados na interface. URLs de documentos não tiveram seu conteúdo validado em massa; uma lista vazia de documentos não significa que não existe PDF.

## Uso no grafo

A base entrega **trabalhos e participações**, não uma lista definitiva de arestas nem pesos calculados. Os desenvolvedores devem definir e documentar a projeção:

1. Publicação compartilhada: pares de coautores identificados.
2. Orientação conjunta: orientador e coorientador identificados no mesmo trabalho.
3. Banca: depende de participantes recuperados e validados; não há participações de banca na base consolidada atual.
4. Trabalho com apenas um professor identificado: não cria automaticamente colaboração entre dois docentes.

Preservar ano, tipo de relação e IDs dos trabalhos nas arestas. Agregar por par **e tipo**, para não misturar orientação e coautoria. Não transformar correspondência parcial de nome em identificação confirmada. Não duplicar as publicações OpenAlex ao combinar esta entrega com o pipeline existente.

As fórmulas experimentadas durante os testes foram retiradas do sistema. A escolha de pesos e a política para registros pendentes devem ser implementadas explicitamente pela equipe. Não inferir projetos, iniciação científica ou bancas a partir da ausência de dados ou da coautoria.

## Limites e verificações

- Nenhuma duplicação de `id` dentro da base; deduplicação entre fontes por DOI/título ainda não concluída.
- TCC e artigo derivado podem ser eventos acadêmicos distintos; semelhança de título não basta para fundi-los.
- O recorte pretendido é Itajubá, mas há candidatos cujo campus permanece pendente. Aplicar `campus_confirmado` quando necessário.
- A consulta principal do catálogo foi pelo assunto TFG. Isso não comprova cobertura de todos os TCCs da instituição.
- A lista IMC corresponde ao cadastro existente e não reconstrói vínculos históricos dos docentes.
- HTML/XML de captura, com estado de sessão, ficam preservados em `fontes/` localmente e são ignorados pelo Git. O histórico em `arquivo_local/`, a amostra e a enumeração ampla também são locais.
- Não há credenciais de acesso necessárias para consumir os arquivos da entrega.

## Subir para o GitHub

Na raiz do repositório:

```bash
git status --short
git add back/dados/levantamento/
git diff --cached --stat
git commit -m "Adiciona base acadêmica UNIFEI com prioridade IMC"
git push
```

Revise o resumo antes do commit. As regras locais de `.gitignore` excluem as capturas e o material amplo que não participa desta entrega. O pacote não foi commitado nem enviado automaticamente.
