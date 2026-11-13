# Modelagem do grafo

## Nós e cores
- **Nó:** docente da UNIFEI, a partir da lista pública do SIGAA (549 docentes em 12 unidades).
- **Cor:** instituto do docente **segundo o SIGAA**. O campo do Lattes é texto livre e autodeclarado.
- **Fora do grafo, por ora:** coautores externos, alunos e docentes que não estão no SIGAA (aposentados,
  colaboradores). Exemplos são Bonatto, Zambroni e Tiago Filho, do ISEE.

## Arestas
Dois docentes ficam ligados se têm pelo menos uma produção em comum (hoje: publicações do OpenAlex, 2021–2025).

## Peso

$$ w_{ij} = \sum_{p \in P_{ij}} \frac{\alpha(\text{tipo}_p)}{n_p - 1} $$

- $P_{ij}$: produções em comum de *i* e *j*
- $n_p$: número **total** de autores da produção (inclui externos e alunos)
- $\alpha$: peso do tipo

| Tipo | α |
|---|---|
| Artigo em periódico | 1,0 |
| Livro | 1,0 |
| Trabalho completo em evento | 0,7 |
| Capítulo de livro | 0,7 |
| Outros (preprint, dataset…) | 0,3 |

**Por que dividir por $n_p - 1$** (Newman, 2001, *Scientific collaboration networks II*): cada autor reparte
1 unidade de colaboração entre seus $n-1$ coautores. Assim, toda produção vale o mesmo para cada autor, e
artigos com autoria massiva não dominam a rede.
- Com 2 autores, o par recebe 1.
- Com 150 autores, o par recebe ≈ 0,007.

**Exemplo:** artigo com 3 autores (0,5) + evento com 2 autores (0,7) + artigo com 150 autores (0,007)
→ $w \approx 1{,}21$. Na contagem simples, daria 3.

Classificação do tipo (OpenAlex): `article`/`review` em fonte `conference` contam como evento; nas demais
fontes, como periódico. `book` conta como livro. `book-chapter` conta como capítulo, ou como evento se a fonte
for `conference`. O resto entra em "outro".

## Métricas
| Métrica | Definição | Uso do peso |
|---|---|---|
| grau | nº de docentes com quem colabora | — |
| força | Σ dos pesos das arestas | peso direto |
| intermediacao | Brandes, normalizada [0,1] | **sem peso** (igual ao mock do front) |
| intermediacaoPonderada | Brandes, normalizada [0,1] | distância = **1/peso** |
| comunidade | Louvain (semente 42) | peso direto |

Em algoritmos de caminho (betweenness, closeness), o peso é distância, então se usa 1/w: laço forte vira
caminho curto. Em comunidades e força, usa-se w direto.

## Grafo focado em instituto
Inclui os docentes do instituto, os docentes de fora com ligação direta a eles e **todas** as arestas entre
esses nós. Cada aresta recebe uma classe:
- `foco`: as duas pontas são do instituto;
- `ponte`: uma ponta é do instituto e a outra é de fora;
- `fora`: as duas pontas são vizinhos de fora.

## Limitações atuais
1. **Casamento por nome:** pode confundir alunos homônimos de docentes. O Lattes resolve isso com IDs.
2. **Só publicações indexadas:** ficam de fora orientações, projetos, bancas e muitos eventos nacionais.
3. **Valores de α:** são escolha do grupo. A validação proposta é uma análise de sensibilidade, comparando
   rankings com contagem simples, só Newman e Newman + α.
4. **Sem decaimento temporal.** Extensão possível: $\times e^{-\lambda(\text{ano atual} - \text{ano}_p)}$.

## Próximos passos (Lattes)
- Ligar docentes pelo **ID Lattes** (o SIGAA tem o ID de 422 dos 549).
- Novas relações: `orientacao` e `projeto`, com o mesmo formato de `Relacao`.
- Áreas do conhecimento: preencher `catalogo.areas` e `areaIds`.
- Ver `../docs/lattes/` no repositório do trabalho para o esquema completo do XML.
